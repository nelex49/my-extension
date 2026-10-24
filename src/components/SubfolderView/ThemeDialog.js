// Uses the existing shared dialog lifecycle; theme saving belongs to ThemeService.
function showThemeDialog() {
  if (document.querySelector('.ytsm-theme-dialog')) return;
  const { modal, close } = openFolderDialog('theme', `<section class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><h2 id="ytsm-folder-dialog-title">Theme</h2></header>
    <div class="ytsm-folder-form"><p class="ytsm-theme-copy">Choose the appearance of Subscription Folders. YouTube's theme stays unchanged.</p>
      <div class="ytsm-theme-options" role="group" aria-label="Extension theme">
        <button type="button" data-theme="dark" aria-pressed="false">Dark</button>
        <button type="button" data-theme="light" aria-pressed="false">Light</button>
      </div>
      <p class="ytsm-theme-status" role="status" aria-live="polite"></p>
      <div class="ytsm-dialog-actions"><span></span><span></span><button type="button" data-action="theme-done">Done</button></div>
    </div></section>`);
  const buttons = Array.from(modal.querySelectorAll('button')).filter(button => button.dataset.theme);
  const status = modal.querySelector('.ytsm-theme-status');
  function render() { buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === ThemeService.current))); }
  render();
  // Shared lifecycle closes on Escape/outside click. No persistent dialog subscription.
  buttons.forEach(button => button.addEventListener('click', async () => {
    buttons.forEach(item => { item.disabled = true; });
    const success = await ThemeService.select(button.dataset.theme);
    if (!modal.isConnected) return;
    buttons.forEach(item => { item.disabled = false; });
    render(); status.textContent = success ? 'Theme saved.' : 'Could not save the theme. Please try again.';
  }));
  modal.querySelector('[data-action="theme-done"]').addEventListener('click', close);
  modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [...buttons.filter(button => !button.disabled), modal.querySelector('[data-action="theme-done"]')];
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1).focus(); }
    else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
  });
  buttons.find(button => button.dataset.theme === ThemeService.current)?.focus();
}
