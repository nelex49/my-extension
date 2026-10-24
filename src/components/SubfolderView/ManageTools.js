// Tools menu presentation and the read-only About dialog.
function manageToolsHTML() {
  const paths = {
    refresh: '<path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 7a7 7 0 0 1 12-1l2 3M4 15l2 3a7 7 0 0 0 12-1"/>',
    backup: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/>',
    restore: '<path d="M12 16V4m-5 5 5-5 5 5M5 16v5h14v-5"/>',
    theme: '<circle cx="12" cy="12" r="9"/><path d="M12 3v18a9 9 0 0 0 0-18Z"/>',
    about: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>'
  };
  const items = [
    ['refresh', 'Refresh subscriptions', 'Get your latest YouTube subscriptions'],
    ['backup', 'Backup folders', 'Download your folders and channel assignments'],
    ['restore', 'Restore backup', 'Replace your setup from a saved backup'],
    ['theme', 'Theme', 'Choose Dark or Light for the extension'],
    ['about', 'About', 'About YouTube Subscription Manager']
  ];
  return items.map(([action, label, description]) => `<button type="button" data-action="${action}"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[action]}</svg><span><strong>${label}</strong><small>${description}</small></span></button>`).join('');
}
function showManageAbout() {
  if (document.querySelector('.ytsm-about-dialog')) return;
  const { modal, close } = openFolderDialog('about', `<section class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><h2 id="ytsm-folder-dialog-title">About</h2></header>
    <div class="ytsm-folder-form"><p><strong>YouTube Subscription Manager</strong></p>
    <p class="ytsm-about-version"></p>
    <p class="ytsm-about-copy">Organise your YouTube subscriptions into parent folders and subfolders.</p>
    <p class="ytsm-about-copy">Your folder setup is stored locally in this Chrome profile. Use Backup folders to keep a separate copy.</p>
    <div class="ytsm-dialog-actions"><span></span><span></span><button type="button" class="ytsm-primary" data-dialog-close>Close</button></div></div></section>`);
  const version = chrome.runtime.getManifest?.().version;
  modal.querySelector('.ytsm-about-version').textContent = version ? `Version ${version}` : '';
  const button = modal.querySelector('[data-dialog-close]');
  // Keep keyboard focus inside this read-only dialog; shared lifecycle handles Escape.
  button.addEventListener('keydown', event => {
    if (event.key === 'Tab') { event.preventDefault(); button.focus(); }
  });
  button.focus();
  return { modal, close };
}
