/** @format */

// Authentication service for YouTube Subscription Manager

function handleLoginState(token) {
  isLoggedIn = !!token;

  if (isLoggedIn) {
    loadUserData(token);

    // User logged in - button creation is handled by App.js
  } else {
    // User logged out - remove the panel and sidebar button
    if (folderPanel && folderPanel.parentNode) {
      folderPanel.parentNode.removeChild(folderPanel);
      folderPanel = null;
    }

    const sidebarButton = document.querySelector("#yt-manage-button");
    if (sidebarButton && sidebarButton.parentNode) {
      sidebarButton.parentNode.removeChild(sidebarButton);
    }

    // Remove new guide entry button with fade-out animation
    const guideEntryButton = document.querySelector("#yt-manage-guide-entry");
    if (guideEntryButton && guideEntryButton.parentNode) {
      // Add fade-out animation
      guideEntryButton.style.transition = "opacity 0.3s ease-out";
      guideEntryButton.style.opacity = "0";

      // Remove button after fade completes
      setTimeout(() => {
        if (guideEntryButton && guideEntryButton.parentNode) {
          guideEntryButton.parentNode.removeChild(guideEntryButton);
        }
      }, 300);
    }

    // Reset the button creation flag
    window.sidebarButtonCreated = false;

    // Show login prompt when user logs out (after fade-out completes)
    setTimeout(() => {
      logStatus("Attempting to create login prompt after logout", "info");
      if (typeof window.createLoginPrompt === "function") {
        let loginPrompt = window.createLoginPrompt();
        if (loginPrompt) {
          logStatus("Login prompt shown after logout", "info");
        } else {
          logStatus("Failed to create login prompt after logout", "error");
        }
      } else {
        logStatus("createLoginPrompt function not available", "error");
      }
    }, 400);

    // Removed cleanup for unused button types
  }
}

// Make them globally available
window.handleLoginState = handleLoginState;
