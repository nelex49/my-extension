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
  modal.innerHTML = manageLayoutHTML();
  document.body.append(modal);
  const dialog = modal.querySelector(".ysm-manage");
  const state = createManageState();
  const previousChildRenameHandler = window.prepareManageSubfolderRename;
  window.prepareManageSubfolderRename = (parentName, oldName, newName) => {
    if (state.parent === parentName && state.child === oldName) state.child = newName;
  };
  const previousRenameHandler = window.prepareManageParentRename;
  window.prepareManageParentRename = (oldName, newName) => {
    if (state.parent === oldName) state.parent = newName;
  };
  const { closeMovePicker, renderMovePicker } = createMovePicker({ modal, state });
  const { closeChannelMenu, showChannelMenu } = createChannelOptionsMenu({ modal, state, closeMovePicker });
  const parents = createParentFolderNavigation({ modal, state });
  const subfolders = createSubfolderNavigation({ modal, state });
  const channels = createManageChannelList({ modal, state, currentTitle, closeChannelMenu });

  function dismissMenus(event) {
    if (state.optionsChannel && !event.target.closest('.ysm-channel-menu') && !event.target.closest('[data-action="channel-options"]')) closeChannelMenu();
    if (state.moveChannel && !event.target.closest('.ysm-move-picker') && !event.target.closest('[data-action="move"]')) closeMovePicker();
    if (!event.target.closest('.ysm-main-menu') && !event.target.closest('[data-action="menu"]')) {
      modal.querySelector('.ysm-main-menu').hidden = true;
      modal.querySelector('[data-action="menu"]').setAttribute('aria-expanded', 'false');
    }
    if (!event.target.closest('.ysm-more-parents')) {
      const more = modal.querySelector('.ysm-more-parents');
      if (more) more.open = false;
    }
  }

  function close() {
    chrome.storage.onChanged.removeListener(storageChanged);
    document.removeEventListener("keydown", keydown);
    document.removeEventListener("pointerdown", dismissMenus);
    parents.destroy();
    window.prepareManageParentRename = previousRenameHandler;
    window.prepareManageSubfolderRename = previousChildRenameHandler;
    modal.remove();
    activeManageView = null;
    if (previousFocus?.isConnected) previousFocus.focus();
  }
  function currentTitle() { return state.parent === null ? "Uncategorised" : state.child === null ? ((window.folderData?.[state.parent]?.subscriptions?.length || 0) ? "Parent channels" : state.parent) : state.child; }
  function render() {
    const focused = document.activeElement;
    const focusParent = focused?.dataset?.parent;
    const focusChild = focused?.dataset?.child;
    const focusAction = focused?.dataset?.action;
    const focusChannel = focused?.closest?.('[data-channel]')?.dataset.channel;
    const channelScroll = modal.querySelector('.ysm-channel-list').scrollTop;
    const data = window.folderData || {};
    if (state.parent !== null && !Object.hasOwn(data, state.parent)) { state.parent = null; state.child = null; }
    if (state.parent !== null && state.child !== null && !Object.hasOwn(data[state.parent].subfolders || {}, state.child)) state.child = Object.keys(data[state.parent].subfolders || {})[0] ?? null;
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
    parents.render();
    subfolders.render();
    channels.render();
    renderMovePicker();
    parents.afterRender();
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
  function selectParent(name) {
    state.parent = name; state.child = name === null ? null : Object.keys(window.folderData[name].subfolders || {})[0] ?? null;
    state.query = ""; state.folderQuery = ""; state.moveChannel = null;
    state.descriptionChannels.clear();
    modal.querySelector('.ysm-channel-list').scrollTop = 0;
    modal.querySelector(".ysm-channel-search").value = "";
    modal.querySelector(".ysm-folder-search").value = "";
    render();
    modal.querySelector('.ysm-visible-parents .ysm-tab.is-active')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
  modal.addEventListener('click', createManageActions({ modal, state, render, close, dismissMenus,
    selectParent, parents, showChannelMenu, closeChannelMenu, closeMovePicker, renderMovePicker }));
  modal.querySelector(".ysm-channel-search").addEventListener("input", event => { state.query = event.target.value; render(); });
  modal.querySelector(".ysm-folder-search").addEventListener("input", event => { state.folderQuery = event.target.value; render(); });
  modal.querySelector(".ysm-sort").addEventListener("change", event => { state.sort = event.target.value; render(); });
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
      if (state.optionsChannel) { closeChannelMenu(true); return; }
      const menu = modal.querySelector(".ysm-main-menu");
      if (!menu.hidden) { menu.hidden = true; modal.querySelector('[data-action="menu"]').setAttribute("aria-expanded", "false"); }
      else if (modal.querySelector('.ysm-more-parents')?.open) modal.querySelector('.ysm-more-parents').open = false;
      else if (state.moveChannel) closeMovePicker(true);
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
  render(); dialog.focus();
}
window.showSubfolderView = showSubfolderView;
