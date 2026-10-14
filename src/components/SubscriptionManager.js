// Assignment changes use the same single-write protection as folder edits.
function assignmentChannelId(sub) { return sub.snippet?.resourceId?.channelId; }
function clearChannelAssignments(data, channelId) {
  let removed = false;
  const clear = record => {
    const before = record.subscriptions || [];
    const after = before.filter(sub => assignmentChannelId(sub) !== channelId);
    if (after.length !== before.length) { record.subscriptions = after; removed = true; }
  };
  Object.values(data).forEach(parent => {
    clear(parent); Object.values(parent.subfolders || {}).forEach(clear);
  });
  return removed;
}
function removeSubscriptionFromAllFolders(channelId, done) {
  const previous = cloneFolderData(), next = cloneFolderData(previous);
  if (!clearChannelAssignments(next, channelId)) { done?.(false); return false; }
  return persistFolderMutation(next, previous, done);
}
function removeFromSubfolder(channelId, parentName, childName, done) {
  const previous = cloneFolderData(), next = cloneFolderData(previous);
  const record = childName === null ? next[parentName] : next[parentName]?.subfolders?.[childName];
  if (!record) { done?.(false); return false; }
  record.subscriptions = (record.subscriptions || []).filter(sub => assignmentChannelId(sub) !== channelId);
  return persistFolderMutation(next, previous, done);
}
function addToSubfolder(channelId, parentName, childName, done) {
  const subscription = (window.userSubscriptions || []).find(sub => assignmentChannelId(sub) === channelId);
  const previous = cloneFolderData(), next = cloneFolderData(previous);
  const destination = next[parentName]?.subfolders?.[childName];
  if (!subscription || !destination) {
    showUserNotification("Channel or folder data is unavailable. Refresh subscriptions and try again.", "warn");
    done?.(false); return false;
  }
  clearChannelAssignments(next, channelId);
  destination.subscriptions ||= [];
  destination.subscriptions.push(subscription);
  return persistFolderMutation(next, previous, done);
}
Object.assign(window, { removeSubscriptionFromAllFolders, removeFromSubfolder, addToSubfolder });
