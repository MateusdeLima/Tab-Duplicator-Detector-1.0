let openTabs = {};
let blockedTabs = new Set();

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    let url = new URL(changeInfo.url);
    let productId = url.pathname.match(/i\.\d+\.\d+/);

    if (productId) {
      productId = productId[0];

      // Checa se a aba está bloqueada ou se já está aberta
      if (blockedTabs.has(productId) || openTabs[productId]) {
        chrome.tabs.remove(tabId);
      } else {
        openTabs[productId] = { id: tabId, url: changeInfo.url };
        chrome.storage.local.get({ history: [] }, data => {
          let history = data.history;
          if (!history.some(entry => entry.includes(productId))) {
            history.push(changeInfo.url);
          }
          chrome.storage.local.set({ history });
        });
        chrome.storage.local.set({ openTabs });
      }
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  for (let productId in openTabs) {
    if (openTabs[productId].id === tabId) {
      blockedTabs.add(productId);
      delete openTabs[productId];
      chrome.storage.local.set({ openTabs });
      break;
    }
  }
});

function resetOpenTabs() {
  openTabs = {};
  blockedTabs.clear();
  chrome.storage.local.set({ openTabs, history: [] });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "reset") {
    resetOpenTabs();
    sendResponse({ status: "reset" });
  } else if (request.action === "getOpenTabs") {
    chrome.storage.local.get("history", data => {
      sendResponse({ history: data.history });
    });
    return true; // keep the message channel open for sendResponse
  }
});
