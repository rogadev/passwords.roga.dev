import { expect, test } from 'vitest';
import { createApp, ref, nextTick } from 'vue';
import { userEvent } from 'vitest/browser';
import OptionsPanel from '../../src/components/OptionsPanel.vue';

// Helper to mount component with props
async function mount(component, props) {
  const container = document.createElement('div');
  container.id = 'app';
  document.body.appendChild(container);
  
  const app = createApp(component, props);
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
  const settings = ref({
    length: 16,
    excludeLowercase: false,
    excludeNumbers: false,
    excludeUppercase: false,
    excludeSymbols: false,
    ruleNoLeadingSpecial: false,
  });
  
  const { container, unmount } = await mount(OptionsPanel, {
    modelValue: settings.value,
  });
  
  // Check all checkboxes are present
  expect(container.querySelector('#exclude-lowercase')).toBeTruthy();
  expect(container.querySelector('#exclude-uppercase')).toBeTruthy();
  expect(container.querySelector('#exclude-numbers')).toBeTruthy();
  expect(container.querySelector('#exclude-symbols')).toBeTruthy();
  expect(container.querySelector('#no-leading-special')).toBeTruthy();
  
  unmount();
});

test('renders length slider and number input', async () => {
  const settings = ref({
    length: 16,
    excludeLowercase: false,
    excludeNumbers: false,
    excludeUppercase: false,
    excludeSymbols: false,
    ruleNoLeadingSpecial: false,
  });
  
  const { container, unmount } = await mount(OptionsPanel, {
    modelValue: settings.value,
  });
  
  // Check slider exists
  const slider = container.querySelector('#length-range');
  expect(slider).toBeTruthy();
  expect(slider.getAttribute('min')).toBe('6');
  expect(slider.getAttribute('max')).toBe('64');
  
  // Check number input exists
  const numberInput = container.querySelector('#length-number');
  expect(numberInput).toBeTruthy();
  expect(numberInput.value).toBe('16');
  
  unmount();
});

test('toggles include lowercase checkbox', async () => {
  const settings = ref({
    length: 16,
    excludeLowercase: false, // included by default
    excludeNumbers: false,
    excludeUppercase: false,
    excludeSymbols: false,
    ruleNoLeadingSpecial: false,
  });
  
  const { container, unmount } = await mount(OptionsPanel, {
    modelValue: settings.value,
  });
  
  const checkbox = container.querySelector('#exclude-lowercase');
  // Checkbox is now "include" - checked means included
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
  const settings = ref({
    length: 16,
    excludeLowercase: false,
    excludeNumbers: false,
    excludeUppercase: false, // included by default
    excludeSymbols: false,
    ruleNoLeadingSpecial: false,
  });
  
  const { container, unmount } = await mount(OptionsPanel, {
    modelValue: settings.value,
  });
  
  const checkbox = container.querySelector('#exclude-uppercase');
  // Checkbox is now "include" - checked means included
  expect(checkbox.checked).toBe(true);
  
  await userEvent.click(checkbox);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Checkbox should be unchecked now (excluded)
  expect(checkbox.checked).toBe(false);
  
  unmount();
});

test('reflects initial prop values in UI', async () => {
  const settings = ref({
    length: 24,
    excludeLowercase: true,  // excluded -> checkbox unchecked
    excludeNumbers: false,   // included -> checkbox checked
    excludeUppercase: false, // included -> checkbox checked (need at least one letter type for no-leading rule)
    excludeSymbols: false,   // included -> checkbox checked
    ruleNoLeadingSpecial: true,
  });
  
  const { container, unmount } = await mount(OptionsPanel, {
    modelValue: settings.value,
  });
  
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
  const settings = ref({
    length: 16,
    excludeLowercase: false, // included -> checkbox starts checked
    excludeNumbers: false,
    excludeUppercase: false, // included -> checkbox starts checked
    excludeSymbols: false,
    ruleNoLeadingSpecial: false, // rule starts unchecked
  });
  
  const { container, unmount } = await mount(OptionsPanel, {
    modelValue: settings.value,
  });
  
  // Toggle multiple checkboxes
  const includeLowercase = container.querySelector('#exclude-lowercase');
  const includeUppercase = container.querySelector('#exclude-uppercase');
  const noLeadingSpecial = container.querySelector('#no-leading-special');
  
  // These start checked (included), clicking unchecks them (excludes)
  await userEvent.click(includeLowercase);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await userEvent.click(includeUppercase);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Rule checkbox: starts unchecked, clicking checks it
  await userEvent.click(noLeadingSpecial);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Include checkboxes should now be unchecked (excluded)
  expect(includeLowercase.checked).toBe(false);
  expect(includeUppercase.checked).toBe(false);
  // Rule checkbox should now be checked (active)
  expect(noLeadingSpecial.checked).toBe(true);
  
  unmount();
});


