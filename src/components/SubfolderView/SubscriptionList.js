/** @format */

// SubscriptionList module for SubfolderView
// Handles subscription search and filter functionality

function clearFilters() {
  // Clear search input
  const searchInput = document.querySelector(
    ".search-input-container input, #subfolder-search-input"
  );
  if (searchInput) {
    searchInput.value = "";
  }

  // Reset sort dropdown
  const sortSelect = document.querySelector(
    ".filter-select, #subfolder-sort-select"
  );
  if (sortSelect) {
    sortSelect.selectedIndex = 0;
  }

  // Clear any selections (if multi-select was implemented)
  const selectedItems = document.querySelectorAll(
    ".subscription-item.selected"
  );
  selectedItems.forEach((item) => {
    item.classList.remove("selected");
  });

  // Show all items again
  const subscriptionItems = document.querySelectorAll(".subscription-item");
  subscriptionItems.forEach((item) => {
    item.style.display = "flex";
  });

  // Show confirmation
  alert("Filters cleared! Search and sorting have been reset.");
}

function initializeSearch() {
  // Search functionality
  const searchInput = document.querySelector(
    ".search-input-container input, #subfolder-search-input"
  );
  if (searchInput) {
    searchInput.addEventListener("input", function (e) {
      const searchTerm = e.target.value.toLowerCase();
      const subscriptionItems = document.querySelectorAll(".subscription-item");

      subscriptionItems.forEach((item) => {
        const channelNameEl = item.querySelector(".sub-name");
        const channelName = channelNameEl
          ? channelNameEl.textContent.toLowerCase()
          : "";
        if (channelName.includes(searchTerm)) {
          item.style.display = "flex";
        } else {
          item.style.display = "none";
        }
      });
    });
  }
}

// Make functions globally available
window.clearFilters = clearFilters;
window.initializeSearch = initializeSearch;
