// Static Manage markup; behaviour lives in the view components.
function manageLayoutHTML() {
  return `<section class="ysm-manage" role="dialog" aria-modal="true" aria-labelledby="ysm-title" tabindex="-1">
    <header class="ysm-header">${manageFolderIcon("ysm-main-folder", true)}
      <div><h2 id="ysm-title">Manage Subscriptions</h2><p class="ysm-total"></p></div>
      <div class="ysm-header-actions"><button type="button" data-action="menu" aria-label="More options" aria-expanded="false">•••</button>
      <button type="button" data-action="close" aria-label="Close Manage Subscriptions">✕</button>
      <div class="ysm-menu ysm-main-menu" hidden><button type="button" data-action="refresh">Refresh subscriptions</button><button type="button" data-action="backup">Backup folders</button><button type="button" data-action="restore">Restore backup</button></div></div></header>
    <div class="ysm-backup-notice" role="status" aria-live="polite" aria-atomic="true" hidden><span class="ysm-backup-notice-text"></span><button type="button" aria-label="Dismiss message">✕</button></div>
    <p class="ysm-load-message" role="status" hidden></p>
    <section class="ysm-parents"><div class="ysm-parent-heading"><button type="button" data-action="uncategorised" class="ysm-tab ysm-uncategorised" aria-pressed="false" title="View unassigned subscriptions"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 4h16v12h-5l-2 3h-2l-2-3H4z"/></svg>Uncategorised <span></span></button><div class="ysm-parent-heading-actions"><div class="ysm-all-folders-slot"></div><button type="button" data-action="create-parent" class="ysm-create-parent"><span class="ysm-add-plus" aria-hidden="true">+</span> Add Folder</button></div></div><div class="ysm-tabs"><button type="button" class="ysm-parent-arrow" data-action="parent-prev" aria-label="Previous parent folder" disabled>‹</button><div class="ysm-visible-parents"></div><button type="button" class="ysm-parent-arrow" data-action="parent-next" aria-label="Next parent folder" disabled>›</button></div></section>
    <div class="ysm-columns"><aside class="ysm-navigation"><div class="ysm-nav-heading"><div class="ysm-nav-title">${manageFolderIcon("ysm-heading-icon", true)}<h3></h3><span class="ysm-heading-count"></span></div>
      <div class="ysm-nav-actions"><button type="button" data-action="add" class="ysm-add"><span class="ysm-subfolder-plus" aria-hidden="true">+</span> Add Subfolder</button></div></div>
      <div class="ysm-folder-search-field"><input class="ysm-folder-search" type="search" aria-label="Search subfolders" placeholder="Search subfolders..."><button type="button" data-action="clear-subfolder-search" class="ysm-folder-search-clear" aria-label="Clear subfolder search" hidden>✕</button></div>
      <div class="ysm-subfolders"></div></aside>
    <section class="ysm-content"><header class="ysm-content-heading"><div><h3 class="ysm-selected"></h3><p class="ysm-selected-count"></p></div>
      <input class="ysm-channel-search" type="search" aria-label="Search channels" placeholder="Search channels...">
      <select class="ysm-sort" aria-label="Sort channels"><option value="az">Sort: A - Z</option><option value="za">Sort: Z - A</option></select></header>
      <div class="ysm-channel-list"></div></section></div>
    <section class="ysm-move-picker" aria-label="Move channel to a folder" hidden></section>
    <section class="ysm-channel-menu" aria-label="Channel options" hidden></section>
  </section>`;
}
