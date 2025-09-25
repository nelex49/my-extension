/** @format */

// SidebarButton component for YouTube Subscription Manager

function createSidebarButton() {
  // Check if button already exists to prevent duplicates
  const existingButton = document.querySelector("#yt-manage-guide-entry");
  if (existingButton) {
    return existingButton;
  }

  // Set flag immediately to prevent duplicate calls
  if (window.sidebarButtonCreated) {
    return null;
  }

  // Mark as creating to prevent duplicate calls
  window.sidebarButtonCreated = true;

  // Wait a bit for YouTube to fully load
  setTimeout(() => {
    // Try multiple selectors to find YouTube sidebar elements
    let homeLink =
      document.querySelector('a[href*="/feed/"]') ||
      document.querySelector('a[href*="/"]') ||
      document.querySelector("#guide-button") ||
      document.querySelector("ytd-guide-entry-renderer a");

    if (homeLink) {
      // Try multiple ways to find the container
      let guideEntry =
        homeLink.closest("ytd-guide-entry-renderer") ||
        homeLink.closest("#guide") ||
        homeLink.closest("#secondary") ||
        homeLink.parentElement;

      if (guideEntry) {
        // Find the parent container
        let container = guideEntry.parentElement;

        // Create our button as a proper guide entry
        const newGuideEntry = document.createElement(
          "ytd-guide-entry-renderer"
        );
        newGuideEntry.id = "yt-manage-guide-entry";

        // Create blue background button with white text and star icon
        newGuideEntry.innerHTML = `
          <a id="yt-manage-link" href="#" class="yt-simple-endpoint style-scope ytd-guide-entry-renderer" aria-label="Manage YT">
            <div style="margin-right: 12px; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg viewBox="0 0 24 24" preserveAspectRatio="xMidYMid meet" focusable="false" style="pointer-events: none; display: block; width: 20px; height: 20px; fill: white;">
                <g>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </g>
              </svg>
            </div>
            <span class="title style-scope ytd-guide-entry-renderer">MANAGE YT SUBS</span>
          </a>
        `;

        // Apply aggressive styling after creation
        const link = newGuideEntry.querySelector("#yt-manage-link");
        if (link) {
          // Force all the styles
          link.style.cssText = `
            background-color: #1976d2 !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            padding: 10px 16px !important;
            text-decoration: none !important;
            border-radius: 10px !important;
            margin: 2px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          `;

          // Force text color and ensure it fits
          const title = link.querySelector(".title");
          if (title) {
            title.style.cssText = `
              color: white !important;
              font-weight: 500 !important;
              font-size: 14px !important;
              white-space: nowrap !important;
            `;
          }
        }

        // Add hover effect
        if (link) {
          link.addEventListener("mouseenter", () => {
            link.style.backgroundColor = "#1565c0";
          });
          link.addEventListener("mouseleave", () => {
            link.style.backgroundColor = "#1976d2";
          });
        }

        // Add click handler
        const manageLink = newGuideEntry.querySelector("#yt-manage-link");
        if (manageLink) {
          manageLink.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Temporary visual feedback
            manageLink.style.backgroundColor = "#ff9800";
            setTimeout(() => {
              manageLink.style.backgroundColor = "#1976d2";
            }, 200);

            // Call the dropdown function
            if (typeof window.toggleFolderDropdown === "function") {
              window.toggleFolderDropdown();
            }
          });
        }

        // Actually insert the button into the DOM
        container.insertBefore(newGuideEntry, guideEntry.nextSibling);

        return newGuideEntry;
      }
    }

    return null;
  }, 2000);
}

// Make it globally available
window.createSidebarButton = createSidebarButton;
