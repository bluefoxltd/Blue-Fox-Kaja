/**
 * Blue Fox - Khaja Khata (खाजा खाता)
 * Hotel/Shopkeeper: Darjeeling momo (Itahari-6, Sky Plaza, Ph: 9802755605)
 * Customer: Blue Fox
 * Live Real-Time Synchronized Accountability Ledger with PIN Gate & Fixed QR Pass
 */

import React, { useState, useEffect } from 'react';
import { 
  loadTransactions, 
  saveTransactions, 
  loadCouponProfile, 
  saveCouponProfile, 
  calculateLedgerSummary, 
  exportLedgerToCsv,
  exportLedgerToJson,
  clearAllTransactions,
  DEFAULT_COUPON
} from './utils/storage';
import { 
  LedgerTransaction, 
  CouponProfile, 
  FilterOptions, 
  TransactionType,
  SyncStatus
} from './types';
import { syncManager, mergeTransactionLists } from './utils/syncManager';
import { decodeTransactionsFromQr } from './utils/qrPayload';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { NepaliDateFilterBar } from './components/NepaliDateFilterBar';
import { LedgerTable } from './components/LedgerTable';
import { MultiFoodEntryModal } from './components/MultiFoodEntryModal';
import { CouponCardModal } from './components/CouponCardModal';
import { EditCouponModal } from './components/EditCouponModal';
import { ClearDatabaseModal } from './components/ClearDatabaseModal';
import { ShopkeeperLedgerView } from './components/ShopkeeperLedgerView';
import { AdminPinLogin } from './components/AdminPinLogin';
import { AdminPinModal } from './components/AdminPinModal';
import { DashboardAnalytics } from './components/DashboardAnalytics';
import { KhataVoiceAssistant } from './components/KhataVoiceAssistant';
import { 
  ShieldCheck, 
  QrCode, 
  PlusCircle, 
  Download, 
  RefreshCw, 
  Sparkles,
  UserCheck,
  Trash2,
  Lock,
  Eye,
  KeyRound,
  Store,
  FileArchive,
  BarChart3,
  Receipt
} from 'lucide-react';

