// Subscription assignment operations; folder mutations live in FolderService.js.
function removeSubscriptionFromAllFolders(channelId) {
  let removed = false;

  // Remove from all subfolders only (parent folders don't hold subscriptions directly)
  const currentFolderData = window.folderData || {};
  Object.keys(currentFolderData).forEach((folderName) => {
    if (currentFolderData[folderName].subfolders) {
      Object.keys(currentFolderData[folderName].subfolders).forEach(
        (subfolderName) => {
          const subfolder =
            currentFolderData[folderName].subfolders[subfolderName];
          if (subfolder && subfolder.subscriptions) {
            const index = subfolder.subscriptions.findIndex(
              (sub) => sub.snippet?.resourceId?.channelId === channelId
            );
            if (index !== -1) {
              subfolder.subscriptions.splice(index, 1);
              removed = true;
              logStatus(
                `Removed subscription from ${folderName}/${subfolderName}`,
                "info"
              );
            }
          }
        }
      );
    }
  });

  if (removed) {
    // Save updated data
    safeSaveFolderData(currentFolderData);

    // Update the global variable to keep it in sync
    window.folderData = currentFolderData;

    // Refresh the dropdown to show updated counters
    setTimeout(() => {
      if (typeof window.refreshFolderDropdown === "function") {
        window.refreshFolderDropdown();
      }
    }, 100);
  }

  return removed;
}

// Additional functions needed for subscription management

function removeFromSubfolder(channelId, folderName, subfolderName) {
  if (folderData[folderName]?.subfolders?.[subfolderName]) {
    folderData[folderName].subfolders[subfolderName].subscriptions = folderData[
      folderName
    ].subfolders[subfolderName].subscriptions.filter(
      (sub) => sub.snippet?.resourceId?.channelId !== channelId
    );

    // Save to storage
    safeSaveFolderData(folderData);

    // Update the global variable to keep it in sync
    window.folderData = folderData;

    // Refresh the dropdown to show updated counters
    setTimeout(() => {
      if (typeof window.refreshFolderDropdown === "function") {
        window.refreshFolderDropdown();
      }
    }, 100);
  }
}

function addToSubfolder(channelId, folderName, subfolderName) {
  const subscription = userSubscriptions.find(
    (sub) => sub.snippet?.resourceId?.channelId === channelId
  );

  if (subscription && folderData[folderName]?.subfolders?.[subfolderName]) {
    // Remove from all other folders first
    removeSubscriptionFromAllFolders(channelId);

    // Add to the specified subfolder
    folderData[folderName].subfolders[subfolderName].subscriptions.push(
      subscription
    );

    // Save to storage
    safeSaveFolderData(folderData);

    // Update the global variable to keep it in sync
    window.folderData = folderData;

    // Refresh the dropdown to show updated counters
    setTimeout(() => {
      if (typeof window.refreshFolderDropdown === "function") {
        window.refreshFolderDropdown();
      }
    }, 100);
  }
}


Object.assign(window, { removeSubscriptionFromAllFolders, removeFromSubfolder, addToSubfolder });
