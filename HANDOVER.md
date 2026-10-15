# YouTube Subscription Manager handover

Work on ui-redesign. This complete replacement is based only on extension-latest(3).zip. No commit, push or merge has been performed. Preserve accepted UI; keep changes modular and run dialogs/manage/retrieval/startup after application changes.

## Current addition: manual backup and restore

Manage -> three-dot menu -> Backup folders / Restore backup. The previous disabled placeholders are now active.

- Manual backup downloads a version-1 JSON file containing owner, folder structure, colours and channel assignments. No credentials or live subscription cache.
- Restore validates the file and account, then opens a shared dark confirmation dialog. It replaces the complete folder setup; it does not change YouTube subscriptions.
- After confirmation, a dated before-restore safety copy downloads. The worker waits for Chrome to report completion before saving the imported folders.
- Download failure/cancellation/timeout stops restore. Changed account or folder data detected during download also stops it. Storage failures preserve the previous setup.
- Chrome downloads permission was added for completion monitoring. Reload the extension and YouTube after replacing source.
- The current verified owner must match the backup. Following reinstall, sign in and link the empty setup to that same YouTube channel first.
- General cross-tab save protection remains deferred. This addition is not a general concurrency solution.

## Modules

src/shared/BackupFormat.js: versioned schema, validation and credential-free serialization.
src/background/BackupService.js: account checks, downloads, safety copy and restore write.
src/services/BackupService.js: file selection, menu entry points and themed confirmation.
Shared DialogLifecycle accepts an optional close guard; restore cannot dismiss while an operation is pending. Other dialogs retain their behaviour.

## Validation

All four required suites pass. tests/backup.cjs additionally checks round trip, format/version/account/prototype rejection, completed safety download before replacement, cancellation, failed saves, changed account/folders and repeated operation protection. Startup tests exercise backup menu routing and confirmation cancel, pending state, error/retry and success.
Tests simulate DOM and Chrome APIs. The user confirmed live backup, deletion and restore recovered the deleted folder. The latest header message placement still needs a live visual check.

## Manual checks next

1. Reload extension, then reload YouTube. Sign in to the verified owner.
2. Manage -> three-dot menu -> Backup folders. Confirm the JSON file downloads.
3. Add a temporary folder. Restore the earlier backup; cancel confirmation once to check nothing changes.
4. Restore again and confirm. Check the safety file downloads and the temporary folder disappears. Original assignments and colours should return.
5. Restore the safety copy to recover the temporary folder.
6. Check malformed JSON and another account's backup are rejected. If Chrome prompts for a save location, cancel that download and check no restore occurs.
7. Refresh and restart Chrome to confirm restored assignments persist.

Next: complete manual checks, then small friends beta for 1-2 weeks, fix feedback, plan premium scope. See PROJECT-BACKLOG.md for deferred features and premium candidates.

Existing account protection, popup timings and accepted Manage/sidebar appearance remain in place. The user already confirmed repeat sign-in and popup behaviour at the prior checkpoint.

## Backup feedback refinement

Short backup/restore messages now appear inside the Manage header to the left of the menu, below the header on narrow windows. Success remains for five seconds followed by a 300ms fade; errors remain until dismissed. BackupNotice.js owns display and timer cleanup. All four suites plus backup and backup-notice tests pass. No commit or push.

Latest feedback adjustment: backup/restore notices are now centred below the Manage header and above folder navigation, rather than beside the menu. Success displays for four seconds then fades over 300ms. Errors remain dismissible. User confirmed the previous build worked; this placement awaits visual review.

## Original project popup fix

Applied the tested beta 1.0.2 popup fix to the original project. No native browser confirmation during account linking; fresh installs show Use this account, while existing unowned folders show an ownership warning before the explicit link button. Raw channel ID removed from this step. Original manifest, OAuth client and absence of a public key are preserved. Replace files in the original development folder and reload that existing extension. Do not substitute the beta manifest.

User confirmed beta sign-in, empty initial setup, parent/subfolder creation and channel move on a second computer. Persistence and backup/restore testing there remains pending.
