// Default password generation settings (shared with settingsStore)
export const DEFAULTS = {
  length: 20,
  excludeLowercase: false,
  excludeNumbers: false,
  excludeUppercase: false,
  excludeSymbols: false,
  excludedChars: '',
  ruleNoLeadingSpecial: false,
};

// Parameter names in the URL
const PARAM_KEYS = {
  length: 'len',
  excludeLowercase: 'exLower',
  excludeNumbers: 'exNum',
  excludeUppercase: 'exUpper',
  excludeSymbols: 'exSym',
  excludedChars: 'exc',
  ruleNoLeadingSpecial: 'ruleNoLead',
};

/**
 * Parses the URL query string and returns password generation settings.
 * Provides defaults for missing parameters.
 * @returns {object} The password settings object.
 */
export function getParamsFromURL() {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    return { ...DEFAULTS };
  }
  
  const params = new URLSearchParams(window.location.search);
  const settings = { ...DEFAULTS }; // Start with defaults

  // Length (integer)
  const lengthParam = params.get(PARAM_KEYS.length);
  if (lengthParam) {
    const parsedLength = parseInt(lengthParam, 10);
    if (!isNaN(parsedLength) && parsedLength > 0 && parsedLength <= 128) { // Add reasonable max length
      settings.length = parsedLength;
    }
  }

  // Boolean flags (presence means true, check if the *key* exists)
  settings.excludeLowercase = params.has(PARAM_KEYS.excludeLowercase);
  settings.excludeNumbers = params.has(PARAM_KEYS.excludeNumbers);
  settings.excludeUppercase = params.has(PARAM_KEYS.excludeUppercase);
  settings.excludeSymbols = params.has(PARAM_KEYS.excludeSymbols);
  settings.ruleNoLeadingSpecial = params.has(PARAM_KEYS.ruleNoLeadingSpecial);

  // Excluded characters (URLSearchParams already percent-decodes values)
  const excludedParam = params.get(PARAM_KEYS.excludedChars);
  if (excludedParam) {
    settings.excludedChars = excludedParam;
  }

  return settings;
}

/**
 * Builds a URL query string from the given settings object,
 * only including parameters that differ from the defaults.
 * @param {object} settings - The password settings object.
 * @returns {string} The generated query string.
 */
export function buildQueryString(settings) {
  const params = new URLSearchParams();

  // Add parameters only if they differ from defaults or are boolean flags meant to be present
  if (settings.length !== DEFAULTS.length) {
    params.set(PARAM_KEYS.length, settings.length.toString());
  }

  // For boolean flags, add them if they are true (exclusion is active)
  if (settings.excludeLowercase) {
    params.set(PARAM_KEYS.excludeLowercase, ''); // Presence indicates true
  }
  if (settings.excludeNumbers) {
    params.set(PARAM_KEYS.excludeNumbers, ''); // Presence indicates true
  }
  if (settings.excludeUppercase) {
    params.set(PARAM_KEYS.excludeUppercase, '');
  }
  if (settings.excludeSymbols) {
    params.set(PARAM_KEYS.excludeSymbols, '');
  }
  if (settings.ruleNoLeadingSpecial) {
    params.set(PARAM_KEYS.ruleNoLeadingSpecial, '');
  }

  // Only include excludedChars if it's not empty (default).
  // URLSearchParams percent-encodes the value when serialized.
  if (settings.excludedChars && settings.excludedChars !== DEFAULTS.excludedChars) {
     params.set(PARAM_KEYS.excludedChars, settings.excludedChars);
  }

  return params.toString();
}

/**
 * Updates the URL query string with the given password settings
 * without reloading the page.
 * @param {object} settings - The password settings object.
 */
export function updateURLParams(settings) {
  // Check if running in browser environment
  if (typeof window === 'undefined') {
    console.warn('updateURLParams called in non-browser environment');
    return;
  }
  
  const newQueryString = buildQueryString(settings);

  // Use replaceState to avoid polluting browser history excessively during option changes
  const newUrl = newQueryString
    ? `${window.location.pathname}?${newQueryString}`
    : window.location.pathname; // Remove query string if all options are default

  try {
    window.history.replaceState({}, '', newUrl);
  } catch (e) {
    // Safari throttles replaceState (~100 calls / 30s). A stale URL is
    // harmless and self-corrects on the next update — never force a reload.
    console.warn("Failed to update URL:", e);
  }
}
