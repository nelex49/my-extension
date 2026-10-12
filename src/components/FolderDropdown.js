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

const SIDEBAR_FOLDER_PALETTE = [
  "#44345d", "#53303d", "#243f59", "#24494e", "#3b414c", "#354454", "#51303f"
];

// Suggest the first unused palette colour, then the least-used colour.
function nextFolderColour() {
  const counts = new Map(SIDEBAR_FOLDER_PALETTE.map(colour => [colour, 0]));
  Object.values(window.folderData || {}).forEach((folder, index) => {
    const colour = sidebarFolderColour(folder.color, index);
    if (counts.has(colour)) counts.set(colour, counts.get(colour) + 1);
  });
  return SIDEBAR_FOLDER_PALETTE.reduce((best, colour) =>
    counts.get(colour) < counts.get(best) ? colour : best, SIDEBAR_FOLDER_PALETTE[0]);
}

// Translate saved colours into a restrained display palette; never change storage.
function sidebarFolderColour(hex, index) {
  const palette = SIDEBAR_FOLDER_PALETTE;
  const saved = (hex || "").toLowerCase();
  if (palette.includes(saved)) return saved;
  if (!/^#[0-9a-f]{6}$/i.test(hex || "")) return palette[index % palette.length];
  const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(...rgb), min = Math.min(...rgb), delta = max - min;
  if (delta < .08) return "#3b414c";
  let hue = max === rgb[0] ? ((rgb[1] - rgb[2]) / delta) % 6 :
    max === rgb[1] ? (rgb[2] - rgb[0]) / delta + 2 : (rgb[0] - rgb[1]) / delta + 4;
  hue = (hue * 60 + 360) % 360;
  if (hue < 35 || hue >= 330) return "#53303d";
  if (hue < 80) return "#51462e";
  if (hue < 165) return "#304a3b";
  if (hue < 200) return "#24494e";
  if (hue < 255) return "#243f59";
  return "#44345d";
}

function sidebarElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function sidebarFolderRow(name, count, expanded, subfolder, colour) {
  const row = sidebarElement("button", subfolder ? "ytsm-folder ytsm-subfolder" : "ytsm-folder");
  row.type = "button";
  row.style.setProperty("--folder-color", colour);
  row.title = name;
  row.setAttribute("aria-expanded", String(expanded));
  const arrow = sidebarElement("span", "ytsm-arrow", expanded ? "▾" : "▸");
  arrow.setAttribute("aria-hidden", "true");
  const icon = sidebarElement("span", "ytsm-folder-icon");
  icon.setAttribute("aria-hidden", "true");
  row.append(arrow, icon, sidebarElement("span", "ytsm-folder-name", name),
    sidebarElement("span", "ytsm-count", String(count)));
  return row;
}

function sidebarChannelList(subscriptions, key) {
  const list = sidebarElement("div", "ytsm-channels");
  list.dataset.scrollKey = key;
  list.setAttribute("role", "region");
  list.setAttribute("aria-label", "Channels");
  list.tabIndex = 0;
  if (!subscriptions.length) list.append(sidebarElement("p", "ytsm-empty", "No channels yet."));
  subscriptions.forEach(sub => {
    const channelId = sub.snippet?.resourceId?.channelId;
    const title = sub.snippet?.title || "Unknown channel";
    const valid = typeof channelId === "string" && /^[A-Za-z0-9_-]+$/.test(channelId);
    const channel = sidebarElement(valid ? "a" : "span", "ytsm-channel");
    if (valid) {
      channel.href = "https://www.youtube.com/channel/" + channelId;
      channel.target = "_blank";
      channel.rel = "noopener noreferrer";
    }
    channel.title = title;
    const play = sidebarElement("span", "ytsm-play", "▶");
    play.setAttribute("aria-hidden", "true");
    channel.append(play, sidebarElement("span", "ytsm-channel-name", title));
    list.append(channel);
  });
  return list;
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
    const row = sidebarFolderRow(name, count, expanded, false, colour);
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
        const subRow = sidebarFolderRow(subName, subInfo.subscriptions?.length || 0, open, true, colour);
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

// Shared by the existing folder editors; retain until those editors are replaced.
function lightenColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}


Object.assign(window, { toggleFolderDropdown, createFolderDropdown,
  refreshFolderDropdown, toggleFolderExpansion, lightenColor });
