<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import {
  getParamsFromURL,
  updateURLParams,
  buildQueryString,
} from '../utils/urlParams'
import { generatePassword } from '../utils/password'
import { useSettings } from '../stores/settingsStore'
import OptionsPanel from './OptionsPanel.vue'
import KeyboardExcluder from './KeyboardExcluder.vue'
import NetworkMonitor from './NetworkMonitor.vue'

// --- Shared State from Store ---
const { settings, toggleSetting, updateSetting, setSettings } = useSettings()

const generatedPassword = ref('')
const generationError = ref('')
const copyStatus = ref('idle') // idle, copying, success, error
const shareUrlStatus = ref('idle') // idle, copying, success, error

// Computed for password character coloring
const coloredPassword = computed(() => {
  if (!generatedPassword.value) return []
  return generatedPassword.value.split('').map((char) => {
    if (/[a-z]/.test(char)) return { char, type: 'lowercase' }
    if (/[A-Z]/.test(char)) return { char, type: 'uppercase' }
    if (/[0-9]/.test(char)) return { char, type: 'number' }
    return { char, type: 'symbol' }
  })
})

// --- Logic ---
function handleExcludedCharsChanged(newExcludedChars) {
  updateSetting('excludedChars', newExcludedChars)
}

function toggleCharType(settingKey) {
  toggleSetting(settingKey)
}

// Watch settings for changes and trigger side effects.
// The URL sync is debounced: dragging the length slider fires many updates
// per second, and Safari throttles history.replaceState (~100 calls / 30s).
let urlUpdateTimer = null
watch(
  settings,
  () => {
    generateNewPassword()
    clearTimeout(urlUpdateTimer)
    urlUpdateTimer = setTimeout(() => updateURLParams(settings), 200)
  },
  { deep: true },
)

function generateNewPassword() {
  generationError.value = ''
  try {
    const password = generatePassword({ ...settings })
    if (password.startsWith('Error:')) {
      generationError.value = password
      generatedPassword.value = ''
    } else {
      generatedPassword.value = password
    }
  } catch (error) {
    console.error('Password generation failed:', error)
    generationError.value = 'An unexpected error occurred.'
    generatedPassword.value = ''
  }
}

function loadSettingsFromURL() {
  // setSettings (not Object.assign) so store invariants are enforced on
  // URL-supplied combinations like ?exLower&exUpper&ruleNoLead
  setSettings(getParamsFromURL())
}

async function copyPassword() {
  if (!generatedPassword.value || !navigator.clipboard) {
    copyStatus.value = 'error'
    return
  }
  copyStatus.value = 'copying'
  try {
    await navigator.clipboard.writeText(generatedPassword.value)
    copyStatus.value = 'success'
    setTimeout(() => {
      if (copyStatus.value === 'success') {
        copyStatus.value = 'idle'
      }
    }, 2000)
  } catch (err) {
    console.error('Failed to copy password: ', err)
    copyStatus.value = 'error'
    setTimeout(() => {
      if (copyStatus.value === 'error') {
        copyStatus.value = 'idle'
      }
    }, 2000)
  }
}

function getShareableUrl() {
  const url = new URL(window.location.href)
  const paramsString = buildQueryString(settings)
  url.search = paramsString
  return url.href
}

async function copyShareableUrl() {
  const shareableUrl = getShareableUrl()

  if (!navigator.clipboard) {
    shareUrlStatus.value = 'error'
    return
  }

  shareUrlStatus.value = 'copying'
  try {
    await navigator.clipboard.writeText(shareableUrl)
    shareUrlStatus.value = 'success'

    setTimeout(() => {
      if (shareUrlStatus.value === 'success') {
        shareUrlStatus.value = 'idle'
      }
    }, 2000)
  } catch (err) {
    console.error('Failed to copy URL: ', err)
    shareUrlStatus.value = 'error'
    setTimeout(() => {
      if (shareUrlStatus.value === 'error') {
        shareUrlStatus.value = 'idle'
      }
    }, 2000)
  }
}

const bookmarkHint = ref('')

function bookmarkPage() {
  // Update URL first so the bookmark captures current settings
  updateURLParams(settings)
  const isMac =
    navigator.userAgentData?.platform === 'macOS' ||
    /Mac/.test(navigator.userAgent)
  const shortcut = isMac ? '\u2318+D' : 'Ctrl+D'
  bookmarkHint.value = `Press ${shortcut} to bookmark`
  setTimeout(() => {
    bookmarkHint.value = ''
  }, 3000)
}

