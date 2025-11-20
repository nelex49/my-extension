/** @format */

// SubfolderViewHelpers module
// Utility functions for SubfolderView

/**
 * Get all subscriptions that are not assigned to any subfolder
 * @returns {Array} Array of uncategorized subscription objects
 */
function getUncategorizedSubscriptions() {
  const userSubs =
    window.userSubscriptions ||
    (typeof userSubscriptions !== "undefined" ? userSubscriptions : []);
  const currentFolderData = window.folderData || {};

  // Get all channel IDs that are in subfolders
  const organizedChannelIds = new Set();
  Object.keys(currentFolderData).forEach((folderName) => {
    const folderInfo = currentFolderData[folderName];
    if (folderInfo && folderInfo.subfolders) {
      Object.keys(folderInfo.subfolders).forEach((subfolderName) => {
        const subfolderInfo = folderInfo.subfolders[subfolderName];
        if (subfolderInfo && subfolderInfo.subscriptions) {
          subfolderInfo.subscriptions.forEach((sub) => {
            const channelId =
              sub.snippet?.resourceId?.channelId || sub.channelId;
            if (channelId) {
              organizedChannelIds.add(channelId);
            }
          });
        }
      });
    }
  });

  // Return subscriptions that are NOT in any subfolder
  return userSubs.filter((sub) => {
    const channelId = sub.snippet?.resourceId?.channelId;
    return channelId && !organizedChannelIds.has(channelId);
  });
}

/**
 * Format subscriber count to readable format (K, M, B)
 * @param {string|number} count - Subscriber count
 * @returns {string} Formatted count (e.g., "1.2M", "500K")
 */
function formatSubscriberCount(count) {
  if (!count || count === "0") return "0";
  const num = parseInt(count);
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

/**
 * Get full subscription data by channel ID
 * @param {string} channelId - Channel ID to find
 * @param {Object} sub - Partial subscription object
 * @returns {Object} Full subscription object
 */
function getFullSubscriptionData(channelId, sub) {
  const userSubs =
    window.userSubscriptions ||
    (typeof userSubscriptions !== "undefined" ? userSubscriptions : []);
  return (
    userSubs.find((s) => s.snippet?.resourceId?.channelId === channelId) || sub
  );
}

// Make functions globally available
window.getUncategorizedSubscriptions = getUncategorizedSubscriptions;
window.formatSubscriberCount = formatSubscriberCount;
window.getFullSubscriptionData = getFullSubscriptionData;
