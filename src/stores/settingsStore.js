import { reactive } from 'vue';

// Shared reactive settings store - single source of truth for both components
const settings = reactive({
  length: 16,
  excludeLowercase: false,
  excludeNumbers: false,
  excludeUppercase: false,
  excludeSymbols: false,
  excludedChars: '',
  ruleNoLeadingSpecial: false,
});

// Actions to update settings
function updateSetting(key, value) {
  settings[key] = value;
}

function toggleSetting(key) {
  settings[key] = !settings[key];
  
  // Auto-disable "no leading special" rule if no letters are available
  if (settings.excludeLowercase && settings.excludeUppercase && settings.ruleNoLeadingSpecial) {
    settings.ruleNoLeadingSpecial = false;
  }
}

function setSettings(newSettings) {
  Object.keys(newSettings).forEach(key => {
    if (key in settings) {
      settings[key] = newSettings[key];
    }
  });
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

