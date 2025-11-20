/** @format */

// SubfolderViewPanel component
// Creates the SubfolderView modal panel for organizing subscriptions
// Uses SubfolderViewHelpers, SubfolderViewHTML, and SubfolderViewEvents modules

function showSubfolderView() {
  // Check if userSubscriptions is available globally
  const subscriptions =
    window.userSubscriptions ||
    (typeof userSubscriptions !== "undefined" ? userSubscriptions : []);

  // Try to load subscriptions from storage if they're not loaded
  if (subscriptions.length === 0) {
    chrome.storage.local.get(["userSubscriptions"], (result) => {
      if (result.userSubscriptions && result.userSubscriptions.length > 0) {
        window.userSubscriptions = result.userSubscriptions;
        if (typeof userSubscriptions !== "undefined") {
          userSubscriptions = result.userSubscriptions;
        }
        showSubfolderView();
        return;
      } else {
        if (typeof window.showLoginPrompt === "function") {
          window.showLoginPrompt();
        }
        return;
      }
    });
    return;
  }

  // Remove any existing modals first
  const existingModal = document.querySelector("#subfolder-view-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Load current folder data
  const currentFolderData = window.folderData || {};
  const folderNames = Object.keys(currentFolderData);

  // Start with Uncategorized view by default
  let selectedParentFolder = "Uncategorized";
  let selectedSubfolder = "Uncategorized";

  // Get uncategorized subscriptions once and cache
  const uncategorizedSubs = window.getUncategorizedSubscriptions
    ? window.getUncategorizedSubscriptions()
    : [];
  const uncategorizedCount = uncategorizedSubs.length;
  let currentSubscriptions = uncategorizedSubs;
  let totalSubs = currentSubscriptions.length;
  let activeSubs = totalSubs; // Placeholder - TODO: Calculate from subscription activity
  let inactiveSubs = 0; // Placeholder - TODO: Calculate from subscription activity
  let totalSubscribers = totalSubs * 1000000; // Placeholder - TODO: Sum actual subscriber counts

  // Generate HTML using helper functions
  const parentFolderTabsHTML = window.generateParentFolderTabsHTML
    ? window.generateParentFolderTabsHTML(
        currentFolderData,
        selectedParentFolder
      )
    : "";

  const subfolderOptionsHTML = window.generateSubfolderOptionsHTML
    ? window.generateSubfolderOptionsHTML(
        currentFolderData,
        selectedParentFolder,
        selectedSubfolder,
        uncategorizedCount
      )
    : "";

  const subscriptionsListHTML = window.generateSubscriptionsListHTML
    ? window.generateSubscriptionsListHTML(
        currentSubscriptions,
        selectedParentFolder
      )
    : "";

  // Create modal
  const modal = document.createElement("div");
  modal.id = "subfolder-view-modal";

  // Generate and set modal HTML
  const modalHTML = window.generateModalHTML
    ? window.generateModalHTML({
        parentFolderTabsHTML,
        subfolderOptionsHTML,
        subscriptionsListHTML,
        selectedParentFolder,
        selectedSubfolder,
        totalSubs,
        activeSubs,
        inactiveSubs,
        totalSubscribers,
      })
    : "";

  modal.innerHTML = modalHTML;
  document.body.appendChild(modal);

  // Initialize components
  if (typeof window.initializeParentFolderTabs === "function") {
    window.initializeParentFolderTabs();
  }
  if (typeof window.initializeSearch === "function") {
    window.initializeSearch();
  }

  // Setup event handlers
  const updateSubfolderView = window.createUpdateSubfolderViewFunction
    ? window.createUpdateSubfolderViewFunction(modal)
    : function () {};

  if (typeof window.setupSubfolderViewEvents === "function") {
    window.setupSubfolderViewEvents(modal, updateSubfolderView);
  }
}

// Make function globally available
window.showSubfolderView = showSubfolderView;
