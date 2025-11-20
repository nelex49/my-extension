/** @format */

// SubfolderViewHTML module
// HTML generation functions for SubfolderView

/**
 * Generate HTML for parent folder tabs
 * @param {Object} folderData - Current folder data
 * @param {string} selectedParentFolder - Currently selected parent folder
 * @returns {string} HTML string for parent folder tabs
 */
function generateParentFolderTabsHTML(folderData, selectedParentFolder) {
  const folderNames = Object.keys(folderData);
  return folderNames
    .map((folderName) => {
      const folderInfo = folderData[folderName];
      const totalSubsInFolder = Object.values(
        folderInfo?.subfolders || {}
      ).reduce(
        (sum, subfolder) => sum + (subfolder.subscriptions?.length || 0),
        0
      );
      const iconColor = folderInfo?.color || "#667eea";
      const iconLetter = folderName.charAt(0).toUpperCase();
      const isActive = folderName === selectedParentFolder;

      return `
      <div class="parent-folder-tab ${
        isActive ? "active" : ""
      }" data-name="${folderName}" data-folder-name="${folderName}">
        <div class="icon" style="background: ${iconColor}">${iconLetter}</div>
        <span>${folderName}</span>
        <div class="count">${totalSubsInFolder}</div>
      </div>
    `;
    })
    .join("");
}

/**
 * Generate HTML for subfolder options
 * @param {Object} folderData - Current folder data
 * @param {string} selectedParentFolder - Currently selected parent folder
 * @param {string} selectedSubfolder - Currently selected subfolder
 * @param {number} uncategorizedCount - Count of uncategorized subscriptions
 * @returns {string} HTML string for subfolder options
 */
function generateSubfolderOptionsHTML(
  folderData,
  selectedParentFolder,
  selectedSubfolder,
  uncategorizedCount
) {
  let subfolderOptionsHTML = "";

  // Add Uncategorized option at the top
  const isUncategorizedCurrent =
    selectedParentFolder === "Uncategorized" ||
    selectedSubfolder === "Uncategorized";
  subfolderOptionsHTML += `
    <div class="subfolder-option uncategorized ${
      isUncategorizedCurrent ? "current" : ""
    }" 
         id="uncategorized" 
         data-target="uncategorized"
         data-folder-name="Uncategorized"
         data-subfolder-name="Uncategorized"
         style="border-left: 3px solid #ff9800;">
      <div class="folder-icon" style="background: #ff9800;">📦</div>
      <div class="folder-name">Uncategorized</div>
      <div class="sub-count" id="uncategorized-count">${uncategorizedCount}</div>
    </div>
  `;

  // Add regular subfolders - filter by selectedParentFolder if specified
  // If selectedParentFolder is "Uncategorized" or empty, show all subfolders
  // Otherwise, show only subfolders from the selected parent folder
  const foldersToShow =
    selectedParentFolder && selectedParentFolder !== "Uncategorized"
      ? [selectedParentFolder]
      : Object.keys(folderData);

  foldersToShow.forEach((folderName) => {
    const folderInfo = folderData[folderName];
    if (folderInfo && folderInfo.subfolders) {
      const subfolders = folderInfo.subfolders;
      subfolderOptionsHTML += Object.entries(subfolders)
        .map(([subfolderName, subfolderInfo]) => {
          const subCount = subfolderInfo.subscriptions?.length || 0;
          const isCurrent =
            folderName === selectedParentFolder &&
            subfolderName === selectedSubfolder;
          const iconColor = subfolderInfo.color || "#1976d2";
          const iconText = subfolderName.substring(0, 3).toUpperCase();

          return `
          <div class="subfolder-option ${isCurrent ? "current" : ""}" 
               id="${subfolderName.replace(/\s+/g, "-").toLowerCase()}" 
               data-target="${subfolderName.replace(/\s+/g, "-").toLowerCase()}"
               data-folder-name="${folderName}"
               data-subfolder-name="${subfolderName}">
            <div class="folder-icon" style="background: ${iconColor}">${iconText}</div>
            <div class="folder-name">${subfolderName}</div>
            <div class="sub-count" id="${subfolderName
              .replace(/\s+/g, "-")
              .toLowerCase()}-count">${subCount}</div>
          </div>
        `;
        })
        .join("");
    }
  });

  return subfolderOptionsHTML;
}

