import {
  Capacitor,
  registerPlugin,
  type PluginListenerHandle,
} from '@capacitor/core';
import {
  getApiBaseUrl,
  normalizeApiBaseUrl,
  setApiBaseUrl,
  verifyCampusQuestBackend,
} from './apiConfig';

export type BackendConnectionStatus = 'connected' | 'searching' | 'disconnected';

export interface BackendConnectionSnapshot {
  status: BackendConnectionStatus;
  detail: string;
  baseUrl?: string;
}

interface DiscoveryCandidateEvent {
  url?: string;
  source?: string;
  name?: string;
}

interface DiscoveryStateEvent {
  state?: string;
  message?: string;
}

interface CampusQuestDiscoveryPlugin {
  start(): Promise<{ started?: boolean }>;
  stop(): Promise<void>;
  addListener(
    eventName: 'candidate',
    listener: (event: DiscoveryCandidateEvent) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'state',
    listener: (event: DiscoveryStateEvent) => void
  ): Promise<PluginListenerHandle>;
}

const nativePlugin =
  Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android'
    ? registerPlugin<CampusQuestDiscoveryPlugin>('CampusQuestDiscovery')
    : null;

const SEARCH_TIMEOUT_MS = 9000;
const RETRY_DELAY_MS = 4000;
const HEALTH_INTERVAL_MS = 5000;
const CANDIDATE_RETRY_MS = 4000;

type Listener = (snapshot: BackendConnectionSnapshot) => void;

export class BackendDiscoveryController {
  private snapshot: BackendConnectionSnapshot = {
    status: 'searching',
    detail: 'Searching for the Campus Quest backend...',
  };
  private listeners = new Set<Listener>();
  private running = false;
  private connectedBaseUrl: string | null = null;
  private nativeHandles: PluginListenerHandle[] = [];
  private searchTimers = new Set<ReturnType<typeof setTimeout>>();
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private generation = 0;
  private failures = 0;
  private checkingHealth = false;
  private startingNative = false;
  private verifying = new Set<string>();
  private lastAttempt = new Map<string, number>();
  private visibilityHandler: (() => void) | null = null;
  private onlineHandler: (() => void) | null = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getSnapshot(): BackendConnectionSnapshot {
    return this.snapshot;
  }

