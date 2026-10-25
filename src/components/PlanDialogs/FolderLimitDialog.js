// Shared decorative Pro mark; labels remain readable by assistive technology.
function proCrownIcon() {
  return '<svg class="ytsm-pro-crown" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m3 6 5 4 4-6 4 6 5-4-2 12H5L3 6Z"/><path d="M6 21h12"/></svg>';
}

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
    <footer class="ytsm-dialog-actions"><span></span><button type="button" data-dialog-close>Not now</button><button type="button" data-action="pro-details" class="ytsm-primary">${proCrownIcon()}${decision.expired ? 'Renew Pro' : 'Upgrade to Pro'}</button></footer></div></section>`);
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

// Feature discovery shares the folder dialogs' theme, focus and dismissal lifecycle.
function showMultiMoveProDialog() {
  const existing = document.querySelector('.ytsm-multi-move-pro-dialog');
  if (existing) { existing.querySelector('[data-dialog-close]').focus(); return; }
  const expired = window.FolderPlan?.state === 'expired';
  const { modal, close } = openFolderDialog('multi-move-pro', `<section class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><span class="ytsm-pro-emblem">${proCrownIcon()}</span><div><span class="ytsm-pro-eyebrow">SUBSCRIPTION FOLDERS PRO</span><h2 id="ytsm-folder-dialog-title">Move channels together</h2></div></header>
    <div class="ytsm-folder-form"><p class="ytsm-pro-intro">Select several channels, choose a destination and move them in one step.</p>
      <div class="ytsm-pro-benefits"><p><strong>Multi-channel moves</strong><span>Organise several subscriptions at once.</span></p><p><strong>Unlimited folders</strong><span>Create as many parent folders and subfolders as you need.</span></p></div>
      <p class="ytsm-plan-copy">${expired ? 'Renew Pro to use multi-channel moves again.' : 'Multi-channel moves are included with Pro.'} You can still move channels individually with Free.</p>
      <div class="ytsm-multi-move-pro-details" role="status" hidden><p><strong>Pro includes unlimited folders and multi-channel moves.</strong></p><p class="ytsm-plan-copy">Pro purchases are not available yet. Your plan and folders have not changed.</p></div>
      <footer class="ytsm-dialog-actions"><button type="button" data-dialog-close>Cancel</button><button type="button" data-action="multi-move-upgrade" class="ytsm-primary">${proCrownIcon()}${expired ? 'Renew Pro' : 'Upgrade to Pro'}</button></footer>
    </div></section>`);
  const cancel = modal.querySelector('[data-dialog-close]');
  const upgrade = modal.querySelector('[data-action="multi-move-upgrade"]');
  upgrade.addEventListener('click', () => {
    modal.querySelector('.ytsm-multi-move-pro-details').hidden = false;
    upgrade.hidden = true; cancel.textContent = 'Close'; cancel.focus();
  });
  modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    if (upgrade.hidden || (event.shiftKey && document.activeElement === cancel) ||
        (!event.shiftKey && document.activeElement === upgrade)) {
      event.preventDefault(); (upgrade.hidden || !event.shiftKey ? cancel : upgrade).focus();
    }
  });
  cancel.focus();
  return { modal, close };
}
