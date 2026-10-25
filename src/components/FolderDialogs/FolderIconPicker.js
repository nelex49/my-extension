// Local form state only. The service validates the plan again when saving.
function createFolderIconPicker({ modal, initialIcon, getColour, onLayout }) {
  let selected = FolderIcons.normalise(initialIcon), changed = false;
  const trigger = modal.querySelector('.ytsm-change-icon');
  const grid = modal.querySelector('.ytsm-icon-grid');
  const reset = modal.querySelector('.ytsm-reset-icon');
  grid.innerHTML = FolderIcons.entries.map(entry => `<button type="button" class="ytsm-icon-choice" data-icon-id="${entry.id}" title="${entry.label}" aria-label="${entry.label}" aria-pressed="false">${FolderIcons.svg(entry.id)}</button>`).join('');
  function sync() {
    modal.querySelector('.ytsm-icon-preview').innerHTML = FolderIcons.svg(selected);
    modal.querySelector('.ytsm-icon-name').textContent = FolderIcons.label(selected);
    modal.querySelector('.ytsm-icon-controls').style.setProperty('--chosen-icon-colour', folderIconColour(getColour()));
    const header = modal.querySelector('.ytsm-dialog-folder-icon');
    header.innerHTML = FolderIcons.paths(selected); header.setAttribute('fill', 'none'); header.setAttribute('data-folder-icon', selected);
    modal.querySelector('.ytsm-icon-controls').style.setProperty('--chosen-folder-colour', sidebarFolderColour(getColour()));
    reset.hidden = selected === 'folder';
    const pro = window.FolderPlan?.state === 'pro';
    trigger.innerHTML = `Change icon${pro ? '' : ` <span class="ytsm-icon-pro-badge">${proCrownIcon()}<span>Pro</span></span>`}`;
    grid.querySelectorAll('button').forEach(button => {
      const active = button.dataset.iconId === selected;
      button.classList.toggle('is-selected', active); button.setAttribute('aria-pressed', String(active));
    });
  }
  function toggle(open, restoreFocus = false) {
    grid.hidden = !open; trigger.setAttribute('aria-expanded', String(open));
    modal.querySelector('.ytsm-icon-hint').hidden = !open;
    onLayout?.();
    if (open) Array.from(grid.querySelectorAll('button')).find(button => button.dataset.iconId === selected)?.focus({preventScroll:true});
    else if (restoreFocus) trigger.focus({preventScroll:true});
  }
  trigger.addEventListener('click', () => {
    if (window.FolderPlan?.state !== 'pro') { toggle(false); sync(); trigger.focus({preventScroll:true}); showFolderIconsProDialog(); return; }
    toggle(grid.hidden, !grid.hidden);
  });
  grid.querySelectorAll('button').forEach(button => button.addEventListener('click', () => {
    if (window.FolderPlan?.state !== 'pro' && button.dataset.iconId !== 'folder') { toggle(false); sync(); trigger.focus({preventScroll:true}); showFolderIconsProDialog(); return; }
    selected = button.dataset.iconId; changed = true; sync();
  }));
  reset.addEventListener('click', () => { selected = 'folder'; changed = true; sync(); toggle(false, true); });
  modal.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !grid.hidden) {
      event.preventDefault(); event.stopImmediatePropagation(); toggle(false, true); return;
    }
    if (event.key !== 'Tab') return;
    const controls = Array.from(modal.querySelectorAll('button, input')).filter(node => !node.disabled && node.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  });
  sync();
  return { sync, get value() { return selected; }, get changed() { return changed; } };
}
