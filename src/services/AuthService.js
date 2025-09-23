/** @format */

// Authentication service for YouTube Subscription Manager

function handleLoginState(token) {
  console.log(
    "🔄 handleLoginState called with token:",
    token ? "exists" : "none"
  );
  isLoggedIn = !!token;

  if (isLoggedIn) {
    loadUserData(token);

    // User logged in - create sidebar button if it doesn't exist
    const existingButton = document.querySelector("#yt-manage-guide-entry");
    if (!existingButton) {
      console.log("🔄 User logged in, creating sidebar button...");
      // Reset the button creation flag to allow creation
      sidebarButtonCreated = false;

      // Delay button creation to give YouTube time to load
      setTimeout(() => {
        let sidebarButton = createSidebarButton();
        if (sidebarButton) {
          console.log("✅ Sidebar button created on login");
        } else {
          console.error("❌ Failed to create sidebar button on login");
        }
      }, 1000);
    }
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
    sidebarButtonCreated = false;

    // Removed cleanup for unused button types
  }
}

// Make them globally available
window.handleLoginState = handleLoginState;
