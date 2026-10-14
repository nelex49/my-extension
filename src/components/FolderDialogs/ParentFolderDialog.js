function showUnifiedFolderManager(folderName = null, mode = 'create', onCreated = null, anchor = null, onDeleted = null) {
  return showFolderForm({ kind: 'parent', mode, originalName: folderName, anchor, onSaved: onCreated, onDeleted });
}
window.showUnifiedFolderManager = showUnifiedFolderManager;
