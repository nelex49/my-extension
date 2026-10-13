/** @format */

// Manage owns its view state; existing services continue to own folder operations.
let activeManageView = null;
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

function refreshManageView() { activeManageView?.refresh(); }
window.refreshManageView = refreshManageView;

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

function showSubfolderView() {
  if (activeManageView) { activeManageView.focus(); return; }
  if (!isLoggedIn) { chrome.runtime.sendMessage({action: "openPopup"}); return; }
  const previousFocus = document.activeElement;
  const modal = document.createElement("div");
  modal.id = "subfolder-view-modal";
  modal.innerHTML = `<section class="ysm-manage" role="dialog" aria-modal="true" aria-labelledby="ysm-title" tabindex="-1">
    <header class="ysm-header">${manageFolderIcon("ysm-main-folder", true)}
      <div><h2 id="ysm-title">Manage Subscriptions</h2><p class="ysm-total"></p></div>
      <div class="ysm-header-actions"><button type="button" data-action="menu" aria-label="More options" aria-expanded="false">•••</button>
      <button type="button" data-action="close" aria-label="Close Manage Subscriptions">✕</button>
      <div class="ysm-menu ysm-main-menu" hidden><button type="button" data-action="refresh">Refresh subscriptions</button><button disabled>Export backup</button><button disabled>Restore backup</button><p>Backup and restore coming soon.</p></div></div></header>
    <p class="ysm-load-message" role="status" hidden></p>
    <section class="ysm-parents"><div class="ysm-parent-heading"><div class="ysm-section-title">PARENT FOLDERS</div><button type="button" data-action="create-parent" class="ysm-create-parent">+ Parent Folder</button></div><div class="ysm-tabs"></div></section>
    <div class="ysm-columns"><aside class="ysm-navigation"><div class="ysm-nav-heading"><div class="ysm-nav-title">${manageFolderIcon("ysm-heading-icon", true)}<h3></h3></div>
      <div class="ysm-nav-actions"><button type="button" data-action="add" class="ysm-add">+ Subfolder</button></div></div>
      <input class="ysm-folder-search" type="search" aria-label="Find subfolder" placeholder="Find folder...">
      <div class="ysm-subfolders"></div></aside>
    <section class="ysm-content"><header class="ysm-content-heading"><div><h3 class="ysm-selected"></h3><p class="ysm-selected-count"></p></div>
      <input class="ysm-channel-search" type="search" aria-label="Search channels" placeholder="Search channels...">
      <select class="ysm-sort" aria-label="Sort channels"><option value="az">Sort: A - Z</option><option value="za">Sort: Z - A</option></select></header>
      <div class="ysm-channel-list"></div></section></div>
    <section class="ysm-move-picker" aria-label="Move channel to a folder" hidden></section>
  </section>`;
  document.body.append(modal);
  const dialog = modal.querySelector(".ysm-manage");
  let parent = null, child = null, query = "", folderQuery = "", sort = "az";
  let moveChannel = null, moveParent = null, moveSearchOpen = false, moveQuery = "";
  let visibleParentNames = [];
  let parentListScroll = 0;
  const parentTabRecency = new Map();
  let parentTabClock = 0;
  const descriptionChannels = new Set();

  function moveAnchor() {
    return Array.from(modal.querySelectorAll('[data-action="move"]')).find(button =>
      button.closest('[data-channel]')?.dataset.channel === moveChannel);
  }
  function closeMovePicker(restoreFocus = false) {
    const anchor = moveAnchor();
    moveChannel = null; moveParent = null; moveSearchOpen = false; moveQuery = "";
    modal.querySelector('.ysm-move-picker').hidden = true;
    anchor?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }
  function renderMovePicker() {
    const picker = modal.querySelector('.ysm-move-picker');
    const anchor = moveAnchor();
    if (!moveChannel || !anchor) { closeMovePicker(); return; }
    const data = window.folderData || {};
    if (moveParent !== null && !Object.hasOwn(data, moveParent)) moveParent = null;
    const names = moveParent === null ? Object.keys(data) : Object.keys(data[moveParent].subfolders || {});
    const searchFocused = document.activeElement === picker.querySelector('.ysm-move-search');
    const selection = searchFocused ? document.activeElement.selectionStart : null;
    const filtered = names.filter(name => name.toLowerCase().includes(moveQuery.trim().toLowerCase()));
    picker.hidden = false;
    picker.innerHTML = `<header><strong>${moveParent === null ? 'Choose parent folder' : 'Choose subfolder'}</strong><button type="button" data-action="move-search" aria-label="Search folders" title="Search folders" aria-expanded="${moveSearchOpen}"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg></button><button type="button" data-action="move-close" aria-label="Cancel move">✕</button></header>` +
      (moveParent === null ? '' : '<button type="button" data-action="move-back" class="ysm-move-back">← Back to parent folders</button>') +
      (moveSearchOpen ? `<input type="search" class="ysm-move-search" aria-label="${moveParent === null ? 'Search parent folders' : 'Search subfolders'}" placeholder="Search folders..." value="${manageEscape(moveQuery)}">` : '') +
      `<div class="ysm-move-list">${filtered.map(name => {
        const current = moveParent === parent && name === child;
        return moveParent === null ?
          `<button type="button" data-action="move-parent" data-move-parent="${manageEscape(name)}" title="${manageEscape(name)}">${manageFolderIcon('ysm-destination-icon')}<span>${manageEscape(name)}</span><small>›</small></button>` :
          `<button type="button" data-action="destination" data-destination-parent="${manageEscape(moveParent)}" data-destination-child="${manageEscape(name)}" title="${manageEscape(name)}" ${current ? 'disabled' : ''}>${manageFolderIcon('ysm-destination-icon')}<span>${manageEscape(name)}</span>${current ? '<small>Current</small>' : ''}</button>`;
      }).join('') || `<p class="ysm-empty">${names.length ? 'No matching folders.' : moveParent === null ? 'No parent folders yet.' : `No subfolders in ${manageEscape(moveParent)} yet. Close this picker and use + Subfolder to create one.`}</p>`}</div>`;
    const search = picker.querySelector('.ysm-move-search');
    if (search) {
      search.addEventListener('input', event => { moveQuery = event.target.value; renderMovePicker(); });
      if (searchFocused) {
        search.focus({ preventScroll: true });
        if (selection !== null && typeof search.setSelectionRange === 'function') search.setSelectionRange(selection, selection);
      }
    }
    anchor.setAttribute('aria-expanded', 'true');
    const rect = anchor.getBoundingClientRect(), bounds = picker.getBoundingClientRect();
    picker.style.left = `${Math.max(12, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - 12))}px`;
    const below = rect.bottom + 6;
    picker.style.top = `${Math.max(12, Math.min(below + bounds.height <= window.innerHeight - 12 ? below : rect.top - bounds.height - 6, window.innerHeight - bounds.height - 12))}px`;
  }
  function dismissMenus(event) {
    if (moveChannel && !event.target.closest('.ysm-move-picker') && !event.target.closest('[data-action="move"]')) closeMovePicker();
    if (!event.target.closest('.ysm-main-menu') && !event.target.closest('[data-action="menu"]')) {
      modal.querySelector('.ysm-main-menu').hidden = true;
      modal.querySelector('[data-action="menu"]').setAttribute('aria-expanded', 'false');
    }
    if (!event.target.closest('.ysm-more-parents')) {
      const more = modal.querySelector('.ysm-more-parents');
      if (more) more.open = false;
    }
  }

  function renderParentOverflow() {
    const search = modal.querySelector('.ysm-parent-search');
    const list = modal.querySelector('.ysm-parent-results');
    if (!search || !list) return;
    const needle = search.value.trim().toLowerCase();
    const data = window.folderData || {};
    list.innerHTML = Object.keys(data).filter(name => name.toLowerCase().includes(needle)).map((name, index) =>
      `<button type="button" data-parent="${manageEscape(name)}" class="ysm-tab ${name === parent ? 'is-active' : ''}" title="${manageEscape(name)}" style="--tab-colour:${sidebarFolderColour(data[name].color, index)}">${manageEscape(name)}</button>`).join('') ||
      '<p class="ysm-empty">No matching parent folders.</p>';
  }

  function close() {
    chrome.storage.onChanged.removeListener(storageChanged);
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("pointerdown", dismissMenus);
    parentTabsResize.disconnect();
    modal.remove();
    activeManageView = null;
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  function currentTitle() { return parent === null ? "Uncategorised" : child === null ? ((window.folderData?.[parent]?.subscriptions?.length || 0) ? "Parent channels" : parent) : child; }
  function render() {
    const focused = document.activeElement;
    const focusParent = focused?.dataset?.parent;
    const focusChild = focused?.dataset?.child;
    const focusAction = focused?.dataset?.action;
    const focusChannel = focused?.closest?.('[data-channel]')?.dataset.channel;
    const channelScroll = modal.querySelector('.ysm-channel-list').scrollTop;
    const data = window.folderData || {};
    if (parent !== null && !Object.hasOwn(data, parent)) { parent = null; child = null; }
    if (parent !== null && child !== null && !Object.hasOwn(data[parent].subfolders || {}, child)) child = Object.keys(data[parent].subfolders || {})[0] ?? null;
    const loadedCount = (window.userSubscriptions || []).length;
    const hasStoredChannels = Object.values(data).some(info => info.subscriptions?.length ||
      Object.values(info.subfolders || {}).some(sub => sub.subscriptions?.length));
    const loadStatus = window.subscriptionLoadStatus || { state: 'idle' };
    modal.querySelector(".ysm-total").textContent = loadStatus.state === 'loading' ?
      (loadedCount ? `${loadedCount} subscriptions · Updating...` : 'Loading subscriptions...') :
      loadStatus.state === 'ready' ? `${loadedCount} subscriptions` :
      loadedCount ? `${loadedCount} saved subscriptions` : hasStoredChannels ?
      'Subscription total unavailable' : '0 loaded subscriptions';
    const message = modal.querySelector('.ysm-load-message');
    message.hidden = loadStatus.state !== 'error';
    message.textContent = loadStatus.state === 'error' ? `${loadStatus.message} Use the menu to retry, or sign in again.` : '';
    modal.querySelector('[data-action="refresh"]').disabled = loadStatus.state === 'loading';
    const names = Object.keys(data);
    const tab = name => `<button type="button" data-parent="${manageEscape(name)}" class="ysm-tab ${name === parent ? 'is-active' : ''}" aria-pressed="${name === parent}" title="${manageEscape(name)}" style="--tab-colour:${sidebarFolderColour(data[name].color, names.indexOf(name))}">${manageEscape(name)}</button>`;
    modal.querySelector(".ysm-tabs").innerHTML = `<button type="button" data-action="uncategorised" class="ysm-tab ysm-uncategorised ${parent === null ? 'is-active' : ''}" aria-pressed="${parent === null}" title="Uncategorised">Uncategorised <span>${manageUncategorised().length}</span></button>` +
      `<div class="ysm-visible-parents">${names.map(tab).join('')}</div>` +
      `<details class="ysm-more-parents"><summary title="Search all parent folders">All Folders (${names.length}) ▾</summary><div class="ysm-menu"><input type="search" class="ysm-parent-search" aria-label="Find parent folder" placeholder="Find parent folder..."><div class="ysm-parent-results"></div></div></details>`;
    const parentSearch = modal.querySelector('.ysm-parent-search');
    if (parentSearch) {
      parentSearch.addEventListener('input', () => { parentListScroll = 0; renderParentOverflow(); });
      const parentResults = modal.querySelector('.ysm-parent-results');
      parentResults.addEventListener('scroll', () => { parentListScroll = parentResults.scrollTop; });
      const overflow = modal.querySelector('.ysm-more-parents');
      overflow.addEventListener('toggle', () => {
        if (overflow.open) parentResults.scrollTop = parentListScroll;
      });
      renderParentOverflow();
    }
    const folderHeading = modal.querySelector(".ysm-nav-heading h3");
    folderHeading.textContent = parent === null ? "Your folders" : `${parent} folders`;
    folderHeading.title = folderHeading.textContent;
    const addSubfolder = modal.querySelector('.ysm-add');
    addSubfolder.hidden = parent === null;
    addSubfolder.title = parent === null ? '' : `Create a subfolder in ${parent}`;
    const folderList = modal.querySelector('.ysm-subfolders');
    const parentColour = parent === null ? '#354454' : sidebarFolderColour(data[parent].color, names.indexOf(parent));
    folderList.style.setProperty('--subfolder-fill', lightenColor(parentColour, 8));
    folderList.style.setProperty('--subfolder-active-fill', lightenColor(parentColour, 12));
    folderList.style.setProperty('--subfolder-border', lightenColor(parentColour, 30));
    modal.querySelector('.ysm-heading-icon').style.color = lightenColor(parentColour, 30);
    addSubfolder.style.setProperty('--add-fill', parentColour);
    addSubfolder.style.setProperty('--add-border', lightenColor(parentColour, 30));
    const entries = parent === null ? [] : Object.entries(data[parent].subfolders || {});
    modal.querySelector(".ysm-subfolders").innerHTML = parent === null ?
      `<p class="ysm-empty">Select a parent folder above to browse its subfolders.</p>` :
      ((data[parent].subscriptions?.length ? `<button type="button" class="ysm-subfolder ${child === null ? 'is-active' : ''}" data-action="direct"><span>Parent channels</span><small>${data[parent].subscriptions.length}</small></button>` : "") +
      entries.filter(([name]) => name.toLowerCase().includes(folderQuery.trim().toLowerCase())).map(([name, info]) =>
        `<button type="button" class="ysm-subfolder ${child === name ? 'is-active' : ''}" data-child="${manageEscape(name)}" aria-pressed="${child === name}" title="${manageEscape(name)}">${manageFolderIcon("ysm-folder-icon")}<span>${manageEscape(name)}</span><small>${info.subscriptions?.length || 0}</small></button>`).join("") ||
      `<p class="ysm-empty">${entries.length ? 'No matching folders.' : 'No subfolders yet. Use + Subfolder to create one.'}</p>`);
    modal.querySelector(".ysm-selected").textContent = currentTitle();
    modal.querySelector(".ysm-channel-search").placeholder = `Search channels in ${currentTitle()}...`;
    const all = manageFilteredSubscriptions(parent, child, "", sort);
    const visible = manageFilteredSubscriptions(parent, child, query, sort);
    modal.querySelector(".ysm-selected-count").textContent = query.trim() ? `${visible.length} of ${all.length} subscriptions` : `${all.length} subscriptions`;
    modal.querySelector(".ysm-channel-list").innerHTML = visible.map(sub => {
      const id = manageChannelId(sub), title = manageChannelTitle(sub);
      const href = /^[A-Za-z0-9_-]+$/.test(id) ? `https://www.youtube.com/channel/${id}` : null;
      return `<article class="ysm-channel" data-channel="${manageEscape(id)}"><div class="ysm-avatar" aria-hidden="true"><span>${manageEscape(title.slice(0, 2).toUpperCase())}</span></div>
        <div class="ysm-channel-info">${href ? `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${manageEscape(title)}">${manageEscape(title)}</a>` : `<strong>${manageEscape(title)}</strong>`}<p>Subscription</p></div>
        <div class="ysm-row-actions"><button type="button" data-action="description" class="ysm-info" aria-label="Description for ${manageEscape(title)}" aria-expanded="${descriptionChannels.has(id)}" title="Show channel description">i</button><button type="button" data-action="move" class="ysm-move" ${names.length && id ? '' : 'disabled'} aria-expanded="${moveChannel === id}">Move ▾</button>
        ${parent !== null ? `<button type="button" data-action="remove" ${id ? '' : 'disabled'} title="Remove from this folder; keep YouTube subscription">Remove</button>` : ''}</div>
        ${descriptionChannels.has(id) ? `<div class="ysm-description">${manageEscape(sub.snippet?.description || 'No description available.')}</div>` : ''}</article>`;
    }).join("") || `<p class="ysm-empty">${query.trim() ? 'No matching channels.' : 'No subscriptions in this view.'}</p>`;
    // Load saved thumbnails; keep the initials underneath if a URL is absent or fails.
    const byId = new Map(visible.map(sub => [manageChannelId(sub), sub]));
    modal.querySelectorAll('.ysm-channel').forEach(row => {
      const thumb = byId.get(row.dataset.channel)?.snippet?.thumbnails;
      const source = thumb?.medium?.url || thumb?.default?.url;
      if (!source) return;
      try {
        const url = new URL(source);
        if (url.protocol !== 'https:') return;
        const image = document.createElement('img');
        image.alt = ''; image.loading = 'lazy'; image.referrerPolicy = 'no-referrer';
        image.addEventListener('error', () => image.remove(), { once: true });
        image.src = url.href;
        row.querySelector('.ysm-avatar').append(image);
      } catch { /* Invalid thumbnail: initials remain visible. */ }
    });
    renderMovePicker();
    fitParentTabs();
    parentTabsResize.disconnect();
    parentTabsResize.observe(modal.querySelector('.ysm-visible-parents'));
    modal.querySelector('.ysm-channel-list').scrollTop = channelScroll;
    if (focusAction && focusChannel) {
      Array.from(modal.querySelectorAll('button')).find(button => button.dataset.action === focusAction &&
        button.closest('[data-channel]')?.dataset.channel === focusChannel)?.focus({ preventScroll: true });
    }
    if (focusParent !== undefined || focusChild !== undefined) {
      Array.from(modal.querySelectorAll("button")).find(button =>
        focusParent !== undefined ? button.dataset.parent === focusParent : button.dataset.child === focusChild)
        ?.focus({ preventScroll: true });
    }
  }
  function fitParentTabs() {
    if (moveChannel) closeMovePicker();
    const strip = modal.querySelector('.ysm-visible-parents');
    if (!strip) return;
    const available = strip.clientWidth;
    const capacity = Math.max(0, Math.floor((available + 10) / 140));
    visibleParentNames = manageVisibleParents(Object.keys(window.folderData || {}), parent, capacity,
      visibleParentNames, parentTabRecency);
    const visible = new Set(visibleParentNames);
    const buttons = Array.from(strip.querySelectorAll('button'));
    buttons.forEach(button => { button.hidden = !visible.has(button.dataset.parent); });
    const byName = new Map(buttons.map(button => [button.dataset.parent, button]));
    visibleParentNames.forEach(name => strip.append(byName.get(name)));
  }
  function selectParent(name) {
    if (name !== null) parentTabRecency.set(name, ++parentTabClock);
    parent = name; child = name === null ? null : Object.keys(window.folderData[name].subfolders || {})[0] ?? null;
    query = ""; folderQuery = ""; moveChannel = null;
    descriptionChannels.clear();
    modal.querySelector('.ysm-channel-list').scrollTop = 0;
    modal.querySelector(".ysm-channel-search").value = "";
    modal.querySelector(".ysm-folder-search").value = "";
    render();
  }
  modal.addEventListener("click", event => {
    dismissMenus(event);
    if (event.target === modal) { close(); return; }
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    if (button.hasAttribute("data-parent")) { selectParent(button.dataset.parent); return; }
    if (button.hasAttribute("data-child")) { child = button.dataset.child; moveChannel = null; render(); return; }
    const action = button.dataset.action;
    if (action === "refresh") {
      chrome.runtime.sendMessage({ action: 'refreshSubscriptions' }).catch(() => {
        window.subscriptionLoadStatus = { state: 'error', message: 'Reload the extension and YouTube to refresh subscriptions.' };
        render();
      });
    } else if (action === "close") close();
    else if (action === "uncategorised") selectParent(null);
    else if (action === "direct") { child = null; render(); }
    else if (action === "menu") {
      const menu = modal.querySelector(".ysm-main-menu"); menu.hidden = !menu.hidden;
      button.setAttribute("aria-expanded", String(!menu.hidden));
    } else if (action === "create-parent") {
      showUnifiedFolderManager(null, "create", name => {
        if (!modal.isConnected) return;
        selectParent(name);
        modal.querySelector('.ysm-add').focus();
      });
    } else if (action === "description") {
      const id = button.closest('[data-channel]').dataset.channel;
      if (descriptionChannels.has(id)) descriptionChannels.delete(id); else descriptionChannels.add(id);
      render();
    } else if (action === "add") {
      if (parent === null) showUnifiedFolderManager(); else showCreateSubfolderModal(parent);
    } else if (action === "move") {
      const id = button.closest("[data-channel]").dataset.channel;
      if (moveChannel === id) closeMovePicker(true);
      else {
        closeMovePicker(); moveChannel = id; renderMovePicker();
        modal.querySelector('.ysm-move-list button')?.focus();
      }
    } else if (action === "move-close") closeMovePicker(true);
    else if (action === "move-search") {
      moveSearchOpen = !moveSearchOpen; moveQuery = ""; renderMovePicker();
      if (moveSearchOpen) modal.querySelector('.ysm-move-search').focus();
      else modal.querySelector('[data-action="move-search"]').focus();
    } else if (action === "move-parent") {
      moveSearchOpen = false; moveQuery = "";
      moveParent = button.dataset.moveParent; renderMovePicker();
      modal.querySelector('[data-action="move-back"]').focus();
    } else if (action === "move-back") {
      const previous = moveParent; moveSearchOpen = false; moveQuery = ""; moveParent = null; renderMovePicker();
      Array.from(modal.querySelectorAll('[data-action="move-parent"]')).find(item => item.dataset.moveParent === previous)?.focus();
    } else if (action === "destination") {
      const id = moveChannel;
      // Existing operation expects the app's lexical state to match window state.
      folderData = window.folderData; userSubscriptions = window.userSubscriptions;
      const destinationParent = button.dataset.destinationParent;
      const destinationChild = button.dataset.destinationChild;
      if (!userSubscriptions.some(sub => manageChannelId(sub) === id) ||
          !folderData[destinationParent]?.subfolders?.[destinationChild]) {
        showUserNotification("Channel data is unavailable. Refresh subscriptions and try again.", "warn");
        return;
      }
      // Existing move logic clears subfolders, but older parent-held records need clearing too.
      Object.values(folderData).forEach(info => {
        if (info.subscriptions) info.subscriptions = info.subscriptions.filter(sub => manageChannelId(sub) !== id);
      });
      addToSubfolder(id, destinationParent, destinationChild);
      moveChannel = null; render();
    } else if (action === "remove") {
      const id = button.closest("[data-channel]").dataset.channel;
      if (!confirm("Remove this channel from the folder? Your YouTube subscription will remain.")) return;
      folderData = window.folderData;
      if (child === null) {
        folderData[parent].subscriptions = (folderData[parent].subscriptions || []).filter(sub => manageChannelId(sub) !== id);
        safeSaveFolderData(folderData); refreshFolderDropdown();
      } else removeFromSubfolder(id, parent, child);
      render();
    }
  });
  modal.querySelector(".ysm-channel-search").addEventListener("input", event => { query = event.target.value; render(); });
  modal.querySelector(".ysm-folder-search").addEventListener("input", event => { folderQuery = event.target.value; render(); });
  modal.querySelector(".ysm-sort").addEventListener("change", event => { sort = event.target.value; render(); });
  function storageChanged(changes, area) {
    if (area !== "local") return;
    if (changes.accessToken && !changes.accessToken.newValue) { close(); return; }
    if (changes.folderData) { folderData = changes.folderData.newValue || {}; window.folderData = folderData; }
    if (changes.userSubscriptions) { userSubscriptions = changes.userSubscriptions.newValue || []; window.userSubscriptions = userSubscriptions; }
    if (changes.folderData || changes.userSubscriptions) render();
  }
  function keydown(event) {
    // Existing creation dialogs sit above Manage; allow them to own their keys.
    const topLevelModal = Array.from(document.body.children).some(node => node !== modal && node.style?.position === "fixed" && Number(node.style.zIndex) >= 10000);
    if (topLevelModal) return;
    if (event.key === "Escape") {
      const menu = modal.querySelector(".ysm-main-menu");
      if (!menu.hidden) { menu.hidden = true; modal.querySelector('[data-action="menu"]').setAttribute("aria-expanded", "false"); }
      else if (modal.querySelector('.ysm-more-parents')?.open) modal.querySelector('.ysm-more-parents').open = false;
      else if (moveChannel) closeMovePicker(true);
      else close();
    }
    if (event.key === "Tab") {
      const controls = Array.from(dialog.querySelectorAll('button:not([disabled]), input, select, a[href], summary')).filter(node => node.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first.focus(); }
    }
  }
  modal.querySelector(".ysm-channel-list").addEventListener("scroll", () => closeMovePicker());
  chrome.storage.onChanged.addListener(storageChanged);
  document.addEventListener("keydown", keydown);
  document.addEventListener("pointerdown", dismissMenus);
  activeManageView = { focus: () => dialog.focus(), refresh: render, close };
  const parentTabsResize = new ResizeObserver(fitParentTabs);
  render(); dialog.focus();
}
window.showSubfolderView = showSubfolderView;