// --- Lifecycle ---
onMounted(() => {
  loadSettingsFromURL()
  // The deep watcher is async (pre-flush), so it hasn't run yet — generate
  // explicitly so the initial render always has a password. If the URL did
  // change any settings, the watcher regenerates once afterwards; harmless.
  generateNewPassword()
})
</script>

<template>
  <div class="relative min-h-dvh min-h-screen overflow-hidden bg-zinc-950">
    <!-- Subtle background pattern -->
    <div class="bg-grid-pattern absolute inset-0 opacity-30"></div>

    <!-- Gradient orbs for depth -->
    <div
      class="absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl"
    ></div>
    <div
      class="absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-500/5 blur-3xl"
    ></div>

    <!-- Main content -->
    <div class="relative z-10 px-4 py-8 sm:py-12 md:py-16">
      <div class="mx-auto max-w-2xl">
        <!-- Header -->
        <header class="animate-fade-in mb-10 text-center sm:mb-12">
          <div
            class="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1"
          >
            <span
              class="h-2 w-2 animate-pulse rounded-full bg-emerald-500"
            ></span>
            <span
              class="text-xs font-medium tracking-wide text-emerald-400 uppercase"
              >Works Offline</span
            >
          </div>
          <h1
            class="mb-3 text-3xl font-bold tracking-tight text-zinc-100 sm:text-4xl md:text-5xl"
          >
            Password Generator
          </h1>
          <p
            class="mx-auto max-w-md text-sm text-balance text-zinc-400 sm:text-base"
          >
            Generate strong, secure passwords instantly. Your passwords never
            leave your device.
          </p>
        </header>

        <!-- Password Display Card -->
        <div class="animate-slide-up mb-8" style="animation-delay: 0.1s">
          <div
            v-if="generatedPassword"
            class="group/pw password-glow relative cursor-pointer rounded-2xl p-6 transition-all duration-300 sm:p-8"
            :class="copyStatus === 'success' ? 'animate-pulse-glow' : ''"
            role="button"
            tabindex="0"
            aria-label="Copy password to clipboard"
            @click="copyPassword"
            @keydown.enter.prevent="copyPassword"
            @keydown.space.prevent="copyPassword"
          >
            <!-- Password text with character coloring -->
            <div
              class="text-center font-mono text-lg leading-relaxed break-all sm:text-xl md:text-2xl"
              aria-live="polite"
            >
              <span
                v-for="(item, index) in coloredPassword"
                :key="index"
                :class="{
                  'text-zinc-100': item.type === 'lowercase',
                  'text-emerald-400': item.type === 'uppercase',
                  'text-amber-400': item.type === 'number',
                  'text-rose-400': item.type === 'symbol',
                }"
                >{{ item.char }}</span
              >
            </div>

            <!-- Copy hint -->
            <div
              class="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 text-xs text-emerald-400 transition-opacity"
              :class="
                copyStatus === 'idle'
                  ? 'opacity-0 group-hover/pw:opacity-100'
                  : 'opacity-0'
              "
            >
              Click to copy
            </div>

            <!-- Success overlay -->
            <Transition name="fade">
              <div
                v-if="copyStatus === 'success'"
                class="absolute inset-0 flex items-center justify-center rounded-2xl bg-zinc-900/90 backdrop-blur-sm"
              >
                <div class="flex items-center gap-2 text-emerald-400">
                  <svg
                    class="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span class="font-medium">Copied to clipboard!</span>
                </div>
              </div>
            </Transition>

            <!-- Action buttons (visible on hover) -->
            <div
              class="absolute top-1/2 right-3 flex -translate-y-1/2 flex-col gap-2 opacity-0 transition-opacity duration-200 group-hover/pw:opacity-100 sm:right-4"
            >
              <!-- Regenerate button -->
              <button
                class="btn-icon group/btn"
                aria-label="Generate new password"
                @click.stop="generateNewPassword"
              >
                <svg
                  class="h-5 w-5 transition-transform duration-500 group-hover/btn:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error Display -->
          <div
            v-if="generationError"
            class="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-6 text-center"
            role="alert"
          >
            <div class="flex items-center justify-center gap-2 text-rose-400">
              <svg
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <span class="font-medium">{{ generationError }}</span>
            </div>
          </div>

          <!-- Error messages -->
          <p
            v-if="copyStatus === 'error'"
            class="mt-2 text-center text-xs text-rose-400"
            aria-live="assertive"
          >
            Failed to copy to clipboard
          </p>
        </div>

        <!-- Password Legend (clickable toggles) -->
        <div
          class="animate-fade-in relative mb-10 flex items-center justify-center gap-3 sm:gap-4"
          style="animation-delay: 0.15s"
        >
          <div class="flex items-center gap-3 sm:gap-4">
            <!-- Lowercase -->
            <button
              class="group legend-btn relative"
              :class="
                settings.excludeLowercase
                  ? 'legend-btn-excluded'
                  : 'legend-btn-on'
              "
              :aria-pressed="!settings.excludeLowercase"
              aria-label="Toggle lowercase letters"
              @click="toggleCharType('excludeLowercase')"
            >
              <span
                class="font-mono text-sm font-medium"
                :class="
                  settings.excludeLowercase
                    ? 'text-rose-400 line-through'
                    : 'text-zinc-100'
                "
                >a</span
              >
              <div
                class="legend-tooltip"
                :class="
                  settings.excludeLowercase ? 'legend-tooltip-excluded' : ''
                "
              >
                {{
                  settings.excludeLowercase
                    ? 'Click to include'
                    : 'Lowercase (a-z)'
                }}
              </div>
            </button>

            <!-- Uppercase -->
            <button
              class="group legend-btn relative"
              :class="
                settings.excludeUppercase
                  ? 'legend-btn-excluded'
                  : 'legend-btn-on'
              "
              :aria-pressed="!settings.excludeUppercase"
              aria-label="Toggle uppercase letters"
              @click="toggleCharType('excludeUppercase')"
            >
              <span
                class="font-mono text-sm font-medium"
                :class="
                  settings.excludeUppercase
                    ? 'text-rose-400 line-through'
                    : 'text-emerald-400'
                "
                >A</span
              >
              <div
                class="legend-tooltip"
                :class="
                  settings.excludeUppercase ? 'legend-tooltip-excluded' : ''
                "
              >
                {{
                  settings.excludeUppercase
                    ? 'Click to include'
                    : 'Uppercase (A-Z)'
                }}
              </div>
            </button>

            <!-- Numbers -->
            <button
              class="group legend-btn relative"
              :class="
                settings.excludeNumbers
                  ? 'legend-btn-excluded'
                  : 'legend-btn-on'
              "
              :aria-pressed="!settings.excludeNumbers"
              aria-label="Toggle numbers"
              @click="toggleCharType('excludeNumbers')"
            >
              <span
                class="font-mono text-sm font-medium"
                :class="
                  settings.excludeNumbers
                    ? 'text-rose-400 line-through'
                    : 'text-amber-400'
                "
                >7</span
              >
              <div
                class="legend-tooltip"
                :class="
                  settings.excludeNumbers ? 'legend-tooltip-excluded' : ''
                "
              >
                {{
                  settings.excludeNumbers ? 'Click to include' : 'Numbers (0-9)'
                }}
              </div>
            </button>

            <!-- Symbols -->
            <button
              class="group legend-btn relative"
              :class="
                settings.excludeSymbols
                  ? 'legend-btn-excluded'
                  : 'legend-btn-on'
              "
              :aria-pressed="!settings.excludeSymbols"
              aria-label="Toggle symbols"
              @click="toggleCharType('excludeSymbols')"
            >
              <span
                class="font-mono text-sm font-medium"
                :class="
                  settings.excludeSymbols
                    ? 'text-rose-400 line-through'
                    : 'text-rose-400'
                "
                >@</span
              >
              <div
                class="legend-tooltip"
                :class="
                  settings.excludeSymbols ? 'legend-tooltip-excluded' : ''
                "
              >
                {{
                  settings.excludeSymbols
                    ? 'Click to include'
                    : 'Symbols (!@#$...)'
                }}
              </div>
            </button>
          </div>

          <!-- Mobile Regenerate button (visible on small screens) -->
          <button
            class="btn-icon group/btn ml-2 md:hidden"
            aria-label="Generate new password"
            @click="generateNewPassword"
          >
            <svg
              class="h-5 w-5 transition-transform duration-500 group-hover/btn:rotate-180"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </button>
        </div>

        <!-- Options Panel -->
        <div class="animate-slide-up mb-6" style="animation-delay: 0.2s">
          <div class="glass-card rounded-2xl p-6 sm:p-8">
            <h2
              class="mb-6 flex items-center gap-2 text-lg font-semibold text-zinc-100 sm:text-xl"
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
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Options
            </h2>
            <OptionsPanel />
          </div>
        </div>

        <!-- Keyboard Excluder -->
        <div class="animate-slide-up mb-6" style="animation-delay: 0.25s">
          <KeyboardExcluder
            v-model="settings.excludedChars"
            @update:model-value="handleExcludedCharsChanged"
          />
        </div>

        <!-- Share & Save Section -->
        <div class="animate-slide-up mb-6" style="animation-delay: 0.3s">
          <div class="glass-card rounded-2xl p-5 sm:p-6">
            <h2
              class="mb-3 flex items-center gap-2 text-base font-semibold text-zinc-100 sm:text-lg"
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
                  d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"
                />
              </svg>
              Share & Save
            </h2>
            <p class="mb-4 text-sm text-zinc-400">
              Share your current settings with others or bookmark this page to
              keep generating passwords with the same preferences.
            </p>
            <div class="flex flex-wrap gap-3">
              <!-- Copy URL button -->
              <button
                aria-label="Copy shareable URL"
                class="focus-ring flex min-w-[200px] items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200"
                :class="
                  shareUrlStatus === 'success'
                    ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-400'
                    : shareUrlStatus === 'error'
                      ? 'border border-rose-500/30 bg-rose-500/20 text-rose-400'
                      : 'border border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-600 hover:bg-zinc-700 hover:text-zinc-100'
                "
                @click="copyShareableUrl"
              >
                <svg
                  v-if="shareUrlStatus === 'success'"
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <svg
                  v-else
                  class="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5A3.375 3.375 0 006.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0015 2.25h-1.5a2.251 2.251 0 00-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 00-9-9z"
                  />
                </svg>
                {{
                  shareUrlStatus === 'success'
                    ? 'URL Copied!'
                    : 'Copy Shareable URL'
                }}
              </button>

              <!-- Bookmark button -->
              <div class="relative">
                <button
                  class="focus-ring flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-800 px-4 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-700 hover:text-zinc-100"
                  @click="bookmarkPage"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z"
                    />
                  </svg>
                  Bookmark Settings
                </button>
                <Transition name="fade">
                  <span
                    v-if="bookmarkHint"
                    class="absolute -bottom-7 left-0 text-xs whitespace-nowrap text-zinc-400"
                  >
                    {{ bookmarkHint }}
                  </span>
                </Transition>
              </div>
            </div>
            <p
              v-if="shareUrlStatus === 'error'"
              class="mt-2 text-xs text-rose-400"
              aria-live="assertive"
            >
              Failed to copy URL to clipboard
            </p>
          </div>
        </div>

        <!-- Network Monitor -->
        <div class="animate-slide-up" style="animation-delay: 0.35s">
          <NetworkMonitor />
        </div>

        <!-- Footer -->
        <footer
          class="animate-fade-in mt-12 border-t border-zinc-800/50 pt-8 text-center"
          style="animation-delay: 0.35s"
        >
          <p class="text-sm text-zinc-500">
            Built with security in mind.
            <a
              href="https://ryanroga.com"
              target="_blank"
              rel="noopener noreferrer"
              class="text-emerald-400 transition-colors hover:text-emerald-300"
            >
              ryanroga.com
            </a>
          </p>
        </footer>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Legend tooltip */
