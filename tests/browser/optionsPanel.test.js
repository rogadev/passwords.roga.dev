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

test('toggles exclude lowercase checkbox', async () => {
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
  
  const checkbox = container.querySelector('#exclude-lowercase');
  expect(checkbox.checked).toBe(false);
  
  // Click the checkbox
  await userEvent.click(checkbox);
  
  // Wait for updates
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Checkbox should be checked now
  expect(checkbox.checked).toBe(true);
  
  unmount();
});

test('toggles exclude uppercase checkbox', async () => {
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
  
  const checkbox = container.querySelector('#exclude-uppercase');
  expect(checkbox.checked).toBe(false);
  
  await userEvent.click(checkbox);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  expect(checkbox.checked).toBe(true);
  
  unmount();
});

test('reflects initial prop values in UI', async () => {
  const settings = ref({
    length: 24,
    excludeLowercase: true,
    excludeNumbers: false,
    excludeUppercase: true,
    excludeSymbols: false,
    ruleNoLeadingSpecial: true,
  });
  
  const { container, unmount } = await mount(OptionsPanel, {
    modelValue: settings.value,
  });
  
  // Check length
  const numberInput = container.querySelector('#length-number');
  expect(numberInput.value).toBe('24');
  
  // Check checkboxes
  expect(container.querySelector('#exclude-lowercase').checked).toBe(true);
  expect(container.querySelector('#exclude-numbers').checked).toBe(false);
  expect(container.querySelector('#exclude-uppercase').checked).toBe(true);
  expect(container.querySelector('#exclude-symbols').checked).toBe(false);
  expect(container.querySelector('#no-leading-special').checked).toBe(true);
  
  unmount();
});

test('can toggle multiple checkboxes', async () => {
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
  
  // Toggle multiple checkboxes
  const excludeLowercase = container.querySelector('#exclude-lowercase');
  const excludeUppercase = container.querySelector('#exclude-uppercase');
  const noLeadingSpecial = container.querySelector('#no-leading-special');
  
  await userEvent.click(excludeLowercase);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await userEvent.click(excludeUppercase);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await userEvent.click(noLeadingSpecial);
  await new Promise(resolve => setTimeout(resolve, 100));
  
  // Check all are checked
  expect(excludeLowercase.checked).toBe(true);
  expect(excludeUppercase.checked).toBe(true);
  expect(noLeadingSpecial.checked).toBe(true);
  
  unmount();
});


