/** @format */

// Keep existing global entry points while one controller owns startup and state.
let folderPanel = null;
let isLoggedIn = false;
let sidebarButtonCreated = false;
let folderDropdown = null;
let userSubscriptions = [];
let folderData = {};
let appInitialization = null;

function syncSubscriptions(subscriptions) {
  userSubscriptions = subscriptions || [];
  window.userSubscriptions = userSubscriptions;
  if (typeof window.refreshManageView === "function") window.refreshManageView();
}

function initialize() {
  if (appInitialization) return appInitialization;
  appInitialization = new Promise((resolve) => {
    chrome.storage.local.get(["folderData", "userSubscriptions", "accessToken"], (data) => {
      folderData = data.folderData || {};
      window.folderData = folderData;
      syncSubscriptions(data.userSubscriptions);
      handleLoginState(data.accessToken);
      watchSidebarGuide();
      window.appInitialized = true;
      resolve();
    });
  });
  return appInitialization;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== "local") return;
  if (changes.folderData) {
    folderData = changes.folderData.newValue || {};
    window.folderData = folderData;
    refreshFolderDropdown();
  }
  if (changes.userSubscriptions) syncSubscriptions(changes.userSubscriptions.newValue);
  if (changes.subscriptionLoadStatus) {
    window.subscriptionLoadStatus = changes.subscriptionLoadStatus.newValue || { state: 'idle' };
    if (typeof window.refreshManageView === "function") window.refreshManageView();
  }
  if (changes.accessToken) handleLoginState(changes.accessToken.newValue);
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "subscriptionsUpdated") {
    syncSubscriptions(message.subscriptions);
    refreshFolderDropdown();
  }
});

Object.assign(window, { folderPanel, isLoggedIn, sidebarButtonCreated,
  folderDropdown, userSubscriptions, folderData, initialize });
