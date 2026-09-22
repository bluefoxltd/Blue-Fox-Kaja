/**
 * Blue Fox - Khaja Khata (खाजा खाता)
 * Daily Food Credit Ledger with Fixed Coupon QR & Nepali BS Date Filtering
 */

import React, { useState, useEffect } from 'react';
import { 
  loadTransactions, 
  saveTransactions, 
  loadCouponProfile, 
  saveCouponProfile, 
  calculateLedgerSummary, 
  exportLedgerToCsv,
  exportLedgerToJson 
} from './utils/storage';
import { 
  LedgerTransaction, 
  CouponProfile, 
  FilterOptions, 
  TransactionType 
} from './types';
import { Navbar } from './components/Navbar';
import { SummaryCards } from './components/SummaryCards';
import { NepaliDateFilterBar } from './components/NepaliDateFilterBar';
import { LedgerTable } from './components/LedgerTable';
import { MultiFoodEntryModal } from './components/MultiFoodEntryModal';
import { CouponCardModal } from './components/CouponCardModal';
import { EditCouponModal } from './components/EditCouponModal';
import { ClearDatabaseModal } from './components/ClearDatabaseModal';
import { ShopkeeperLedgerView } from './components/ShopkeeperLedgerView';
import { 
  ShieldCheck, 
  QrCode, 
  PlusCircle, 
  Download, 
  RefreshCw, 
  Sparkles,
  UserCheck,
  Trash2
} from 'lucide-react';
import { clearAllTransactions, DEFAULT_COUPON } from './utils/storage';

