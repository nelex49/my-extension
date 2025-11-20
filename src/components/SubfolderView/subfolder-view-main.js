/** @format */

// Main initialization module for SubfolderView
// Initializes all components when DOM is ready

function initializeSubfolderView() {
  // Initialize parent folder tabs
  if (typeof window.initializeParentFolderTabs === "function") {
    window.initializeParentFolderTabs();
  }

  // Initialize search functionality
  if (typeof window.initializeSearch === "function") {
    window.initializeSearch();
  }
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initializeSubfolderView);
} else {
  initializeSubfolderView();
}
