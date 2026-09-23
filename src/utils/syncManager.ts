/**
 * Live Real-Time Data Synchronization Engine
 * Universal Cross-Device Synchronization for Vercel, Mobile Phone QR Scans, and Admin PC
 * 
 * Features:
 * 1. 1-Second Continuous Cloud Auto-Poll (guarantees updates every 1000ms across all devices)
 * 2. Real-Time Cloud Server-Sent Events (SSE) for instant sub-second push notifications
 * 3. High-Durability Cloud Backup Persistence (restful-api.dev persistent store)
 * 4. Local Full-Stack Node Server Fallback (/api/ledger)
 * 5. Instant Tab-to-Tab BroadcastChannel & LocalStorage caching
 */

import { LedgerTransaction, CouponProfile, SyncStatus } from '../types';
import { loadTransactions, saveTransactions, loadCouponProfile, saveCouponProfile } from './storage';

type SyncListener = (data: { transactions: LedgerTransaction[]; couponProfile: CouponProfile; lastUpdated: number }) => void;
type StatusListener = (status: SyncStatus) => void;

const CLOUD_BACKUP_URL = 'https://api.restful-api.dev/objects/ff808181a09d98f701a0cd95e99c7917';

class SyncManager {
  private syncListeners: Set<SyncListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private cloudEventSource: EventSource | null = null;
  private localEventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private pollInterval: any = null;
  private currentStatus: SyncStatus = 'syncing';
  private lastKnownTimestamp: number = 0;
  private clientId: string = '';
  private cloudTopic: string = 'bluefox_khata_bf_fox_7821';
  private isPublishing: boolean = false;

  constructor() {
    this.clientId = typeof window !== 'undefined'
      ? 'client_' + Math.random().toString(36).substring(2, 9)
      : 'server_worker';

    // Derive cloud topic from loaded coupon code
    const initialCoupon = loadCouponProfile();
    if (initialCoupon?.couponCode) {
      this.cloudTopic = `bluefox_khata_${initialCoupon.couponCode.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    }

    this.initBroadcastChannel();
    this.startCloudSse();
    this.startLocalSse();
    this.start1SecPolling();
    this.initialCloudBootstrap();
  }

  // Set up BroadcastChannel for zero-latency multi-tab sync on same device
  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('bluefox_khata_live_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'LOCAL_UPDATE' && event.data.senderId !== this.clientId) {
            if (event.data.lastUpdated && event.data.lastUpdated > this.lastKnownTimestamp) {
              this.lastKnownTimestamp = event.data.lastUpdated;
              this.notifyListeners({
                transactions: event.data.transactions,
                couponProfile: event.data.couponProfile,
                lastUpdated: event.data.lastUpdated,
              }, false);
            }
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not available:', e);
      }
    }
  }

  public getStatus(): SyncStatus {
    return this.currentStatus;
  }

  private setStatus(status: SyncStatus): void {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      for (const listener of this.statusListeners) {
        try {
          listener(status);
        } catch (e) {
          console.error('Error in status listener:', e);
        }
      }
    }
  }

  public subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public subscribe(listener: SyncListener): () => void {
    this.syncListeners.add(listener);
    return () => {
      this.syncListeners.delete(listener);
    };
  }

  private notifyListeners(
    data: { transactions: LedgerTransaction[]; couponProfile: CouponProfile; lastUpdated: number },
    persistLocal: boolean = true
  ): void {
    if (persistLocal) {
      if (Array.isArray(data.transactions)) {
        saveTransactions(data.transactions);
      }
      if (data.couponProfile) {
        saveCouponProfile(data.couponProfile);
      }
    }

    for (const listener of this.syncListeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    }
  }

  // 1. Real-time Cloud Push Stream (EventSource)
  private startCloudSse(): void {
    if (typeof window === 'undefined') return;

    if (this.cloudEventSource) {
      this.cloudEventSource.close();
      this.cloudEventSource = null;
    }

    try {
      const sseUrl = `https://ntfy.sh/${this.cloudTopic}/sse`;
      this.cloudEventSource = new EventSource(sseUrl);

      this.cloudEventSource.onopen = () => {
        this.setStatus('connected');
      };

      this.cloudEventSource.onmessage = (e) => {
        try {
          const raw = JSON.parse(e.data);
          if (raw.event === 'message' && raw.message) {
            const payload = JSON.parse(raw.message);
            if (payload && payload.senderId !== this.clientId) {
              if (payload.lastUpdated && payload.lastUpdated > this.lastKnownTimestamp) {
                this.lastKnownTimestamp = payload.lastUpdated;
                this.notifyListeners({
                  transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
                  couponProfile: payload.couponProfile,
                  lastUpdated: payload.lastUpdated,
                });
                this.setStatus('connected');
              }
            }
          }
        } catch (err) {
          // ignore heartbeat or parse errors
        }
      };

      this.cloudEventSource.onerror = () => {
        if (this.cloudEventSource) {
          this.cloudEventSource.close();
          this.cloudEventSource = null;
        }
        setTimeout(() => this.startCloudSse(), 3000);
      };
    } catch (err) {
      console.warn('Cloud SSE init failed:', err);
    }
  }

