/**
 * Live Real-Time Data Synchronization Engine
 * Connects via Server-Sent Events (SSE) + BroadcastChannel + Periodic Fallback Polling
 * Ensures instant real-time synchronization between Admin Dashboard and Shopkeeper Mobile QR View
 */

import { LedgerTransaction, CouponProfile, SyncStatus } from '../types';
import { loadTransactions, saveTransactions, loadCouponProfile, saveCouponProfile } from './storage';

type SyncListener = (data: { transactions: LedgerTransaction[]; couponProfile: CouponProfile; lastUpdated: number }) => void;
type StatusListener = (status: SyncStatus) => void;

class SyncManager {
  private syncListeners: Set<SyncListener> = new Set();
  private statusListeners: Set<StatusListener> = new Set();
  private eventSource: EventSource | null = null;
  private broadcastChannel: BroadcastChannel | null = null;
  private pollInterval: any = null;
  private currentStatus: SyncStatus = 'syncing';
  private reconnectTimer: any = null;

  constructor() {
    this.initBroadcastChannel();
    this.startSse();
    this.startPollingFallback();
  }

  private initBroadcastChannel(): void {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.broadcastChannel = new BroadcastChannel('bluefox_khata_live_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'LOCAL_UPDATE') {
            this.notifyListeners({
              transactions: event.data.transactions,
              couponProfile: event.data.couponProfile,
              lastUpdated: Date.now(),
            });
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported or error:', e);
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
        listener(status);
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

  private notifyListeners(data: { transactions: LedgerTransaction[]; couponProfile: CouponProfile; lastUpdated: number }): void {
    // Also save to local storage cache
    if (Array.isArray(data.transactions)) {
      saveTransactions(data.transactions);
    }
    if (data.couponProfile) {
      saveCouponProfile(data.couponProfile);
    }

    for (const listener of this.syncListeners) {
      try {
        listener(data);
      } catch (err) {
        console.error('Error in sync listener:', err);
      }
    }
  }

  private startSse(): void {
    if (typeof window === 'undefined') return;

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    try {
      this.eventSource = new EventSource('/api/ledger/stream');

      this.eventSource.onopen = () => {
        this.setStatus('connected');
      };

      this.eventSource.onmessage = (e) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload.transactions || payload.couponProfile) {
            this.notifyListeners({
              transactions: payload.transactions || [],
              couponProfile: payload.couponProfile,
              lastUpdated: payload.lastUpdated || Date.now(),
            });
            this.setStatus('connected');
          }
        } catch (err) {
          // heartbeat or unparseable
        }
      };

      this.eventSource.onerror = () => {
        this.setStatus('syncing');
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }
        // Retry SSE in 3 seconds
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = setTimeout(() => {
          this.startSse();
        }, 3000);
      };
    } catch (err) {
      console.warn('SSE connection failed, relying on polling:', err);
      this.setStatus('syncing');
    }
  }

  // Backup polling every 2.5s if SSE drops or for instant verification
  private startPollingFallback(): void {
    if (typeof window === 'undefined') return;

    // Initial fetch
    this.fetchLatest();

    if (this.pollInterval) clearInterval(this.pollInterval);
    this.pollInterval = setInterval(() => {
      this.fetchLatest();
    }, 2500);
  }

  public async fetchLatest(): Promise<void> {
    try {
      const res = await fetch('/api/ledger');
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.transactions)) {
          this.notifyListeners({
            transactions: data.transactions,
            couponProfile: data.couponProfile,
            lastUpdated: data.lastUpdated,
          });
          this.setStatus('connected');
        }
      }
    } catch (err) {
      // Offline fallback
      this.setStatus('offline');
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
        });
      } catch (e) {
        // ignore
      }
    }
  }

  // Remote Actions
  public async addTransaction(tx: LedgerTransaction): Promise<boolean> {
    try {
      const res = await fetch('/api/ledger/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to post transaction to server:', err);
      return false;
    }
  }

  public async syncAll(transactions: LedgerTransaction[], couponProfile: CouponProfile): Promise<boolean> {
    try {
      const res = await fetch('/api/ledger/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, couponProfile }),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to sync with server:', err);
      return false;
    }
  }

  public async clearAll(resetCoupon: boolean = false): Promise<boolean> {
    try {
      const res = await fetch('/api/ledger/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetCoupon }),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to clear on server:', err);
      return false;
    }
  }

  public async updateCouponProfile(profile: CouponProfile): Promise<boolean> {
    try {
      const res = await fetch('/api/coupon', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      return res.ok;
    } catch (err) {
      console.error('Failed to update coupon on server:', err);
      return false;
    }
  }

  public async verifyPin(pin: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });
      if (res.ok) {
        const data = await res.json();
        return Boolean(data.valid);
      }
    } catch (err) {
      console.error('Verify pin error:', err);
    }
    // Fallback to client check
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
      const data = await res.json();
      if (res.ok && data.success) {
        localStorage.setItem('bluefox_admin_pin_code_v1', newPin.trim());
        return { success: true };
      }
      return { success: false, message: data.error || 'Failed to update PIN' };
    } catch (err) {
      return { success: false, message: 'Server connection error' };
    }
  }
}

export const syncManager = new SyncManager();
