(() => {
    const HASH_PATTERN = /(?<!\d)-?\d{15,20}(?!\d)/g;
    const PROCESSED_ATTR = 'data-sql-mapped';
    const cache = new Map();
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'SVG']);

    function fetchOriginalSql(hash) {
        if (cache.has(hash)) return cache.get(hash);

        const promise = new Promise((resolve) => {
            chrome.runtime.sendMessage({ type: 'fetchSql', hash }, (resp) => {
                if (chrome.runtime.lastError || !resp || !resp.success) {
                    resolve(null);
                    return;
                }
                resolve(resp.data?.original_sql ?? null);
            });
        });

        cache.set(hash, promise);
        return promise;
    }

    function collectTextNodes(root) {
        const nodes = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
            acceptNode(node) {
                const el = node.parentElement;
                if (!el || SKIP_TAGS.has(el.tagName) || el.closest(`[${PROCESSED_ATTR}]`)) {
                    return NodeFilter.FILTER_REJECT;
                }
                HASH_PATTERN.lastIndex = 0;
                return HASH_PATTERN.test(node.textContent)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            }
        });
        while (walker.nextNode()) nodes.push(walker.currentNode);
        return nodes;
    }

    async function processTextNode(textNode) {
        const text = textNode.textContent;
        const parent = textNode.parentNode;
        if (!parent) return;

        HASH_PATTERN.lastIndex = 0;
        const matches = [...text.matchAll(HASH_PATTERN)];
        if (matches.length === 0) return;

        const fragment = document.createDocumentFragment();
        let lastIndex = 0;

        for (const match of matches) {
            const hash = match[0];
            const start = match.index;

            if (start > lastIndex) {
                fragment.appendChild(document.createTextNode(text.slice(lastIndex, start)));
            }

            const span = document.createElement('span');
            span.setAttribute(PROCESSED_ATTR, 'true');
            span.textContent = hash;
            span.title = `Loading SQL for ${hash}...`;
            span.style.cssText = 'cursor:pointer; transition:color .2s';
            fragment.appendChild(span);

            fetchOriginalSql(hash).then((sql) => {
                if (sql) {
                    span.textContent = sql;
                    span.title = `hash: ${hash}`;
                    span.style.color = '#1976D2';
                    span.style.cursor = 'help';
                }
                else {
                    span.title = hash;
                }
            });

            lastIndex = start + hash.length;
        }

        if (lastIndex < text.length) {
            fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
        }

        parent.replaceChild(fragment, textNode);
    }

    function processSubtree(root) {
        if (!root || root.nodeType === Node.TEXT_NODE) {
            if (root && root.nodeType === Node.TEXT_NODE) processTextNode(root);
            return;
        }
        collectTextNodes(root).forEach(processTextNode);
    }

    let pending = false;
    const queue = [];

    function scheduleProcess(nodes) {
        queue.push(...nodes);
        if (pending) return;
        pending = true;
        requestAnimationFrame(() => {
            const batch = queue.splice(0);
            batch.forEach(processSubtree);
            pending = false;
        });
    }

    processSubtree(document.body);

    const observer = new MutationObserver((mutations) => {
        const targets = [];
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute(PROCESSED_ATTR)) {
                    targets.push(node);
                } else if (node.nodeType === Node.TEXT_NODE) {
                    const el = node.parentElement;
                    if (el && !el.hasAttribute(PROCESSED_ATTR)) {
                        HASH_PATTERN.lastIndex = 0;
                        if (HASH_PATTERN.test(node.textContent)) targets.push(node);
                    }
                }
            }
        }
        if (targets.length) scheduleProcess(targets);
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
