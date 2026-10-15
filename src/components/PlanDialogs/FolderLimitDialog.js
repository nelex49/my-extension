// Reuse the existing dialog theme/lifecycle without adding an upgrade menu.
function showFolderLimitDialog(decision) {
  const existing = document.querySelector('.ytsm-plan-dialog');
  if (existing) { existing.querySelector('[data-dialog-close]').focus(); return; }
  const { parents, subfolders } = FolderPlan.limits;
  const message = decision.oversized ?
    'Your existing folders are safe and remain usable. Pro is required to create more folders while this setup is larger than the Free allowance.' :
    decision.kind === 'parent' ? `Free includes ${parents} parent folders. Upgrade to Pro to create more.` :
    `Free includes ${subfolders} subfolders per parent. Upgrade to Pro to create more.`;
  const { modal, close } = openFolderDialog('plan', `<section class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><h2 id="ytsm-folder-dialog-title">${decision.expired ? 'Your Pro subscription has expired' : 'More folders with Pro'}</h2></header>
    <div class="ytsm-folder-form"><p>${message}</p>
    <p class="ytsm-plan-copy">You can keep using, renaming and deleting existing folders, and moving subscriptions. Nothing is removed.</p>
    <div class="ytsm-pro-details" hidden><p><strong>Unlimited parent folders and subfolders</strong></p><p class="ytsm-plan-copy">Pro purchases are not available yet. Your existing setup has not changed.</p></div>
    <footer class="ytsm-dialog-actions"><span></span><button type="button" data-dialog-close>Not now</button><button type="button" data-action="pro-details" class="ytsm-primary">${decision.expired ? 'Renew Pro' : 'Upgrade to Pro'}</button></footer></div></section>`);
  const dismiss = modal.querySelector('[data-dialog-close]');
  const details = modal.querySelector('[data-action="pro-details"]');
  details.addEventListener('click', () => {
    modal.querySelector('.ytsm-pro-details').hidden = false;
    details.hidden = true; dismiss.textContent = 'Close'; dismiss.focus();
  });
  modal.firstElementChild.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    if (details.hidden || (event.shiftKey && document.activeElement === dismiss) ||
        (!event.shiftKey && document.activeElement === details)) {
      event.preventDefault(); (details.hidden || !event.shiftKey ? dismiss : details).focus();
    }
  });
  dismiss.focus();
  return { modal, close };
}
