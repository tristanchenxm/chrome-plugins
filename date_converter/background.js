chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "toDate",
    title: "日期格式转换",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "toDate") {
    const text = info.selectionText.trim();
    let result;
    if (/^\d+$/.test(text)) {
      const num = parseInt(text);
      date = new Date(num < 10000000000 ? num * 1000 : num);
      result = toLocalDateString(date);
    } else {
      date = new Date(text);
      result = toUnixTimestamp(date);
    }
  
    chrome.tabs.sendMessage(tab.id, {
      action: "showTooltip",
      text: result
    }).catch(err => console.log("请刷新页面后再试"));
  }
});

function toLocalDateString(date) {
  if (date.getTime()) {
    // 方案 A: 标准 ISO 字符串 (带 T 和 Z)
    // result = date.toISOString(); 

    // 方案 B: 格式化为更易读的 ISO 风格 (YYYY-MM-DD HH:mm:ss)
    const offset = date.getTimezoneOffset() * 60000; // 偏移量
    const localISOTime = (new Date(date - offset)).toISOString().slice(0, 19).replace('T', ' ');
    return localISOTime;

  } else {
    return "无效日期";
  }
}

function toUnixTimestamp(date) {
  return date.getTime();
}