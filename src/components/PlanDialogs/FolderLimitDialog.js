// Shared decorative Pro mark; labels remain readable by assistive technology.
function proCrownIcon() {
  return '<svg class="ytsm-pro-crown" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="m3 6 5 4 4-6 4 6 5-4-2 12H5L3 6Z"/><path d="M6 21h12"/></svg>';
}

// Reuse the existing dialog theme/lifecycle without adding an upgrade menu.
function showFolderLimitDialog(decision) {
  const existing = document.querySelector('.ytsm-plan-dialog');
  if (existing) { existing.querySelector('[data-dialog-close]').focus(); return; }
  const { subfolders } = FolderPlan.limits;
  const message = `Free includes ${subfolders} subfolders per parent folder. Pro removes that limit.`;
  const { modal, close } = openFolderDialog('plan', `<section class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><h2 id="ytsm-folder-dialog-title">${decision.expired ? 'Your Pro subscription has expired' : 'Create more subfolders with Pro'}</h2></header>
    <div class="ytsm-folder-form"><p>${message}</p>
    <p class="ytsm-plan-copy">Your existing subfolders remain available. You can keep renaming, moving subscriptions and deleting. Nothing is removed.</p>${proOtherBenefitsHTML('subfolders')}<p class="ytsm-plan-copy">Unlimited parent folders and folder colours are included with Free.</p>
    <div class="ytsm-pro-details" hidden><p><strong>Unlimited subfolders per parent, multi-channel moves and the folder icon library.</strong></p><p class="ytsm-plan-copy">Pro purchases are not available yet. Your existing setup has not changed.</p></div>
    <footer class="ytsm-dialog-actions"><span></span><button type="button" data-dialog-close>Cancel</button><button type="button" data-action="pro-details" class="ytsm-primary">${proCrownIcon()}${decision.expired ? 'Renew Pro' : 'Upgrade to Pro'}</button></footer></div></section>`);
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
function showMultiMoveProDialog(feature = 'moves') {
  const icons = feature === 'icons';
  const dialogKind = icons ? 'folder-icons-pro' : 'multi-move-pro';
  const existing = document.querySelector(`.ytsm-${dialogKind}-dialog`);
  if (existing) { existing.querySelector('[data-dialog-close]').focus(); return; }
  const expired = window.FolderPlan?.state === 'expired';
  const { modal, close } = openFolderDialog(dialogKind, `<section class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><span class="ytsm-pro-emblem">${proCrownIcon()}</span><div><span class="ytsm-pro-eyebrow">SUBSCRIPTION FOLDERS PRO</span><h2 id="ytsm-folder-dialog-title">${icons ? 'Personalise your folders with Pro' : 'Move channels together with Pro'}</h2></div></header>
    <div class="ytsm-folder-form"><p class="ytsm-pro-intro">${icons ? 'Choose from the built-in icon library for your folders and subfolders.' : 'Select several channels, choose a destination and move them in one step.'}</p>
      ${proOtherBenefitsHTML(icons ? 'icons' : 'moves')}
      <div class="ytsm-free-note"><p><strong>Included with Free:</strong> ${icons ? '' : 'individual channel moves, '}unlimited parent folders, ${FolderPlan.limits.subfolders} subfolders per parent, and folder colours.</p>${expired && icons ? '<p class="ytsm-expired-icon-note">Icons you previously chose will stay in place.</p>' : ''}</div>
      <div class="ytsm-multi-move-pro-details" role="status" hidden><p><strong>Pro includes unlimited subfolders per parent, multi-channel moves and the folder icon library.</strong></p><p class="ytsm-plan-copy">Pro purchases are not available yet. Your plan and folders have not changed.</p></div>
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

function showFolderIconsProDialog() { return showMultiMoveProDialog('icons'); }

// One accurate list for all feature prompts; omit the benefit already explained above it.
function proOtherBenefitsHTML(currentFeature) {
  const benefits = [
    ['moves', 'Multi-channel moves', 'Select several subscriptions and move them together.'],
    ['subfolders', 'Unlimited subfolders', `Go beyond the Free allowance of ${FolderPlan.limits.subfolders} subfolders per parent folder.`],
    ['icons', 'Folder icon library', 'Choose a built-in icon for each folder and subfolder.']
  ];
  return `<section class="ytsm-other-pro"><h3>Also included with Pro</h3><div class="ytsm-pro-benefits">${benefits.filter(([key]) => key !== currentFeature).map(([,title,copy]) => `<p><strong>${title}</strong><span>${copy}</span></p>`).join('')}</div></section>`;
}
