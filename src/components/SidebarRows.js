// DOM builders for sidebar folder rows and channel lists.
function sidebarElement(tag, className, text) {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

function sidebarFolderRow(name, expanded, subfolder, colour, textColour = "#ffffff", iconId = 'folder') {
  const row = sidebarElement("button", subfolder ? "ytsm-folder ytsm-subfolder" : "ytsm-folder");
  row.type = "button";
  row.style.setProperty("--folder-color", colour);
  row.style.setProperty("--folder-text", textColour);
  row.style.setProperty("--folder-icon-colour", folderIconColour(colour));
  row.title = name;
  row.setAttribute("aria-expanded", String(expanded));
  const arrow = sidebarElement("span", "ytsm-arrow", expanded ? "▾" : "▸");
  arrow.setAttribute("aria-hidden", "true");
  const icon = sidebarElement("span", "ytsm-folder-icon");
  icon.setAttribute("aria-hidden", "true");
  if (FolderIcons.normalise(iconId) !== 'folder') {
    icon.classList.add('ytsm-custom-folder-icon'); icon.innerHTML = FolderIcons.svg(iconId);
  }
  row.append(arrow, icon, sidebarElement("span", "ytsm-folder-name", name));
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

