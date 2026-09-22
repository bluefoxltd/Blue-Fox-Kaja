import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  X, 
  Check, 
  RotateCcw 
} from 'lucide-react';

interface ClearDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: (resetCouponProfile: boolean) => void;
  totalTransactionsCount: number;
}

export const ClearDatabaseModal: React.FC<ClearDatabaseModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  totalTransactionsCount,
}) => {
  const [resetCoupon, setResetCoupon] = useState<boolean>(false);
  const [clearedNotice, setClearedNotice] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleClear = () => {
    onConfirmClear(resetCoupon);
    setClearedNotice(true);
    setTimeout(() => {
      setClearedNotice(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-red-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="clear-database-modal"
      >
        {/* Header */}
        <div className="bg-red-950 text-white p-5 relative border-b border-red-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-red-300 hover:text-white p-1 rounded-lg hover:bg-red-900 transition-colors"
            id="clear-db-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-900/80 border border-red-700 flex items-center justify-center text-red-300 shadow-inner">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Clear All Database
              </h3>
              <p className="text-xs text-red-200 font-medium mt-0.5">
                सम्पूर्ण खाजा तथा उधारो खाता मेटाउने
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        {clearedNotice ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Database Cleared Successfully!
            </h4>
            <p className="text-xs text-slate-500">
              All ledger records have been wiped clean.
            </p>
          </div>
        ) : (
          <div className="p-5 sm:p-6 space-y-4">
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-800 space-y-1">
                <p className="font-bold text-red-950">
                  Are you sure you want to clear all transactions?
                </p>
                <p>
                  This will permanently delete all {totalTransactionsCount} food purchases, payments, and return records from the database and reset totals to Rs. 0.
                </p>
              </div>
            </div>

            {/* Optional checkbox: also reset coupon profile */}
            <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 hover:bg-slate-50 cursor-pointer text-xs transition-colors">
              <input
                type="checkbox"
                checked={resetCoupon}
                onChange={(e) => setResetCoupon(e.target.checked)}
                className="mt-0.5 rounded text-red-600 focus:ring-red-500"
                id="checkbox-reset-coupon-profile"
              />
              <div>
                <span className="font-semibold text-slate-800">
                  Also reset customer coupon profile to default
                </span>
                <p className="text-[11px] text-slate-500">
                  Resets the customer holder name, phone, and shop name back to default.
                </p>
              </div>
            </label>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                id="cancel-clear-db-btn"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                id="confirm-clear-db-btn"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Yes, Clear All Database</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
