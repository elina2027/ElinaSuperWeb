document.getElementById("search").addEventListener("click", () => {
    const word1 = document.getElementById("word1").value;
    const gap = parseInt(document.getElementById("gap").value);
    const word2 = document.getElementById("word2").value;
  
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        args: [word1, gap, word2],
        func: (word1, gap, word2) => {
          window.dispatchEvent(new CustomEvent("WGS_SEARCH", {
            detail: { word1, gap, word2 }
          }));
        }
      });
    });
  });
  