/** @format */

// Keep existing global entry points while one controller owns startup and state.
let folderPanel = null;
let isLoggedIn = false;
let sidebarButtonCreated = false;
let folderDropdown = null;
let userSubscriptions = [];
let folderData = {};
let appInitialization = null;
let activeAccountSession = null;
window.accountStatus = {state:'verifying'};
function accountIsReady() { return !!activeAccountSession && window.accountStatus?.state === 'ready' && window.accountStatus.session === activeAccountSession && !!window.folderOwner?.id && window.folderOwner.id === window.accountStatus.account?.id; }
window.accountIsReady = accountIsReady;

function syncSubscriptions(subscriptions) {
  userSubscriptions = subscriptions || [];
  window.userSubscriptions = userSubscriptions;
  if (typeof window.refreshManageView === "function") window.refreshManageView();
}

function initialize() {
  if (appInitialization) return appInitialization;
  appInitialization = AccountSetupMigration.ensure().then(data => {
    window.accountSetupData = data[AccountSetupStore.key];
    FolderPlan.applyStorage(data);
    activeAccountSession = data.accessToken || null;
    window.accountStatus = data.accountStatus || {state:'verifying'};
    window.folderOwner = data.folderOwner || null;
    folderData = data.folderData || {};
    window.folderData = folderData;
    syncSubscriptions(data.userSubscriptions);
    handleLoginState(data.accessToken);
    watchSidebarGuide();
    window.appInitialized = true;
  });
  return appInitialization;
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== "local") return;
  if (changes[AccountSetupStore.key]) window.accountSetupData = changes[AccountSetupStore.key].newValue;
  if (changes[FolderPlan.developmentKey]) FolderPlan.applyStorage({ [FolderPlan.developmentKey]: changes[FolderPlan.developmentKey].newValue });
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
  if (changes.accountStatus) window.accountStatus = changes.accountStatus.newValue || {state:'signedOut'};
  if (changes.folderOwner) window.folderOwner = changes.folderOwner.newValue || null;
  if (changes.accessToken) activeAccountSession = changes.accessToken.newValue || null;
  if (changes.accountStatus || changes.accessToken) {
    // A routine refresh re-verifies the same session before fetching subscriptions.
    // Keep its existing view mounted; accountIsReady still blocks writes meanwhile.
    const recheckingCurrentSession = !changes.accessToken && !!activeAccountSession &&
      window.accountStatus?.state === 'verifying' && window.accountStatus.session === activeAccountSession;
    if (!recheckingCurrentSession) {
      if (!accountIsReady()) activeManageView?.close();
      handleLoginState(activeAccountSession, !!changes.accessToken);
    }
  }
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "subscriptionsUpdated") {
    syncSubscriptions(message.subscriptions);
    refreshFolderDropdown();
  }
});

Object.assign(window, { folderPanel, isLoggedIn, sidebarButtonCreated,
  folderDropdown, userSubscriptions, folderData, initialize });
