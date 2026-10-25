// Two-level destination picker, search, icons and stable positioning.
function createMovePicker({ modal, state }) {
  function moveAnchor() {
    if (state.bulkPicker) return modal.querySelector('[data-action="move-selected"]');
    return Array.from(modal.querySelectorAll('[data-action="move"]')).find(button =>
      button.closest('[data-channel]')?.dataset.channel === state.moveChannel);
  }
  function closeMovePicker(restoreFocus = false) {
    const anchor = moveAnchor();
    state.bulkPicker = false; state.moveChannel = null; state.moveParent = null; state.moveQuery = ""; state.movePosition = null;
    modal.querySelector('.ysm-move-picker').hidden = true;
    anchor?.setAttribute('aria-expanded', 'false');
    if (restoreFocus) anchor?.focus({ preventScroll: true });
  }
  function renderMovePicker() {
    const picker = modal.querySelector('.ysm-move-picker');
    const anchor = moveAnchor();
    if ((!state.moveChannel && !state.bulkPicker) || !anchor) { closeMovePicker(); return; }
    const data = window.folderData || {};
    if (state.moveParent !== null && !Object.hasOwn(data, state.moveParent)) state.moveParent = null;
    const names = state.moveParent === null ? Object.keys(data) : Object.keys(data[state.moveParent].subfolders || {});
    const searchFocused = document.activeElement === picker.querySelector('.ysm-move-search');
    const selection = searchFocused ? document.activeElement.selectionStart : null;
    const filtered = names.filter(name => name.toLowerCase().includes(state.moveQuery.trim().toLowerCase()));
    picker.hidden = false;
    picker.innerHTML = `<header><strong>${state.moveParent === null ? 'Choose parent folder' : 'Choose subfolder'}</strong><button type="button" data-action="move-close" aria-label="Cancel move">✕</button></header>` +
      (state.moveParent === null ? '' : '<button type="button" data-action="move-back" class="ysm-move-back"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m10 6-6 6 6 6M4 12h13"/></svg><span>Back to parent folders</span></button>') +
      `<div class="ysm-move-search-field"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" class="ysm-move-search" aria-label="${state.moveParent === null ? 'Search parent folders' : 'Search subfolders'}" placeholder="${state.moveParent === null ? 'Search folders...' : 'Search subfolders...'}" value="${manageEscape(state.moveQuery)}"><button type="button" class="ysm-move-clear" data-action="move-clear" aria-label="Clear folder search" title="Clear search" ${state.moveQuery ? '' : 'hidden'}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></div>` +
      (state.moveParent === null ? '' : '<div class="ysm-move-divider" aria-hidden="true"></div>') +
      `<div class="ysm-move-list">${filtered.map(name => {
        const current = state.moveParent === state.parent && name === state.child;
        const folder = state.moveParent === null ? data[name] : data[state.moveParent].subfolders[name];
        const savedColour = folder.color || (state.moveParent === null ? '' : data[state.moveParent].color);
        // Raise lightness and saturation for outlines without changing saved colours.
        let iconColour = '#aebbc8';
        if (/^#[0-9a-f]{6}$/i.test(savedColour || '')) {
          const rgb = [1, 3, 5].map(offset => parseInt(savedColour.slice(offset, offset + 2), 16));
          const low = Math.min(...rgb), range = Math.max(...rgb) - low;
          iconColour = '#' + rgb.map(value => Math.round(range < 12 ? 190 : 100 + (value - low) / range * 130)
            .toString(16).padStart(2, '0')).join('');
        }
        return state.moveParent === null ?
          `<button type="button" data-action="move-parent" data-move-parent="${manageEscape(name)}" title="${manageEscape(name)}" style="--destination-colour: ${iconColour}">${manageFolderIcon('ysm-destination-icon')}<span>${manageEscape(name)}</span><small>›</small></button>` :
          `<button type="button" data-action="destination" data-destination-parent="${manageEscape(state.moveParent)}" data-destination-child="${manageEscape(name)}" title="${manageEscape(name)}" style="--destination-colour: ${iconColour}" ${current ? 'disabled' : ''}>${manageFolderIcon('ysm-destination-icon')}<span>${manageEscape(name)}</span>${current ? '<small>Current</small>' : ''}</button>`;
      }).join('') || `<p class="ysm-empty">${names.length ? 'No matching folders.' : state.moveParent === null ? 'No parent folders yet.' : `No subfolders in ${manageEscape(state.moveParent)} yet. Close this picker and use + Subfolder to create one.`}</p>`}</div>`;
    const search = picker.querySelector('.ysm-move-search');
    if (search) {
      search.addEventListener('input', event => { state.moveQuery = event.target.value; renderMovePicker(); });
      if (searchFocused) {
        search.focus({ preventScroll: true });
        if (selection !== null && typeof search.setSelectionRange === 'function') search.setSelectionRange(selection, selection);
      }
    }
    anchor.setAttribute('aria-expanded', 'true');
    const list = picker.querySelector('.ysm-move-list');
    const gutter = Math.max(0, (list.offsetWidth || list.clientWidth) - list.clientWidth);
    picker.style.setProperty('--move-gutter', `${gutter}px`);
    if (!state.movePosition) {
      const rect = anchor.getBoundingClientRect(), bounds = picker.getBoundingClientRect();
      const below = rect.bottom + 6;
      state.movePosition = {
        left: Math.max(12, Math.min(rect.right - bounds.width, window.innerWidth - bounds.width - 12)),
        top: Math.max(12, Math.min(below + bounds.height <= window.innerHeight - 12 ? below : rect.top - bounds.height - 6, window.innerHeight - bounds.height - 12))
      };
    }
    picker.style.left = `${state.movePosition.left}px`;
    picker.style.top = `${state.movePosition.top}px`;
    picker.style.maxHeight = `${Math.max(0, window.innerHeight - state.movePosition.top - 12)}px`;

  }
  return { closeMovePicker, renderMovePicker };
}
