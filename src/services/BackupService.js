// Manage menu entry points; use the shared dark dialog lifecycle and worker service.
let folderBackupBusy = false;
async function exportFolderBackup() {
  if (folderBackupBusy) return;
  folderBackupBusy = true;
  showFolderBackupMessage('Downloading folder backup...', 'info');
  try {
    const result = await chrome.runtime.sendMessage({ action: 'exportFolderBackup' });
    if (!result?.success) throw new Error(result?.error || 'Backup could not be confirmed. Please try again.');
    showFolderBackupMessage('Backup downloaded', 'success');
  } catch (error) { showFolderBackupMessage(error.message, 'error'); }
  finally { folderBackupBusy = false; }
}
function chooseFolderBackup() {
  if (folderBackupBusy) return;
  const input = document.createElement('input');
  input.type = 'file'; input.accept = '.json,application/json';
  input.addEventListener('change', async () => {
    const file = input.files?.[0]; if (!file) return;
    try {
      if (file.size > BackupFormat.MAX_BYTES) throw new Error('The backup is too large (maximum 8 MB).');
      const text = await file.text(), backup = BackupFormat.parse(text);
      if (!window.accountIsReady?.() || backup.owner.id !== window.folderOwner?.id)
        throw new Error('Sign in to the YouTube account that owns this backup before restoring it.');
      showFolderRestoreDialog(text, backup);
    } catch (error) { showFolderBackupMessage(error.message, 'error'); }
  }, { once: true });
  input.click();
}
function showFolderRestoreDialog(text, backup) {
  if (folderBackupBusy || document.querySelector('.ytsm-restore-dialog')) return;
  const { modal, close } = openFolderDialog('restore', `<section class="ytsm-dialog-panel">
    <header class="ytsm-dialog-header"><h2 id="ytsm-folder-dialog-title">Restore folder backup?</h2></header>
    <div class="ytsm-folder-form"><p class="ytsm-backup-date"></p>
    <p>This will replace all current folders and channel assignments. Changes made since this backup will be removed.</p>
    <p class="ytsm-backup-note">Before restoring, a safety backup of your current setup will download. If that download fails or is cancelled, restore will stop. Your YouTube subscriptions will not change.</p>
    <p class="ytsm-backup-status" role="status"></p>
    <div class="ytsm-dialog-actions"><button type="button" data-dialog-close>Cancel</button><span></span><button type="button" class="ytsm-primary" data-action="restore-confirm">Restore backup</button></div></div></section>`, null, 'beside', () => !folderBackupBusy);
  modal.querySelector('.ytsm-backup-date').textContent = `Backup from ${new Date(backup.createdAt).toLocaleString()} (${Object.keys(backup.folderData).length} parent folders).`;
  const button = modal.querySelector('[data-action="restore-confirm"]');
  button.focus();
  button.addEventListener('click', async () => {
    if (folderBackupBusy) return;
    folderBackupBusy = true; button.disabled = true;
    modal.querySelector('[data-dialog-close]').disabled = true;
    const status = modal.querySelector('.ytsm-backup-status');
    status.textContent = 'Downloading safety backup, then restoring. Please wait...';
    try {
      const result = await chrome.runtime.sendMessage({ action: 'restoreFolderBackup', text });
      if (!result?.success) throw new Error(result?.error || 'Restore could not be confirmed. Check your folders before trying again.');
      folderBackupBusy = false; close();
      showFolderBackupMessage('Folders restored. Safety copy downloaded.', 'success');
    } catch (error) {
      status.textContent = error.message;
      button.disabled = false; modal.querySelector('[data-dialog-close]').disabled = false;
      showFolderBackupMessage(error.message, 'error');
    } finally { folderBackupBusy = false; }
  });
}
Object.assign(window, { exportFolderBackup, chooseFolderBackup });
