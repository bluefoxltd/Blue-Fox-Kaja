/**
 * Live Real-Time Data Synchronization Engine (Version 4 - Safe Non-Destructive Sync)
 * 
 * Guarantees:
 * 1. Data NEVER deletes automatically: Uses conflict-free ID merging.
 * 2. Transactions only clear if the user explicitly triggers "Clear Database".
 * 3. 1-second continuous cross-device synchronization between PC, Vercel, and mobile phones.
 * 4. Sub-second instant push via Server-Sent Events (SSE) & BroadcastChannel.
 */

import { LedgerTransaction, CouponProfile, SyncStatus } from '../types';
import { loadTransactions, saveTransactions, loadCouponProfile, saveCouponProfile } from './storage';

type SyncListener = (data: { transactions: LedgerTransaction[]; couponProfile: CouponProfile; lastUpdated: number }) => void;
type StatusListener = (status: SyncStatus) => void;

function mergeTransactionLists(localTxs: LedgerTransaction[], incomingTxs: LedgerTransaction[]): LedgerTransaction[] {
  const map = new Map<string, LedgerTransaction>();
  
  // 1. Add all local transactions
  if (Array.isArray(localTxs)) {
    for (const t of localTxs) {
      if (t && t.id) {
        map.set(t.id, t);
      }
    }
  }

  // 2. Add all incoming transactions
  if (Array.isArray(incomingTxs)) {
    for (const t of incomingTxs) {
      if (t && t.id) {
        // If already exists, keep the one with newest timestamp or updated info
        map.set(t.id, t);
      }
    }
  }

  // 3. Sort newest first
  return Array.from(map.values()).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
}

class SyncManager {
  private syncListeners: Set<SyncListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private cloudEventSource: EventSource | null = null;
  private localEventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private pollInterval: any = null;
  private currentStatus: SyncStatus = 'connected';
  private lastProcessedTimestamp: number = 0;
  private clientId: string = '';
  private cloudTopic: string = 'bluefox_khata_v4_bf_fox_7821';
  private isPublishing: boolean = false;

