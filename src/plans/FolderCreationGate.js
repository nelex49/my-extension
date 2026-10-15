// Forms check before opening; services check again immediately before creating.
function requireFolderCreation(kind, parentName = null) {
  const decision = FolderPlan.evaluate(window.folderData || {}, kind, parentName);
  if (decision.allowed) return true;
  showFolderLimitDialog(decision);
  return false;
}
