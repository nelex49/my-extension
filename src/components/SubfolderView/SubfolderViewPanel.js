/** @format */

// SubfolderViewPanel component
// Creates the SubfolderView modal panel for organizing subscriptions

function showSubfolderView() {
  console.log("showSubfolderView called");

  // Check if userSubscriptions is available globally
  // Try both window.userSubscriptions and the global variable
  const subscriptions =
    window.userSubscriptions ||
    (typeof userSubscriptions !== "undefined" ? userSubscriptions : []);
  console.log("Subscriptions found:", subscriptions.length);

  // Try to load subscriptions from storage if they're not loaded
  if (subscriptions.length === 0) {
    console.log("No subscriptions, loading from storage...");
    chrome.storage.local.get(["userSubscriptions"], (result) => {
      if (result.userSubscriptions && result.userSubscriptions.length > 0) {
        window.userSubscriptions = result.userSubscriptions;
        // Also update global variable if it exists
        if (typeof userSubscriptions !== "undefined") {
          userSubscriptions = result.userSubscriptions;
        }
        console.log(
          "Loaded subscriptions from storage:",
          result.userSubscriptions.length
        );
        // Recursively call this function now that we have data
        showSubfolderView();
        return;
      } else {
        console.log("No subscriptions in storage");
        if (typeof window.showLoginPrompt === "function") {
          window.showLoginPrompt();
        }
        return;
      }
    });
    return;
  }

  // Remove any existing modals first
  const existingModal = document.querySelector("#subfolder-view-modal");
  if (existingModal) {
    existingModal.remove();
  }

  // Load current folder data
  const currentFolderData = window.folderData || {};
  const folderNames = Object.keys(currentFolderData);
  console.log("Folder data found:", folderNames.length, "folders");

  // Get uncategorized subscriptions for initial display
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

  // Start with Uncategorized view by default
  let selectedParentFolder = "Uncategorized";
  let selectedSubfolder = "Uncategorized";
  let currentSubscriptions = getUncategorizedSubscriptions();
  let totalSubs = currentSubscriptions.length;
  let activeSubs = totalSubs; // Placeholder
  let inactiveSubs = 0; // Placeholder
  let totalSubscribers = totalSubs * 1000000; // Placeholder

  // Inject CSS if not already injected
  if (!document.getElementById("subfolder-view-styles")) {
    // Load CSS file content and inject as style tag
    // For now, we'll inject a minimal style tag - full CSS should be loaded via manifest
    const style = document.createElement("style");
    style.id = "subfolder-view-styles";
    style.textContent = `
      /* SubfolderView Styles - Full CSS loaded via manifest */
      .two-panel-layout { display: flex; flex-direction: column; max-width: 550px; margin: 0 auto; background: white; border-radius: 12px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); overflow: hidden; }
      .parent-folder-header { background: #f8f9fa; padding: 16px; border-bottom: 1px solid #e0e0e0; }
      .parent-folder-title-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .parent-folder-header h3 { margin: 0; font-size: 12px; font-weight: 700; color: #2e7d32; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; background: #e8f5e8; border-radius: 6px; border-left: 4px solid #2e7d32; text-align: center; flex-shrink: 0; }
      .parent-folder-stats { display: flex; gap: 16px; align-items: center; }
      .stat-item-small { text-align: center; min-width: 50px; }
      .stat-number-small { font-size: 16px; font-weight: bold; color: #1976d2; line-height: 1; margin-bottom: 2px; }
      .stat-label-small { font-size: 9px; color: #666; text-transform: uppercase; letter-spacing: 0.3px; line-height: 1; }
      .parent-folder-tabs { display: flex; gap: 6px; flex-wrap: wrap; max-height: 80px; overflow: hidden; margin-bottom: 0; transition: max-height 0.3s ease; }
      .parent-folder-tabs.expanded { max-height: none; }
      .parent-folder-tab { background: white; border: 2px solid #e0e0e0; border-radius: 20px; padding: 6px 12px; cursor: pointer; transition: all 0.3s ease; font-size: 11px; font-weight: 500; display: flex; align-items: center; gap: 4px; flex-shrink: 0; flex: 0 0 calc(25% - 4.5px); min-width: 0; }
      .parent-folder-tab:hover { background: #f0f0f0; border-color: #1976d2; }
      .parent-folder-tab.active { background: #1976d2; color: white; border-color: #1976d2; }
      .parent-folder-tab .icon { width: 16px; height: 16px; border-radius: 3px; display: flex; align-items: center; justify-content: center; color: white; font-size: 8px; font-weight: bold; }
      .parent-folder-tab .count { background: rgba(255, 255, 255, 0.2); border-radius: 10px; padding: 2px 6px; font-size: 9px; }
      .parent-folder-toggle { text-align: center; margin-top: 8px; }
      .parent-folder-toggle button { background: #f8f9fa; border: 1px solid #e0e0e0; color: #1976d2; font-size: 11px; font-weight: 500; cursor: pointer; padding: 6px 12px; border-radius: 6px; transition: all 0.2s ease; }
      .parent-folder-toggle button:hover { background: #e3f2fd; border-color: #1976d2; transform: translateY(-1px); }
      .main-panels { display: flex; height: 500px; }
      .subfolders-panel { flex: 0 0 220px; padding: 12px; height: 500px; overflow-y: auto; border-right: 1px solid #e0e0e0; }
      .subfolders-panel h3 { margin: 0 0 16px 0; font-size: 12px; font-weight: 700; color: #1976d2; text-transform: uppercase; letter-spacing: 1px; padding: 8px 12px; background: #e3f2fd; border-radius: 6px; border-left: 4px solid #1976d2; text-align: center; }
      .breadcrumb-nav { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; padding: 8px 12px; background: #e3f2fd; border-radius: 6px; border: 1px solid #bbdefb; font-size: 12px; }
      .breadcrumb-path { display: flex; align-items: center; gap: 6px; }
      .breadcrumb-item { color: #666; font-size: 12px; cursor: pointer; transition: color 0.3s ease; }
      .breadcrumb-item:hover { color: #1976d2; }
      .breadcrumb-item.active { color: #1976d2; font-weight: 500; }
      .breadcrumb-separator { color: #ccc; font-size: 12px; }
      .breadcrumb-count { color: #666; font-size: 11px; margin-top: 2px; }
      .move-instructions { background: #fff3e0; border: 2px solid #ff9800; border-radius: 8px; padding: 12px; margin-bottom: 16px; text-align: center; }
      .instruction-text { color: #e65100; font-size: 12px; font-weight: 600; margin: 0; }
      .subfolder-option { display: flex; align-items: center; gap: 8px; padding: 8px 12px; margin-bottom: 4px; border-radius: 6px; cursor: pointer; transition: all 0.2s ease; border: 2px solid transparent; }
      .subfolder-option:hover { background: #f8f9fa; border-color: #e9ecef; }
      .subfolder-option.move-target { background: #e3f2fd; border-color: #1976d2; color: #1976d2; }
      .subfolder-option.current { background: #f0f0f0; color: #666; cursor: default; }
      .subfolder-option .folder-icon { width: 20px; height: 20px; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; font-weight: bold; flex-shrink: 0; }
      .subfolder-option .folder-name { font-size: 12px; font-weight: 500; flex: 1; }
      .subfolder-option .sub-count { font-size: 10px; color: #666; background: #f0f0f0; padding: 2px 6px; border-radius: 10px; }
      .subscriptions-panel { flex: 1; overflow: hidden; }
      .search-filter-bar { display: flex; flex-direction: column; padding: 12px 16px; gap: 16px; border-bottom: 1px solid #e0e0e0; }
      .search-section { width: 100%; max-width: 400px; }
      .search-input-container { position: relative; display: flex; align-items: center; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 10px 14px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); width: 100%; transition: all 0.2s ease; }
      .search-input-container:focus-within { border-color: #1976d2; background: white; box-shadow: 0 4px 12px rgba(25, 118, 210, 0.15); transform: translateY(-1px); }
      .search-input-container .search-icon { color: #6c757d; font-size: 18px; font-weight: bold; margin-right: 12px; transition: color 0.3s ease; opacity: 0.7; }
      .search-input-container:focus-within .search-icon { color: #1976d2; }
      .search-input-container input { border: none; outline: none; flex: 1; font-size: 14px; background: transparent; color: #333; }
      .filter-section { display: flex; gap: 6px; align-items: center; flex-wrap: nowrap; justify-content: flex-start; overflow-x: auto; }
      .filter-select { border: 1px solid #e0e0e0; border-radius: 6px; padding: 5px 6px; background: white; cursor: pointer; font-size: 10px; min-width: 80px; max-width: 100px; }
      .action-btn { background: #f8f9fa; color: #495057; border: 1px solid #e9ecef; border-radius: 6px; padding: 6px 10px; cursor: pointer; font-size: 10px; font-weight: 500; transition: all 0.2s ease; white-space: nowrap; min-width: 0; height: 28px; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
      .action-btn:hover { background: #f1f3f4; border-color: #dadce0; color: #333; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
      .subscriptions-container { height: 400px; overflow: hidden; margin: 0; }
      .subscriptions-list { height: 100%; overflow-y: auto; padding: 0; }
      .subscription-item { display: flex; align-items: center; padding: 8px 8px 8px 12px; border-bottom: 1px solid #f0f0f0; transition: all 0.3s ease; gap: 10px; position: relative; min-height: 48px; }
      .subscription-item:hover { background: #f8f9fa; }
      .subscription-item.selected { background: #e3f2fd; border-left: 4px solid #1976d2; }
      .sub-actions { display: flex; gap: 4px; align-items: center; height: 24px; flex-shrink: 0; }
      .action-btn-small { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 4px; cursor: pointer; font-size: 9px; font-weight: 500; transition: all 0.2s ease; position: relative; color: #495057; width: 45px; min-width: 45px; max-width: 45px; padding: 4px 2px; box-sizing: border-box; text-align: center; display: inline-flex; align-items: center; justify-content: center; height: 24px; line-height: 1; vertical-align: middle; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05); }
      .action-btn-small:hover { background: #f1f3f4; border-color: #dadce0; color: #333; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); }
      .remove-btn { background: #fff5f5 !important; border-color: #fecaca !important; color: #dc2626 !important; font-weight: 600 !important; }
      .remove-btn:hover { background: #fef2f2 !important; border-color: #fca5a5 !important; color: #b91c1c !important; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(220, 38, 38, 0.2); }
      .sub-avatar-medium { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(45deg, #ff6b6b, #4ecdc4); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; flex-shrink: 0; }
      .sub-info { width: 300px; min-width: 0; display: flex; flex-direction: column; justify-content: center; margin-right: 8px; }
      .sub-info .sub-name { font-size: 14px; font-weight: 500; color: #333; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 200px; }
      .sub-details { font-size: 11px; color: #666; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    `;
    document.head.appendChild(style);
  }

  // Create modal
  const modal = document.createElement("div");
  modal.id = "subfolder-view-modal";
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 99999;
    background: rgba(0,0,0,0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;

  // Generate parent folder tabs HTML
  const parentFolderTabsHTML = folderNames
    .map((folderName, index) => {
      const folderInfo = currentFolderData[folderName];
      const subfolderCount = Object.keys(folderInfo?.subfolders || {}).length;
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

  // Get uncategorized count
  const uncategorizedSubs = getUncategorizedSubscriptions();
  const uncategorizedCount = uncategorizedSubs.length;

  // Generate subfolder options HTML - start with Uncategorized option
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

  // Add regular subfolders from all folders (or just selected folder)
  // For now, show subfolders from all folders
  Object.keys(currentFolderData).forEach((folderName) => {
    const folderInfo = currentFolderData[folderName];
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

  // Generate subscriptions list HTML
  // Note: currentSubscriptions contains subscription objects from folderData
  // These may not have all the same properties as userSubscriptions
  const subscriptionsListHTML = currentSubscriptions
    .map((sub) => {
      // Handle both formats: full subscription object or just channelId reference
      const channelId =
        sub.snippet?.resourceId?.channelId || sub.channelId || "";
      // Try to find full subscription data from userSubscriptions
      const userSubs =
        window.userSubscriptions ||
        (typeof userSubscriptions !== "undefined" ? userSubscriptions : []);
      const fullSub =
        userSubs.find((s) => s.snippet?.resourceId?.channelId === channelId) ||
        sub;

      const channelName =
        fullSub.snippet?.title || sub.title || "Unknown Channel";
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
            ${formatSubscriberCount(subscriberCount)} subscribers • ${
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
    })
    .join("");

  modal.innerHTML = `
    <div class="two-panel-layout" style="max-width: 800px; width: 95%; max-height: 90vh; background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3); position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10000; display: flex; flex-direction: column;">
      <!-- Close Button -->
      <button id="close-subfolder-view" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.1); border: none; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; color: #333; z-index: 10001; transition: all 0.2s;" onmouseover="this.style.background='rgba(0,0,0,0.2)'" onmouseout="this.style.background='rgba(0,0,0,0.1)'">✕</button>
      
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
              <div class="stat-number-small">${formatSubscriberCount(
                totalSubscribers
              )}</div>
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
      <div class="main-panels" style="flex: 1; overflow: hidden;">
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

          <div id="move-instructions" class="move-instructions" style="display: none">
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
              ${
                subscriptionsListHTML ||
                `
                <div style="padding: 40px; text-align: center; color: #666;">
                  <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📁</div>
                  <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 16px; font-weight: 600;">No subscriptions</h4>
                  <p style="margin: 0; color: #6c757d; font-size: 14px;">Select a subfolder to view subscriptions</p>
                </div>
              `
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  console.log("Modal appended to body");

  // Initialize components
  if (typeof window.initializeParentFolderTabs === "function") {
    window.initializeParentFolderTabs();
    console.log("Parent folder tabs initialized");
  } else {
    console.warn("initializeParentFolderTabs not found");
  }
  if (typeof window.initializeSearch === "function") {
    window.initializeSearch();
    console.log("Search initialized");
  } else {
    console.warn("initializeSearch not found");
  }

  // Close handler
  const closeBtn = modal.querySelector("#close-subfolder-view");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      modal.remove();
    });
  }

  // Close on background click (but not on modal content)
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });

  // Add event delegation for Move and Remove buttons
  // Use the subscriptions list container for event delegation
  const subscriptionsList = modal.querySelector(".subscriptions-list");
  if (subscriptionsList) {
    subscriptionsList.addEventListener("click", function (e) {
      // Handle Move button clicks
      const moveBtn = e.target.closest(".move-btn");
      if (moveBtn) {
        e.preventDefault();
        e.stopPropagation();

        const channelName = moveBtn.dataset.channelName;
        const channelId = moveBtn.dataset.channelId;

        console.log("Move button clicked:", channelName, channelId);

        if (channelId && typeof window.startMove === "function") {
          window.startMove(channelName, channelId);
        } else {
          console.error(
            "Cannot move: channelId =",
            channelId,
            "startMove =",
            typeof window.startMove
          );
        }
        return;
      }

      // Handle Remove button clicks
      const removeBtn = e.target.closest(".remove-btn");
      if (removeBtn) {
        e.preventDefault();
        e.stopPropagation();

        const channelName = removeBtn.dataset.channelName;
        const channelId = removeBtn.dataset.channelId;

        console.log("Remove button clicked:", channelName, channelId);

        if (channelId && typeof window.removeSubscription === "function") {
          window.removeSubscription(channelName, channelId);
        } else {
          console.error(
            "Cannot remove: channelId =",
            channelId,
            "removeSubscription =",
            typeof window.removeSubscription
          );
        }
        return;
      }
    });
  }

  // Parent folder tab click handlers
  modal.querySelectorAll(".parent-folder-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      const folderName = this.dataset.folderName;
      // Reload view with selected folder
      // For now, just update active state
      modal
        .querySelectorAll(".parent-folder-tab")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
      // TODO: Load subfolders for this folder
    });
  });

  // Function to update the view when a subfolder is selected
  function updateSubfolderView(folderName, subfolderName) {
    console.log("Updating view for:", folderName, ">", subfolderName);

    let subscriptions = [];

    // Handle "Uncategorized" special case
    if (folderName === "Uncategorized" || subfolderName === "Uncategorized") {
      // Calculate uncategorized subscriptions inline (getUncategorizedSubscriptions is defined in outer scope)
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
      subscriptions = userSubs.filter((sub) => {
        const channelId = sub.snippet?.resourceId?.channelId;
        return channelId && !organizedChannelIds.has(channelId);
      });
      console.log("Uncategorized subscriptions:", subscriptions.length);
    } else {
      const currentFolderData = window.folderData || {};
      const folderInfo = currentFolderData[folderName];
      if (
        !folderInfo ||
        !folderInfo.subfolders ||
        !folderInfo.subfolders[subfolderName]
      ) {
        console.error("Subfolder not found:", folderName, subfolderName);
        return;
      }

      const subfolderInfo = folderInfo.subfolders[subfolderName];
      subscriptions = subfolderInfo.subscriptions || [];
    }

    // Update current subfolder highlighting
    modal.querySelectorAll(".subfolder-option").forEach((option) => {
      option.classList.remove("current");
    });
    const selectedSubfolderOption = modal.querySelector(
      `.subfolder-option[data-folder-name="${folderName}"][data-subfolder-name="${subfolderName}"]`
    );
    if (selectedSubfolderOption) {
      selectedSubfolderOption.classList.add("current");
    }

    // Update breadcrumb
    const breadcrumbPath = modal.querySelector(".breadcrumb-path");
    if (breadcrumbPath) {
      if (folderName === "Uncategorized" || subfolderName === "Uncategorized") {
        breadcrumbPath.innerHTML = `
          <span class="breadcrumb-item active">Uncategorized</span>
        `;
      } else {
        breadcrumbPath.innerHTML = `
          <span class="breadcrumb-item" data-folder-name="${folderName}">${folderName}</span>
          <span class="breadcrumb-separator">›</span>
          <span class="breadcrumb-item active">${subfolderName}</span>
        `;
      }
    }
    const breadcrumbCount = modal.querySelector(".breadcrumb-count");
    if (breadcrumbCount) {
      breadcrumbCount.textContent = `${subscriptions.length} subs`;
    }

    // Update stats
    const totalSubs = subscriptions.length;
    const activeSubs = totalSubs; // Placeholder
    const inactiveSubs = 0; // Placeholder
    const totalSubscribers = totalSubs * 1000000; // Placeholder

    const statTotal = modal.querySelector(
      ".stat-item-small .stat-number-small"
    );
    if (statTotal) {
      statTotal.textContent = totalSubs;
    }

    // Update subscriptions list
    const userSubs =
      window.userSubscriptions ||
      (typeof userSubscriptions !== "undefined" ? userSubscriptions : []);
    const subscriptionsListHTML = subscriptions
      .map((sub) => {
        const channelId =
          sub.snippet?.resourceId?.channelId || sub.channelId || "";
        const fullSub =
          userSubs.find(
            (s) => s.snippet?.resourceId?.channelId === channelId
          ) || sub;
        const channelName =
          fullSub.snippet?.title || sub.title || "Unknown Channel";
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
              ${formatSubscriberCount(subscriberCount)} subscribers • ${
          folderName === "Uncategorized"
            ? "Uncategorized"
            : folderName || "Unorganized"
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
      })
      .join("");

    const subscriptionsList = modal.querySelector(".subscriptions-list");
    if (subscriptionsList) {
      if (subscriptionsListHTML) {
        subscriptionsList.innerHTML = subscriptionsListHTML;
      } else {
        subscriptionsList.innerHTML = `
          <div style="padding: 40px; text-align: center; color: #666;">
            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📁</div>
            <h4 style="margin: 0 0 8px 0; color: #6c757d; font-size: 16px; font-weight: 600;">No subscriptions</h4>
            <p style="margin: 0; color: #6c757d; font-size: 14px;">This subfolder is empty</p>
          </div>
        `;
      }
    }

    // Clear search input
    const searchInput = modal.querySelector("#subfolder-search-input");
    if (searchInput) {
      searchInput.value = "";
      searchInput.placeholder = `Search ${subfolderName}...`;
    }
  }

  // Subfolder click handlers (for navigation, not move - move is handled in MoveManager)
  // Note: MoveManager will attach its own handlers when startMove is called
  const subfoldersPanel = modal.querySelector(".subfolders-panel");
  if (subfoldersPanel) {
    subfoldersPanel.addEventListener("click", function (e) {
      const subfolderOption = e.target.closest(".subfolder-option");
      if (
        subfolderOption &&
        !subfolderOption.classList.contains("move-target") &&
        !subfolderOption.classList.contains("current")
      ) {
        // Only handle navigation clicks, not move clicks
        const folderName = subfolderOption.dataset.folderName;
        const subfolderName = subfolderOption.dataset.subfolderName;
        console.log(
          "Subfolder clicked for navigation:",
          folderName,
          subfolderName
        );
        updateSubfolderView(folderName, subfolderName);
      }
    });
  }

  // Parent folder tab click handlers - also update subfolders list
  modal.querySelectorAll(".parent-folder-tab").forEach((tab) => {
    tab.addEventListener("click", function () {
      const folderName = this.dataset.folderName;
      const currentFolderData = window.folderData || {};
      const folderInfo = currentFolderData[folderName];

      // Update active state
      modal
        .querySelectorAll(".parent-folder-tab")
        .forEach((t) => t.classList.remove("active"));
      this.classList.add("active");

      // Update subfolders list - always include Uncategorized at the top
      const subfoldersContainer = modal.querySelector(".subfolders-panel");
      if (subfoldersContainer) {
        // Get uncategorized count
        const uncategorizedSubs = getUncategorizedSubscriptions();
        const uncategorizedCount = uncategorizedSubs.length;

        // Always start with Uncategorized option
        let subfolderOptionsHTML = `
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

        // Add regular subfolders if folder has them
        if (folderInfo && folderInfo.subfolders) {
          const subfolders = folderInfo.subfolders;
          subfolderOptionsHTML += Object.entries(subfolders)
            .map(([subfolderName, subfolderInfo]) => {
              const subCount = subfolderInfo.subscriptions?.length || 0;
              const iconColor = subfolderInfo.color || "#1976d2";
              const iconText = subfolderName.substring(0, 3).toUpperCase();

              return `
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
            })
            .join("");
        }

        // Find where to insert (after breadcrumb and h3)
        const h3 = subfoldersContainer.querySelector("h3");
        const moveInstructions =
          subfoldersContainer.querySelector("#move-instructions");
        const existingSubfolders =
          subfoldersContainer.querySelectorAll(".subfolder-option");
        existingSubfolders.forEach((el) => el.remove());

        if (h3 && h3.nextSibling) {
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = subfolderOptionsHTML;
          while (tempDiv.firstChild) {
            subfoldersContainer.insertBefore(
              tempDiv.firstChild,
              moveInstructions || subfoldersContainer.lastChild
            );
          }
        }
      }
    });
  });
}

// Helper function to format subscriber count
function formatSubscriberCount(count) {
  if (!count || count === "0") return "0";
  const num = parseInt(count);
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toString();
}

// Make function globally available
window.showSubfolderView = showSubfolderView;
window.formatSubscriberCount = formatSubscriberCount;

// Debug: Log that function is being exported
console.log(
  "SubfolderViewPanel: showSubfolderView function exported to window"
);
