// Deliberately separate from the product UI. Disable the CONFIG flag for release.
(() => {
  const status = document.querySelector('#status');
  document.querySelector('#allowance').textContent = `Free allows unlimited parent folders and ${FolderPlan.limits.subfolders} subfolders per parent.`;
  const buttons = Array.from(document.querySelectorAll('[data-plan]'));
  const enabled = window.CONFIG?.DEVELOPMENT_PLAN_TESTING === true;
  function disable(value) { buttons.forEach(button => { button.disabled = value; }); }
  async function showCurrent() {
    const data = await chrome.storage.local.get(FolderPlan.developmentKey);
    FolderPlan.applyStorage(data);
    status.textContent = `Current test state: ${FolderPlan.state}.`;
    buttons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.plan === FolderPlan.state)));
  }
  disable(true);
  if (!enabled) { status.textContent = 'Development plan testing is disabled.'; return; }
  for (const button of buttons) button.addEventListener('click', async () => {
    disable(true);
    try {
      await chrome.storage.local.set({ [FolderPlan.developmentKey]: button.dataset.plan });
      await showCurrent();
    } catch { status.textContent = 'Could not save the test state. Try again.'; }
    finally { disable(false); }
  });
  showCurrent().then(() => disable(false)).catch(() => { status.textContent = 'Could not read the test state. Reload this page.'; });
})();
