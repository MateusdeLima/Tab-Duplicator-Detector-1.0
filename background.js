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
        let reducedUrl = `https://shopee.com.br/product-${productId}`;
        openTabs[productId] = { id: tabId, url: reducedUrl };
        chrome.storage.local.get({ history: "" }, data => {
          let history = data.history;
          history += reducedUrl + "\n";
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
  chrome.storage.local.set({ openTabs, history: "" });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "reset") {
    resetOpenTabs();
    sendResponse({ status: "reset" });
  } else if (request.action === "getOpenTabs") {
    chrome.storage.local.get("history", data => {
      sendResponse({ history: data.history.split("\n") });
    });
    return true; // keep the message channel open for sendResponse
  } else if (request.action === "toggleExtension") {
    extensionEnabled = !extensionEnabled; // Alterna o estado da extensão
    chrome.storage.local.set({ extensionEnabled });
    sendResponse({ status: extensionEnabled ? "enabled" : "disabled" });
  } else if (request.action === "showHistory") {
    chrome.storage.local.get("history", data => {
      let history = data.history.split("\n").join("\n");
      alert(`Histórico de URLs:\n${history}`);
      sendResponse({ status: "historyShown" });
    });
    return true; // keep the message channel open for sendResponse
  }
});