  // 2. Local Node/Express Stream (if running full-stack)
  private startLocalSse(): void {
    if (typeof window === 'undefined') return;

    if (this.localEventSource) {
      this.localEventSource.close();
      this.localEventSource = null;
    }

    try {
      this.localEventSource = new EventSource('/api/ledger/stream');
      this.localEventSource.onopen = () => {
        this.setStatus('connected');
      };

      this.localEventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.transactions || payload.couponProfile) {
            if (payload.lastUpdated && payload.lastUpdated > this.lastKnownTimestamp) {
              this.lastKnownTimestamp = payload.lastUpdated;
              this.notifyListeners({
                transactions: payload.transactions || [],
                couponProfile: payload.couponProfile,
                lastUpdated: payload.lastUpdated,
              });
              this.setStatus('connected');
            }
          }
        } catch (err) {
          // ignore
        }
      };

      this.localEventSource.onerror = () => {
        if (this.localEventSource) {
          this.localEventSource.close();
          this.localEventSource = null;
        }
      };
    } catch (e) {
      // Local server not available (e.g. static Vercel)
    }
  }

  // 3. Guaranteed 1-Second Auto-Poll (Every 1000ms across any device on Vercel)
  private start1SecPolling(): void {
    if (typeof window === 'undefined') return;

    if (this.pollInterval) clearInterval(this.pollInterval);

    // Initial immediate poll
    this.pollEvery1Sec();

    // 1-second interval as requested
    this.pollInterval = setInterval(() => {
      this.pollEvery1Sec();
    }, 1000);
  }

  private async pollEvery1Sec(): Promise<void> {
    if (this.isPublishing) return;

    try {
      // 1. Poll Cloud Real-Time Relay
      const cloudRes = await fetch(`https://ntfy.sh/${this.cloudTopic}/json?poll=1`, {
        cache: 'no-store',
      });

      if (cloudRes.ok) {
        const text = await cloudRes.text();
        const lines = text.split('\n').filter(Boolean);
        for (let i = lines.length - 1; i >= 0; i--) {
          try {
            const item = JSON.parse(lines[i]);
            if (item.event === 'message' && item.message) {
              const payload = JSON.parse(item.message);
              if (payload && payload.senderId !== this.clientId) {
                if (payload.lastUpdated && payload.lastUpdated > this.lastKnownTimestamp) {
                  this.lastKnownTimestamp = payload.lastUpdated;
                  this.notifyListeners({
                    transactions: Array.isArray(payload.transactions) ? payload.transactions : [],
                    couponProfile: payload.couponProfile,
                    lastUpdated: payload.lastUpdated,
                  });
                  this.setStatus('connected');
                  return;
                }
              }
            }
          } catch (e) {
            // line parse error
          }
        }
        this.setStatus('connected');
      }
    } catch (err) {
      // If cloud relay fails, try local backend
    }

    // 2. Poll Local /api/ledger if available
    try {
      const localRes = await fetch('/api/ledger', { cache: 'no-store' });
      if (localRes.ok) {
        const contentType = localRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await localRes.json();
          if (data && Array.isArray(data.transactions)) {
            if (data.lastUpdated && data.lastUpdated > this.lastKnownTimestamp) {
              this.lastKnownTimestamp = data.lastUpdated;
              this.notifyListeners({
                transactions: data.transactions,
                couponProfile: data.couponProfile,
                lastUpdated: data.lastUpdated,
              });
              this.setStatus('connected');
            }
          }
        }
      }
    } catch (err) {
      // static site
    }
  }

  // Initial cloud bootstrap to fetch persisted backup
  private async initialCloudBootstrap(): Promise<void> {
    try {
      const res = await fetch(CLOUD_BACKUP_URL, { cache: 'no-store' });
      if (res.ok) {
        const doc = await res.json();
        const data = doc.data;
        if (data && Array.isArray(data.transactions)) {
          if (data.lastUpdated && data.lastUpdated > this.lastKnownTimestamp) {
            this.lastKnownTimestamp = data.lastUpdated;
            this.notifyListeners({
              transactions: data.transactions,
              couponProfile: data.couponProfile,
              lastUpdated: data.lastUpdated,
            });
            this.setStatus('connected');
          }
        }
      }
    } catch (e) {
      console.warn('Initial cloud backup fetch skipped:', e);
    }
  }

  // Broadcast to other tabs immediately
  public broadcastLocalChange(transactions: LedgerTransaction[], couponProfile: CouponProfile): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'LOCAL_UPDATE',
          transactions,
          couponProfile,
          lastUpdated: this.lastKnownTimestamp,
          senderId: this.clientId,
        });
      } catch (e) {
        // ignore
      }
    }
  }

  // Publish to Cloud Relay and Cloud Persistent Store
  private async publishToCloud(transactions: LedgerTransaction[], couponProfile: CouponProfile): Promise<void> {
    this.isPublishing = true;
    const now = Date.now();
    this.lastKnownTimestamp = now;

    const payload = {
      type: 'SYNC',
      transactions,
      couponProfile,
      lastUpdated: now,
      senderId: this.clientId,
    };

    try {
      // 1. Publish to real-time pub/sub relay (ntfy.sh)
      await fetch(`https://ntfy.sh/${this.cloudTopic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Cloud relay publish failed:', e);
    }

    try {
      // 2. Update persistent cloud backup (restful-api.dev)
      await fetch(CLOUD_BACKUP_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'bluefox_khata_live_backup',
          data: {
            transactions,
            couponProfile,
            lastUpdated: now,
          },
        }),
      });
    } catch (e) {
      console.warn('Cloud backup update failed:', e);
    } finally {
      this.isPublishing = false;
    }
  }

  // Remote Actions
  public async addTransaction(tx: LedgerTransaction): Promise<boolean> {
    const currentTxs = loadTransactions();
    const updated = [tx, ...currentTxs.filter((t) => t.id !== tx.id)];
    const coupon = loadCouponProfile();

    saveTransactions(updated);
    this.notifyListeners({ transactions: updated, couponProfile: coupon, lastUpdated: Date.now() });
    this.broadcastLocalChange(updated, coupon);

    // Publish to cloud immediately for cross-device sync
    this.publishToCloud(updated, coupon);

    // Also post to local backend if available
    try {
      await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
    } catch (e) {
      // ignore
    }

    return true;
  }

  public async syncAll(transactions: LedgerTransaction[], couponProfile: CouponProfile): Promise<boolean> {
    saveTransactions(transactions);
    saveCouponProfile(couponProfile);
    this.notifyListeners({ transactions, couponProfile, lastUpdated: Date.now() });
    this.broadcastLocalChange(transactions, couponProfile);

    // Publish to cloud immediately for cross-device sync
    this.publishToCloud(transactions, couponProfile);

    try {
      await fetch('/api/ledger/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, couponProfile }),
      });
    } catch (e) {
      // ignore
    }

    return true;
  }

  public async clearAll(resetCoupon: boolean = false): Promise<boolean> {
    const coupon = loadCouponProfile();
    saveTransactions([]);
    this.notifyListeners({ transactions: [], couponProfile: coupon, lastUpdated: Date.now() });
    this.broadcastLocalChange([], coupon);

    // Publish cleared state to cloud immediately
    this.publishToCloud([], coupon);

    try {
      await fetch('/api/ledger/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetCoupon }),
      });
    } catch (e) {
      // ignore
    }

    return true;
  }

  public async updateCouponProfile(profile: CouponProfile): Promise<boolean> {
    const txs = loadTransactions();
    saveCouponProfile(profile);

    // Update cloud topic if coupon code changed
    if (profile.couponCode) {
      this.cloudTopic = `bluefox_khata_${profile.couponCode.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      this.startCloudSse();
    }

    this.notifyListeners({ transactions: txs, couponProfile: profile, lastUpdated: Date.now() });
    this.broadcastLocalChange(txs, profile);

    this.publishToCloud(txs, profile);

    try {
      await fetch('/api/coupon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
    } catch (e) {
      // ignore
    }

    return true;
  }

  public async verifyPin(pin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          return Boolean(data.valid);
        }
      }
    } catch (err) {
      // fallback
    }
    const localPin = localStorage.getItem('bluefox_admin_pin_code_v1') || '1234';
    return pin.trim() === localPin.trim();
  }

  public async changePin(oldPin: string, newPin: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/auth/change-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPin, newPin }),
      });
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            localStorage.setItem('bluefox_admin_pin_code_v1', newPin.trim());
            return { success: true };
          }
          return { success: false, message: data.error || 'Failed to update PIN' };
        }
      }
    } catch (err) {
      // fallback
    }

    const currentPin = localStorage.getItem('bluefox_admin_pin_code_v1') || '1234';
    if (oldPin.trim() === currentPin.trim()) {
      localStorage.setItem('bluefox_admin_pin_code_v1', newPin.trim());
      return { success: true };
    }
    return { success: false, message: 'Current PIN does not match' };
  }

  public async fetchLatest(): Promise<void> {
    await this.pollEvery1Sec();
  }
}

export const syncManager = new SyncManager();
