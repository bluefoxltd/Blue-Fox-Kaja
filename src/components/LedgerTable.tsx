import React, { useState } from 'react';
import { 
  Lock, 
  ChevronDown, 
  ChevronUp, 
  Utensils, 
  Undo2, 
  Wallet, 
  Download, 
  Calendar, 
  FileText,
  AlertCircle,
  Trash2,
  PlusCircle
} from 'lucide-react';
import { LedgerTransaction } from '../types';
import { formatNepaliRupees, formatBsDisplay } from '../utils/nepaliDate';
import { exportLedgerToCsv } from '../utils/storage';

interface LedgerTableProps {
  transactions: LedgerTransaction[];
  couponCode?: string;
  isShopkeeperView?: boolean;
  readOnly?: boolean;
  onOpenNewEntry?: () => void;
  onClearDatabase?: () => void;
  onOpenDailyFoodEntry?: () => void;
  onOpenPaymentOut?: () => void;
  onOpenPurchaseReturn?: () => void;
  onOpenClearDatabase?: () => void;
}

export const LedgerTable: React.FC<LedgerTableProps> = ({
  transactions,
  couponCode = 'BF-FOX-7821',
  isShopkeeperView = false,
  readOnly = false,
  onOpenNewEntry,
  onClearDatabase,
  onOpenDailyFoodEntry,
  onOpenClearDatabase,
}) => {
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const isRestricted = isShopkeeperView || readOnly;
  const triggerNewEntry = onOpenNewEntry || onOpenDailyFoodEntry;
  const triggerClearDb = onClearDatabase || onOpenClearDatabase;

  const toggleRow = (id: string) => {
    setExpandedRowId((prev) => (prev === id ? null : id));
  };

  const handleDownloadCsv = () => {
    exportLedgerToCsv(transactions, couponCode);
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs" id="empty-ledger-view">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-900 flex items-center justify-center mx-auto mb-3 border border-blue-100">
          <FileText className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Database is Empty (खाता खाली छ)</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
          No food or payment records are currently in the database. All records have been cleared.
        </p>
        {triggerNewEntry && !isRestricted && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={triggerNewEntry}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-950 hover:bg-blue-900 text-white flex items-center gap-1.5 shadow-sm transition-all"
              id="empty-state-new-entry-btn"
            >
              <PlusCircle className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Add First Daily Snack (खाजा दर्ता)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" id="ledger-table-wrapper">
      
      {/* Table Section Header */}
      <div className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 bg-slate-50/70">
        <div>
          <h3 className="font-extrabold text-sm sm:text-base text-blue-950 flex items-center gap-2">
            <span>{isRestricted ? 'Darjeeling momo - Accountability Ledger' : 'Daily Food Credit & Payment Ledger (खाता विवरण)'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold font-mono">
              {transactions.length} Records
            </span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable transaction records • Fixed Coupon ID: {couponCode}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {triggerClearDb && !isRestricted && (
            <button
              onClick={triggerClearDb}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 flex items-center gap-1.5 transition-colors"
              title="Clear all records from database"
              id="clear-db-table-btn"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Database</span>
            </button>
          )}

          <button
            onClick={handleDownloadCsv}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-100 text-blue-950 border border-slate-300 flex items-center gap-1.5 shadow-2xs transition-colors"
            id="download-ledger-csv-btn"
          >
            <Download className="w-3.5 h-3.5 text-blue-800" />
            <span>Export Statement (CSV)</span>
          </button>
        </div>
      </div>

      {/* Desktop / Tablet Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse" id="ledger-main-table">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-3 sm:px-4">Tx & Date (BS / AD)</th>
              <th className="py-3 px-3 sm:px-4">Type</th>
              <th className="py-3 px-3 sm:px-4">Food Items & Remarks</th>
              <th className="py-3 px-3 sm:px-4 text-center">Status Index</th>
              <th className="py-3 px-3 sm:px-4 text-right">Amount (NPR)</th>
              <th className="py-3 px-2 sm:px-3 text-center">Audit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {transactions.map((tx) => {
              const isExpanded = expandedRowId === tx.id;
              const hasMultipleItems = tx.items && tx.items.length > 0;

              // Color Index Styling:
              // Paid index: Navy blue (#172554 / #1e3a8a)
              // Credit index: Red (#dc2626)
              const isCredit = tx.paymentStatus === 'CREDIT';
              const isReturn = tx.type === 'PURCHASE_RETURN';
              const isPaymentOut = tx.type === 'PAYMENT_OUT';

              return (
                <React.Fragment key={tx.id}>
                  <tr 
                    className={`hover:bg-blue-50/40 transition-colors ${
                      isExpanded ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {/* Date & Tx */}
                    <td className="py-3 px-3 sm:px-4 align-top">
                      <div className="font-bold text-blue-950 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                        <span>{tx.dateBSFormatted || tx.dateBS}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                        AD: {tx.dateAD} • {tx.transactionNumber}
                      </div>
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-3 sm:px-4 align-top">
                      {tx.type === 'PURCHASE' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-semibold">
                          <Utensils className="w-3 h-3 text-slate-600" />
                          <span>Food Purchase</span>
                        </span>
                      )}
                      {tx.type === 'PURCHASE_RETURN' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-semibold">
                          <Undo2 className="w-3 h-3 text-orange-700" />
                          <span>Food Return</span>
                        </span>
                      )}
                      {tx.type === 'PAYMENT_OUT' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-semibold">
                          <Wallet className="w-3 h-3 text-emerald-700" />
                          <span>Payment Out</span>
                        </span>
                      )}
                    </td>

                    {/* Food Items Preview & Remarks */}
                    <td className="py-3 px-3 sm:px-4 align-top">
                      {hasMultipleItems ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800">
                              {tx.items[0]?.name}
                              {tx.items.length > 1 && ` + ${tx.items.length - 1} more items`}
                            </span>
                            <button
                              type="button"
                              onClick={() => toggleRow(tx.id)}
                              className="text-[11px] text-blue-700 hover:text-blue-900 font-semibold inline-flex items-center gap-0.5 underline cursor-pointer"
                            >
                              <span>{isExpanded ? 'Hide' : `View (${tx.items.length})`}</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate max-w-xs mt-0.5">
                            {tx.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <span className="font-semibold text-emerald-900">
                            Credit Settlement to {tx.shopName}
                          </span>
                          <p className="text-[11px] text-slate-400">
                            Method: {tx.paymentMethod || 'Fonepay / Cash'}
                          </p>
                        </div>
                      )}

                      {tx.referenceNote && (
                        <p className="text-[10px] text-slate-500 italic mt-0.5">
                          Note: "{tx.referenceNote}"
                        </p>
                      )}
                    </td>

                    {/* Status Index Badge */}
                    {/* Prompt rule: paid index navy blue, credit index red */}
                    <td className="py-3 px-3 sm:px-4 align-top text-center">
                      {isCredit ? (
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-red-600 text-white font-bold text-[11px] shadow-2xs"
                          title="Credit Index (Red): Unpaid food credit owed to shopkeeper"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          <span>CREDIT / उधारो</span>
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-950 text-white font-bold text-[11px] shadow-2xs"
                          title="Paid Index (Navy Blue): Fully settled payment"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                          <span>PAID / चुक्ता</span>
                        </span>
                      )}
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-3 sm:px-4 align-top text-right">
                      <div className={`font-black text-sm ${
                        isReturn 
                          ? 'text-orange-600' 
                          : isPaymentOut 
                            ? 'text-emerald-700' 
                            : isCredit 
                              ? 'text-red-600' 
                              : 'text-blue-950'
                      }`}>
                        {isReturn ? `- ${formatNepaliRupees(tx.netAmount)}` : formatNepaliRupees(tx.netAmount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {isReturn ? 'Credit offset' : isPaymentOut ? 'Paid to shop' : 'Expense'}
                      </div>
                    </td>

                    {/* Audit / Immutability Lock */}
                    <td className="py-3 px-2 sm:px-3 align-top text-center">
                      <span 
                        className="inline-block p-1 text-slate-400 hover:text-slate-600 rounded" 
                        title="Immutable Record: Verified Khaja entry cannot be altered or tampered with"
                      >
                        <Lock className="w-3.5 h-3.5 mx-auto text-slate-400" />
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Breakdown Accordion for Multiple Food Items */}
                  {isExpanded && hasMultipleItems && (
                    <tr className="bg-blue-50/50 border-b border-blue-100">
                      <td colSpan={6} className="p-3 sm:px-6">
                        <div className="bg-white rounded-xl p-3 border border-blue-200 shadow-2xs space-y-2">
                          <div className="flex items-center justify-between text-xs font-bold text-blue-950 border-b border-slate-100 pb-1.5">
                            <span>Itemized Food Breakdown ({tx.items.length} dishes in this order):</span>
                            <span className="text-[11px] text-slate-500 font-mono">Tx ID: {tx.transactionNumber}</span>
                          </div>

                          <div className="divide-y divide-slate-100">
                            {tx.items.map((item, idx) => (
                              <div key={idx} className="py-1.5 flex items-center justify-between text-xs">
                                <div>
                                  <span className="font-semibold text-slate-800">{item.name}</span>
                                  {item.notes && <span className="text-slate-400 text-[11px] ml-2">({item.notes})</span>}
                                </div>
                                <div className="text-right flex items-center gap-4">
                                  <span className="text-slate-500 font-mono">
                                    Qty: {item.qty} × Rs. {item.unitPrice}
                                  </span>
                                  <span className="font-bold text-slate-900 w-20 text-right">
                                    Rs. {item.totalPrice}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs font-bold">
                            <span className="text-slate-600">Order Subtotal:</span>
                            <span className="text-blue-950 font-black text-sm">
                              {formatNepaliRupees(tx.netAmount)}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Footer Audit Notice */}
      <div className="p-3 sm:px-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center gap-1.5 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 text-blue-800 shrink-0" />
          <span>Entries are permanently locked. Adjustments must be made via Purchase Return or Payment Out.</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Blue Fox Audit System • Nepali BS & AD Synchronized
        </div>
      </div>

    </div>
  );
};
