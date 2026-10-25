# Built-in folder icons

Ten bundled, original outline choices: Default folder, Music, Gaming, Coding, Learning, News, Film, Cooking, Fitness and Travel. No external icon service, remote downloads or uploaded images.

Create/edit a parent folder or subfolder. Below Colour, the Icon row shows the current choice. Pro users can expand Change icon into a two-row grid. The selected choice has a border and pressed state; buttons have names/tooltips and work with keyboard focus. Create/Save applies the icon in the same atomic save as the other fields. Cancel leaves saved data untouched. Escape closes the picker first, then the form.

Free/Expired users see the Pro explanation. Existing custom icons remain visible and survive ordinary edits. Use default folder is available without Pro. New custom choices require Pro both in the form and at the service save boundary. Returning to an existing icon does not require a new upgrade.

Saved iconId values reference the local catalogue. Missing and unknown IDs display the default. Backups, restores and safety copies preserve known IDs; unknown backup IDs fall back to folder, while invalid field types are rejected. Older backups without icons remain valid. The account setup copy is saved through the existing atomic persistence path.

## Manual Chrome checks

- Pro: create a parent and subfolder with different icons; save, reopen and refresh YouTube.
- Verify sidebar, parent tabs, All Folders, subfolder list/heading and move destination picker.
- Check both themes, muted/custom colours, long names and anchored edit forms near the window bottom.
- Open Change icon, use Tab/Space, and press Escape; it should collapse without closing the form.
- Cancel after changing an icon; reopen and confirm the previous icon remains.
- Free/Expired: Change icon opens the Pro explanation. Escape/Cancel must leave the edit form open.
- Rename/recolour a folder with a custom icon after expiry; keep that icon. Reset it to the default.
- Export/restore a backup and verify parent/subfolder choices.

Regression coverage is included in dialogs, startup and backup suites; all existing suites remain in use.
