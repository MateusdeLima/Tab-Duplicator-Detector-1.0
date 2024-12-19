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

document.addEventListener("DOMContentLoaded", displayOpenTabs);