  start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.connectedBaseUrl = null;
    this.failures = 0;
    this.installNetworkListeners();
    this.update({
      status: 'searching',
      detail: 'Searching for the Campus Quest backend...',
    });
    this.startHealthMonitor();
    void this.initialize();
  }

  stop(): void {
    this.running = false;
    this.generation += 1;
    this.clearSearchTimers();
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    this.removeNetworkListeners();
    void this.stopNative();

    const handles = this.nativeHandles;
    this.nativeHandles = [];
    for (const handle of handles) {
      handle.remove().catch(() => {});
    }

    this.connectedBaseUrl = null;
    this.verifying.clear();
    this.lastAttempt.clear();
  }

  private async initialize(): Promise<void> {
    if (!this.running) {
      return;
    }

    if (!nativePlugin) {
      await this.probeWebBackend();
      return;
    }

    await this.attachNativeListeners();
    if (!this.running) {
      return;
    }

    const knownBaseUrl = normalizeApiBaseUrl(getApiBaseUrl());
    if (knownBaseUrl) {
      void this.tryCandidate(knownBaseUrl);
    }
    await this.beginNativeSearch();
  }

  private async attachNativeListeners(): Promise<void> {
    if (!nativePlugin) {
      return;
    }

    try {
      const handles = await Promise.all([
        nativePlugin.addListener('candidate', (event) => {
          if (event?.url) {
            void this.tryCandidate(event.url);
          }
        }),
        nativePlugin.addListener('state', (event) => {
          this.handleNativeState(event);
        }),
      ]);

      if (!this.running) {
        for (const handle of handles) {
          handle.remove().catch(() => {});
        }
        return;
      }
      this.nativeHandles = handles;
    } catch {
      this.update({
        status: 'disconnected',
        detail: 'Native discovery is unavailable on this device.',
      });
    }
  }

  private handleNativeState(event: DiscoveryStateEvent): void {
    if (!this.running || this.connectedBaseUrl) {
      return;
    }
    if (event.state === 'mdnsStarted') {
      this.update({
        status: 'searching',
        detail: 'Searching on this Wi-Fi...',
      });
    }
  }

  private async beginNativeSearch(): Promise<void> {
    if (!this.running || !nativePlugin || this.connectedBaseUrl || this.startingNative) {
      return;
    }

    this.startingNative = true;
    const generation = ++this.generation;
    this.clearSearchTimers();
    this.update({
      status: 'searching',
      detail: 'Searching on this Wi-Fi...',
    });

    try {
      await nativePlugin.start();
    } catch {
      this.update({
        status: 'disconnected',
        detail: 'Discovery could not start. Retrying...',
      });
      this.scheduleRetry(generation);
      return;
    } finally {
      this.startingNative = false;
    }

    if (!this.running || generation !== this.generation || this.connectedBaseUrl) {
      return;
    }
    this.scheduleSearchTimeout(generation);
  }

  private async restartNativeSearch(): Promise<void> {
    if (!this.running || !nativePlugin || this.connectedBaseUrl || this.startingNative) {
      return;
    }
    this.generation += 1;
    this.clearSearchTimers();
    await this.stopNative();
    if (!this.running || this.connectedBaseUrl) {
      return;
    }
    await this.beginNativeSearch();
  }

  private scheduleSearchTimeout(generation: number): void {
    const timer = setTimeout(() => {
      this.searchTimers.delete(timer);
      if (!this.running || generation !== this.generation || this.connectedBaseUrl) {
        return;
      }
      this.update({
        status: 'disconnected',
        detail: 'Backend not found on this Wi-Fi. Retrying...',
      });
      this.scheduleRetry(generation);
    }, SEARCH_TIMEOUT_MS);
    this.searchTimers.add(timer);
  }

  private scheduleRetry(generation: number): void {
    if (this.retryTimer) {
      return;
    }
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      if (!this.running || generation !== this.generation || this.connectedBaseUrl) {
        return;
      }
      void (async () => {
        await this.stopNative();
        await this.beginNativeSearch();
      })();
    }, RETRY_DELAY_MS);
  }

  private clearSearchTimers(): void {
    for (const timer of this.searchTimers) {
      clearTimeout(timer);
    }
    this.searchTimers.clear();
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private async stopNative(): Promise<void> {
    if (!nativePlugin) {
      return;
    }
    try {
      await nativePlugin.stop();
    } catch {}
  }

  private async tryCandidate(rawUrl: string): Promise<boolean> {
    const url = normalizeApiBaseUrl(rawUrl);
    if (!this.running || this.connectedBaseUrl || !url) {
      return false;
    }

    const now = Date.now();
    const lastAttempt = this.lastAttempt.get(url) || 0;
    if (this.verifying.has(url) || now - lastAttempt < CANDIDATE_RETRY_MS) {
      return false;
    }

    this.verifying.add(url);
    this.lastAttempt.set(url, now);

    try {
      const result = await verifyCampusQuestBackend(url);
      if (!result.ok || !result.baseUrl || !this.running || this.connectedBaseUrl) {
        return false;
      }

      this.connectedBaseUrl = result.baseUrl;
      this.failures = 0;
      this.clearSearchTimers();
      this.generation += 1;
      setApiBaseUrl(result.baseUrl);
      this.update({
        status: 'connected',
        detail: 'Connected to the Campus Quest backend.',
        baseUrl: result.baseUrl,
      });
      void this.stopNative();
      return true;
    } finally {
      this.verifying.delete(url);
    }
  }

  private async probeWebBackend(): Promise<void> {
    if (!this.running || nativePlugin) {
      return;
    }

    const candidates: string[] = [];
    const stored = normalizeApiBaseUrl(getApiBaseUrl());
    if (stored) {
      candidates.push(stored);
    }
    if (typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)) {
      const origin = normalizeApiBaseUrl(window.location.origin);
      if (origin && !candidates.includes(origin)) {
        candidates.push(origin);
      }
    }

    for (const candidate of candidates) {
      if (!this.running) {
        return;
      }
      if (await this.tryCandidate(candidate)) {
        return;
      }
    }

    if (this.running && !this.connectedBaseUrl) {
      this.update({
        status: 'disconnected',
        detail: 'Campus Quest backend is not reachable.',
      });
    }
  }

  private startHealthMonitor(): void {
    if (this.healthTimer) {
      return;
    }
    this.healthTimer = setInterval(() => {
      void this.checkHealth();
    }, HEALTH_INTERVAL_MS);
  }

  private async checkHealth(): Promise<void> {
    if (!this.running || this.checkingHealth) {
      return;
    }
    if (
      typeof document !== 'undefined' &&
      document.visibilityState === 'hidden'
    ) {
      return;
    }

    let probeUrl = this.connectedBaseUrl || normalizeApiBaseUrl(getApiBaseUrl());
    if (
      !probeUrl &&
      !nativePlugin &&
      typeof window !== 'undefined' &&
      /^https?:$/.test(window.location.protocol)
    ) {
      probeUrl = normalizeApiBaseUrl(window.location.origin);
    }
    if (!probeUrl) {
      return;
    }

    this.checkingHealth = true;
    try {
      const result = await verifyCampusQuestBackend(probeUrl, 3500);
      if (!this.running) {
        return;
      }

      if (result.ok && result.baseUrl) {
        this.failures = 0;
        if (!this.connectedBaseUrl) {
          this.connectedBaseUrl = result.baseUrl;
          setApiBaseUrl(result.baseUrl);
          this.clearSearchTimers();
          this.generation += 1;
          this.update({
            status: 'connected',
            detail: 'Connected to the Campus Quest backend.',
            baseUrl: result.baseUrl,
          });
          void this.stopNative();
        }
        return;
      }

      if (!this.connectedBaseUrl) {
        return;
      }

      this.failures += 1;
      if (this.failures < 2) {
        return;
      }

      this.connectedBaseUrl = null;
      this.lastAttempt.delete(normalizeApiBaseUrl(probeUrl));
      this.update({
        status: 'searching',
        detail: 'Connection lost. Reconnecting...',
      });

      if (nativePlugin) {
        void this.restartNativeSearch();
      } else {
        void this.probeWebBackend();
      }
    } finally {
      this.checkingHealth = false;
    }
  }

  private installNetworkListeners(): void {
    if (typeof document !== 'undefined' && !this.visibilityHandler) {
      this.visibilityHandler = () => {
        if (document.visibilityState !== 'visible') {
          return;
        }
        this.failures = 0;
        if (this.connectedBaseUrl) {
          void this.checkHealth();
        } else if (nativePlugin) {
          void this.restartNativeSearch();
        } else {
          void this.probeWebBackend();
        }
      };
      document.addEventListener('visibilitychange', this.visibilityHandler);
    }

    if (typeof window !== 'undefined' && !this.onlineHandler) {
      this.onlineHandler = () => {
        this.failures = 0;
        if (this.connectedBaseUrl) {
          void this.checkHealth();
        } else if (nativePlugin) {
          void this.restartNativeSearch();
        } else {
          void this.probeWebBackend();
        }
      };
      window.addEventListener('online', this.onlineHandler);
    }
  }

  private removeNetworkListeners(): void {
    if (
      typeof document !== 'undefined' &&
      this.visibilityHandler
    ) {
      document.removeEventListener('visibilitychange', this.visibilityHandler);
    }
    this.visibilityHandler = null;

    if (typeof window !== 'undefined' && this.onlineHandler) {
      window.removeEventListener('online', this.onlineHandler);
    }
    this.onlineHandler = null;
  }

  private update(next: BackendConnectionSnapshot): void {
    this.snapshot = next;
    for (const listener of this.listeners) {
      listener(next);
    }
  }
}
