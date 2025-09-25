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

    // Remove new guide entry button
    const guideEntryButton = document.querySelector("#yt-manage-guide-entry");
    if (guideEntryButton && guideEntryButton.parentNode) {
      guideEntryButton.parentNode.removeChild(guideEntryButton);
    }

    // Reset the button creation flag
    window.sidebarButtonCreated = false;

    // Removed cleanup for unused button types
  }
}

// Make them globally available
window.handleLoginState = handleLoginState;
