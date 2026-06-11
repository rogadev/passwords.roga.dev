<script setup>
import { ref, computed } from 'vue'
import { CHAR_SETS } from '../utils/password'

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
})
const emit = defineEmits(['update:modelValue'])

const showKeyboard = ref(false)

// Derived from the generator's character sets so the keyboard can never
// drift out of sync with what generatePassword actually uses
const charSets = {
  Numbers: CHAR_SETS.NUMBERS.split(''),
  Lowercase: CHAR_SETS.LOWERCASE.split(''),
  Uppercase: CHAR_SETS.UPPERCASE.split(''),
  Symbols: CHAR_SETS.SYMBOLS.split(''),
}

const excludedSet = computed(() => new Set(props.modelValue.split('')))

const excludedCount = computed(() => excludedSet.value.size)

function toggleExclude(char) {
  const currentSet = new Set(excludedSet.value)

  if (currentSet.has(char)) {
    currentSet.delete(char)
  } else {
    currentSet.add(char)
  }

  const newExcluded = Array.from(currentSet).join('')
  emit('update:modelValue', newExcluded)
}

function clearAll() {
  emit('update:modelValue', '')
}
</script>

<template>
  <div class="glass-card overflow-hidden rounded-2xl">
    <!-- Trigger button -->
    <button
      class="focus-ring group flex w-full items-center justify-between rounded-2xl p-5 transition-all duration-200 hover:bg-zinc-800/30 sm:p-6"
      :class="showKeyboard ? 'bg-zinc-800/20' : ''"
      aria-controls="keyboard-excluder-panel"
      :aria-expanded="showKeyboard"
      @click="showKeyboard = !showKeyboard"
    >
      <div class="flex items-center gap-3">
        <div
          class="rounded-lg bg-zinc-800 p-2 transition-colors group-hover:bg-zinc-700"
        >
          <svg
            class="h-5 w-5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z"
            />
          </svg>
        </div>
        <div class="text-left">
          <span
            class="block text-sm font-medium text-zinc-200 transition-colors group-hover:text-zinc-100 sm:text-base"
          >
            Exclude Specific Characters
          </span>
          <span class="text-xs text-zinc-500">
            {{
              excludedCount > 0
                ? `${excludedCount} character${excludedCount !== 1 ? 's' : ''} excluded`
                : 'Click to customize'
            }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="excludedCount > 0" class="badge badge-error">{{
          excludedCount
        }}</span>
        <svg
          class="h-5 w-5 text-zinc-500 transition-transform duration-300"
          :class="{ 'rotate-180': showKeyboard }"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>
    </button>

    <!-- Collapsible content -->
    <Transition name="collapse">
      <div
        v-show="showKeyboard"
        id="keyboard-excluder-panel"
        class="border-t border-zinc-800/50"
        role="region"
        aria-labelledby="keyboard-excluder-heading"
      >
        <div class="space-y-6 p-5 sm:p-6">
          <!-- Instructions -->
          <div
            class="flex items-start gap-3 rounded-xl border border-zinc-800 bg-zinc-800/30 p-3"
          >
            <svg
              class="mt-0.5 h-4 w-4 shrink-0 text-zinc-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
              />
            </svg>
            <p
              id="keyboard-excluder-heading"
              class="text-xs leading-relaxed text-zinc-400"
            >
              Click any character to exclude it from generated passwords.
              Excluded characters appear with a strikethrough.
            </p>
          </div>

          <!-- Character sets -->
          <div class="space-y-5">
            <div v-for="(chars, setName) in charSets" :key="setName">
              <h4
                class="mb-3 flex items-center gap-2 text-xs font-semibold tracking-wider text-zinc-500 uppercase"
              >
                <span
                  class="h-2 w-2 rounded-full"
                  :class="{
                    'bg-amber-400': setName === 'Numbers',
                    'bg-zinc-400': setName === 'Lowercase',
                    'bg-emerald-400': setName === 'Uppercase',
                    'bg-rose-400': setName === 'Symbols',
                  }"
                ></span>
                {{ setName }}
              </h4>
              <div class="flex flex-wrap gap-1.5 sm:gap-2">
                <button
                  v-for="char in chars"
                  :key="char"
                  class="char-key focus-ring flex h-8 w-8 items-center justify-center rounded-lg border font-mono text-sm sm:h-9 sm:w-9"
                  :class="
                    excludedSet.has(char)
                      ? 'char-key-excluded'
                      : 'border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700 hover:text-zinc-100'
                  "
                  :aria-pressed="excludedSet.has(char)"
                  :aria-label="`${excludedSet.has(char) ? 'Include' : 'Exclude'} character ${char}`"
                  @click="toggleExclude(char)"
                >
                  {{ char }}
                </button>
              </div>
            </div>
          </div>

          <!-- Currently excluded summary -->
          <Transition name="fade">
            <div
              v-if="modelValue"
              class="flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4"
            >
              <div class="flex min-w-0 items-center gap-2">
                <svg
                  class="h-4 w-4 shrink-0 text-rose-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  />
                </svg>
                <span class="text-xs text-zinc-400">Excluded:</span>
                <span class="truncate font-mono text-sm text-rose-400">{{
                  modelValue
                }}</span>
              </div>
              <button
                class="focus-ring shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                @click="clearAll"
              >
                Clear all
              </button>
            </div>
          </Transition>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  max-height: 0;
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 1000px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