.legend-tooltip {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 0.5rem;
  padding: 0.375rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 500;
  border-radius: 0.5rem;
  white-space: nowrap;
  z-index: 50;
  background-color: rgb(244 244 245);
  color: rgb(24 24 27);
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* Only show tooltips on hover for non-touch devices */
@media (hover: hover) and (pointer: fine) {
  .group:hover .legend-tooltip {
    opacity: 1;
    visibility: visible;
  }
}

.legend-tooltip::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: rgb(244 244 245);
}

/* Legend toggle buttons */
.legend-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.5rem;
  border: 1px solid;
  cursor: pointer;
  transition: all 0.2s ease;
}

.legend-btn:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 2px rgb(9 9 11),
    0 0 0 4px rgb(16 185 129 / 0.5);
}

.legend-btn-on {
  background-color: rgb(39 39 42 / 0.5);
  border-color: rgb(63 63 70 / 0.5);
}

.legend-btn-on:hover {
  background-color: rgb(39 39 42);
  border-color: rgb(82 82 91);
}

.legend-btn-excluded {
  background-color: rgb(244 63 94 / 0.1);
  border-color: rgb(244 63 94 / 0.3);
}

.legend-btn-excluded:hover {
  background-color: rgb(244 63 94 / 0.15);
  border-color: rgb(244 63 94 / 0.4);
}

.legend-tooltip-excluded {
  background-color: rgb(244 63 94) !important;
  color: white !important;
}

.legend-tooltip-excluded::after {
  border-top-color: rgb(244 63 94) !important;
}
</style>
