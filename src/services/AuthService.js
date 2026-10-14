/** @format */

// Authentication keeps its existing data-loading path; mounting owns presentation.
function handleLoginState(token, refresh = true) {
  isLoggedIn = !!token && accountIsReady();
  window.isLoggedIn = isLoggedIn;
  if (token && refresh) loadUserData(token);
  if (!isLoggedIn && folderPanel?.parentNode) {
    folderPanel.remove();
    folderPanel = null;
    window.folderPanel = null;
  }
  mountSidebarEntry(isLoggedIn);
}
window.handleLoginState = handleLoginState;
