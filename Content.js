let annotations = {}; // { trackId: "message" }
let lastShownTrackKey = null;

checkForAnnotationInURL();

// Listen for popup message
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "START_ANNOTATION_MODE") {
    enableAnnotationUI();
    sendResponse({ success: true });
  }
});
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === "GET_ANNOTATIONS") {
      sendResponse({ annotations });
    }
});

setInterval(() => {
    const trackInfo = getCurrentTrackInfoFromDOM();
    if (!trackInfo) return;
  
    const trackKey = `${trackInfo.title} - ${trackInfo.artist}`;
    if (trackKey === lastShownTrackKey) return; // already shown
  
    chrome.storage.local.get(["sharedAnnotations"], (result) => {
      const allAnnotations = {
        ...(result.sharedAnnotations?.annotations ?? {}),
      };
  
      if (allAnnotations[trackKey]) {
        lastShownTrackKey = trackKey;
  
        // Show the annotation
        showAnnotation(allAnnotations[trackKey]);
      } else {
        const existing = document.getElementById("spotify-annotation");
        if (existing) existing.remove();
      }
    });
}, 3000); 

function showAnnotation(message) {
    const existing = document.getElementById("spotify-annotation");
    if (existing) existing.remove();
  
    const annotation = document.createElement("div");
    annotation.id = "spotify-annotation";
    annotation.textContent = message;
    Object.assign(annotation.style, {
      position: "fixed",
      bottom: "30px",
      left: "30px",
      background: "#1DB954",
      color: "white",
      padding: "12px 18px",
      borderRadius: "8px",
      zIndex: 10000,
      boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
      fontSize: "20px",
    });
  
    document.body.appendChild(annotation);
}
  
// Adds the floating annotation button to the page
function enableAnnotationUI() {
  if (document.getElementById("annotate-btn")) return; 

  const button = document.createElement("button");
  button.id = "annotate-btn";
  button.textContent = "📝 Annotate Song";
  Object.assign(button.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    zIndex: 10000,
    padding: "10px 15px",
    backgroundColor: "#1DB954",
    color: "#fff",
    border: "none",
    borderRadius: "20px",
    fontSize: "14px",
    cursor: "pointer",
    boxShadow: "0 2px 6px rgba(0,0,0,0.3)"
  });

  document.body.appendChild(button);

  button.addEventListener("click", () => {
    const trackInfo = getCurrentTrackInfoFromDOM();

    if (!trackInfo) {
      alert("Could not detect the current track.");
      return;
    }
    const key = `${trackInfo.title} - ${trackInfo.artist}`;
    const message = prompt(`Add annotation for "${trackInfo.title}" by "${trackInfo.artist}":`);
  
    if (message && message.trim()) {
      annotations[key] = message.trim();
      alert("Annotation saved!");
    }
  });
  
    console.log("Current Annotations:", annotations);
}

function getCurrentTrackInfoFromDOM() {
    const nowPlaying = document.querySelector('div[data-testid="now-playing-widget"]');
    if (!nowPlaying) return null;
  
    const label = nowPlaying.getAttribute("aria-label");
    // Example: "Now playing: On Your Side by The Last Dinner Party"
    const match = label?.match(/^Now playing: (.+) by (.+)$/);
    if (!match) return null;

    const [, title, artist] = match;
    return { title: title.trim(), artist: artist.trim() };
  }

function checkForAnnotationInURL() {
    const hash = window.location.hash;

    if (hash.startsWith("#annot=")) {
        try {
        const encoded = hash.slice(7); // remove "#annot="
        const jsonStr = decodeURIComponent(escape(atob(encoded))); // decode base64
        const parsedAnnotations = JSON.parse(jsonStr);

        console.log("Received annotations from URL:", parsedAnnotations);

        chrome.storage.local.set({ sharedAnnotations: parsedAnnotations }, () => {
            console.log("Annotations saved to storage.");
        });

        // Remove the annotation part from the URL (preserves back/forward functionality)
        const cleanURL = window.location.href.split("#")[0];
        window.history.replaceState({}, document.title, cleanURL);

        } catch (err) {
        console.error("Failed to decode annotation data:", err);
        }
    }
}
 
  