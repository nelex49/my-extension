/** @format */

// SidebarButton component for YouTube Subscription Manager

function createSidebarButton() {
  // Set flag immediately to prevent duplicate calls
  if (sidebarButtonCreated) {
    return (
      document.querySelector("#yt-manage-guide-entry") ||
      document.querySelector("#yt-manage-link")
    );
  }

  // Check if button already exists to prevent duplicates
  if (
    document.querySelector("#yt-manage-guide-entry") ||
    document.querySelector("#yt-manage-link")
  ) {
    sidebarButtonCreated = true;
    return (
      document.querySelector("#yt-manage-guide-entry") ||
      document.querySelector("#yt-manage-link")
    );
  }

  // Mark as creating to prevent duplicate calls
  sidebarButtonCreated = true;

  // Wait a bit for YouTube to fully load
  setTimeout(() => {
    // Look for the Home navigation item
    const homeLink = document.querySelector('a[href*="/feed/"]');

    if (homeLink) {
      // Find the parent guide entry renderer
      let guideEntry = homeLink.closest("ytd-guide-entry-renderer");

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
              overflow: hidden !important;
              text-overflow: ellipsis !important;
              max-width: 250px !important;
            `;
          }
        }

        // Add hover effect for blue background button
        if (link) {
          link.addEventListener("mouseenter", () => {
            link.style.backgroundColor = "#1565c0 !important"; // Darker blue on hover
            link.style.transform = "scale(1.02)";
            link.style.transition = "all 0.2s ease";
          });

          link.addEventListener("mouseleave", () => {
            link.style.backgroundColor = "#1976d2 !important"; // Back to original blue
            link.style.transform = "scale(1)";
          });
        }

        // Insert after the home button
        container.insertBefore(newGuideEntry, guideEntry.nextSibling);

        // Inject CSS to override YouTube's styles
        const style = document.createElement("style");
        style.textContent = `
          #yt-manage-guide-entry #yt-manage-link {
            background-color: #1976d2 !important;
            color: white !important;
            display: flex !important;
            align-items: center !important;
            padding: 10px 24px !important;
            text-decoration: none !important;
            border-radius: 10px !important;
            margin: 2px 0 !important;
            width: 100% !important;
            box-sizing: border-box !important;
          }
          #yt-manage-guide-entry #yt-manage-link .title {
            color: white !important;
            font-weight: 500 !important;
            font-size: 14px !important;
          }
          #yt-manage-guide-entry #yt-manage-link svg {
            fill: white !important;
            width: 24px !important;
            height: 24px !important;
          }
        `;
        document.head.appendChild(style);

        // Button created successfully

        // Add click handler
        const manageLink = newGuideEntry.querySelector("#yt-manage-link");
        if (manageLink) {
          manageLink.addEventListener("click", (e) => {
            e.preventDefault();

            // Temporary visual feedback
            manageLink.style.backgroundColor = "#ff9800";
            setTimeout(() => {
              manageLink.style.backgroundColor = "#1976d2";
            }, 200);

            toggleFolderDropdown();
          });
        } else {
        }

        return newGuideEntry;
      }
    } else {
    }

    return null;
  }, 2000);

  return null;
}

// Make it globally available
window.createSidebarButton = createSidebarButton;
