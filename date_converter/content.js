chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "showTooltip") {
        showTooltip(request.text);
    }
});

function showTooltip(text) {
    // 1. 移除旧的
    const oldTooltip = document.getElementById('date-converter-wrapper');
    if (oldTooltip) oldTooltip.remove();

    // 2. 创建主容器
    const wrapper = document.createElement('div');
    wrapper.id = 'date-converter-wrapper';

    // 3. 设置容器样式
    Object.assign(wrapper.style, {
        position: 'fixed',
        backgroundColor: '#ffffff',
        color: '#333333',
        padding: '5px 10px',
        borderRadius: '8px',
        fontSize: '13px',
        zIndex: '2147483647', // 确保在最顶层
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        border: '1px solid #ddd',
        transition: 'opacity 0.2s'
    });

    // 4. 创建文本内容
    const textSpan = document.createElement('span');
    textSpan.innerText = text;
    textSpan.style.fontWeight = '500';

    // 5. 创建复制按钮
    const copyBtn = document.createElement('button');
    copyBtn.innerText = '复制';
    Object.assign(copyBtn.style, {
        padding: '2px 8px',
        cursor: 'pointer',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        fontSize: '11px'
    });

    // 复制逻辑
    copyBtn.onclick = () => {
        navigator.clipboard.writeText(text).then(() => {
            copyBtn.innerText = '已复制!';
            copyBtn.style.backgroundColor = '#28a745';
            setTimeout(() => wrapper.remove(), 1000);
        });
    };

    // 6. 计算位置 (光标处)
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const rect = selection.getRangeAt(0).getBoundingClientRect();
        wrapper.style.left = `${rect.left}px`;
        wrapper.style.top = `${rect.top - 45}px`;
    }

    // 组装并添加到页面
    wrapper.appendChild(textSpan);
    wrapper.appendChild(copyBtn);
    document.body.appendChild(wrapper);


    // --- 关键：位置计算逻辑 ---
    const activeEl = document.activeElement;
    let rect;

    // 如果是在输入框中
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
        // 输入框无法获取选中文本的具体坐标，我们直接取输入框整体的坐标
        rect = activeEl.getBoundingClientRect();
    } else {
        // 普通文本，获取精确的选中区域坐标
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            rect = selection.getRangeAt(0).getBoundingClientRect();
        }
    }

    if (rect) {
        // 将气泡定位在选定区域的上方中心
        const wrapperRect = wrapper.getBoundingClientRect();
        const top = rect.top - wrapperRect.height - 10;
        const left = rect.left + (rect.width / 2) - (wrapperRect.width / 2);

        wrapper.style.top = `${Math.max(10, top)}px`; // 防止超出顶部
        wrapper.style.left = `${Math.max(10, left)}px`; // 防止超出左侧
    }


    // 点击页面其他地方关闭
    const closeHandler = (e) => {
        if (!wrapper.contains(e.target)) {
            wrapper.remove();
            document.removeEventListener('mousedown', closeHandler);
        }
    };
    setTimeout(() => document.addEventListener('mousedown', closeHandler), 10);
}