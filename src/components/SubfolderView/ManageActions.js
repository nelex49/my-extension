// Routes Manage controls to components and existing folder operations.
function createManageActions({ modal, state, render, close, dismissMenus, selectParent, parents,
  showChannelMenu, closeChannelMenu, closeMovePicker, renderMovePicker, backupNotice }) {
  return event => {
    dismissMenus(event);
    if (event.target === modal) { close(); return; }
    const button = event.target.closest("button");
    if (!button || button.disabled) return;
    const action = button.dataset.action;
    if (action === "clear-subfolder-search") {
      state.folderQuery = ""; modal.querySelector('.ysm-folder-search').value = ""; render();
      modal.querySelector('.ysm-folder-search').focus({ preventScroll: true }); return;
    }
    if (action === "edit-parent") {
      event.stopPropagation?.();
      const oldName = button.dataset.editParent;
      showUnifiedFolderManager(oldName, "edit", newName => { if (state.parent === oldName) state.parent = newName; render(); modal.querySelector('.ysm-visible-parents .ysm-tab.is-active')?.scrollIntoView?.({block:'nearest',inline:'nearest'}); }, button, () => { if (state.parent === oldName) { state.parent = null; state.child = null; } render(); });
      return;
    }
    if (action === "edit-subfolder") {
      event.stopPropagation?.();
      const oldName = button.dataset.editChild;
      showCreateSubfolderModal(state.parent, oldName, button, newName => { if (state.child === oldName) state.child = newName; render(); }, () => { if (state.child === oldName) state.child = Object.keys(window.folderData?.[state.parent]?.subfolders || {})[0] ?? null; render(); });
      return;
    }
    if (button.hasAttribute("data-parent")) { selectParent(button.dataset.parent); return; }
    if (button.hasAttribute("data-child")) { state.child = button.dataset.child; state.moveChannel = null; render(); return; }
    if (action === "backup" || action === "restore" || action === "about") {
      modal.querySelector(".ysm-main-menu").hidden = true;
      modal.querySelector('[data-action="menu"]').setAttribute("aria-expanded", "false");
      if (action === "backup") window.exportFolderBackup();
      else if (action === "restore") window.chooseFolderBackup();
      else { modal.querySelector('[data-action="menu"]').focus(); showManageAbout(); }
      return;
    }
    if (action === "refresh") {
      modal.querySelector('.ysm-main-menu').hidden = true;
      modal.querySelector('[data-action="menu"]').setAttribute('aria-expanded', 'false');
      chrome.runtime.sendMessage({ action: 'refreshSubscriptions' }).then(result => {
        if (result?.success || result?.accountRequired || result?.cancelled || !modal.isConnected) return;
        window.subscriptionLoadStatus = { state: 'error', message: result?.error || 'Could not refresh subscriptions. Please retry.' };
        render();
      }).catch(() => {
        window.subscriptionLoadStatus = { state: 'error', message: 'Reload the extension and YouTube to refresh subscriptions.' };
        render();
      });
    } else if (action === "close") close();
    else if (action === "uncategorised") selectParent(null);
    else if (action === "parent-prev") parents.stepParent(-1);
    else if (action === "parent-next") parents.stepParent(1);
    else if (action === "direct") { state.child = null; render(); }
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
      const id = state.optionsChannel;
      closeChannelMenu();
      if (id && /^[A-Za-z0-9_-]+$/.test(id)) window.open(`https://www.youtube.com/channel/${id}`, '_blank', 'noopener,noreferrer');
    } else if (action === "description") {
      const id = button.closest('[data-channel]').dataset.channel;
      if (state.descriptionChannels.has(id)) state.descriptionChannels.delete(id); else state.descriptionChannels.add(id);
      render();
    } else if (action === "add") {
      if (state.parent === null) showUnifiedFolderManager(); else showCreateSubfolderModal(state.parent);
    } else if (action === "move") {
      const id = button.closest("[data-channel]").dataset.channel;
      if (state.moveChannel === id) closeMovePicker(true);
      else {
        closeMovePicker(); state.moveChannel = id; renderMovePicker();
        modal.querySelector('.ysm-move-list button')?.focus();
      }
    } else if (action === "move-close") closeMovePicker(true);
    else if (action === "move-clear") {
      state.moveQuery = ""; renderMovePicker();
      modal.querySelector('.ysm-move-search').focus({ preventScroll: true });
    } else if (action === "move-parent") {
      state.moveQuery = "";
      state.moveParent = button.dataset.moveParent; renderMovePicker();
      modal.querySelector('[data-action="move-back"]').focus();
    } else if (action === "move-back") {
      const previous = state.moveParent; state.moveQuery = ""; state.moveParent = null; renderMovePicker();
      Array.from(modal.querySelectorAll('[data-action="move-parent"]')).find(item => item.dataset.moveParent === previous)?.focus();
    } else if (action === "destination") {
      const id = state.moveChannel;
      // Existing operation expects the app's lexical state to match window state.
      folderData = window.folderData; userSubscriptions = window.userSubscriptions;
      const destinationParent = button.dataset.destinationParent;
      const destinationChild = button.dataset.destinationChild;
      if (!userSubscriptions.some(sub => manageChannelId(sub) === id) ||
          !folderData[destinationParent]?.subfolders?.[destinationChild]) {
        showUserNotification("Channel data is unavailable. Refresh subscriptions and try again.", "warn");
        return;
      }
      addToSubfolder(id, destinationParent, destinationChild, success => {
        if (!modal.isConnected) return;
        if (success) {
          closeMovePicker();
          backupNotice.show(`Moved to ${destinationParent} / ${destinationChild}`, 'success', 2000);
        }
        render();
      });
    } else if (action === "remove") {
      const id = button.closest("[data-channel]").dataset.channel;
      if (!confirm("Remove this channel from the folder? Your YouTube subscription will remain.")) return;
      removeFromSubfolder(id, state.parent, state.child, () => {
        if (modal.isConnected) render();
      });
    }
  };
}
