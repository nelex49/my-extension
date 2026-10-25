// Channel rows, filtered counts, descriptions and safe avatar loading.
function createManageChannelList({ modal, state, currentTitle, closeChannelMenu }) {
  function render() {
    const scope = JSON.stringify([state.parent, state.child]);
    if (state.selectionScope !== scope || window.FolderPlan?.state !== 'pro') {
      state.selectionMode = false; state.selectedChannels.clear(); state.bulkPicker = false;
      state.selectionScope = scope;
    }
    const names = Object.keys(window.folderData || {});
    modal.querySelector(".ysm-selected").textContent = currentTitle();
    modal.querySelector(".ysm-channel-search").placeholder = `Search channels in ${currentTitle()}...`;
    const all = manageFilteredSubscriptions(state.parent, state.child, "", state.sort);
    const visible = manageFilteredSubscriptions(state.parent, state.child, state.query, state.sort);
    modal.querySelector(".ysm-selected-count").textContent = state.query.trim() ? `${visible.length} of ${all.length} subscriptions` : `${all.length} subscriptions`;
    const available = new Set(all.map(manageChannelId));
    for (const id of state.selectedChannels) if (!available.has(id)) state.selectedChannels.delete(id);
    const bar = modal.querySelector('.ysm-selection-bar');
    bar.hidden = false;
    bar.innerHTML = state.selectionMode ? `<span role="status" aria-live="polite">${state.selectedChannels.size} selected</span>
      <button type="button" data-action="select-results" ${state.bulkMoving || !visible.length ? 'disabled' : ''}>${state.query.trim() ? 'Select all results' : 'Select all'}</button>
      <button type="button" data-action="clear-selection" ${state.bulkMoving || !state.selectedChannels.size ? 'disabled' : ''}>Clear selection</button>
      <button type="button" data-action="move-selected" aria-expanded="${state.bulkPicker}" ${state.bulkMoving || !state.selectedChannels.size || !names.length ? 'disabled' : ''}>${state.bulkMoving ? 'Moving...' : 'Move selected'}</button>
      <button type="button" data-action="cancel-selection" ${state.bulkMoving ? 'disabled' : ''}>Cancel</button>` :
      `<button type="button" data-action="start-selection">Select channels${window.FolderPlan?.state === 'pro' ? '' : ` <span class="ysm-pro-badge">${proCrownIcon()}<span>Pro</span></span>`}</button>`;
    modal.querySelector(".ysm-channel-list").innerHTML = visible.map(sub => {
      const id = manageChannelId(sub), title = manageChannelTitle(sub);
      const href = /^[A-Za-z0-9_-]+$/.test(id) ? `https://www.youtube.com/channel/${id}` : null;
      return `<article class="ysm-channel" data-channel="${manageEscape(id)}">${state.selectionMode ? `<label class="ysm-channel-check"><input type="checkbox" data-select-channel="${manageEscape(id)}" aria-label="Select ${manageEscape(title)}" ${state.selectedChannels.has(id) ? 'checked' : ''} ${state.bulkMoving || !id ? 'disabled' : ''}></label>` : ''}<div class="ysm-avatar" aria-hidden="true"><span>${manageEscape(title.slice(0, 2).toUpperCase())}</span></div>
        <div class="ysm-channel-info">${href ? `<a href="${href}" target="_blank" rel="noopener noreferrer" title="${manageEscape(title)}">${manageEscape(title)}</a>` : `<strong>${manageEscape(title)}</strong>`}<p>Subscription</p></div>
        <div class="ysm-row-actions"><button type="button" data-action="description" class="ysm-info" aria-label="Description for ${manageEscape(title)}" aria-expanded="${state.descriptionChannels.has(id)}" title="Show channel description">i</button><button type="button" data-action="move" class="ysm-move" ${names.length && id && !state.selectionMode ? '' : 'disabled'} aria-expanded="${state.moveChannel === id}">Move ▾</button>
        ${state.parent !== null ? `<button type="button" data-action="remove" class="ysm-remove" ${id && !state.selectionMode ? '' : 'disabled'} title="Remove from this folder; keep YouTube subscription"><span aria-hidden="true">×</span> Remove</button>` : ''}<button type="button" data-action="channel-options" class="ysm-channel-options" aria-label="More options for ${manageEscape(title)}" aria-haspopup="true" aria-expanded="${state.optionsChannel === id}">•••</button></div>
        ${state.descriptionChannels.has(id) ? `<div class="ysm-description">${manageEscape(sub.snippet?.description || 'No description available.')}</div>` : ''}</article>`;
    }).join("") || `<p class="ysm-empty">${state.query.trim() ? 'No matching channels.' : 'No subscriptions in this view.'}</p>`;
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
  }
  return { render };
}
