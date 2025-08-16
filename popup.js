document.addEventListener("DOMContentLoaded", () => {
    const annotateButton = document.getElementById("startAnnotating");
    const shareButton = document.getElementById("share");
    const statusDiv = document.getElementById("status");
  
    annotateButton.addEventListener("click", async () => {
      // Get the active tab
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
      if (!tab || !tab.url.includes("open.spotify.com/playlist")) {
        statusDiv.textContent = "Please open a Spotify playlist first.";
        return;
      }
  
      // Send message to content script
      chrome.tabs.sendMessage(tab.id, { type: "START_ANNOTATION_MODE" }, (response) => {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = "Error: Could not communicate with content script.";
          return;
        }
  
        if (response?.success) {
          statusDiv.textContent = "Annotation mode activated!";
        } else {
          statusDiv.textContent = "Failed to activate annotation mode.";
        }
      });
    });
    shareButton.addEventListener("click", async () => {
        // Get the active tab
        let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
        if (!tab || !tab.url.includes("open.spotify.com/playlist")) {
            statusDiv.textContent = "Please open a Spotify playlist first.";
            return;
        }
        // Get the annotations
        chrome.tabs.sendMessage(tab.id, { type: "GET_ANNOTATIONS" }, (response) => {
            if (chrome.runtime.lastError) {
              statusDiv.textContent = "Error: Could not retrieve annotations.";
              return;
            }
            // encode the annotations 
            const json = JSON.stringify(response);
            const encoded = btoa(unescape(encodeURIComponent(json)));

            // append annotations to active tab URL
            const link = `${tab.url}#annot=${encoded}`;

            // copy the URL to clipboard
            navigator.clipboard.writeText(link).then(() => {
                alert("Shareable link copied to clipboard!");
              }).catch((err) => {
                console.error("Failed to copy link:", err);
              });
          });
    });
  });
  