let openTabs = {};
let blockedTabs = new Set();
let extensionEnabled = false; // Variável para controlar o estado da extensão, desligada por padrão

// Recupera o estado da extensão e os dados armazenados ao iniciar
chrome.storage.local.get({ extensionEnabled: false, openTabs: {}, history: "" }, data => {
  extensionEnabled = data.extensionEnabled;
  openTabs = data.openTabs;
  // Converte o histórico armazenado em string para um array, se necessário
  let storedHistory = data.history;
  if (typeof storedHistory === "string") {
    storedHistory = storedHistory.split("\n").filter(url => url !== "");
  }
  chrome.storage.local.set({ history: storedHistory.join("\n") });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!extensionEnabled || !changeInfo.url) return; // Verifica se a extensão está habilitada e se há URL

  let url = new URL(changeInfo.url);
  if (!url.hostname.includes('shopee.com.br')) return; // Verifica se a URL é do Shopee

  let productId = url.pathname.match(/i\.\d+\.\d+/);

  if (productId) {
    productId = productId[0];
    let reducedUrl = `https://shopee.com.br/product-${productId}`;

    chrome.storage.local.get({ history: "" }, data => {
      let history = data.history.split("\n").filter(url => url !== "");

      if (blockedTabs.has(productId) || openTabs[productId]) {
        chrome.tabs.remove(tabId);
      } else {
        openTabs[productId] = { id: tabId, url: reducedUrl };
        if (!history.includes(reducedUrl)) {
          history.push(reducedUrl);
          chrome.storage.local.set({ history: history.join("\n"), openTabs });
        }
      }
    });
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
