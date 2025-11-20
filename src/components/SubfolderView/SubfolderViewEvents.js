/** @format */

// SubfolderViewEvents module
// Event handlers for SubfolderView

/**
 * Setup event handlers for the SubfolderView modal
 * @param {HTMLElement} modal - The modal element
 * @param {Function} updateSubfolderView - Function to update the view when subfolder changes
 */
function setupSubfolderViewEvents(modal, updateSubfolderView) {
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

        if (channelId && typeof window.startMove === "function") {
          window.startMove(channelName, channelId);
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

        if (channelId && typeof window.removeSubscription === "function") {
          window.removeSubscription(channelName, channelId);
        }
        return;
      }
    });
  }

  // Subfolder click handlers (for navigation, not move - move is handled in MoveManager)
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
        const uncategorizedSubs = window.getUncategorizedSubscriptions
          ? window.getUncategorizedSubscriptions()
          : [];
        const uncategorizedCount = uncategorizedSubs.length;

        // Use helper function to generate subfolder options HTML
        const currentFolderData = window.folderData || {};
        const subfolderOptionsHTML = window.generateSubfolderOptionsHTML
          ? window.generateSubfolderOptionsHTML(
              currentFolderData,
              folderName,
              "",
              uncategorizedCount
            )
          : "";

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

/**
 * Create updateSubfolderView function for a specific modal
 * @param {HTMLElement} modal - The modal element
 * @returns {Function} updateSubfolderView function
 */
function createUpdateSubfolderViewFunction(modal) {
  return function updateSubfolderView(folderName, subfolderName) {
    let subscriptions = [];

    // Handle "Uncategorized" special case
    if (folderName === "Uncategorized" || subfolderName === "Uncategorized") {
      subscriptions = window.getUncategorizedSubscriptions
        ? window.getUncategorizedSubscriptions()
        : [];
    } else {
      const currentFolderData = window.folderData || {};
      const folderInfo = currentFolderData[folderName];
      if (
        !folderInfo ||
        !folderInfo.subfolders ||
        !folderInfo.subfolders[subfolderName]
      ) {
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
    const activeSubs = totalSubs; // TODO: Calculate from subscription activity
    const inactiveSubs = 0; // TODO: Calculate from subscription activity
    const totalSubscribers = totalSubs * 1000000; // TODO: Sum actual subscriber counts

    const statTotal = modal.querySelector(
      ".stat-item-small .stat-number-small"
    );
    if (statTotal) {
      statTotal.textContent = totalSubs;
    }

    // Update subscriptions list
    const subscriptionsListHTML = window.generateSubscriptionsListHTML
      ? window.generateSubscriptionsListHTML(subscriptions, folderName)
      : "";

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
  };
}

// Make functions globally available
window.setupSubfolderViewEvents = setupSubfolderViewEvents;
window.createUpdateSubfolderViewFunction = createUpdateSubfolderViewFunction;