export default function App() {
  // State
  const [transactions, setTransactions] = useState<LedgerTransaction[]>(loadTransactions());
  const [couponProfile, setCouponProfile] = useState<CouponProfile>(loadCouponProfile());
  const [activeView, setActiveView] = useState<'dashboard' | 'shopkeeper'>('dashboard');
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('connected');

  // Admin PIN Authentication State
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('bluefox_admin_auth') === 'true';
    }
    return false;
  });

  // Admin view tab: Ledger vs Live Analytics
  const [adminTab, setAdminTab] = useState<'ledger' | 'analytics'>('ledger');

  // Modals
  const [entryModalOpen, setEntryModalOpen] = useState<boolean>(false);
  const [entryModalInitialType, setEntryModalInitialType] = useState<TransactionType>('PURCHASE');
  const [couponModalOpen, setCouponModalOpen] = useState<boolean>(false);
  const [editCouponModalOpen, setEditCouponModalOpen] = useState<boolean>(false);
  const [clearDbModalOpen, setClearDbModalOpen] = useState<boolean>(false);
  const [pinModalOpen, setPinModalOpen] = useState<boolean>(false);
  const [pinModalMode, setPinModalMode] = useState<'verify' | 'change'>('verify');

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    dateRangePreset: 'ALL',
    fromBS: '',
    toBS: '',
    type: 'ALL',
    paymentStatus: 'ALL',
    searchQuery: '',
  });

  // Detect URL parameter for shopkeeper QR scan & embedded ledger data
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'shopkeeper') {
        setActiveView('shopkeeper');
      }

      // If shopkeeper scanned QR code containing embedded ledger data (?d=...)
      const embeddedData = params.get('d');
      if (embeddedData) {
        const decodedTxs = decodeTransactionsFromQr(embeddedData);
        if (decodedTxs.length > 0) {
          setTransactions((prev) => {
            const merged = mergeTransactionLists(prev, decodedTxs);
            saveTransactions(merged);
            return merged;
          });
        }
      }
    }
  }, []);

  // Fetch latest authoritative ledger data on mount to guarantee exact accuracy across all tabs and browsers
  useEffect(() => {
    syncManager.fetchLatest().then((latestData) => {
      if (latestData && Array.isArray(latestData.transactions) && latestData.transactions.length > 0) {
        setTransactions((prev) => {
          const merged = mergeTransactionLists(prev, latestData.transactions);
          saveTransactions(merged);
          return merged;
        });
      }
    });
  }, []);

  // Subscribe to live real-time sync (SSE + BroadcastChannel)
  useEffect(() => {
    const unsubSync = syncManager.subscribe((data) => {
      if (Array.isArray(data.transactions)) {
        setTransactions(data.transactions);
      }
      if (data.couponProfile) {
        setCouponProfile(data.couponProfile);
      }
    });

    const unsubStatus = syncManager.subscribeStatus((st) => {
      setSyncStatus(st);
    });

    return () => {
      unsubSync();
      unsubStatus();
    };
  }, []);

  // Save new transaction & broadcast live
  const handleSaveTransaction = async (newTx: LedgerTransaction) => {
    const updated = [newTx, ...transactions.filter((t) => t.id !== newTx.id)];
    setTransactions(updated);
    saveTransactions(updated);
    syncManager.broadcastLocalChange(updated, couponProfile);
    await syncManager.addTransaction(newTx);
  };

  // Update customer coupon profile & broadcast live
  const handleUpdateCouponProfile = async (updatedProfile: CouponProfile) => {
    setCouponProfile(updatedProfile);
    saveCouponProfile(updatedProfile);
    syncManager.broadcastLocalChange(transactions, updatedProfile);
    await syncManager.updateCouponProfile(updatedProfile);
  };

  // Clear all database records & broadcast live
  const handleConfirmClearDatabase = async (resetCoupon: boolean) => {
    clearAllTransactions();
    setTransactions([]);
    let newProfile = couponProfile;
    if (resetCoupon) {
      newProfile = DEFAULT_COUPON;
      setCouponProfile(DEFAULT_COUPON);
      saveCouponProfile(DEFAULT_COUPON);
    }
    syncManager.broadcastLocalChange([], newProfile);
    await syncManager.clearAll(resetCoupon);
  };

  // Lock Admin Session
  const handleLockAdmin = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('bluefox_admin_auth');
    }
    setIsAdminAuthenticated(false);
  };

  // Admin PIN Login Success
  const handlePinSuccess = () => {
    setIsAdminAuthenticated(true);
    setActiveView('dashboard');
  };

  // Quick action openers (Only for authenticated admin)
  const handleOpenNewPurchase = () => {
    setEntryModalInitialType('PURCHASE');
    setEntryModalOpen(true);
  };

  const handleOpenPurchaseReturn = () => {
    setEntryModalInitialType('PURCHASE_RETURN');
    setEntryModalOpen(true);
  };

  const handleOpenPaymentOut = () => {
    setEntryModalInitialType('PAYMENT_OUT');
    setEntryModalOpen(true);
  };

  // Live import CSV handler: saves to localStorage, updates state, and immediately broadcasts to cloud & backend
  const handleImportTransactions = (imported: LedgerTransaction[]) => {
    setTransactions((prev) => {
      const merged = mergeTransactionLists(prev, imported);
      saveTransactions(merged);
      syncManager.syncAll(merged, couponProfile);
      return merged;
    });
  };

  // Filter calculations
  const filteredTransactions = transactions.filter((tx) => {
    if (filters.fromBS && tx.dateBS < filters.fromBS) return false;
    if (filters.toBS && tx.dateBS > filters.toBS) return false;
    if (filters.type !== 'ALL' && tx.type !== filters.type) return false;
    if (filters.paymentStatus !== 'ALL' && tx.paymentStatus !== filters.paymentStatus) return false;

    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchShop = tx.shopName?.toLowerCase().includes(q);
      const matchTx = tx.transactionNumber?.toLowerCase().includes(q);
      const matchItems = tx.items?.some((i) => i.name.toLowerCase().includes(q));
      const matchNote = tx.referenceNote?.toLowerCase().includes(q);
      if (!matchShop && !matchTx && !matchItems && !matchNote) return false;
    }

    return true;
  });

  const summary = calculateLedgerSummary(filteredTransactions);

  // If on root dashboard view and NOT authenticated as admin, show secure PIN screen
  if (activeView === 'dashboard' && !isAdminAuthenticated) {
    return (
      <AdminPinLogin
        onSuccess={handlePinSuccess}
        onOpenShopkeeperView={() => setActiveView('shopkeeper')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      
      {/* Primary Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={(view) => {
          if (view === 'dashboard' && !isAdminAuthenticated) {
            setPinModalMode('verify');
            setPinModalOpen(true);
          } else {
            setActiveView(view as any);
          }
        }}
        couponProfile={couponProfile}
        transactions={transactions}
        onOpenNewEntry={handleOpenNewPurchase}
        onOpenCouponModal={() => setCouponModalOpen(true)}
        onOpenEditCouponModal={() => setEditCouponModalOpen(true)}
        onOpenClearDbModal={() => setClearDbModalOpen(true)}
        onLockAdmin={handleLockAdmin}
        onChangePin={() => {
          setPinModalMode('change');
          setPinModalOpen(true);
        }}
        syncStatus={syncStatus}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* If Shopkeeper Public Ledger View is active (Read-Only) */}
        {activeView === 'shopkeeper' ? (
          <ShopkeeperLedgerView
            couponProfile={couponProfile}
            transactions={transactions}
            onRequestAdminLogin={() => {
              setPinModalMode('verify');
              setPinModalOpen(true);
            }}
            syncStatus={syncStatus}
          />
        ) : (
          /* Admin Daily Dashboard View */
          <>
            {/* Top Overview Banner & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-900" />
                  <h1 className="text-lg sm:text-xl font-black text-blue-950 tracking-tight">
                    Blue Fox - Khaja Khata (दैनिक खाजा तथा उधारो खाता)
                  </h1>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-blue-700" />
                    Admin Session Active
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                  <span>Customer: <strong className="text-blue-950 font-bold">{couponProfile.holderName || 'Blue Fox'}</strong></span>
                  <span>•</span>
                  <span>Shopkeeper: <strong className="text-blue-950 font-bold">{couponProfile.shopName || 'Darjeeling momo'}</strong> ({couponProfile.shopAddress || 'Itahari-6, Sky Plaza'})</span>
                </p>
              </div>

              {/* Action Buttons: Khaja Entry, Return, Payment Out, Edit Customer, Coupon QR, Clear DB, Lock */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleOpenNewPurchase}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-950 hover:bg-blue-900 active:bg-blue-800 text-white flex items-center gap-1.5 shadow-sm transition-all"
                  id="action-new-khaja-btn"
                >
                  <PlusCircle className="w-4 h-4 text-amber-300" />
                  <span>+ Daily Snack (खाजा दर्ता)</span>
                </button>

                <button
                  onClick={handleOpenPaymentOut}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1.5 transition-all"
                  id="action-payment-out-btn"
                >
                  <span>Pay to Shop (भुक्तानी)</span>
                </button>

                <button
                  onClick={handleOpenPurchaseReturn}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1.5 transition-all"
                  id="action-purchase-return-btn"
                >
                  <span>Food Return (फिर्ता)</span>
                </button>

                <button
                  onClick={() => setEditCouponModalOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 flex items-center gap-1.5 transition-all"
                  title="Edit Customer Name & to whom coupon is provided"
                  id="action-edit-customer-btn"
                >
                  <UserCheck className="w-4 h-4 text-blue-800" />
                  <span>Edit Customer</span>
                </button>

                <button
                  onClick={() => setCouponModalOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-1.5 transition-all"
                  title="Show Fixed Coupon Pass Card & QR"
                  id="action-coupon-qr-btn"
                >
                  <QrCode className="w-4 h-4 text-blue-900" />
                  <span>Coupon Pass</span>
                </button>

                <button
                  onClick={() => setClearDbModalOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5 transition-all"
                  title="Clear all database records"
                  id="action-clear-db-btn"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-600" />
                  <span>Clear DB</span>
                </button>

                {/* Direct ZIP Download */}
                <a
                  href="/api/download-zip"
                  download="bluefox-khaja-khata-final.zip"
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-900/80 hover:bg-blue-800 text-white flex items-center gap-1.5 transition-all shadow-xs"
                  title="Download complete project source code (.ZIP)"
                  id="action-download-zip-btn"
                >
                  <FileArchive className="w-3.5 h-3.5 text-amber-300" />
                  <span>Download ZIP</span>
                </a>

                {/* Lock Session */}
                <button
                  onClick={handleLockAdmin}
                  className="px-2.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center gap-1 transition-all"
                  title="Lock Admin Dashboard"
                  id="action-lock-admin-btn"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Lock</span>
                </button>
              </div>
            </div>

            {/* Metric Summary Cards (Paid Navy Blue, Credit Red, Total Spent Green) */}
            <SummaryCards
              summary={summary}
              couponProfile={couponProfile}
              onOpenCouponModal={() => setCouponModalOpen(true)}
              onOpenEditCouponModal={() => setEditCouponModalOpen(true)}
              onPaymentOutClick={handleOpenPaymentOut}
              onPurchaseReturnClick={handleOpenPurchaseReturn}
            />

            {/* View Switcher: Ledger Table vs Live Analytics */}
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAdminTab('ledger')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    adminTab === 'ledger'
                      ? 'bg-blue-950 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  id="tab-admin-ledger"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>खाजा लेजर तालिका (Daily Snack Ledger)</span>
                </button>

                <button
                  onClick={() => setAdminTab('analytics')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    adminTab === 'analytics'
                      ? 'bg-blue-950 text-white shadow-sm'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                  id="tab-admin-analytics"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-amber-400" />
                  <span>लाइभ एनालिटिक्स (Live Analytics & Trends)</span>
                </button>
              </div>

              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline-block">
                Real-Time Auto-Updating
              </span>
            </div>

            {adminTab === 'analytics' ? (
              <DashboardAnalytics
                transactions={transactions}
                couponProfile={couponProfile}
                summary={summary}
              />
            ) : (
              <>
                {/* Nepali Bikram Sambat Date Filter Bar */}
                <NepaliDateFilterBar
                  filters={filters}
                  onFilterChange={setFilters}
                  totalCount={transactions.length}
                  filteredCount={filteredTransactions.length}
                />

                {/* Main Daily Snack Ledger Table (Admin View with entry actions) */}
                <LedgerTable
                  transactions={filteredTransactions}
                  couponCode={couponProfile.couponCode}
                  couponProfile={couponProfile}
                  onOpenNewEntry={handleOpenNewPurchase}
                  onClearDatabase={() => setClearDbModalOpen(true)}
                  onImportTransactions={handleImportTransactions}
                  readOnly={false}
                />
              </>
            )}
          </>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="flex items-center gap-1">
            <span>Customer: <strong>{couponProfile.holderName || 'Blue Fox'}</strong></span>
            <span>•</span>
            <span>Hotel/Shop: <strong>{couponProfile.shopName || 'Darjeeling momo'}</strong> ({couponProfile.shopAddress || 'Itahari-6, Sky Plaza'}, {couponProfile.shopPhone || '9802755605'})</span>
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView(activeView === 'dashboard' ? 'shopkeeper' : 'dashboard')}
              className="text-blue-900 font-bold hover:underline flex items-center gap-1 text-xs"
            >
              {activeView === 'dashboard' ? (
                <>
                  <Eye className="w-3.5 h-3.5" />
                  <span>Switch to Shopkeeper View</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin PIN Login</span>
                </>
              )}
            </button>
            <span className="text-slate-300">|</span>
            <span className="font-medium text-slate-400">Fixed QR Pass • Live Synchronized Ledger</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {/* 1. Multi-Food Snack Entry Modal (Purchase / Return / Payment Out) */}
      <MultiFoodEntryModal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        onSave={handleSaveTransaction}
        shopName={couponProfile.shopName}
        initialType={entryModalInitialType}
        couponProfile={couponProfile}
        currentCreditDue={summary.totalCreditDue}
      />

      {/* 2. Full Coupon Pass & High-Res QR Card Modal */}
      <CouponCardModal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        couponProfile={couponProfile}
        transactions={transactions}
        onOpenShopkeeperView={() => setActiveView('shopkeeper')}
        onOpenEditModal={() => setEditCouponModalOpen(true)}
      />

      {/* 3. Edit Customer & Coupon Pass Modal */}
      <EditCouponModal
        isOpen={editCouponModalOpen}
        onClose={() => setEditCouponModalOpen(false)}
        couponProfile={couponProfile}
        onSave={handleUpdateCouponProfile}
      />

      {/* 4. Clear Database Confirmation Modal */}
      <ClearDatabaseModal
        isOpen={clearDbModalOpen}
        onClose={() => setClearDbModalOpen(false)}
        onConfirm={handleConfirmClearDatabase}
        totalRecords={transactions.length}
      />

      {/* 5. Admin PIN Verification / Change Modal */}
      <AdminPinModal
        isOpen={pinModalOpen}
        onClose={() => setPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        mode={pinModalMode}
      />

      {/* Floating Khata Voice Assistant & Reminder (Live on Admin & Shopkeeper panels) */}
      <KhataVoiceAssistant
        couponProfile={couponProfile}
        transactions={transactions}
        userRole={activeView === 'dashboard' ? 'admin' : 'shopkeeper'}
      />

    </div>
  );
}
