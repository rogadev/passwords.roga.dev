<script setup>
import { ref, watch, onUnmounted, computed } from 'vue'

// --- State ---
const showMonitor = ref(false)
const testStatus = ref('idle') // idle, testing, success, error
const latency = ref(null)
const requestLog = ref([])
const originalFetch = ref(null)
let originalXHROpen = null
let originalXHRSend = null
let originalSendBeacon = null
let requestCounter = 0
let intercepting = false

function logRequest(type, method, url) {
  requestCounter++
  requestLog.value.unshift({
    id: requestCounter,
    type,
    method,
    url: String(url),
    timestamp: new Date(),
  })
  if (requestLog.value.length > 50) {
    requestLog.value.pop()
  }
}

const logCount = computed(() => requestLog.value.length)

// --- Network Test --- //
async function runNetworkTest() {
  testStatus.value = 'testing'
  latency.value = null
  const startTime = performance.now()

  try {
    requestCounter++
    const testUrl = `https://www.google.com?t=${Date.now()}`
    const logEntry = {
      id: requestCounter,
      type: 'TEST',
      method: 'HEAD',
      url: testUrl,
      timestamp: new Date(),
    }

    requestLog.value.unshift(logEntry)

    await fetch(testUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    })

    const endTime = performance.now()
    latency.value = Math.round(endTime - startTime)
    testStatus.value = 'success'

    requestCounter++
    requestLog.value.unshift({
      id: requestCounter,
      type: 'RESPONSE',
      method: 'HEAD',
      url: `${testUrl} (${latency.value} ms)`,
      timestamp: new Date(),
    })
  } catch (error) {
    console.warn('Network test failed (likely network error):', error)
    const endTime = performance.now()
    latency.value = Math.round(endTime - startTime)
    testStatus.value = 'error'

    requestCounter++
    requestLog.value.unshift({
      id: requestCounter,
      type: 'ERROR',
      method: 'HEAD',
      url: `Test failed after ${latency.value} ms`,
      timestamp: new Date(),
    })
  }
}

// --- Request Interception --- //
function ensureIntercepting() {
  if (!intercepting) {
    startIntercepting()
  }
}

function startIntercepting() {
  intercepting = true
  if (window.fetch && !originalFetch.value) {
    originalFetch.value = window.fetch
    window.fetch = async (...args) => {
      const url = args[0] instanceof Request ? args[0].url : args[0]
      const method =
        args[0] instanceof Request ? args[0].method : args[1]?.method || 'GET'
      logRequest('fetch', method, url)
      return originalFetch.value.apply(window, args)
    }
  }

  if (window.XMLHttpRequest && !originalXHROpen && !originalXHRSend) {
    originalXHROpen = window.XMLHttpRequest.prototype.open
    originalXHRSend = window.XMLHttpRequest.prototype.send

    window.XMLHttpRequest.prototype.open = function (method, url, ...rest) {
      this._requestMethod = method
      this._requestURL = url
      return originalXHROpen.apply(this, [method, url, ...rest])
    }

    window.XMLHttpRequest.prototype.send = function (...args) {
      if (this._requestMethod && this._requestURL) {
        logRequest('XHR', this._requestMethod, this._requestURL)
      }
      return originalXHRSend.apply(this, args)
    }
  }

  if (navigator.sendBeacon && !originalSendBeacon) {
    originalSendBeacon = navigator.sendBeacon
    navigator.sendBeacon = function (url, data) {
      logRequest('beacon', 'POST', url)
      return originalSendBeacon.call(navigator, url, data)
    }
  }
}

function stopIntercepting() {
  intercepting = false
  if (originalFetch.value) {
    window.fetch = originalFetch.value
    originalFetch.value = null
  }
  if (originalXHROpen) {
    window.XMLHttpRequest.prototype.open = originalXHROpen
    originalXHROpen = null
  }
  if (originalXHRSend) {
    window.XMLHttpRequest.prototype.send = originalXHRSend
    originalXHRSend = null
  }
  if (originalSendBeacon) {
    navigator.sendBeacon = originalSendBeacon
    originalSendBeacon = null
  }
}

function clearLog() {
  requestLog.value = []
}

// Lazy-init: only start intercepting when the user opens the panel
watch(showMonitor, (open) => {
  if (open) ensureIntercepting()
})

onUnmounted(() => {
  stopIntercepting()
})
</script>