/**
 * Generate HTML for subfolder options grouped by parent folder (for move mode)
 * @param {Object} folderData - Current folder data
 * @param {string} currentSubfolderName - Currently selected subfolder name (to exclude from targets)
 * @param {string} currentFolderName - Currently selected folder name (to exclude from targets)
 * @param {number} uncategorizedCount - Count of uncategorized subscriptions
 * @returns {string} HTML string for grouped subfolder options
 */
function generateGroupedSubfoldersHTML(
  folderData,
  currentSubfolderName,
  currentFolderName,
  uncategorizedCount
) {
  let groupedHTML = "";

  // Add Uncategorized option at the top (if not current)
  if (
    currentFolderName !== "Uncategorized" &&
    currentSubfolderName !== "Uncategorized"
  ) {
    groupedHTML += `
      <div class="subfolder-option uncategorized" 
           id="uncategorized" 
           data-target="uncategorized"
           data-folder-name="Uncategorized"
           data-subfolder-name="Uncategorized"
           style="border-left: 3px solid #ff9800;">
        <div class="folder-icon" style="background: #ff9800;">📦</div>
        <div class="folder-name">Uncategorized</div>
        <div class="sub-count" id="uncategorized-count">${uncategorizedCount}</div>
      </div>
    `;
  }

  // Group subfolders by parent folder
  Object.keys(folderData).forEach((folderName) => {
    const folderInfo = folderData[folderName];
    if (folderInfo && folderInfo.subfolders) {
      const subfolders = folderInfo.subfolders;
      const subfolderEntries = Object.entries(subfolders);

      // Only show parent folder group if it has subfolders
      if (subfolderEntries.length > 0) {
        const folderId = folderName.replace(/\s+/g, "-").toLowerCase();
        const iconColor = folderInfo.color || "#667eea";
        const iconLetter = folderName.charAt(0).toUpperCase();

        groupedHTML += `
          <div class="parent-folder-group">
            <div class="parent-folder-group-header" data-folder-id="${folderId}">
              <div class="parent-folder-group-icon" style="background: ${iconColor}">${iconLetter}</div>
              <span class="parent-folder-group-name">${folderName}</span>
              <span class="parent-folder-group-toggle">▼</span>
            </div>
            <div class="parent-folder-group-content" id="group-${folderId}" style="display: block;">
        `;

        subfolderEntries.forEach(([subfolderName, subfolderInfo]) => {
          // Skip current subfolder - can't move to same folder
          if (
            folderName === currentFolderName &&
            subfolderName === currentSubfolderName
          ) {
            return;
          }

          const subCount = subfolderInfo.subscriptions?.length || 0;
          const iconColor = subfolderInfo.color || "#1976d2";
          const iconText = subfolderName.substring(0, 3).toUpperCase();

          groupedHTML += `
            <div class="subfolder-option" 
                 id="${subfolderName.replace(/\s+/g, "-").toLowerCase()}" 
                 data-target="${subfolderName
                   .replace(/\s+/g, "-")
                   .toLowerCase()}"
                 data-folder-name="${folderName}"
                 data-subfolder-name="${subfolderName}">
              <div class="folder-icon" style="background: ${iconColor}">${iconText}</div>
              <div class="folder-name">${subfolderName}</div>
              <div class="sub-count" id="${subfolderName
                .replace(/\s+/g, "-")
                .toLowerCase()}-count">${subCount}</div>
            </div>
          `;
        });

        groupedHTML += `
            </div>
          </div>
        `;
      }
    }
  });

  return groupedHTML;
}

