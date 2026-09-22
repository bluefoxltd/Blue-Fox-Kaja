import React from 'react';
import { 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Undo2, 
  Wallet, 
  QrCode,
  Pencil
} from 'lucide-react';
import { LedgerSummary, CouponProfile } from '../types';
import { formatNepaliRupees } from '../utils/nepaliDate';

interface SummaryCardsProps {
  summary: LedgerSummary;
  couponProfile: CouponProfile;
  onOpenCouponModal: () => void;
  onOpenEditCouponModal: () => void;
  onPaymentOutClick: () => void;
  onPurchaseReturnClick: () => void;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  summary,
  couponProfile,
  onOpenCouponModal,
  onOpenEditCouponModal,
  onPaymentOutClick,
  onPurchaseReturnClick,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4" id="summary-cards-container">
      
      {/* 1. CREDIT INDEX (RED) - Required: Credit index red */}
      <div 
        className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-red-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
        id="card-credit-index"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-red-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
            Credit Index (उधारो)
          </span>
          <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center">
            <AlertCircle className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-1">
          <div className="text-2xl sm:text-3xl font-black text-red-600 tracking-tight" id="credit-amount-val">
            {formatNepaliRupees(summary.totalCreditDue)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-between">
            <span>तिर्न बाँकी उधारो (Due Balance)</span>
            <span className="text-red-500 font-semibold text-[11px]">Unpaid Food</span>
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-red-100 flex items-center justify-between text-xs">
          <button
            onClick={onPaymentOutClick}
            className="text-red-700 hover:text-red-800 font-semibold flex items-center gap-1 hover:underline"
            id="quick-pay-shop-btn"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Pay to Shop (भुक्तानी)</span>
          </button>
          <span className="text-[11px] text-slate-400">Coupon Credit</span>
        </div>
      </div>

      {/* 2. PAID INDEX (NAVY BLUE) - Required: Paid index navy blue */}
      <div 
        className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-blue-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
        id="card-paid-index"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-900/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-900" />
            Paid Index (चुक्ता)
          </span>
          <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-900 flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-1">
          <div className="text-2xl sm:text-3xl font-black text-blue-950 tracking-tight" id="paid-amount-val">
            {formatNepaliRupees(summary.totalPaid)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-between">
            <span>पसललाई तिरेको कुल रकम</span>
            <span className="text-blue-800 font-semibold text-[11px]">Direct + Out</span>
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-blue-100 flex items-center justify-between text-xs text-blue-900 font-medium">
          <span>Settled Payments</span>
          <span className="bg-blue-100 px-2 py-0.5 rounded text-[11px] font-semibold text-blue-900">
            Navy Blue Index
          </span>
        </div>
      </div>

      {/* 3. TOTAL SPENT AMOUNT (GREEN) - Required: Total spent amount green */}
      <div 
        className="bg-white rounded-2xl p-4 sm:p-5 border-2 border-emerald-200 shadow-sm relative overflow-hidden transition-all hover:shadow-md"
        id="card-total-spent"
      >
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none" />
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" />
            Total Spent (कुल खर्च)
          </span>
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Receipt className="w-4 h-4" />
          </div>
        </div>

        <div className="mt-1">
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight" id="spent-amount-val">
            {formatNepaliRupees(summary.totalSpent)}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium flex items-center justify-between">
            <span>जम्मा खाजा/खाना खर्च</span>
            <span className="text-emerald-600 font-semibold text-[11px]">Gross Orders</span>
          </p>
        </div>

        <div className="mt-3 pt-3 border-t border-emerald-100 flex items-center justify-between text-xs">
          <button
            onClick={onPurchaseReturnClick}
            className="text-emerald-800 hover:text-emerald-900 font-semibold flex items-center gap-1 hover:underline text-[11px]"
            id="return-food-quick-btn"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Food Return: {formatNepaliRupees(summary.totalReturns)}</span>
          </button>
        </div>
      </div>

      {/* 4. FIXED COUPON CARD SUMMARY */}
      <div 
        className="bg-gradient-to-br from-blue-950 to-blue-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm relative overflow-hidden border border-blue-800 cursor-pointer group"
        onClick={onOpenCouponModal}
        id="card-fixed-coupon-info"
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5" />
            Fixed Coupon Pass
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditCouponModal();
              }}
              className="px-2 py-0.5 rounded bg-blue-800/90 hover:bg-blue-700 text-amber-300 text-[11px] font-semibold border border-blue-700/80 flex items-center gap-1 transition-colors"
              title="Edit Customer Name & to whom coupon is provided"
              id="summary-edit-customer-btn"
            >
              <Pencil className="w-3 h-3" />
              <span>Edit</span>
            </button>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-800/90 text-blue-200 font-mono">
              VERIFIED
            </span>
          </div>
        </div>

        <div className="mt-1">
          <div className="font-mono text-xl sm:text-2xl font-black tracking-wider text-white group-hover:text-amber-200 transition-colors">
            {couponProfile.couponCode}
          </div>
          <div className="flex items-center justify-between text-xs text-blue-200 mt-0.5 font-medium">
            <span className="truncate max-w-[210px]" id="summary-holder-name">
              {couponProfile.holderName} • {couponProfile.shopName}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2.5 border-t border-blue-800/80 flex items-center justify-between text-xs text-blue-200">
          <span className="text-[11px] group-hover:underline flex items-center gap-1">
            Tap for QR Pass
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenEditCouponModal();
              }}
              className="text-[11px] text-amber-300 hover:text-white font-semibold flex items-center gap-0.5 underline"
              title="Edit Customer"
            >
              <Pencil className="w-2.5 h-2.5" />
              <span>Edit Customer</span>
            </button>
            <span className="font-semibold text-amber-300">Scan Ready →</span>
          </div>
        </div>
      </div>

    </div>
  );
};
