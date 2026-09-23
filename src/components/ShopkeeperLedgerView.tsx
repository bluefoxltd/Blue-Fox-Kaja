import React, { useState } from 'react';
import { 
  Store, 
  ShieldCheck, 
  Download, 
  Printer, 
  Phone, 
  Calendar, 
  ArrowLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { CouponProfile, LedgerTransaction, FilterOptions } from '../types';
import { calculateLedgerSummary, exportLedgerToCsv } from '../utils/storage';
import { NepaliDateFilterBar } from './NepaliDateFilterBar';
import { LedgerTable } from './LedgerTable';
import { formatNepaliRupees, formatBsDateString, getCurrentBsDate } from '../utils/nepaliDate';

interface ShopkeeperLedgerViewProps {
  couponProfile: CouponProfile;
  transactions: LedgerTransaction[];
  onBackToAdmin: () => void;
}

export const ShopkeeperLedgerView: React.FC<ShopkeeperLedgerViewProps> = ({
  couponProfile,
  transactions,
  onBackToAdmin,
}) => {
  const currentBs = getCurrentBsDate();
  const todayStr = formatBsDateString(currentBs);

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
    // Nepali Date Range
    if (filters.fromBS && tx.dateBS < filters.fromBS) return false;
    if (filters.toBS && tx.dateBS > filters.toBS) return false;

    // Type filter
    if (filters.type !== 'ALL' && tx.type !== filters.type) return false;

    // Payment Status filter
    if (filters.paymentStatus !== 'ALL' && tx.paymentStatus !== filters.paymentStatus) return false;

    // Search query
    if (filters.searchQuery) {
      const q = filters.searchQuery.toLowerCase();
      const matchShop = tx.shopName.toLowerCase().includes(q);
      const matchTx = tx.transactionNumber.toLowerCase().includes(q);
      const matchItems = tx.items?.some((i) => i.name.toLowerCase().includes(q));
      const matchNote = tx.referenceNote?.toLowerCase().includes(q);
      if (!matchShop && !matchTx && !matchItems && !matchNote) return false;
    }

    return true;
  });

  const summary = calculateLedgerSummary(filteredTransactions);
  const overallSummary = calculateLedgerSummary(transactions);

  const handleDownloadCsv = () => {
    exportLedgerToCsv(filteredTransactions, couponProfile.couponCode);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-200" id="shopkeeper-view-container">
      
      {/* Top Banner: Verification & Identification */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-lg border border-blue-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center shrink-0 shadow-inner">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Canteen Pass
                </span>
                <span className="text-xs text-blue-200 font-mono">
                  {couponProfile.couponCode}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white mt-1">
                {couponProfile.shopName || 'Darjeeling momo'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-200 mt-0.5">
                <span>{couponProfile.shopAddress || 'Itahari-6, Sky Plaza'}</span>
                {couponProfile.shopPhone && (
                  <span> • Phone: <strong className="text-white font-mono">{couponProfile.shopPhone}</strong></span>
                )}
              </p>
              <p className="text-xs sm:text-sm text-blue-300 mt-0.5">
                Customer: <strong className="text-white">{couponProfile.holderName}</strong> • Phone: <span className="font-mono">{couponProfile.holderPhone}</span>
              </p>
            </div>
          </div>

          {/* Quick Actions for Shop Owner */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleDownloadCsv}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-blue-950 hover:bg-blue-50 transition-colors flex items-center gap-1.5 shadow-sm"
              id="shopkeeper-download-csv"
            >
              <Download className="w-4 h-4 text-blue-800" />
              <span>Download Statement (CSV)</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3 py-2 rounded-xl text-xs font-semibold bg-blue-800/80 hover:bg-blue-800 text-blue-100 border border-blue-700 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 text-blue-300" />
              <span>Print Bill</span>
            </button>

            <button
              onClick={onBackToAdmin}
              className="px-3 py-2 rounded-xl text-xs font-medium text-blue-300 hover:text-white hover:bg-blue-800/50 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Return to Admin</span>
            </button>
          </div>

        </div>

        {/* Live Balance Strip for Shopkeeper */}
        {/* Required color spec: Paid index navy blue, credit index red, total spent amount green */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-blue-800/80">
          
          {/* Credit Due (Red) */}
          <div className="bg-white rounded-2xl p-4 text-slate-800 border-2 border-red-300 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-red-600 mb-1">
              <span>तिर्न बाँकी कुल उधारो (Credit Due)</span>
              <AlertCircle className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-red-600">
              {formatNepaliRupees(overallSummary.totalCreditDue)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Net balance customer owes to your canteen
            </p>
          </div>

          {/* Paid Index (Navy Blue) */}
          <div className="bg-white rounded-2xl p-4 text-slate-800 border-2 border-blue-300 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
              <span>चुक्ता भएको रकम (Total Paid)</span>
              <CheckCircle2 className="w-4 h-4 text-blue-900" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-950">
              {formatNepaliRupees(overallSummary.totalPaid)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Settled via Cash, Fonepay & direct payments
            </p>
          </div>

          {/* Total Spent Amount (Green) */}
          <div className="bg-white rounded-2xl p-4 text-slate-800 border-2 border-emerald-300 shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700 mb-1">
              <span>कुल खाजा कारोबार (Gross Spent)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {formatNepaliRupees(overallSummary.totalSpent)}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Total food & drink purchases recorded
            </p>
          </div>

        </div>
      </div>

      {/* Nepali Date Filter Bar */}
      <NepaliDateFilterBar
        filters={filters}
        onFilterChange={setFilters}
        totalFilteredCount={filteredTransactions.length}
      />

      {/* Ledger Table in Shopkeeper Mode */}
      <LedgerTable
        transactions={filteredTransactions}
        couponCode={couponProfile.couponCode}
        isShopkeeperView={true}
      />

    </div>
  );
};
