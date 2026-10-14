function showUnifiedFolderManager(folderName = null, mode = 'create', onCreated = null, anchor = null, onDeleted = null, placement = 'beside') {
  return showFolderForm({ kind: 'parent', mode, originalName: folderName, anchor, placement, onSaved: onCreated, onDeleted });
}
window.showUnifiedFolderManager = showUnifiedFolderManager;
