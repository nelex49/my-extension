// Confirm a local assignment removal; YouTube subscriptions are never deleted here.
function showRemoveChannelDialog({ channelId, parent, child, anchor, onRemoved }) {
  if (parent === null || document.querySelector('.ytsm-remove-channel-dialog')) return;
  const record = () => child === null ? window.folderData?.[parent] : window.folderData?.[parent]?.subfolders?.[child];
  const channel = record()?.subscriptions?.find(sub => manageChannelId(sub) === channelId);
  if (!channel) return;
  const original = JSON.stringify(record()), owner = window.folderOwner?.id;
  let pending = false, invalidated = false;
  anchor?.focus();
  const { modal, close } = openFolderDialog('remove-channel', `<section class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><h2 id="ytsm-folder-dialog-title">Remove from this folder?</h2></header>
    <div class="ytsm-folder-form"><p class="ytsm-remove-copy">Remove <strong>${manageEscape(manageChannelTitle(channel))}</strong> from <strong>${manageEscape(child === null ? parent : `${parent} / ${child}`)}</strong>?</p>
      <p class="ytsm-remove-note">You will remain subscribed to this channel on YouTube.</p>
      <p class="ytsm-form-error" role="alert" hidden></p>
      <div class="ytsm-remove-actions"><button type="button" class="ytsm-remove-cancel" data-action="remove-cancel">Cancel</button><button type="button" class="ytsm-primary" data-action="remove-confirm">Remove from folder</button></div>
    </div></section>`, null, 'beside', () => !pending || invalidated,
    () => chrome.storage.onChanged.removeListener(accountChanged));
  const cancel = modal.querySelector('[data-action="remove-cancel"]');
  const confirm = modal.querySelector('[data-action="remove-confirm"]');
  const error = modal.querySelector('.ytsm-form-error');
  function showError(message) { error.textContent = message; error.hidden = false; }
  function accountChanged(changes, area) {
    if (area !== 'local') return;
    if ((changes.accessToken && !changes.accessToken.newValue) || changes.folderOwner ||
        (changes.accountStatus && !['ready', 'verifying'].includes(changes.accountStatus.newValue?.state))) {
      invalidated = true; close();
    }
  }
  chrome.storage.onChanged.addListener(accountChanged);
  cancel.addEventListener('click', close);
  confirm.addEventListener('click', () => {
    if (pending || invalidated) return;
    if (owner !== window.folderOwner?.id || JSON.stringify(record()) !== original) {
      showError('This folder changed. Cancel and reopen Remove to review its current contents.'); return;
    }
    if (typeof window.accountIsReady === 'function' && !window.accountIsReady()) {
      showError('Verify the linked account before removing this assignment.'); return;
    }
    pending = true; cancel.disabled = true; confirm.disabled = true;
    confirm.textContent = 'Removing...'; error.hidden = true;
    function finish(success) {
      pending = false;
      if (!modal.isConnected) return;
      if (success) { close(); onRemoved?.(); }
      else {
        cancel.disabled = false; confirm.disabled = false; confirm.textContent = 'Remove from folder';
        showError('Could not save the removal. Your existing folder assignment was kept. Please try again.');
        cancel.focus();
      }
    }
    try { removeFromSubfolder(channelId, parent, child, finish); }
    catch (_) { finish(false); }
  });
  modal.addEventListener('keydown', event => {
    if (event.key !== 'Tab') return;
    const controls = [cancel, confirm].filter(button => !button.disabled);
    if (!controls.length) { event.preventDefault(); return; }
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) { event.preventDefault(); controls.at(-1).focus(); }
    else if (!event.shiftKey && (index < 0 || index === controls.length - 1)) { event.preventDefault(); controls[0].focus(); }
  });
  cancel.focus();
  return { modal, close };
}
