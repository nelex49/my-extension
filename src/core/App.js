/** @format */

// Main App class for YouTube Subscription Manager

// Global state variables
let folderPanel = null;
let isLoggedIn = false;
let sidebarButtonCreated = false;
let folderDropdown = null;
let userSubscriptions = [];

let folderData = {}; // Will be loaded from Chrome storage or start empty
let folderLimit = 3; // Free users can create 3 folders
let isPremium = false; // Will be determined later

function collapseAllFoldersOnLoad() {
  // Force all folders to be collapsed on page load
  let needsSave = false;
  Object.keys(folderData).forEach((folderName) => {
    if (folderData[folderName]) {
      folderData[folderName].expanded = false;
      needsSave = true;
    }
  });

  // Save changes to ensure all folders are collapsed on page load
  if (needsSave) {
    chrome.storage.local.set({ folderData: folderData }, () => {
      logStatus("All folders collapsed on page load", "info");
    });
  }
}

function initialize() {
  logStatus("Initializing extension", "info");

  // Load saved folder data from storage first
  safeLoadFolderData()
    .then((data) => {
      folderData = data;
      // Make it globally available immediately
      window.folderData = folderData;

      // Collapse all folders on page load
      collapseAllFoldersOnLoad();

      // Button text is set during creation

      // Check login status first, only create panel if logged in
      chrome.storage.local.get("accessToken", ({ accessToken }) => {
        if (accessToken) {
          // User is logged in, create sidebar button (no panel needed)

          // Delay sidebar button creation to give YouTube time to load
          setTimeout(() => {
            let sidebarButton = createSidebarButton();

            if (!sidebarButton) {
              logStatus("Failed to create button", "error");
            }
          }, 1000);

          if (folderPanel) {
            logStatus("Panel created successfully", "info");
            handleLoginState(accessToken);
          } else {
            logStatus("Failed to create panel", "error");
          }
        } else {
          // User not logged in, no button should be shown
          logStatus(
            "User not logged in, no sidebar button will be shown",
            "info"
          );

          // No panel needed when not logged in
          // No sidebar button needed when not logged in
        }
      });
    })
    .catch((error) => {
      handleError(error, "Failed to load folder data");
      folderData = {}; // Start with empty data if loading fails
    });
}

// Listen for storage changes (when user logs in/out)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "local" && changes.accessToken) {
    logStatus("Token updated, handling login state", "info");

    const newToken = changes.accessToken.newValue;
    if (newToken) {
      // User logged in, button will be created by main initialization
    }

    handleLoginState(newToken);
  }
});

// Listen for subscription updates from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "subscriptionsUpdated") {
    userSubscriptions = message.subscriptions || [];
    logStatus(`Found ${userSubscriptions.length} subscriptions`, "info");

    // Refresh dropdown if it exists
    if (folderDropdown) {
      refreshFolderDropdown();
    }
  }
});

// Extension loaded successfully

// Load subscriptions from storage on startup
chrome.storage.local.get(["userSubscriptions"], (result) => {
  if (result.userSubscriptions && result.userSubscriptions.length > 0) {
    userSubscriptions = result.userSubscriptions;
  }
});

// Initialize the extension
if (document.querySelector("#secondary")) {
  try {
    initialize();
  } catch (error) {
    handleError(error, "App Initialization");
  }
} else {
  // Wait for sidebar to appear
  setTimeout(() => {
    if (document.querySelector("#secondary") && !folderPanel) {
      try {
        initialize();
      } catch (error) {
        handleError(error, "App Retry Initialization");
      }
    }
  }, 2000);
}

// Make them globally available
window.folderPanel = folderPanel;
window.isLoggedIn = isLoggedIn;
window.sidebarButtonCreated = sidebarButtonCreated;
window.folderDropdown = folderDropdown;
window.userSubscriptions = userSubscriptions;
window.folderData = folderData;
window.folderLimit = folderLimit;
window.isPremium = isPremium;
window.initialize = initialize;
