// Single source for provisional limits. No billing or production licensing yet.
const FolderPlan = (() => {
  const limits = Object.freeze({ parents: Infinity, subfolders: 3 });
  const developmentKey = 'developmentFolderPlan';
  let state = 'free';
  function applyStorage(data) {
    const value = data?.[developmentKey];
    state = window.CONFIG?.DEVELOPMENT_PLAN_TESTING === true && ['free', 'pro', 'expired'].includes(value) ? value : 'free';
  }
  function evaluate(data, kind, parentName = null) {
    // Parent creation is always unlimited; child capacity belongs to each parent.
    if (state === 'pro' || kind === 'parent') return { allowed: true };
    const count = Object.keys(data?.[parentName]?.subfolders || {}).length;
    return { allowed: count < limits.subfolders, kind, oversized: count > limits.subfolders,
      expired: state === 'expired' };
  }
  return Object.freeze({ limits, developmentKey, applyStorage, evaluate, get state() { return state; } });
})();
window.FolderPlan = FolderPlan;