/**
 * Generate HTML for a single subscription item
 * @param {Object} sub - Subscription object
 * @param {string} selectedParentFolder - Currently selected parent folder
 * @returns {string} HTML string for subscription item
 */
function generateSubscriptionItemHTML(sub, selectedParentFolder) {
  const channelId = sub.snippet?.resourceId?.channelId || sub.channelId || "";
  const fullSub = window.getFullSubscriptionData
    ? window.getFullSubscriptionData(channelId, sub)
    : sub;

  const channelName = fullSub.snippet?.title || sub.title || "Unknown Channel";
  const avatarUrl =
    fullSub.snippet?.thumbnails?.default?.url || sub.avatarUrl || "";
  const subscriberCount =
    fullSub.statistics?.subscriberCount || sub.subscriberCount || "0";
  const firstLetter = channelName.charAt(0).toUpperCase();

  return `
      <div class="subscription-item" data-channel-id="${channelId}">
        <div class="sub-avatar-medium" style="${
          avatarUrl
            ? `background-image: url(${avatarUrl}); background-size: cover;`
            : ""
        }">
          ${!avatarUrl ? firstLetter : ""}
        </div>
        <div class="sub-info">
          <div class="sub-name">${channelName}</div>
          <div class="sub-details">
            ${
              window.formatSubscriberCount
                ? window.formatSubscriberCount(subscriberCount)
                : subscriberCount
            } subscribers • ${
    selectedParentFolder === "Uncategorized"
      ? "Uncategorized"
      : selectedParentFolder || "Unorganized"
  } • Active
          </div>
        </div>
        <div class="sub-actions">
          <button class="action-btn-small move-btn" data-channel-name="${channelName.replace(
            /"/g,
            "&quot;"
          )}" data-channel-id="${channelId}">
            Move
          </button>
          <button class="action-btn-small remove-btn" data-channel-name="${channelName.replace(
            /"/g,
            "&quot;"
          )}" data-channel-id="${channelId}">
            Remove
          </button>
        </div>
      </div>
    `;
}

/**
 * Generate HTML for subscriptions list
 * @param {Array} subscriptions - Array of subscription objects
 * @param {string} selectedParentFolder - Currently selected parent folder
 * @returns {string} HTML string for subscriptions list
 */
function generateSubscriptionsListHTML(subscriptions, selectedParentFolder) {
  if (subscriptions.length === 0) {
    return `
      <div style="padding: 40px; text-align: center; color: #666;">
        <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📁</div>
        <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 16px; font-weight: 600;">No subscriptions</h4>
        <p style="margin: 0; color: #6c757d; font-size: 14px;">Select a subfolder to view subscriptions</p>
      </div>
    `;
  }

  return subscriptions
    .map((sub) => generateSubscriptionItemHTML(sub, selectedParentFolder))
    .join("");
}

/**
 * Generate complete modal HTML
 * @param {Object} params - Parameters object
 * @param {string} params.parentFolderTabsHTML - HTML for parent folder tabs
 * @param {string} params.subfolderOptionsHTML - HTML for subfolder options
 * @param {string} params.subscriptionsListHTML - HTML for subscriptions list
 * @param {string} params.selectedParentFolder - Currently selected parent folder
 * @param {string} params.selectedSubfolder - Currently selected subfolder
 * @param {number} params.totalSubs - Total subscriptions count
 * @param {number} params.activeSubs - Active subscriptions count
 * @param {number} params.inactiveSubs - Inactive subscriptions count
 * @param {number} params.totalSubscribers - Total subscribers count
 * @returns {string} Complete modal HTML string
 */
