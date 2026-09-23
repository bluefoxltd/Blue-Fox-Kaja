import React, { useState } from 'react';
import { 
  Store, 
  ShieldCheck, 
  Download, 
  Printer, 
  Phone, 
  Calendar, 
  Lock,
  CheckCircle2, 
  AlertCircle,
  Eye,
  Building2,
  RefreshCw,
  FileSpreadsheet,
  FileCode2,
  FileArchive,
  Receipt,
  PieChart,
  UtensilsCrossed,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Info
} from 'lucide-react';
import { CouponProfile, LedgerTransaction, FilterOptions, SyncStatus } from '../types';
import { calculateLedgerSummary, exportLedgerToCsv, exportLedgerToJson } from '../utils/storage';
import { NepaliDateFilterBar } from './NepaliDateFilterBar';
import { LedgerTable } from './LedgerTable';
import { formatNepaliRupees, formatBsDateString, getCurrentBsDate } from '../utils/nepaliDate';

interface ShopkeeperLedgerViewProps {
  couponProfile: CouponProfile;
  transactions: LedgerTransaction[];
  onRequestAdminLogin: () => void;
  syncStatus?: SyncStatus;
}

export const ShopkeeperLedgerView: React.FC<ShopkeeperLedgerViewProps> = ({
  couponProfile,
  transactions,
  onRequestAdminLogin,
  syncStatus = 'connected',
}) => {
  const currentBs = getCurrentBsDate();
  const todayStr = formatBsDateString(currentBs);

  const [activeTab, setActiveTab] = useState<'ledger' | 'summary' | 'items'>('ledger');
  const [filters, setFilters] = useState<FilterOptions>({
    dateRangePreset: 'ALL',
    fromBS: '',
    toBS: '',
    type: 'ALL',
    paymentStatus: 'ALL',
    searchQuery: '',
  });

  // Apply filters
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
  const overallSummary = calculateLedgerSummary(transactions);
  const purchaseCount = transactions.filter((t) => t.type === 'PURCHASE').length;
  const paidTransactionsCount = transactions.filter((t) => t.paymentStatus === 'PAID' || t.type === 'PAYMENT_OUT').length;
  const totalPurchases = overallSummary.totalSpent;

  // Calculate itemized popularity/breakdown
  const itemMap = new Map<string, { count: number; totalSales: number }>();
  transactions.forEach((tx) => {
    if (tx.type === 'PURCHASE' && Array.isArray(tx.items)) {
      tx.items.forEach((item) => {
        const key = item.name.trim();
        const existing = itemMap.get(key) || { count: 0, totalSales: 0 };
        itemMap.set(key, {
          count: existing.count + (item.qty || 1),
          totalSales: existing.totalSales + (item.totalPrice || 0),
        });
      });
    }
  });

  const itemBreakdown = Array.from(itemMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalSales - a.totalSales);

  const handleDownloadCsv = () => {
    exportLedgerToCsv(filteredTransactions, couponProfile.couponCode);
  };

  const handleDownloadJson = () => {
    exportLedgerToJson(filteredTransactions, couponProfile);
  };

  const handlePrint = () => {
    window.print();
  };

  const creditLimit = couponProfile.creditLimit || 25000;
  const availableCredit = Math.max(0, creditLimit - overallSummary.totalCreditDue);
  const creditUsagePercent = Math.min(100, Math.round((overallSummary.totalCreditDue / creditLimit) * 100));

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200" id="shopkeeper-view-container">
      
      {/* Top Banner: Verification, Live Status, Shop Details & Quick Actions */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-blue-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          <div className="flex items-start gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Store className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified QR Pass
                </span>
                
                {/* Live Synchronization Status Indicator */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-900/90 text-emerald-300 text-xs font-semibold border border-emerald-500/30">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span>1s Live Cloud Sync</span>
                </div>

                <span className="text-xs text-blue-200 font-mono">
                  {couponProfile.couponCode}
                </span>
              </div>

              {/* Shopkeeper Name & Address */}
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                {couponProfile.shopName || 'Darjeeling momo'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5 flex flex-wrap items-center gap-2">
                <span>{couponProfile.shopAddress || 'Itahari-6, Sky Plaza'}</span>
                <span>•</span>
                <span>Phone: <strong className="text-white font-mono">{couponProfile.shopPhone || '9802755605'}</strong></span>
              </p>

              {/* Customer Accountability Tag */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-blue-800/80 text-white font-bold border border-blue-700">
                  <Building2 className="w-3.5 h-3.5 text-amber-300" />
                  <span>Customer (खातावाल): <strong className="text-amber-300">{couponProfile.holderName || 'Blue Fox'}</strong></span>
                </span>
                <span className="text-xs text-blue-300 font-mono">
                  Pass: {couponProfile.couponCode}
                </span>
                <span className="text-xs text-slate-300">
                  Valid BS: {couponProfile.issueDateBS} to {couponProfile.validUntilBS}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions for Shop Owner (Read-Only) */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {/* Statement CSV */}
            <button
              onClick={handleDownloadCsv}
              className="px-3 py-2 rounded-xl text-xs font-bold bg-white text-blue-950 hover:bg-blue-50 transition-colors flex items-center gap-1.5 shadow-sm"
              id="shopkeeper-download-csv"
              title="Download full statement in CSV format"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
              <span>Statement (CSV)</span>
            </button>

            {/* Statement JSON */}
            <button
              onClick={handleDownloadJson}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700 flex items-center gap-1.5 transition-colors"
              title="Download backup in JSON format"
            >
              <FileCode2 className="w-4 h-4 text-blue-300" />
              <span>JSON Ledger</span>
            </button>

            {/* Print Bill */}
            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-900/80 hover:bg-blue-800 text-blue-200 border border-blue-700 flex items-center gap-1.5 transition-colors"
              title="Print official accounting statement"
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span>Print Bill</span>
            </button>

            {/* Final Project Code ZIP Download */}
            <a
              href="/api/download-zip"
              download="bluefox-khaja-khata-final.zip"
              className="px-3 py-2 rounded-xl text-xs font-bold bg-blue-700/80 hover:bg-blue-600 text-white border border-blue-500 flex items-center gap-1.5 transition-colors shadow-2xs"
              title="Download complete application code (.ZIP)"
              id="shopkeeper-download-zip-btn"
            >
              <FileArchive className="w-4 h-4 text-amber-300" />
              <span>Download ZIP</span>
            </a>

            {/* Secure Admin Gate - Requires PIN to access entry roles */}
            <button
              onClick={onRequestAdminLogin}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
              title="Admin access requires 4-digit PIN"
              id="shopkeeper-admin-pin-btn"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Login (PIN)</span>
            </button>
          </div>

        </div>

        {/* Complete Financial Overview Strip (Red = Credit Due, Navy Blue = Paid, Green = Total Spent) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-blue-800/80">
          
          {/* 1. Credit Due (Red) */}
          <div className="bg-white rounded-2xl p-4 text-slate-800 border-2 border-red-300 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
              <span>तिर्न बाँकी कुल उधारो (Credit Due)</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-600" id="shopkeeper-credit-due">
              {formatNepaliRupees(overallSummary.totalCreditDue)}
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
              <span>Customer: Blue Fox</span>
              <span className="font-bold text-red-600">{creditUsagePercent}% Limit Used</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div 
                className="bg-red-600 h-1.5 rounded-full transition-all duration-500" 
                style={{ width: `${creditUsagePercent}%` }}
              />
            </div>
          </div>

          {/* 2. Paid Index (Navy Blue) */}
          <div className="bg-white rounded-2xl p-4 text-slate-800 border-2 border-blue-300 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
              <span>चुक्ता भएको रकम (Total Paid)</span>
              <CheckCircle2 className="w-4 h-4 text-blue-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-950" id="shopkeeper-total-paid">
              {formatNepaliRupees(overallSummary.totalPaid)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Settled via Cash & Fonepay</span>
              <span className="font-semibold text-blue-950">{paidTransactionsCount} payments</span>
            </p>
          </div>

          {/* 3. Total Spent Amount (Green) */}
          <div className="bg-white rounded-2xl p-4 text-slate-800 border-2 border-emerald-300 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
              <span>कुल खाजा कारोबार (Gross Spent)</span>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600" id="shopkeeper-total-spent">
              {formatNepaliRupees(overallSummary.totalSpent)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
              <span>Total Food Items Billed</span>
              <span className="font-semibold text-emerald-700">{purchaseCount} food bills</span>
            </p>
          </div>

        </div>
      </div>

      {/* Read-Only Notice Bar */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 px-4 text-xs text-blue-900 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-700 shrink-0" />
          <span>
            <strong>Shopkeeper Accountability Mode:</strong> Viewing verified khata ledger for <strong>Darjeeling momo</strong>. Food entries are managed by Blue Fox admin and protected by PIN.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-blue-800 font-semibold">
          <span>All updates sync live in real-time</span>
        </div>
      </div>

      {/* Accounting Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'ledger'
              ? 'bg-blue-950 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          id="tab-shopkeeper-ledger"
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Complete Itemized Ledger ({transactions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'summary'
              ? 'bg-blue-950 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          id="tab-shopkeeper-summary"
        >
          <PieChart className="w-3.5 h-3.5" />
          <span>Financial Reconciliation Statement</span>
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'items'
              ? 'bg-blue-950 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
          id="tab-shopkeeper-items"
        >
          <UtensilsCrossed className="w-3.5 h-3.5" />
          <span>Food Items Sold Breakdown ({itemBreakdown.length})</span>
        </button>
      </div>

      {/* Tab 1: Complete Itemized Ledger */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          {/* Nepali Bikram Sambat Date Filter Bar */}
          <NepaliDateFilterBar
            filters={filters}
            onFilterChange={setFilters}
            totalCount={transactions.length}
            filteredCount={filteredTransactions.length}
          />

          {/* Ledger Table (Strict Read-Only for Shopkeeper) */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-black text-blue-950">
                  खाजा तथा कारोबार विवरण (Verified Accountability Statement)
                </h2>
                <p className="text-xs text-slate-500">
                  Showing {filteredTransactions.length} of {transactions.length} verified records • Shopkeeper Read-Only View
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDownloadCsv}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <button
                  onClick={handlePrint}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
              </div>
            </div>

            <LedgerTable
              transactions={filteredTransactions}
              onOpenDailyFoodEntry={() => {}}
              onOpenPaymentOut={() => {}}
              onOpenPurchaseReturn={() => {}}
              onOpenClearDatabase={() => {}}
              readOnly={true}
            />
          </div>
        </div>
      )}

      {/* Tab 2: Financial Reconciliation Statement */}
      {activeTab === 'summary' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-black text-blue-950">
              Darjeeling momo & Blue Fox — Official Accounting Statement
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive financial reconciliation statement calculated as of {todayStr} BS.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Debit / Credit Summary Table */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-blue-800" />
                <span>Accounting Balance Breakdown</span>
              </h3>

              <div className="space-y-2 text-sm divide-y divide-slate-200/60">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600">Gross Food Billing (कुल खाजा बिक्री):</span>
                  <span className="font-bold text-slate-900">{formatNepaliRupees(totalPurchases)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 text-orange-700">
                  <span>Less: Food Returns (फिर्ता शोधभर्ना):</span>
                  <span className="font-bold">- {formatNepaliRupees(overallSummary.totalReturns)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 font-bold text-slate-900">
                  <span>Net Snack Billing (खुद कारोबार):</span>
                  <span>{formatNepaliRupees(totalPurchases - overallSummary.totalReturns)}</span>
                </div>

                <div className="flex items-center justify-between pt-2 text-blue-900">
                  <span>Less: Total Payments Received (प्राप्त भुक्तानी):</span>
                  <span className="font-bold">- {formatNepaliRupees(overallSummary.totalPaid)}</span>
                </div>

                <div className="flex items-center justify-between pt-3 text-base font-black border-t-2 border-slate-300">
                  <span className="text-red-600">Net Receivable Due (बाँकी उधारो):</span>
                  <span className="text-red-600 text-lg font-black">{formatNepaliRupees(overallSummary.totalCreditDue)}</span>
                </div>
              </div>
            </div>

            {/* Credit Facility & Terms */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-blue-800" />
                <span>Credit Terms & Account Status</span>
              </h3>

              <div className="space-y-2 text-sm divide-y divide-slate-200/60">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-600">Customer Name:</span>
                  <span className="font-bold text-blue-950">{couponProfile.holderName || 'Blue Fox'}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Shop / Canteen:</span>
                  <span className="font-bold text-slate-900">{couponProfile.shopName || 'Darjeeling momo'}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Authorized Credit Limit:</span>
                  <span className="font-bold text-slate-900">{formatNepaliRupees(creditLimit)}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Available Headroom:</span>
                  <span className="font-bold text-emerald-700">{formatNepaliRupees(availableCredit)}</span>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-600">Account Health:</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    overallSummary.totalCreditDue > creditLimit
                      ? 'bg-red-100 text-red-700'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {overallSummary.totalCreditDue > creditLimit ? 'Limit Exceeded' : 'Active & Verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleDownloadCsv}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-950 text-white hover:bg-blue-900 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>Download Statement (CSV)</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-700" />
              <span>Print Accounting Statement</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 3: Food Items Sold Breakdown */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 sm:p-7 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-base sm:text-lg font-black text-blue-950">
                खाजा परिकार बिक्री विवरण (Snack Items Breakdown)
              </h2>
              <p className="text-xs text-slate-500">
                Aggregated sales volume and revenue by item at Darjeeling momo
              </p>
            </div>
            <span className="text-xs font-bold text-blue-900 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
              {itemBreakdown.length} unique items sold
            </span>
          </div>

          {itemBreakdown.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              No itemized food purchase entries recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Item Name (खाजा परिकार)</th>
                    <th className="py-2.5 px-3 text-center">Total Quantity (परिमाण)</th>
                    <th className="py-2.5 px-3 text-right">Total Revenue (कुल रकम)</th>
                    <th className="py-2.5 px-3 text-right">Revenue Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {itemBreakdown.map((item, idx) => {
                    const share = totalPurchases > 0 
                      ? Math.round((item.totalSales / totalPurchases) * 100) 
                      : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 flex items-center justify-center text-[10px] font-bold">
                            {idx + 1}
                          </span>
                          <span>{item.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-700">
                          {item.count}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-blue-950">
                          {formatNepaliRupees(item.totalSales)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[11px] font-mono text-slate-500">{share}%</span>
                            <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-blue-800 h-1.5 rounded-full" 
                                style={{ width: `${share}%` }} 
                              />
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
