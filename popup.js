document.getElementById("reset").addEventListener("click", () => {
  const resetButton = document.getElementById("reset");
  resetButton.disabled = true;
  resetButton.textContent = "Resetting...";

  chrome.runtime.sendMessage({ action: "reset" }, response => {
    if (response.status === "reset") {
      setTimeout(() => {
        resetButton.disabled = false;
        resetButton.textContent = "Reset Open Tabs";
        displayOpenTabs();
      }, 2000);
    }
  });
});

document.getElementById("toggleExtension").addEventListener("change", (event) => {
  const isChecked = event.target.checked;
  chrome.runtime.sendMessage({ action: "toggleExtension" }, response => {
    console.log(`Extension is now ${response.status}`);
  });
});

function displayOpenTabs() {
  chrome.runtime.sendMessage({ action: "getOpenTabs" }, response => {
    const openTabsList = document.getElementById("openTabsList");
    openTabsList.value = "";

    if (response.history) {
      response.history.forEach(url => {
        openTabsList.value += url + "\n";
      });
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  displayOpenTabs();

  // Atualiza o estado do interruptor com base no estado da extensão
  chrome.storage.local.get({ extensionEnabled: false }, data => {
    document.getElementById("toggleExtension").checked = data.extensionEnabled;
  });
});
