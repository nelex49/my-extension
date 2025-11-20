/** @format */

// ParentFolderSelector module for SubfolderView
// Handles parent folder tabs, toggle, and switching

function toggleParentFolders() {
  const parentTabs = document.getElementById("parent-folder-tabs");
  const toggleButton = document.querySelector(".parent-folder-toggle button");

  if (parentTabs.classList.contains("expanded")) {
    parentTabs.classList.remove("expanded");
    toggleButton.textContent = "Show More";
  } else {
    parentTabs.classList.add("expanded");
    toggleButton.textContent = "Show Less";
  }
}

function initializeParentFolderTabs() {
  // Parent folder tab switching
  const parentTabs = document.querySelectorAll(".parent-folder-tab");
  parentTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      parentTabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");
    });
  });
}

// Make functions globally available
window.toggleParentFolders = toggleParentFolders;
window.initializeParentFolderTabs = initializeParentFolderTabs;
