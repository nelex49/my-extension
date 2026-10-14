/** @format */

// Browsing state stays local to the sidebar, separate from saved folder records.
const sidebarExpandedParents = new Set();
const sidebarExpandedSubfolders = new Set();

function toggleFolderDropdown() {
  if (!folderDropdown?.isConnected) createFolderDropdown();
  if (!folderDropdown) return;
  folderDropdown.hidden = !folderDropdown.hidden;
  document.querySelector("#yt-manage-guide-entry .ytsm-launcher")
    ?.setAttribute("aria-expanded", String(!folderDropdown.hidden));
}

function createFolderDropdown() {
  const entry = document.getElementById("yt-manage-guide-entry");
  if (!entry || entry.dataset.state !== "ready") return;
  if (folderDropdown?.isConnected) { refreshFolderDropdown(); return; }
  folderDropdown = document.createElement("section");
  folderDropdown.id = "yt-folder-dropdown";
  folderDropdown.className = "ytsm-sidebar";
  folderDropdown.setAttribute("aria-label", "Subscription folders");
  folderDropdown.hidden = true;
  entry.append(folderDropdown);
  window.folderDropdown = folderDropdown;
  refreshFolderDropdown();
}

function toggleSidebarSet(set, key) {
  if (set.has(key)) set.delete(key); else set.add(key);
  refreshFolderDropdown();
}

function refreshFolderDropdown() {
  if (!folderDropdown?.isConnected) return;
  const scrollTop = folderDropdown.scrollTop;
  const channelScroll = new Map(Array.from(folderDropdown.querySelectorAll(".ytsm-channels"),
    list => [list.dataset.scrollKey, list.scrollTop]));
  const focused = folderDropdown.contains(document.activeElement) ?
    document.activeElement.dataset.focusKey : null;
  const heading = sidebarElement("h2", "ytsm-heading", "Your folders");
  const list = sidebarElement("div", "ytsm-folders");
  const folders = Object.entries(window.folderData || {});
  if (!folders.length) list.append(sidebarElement("p", "ytsm-empty", "No folders yet."));
  const validParents = new Set(), validSubfolders = new Set();
  folders.forEach(([name, info], index) => {
    validParents.add(name);
    const colour = sidebarFolderColour(info.color, index);
    const group = sidebarElement("div", "ytsm-parent-group");
    const subfolders = Object.entries(info.subfolders || {});
    const directSubscriptions = info.subscriptions || [];
    const count = directSubscriptions.length + subfolders.reduce((sum, [,sub]) => sum + (sub.subscriptions?.length || 0), 0);
    const expanded = sidebarExpandedParents.has(name);
    const row = sidebarFolderRow(name, count, expanded, false, colour, folderTextColour(colour));
    row.dataset.focusKey = JSON.stringify([name]);
    row.addEventListener("click", () => toggleSidebarSet(sidebarExpandedParents, name));
    group.append(row);
    subfolders.forEach(([subName]) => validSubfolders.add(JSON.stringify([name, subName])));
    if (expanded) {
      const children = sidebarElement("div", "ytsm-subfolders");
      // Retain access to any older records that held channels directly on parents.
      if (directSubscriptions.length) children.append(sidebarChannelList(directSubscriptions, JSON.stringify([name])));
      if (!subfolders.length && !directSubscriptions.length)
        children.append(sidebarElement("p", "ytsm-empty", "No subfolders yet."));
      subfolders.forEach(([subName, subInfo]) => {
        const key = JSON.stringify([name, subName]);
        const open = sidebarExpandedSubfolders.has(key);
        const subGroup = sidebarElement("div", "ytsm-subfolder-group");
        const subColour = sidebarFolderColour(subInfo.color, index);
        const subRow = sidebarFolderRow(subName, subInfo.subscriptions?.length || 0, open, true, subColour, folderTextColour(subColour));
        subRow.dataset.focusKey = key;
        subRow.addEventListener("click", () => toggleSidebarSet(sidebarExpandedSubfolders, key));
        subGroup.append(subRow);
        if (open) subGroup.append(sidebarChannelList(subInfo.subscriptions || [], key));
        children.append(subGroup);
      });
      group.append(children);
    }
    list.append(group);
  });
  for (const key of sidebarExpandedParents) if (!validParents.has(key)) sidebarExpandedParents.delete(key);
  for (const key of sidebarExpandedSubfolders) if (!validSubfolders.has(key)) sidebarExpandedSubfolders.delete(key);
  const footer = sidebarElement("div", "ytsm-footer");
  const manage = sidebarElement("button", "ytsm-manage");
  const settingsIcon = sidebarElement("span", "ytsm-action-icon", "⚙");
  settingsIcon.setAttribute("aria-hidden", "true");
  manage.append(settingsIcon, sidebarElement("span", "ytsm-action-label", "Manage Subscriptions"));
  manage.type = "button";
  manage.addEventListener("click", () => window.showSubfolderView());
  // Quick creation uses the same dialog and operations as folder management.
  const create = sidebarElement("button", "ytsm-create");
  const plusIcon = sidebarElement("span", "ytsm-action-icon", "+");
  plusIcon.setAttribute("aria-hidden", "true");
  create.append(plusIcon, sidebarElement("span", "ytsm-action-label", "Create Folder"));
  create.type = "button";
  create.addEventListener("click", () => showUnifiedFolderManager());
  footer.append(manage, create);
  folderDropdown.replaceChildren(heading, list, footer);
  folderDropdown.scrollTop = scrollTop;
  folderDropdown.querySelectorAll(".ytsm-channels").forEach(channelList => {
    channelList.scrollTop = channelScroll.get(channelList.dataset.scrollKey) || 0;
  });
  if (focused) Array.from(folderDropdown.querySelectorAll("button"))
    .find(button => button.dataset.focusKey === focused)?.focus({ preventScroll: true });
}

// Compatibility entry point for existing callers. Expansion is now presentation state.
function toggleFolderExpansion(folderName) {
  toggleSidebarSet(sidebarExpandedParents, folderName);
}

Object.assign(window, { toggleFolderDropdown, createFolderDropdown, refreshFolderDropdown, toggleFolderExpansion });
