/** @format */

// Authentication keeps its existing data-loading path; mounting owns presentation.
function handleLoginState(token) {
  isLoggedIn = !!token;
  window.isLoggedIn = isLoggedIn;
  if (isLoggedIn) loadUserData(token);
  else if (folderPanel?.parentNode) {
    folderPanel.remove();
    folderPanel = null;
    window.folderPanel = null;
  }
  mountSidebarEntry(isLoggedIn);
}
window.handleLoginState = handleLoginState;
