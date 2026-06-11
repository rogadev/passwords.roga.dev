import { expect, test, beforeEach } from 'vitest';
import { createApp, nextTick } from 'vue';
import { userEvent } from 'vitest/browser';
import OptionsPanel from '../../src/components/OptionsPanel.vue';
import { useSettings } from '../../src/stores/settingsStore';
import { DEFAULTS } from '../../src/utils/urlParams';

// OptionsPanel takes no props — it reads the singleton settings store.
// Reset the store before each test so tests don't leak state into each other.
const { setSettings } = useSettings();

beforeEach(() => {
  setSettings({ ...DEFAULTS });
});

// Helper to mount component
async function mount(component) {
  const container = document.createElement('div');
  container.id = 'app';
  document.body.appendChild(container);

  const app = createApp(component);
  app.mount(container);

  await nextTick();

  return {
    container,
    unmount: () => {
      app.unmount();
      document.body.removeChild(container);
    },
  };
}

test('renders all character type checkboxes', async () => {
  const { container, unmount } = await mount(OptionsPanel);

  // Check all checkboxes are present
  expect(container.querySelector('#exclude-lowercase')).toBeTruthy();
  expect(container.querySelector('#exclude-uppercase')).toBeTruthy();
  expect(container.querySelector('#exclude-numbers')).toBeTruthy();
  expect(container.querySelector('#exclude-symbols')).toBeTruthy();
  expect(container.querySelector('#no-leading-special')).toBeTruthy();

  unmount();
});

test('renders length slider and number input', async () => {
  setSettings({ length: 16 });

  const { container, unmount } = await mount(OptionsPanel);

  // Check slider exists (convenience range 6-64)
  const slider = container.querySelector('#length-range');
  expect(slider).toBeTruthy();
  expect(slider.getAttribute('min')).toBe('6');
  expect(slider.getAttribute('max')).toBe('64');

  // Check number input exists (full generator range 1-128)
  const numberInput = container.querySelector('#length-number');
  expect(numberInput).toBeTruthy();
  expect(numberInput.getAttribute('min')).toBe('1');
  expect(numberInput.getAttribute('max')).toBe('128');
  expect(numberInput.value).toBe('16');

  unmount();
});

test('toggles include lowercase checkbox', async () => {
  const { container, unmount } = await mount(OptionsPanel);

  const checkbox = container.querySelector('#exclude-lowercase');
  // Checkbox is "include" - checked means included
  expect(checkbox.checked).toBe(true);

  // Click the checkbox to exclude
  await userEvent.click(checkbox);

  // Wait for updates
  await new Promise(resolve => setTimeout(resolve, 100));

  // Checkbox should be unchecked now (excluded)
  expect(checkbox.checked).toBe(false);

  unmount();
});

test('toggles include uppercase checkbox', async () => {
  const { container, unmount } = await mount(OptionsPanel);

  const checkbox = container.querySelector('#exclude-uppercase');
  // Checkbox is "include" - checked means included
  expect(checkbox.checked).toBe(true);

  await userEvent.click(checkbox);
  await new Promise(resolve => setTimeout(resolve, 100));

  // Checkbox should be unchecked now (excluded)
  expect(checkbox.checked).toBe(false);

  unmount();
});

test('reflects store values in UI', async () => {
  setSettings({
    length: 24,
    excludeLowercase: true,  // excluded -> checkbox unchecked
    excludeNumbers: false,   // included -> checkbox checked
    excludeUppercase: false, // included -> checkbox checked (need at least one letter type for no-leading rule)
    excludeSymbols: false,   // included -> checkbox checked
    ruleNoLeadingSpecial: true,
  });

  const { container, unmount } = await mount(OptionsPanel);

  // Check length
  const numberInput = container.querySelector('#length-number');
  expect(numberInput.value).toBe('24');

  // Check checkboxes - "include" checkboxes: checked = included, unchecked = excluded
  expect(container.querySelector('#exclude-lowercase').checked).toBe(false); // excluded
  expect(container.querySelector('#exclude-numbers').checked).toBe(true);    // included
  expect(container.querySelector('#exclude-uppercase').checked).toBe(true);  // included
  expect(container.querySelector('#exclude-symbols').checked).toBe(true);    // included
  expect(container.querySelector('#no-leading-special').checked).toBe(true); // rule checkbox stays same logic

  unmount();
});

test('can toggle multiple checkboxes', async () => {
  const { container, unmount } = await mount(OptionsPanel);

  const includeLowercase = container.querySelector('#exclude-lowercase');
  const includeNumbers = container.querySelector('#exclude-numbers');
  const noLeadingSpecial = container.querySelector('#no-leading-special');

  // Rule checkbox: starts unchecked, clicking checks it
  await userEvent.click(noLeadingSpecial);
  await new Promise(resolve => setTimeout(resolve, 100));

  // These start checked (included), clicking unchecks them (excludes)
  await userEvent.click(includeLowercase);
  await new Promise(resolve => setTimeout(resolve, 100));

  await userEvent.click(includeNumbers);
  await new Promise(resolve => setTimeout(resolve, 100));

  expect(includeLowercase.checked).toBe(false);
  expect(includeNumbers.checked).toBe(false);
  // Uppercase is still included, so the rule stays active
  expect(noLeadingSpecial.checked).toBe(true);

  unmount();
});

test('auto-disables the no-leading-special rule when both letter types are excluded', async () => {
  const { container, unmount } = await mount(OptionsPanel);

  const includeLowercase = container.querySelector('#exclude-lowercase');
  const includeUppercase = container.querySelector('#exclude-uppercase');
  const noLeadingSpecial = container.querySelector('#no-leading-special');

  // Enable the rule, then exclude both letter types
  await userEvent.click(noLeadingSpecial);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(noLeadingSpecial.checked).toBe(true);

  await userEvent.click(includeLowercase);
  await new Promise(resolve => setTimeout(resolve, 100));

  await userEvent.click(includeUppercase);
  await new Promise(resolve => setTimeout(resolve, 100));

  // The store invariant auto-disables the rule and the UI disables the input
  expect(noLeadingSpecial.checked).toBe(false);
  expect(noLeadingSpecial.disabled).toBe(true);

  unmount();
});
