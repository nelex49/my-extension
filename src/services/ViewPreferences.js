// Interface preferences are independent of folder records, backups and entitlements.
const ViewPreferences = (() => {
  const key = 'subscriptionViewPreferences';
  let restoring = false;
  let owner = null, ready = false, value = empty(), queue = Promise.resolve();
  function empty() { return { sidebarOpen: false, parents: [], children: [], parent: null, child: null }; }
  function clean(input) {
    const source = input && typeof input === 'object' ? input : {};
    return { sidebarOpen: source.sidebarOpen === true,
      parents: Array.isArray(source.parents) ? [...new Set(source.parents.filter(x => typeof x === 'string'))] : [],
      children: Array.isArray(source.children) ? [...new Set(source.children.filter(x => {
        try { const pair = JSON.parse(x); return Array.isArray(pair) && pair.length === 2 && pair.every(y => typeof y === 'string'); } catch (_) { return false; }
      }))] : [],
      parent: typeof source.parent === 'string' ? source.parent : null,
      child: typeof source.parent === 'string' && typeof source.child === 'string' ? source.child : null };
  }
  async function initialize(accountId) {
    ready = false;
    owner = accountId || null;
    try {
      const data = await chrome.storage.local.get(key), saved = data[key];
      value = saved?.version === 1 && saved.owner === owner ? clean(saved.view) : empty();
    } catch (_) { value = empty(); }
    ready = true;
  }
  function read() { return clean(value); }
  function update(patch) {
    if (!ready || !owner || !window.accountIsReady?.()) return;
    const next = clean({ ...value, ...patch });
    if (JSON.stringify(next) === JSON.stringify(value)) return;
    value = next;
    const record = { version: 1, owner, view: read() };
    // Serialize writes so rapid clicks cannot persist an older snapshot last.
    queue = queue.then(() => chrome.storage.local.set({ [key]: record })).catch(() => {
      console.warn('Could not save interface preferences; folder data was not changed.');
    });
  }
  function sidebar(open, parents, children) { if (restoring) return; update({ sidebarOpen: open, parents: [...parents], children: [...children] }); }
  function restoreSidebar() {
    if (!ready || !window.accountIsReady?.()) return;
    const saved = read();
    sidebarExpandedParents.clear(); sidebarExpandedSubfolders.clear();
    saved.parents.forEach(name => sidebarExpandedParents.add(name));
    saved.children.forEach(name => sidebarExpandedSubfolders.add(name));
    restoring = true;
    try { createFolderDropdown(); } finally { restoring = false; }
    if (folderDropdown) {
      folderDropdown.hidden = !saved.sidebarOpen;
      document.querySelector('#yt-manage-guide-entry .ytsm-launcher')?.setAttribute('aria-expanded', String(saved.sidebarOpen));
      sidebar(saved.sidebarOpen, sidebarExpandedParents, sidebarExpandedSubfolders);
    }
  }
  return Object.freeze({ key, initialize, read, update, sidebar, restoreSidebar, flush: () => queue });
})();
window.ViewPreferences = ViewPreferences;