export default function App() {
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [couponProfile, setCouponProfile] = useState<CouponProfile>(loadCouponProfile());
  const [activeView, setActiveView] = useState<'dashboard' | 'shopkeeper' | 'coupon'>('dashboard');

  // Modal states
  const [entryModalOpen, setEntryModalOpen] = useState<boolean>(false);
  const [entryModalInitialType, setEntryModalInitialType] = useState<TransactionType>('PURCHASE');
  const [couponModalOpen, setCouponModalOpen] = useState<boolean>(false);
  const [editCouponModalOpen, setEditCouponModalOpen] = useState<boolean>(false);
  const [clearDbModalOpen, setClearDbModalOpen] = useState<boolean>(false);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    dateRangePreset: 'ALL',
    fromBS: '',
    toBS: '',
    type: 'ALL',
    paymentStatus: 'ALL',
    searchQuery: '',
  });

  // Initial load & URL params check for QR scanner
  useEffect(() => {
    const loadedTx = loadTransactions();
    setTransactions(loadedTx);
    const loadedProfile = loadCouponProfile();
    setCouponProfile(loadedProfile);

    // If QR code scanned with ?view=shopkeeper
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'shopkeeper') {
        setActiveView('shopkeeper');
      }
    }
  }, []);

  // Save changes to transactions
  const handleSaveTransaction = (newTx: LedgerTransaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    saveTransactions(updated);
  };

  // Update customer coupon profile
  const handleUpdateCouponProfile = (updatedProfile: CouponProfile) => {
    setCouponProfile(updatedProfile);
    saveCouponProfile(updatedProfile);
  };

  // Clear all database records
  const handleConfirmClearDatabase = (resetCoupon: boolean) => {
    clearAllTransactions();
    setTransactions([]);
    if (resetCoupon) {
      setCouponProfile(DEFAULT_COUPON);
      saveCouponProfile(DEFAULT_COUPON);
    }
  };

  // Quick action openers
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

  // Filter calculations
  const filteredTransactions = transactions.filter((tx) => {
    // Nepali Date Range
    if (filters.fromBS && tx.dateBS < filters.fromBS) return false;
    if (filters.toBS && tx.dateBS > filters.toBS) return false;

    // Transaction Type
    if (filters.type !== 'ALL' && tx.type !== filters.type) return false;

    // Payment Status
    if (filters.paymentStatus !== 'ALL' && tx.paymentStatus !== filters.paymentStatus) return false;

    // Search query
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-900 selection:text-white">
      
      {/* Primary Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        couponProfile={couponProfile}
        transactions={transactions}
        onOpenNewEntry={handleOpenNewPurchase}
        onOpenCouponModal={() => setCouponModalOpen(true)}
        onOpenEditCouponModal={() => setEditCouponModalOpen(true)}
        onOpenClearDbModal={() => setClearDbModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* If Shopkeeper Public Ledger View is active */}
        {activeView === 'shopkeeper' ? (
          <ShopkeeperLedgerView
            couponProfile={couponProfile}
            transactions={transactions}
            onBackToAdmin={() => setActiveView('dashboard')}
          />
        ) : (
          /* Admin Daily Dashboard View */
          <>
            {/* Top Overview Banner & Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
              <div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-900" />
                  <h1 className="text-lg sm:text-xl font-black text-blue-950 tracking-tight">
                    Blue Fox - Khaja Khata (दैनिक खाजा तथा उधारो खाता)
                  </h1>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                  <span>Coupon provided to: <strong className="text-blue-950 font-bold">{couponProfile.holderName}</strong></span>
                  <span>•</span>
                  <span>Shopkeeper verification with fixed QR pass</span>
                </p>
              </div>

              {/* Action Buttons: Khaja Entry, Return, Payment Out, Edit Customer, Coupon QR, Clear DB */}
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
                  title="Show Fixed Coupon QR"
                  id="action-coupon-qr-btn"
                >
                  <QrCode className="w-4 h-4 text-blue-900" />
                  <span>Coupon QR</span>
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

            {/* Bikram Sambat (BS) Nepali Date Filter Bar */}
            <NepaliDateFilterBar
              filters={filters}
              onFilterChange={setFilters}
              totalFilteredCount={filteredTransactions.length}
            />

            {/* Primary Ledger Records Table */}
            <LedgerTable
              transactions={filteredTransactions}
              couponCode={couponProfile.couponCode}
              onOpenNewEntry={handleOpenNewPurchase}
              onClearDatabase={() => setClearDbModalOpen(true)}
            />
          </>
        )}

      </main>

      {/* Footer with Nepali audit notice */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-blue-950">Blue Fox - Khaja Khata</span>
            <span>•</span>
            <span>दैनिक खाजा कुपन प्रणाली</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
            <span>Fixed Coupon: {couponProfile.couponCode}</span>
            <span>•</span>
            <span>Customer: {couponProfile.holderName}</span>
            <span>•</span>
            <span>Bikram Sambat & Gregorian Engine</span>
          </div>
        </div>
      </footer>

      {/* Multi-Food Entry Modal */}
      <MultiFoodEntryModal
        isOpen={entryModalOpen}
        onClose={() => setEntryModalOpen(false)}
        couponProfile={couponProfile}
        initialType={entryModalInitialType}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* Fixed Coupon Pass & QR Modal */}
      <CouponCardModal
        isOpen={couponModalOpen}
        onClose={() => setCouponModalOpen(false)}
        couponProfile={couponProfile}
        onOpenShopkeeperView={() => setActiveView('shopkeeper')}
        onOpenEditModal={() => setEditCouponModalOpen(true)}
      />

      {/* Edit Customer & Coupon Details Modal */}
      <EditCouponModal
        isOpen={editCouponModalOpen}
        onClose={() => setEditCouponModalOpen(false)}
        couponProfile={couponProfile}
        onSave={handleUpdateCouponProfile}
      />

      {/* Clear Database Confirmation Modal */}
      <ClearDatabaseModal
        isOpen={clearDbModalOpen}
        onClose={() => setClearDbModalOpen(false)}
        onConfirmClear={handleConfirmClearDatabase}
        totalTransactionsCount={transactions.length}
      />

    </div>
  );
}