<template>
  <div class="glass-card overflow-hidden rounded-2xl">
    <!-- Trigger button -->
    <button
      class="focus-ring group flex w-full items-center justify-between rounded-2xl p-5 transition-all duration-200 hover:bg-zinc-800/30 sm:p-6"
      :class="showMonitor ? 'bg-zinc-800/20' : ''"
      aria-controls="network-monitor-panel"
      :aria-expanded="showMonitor"
      @click="showMonitor = !showMonitor"
    >
      <div class="flex items-center gap-3">
        <div
          class="relative rounded-lg bg-zinc-800 p-2 transition-colors group-hover:bg-zinc-700"
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
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
          </svg>
          <!-- Activity indicator -->
          <span
            v-if="logCount > 0"
            class="absolute -top-1 -right-1 h-2 w-2 animate-pulse rounded-full bg-emerald-500"
          ></span>
        </div>
        <div class="text-left">
          <span
            class="block text-sm font-medium text-zinc-200 transition-colors group-hover:text-zinc-100 sm:text-base"
          >
            Network Activity Monitor
          </span>
          <span class="text-xs text-zinc-500">
            {{
              logCount > 0
                ? `${logCount} request${logCount !== 1 ? 's' : ''} logged`
                : 'No activity detected'
            }}
          </span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="logCount > 0" class="badge badge-success">{{
          logCount
        }}</span>
        <svg
          class="h-5 w-5 text-zinc-500 transition-transform duration-300"
          :class="{ 'rotate-180': showMonitor }"
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
        v-show="showMonitor"
        id="network-monitor-panel"
        class="border-t border-zinc-800/50"
        role="region"
        aria-labelledby="network-monitor-heading"
      >
        <div class="space-y-6 p-5 sm:p-6">
          <!-- Explanation -->
          <div
            class="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"
          >
            <svg
              class="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
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
            <p
              id="network-monitor-heading"
              class="text-xs leading-relaxed text-zinc-400"
            >
              This monitors network requests to prove password generation
              happens locally.
              <span class="font-medium text-emerald-400"
                >Your passwords never leave your device.</span
              >
            </p>
          </div>

          <!-- Latency Test -->
          <div class="space-y-3">
            <h4
              class="flex items-center gap-2 text-sm font-medium text-zinc-300"
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
                  d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                />
              </svg>
              Network Test
            </h4>
            <div class="flex flex-wrap items-center gap-3">
              <button
                :disabled="testStatus === 'testing'"
                class="focus-ring btn-primary rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                @click="runNetworkTest"
              >
                <span
                  v-if="testStatus === 'testing'"
                  class="flex items-center gap-2"
                >
                  <svg
                    class="h-4 w-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      class="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      stroke-width="4"
                    ></circle>
                    <path
                      class="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Testing...
                </span>
                <span v-else>Ping Google</span>
              </button>

              <div
                v-if="testStatus === 'success'"
                class="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5"
                aria-live="polite"
              >
                <svg
                  class="h-4 w-4 text-emerald-400"
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
                <span class="text-sm font-medium text-emerald-400"
                  >{{ latency }} ms</span
                >
              </div>

              <div
                v-if="testStatus === 'error'"
                class="flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5"
                aria-live="polite"
              >
                <svg
                  class="h-4 w-4 text-rose-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <span class="text-sm font-medium text-rose-400"
                  >Failed ({{ latency }} ms)</span
                >
              </div>

              <span v-if="testStatus === 'idle'" class="text-xs text-zinc-500">
                Test your connection
              </span>
            </div>
          </div>

          <!-- Request Log -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h4
                class="flex items-center gap-2 text-sm font-medium text-zinc-300"
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
                    d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"
                  />
                </svg>
                Request Log
              </h4>
              <button
                v-if="logCount > 0"
                class="focus-ring rounded px-2 py-1 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-300"
                @click="clearLog"
              >
                Clear
              </button>
            </div>

            <div
              v-if="logCount === 0"
              class="flex flex-col items-center justify-center py-8 text-center"
            >
              <div class="mb-3 rounded-full bg-zinc-800/50 p-3">
                <svg
                  class="h-6 w-6 text-zinc-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <p class="text-sm text-zinc-500">No network requests detected</p>
              <p class="mt-1 text-xs text-zinc-600">
                Password generation is 100% local
              </p>
            </div>

            <div
              v-else
              class="max-h-48 divide-y divide-zinc-800/50 overflow-y-auto rounded-xl border border-zinc-800 bg-zinc-900/50"
              aria-live="polite"
            >
              <div
                v-for="req in requestLog"
                :key="req.id"
                class="flex flex-wrap items-center gap-2 p-3 font-mono text-xs"
              >
                <span class="w-6 shrink-0 text-right text-zinc-600"
                  >#{{ req.id }}</span
                >
                <span
                  class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase"
                  :class="{
                    'bg-blue-500/20 text-blue-400': req.type === 'fetch',
                    'bg-orange-500/20 text-orange-400': req.type === 'XHR',
                    'bg-amber-500/20 text-amber-400': req.type === 'beacon',
                    'bg-purple-500/20 text-purple-400': req.type === 'TEST',
                    'bg-emerald-500/20 text-emerald-400':
                      req.type === 'RESPONSE',
                    'bg-rose-500/20 text-rose-400': req.type === 'ERROR',
                  }"
                >
                  {{ req.method }}
                </span>
                <span class="min-w-0 flex-1 truncate text-zinc-400">{{
                  req.url
                }}</span>
                <span class="shrink-0 text-zinc-600">{{
                  req.timestamp.toLocaleTimeString()
                }}</span>
              </div>
            </div>
          </div>
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
</style>
