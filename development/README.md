# Folder-plan development testing

Use this complete source on `premium-folders`, starting from the tested `ui-redesign` checkpoint. No Git metadata is included; replacing these files does not switch branches. Do not commit or push until manual testing is accepted.

## Open the controls

1. Replace the source in your existing development extension folder. Keep its original installation and identity.
2. In Chrome, open `chrome://extensions` and reload that extension. Reload YouTube too.
3. Open the extension's **Details**, then **Extension options**. This opens the separate folder-plan test page. Alternatively right-click its toolbar icon and choose **Options**.
4. Choose **Test Free**, **Test Pro**, or **Test expired Pro**. Open YouTube tabs apply the choice without reloading. The choice persists across restarts in this Chrome profile.

These are development simulations, not subscription verification or payment controls. The build defaults to Free when no valid test state is saved. Switching states never deletes folders. Test controls do not need a signed-in account, but normal creation and restore still require the existing verified linked account.

## Manual checks

Back up your real setup first. Use a temporary setup for deletion tests. Existing subfolders above the Free allowance are always preserved.

- **Free:** create more than four parent folders with no upgrade prompt. Within any parent create three subfolders; the fourth should show the Pro prompt. Parent folders and subscriptions have no plan count limit.
- **Prompt:** Cancel, Escape and outside-click close it without changes. The clicked feature is explained first, followed by Also included with Pro. Upgrade/Renew states purchases are unavailable; no payment is attempted.
- **Pro:** create more than three subfolders in one parent. Try multi-channel moves and built-in folder icons. Export a backup.
- **Expired:** everything remains intact, including icons. Rename/recolour/delete folders and move/remove channels. Parent creation remains unlimited. A parent with three or more subfolders cannot receive another, but other parents can still use their own allowance.
- **Reduce:** delete subfolders in one parent until it has two. A third becomes available; a fourth stays blocked. Other parents' counts do not affect this.
- **Restore:** on Free/Expired, restore the larger backup and verify safety-copy download. All content/icons return. Parent creation remains available; each parent independently follows the three-subfolder allowance. Restore does not change the plan.
- **Live change:** open a subfolder create form under Pro in a parent already holding three children; switch to Expired before Save. Saving must block a fourth. A parent-folder create form must still save after the same plan change.
- **Regression:** verify sidebar creation/editing, Manage navigation, centred move feedback, Refresh, backup, restore, About, sign-out and return sign-in.
- Reload YouTube/restart Chrome and confirm both folder persistence and the selected test state.

## Layout and modules

- `src/plans/FolderPlan.js`: the only definition of the unlimited-parent / three-subfolder-per-parent allowance and creation policy. Also resolves the explicitly development-only test state.
- `src/plans/FolderCreationGate.js`: bridges the policy to the limit dialog. Forms and creation services both use it.
- `src/components/PlanDialogs/FolderLimitDialog.js`: themed limit/renewal prompt and Pro details; no checkout integration.
- `development/plan-testing.*`: test state controls, exposed through development Extension options.

No real payment/entitlement system is implemented in this section. Before public release, replace simulated plan resolution with the agreed licensing flow, set `CONFIG.DEVELOPMENT_PLAN_TESTING` to `false`, and remove the development `options_ui` entry/page from the release package. Disabling the flag makes any stored test Pro state ineffective. Test plan state is excluded from exported backups.

Cross-tab folder save conflict protection remains deferred. This addition retains the existing per-tab save guard and account verification rules.

## Automated checks

Run from the extension folder in Bash:

```bash
node tests/dialogs.cjs
node tests/manage.cjs
node tests/retrieval.cjs
node tests/startup.cjs
node tests/backup.cjs
node tests/backup-notice.cjs
node tests/folder-plans.cjs
node tests/plan-testing.cjs
node tests/account-setups.cjs
```

The tests simulate DOM and Chrome APIs. Chrome appearance and real installation behaviour require the manual checks above.
