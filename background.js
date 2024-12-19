let openTabs = {};
let blockedTabs = new Set();
let extensionEnabled = false; // Variável para controlar o estado da extensão, desligada por padrão

chrome.storage.local.get({ extensionEnabled: false }, data => {
  extensionEnabled = data.extensionEnabled;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!extensionEnabled) return; // Verifica se a extensão está habilitada

  if (changeInfo.url) {
    let url = new URL(changeInfo.url);
    let productId = url.pathname.match(/i\.\d+\.\d+/);

    if (productId) {
      productId = productId[0];

      if (blockedTabs.has(productId)) {
        chrome.tabs.remove(tabId);
      } else if (openTabs[productId]) {
        chrome.tabs.remove(tabId);
      } else {
        openTabs[productId] = { id: tabId, url: changeInfo.url };
        chrome.storage.local.get({ history: [] }, data => {
          let history = data.history;
          history.push(changeInfo.url);
          chrome.storage.local.set({ history });
        });
      }
      chrome.storage.local.set({ openTabs });
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (!extensionEnabled) return; // Verifica se a extensão está habilitada

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
  } else if (request.action === "toggleExtension") {
    extensionEnabled = !extensionEnabled; // Alterna o estado da extensão
    chrome.storage.local.set({ extensionEnabled });
    sendResponse({ status: extensionEnabled ? "enabled" : "disabled" });
  }
});