function generateModalHTML({
  parentFolderTabsHTML,
  subfolderOptionsHTML,
  subscriptionsListHTML,
  selectedParentFolder,
  selectedSubfolder,
  totalSubs,
  activeSubs,
  inactiveSubs,
  totalSubscribers,
}) {
  return `
    <div class="two-panel-layout">
      <!-- Close Button -->
      <button id="close-subfolder-view">✕</button>
      
      <!-- Parent Folder Header -->
      <div class="parent-folder-header">
        <div class="parent-folder-title-section">
          <h3>Parent Folders</h3>
          <div class="parent-folder-stats">
            <div class="stat-item-small">
              <div class="stat-number-small">${totalSubs}</div>
              <div class="stat-label-small">Total Subs</div>
            </div>
            <div class="stat-item-small">
              <div class="stat-number-small">${activeSubs}</div>
              <div class="stat-label-small">Active</div>
            </div>
            <div class="stat-item-small">
              <div class="stat-number-small">${inactiveSubs}</div>
              <div class="stat-label-small">Inactive</div>
            </div>
            <div class="stat-item-small">
              <div class="stat-number-small">${
                window.formatSubscriberCount
                  ? window.formatSubscriberCount(totalSubscribers)
                  : totalSubscribers
              }</div>
              <div class="stat-label-small">Total Subscribers</div>
            </div>
          </div>
        </div>
        <div class="parent-folder-tabs" id="parent-folder-tabs">
          ${
            parentFolderTabsHTML ||
            '<div style="padding: 20px; text-align: center; color: #666;">No folders yet. Create folders to organize subscriptions.</div>'
          }
        </div>
        <div class="parent-folder-toggle">
          <button onclick="toggleParentFolders()">Show More</button>
        </div>
      </div>
      
      <!-- Main Panels Container -->
      <div class="main-panels">
        <!-- Subfolders Panel -->
        <div class="subfolders-panel">
          <!-- Breadcrumb Navigation -->
          <div class="breadcrumb-nav">
            <div class="breadcrumb-path">
              <span class="breadcrumb-item" data-folder-name="${
                selectedParentFolder || ""
              }">${selectedParentFolder || "Select Folder"}</span>
              ${
                selectedSubfolder
                  ? `
                <span class="breadcrumb-separator">›</span>
                <span class="breadcrumb-item active">${selectedSubfolder}</span>
              `
                  : ""
              }
            </div>
            <span class="breadcrumb-count">${totalSubs} subs</span>
          </div>

          <h3>Subfolders</h3>

          <div id="move-instructions" class="move-instructions hidden">
            <div class="instruction-text">
              Click destination subfolder below
            </div>
          </div>

          ${
            subfolderOptionsHTML ||
            '<div style="padding: 20px; text-align: center; color: #666;">No subfolders in this folder.</div>'
          }
        </div>

        <!-- Subscriptions Panel -->
        <div class="subscriptions-panel">
          <!-- Search and Filter Bar -->
          <div class="search-filter-bar">
            <div class="search-section">
              <div class="search-input-container">
                <span class="search-icon">⌕</span>
                <input
                  type="text"
                  placeholder="Search ${
                    selectedSubfolder || "subscriptions"
                  }..."
                  id="subfolder-search-input"
                />
              </div>
            </div>
            <div class="filter-section">
              <select class="filter-select" id="subfolder-sort-select">
                <option>Sort A-Z</option>
                <option>Sort Z-A</option>
                <option>Most Active</option>
                <option>Recently Added</option>
                <option>Most Subscribers</option>
              </select>
              <button class="action-btn">All</button>
              <button class="action-btn" onclick="clearFilters()">Clear</button>
              <button class="action-btn">Export</button>
              <button class="action-btn">Import</button>
            </div>
          </div>

          <!-- Subscriptions List -->
          <div class="subscriptions-container">
            <div class="subscriptions-list">
              ${subscriptionsListHTML}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Make functions globally available
window.generateParentFolderTabsHTML = generateParentFolderTabsHTML;
window.generateSubfolderOptionsHTML = generateSubfolderOptionsHTML;
window.generateGroupedSubfoldersHTML = generateGroupedSubfoldersHTML;
window.generateSubscriptionItemHTML = generateSubscriptionItemHTML;
window.generateSubscriptionsListHTML = generateSubscriptionsListHTML;
window.generateModalHTML = generateModalHTML;
