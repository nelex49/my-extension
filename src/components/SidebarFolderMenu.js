// Quick sidebar actions reuse the shared dialogs and folder services.
let activeSidebarFolderMenu = null;
function closeSidebarFolderMenu(restoreFocus = false) {
  activeSidebarFolderMenu?.close(restoreFocus);
}

function sidebarFolderActions(row, parentName, childName = null) {
  const wrap = sidebarElement('div', 'ytsm-folder-wrap');
  wrap.style.setProperty('--folder-color', row.style.getPropertyValue?.('--folder-color') || row.style['--folder-color']);
  wrap.style.setProperty('--folder-text', row.style.getPropertyValue?.('--folder-text') || row.style['--folder-text']);
  const more = sidebarElement('button', 'ytsm-folder-more', '•••');
  more.type = 'button';
  more.dataset.focusKey = JSON.stringify(['actions', parentName, childName]);
  more.setAttribute('aria-label', `Options for ${childName ?? parentName}`);
  more.setAttribute('aria-haspopup', 'menu');
  more.setAttribute('aria-expanded', 'false');
  more.addEventListener('click', () => {
    if (activeSidebarFolderMenu?.anchor === more) { closeSidebarFolderMenu(true); return; }
    closeSidebarFolderMenu();
    const entry = document.getElementById('yt-manage-guide-entry');
    if (!entry) return;
    const menu = sidebarElement('div', 'ytsm-folder-menu');
    menu.id = 'ytsm-sidebar-folder-menu';
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', `Actions for ${childName ?? parentName}`);
    function close(restoreFocus) {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', keyboard, true);
      menu.remove(); more.setAttribute('aria-expanded', 'false');
      activeSidebarFolderMenu = null;
      if (restoreFocus && more.isConnected) more.focus({ preventScroll: true });
    }
    function dismiss(event) {
      if (!menu.contains(event.target) && event.target !== more) close(false);
    }
    function keyboard(event) {
      if (event.key === 'Escape') {
        event.preventDefault(); event.stopImmediatePropagation(); close(true);
      } else if (event.key === 'Tab') close(true);
      else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        const items = Array.from(menu.querySelectorAll('button'));
        const index = items.indexOf(document.activeElement);
        items[(index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
      }
    }
    function action(label, run) {
      const button = sidebarElement('button', 'ytsm-folder-menu-action', label);
      button.type = 'button'; button.setAttribute('role', 'menuitem');
      button.addEventListener('click', () => { close(false); run(); });
      menu.append(button);
    }
    function focusActions(parent, child = null) {
      const key = JSON.stringify(['actions', parent, child]);
      Array.from(folderDropdown?.querySelectorAll('button') || [])
        .find(button => button.dataset.focusKey === key)?.focus({ preventScroll: true });
    }
    action(childName === null ? 'Edit folder' : 'Edit subfolder', () => {
      const expanded = sidebarExpandedParents.has(parentName);
      const openChildren = Array.from(sidebarExpandedSubfolders).map(key => JSON.parse(key))
        .filter(([parent]) => parent === parentName);
      if (childName === null) showUnifiedFolderManager(parentName, 'edit', newName => {
        if (expanded) sidebarExpandedParents.add(newName);
        openChildren.forEach(([, child]) => sidebarExpandedSubfolders.add(JSON.stringify([newName, child])));
        refreshFolderDropdown(); focusActions(newName);
      }, more, null, 'origin');
      else showCreateSubfolderModal(parentName, childName, more, newName => {
        if (openChildren.some(([, child]) => child === childName))
          sidebarExpandedSubfolders.add(JSON.stringify([parentName, newName]));
        refreshFolderDropdown(); focusActions(parentName, newName);
      }, null, 'origin');
    });
    if (childName === null) action('Create subfolder', () => {
      showCreateSubfolderModal(parentName, null, more, () => {
        sidebarExpandedParents.add(parentName); refreshFolderDropdown();
      }, null, 'origin');
    });
    document.body.append(menu);
    const rect = more.getBoundingClientRect(), bounds = menu.getBoundingClientRect();
    menu.style.left = `${Math.max(8, Math.min(rect.right + 2, window.innerWidth - bounds.width - 8))}px`;
    menu.style.top = `${Math.max(8, Math.min(rect.top + 2, window.innerHeight - bounds.height - 8))}px`;
    more.setAttribute('aria-expanded', 'true');
    activeSidebarFolderMenu = { anchor: more, close };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', keyboard, true);
    menu.querySelector('button').focus({ preventScroll: true });
  });
  wrap.append(row, more);
  return wrap;
}
