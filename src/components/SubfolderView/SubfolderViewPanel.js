/** @format */

// Manage owns its view state; existing services continue to own folder operations.
let activeManageView = null;
function refreshManageView() { activeManageView?.refresh(); }
window.refreshManageView = refreshManageView;

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
    <section class="ysm-parents"><div class="ysm-parent-heading"><button type="button" data-action="uncategorised" class="ysm-tab ysm-uncategorised" aria-pressed="false" title="View unassigned subscriptions"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v12h-5l-2 3h-2l-2-3H4z"/></svg>Uncategorised <span></span></button><div class="ysm-parent-heading-actions"><div class="ysm-all-folders-slot"></div><button type="button" data-action="create-parent" class="ysm-create-parent"><span class="ysm-add-plus" aria-hidden="true">+</span> Add Folder</button></div></div><div class="ysm-tabs"><button type="button" class="ysm-parent-arrow" data-action="parent-prev" aria-label="Previous parent folder" disabled>‹</button><div class="ysm-visible-parents"></div><button type="button" class="ysm-parent-arrow" data-action="parent-next" aria-label="Next parent folder" disabled>›</button></div></section>
    <div class="ysm-columns"><aside class="ysm-navigation"><div class="ysm-nav-heading"><div class="ysm-nav-title">${manageFolderIcon("ysm-heading-icon", true)}<h3></h3></div>
      <div class="ysm-nav-actions"><button type="button" data-action="add" class="ysm-add"><span class="ysm-subfolder-plus" aria-hidden="true">+</span> Add Subfolder</button></div></div>
      <input class="ysm-folder-search" type="search" aria-label="Find subfolder" placeholder="Find folder...">
      <div class="ysm-subfolders"></div></aside>
    <section class="ysm-content"><header class="ysm-content-heading"><div><h3 class="ysm-selected"></h3><p class="ysm-selected-count"></p></div>
      <input class="ysm-channel-search" type="search" aria-label="Search channels" placeholder="Search channels...">
      <select class="ysm-sort" aria-label="Sort channels"><option value="az">Sort: A - Z</option><option value="za">Sort: Z - A</option></select></header>
      <div class="ysm-channel-list"></div></section></div>
    <section class="ysm-move-picker" aria-label="Move channel to a folder" hidden></section>
    <section class="ysm-channel-menu" aria-label="Channel options" hidden></section>
  </section>`;
  document.body.append(modal);
  const dialog = modal.querySelector(".ysm-manage");
  let parent = null, child = null, query = "", folderQuery = "", sort = "az";
  let moveChannel = null, moveParent = null, moveQuery = "", movePosition = null;
  let parentListScroll = 0;
  const previousRenameHandler = window.prepareManageParentRename;
  window.prepareManageParentRename = (oldName, newName) => {
    if (parent === oldName) parent = newName;
  };
  const descriptionChannels = new Set();
  let optionsChannel = null;
  function closeChannelMenu(restoreFocus = false) {
    const anchor = Array.from(modal.querySelectorAll('[data-action="channel-options"]')).find(button => button.closest('[data-channel]')?.dataset.channel === optionsChannel);
    optionsChannel = null;
    modal.querySelector('.ysm-channel-menu').hidden = true;
    anchor?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }
  function showChannelMenu(button) {
    const id = button.closest('[data-channel]')?.dataset.channel;
    if (!id) return;
    if (optionsChannel === id) { closeChannelMenu(true); return; }
    closeChannelMenu(); closeMovePicker();
    optionsChannel = id;
    const menu = modal.querySelector('.ysm-channel-menu');
    const channel = (window.userSubscriptions || []).find(sub => manageChannelId(sub) === id);
    const href = /^[A-Za-z0-9_-]+$/.test(id) ? `https://www.youtube.com/channel/${id}` : null;
    menu.innerHTML = `<button type="button" data-action="channel-open" ${href ? '' : 'disabled'}>↗ &nbsp; Open on YouTube</button><div class="ysm-channel-menu-divider"></div><button type="button" disabled title="Unsubscribe will be available in a future update">Unsubscribe <small>Coming soon</small></button>`;
    menu.hidden = false;
    button.setAttribute('aria-expanded', 'true');
    const rect = button.getBoundingClientRect();
    const bounds = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(12, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - 12))}px`;
    menu.style.top = `${Math.max(12, Math.min(rect.bottom + bounds.height + 6 <= window.innerHeight - 12 ? rect.bottom + 6 : rect.top - bounds.height - 6, window.innerHeight - bounds.height - 12))}px`;
  }

  function moveAnchor() {
    return Array.from(modal.querySelectorAll('[data-action="move"]')).find(button =>
      button.closest('[data-channel]')?.dataset.channel === moveChannel);
  }
  function closeMovePicker(restoreFocus = false) {
    const anchor = moveAnchor();
    moveChannel = null; moveParent = null; moveQuery = ""; movePosition = null;
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
    picker.innerHTML = `<header><strong>${moveParent === null ? 'Choose parent folder' : 'Choose subfolder'}</strong><button type="button" data-action="move-close" aria-label="Cancel move">✕</button></header>` +
      (moveParent === null ? '' : '<button type="button" data-action="move-back" class="ysm-move-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h13"/></svg><span>Back to parent folders</span></button>') +
      `<div class="ysm-move-search-field"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" class="ysm-move-search" aria-label="${moveParent === null ? 'Search parent folders' : 'Search subfolders'}" placeholder="${moveParent === null ? 'Search folders...' : 'Search subfolders...'}" value="${manageEscape(moveQuery)}"><button type="button" class="ysm-move-clear" data-action="move-clear" aria-label="Clear folder search" title="Clear search" ${moveQuery ? '' : 'hidden'}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>` +
      (moveParent === null ? '' : '<div class="ysm-move-divider" aria-hidden="true"></div>') +
      `<div class="ysm-move-list">${filtered.map(name => {
        const current = moveParent === parent && name === child;
        const folder = moveParent === null ? data[name] : data[moveParent].subfolders[name];
        const savedColour = folder.color || (moveParent === null ? '' : data[moveParent].color);
        // Raise lightness and saturation for outlines without changing saved colours.
        let iconColour = '#aebbc8';
        if (/^#[0-9a-f]{6}$/i.test(savedColour || '')) {
          const rgb = [1, 3, 5].map(offset => parseInt(savedColour.slice(offset, offset + 2), 16));
          const low = Math.min(...rgb), range = Math.max(...rgb) - low;
          iconColour = '#' + rgb.map(value => Math.round(range < 12 ? 190 : 100 + (value - low) / range * 130)
            .toString(16).padStart(2, '0')).join('');
        }
        return moveParent === null ?
          `<button type="button" data-action="move-parent" data-move-parent="${manageEscape(name)}" title="${manageEscape(name)}" style="--destination-colour: ${iconColour}">${manageFolderIcon('ysm-destination-icon')}<span>${manageEscape(name)}</span><small>›</small></button>` :
          `<button type="button" data-action="destination" data-destination-parent="${manageEscape(moveParent)}" data-destination-child="${manageEscape(name)}" title="${manageEscape(name)}" style="--destination-colour: ${iconColour}" ${current ? 'disabled' : ''}>${manageFolderIcon('ysm-destination-icon')}<span>${manageEscape(name)}</span>${current ? '<small>Current</small>' : ''}</button>`;
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
    const list = picker.querySelector('.ysm-move-list');
    const gutter = Math.max(0, (list.offsetWidth || list.clientWidth) - list.clientWidth);
    picker.style.setProperty('--move-gutter', `${gutter}px`);
    if (!movePosition) {
      const rect = anchor.getBoundingClientRect(), bounds = picker.getBoundingClientRect();
      const below = rect.bottom + 6;
      movePosition = {
        left: Math.max(12, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - 12)),
        top: Math.max(12, Math.min(below + bounds.height <= window.innerHeight - 12 ? below : rect.top - bounds.height - 6, window.innerHeight - bounds.height - 12))
      };
    }
    picker.style.left = `${movePosition.left}px`;
    picker.style.top = `${movePosition.top}px`;
    picker.style.maxHeight = `${Math.max(0, window.innerHeight - movePosition.top - 12)}px`;

  }
  function dismissMenus(event) {
    if (optionsChannel && !event.target.closest('.ysm-channel-menu') && !event.target.closest('[data-action="channel-options"]')) closeChannelMenu();
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
      `<div class="ysm-parent-item ysm-parent-overflow-item"><button type="button" data-parent="${manageEscape(name)}" class="ysm-tab ${name === parent ? 'is-active' : ''}" title="${manageEscape(name)}" style="--tab-colour:${sidebarFolderColour(data[name].color, index)};color:${folderTextColour(data[name].color)}">${manageEscape(name)}</button><button type="button" class="ysm-folder-more" data-action="edit-parent" data-edit-parent="${manageEscape(name)}" aria-label="Edit ${manageEscape(name)}">•••</button></div>`).join('') ||
      '<p class="ysm-empty">No matching parent folders.</p>';
  }

  function close() {
    chrome.storage.onChanged.removeListener(storageChanged);
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("pointerdown", dismissMenus);
    stopArrowHold();
    document.removeEventListener("pointerup", stopArrowHold);
    parentTabsResize.disconnect();
    window.prepareManageParentRename = previousRenameHandler;
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
    const tab = name => `<div class="ysm-parent-item" data-parent-item="${manageEscape(name)}"><button type="button" data-parent="${manageEscape(name)}" class="ysm-tab ${name === parent ? 'is-active' : ''}" aria-pressed="${name === parent}" title="${manageEscape(name)}" style="--tab-colour:${sidebarFolderColour(data[name].color, names.indexOf(name))};color:${folderTextColour(data[name].color)}">${manageEscape(name)}</button><button type="button" class="ysm-folder-more" data-action="edit-parent" data-edit-parent="${manageEscape(name)}" aria-label="Edit ${manageEscape(name)}">•••</button></div>`;
    const uncategorisedButton = modal.querySelector(".ysm-uncategorised");
    uncategorisedButton.classList.toggle("is-active", parent === null);
    uncategorisedButton.setAttribute("aria-pressed", String(parent === null));
    uncategorisedButton.querySelector("span").textContent = manageUncategorised().length;
    const previousStripScroll = modal.querySelector(".ysm-visible-parents")?.scrollLeft || 0;
    modal.querySelector(".ysm-visible-parents").innerHTML = names.map(tab).join('');
    modal.querySelector(".ysm-all-folders-slot").innerHTML = `<details class="ysm-more-parents"><summary title="Search all parent folders">All Folders (${names.length}) ▾</summary><div class="ysm-menu"><input type="search" class="ysm-parent-search" aria-label="Find parent folder" placeholder="Find parent folder..."><div class="ysm-parent-results"></div></div></details>`;
    modal.querySelector(".ysm-visible-parents").scrollLeft = previousStripScroll;
    updateParentArrows();
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
      entries.filter(([name]) => name.toLowerCase().includes(folderQuery.trim().toLowerCase())).map(([name, info], index) => {
        const colour = sidebarFolderColour(info.color, index), text = folderTextColour(colour);
        return `<div class="ysm-subfolder-item"><button type="button" class="ysm-subfolder ${child === name ? 'is-active' : ''}" data-child="${manageEscape(name)}" aria-pressed="${child === name}" title="${manageEscape(name)}" style="--subfolder-fill:${colour};--subfolder-border:${lightenColor(colour,30)};--subfolder-text:${text}">${manageFolderIcon("ysm-folder-icon")}<span>${manageEscape(name)}</span><small>${info.subscriptions?.length || 0}</small></button><button type="button" class="ysm-folder-more" data-action="edit-subfolder" data-edit-child="${manageEscape(name)}" aria-label="Edit ${manageEscape(name)}">•••</button></div>`;
      }).join("") ||
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
        ${parent !== null ? `<button type="button" data-action="remove" class="ysm-remove" ${id ? '' : 'disabled'} title="Remove from this folder; keep YouTube subscription"><span aria-hidden="true">×</span> Remove</button>` : ''}<button type="button" data-action="channel-options" class="ysm-channel-options" aria-label="More options for ${manageEscape(title)}" aria-haspopup="true" aria-expanded="${optionsChannel === id}">•••</button></div>
        ${descriptionChannels.has(id) ? `<div class="ysm-description">${manageEscape(sub.snippet?.description || 'No description available.')}</div>` : ''}</article>`;
    }).join("") || `<p class="ysm-empty">${query.trim() ? 'No matching channels.' : 'No subscriptions in this view.'}</p>`;
    closeChannelMenu();
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
    stopArrowHold();
    document.removeEventListener("pointerup", stopArrowHold);
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
  function updateParentArrows() {
    const strip = modal.querySelector('.ysm-visible-parents');
    if (!strip) return;
    const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
    modal.querySelector('[data-action="parent-prev"]').disabled = strip.scrollLeft <= 1;
    modal.querySelector('[data-action="parent-next"]').disabled = strip.scrollLeft >= max - 1;
  }
  function stepParent(direction) {
    if (arrowHold.suppressClick) return;
    const strip = modal.querySelector('.ysm-visible-parents');
    const items = Array.from(strip.querySelectorAll('.ysm-parent-item'));
    const current = strip.scrollLeft;
    const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
    // Use strip-relative coordinates. offsetLeft is relative to an offsetParent,
    // which can be the outer modal rather than the scrolling strip.
    const stripRect = strip.getBoundingClientRect();
    const bounds = items.map(item => {
      const rect = item.getBoundingClientRect();
      const left = rect.left - stripRect.left + current;
      return { left, right: left + rect.width };
    });
    let destination;
    if (direction > 0) {
      const next = bounds.find(item => item.right > current + strip.clientWidth + 1);
      destination = next ? next.right - strip.clientWidth : max;
    } else {
      const previous = bounds.slice().reverse().find(item => item.left < current - 1);
      destination = previous ? previous.left : 0;
    }
    strip.scrollTo({ left: Math.max(0, Math.min(max, destination)), behavior: 'smooth' });
  }
  // A short press advances one folder. Holding an arrow starts continuous
  // scrolling, accelerates gently, and stops on release or at either end.
  const arrowHold = { timer: null, interval: null, started: false, suppressClick: false };
  function stopArrowHold() {
    if (arrowHold.timer !== null) clearTimeout(arrowHold.timer);
    if (arrowHold.interval !== null) clearInterval(arrowHold.interval);
    arrowHold.timer = null; arrowHold.interval = null;
  }
  function startArrowHold(event) {
    const direction = event.currentTarget.dataset.action === 'parent-prev' ? -1 : 1;
    stopArrowHold(); arrowHold.started = false; arrowHold.suppressClick = false;
    arrowHold.timer = setTimeout(() => {
      arrowHold.started = true; arrowHold.suppressClick = true;
      const strip = modal.querySelector('.ysm-visible-parents');
      const startedAt = Date.now();
      arrowHold.interval = setInterval(() => {
        const max = Math.max(0, strip.scrollWidth - strip.clientWidth);
        const amount = Math.min(28, 7 + (Date.now() - startedAt) / 120);
        strip.scrollLeft = Math.max(0, Math.min(max, strip.scrollLeft + direction * amount));
        updateParentArrows();
        if ((direction < 0 && strip.scrollLeft <= 1) || (direction > 0 && strip.scrollLeft >= max - 1)) stopArrowHold();
      }, 25);
    }, 350);
  }
  for (const arrow of modal.querySelectorAll('.ysm-parent-arrow')) {
    arrow.addEventListener('pointerdown', startArrowHold);
    arrow.addEventListener('pointerup', stopArrowHold);
    arrow.addEventListener('pointercancel', stopArrowHold);
    arrow.addEventListener('lostpointercapture', stopArrowHold);
    arrow.addEventListener('click', event => {
      if (arrowHold.suppressClick) { event.stopPropagation(); arrowHold.suppressClick = false; }
    }, true);
  }
  document.addEventListener('pointerup', stopArrowHold);
  function fitParentTabs() {
    // Every parent stays in the strip. Horizontal scrolling replaces hidden-tab eviction.
    const strip = modal.querySelector('.ysm-visible-parents');
    if (!strip) return;
    strip.querySelectorAll('.ysm-parent-item').forEach(item => { item.hidden = false; });
    updateParentArrows();
  }
  function selectParent(name) {
    parent = name; child = name === null ? null : Object.keys(window.folderData[name].subfolders || {})[0] ?? null;
    query = ""; folderQuery = ""; moveChannel = null;
    descriptionChannels.clear();
    modal.querySelector('.ysm-channel-list').scrollTop = 0;
    modal.querySelector(".ysm-channel-search").value = "";
    modal.querySelector(".ysm-folder-search").value = "";
    render();
    modal.querySelector('.ysm-visible-parents .ysm-tab.is-active')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
  modal.addEventListener("click", event => {
    dismissMenus(event);
    if (event.target === modal) { close(); return; }
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "edit-parent") {
      event.stopPropagation?.();
      const oldName = button.dataset.editParent;
      showUnifiedFolderManager(oldName, "edit", newName => { if (parent === oldName) parent = newName; render(); modal.querySelector('.ysm-visible-parents .ysm-tab.is-active')?.scrollIntoView?.({block:'nearest',inline:'nearest'}); }, button, () => { if (parent === oldName) { parent = null; child = null; } render(); });
      return;
    }
    if (action === "edit-subfolder") {
      event.stopPropagation?.();
      const oldName = button.dataset.editChild;
      showCreateSubfolderModal(parent, oldName, button, newName => { if (child === oldName) child = newName; render(); }, () => { if (child === oldName) child = Object.keys(window.folderData?.[parent]?.subfolders || {})[0] ?? null; render(); });
      return;
    }
    if (button.hasAttribute("data-parent")) { selectParent(button.dataset.parent); return; }
    if (button.hasAttribute("data-child")) { child = button.dataset.child; moveChannel = null; render(); return; }
    if (action === "refresh") {
      chrome.runtime.sendMessage({ action: 'refreshSubscriptions' }).catch(() => {
        window.subscriptionLoadStatus = { state: 'error', message: 'Reload the extension and YouTube to refresh subscriptions.' };
        render();
      });
    } else if (action === "close") close();
    else if (action === "uncategorised") selectParent(null);
    else if (action === "parent-prev") stepParent(-1);
    else if (action === "parent-next") stepParent(1);
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
    } else if (action === "channel-options") {
      showChannelMenu(button);
    } else if (action === "channel-open") {
      const id = optionsChannel;
      closeChannelMenu();
      if (id && /^[A-Za-z0-9_-]+$/.test(id)) window.open(`https://www.youtube.com/channel/${id}`, '_blank', 'noopener,noreferrer');
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
    else if (action === "move-clear") {
      moveQuery = ""; renderMovePicker();
      modal.querySelector('.ysm-move-search').focus({ preventScroll: true });
    } else if (action === "move-parent") {
      moveQuery = "";
      moveParent = button.dataset.moveParent; renderMovePicker();
      modal.querySelector('[data-action="move-back"]').focus();
    } else if (action === "move-back") {
      const previous = moveParent; moveQuery = ""; moveParent = null; renderMovePicker();
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
    const topLevelModal = Array.from(document.body.children).some(node => node !== modal && (node.classList.contains("ytsm-folder-dialog") || (node.style?.position === "fixed" && Number(node.style.zIndex) >= 10000)));
    if (topLevelModal) return;
    if (event.key === "Escape") {
      if (optionsChannel) { closeChannelMenu(true); return; }
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
  modal.querySelector(".ysm-channel-list").addEventListener("scroll", () => { closeMovePicker(); closeChannelMenu(); });
  chrome.storage.onChanged.addListener(storageChanged);
  document.addEventListener("keydown", keydown);
  document.addEventListener("pointerdown", dismissMenus);
  activeManageView = { focus: () => dialog.focus(), refresh: render, close };
  modal.querySelector(".ysm-visible-parents").addEventListener("scroll", updateParentArrows);
  const parentTabsResize = new ResizeObserver(fitParentTabs);
  render(); dialog.focus();
}
window.showSubfolderView = showSubfolderView;
