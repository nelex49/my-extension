/** @format */

// One mount routine for both authentication states. YouTube may replace its guide.
let sidebarGuideObserver = null;
let sidebarMountQueued = false;

function mountSidebarEntry(loggedIn = isLoggedIn) {
  const section = document.querySelector("ytd-guide-section-renderer");
  const container = section?.querySelector("#items") ||
    section?.querySelector("ytd-guide-entry-renderer")?.parentElement;
  if (!container) return null;

  let entry = document.getElementById("yt-manage-guide-entry");
  if (entry && entry.parentElement !== container) {
    closeSidebarFolderMenu();
    entry.remove();
    folderDropdown = null;
    window.folderDropdown = null;
    entry = null;
  }
  if (!loggedIn) closeSidebarFolderMenu();
  const state = loggedIn ? "ready" : "login";
  if (entry?.dataset.state === state) {
    sizeSidebarLauncher(entry, container);
    return entry;
  }

  if (!entry) {
    entry = document.createElement("div");
    entry.id = "yt-manage-guide-entry";
    container.prepend(entry);
  }
  entry.replaceChildren();
  entry.dataset.state = state;
  folderDropdown = null;
  window.folderDropdown = null;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ytsm-launcher";
  const label = loggedIn ? "Subscription Folders" : "Sign in to Organise Subs";
  button.setAttribute("aria-label", label);
  button.title = label;
  const icon = document.createElement("span");
  icon.className = loggedIn ? "ytsm-launcher-icon ytsm-launcher-folder" :
    "ytsm-launcher-icon ytsm-launcher-signin";
  icon.setAttribute("aria-hidden", "true");
  if (!loggedIn) icon.textContent = "↪";
  const text = document.createElement("span");
  text.className = "ytsm-launcher-label";
  text.textContent = label;
  button.append(icon, text);
  if (loggedIn) {
    const chevron = document.createElement('span');
    chevron.className = 'ytsm-launcher-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    button.append(chevron);
  }
  if (loggedIn) {
    button.setAttribute("aria-expanded", "false");
    button.setAttribute("aria-controls", "yt-folder-dropdown");
  }
  button.addEventListener("click", () => {
    if (entry.dataset.state === "ready") toggleFolderDropdown();
    else chrome.runtime.sendMessage({ action: "openPopup" });
  });
  entry.append(button);
  sizeSidebarLauncher(entry, container);
  window.sidebarButtonCreated = true;
  if (loggedIn) window.ViewPreferences?.restoreSidebar();
  return entry;
}

// Use the neighbouring native guide row's dimensions, with CSS fallbacks.
function sizeSidebarLauncher(entry, container) {
  const nativeRow = container.querySelector("ytd-guide-entry-renderer");
  const target = nativeRow?.querySelector("#endpoint") || nativeRow;
  const bounds = target?.getBoundingClientRect();
  if (!bounds?.width || !bounds.height) return;
  entry.style.setProperty("--launcher-width", bounds.width + "px");
  entry.style.setProperty("--launcher-height", bounds.height + "px");
}

function createSidebarButton() { return mountSidebarEntry(true); }
function createLoginPrompt() { return mountSidebarEntry(false); }

function watchSidebarGuide() {
  if (sidebarGuideObserver) return;
  sidebarGuideObserver = new MutationObserver(() => {
    if (sidebarMountQueued) return;
    sidebarMountQueued = true;
    requestAnimationFrame(() => {
      sidebarMountQueued = false;
      mountSidebarEntry();
    });
  });
  sidebarGuideObserver.observe(document.body, { childList: true, subtree: true });
  mountSidebarEntry();
}

window.createSidebarButton = createSidebarButton;
window.createLoginPrompt = createLoginPrompt;
