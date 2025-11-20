/** @format */

// MoveManager module for SubfolderView
// Handles subscription move functionality

let isMoving = false;
let selectedSubscription = null;

function startMove(subscriptionName, channelId) {
  // Toggle behavior: if already moving, cancel
  if (isMoving) {
    cancelMove();
    return;
  }

  isMoving = true;
  selectedSubscription = { name: subscriptionName, channelId: channelId };

  // Show instructions
  const instructionsEl = document.getElementById("move-instructions");
  if (instructionsEl) {
    instructionsEl.classList.remove("hidden");
    const instructionText = instructionsEl.querySelector(".instruction-text");
    if (instructionText) {
      instructionText.textContent = "Click destination subfolder below";
      instructionText.style.color = "#e65100";
    }
  }

  // Make subfolders clickable (except current)
  const subfolders = document.querySelectorAll(
    ".subfolder-option[data-target]"
  );
  subfolders.forEach((folder) => {
    // Skip current folder - can't move to same folder
    if (folder.classList.contains("current")) {
      return;
    }

    // Make it look clickable and highlighted
    folder.style.cursor = "pointer";
    folder.style.opacity = "1";
    folder.style.border = "2px solid #1976d2";
    folder.style.backgroundColor = "#e3f2fd";
    folder.style.color = "#1976d2";
    folder.style.fontWeight = "bold";
    folder.classList.add("move-target");

    // Store original onclick to restore later
    const originalOnclick = folder.onclick;

    folder.onclick = function () {
      const targetFolderName = this.querySelector(".folder-name").textContent;
      const targetCount = this.querySelector(".sub-count");
      const folderName = this.dataset.folderName;
      const subfolderName = this.dataset.subfolderName;

      // Find current subfolder count element
      const currentSubfolder = document.querySelector(
        ".subfolder-option.current"
      );
      const currentCount = currentSubfolder
        ? currentSubfolder.querySelector(".sub-count")
        : null;

      // Move subscription using existing function
      if (
        channelId &&
        folderName &&
        subfolderName &&
        typeof window.addToSubfolder === "function"
      ) {
        window.addToSubfolder(channelId, folderName, subfolderName);

        // Remove subscription from current view
        const subscriptionItem = document.querySelector(
          `.subscription-item[data-channel-id="${channelId}"]`
        );
        if (subscriptionItem) {
          subscriptionItem.style.opacity = "0.3";
          subscriptionItem.style.textDecoration = "line-through";
          setTimeout(() => {
            subscriptionItem.remove();
          }, 1000);
        }
      }

      // Update counts
      if (currentCount) {
        const currentNum = parseInt(currentCount.textContent) || 0;
        currentCount.textContent = Math.max(0, currentNum - 1);
      }
      if (targetCount) {
        const targetNum = parseInt(targetCount.textContent) || 0;
        targetCount.textContent = targetNum + 1;
      }

      // Show success message
      const instruction = document.querySelector(".instruction-text");
      if (instruction) {
        instruction.textContent = `✓ Moved ${subscriptionName} to ${targetFolderName}`;
        instruction.style.color = "#4caf50";
      }

      // Refresh folder dropdown to show updated counts
      if (typeof window.refreshFolderDropdown === "function") {
        setTimeout(() => {
          window.refreshFolderDropdown();
        }, 100);
      }

      // Reset after 2 seconds
      setTimeout(() => {
        cancelMove();
      }, 2000);
    };
  });
}

function cancelMove() {
  isMoving = false;
  selectedSubscription = null;

  // Hide instructions
  const instructionsEl = document.getElementById("move-instructions");
  if (instructionsEl) {
    instructionsEl.classList.add("hidden");
  }

  // Reset subfolders
  const subfolders = document.querySelectorAll(
    ".subfolder-option[data-target]"
  );
  subfolders.forEach((folder) => {
    folder.style.cursor = "";
    folder.style.opacity = "";
    folder.style.border = "";
    folder.style.backgroundColor = "";
    folder.style.color = "";
    folder.style.fontWeight = "";
    folder.classList.remove("move-target");
    folder.onclick = null;
  });
}

function removeSubscription(subscriptionName, channelId) {
  if (
    confirm(
      `Are you sure you want to remove ${subscriptionName} from this subfolder?`
    )
  ) {
    // Find current subfolder from breadcrumb or current class
    const currentSubfolder = document.querySelector(
      ".subfolder-option.current"
    );
    const folderName = currentSubfolder?.dataset.folderName;
    const subfolderName = currentSubfolder?.dataset.subfolderName;

    // Remove subscription using existing function
    if (
      channelId &&
      folderName &&
      subfolderName &&
      typeof window.removeFromSubfolder === "function"
    ) {
      window.removeFromSubfolder(channelId, folderName, subfolderName);
    }

    // Update count
    const currentCount = currentSubfolder?.querySelector(".sub-count");
    if (currentCount) {
      const currentNum = parseInt(currentCount.textContent) || 0;
      currentCount.textContent = Math.max(0, currentNum - 1);
    }

    // Remove the subscription item from UI
    const subscriptionItems = document.querySelectorAll(".subscription-item");
    subscriptionItems.forEach((item) => {
      if (
        item.dataset.channelId === channelId ||
        item.querySelector(".sub-name")?.textContent === subscriptionName
      ) {
        item.style.opacity = "0.3";
        item.style.textDecoration = "line-through";
        setTimeout(() => {
          item.remove();
        }, 1000);
      }
    });

    // Refresh dropdown if available
    if (typeof window.refreshFolderDropdown === "function") {
      setTimeout(() => {
        window.refreshFolderDropdown();
      }, 100);
    }
  }
}

// Make functions globally available
window.startMove = startMove;
window.cancelMove = cancelMove;
window.removeSubscription = removeSubscription;
