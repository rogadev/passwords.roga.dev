import { describe, it, expect, beforeEach } from 'vitest';
import { useSettings } from '../../src/stores/settingsStore';
import { DEFAULTS } from '../../src/utils/urlParams';

// The store is a module-level singleton, so reset it before each test
const { settings, updateSetting, toggleSetting, setSettings } = useSettings();

beforeEach(() => {
  setSettings({ ...DEFAULTS });
});

describe('settingsStore', () => {
  it('starts with the shared defaults', () => {
    expect({ ...settings }).toEqual(DEFAULTS);
  });

  it('updateSetting sets a value', () => {
    updateSetting('length', 32);
    expect(settings.length).toBe(32);
  });

  it('toggleSetting flips a boolean', () => {
    toggleSetting('excludeSymbols');
    expect(settings.excludeSymbols).toBe(true);
    toggleSetting('excludeSymbols');
    expect(settings.excludeSymbols).toBe(false);
  });

  it('setSettings ignores unknown keys', () => {
    setSettings({ length: 24, bogusKey: 'nope' });
    expect(settings.length).toBe(24);
    expect('bogusKey' in settings).toBe(false);
  });

  describe('ruleNoLeadingSpecial invariant (auto-disabled when both letter sets are excluded)', () => {
    it('is enforced via toggleSetting', () => {
      updateSetting('ruleNoLeadingSpecial', true);
      toggleSetting('excludeLowercase');
      toggleSetting('excludeUppercase');
      expect(settings.ruleNoLeadingSpecial).toBe(false);
    });

    it('is enforced via updateSetting (OptionsPanel checkbox path)', () => {
      updateSetting('ruleNoLeadingSpecial', true);
      updateSetting('excludeLowercase', true);
      updateSetting('excludeUppercase', true);
      expect(settings.ruleNoLeadingSpecial).toBe(false);
    });

    it('is enforced via setSettings (URL load path)', () => {
      setSettings({
        excludeLowercase: true,
        excludeUppercase: true,
        ruleNoLeadingSpecial: true,
      });
      expect(settings.ruleNoLeadingSpecial).toBe(false);
    });

    it('keeps the rule when at least one letter set remains', () => {
      updateSetting('ruleNoLeadingSpecial', true);
      updateSetting('excludeLowercase', true);
      expect(settings.ruleNoLeadingSpecial).toBe(true);
    });
  });
});
