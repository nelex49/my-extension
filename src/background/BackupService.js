// Background-only downloads and restore. A restore never writes before its safety download completes.
let backupOperationPending = false;
async function backupAccountSnapshot() {
  const data = await chrome.storage.local.get(['folderData', 'folderOwner', 'accountStatus', 'accessToken']);
  if (!data.accessToken || data.accountStatus?.state !== 'ready' || data.accountStatus.session !== data.accessToken ||
      !data.folderOwner?.id || data.accountStatus.account?.id !== data.folderOwner.id)
    throw new Error('Sign in and verify the linked YouTube account before using backup or restore.');
  return data;
}
async function downloadFolderBackup(backup, safety = false) {
  const text = JSON.stringify(backup, null, 2);
  if (new TextEncoder().encode(text).length > BackupFormat.MAX_BYTES) throw new Error('The backup is too large (maximum 8 MB).');
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `youtube-folders-${safety ? 'before-restore-' : 'backup-'}${stamp}.json`;
  const id = await chrome.downloads.download({ url: 'data:application/json;charset=utf-8,' + encodeURIComponent(text), filename, conflictAction: 'uniquify', saveAs: false });
  // Polling also covers a download that finishes before a listener could be registered.
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    const [item] = await chrome.downloads.search({ id });
    if (item?.state === 'complete') return filename;
    if (!item || item.state === 'interrupted') throw new Error('The backup download failed or was cancelled. Your folders were not replaced.');
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  throw new Error('The backup download was not confirmed. Your folders were not replaced. Please try again.');
}
async function runFolderBackup(request) {
  if (backupOperationPending) return { success: false, error: 'A backup or restore is already in progress.' };
  backupOperationPending = true;
  try {
    const current = await backupAccountSnapshot();
    if (request.action === 'exportFolderBackup') {
      const filename = await downloadFolderBackup(BackupFormat.create(current.folderData || {}, current.folderOwner));
      return { success: true, filename };
    }
    const imported = BackupFormat.parse(request.text);
    if (imported.owner.id !== current.folderOwner.id) throw new Error('This backup belongs to a different YouTube account. Nothing was changed.');
    const filename = await downloadFolderBackup(BackupFormat.create(current.folderData || {}, current.folderOwner), true);
    const latest = await backupAccountSnapshot();
    if (latest.accessToken !== current.accessToken || latest.folderOwner.id !== current.folderOwner.id ||
        JSON.stringify(latest.folderData || {}) !== JSON.stringify(current.folderData || {}))
      throw new Error('Your account or folders changed while the safety copy was downloading. Nothing was restored. Please try again.');
    // Only folder data is replaced. Owner, credentials and live YouTube subscriptions stay intact.
    await chrome.storage.local.set({ folderData: imported.folderData });
    return { success: true, filename };
  } catch (error) { return { success: false, error: error.message || 'Backup or restore failed. Your existing folders were kept.' }; }
  finally { backupOperationPending = false; }
}
