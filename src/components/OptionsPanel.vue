<script setup>
import { computed } from 'vue'
import { useSettings } from '../stores/settingsStore'

// Use the shared store - both PasswordGenerator and OptionsPanel use the same reactive object
const { settings, updateSetting } = useSettings()

// Length computed for v-model binding.
// Clamped to the generator's supported range (1-128); an empty/invalid
// value mid-edit is ignored so typing isn't fought by the binding.
const length = computed({
  get: () => settings.length,
  set: (val) => {
    const parsed = parseInt(val, 10)
    if (Number.isNaN(parsed)) return
    updateSetting('length', Math.min(128, Math.max(1, parsed)))
  },
})

// Inverted computed props: checked = included (exclude = false)
// These read directly from the shared store
const includeLowercase = computed({
  get: () => !settings.excludeLowercase,
  set: (val) => updateSetting('excludeLowercase', !val),
})

const includeNumbers = computed({
  get: () => !settings.excludeNumbers,
  set: (val) => updateSetting('excludeNumbers', !val),
})

const includeUppercase = computed({
  get: () => !settings.excludeUppercase,
  set: (val) => updateSetting('excludeUppercase', !val),
})

const includeSymbols = computed({
  get: () => !settings.excludeSymbols,
  set: (val) => updateSetting('excludeSymbols', !val),
})

// Check if no letters are available (both lowercase and uppercase excluded)
const noLettersAvailable = computed(
  () => settings.excludeLowercase && settings.excludeUppercase,
)

const ruleNoLeadingSpecial = computed({
  get: () => {
    // If no letters available, this rule can't be applied
    if (noLettersAvailable.value) return false
    return settings.ruleNoLeadingSpecial
  },
  set: (val) => {
    // Don't allow enabling if no letters available
    if (noLettersAvailable.value) return
    updateSetting('ruleNoLeadingSpecial', val)
  },
})
</script>

