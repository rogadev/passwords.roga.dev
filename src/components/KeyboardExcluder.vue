<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(['update:modelValue']);

const showKeyboard = ref(false);

const charSets = {
  Numbers: '0123456789'.split(''),
  Lowercase: 'abcdefghijklmnopqrstuvwxyz'.split(''),
  Uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
  Symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=\\'.split(''),
};

const excludedSet = computed(() => new Set(props.modelValue.split('')));

const excludedCount = computed(() => excludedSet.value.size);

function toggleExclude(char) {
  const currentSet = new Set(excludedSet.value);

  if (currentSet.has(char)) {
    currentSet.delete(char);
  } else {
    currentSet.add(char);
  }

  const newExcluded = Array.from(currentSet).join('');
  emit('update:modelValue', newExcluded);
}

function clearAll() {
  emit('update:modelValue', '');
}
</script>

<template>
  <div class="glass-card rounded-2xl overflow-hidden">
    <!-- Trigger button -->
    <button 
      @click="showKeyboard = !showKeyboard"
      class="w-full flex items-center justify-between p-5 sm:p-6 transition-all duration-200 hover:bg-zinc-800/30 focus-ring rounded-2xl group"
      :class="showKeyboard ? 'bg-zinc-800/20' : ''"
      aria-controls="keyboard-excluder-panel" 
      :aria-expanded="showKeyboard"
    >
      <div class="flex items-center gap-3">
        <div class="p-2 rounded-lg bg-zinc-800 group-hover:bg-zinc-700 transition-colors">
          <svg class="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6h.008v.008H5.25V6zM7.5 6h.008v.008H7.5V6zm2.25 0h.008v.008H9.75V6z" />
          </svg>
        </div>
        <div class="text-left">
          <span class="block text-sm sm:text-base font-medium text-zinc-200 group-hover:text-zinc-100 transition-colors">
            Exclude Specific Characters
          </span>
          <span class="text-xs text-zinc-500">
            {{ excludedCount > 0 ? `${excludedCount} character${excludedCount !== 1 ? 's' : ''} excluded` : 'Click to customize' }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="excludedCount > 0" class="badge badge-error">{{ excludedCount }}</span>
        <svg 
          class="w-5 h-5 text-zinc-500 transition-transform duration-300" 
          :class="{ 'rotate-180': showKeyboard }" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          stroke-width="1.5"
        >
          <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
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
        <div class="p-5 sm:p-6 space-y-6">
          <!-- Instructions -->
          <div class="flex items-start gap-3 p-3 rounded-xl bg-zinc-800/30 border border-zinc-800">
            <svg class="w-4 h-4 text-zinc-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
            <p id="keyboard-excluder-heading" class="text-xs text-zinc-400 leading-relaxed">
              Click any character to exclude it from generated passwords. Excluded characters appear with a strikethrough.
            </p>
          </div>

          <!-- Character sets -->
          <div class="space-y-5">
            <div v-for="(chars, setName) in charSets" :key="setName">
              <h4 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
                <span 
                  class="w-2 h-2 rounded-full"
                  :class="{
                    'bg-amber-400': setName === 'Numbers',
                    'bg-zinc-400': setName === 'Lowercase',
                    'bg-emerald-400': setName === 'Uppercase',
                    'bg-rose-400': setName === 'Symbols'
                  }"
                ></span>
                {{ setName }}
              </h4>
              <div class="flex flex-wrap gap-1.5 sm:gap-2">
                <button 
                  v-for="char in chars" 
                  :key="char" 
                  @click="toggleExclude(char)" 
                  class="char-key w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center font-mono text-sm border focus-ring"
                  :class="excludedSet.has(char) ? 'char-key-excluded' : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700 hover:border-zinc-600 hover:text-zinc-100'"
                  :aria-pressed="excludedSet.has(char)"
                  :aria-label="`${excludedSet.has(char) ? 'Include' : 'Exclude'} character ${char}`"
                >
                  {{ char }}
                </button>
              </div>
            </div>
          </div>

          <!-- Currently excluded summary -->
          <Transition name="fade">
            <div v-if="modelValue" class="flex items-center justify-between gap-3 p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <div class="flex items-center gap-2 min-w-0">
                <svg class="w-4 h-4 text-rose-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
                <span class="text-xs text-zinc-400">Excluded:</span>
                <span class="font-mono text-sm text-rose-400 truncate">{{ modelValue }}</span>
              </div>
              <button 
                @click="clearAll"
                class="shrink-0 px-3 py-1.5 text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors focus-ring"
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
