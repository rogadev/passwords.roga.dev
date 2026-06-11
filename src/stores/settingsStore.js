import { reactive } from 'vue';
import { DEFAULTS } from '../utils/urlParams';

// Shared reactive settings store - single source of truth for both components
const settings = reactive({ ...DEFAULTS });

// Cross-field invariant, applied after every mutation regardless of entry
// point (toggle, direct update, or bulk load from URL).
function enforceInvariants() {
  // "No leading special" requires at least one letter set to be available
  if (settings.excludeLowercase && settings.excludeUppercase && settings.ruleNoLeadingSpecial) {
    settings.ruleNoLeadingSpecial = false;
  }
}

// Actions to update settings
function updateSetting(key, value) {
  settings[key] = value;
  enforceInvariants();
}

function toggleSetting(key) {
  settings[key] = !settings[key];
  enforceInvariants();
}

function setSettings(newSettings) {
  Object.keys(newSettings).forEach(key => {
    if (key in settings) {
      settings[key] = newSettings[key];
    }
  });
  enforceInvariants();
}

// Export the store as a composable
export function useSettings() {
  return {
    settings,
    updateSetting,
    toggleSetting,
    setSettings,
  };
}
