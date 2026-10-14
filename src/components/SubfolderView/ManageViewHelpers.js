// Read-only selectors, icons and parent-tab ordering for Manage.
const manageEscape = value => String(value ?? "").replace(/[&<>"']/g,
  char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
const manageChannelId = sub => sub.snippet?.resourceId?.channelId || sub.channelId || "";
const manageChannelTitle = sub => sub.snippet?.title || "Unknown channel";

function manageUncategorised() {
  const assigned = new Set();
  Object.values(window.folderData || {}).forEach(parent => {
    (parent.subscriptions || []).forEach(sub => assigned.add(manageChannelId(sub)));
    Object.values(parent.subfolders || {}).forEach(folder =>
      (folder.subscriptions || []).forEach(sub => assigned.add(manageChannelId(sub))));
  });
  return (window.userSubscriptions || []).filter(sub => !assigned.has(manageChannelId(sub)));
}

function manageFilteredSubscriptions(parent, child, query, sort) {
  const info = parent === null ? null : window.folderData?.[parent];
  const subscriptions = parent === null ? manageUncategorised() : child === null ?
    (info?.subscriptions || []) : (info?.subfolders?.[child]?.subscriptions || []);
  const needle = query.trim().toLowerCase();
  const current = new Map((window.userSubscriptions || []).map(sub => [manageChannelId(sub), sub]));
  return subscriptions.map(sub => current.get(manageChannelId(sub)) || sub)
    .filter(sub => manageChannelTitle(sub).toLowerCase().includes(needle))
    .slice().sort((a, b) => manageChannelTitle(a).localeCompare(manageChannelTitle(b)) * (sort === "za" ? -1 : 1));
}

function manageFolderIcon(className, solid = false) {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="${solid ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z"/></svg>`;
}

// Preserve visible slots; only replace a tab for a hidden selection or reduced capacity.
function manageVisibleParents(names, selected, capacity, previous = [], recency = new Map()) {
  const limit = Math.max(0, capacity);
  const visible = previous.filter(name => names.includes(name));
  const leastUsedIndex = () => visible.reduce((best, name, index) => {
    if (name === selected) return best;
    if (best === -1 || (recency.get(name) || 0) < (recency.get(visible[best]) || 0)) return index;
    return best;
  }, -1);
  while (visible.length > limit) {
    const index = leastUsedIndex();
    visible.splice(index === -1 ? visible.length - 1 : index, 1);
  }
  for (const name of names) {
    if (visible.length >= limit) break;
    if (!visible.includes(name)) visible.push(name);
  }
  if (limit > 0 && selected !== null && names.includes(selected) && !visible.includes(selected)) {
    if (visible.length < limit) visible.push(selected);
    else visible[leastUsedIndex()] = selected;
  }
  return visible;
}