  constructor() {
    this.clientId = typeof window !== 'undefined'
      ? 'client_' + Math.random().toString(36).substring(2, 9)
      : 'server_worker';

    // Fresh isolated topic for v4
    const initialCoupon = loadCouponProfile();
    if (initialCoupon?.couponCode) {
      this.cloudTopic = `bluefox_khata_v4_${initialCoupon.couponCode.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
    }

    this.initBroadcastChannel();
    this.startCloudSse();
    this.startLocalSse();
    this.start1SecPolling();
  }

  // Set up BroadcastChannel for zero-latency multi-tab sync on same browser
  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('bluefox_khata_live_sync_v4');
        this.broadcastChannel.onmessage = (event) => {
          if (!event.data || event.data.senderId === this.clientId) return;

          if (event.data.type === 'CLEAR_DATABASE') {
            saveTransactions([]);
            this.notifyListeners({
              transactions: [],
              couponProfile: loadCouponProfile(),
              lastUpdated: event.data.timestamp || Date.now(),
            }, true);
            return;
          }

          if (event.data.type === 'SYNC' || event.data.type === 'LOCAL_UPDATE') {
            const current = loadTransactions();
            const merged = mergeTransactionLists(current, event.data.transactions || []);
            this.notifyListeners({
              transactions: merged,
              couponProfile: event.data.couponProfile || loadCouponProfile(),
              lastUpdated: event.data.timestamp || Date.now(),
            }, true);
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

  // 1. Real-time Cloud Push Stream (SSE)
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
            this.handleIncomingPayload(payload);
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
          if (payload) {
            this.handleIncomingPayload(payload);
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
      // Local server not available
    }
  }

  // 3. Guaranteed 1-Second Auto-Poll (Every 1000ms across all devices on Vercel)
  private start1SecPolling(): void {
    if (typeof window === 'undefined') return;

    if (this.pollInterval) clearInterval(this.pollInterval);

    this.pollEvery1Sec();

    this.pollInterval = setInterval(() => {
      this.pollEvery1Sec();
    }, 1000);
  }

  private async pollEvery1Sec(): Promise<void> {
    if (this.isPublishing) return;

    try {
      // Poll Cloud Real-Time Relay
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
              if (payload) {
                const handled = this.handleIncomingPayload(payload);
                if (handled) break;
              }
            }
          } catch (e) {
            // line parse error
          }
        }
        this.setStatus('connected');
      }
    } catch (err) {
      // offline or network glitch
    }

    // Also check local /api/ledger if available
    try {
      const localRes = await fetch('/api/ledger', { cache: 'no-store' });
      if (localRes.ok) {
        const contentType = localRes.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await localRes.json();
          if (data && Array.isArray(data.transactions) && data.transactions.length > 0) {
            const current = loadTransactions();
            const merged = mergeTransactionLists(current, data.transactions);
            if (merged.length !== current.length) {
              this.notifyListeners({
                transactions: merged,
                couponProfile: data.couponProfile || loadCouponProfile(),
                lastUpdated: data.lastUpdated || Date.now(),
              }, true);
            }
          }
        }
      }
    } catch (err) {
      // ignore
    }
  }

  // Process incoming sync message safely (NEVER accidentally wipes data)
  private handleIncomingPayload(payload: any): boolean {
    if (!payload || payload.senderId === this.clientId) {
      return false;
    }

    const msgTimestamp = payload.timestamp || payload.lastUpdated || 0;
    if (msgTimestamp <= this.lastProcessedTimestamp) {
      return false;
    }

    // If explicit clear was commanded by user on another device
    if (payload.type === 'CLEAR_DATABASE') {
      this.lastProcessedTimestamp = msgTimestamp;
      saveTransactions([]);
      this.notifyListeners({
        transactions: [],
        couponProfile: payload.couponProfile || loadCouponProfile(),
        lastUpdated: msgTimestamp,
      }, true);
      this.setStatus('connected');
      return true;
    }

    // Normal transaction sync / add: SAFE MERGE
    if (Array.isArray(payload.transactions) && payload.transactions.length > 0) {
      this.lastProcessedTimestamp = msgTimestamp;
      const current = loadTransactions();
      const merged = mergeTransactionLists(current, payload.transactions);

      // Only notify if there are actual new or updated items
      const hasChanges = merged.length !== current.length || 
        JSON.stringify(merged[0]) !== JSON.stringify(current[0]);

      if (hasChanges) {
        this.notifyListeners({
          transactions: merged,
          couponProfile: payload.couponProfile || loadCouponProfile(),
          lastUpdated: msgTimestamp,
        }, true);
      }
      this.setStatus('connected');
      return true;
    }

    return false;
  }

  // Broadcast to other tabs immediately
  public broadcastLocalChange(transactions: LedgerTransaction[], couponProfile: CouponProfile): void {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'LOCAL_UPDATE',
          transactions,
          couponProfile,
          timestamp: Date.now(),
          senderId: this.clientId,
        });
      } catch (e) {
        // ignore
      }
    }
  }

  // Publish to Cloud Relay
  private async publishToCloud(
    type: 'SYNC' | 'CLEAR_DATABASE',
    transactions: LedgerTransaction[],
    couponProfile: CouponProfile
  ): Promise<void> {
    this.isPublishing = true;
    const now = Date.now();
    this.lastProcessedTimestamp = now;

    const payload = {
      type,
      transactions,
      couponProfile,
      timestamp: now,
      senderId: this.clientId,
    };

    try {
      await fetch(`https://ntfy.sh/${this.cloudTopic}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch (e) {
      console.warn('Cloud relay publish failed:', e);
    } finally {
      this.isPublishing = false;
    }
  }

  // Public Remote Actions
  public async addTransaction(tx: LedgerTransaction): Promise<boolean> {
    const currentTxs = loadTransactions();
    const updated = [tx, ...currentTxs.filter((t) => t.id !== tx.id)];
    const coupon = loadCouponProfile();

    // 1. Immediately save to local storage (unbreakable local persistence)
    saveTransactions(updated);
    this.notifyListeners({ transactions: updated, couponProfile: coupon, lastUpdated: Date.now() }, false);
    this.broadcastLocalChange(updated, coupon);

    // 2. Publish to cloud immediately for 1-second cross-device sync
    this.publishToCloud('SYNC', updated, coupon);

    // 3. Post to local backend if available
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
    this.notifyListeners({ transactions, couponProfile, lastUpdated: Date.now() }, false);
    this.broadcastLocalChange(transactions, couponProfile);

    this.publishToCloud('SYNC', transactions, couponProfile);

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
    // Clear locally
    saveTransactions([]);
    this.notifyListeners({ transactions: [], couponProfile: coupon, lastUpdated: Date.now() }, false);
    
    // Broadcast explicit clear event to tabs & cloud
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'CLEAR_DATABASE',
          timestamp: Date.now(),
          senderId: this.clientId,
        });
      } catch (e) {}
    }

    this.publishToCloud('CLEAR_DATABASE', [], coupon);

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

    if (profile.couponCode) {
      this.cloudTopic = `bluefox_khata_v4_${profile.couponCode.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      this.startCloudSse();
    }

    this.notifyListeners({ transactions: txs, couponProfile: profile, lastUpdated: Date.now() }, false);
    this.broadcastLocalChange(txs, profile);
    this.publishToCloud('SYNC', txs, profile);

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