<template>
  <div class="space-y-8">
    <!-- Length Control -->
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <label for="length-range" class="text-sm font-medium text-zinc-300">
          Password Length
        </label>
        <div class="flex items-center gap-2">
          <input
            id="length-number"
            v-model.number="length"
            type="number"
            min="1"
            max="128"
            class="input-base focus-ring w-16 rounded-lg px-3 py-1.5 text-center font-mono text-sm font-medium"
            aria-label="Password length number input"
            @focus="$event.target.select()"
          />
          <span class="text-xs text-zinc-500">chars</span>
        </div>
      </div>
      <div class="relative">
        <input
          id="length-range"
          v-model.number="length"
          type="range"
          min="6"
          max="64"
          class="focus-ring w-full rounded-lg"
          aria-labelledby="length-label"
        />
        <!-- Range markers -->
        <div class="mt-1.5 flex justify-between px-1">
          <span class="text-xs text-zinc-600">6</span>
          <span class="text-xs text-zinc-600">64</span>
        </div>
      </div>
      <span id="length-label" class="sr-only">Password Length</span>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Character Type Toggles -->
    <div class="space-y-3">
      <h3 class="mb-4 text-sm font-medium text-zinc-300">Include Characters</h3>

      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <!-- Lowercase toggle -->
        <label
          for="exclude-lowercase"
          class="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-200"
          :class="
            includeLowercase
              ? 'bg-zinc-800/50 hover:bg-zinc-800/70'
              : 'bg-zinc-800/30'
          "
        >
          <input
            id="exclude-lowercase"
            v-model="includeLowercase"
            type="checkbox"
            class="checkbox-custom focus-ring"
          />
          <div class="min-w-0 flex-1">
            <span
              class="block text-sm font-medium"
              :class="
                includeLowercase
                  ? 'text-zinc-200'
                  : 'text-zinc-500 line-through'
              "
            >
              Lowercase
            </span>
            <span
              class="font-mono text-xs"
              :class="includeLowercase ? 'text-zinc-500' : 'text-zinc-600'"
              >a-z</span
            >
          </div>
          <span v-if="!includeLowercase" class="badge badge-error text-[10px]"
            >Off</span
          >
        </label>

        <!-- Uppercase toggle -->
        <label
          for="exclude-uppercase"
          class="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-200"
          :class="
            includeUppercase
              ? 'bg-zinc-800/50 hover:bg-zinc-800/70'
              : 'bg-zinc-800/30'
          "
        >
          <input
            id="exclude-uppercase"
            v-model="includeUppercase"
            type="checkbox"
            class="checkbox-custom focus-ring"
          />
          <div class="min-w-0 flex-1">
            <span
              class="block text-sm font-medium"
              :class="
                includeUppercase
                  ? 'text-zinc-200'
                  : 'text-zinc-500 line-through'
              "
            >
              Uppercase
            </span>
            <span
              class="font-mono text-xs"
              :class="includeUppercase ? 'text-zinc-500' : 'text-zinc-600'"
              >A-Z</span
            >
          </div>
          <span v-if="!includeUppercase" class="badge badge-error text-[10px]"
            >Off</span
          >
        </label>

        <!-- Numbers toggle -->
        <label
          for="exclude-numbers"
          class="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-200"
          :class="
            includeNumbers
              ? 'bg-zinc-800/50 hover:bg-zinc-800/70'
              : 'bg-zinc-800/30'
          "
        >
          <input
            id="exclude-numbers"
            v-model="includeNumbers"
            type="checkbox"
            class="checkbox-custom focus-ring"
          />
          <div class="min-w-0 flex-1">
            <span
              class="block text-sm font-medium"
              :class="
                includeNumbers ? 'text-zinc-200' : 'text-zinc-500 line-through'
              "
            >
              Numbers
            </span>
            <span
              class="font-mono text-xs"
              :class="includeNumbers ? 'text-zinc-500' : 'text-zinc-600'"
              >0-9</span
            >
          </div>
          <span v-if="!includeNumbers" class="badge badge-error text-[10px]"
            >Off</span
          >
        </label>

        <!-- Symbols toggle -->
        <label
          for="exclude-symbols"
          class="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-all duration-200"
          :class="
            includeSymbols
              ? 'bg-zinc-800/50 hover:bg-zinc-800/70'
              : 'bg-zinc-800/30'
          "
        >
          <input
            id="exclude-symbols"
            v-model="includeSymbols"
            type="checkbox"
            class="checkbox-custom focus-ring"
          />
          <div class="min-w-0 flex-1">
            <span
              class="block text-sm font-medium"
              :class="
                includeSymbols ? 'text-zinc-200' : 'text-zinc-500 line-through'
              "
            >
              Symbols
            </span>
            <span
              class="font-mono text-xs"
              :class="includeSymbols ? 'text-zinc-500' : 'text-zinc-600'"
              >!@#$...</span
            >
          </div>
          <span v-if="!includeSymbols" class="badge badge-error text-[10px]"
            >Off</span
          >
        </label>
      </div>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Rules Section -->
    <div class="space-y-3">
      <h3
        class="mb-4 flex items-center gap-2 text-sm font-medium text-zinc-300"
      >
        <svg
          class="h-4 w-4 text-zinc-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
          />
        </svg>
        Password Rules
      </h3>

      <label
        for="no-leading-special"
        class="flex items-center gap-3 rounded-xl p-3 transition-all duration-200"
        :class="[
          noLettersAvailable
            ? 'cursor-not-allowed bg-zinc-800/20 opacity-50'
            : ruleNoLeadingSpecial
              ? 'cursor-pointer border border-emerald-500/20 bg-emerald-500/10'
              : 'cursor-pointer border border-transparent bg-zinc-800/50 hover:bg-zinc-800/70',
        ]"
      >
        <input
          id="no-leading-special"
          v-model="ruleNoLeadingSpecial"
          type="checkbox"
          :disabled="noLettersAvailable"
          class="checkbox-custom focus-ring"
        />
        <div class="min-w-0 flex-1">
          <span
            class="block text-sm font-medium"
            :class="
              noLettersAvailable
                ? 'text-zinc-600'
                : ruleNoLeadingSpecial
                  ? 'text-emerald-400'
                  : 'text-zinc-200'
            "
          >
            No leading numbers or symbols
          </span>
          <span
            class="text-xs"
            :class="noLettersAvailable ? 'text-zinc-600' : 'text-zinc-500'"
          >
            {{
              noLettersAvailable
                ? 'Requires letters to be included'
                : 'Password starts with a letter'
            }}
          </span>
        </div>
        <span
          v-if="ruleNoLeadingSpecial && !noLettersAvailable"
          class="badge badge-success text-[10px]"
          >Active</span
        >
        <span v-if="noLettersAvailable" class="badge badge-error text-[10px]"
          >N/A</span
        >
      </label>
    </div>
  </div>
</template>
