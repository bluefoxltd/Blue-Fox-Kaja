import React from 'react';
import { 
  X, 
  Printer, 
  Store, 
  ShieldCheck, 
  Download, 
  FileText, 
  Receipt, 
  Calendar,
  Building2,
  Phone
} from 'lucide-react';
import { CouponProfile, LedgerTransaction } from '../types';
import { calculateLedgerSummary, exportLedgerToCsv } from '../utils/storage';
import { formatNepaliRupees, getCurrentBsDate, formatBsDateString, bsToAdString } from '../utils/nepaliDate';

interface PrintStatementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: LedgerTransaction[];
  couponProfile: CouponProfile;
}

export const PrintStatementModal: React.FC<PrintStatementModalProps> = ({
  isOpen,
  onClose,
  transactions,
  couponProfile,
}) => {
  if (!isOpen) return null;

  const currentBs = getCurrentBsDate();
  const todayBsStr = formatBsDateString(currentBs);
  const todayAdStr = bsToAdString(currentBs);

  const summary = calculateLedgerSummary(transactions);

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    exportLedgerToCsv(transactions, couponProfile.couponCode);
  };

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150"
      id="print-statement-modal-overlay"
    >
      <div 
        className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]"
        id="print-statement-modal-dialog"
      >
        {/* Top Control Bar (Hidden during print) */}
        <div className="no-print bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold tracking-tight">Print Detailed Accountability Statement</h3>
              <p className="text-[11px] text-slate-300">
                Official statement printout for Blue Fox & {couponProfile.shopName || 'Darjeeling momo'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors"
              title="Download CSV Statement"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">CSV Export</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              id="confirm-print-statement-btn"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
              title="Close modal"
              id="close-print-modal-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Statement Sheet */}
        <div 
          className="p-6 sm:p-10 overflow-y-auto bg-white text-slate-900 printable-document-area space-y-6"
          id="accountability-printable-statement"
        >
          {/* Statement Header */}
          <div className="border-b-2 border-slate-900 pb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-950 text-white text-[10px] font-black tracking-wider uppercase">
                    Official Khata Document
                  </span>
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Pass: {couponProfile.couponCode}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
                  खाजा तथा दैनिक सापटी हिसाब विवरण
                </h1>
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest mt-0.5">
                  Blue Fox Official Food Credit & Accountability Statement
                </p>
              </div>

              <div className="text-left sm:text-right border-l-2 sm:border-l-0 sm:border-r-0 border-slate-200 pl-3 sm:pl-0 text-xs text-slate-600 space-y-0.5">
                <p><strong>Statement Date:</strong> {todayBsStr} BS ({todayAdStr} AD)</p>
                <p><strong>Pass Number:</strong> <span className="font-mono font-bold text-slate-900">{couponProfile.couponCode}</span></p>
                <p><strong>Total Transactions:</strong> {transactions.length} Records</p>
              </div>
            </div>

            {/* Parties Accountability Box */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
              {/* Customer Column */}
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-blue-900 font-bold uppercase tracking-wider text-[11px]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Customer (खातावाल विवरण):</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {couponProfile.holderName || 'Blue Fox'}
                </p>
                <p className="text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Contact: <strong>{couponProfile.holderPhone || '+977 9802755605'}</strong></span>
                </p>
                <p className="text-slate-500 text-[11px]">
                  Valid Period: {couponProfile.issueDateBS} to {couponProfile.validUntilBS} BS
                </p>
              </div>

              {/* Shopkeeper Column */}
              <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="flex items-center gap-1.5 text-emerald-900 font-bold uppercase tracking-wider text-[11px]">
                  <Store className="w-3.5 h-3.5" />
                  <span>Vendor / Shop (होटल/पसल विवरण):</span>
                </div>
                <p className="text-base font-black text-slate-900">
                  {couponProfile.shopName || 'Darjeeling momo'}
                </p>
                <p className="text-slate-600">
                  Address: <strong>{couponProfile.shopAddress || 'Itahari-6, Sky Plaza'}</strong>
                </p>
                <p className="text-slate-600 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Contact: <strong>{couponProfile.shopPhone || '9802755605'}</strong></span>
                </p>
              </div>
            </div>
          </div>

          {/* Financial Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Food Purchases</span>
              <span className="text-lg sm:text-xl font-black text-slate-900 block mt-0.5">
                Rs. {summary.totalSpent.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-500">{transactions.filter(t => t.type === 'PURCHASE').length} Entries</span>
            </div>

            <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">Settled / Paid Amount</span>
              <span className="text-lg sm:text-xl font-black text-blue-900 block mt-0.5">
                Rs. {summary.totalPaid.toLocaleString()}
              </span>
              <span className="text-[10px] text-blue-700">Cash / Paid settlements</span>
            </div>

            <div className="border-2 border-red-500/50 rounded-xl p-3 bg-red-50/50 text-center">
              <span className="text-[11px] font-black text-red-700 uppercase block">Net Credit Due (बाँकी रकम)</span>
              <span className="text-lg sm:text-2xl font-black text-red-600 block mt-0.5">
                Rs. {summary.totalCreditDue.toLocaleString()}
              </span>
              <span className="text-[10px] font-bold text-red-700">Payable to Shop</span>
            </div>
          </div>

          {/* Detailed Itemized Transactions Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-slate-700" />
                <span>Detailed Transaction & Food Items Statement (विस्तृत विवरण)</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {transactions.length} total recorded entries
              </span>
            </div>

            <div className="border border-slate-300 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-300">
                    <th className="py-2.5 px-3 w-10 text-center">S.N.</th>
                    <th className="py-2.5 px-3">Date (मिति)</th>
                    <th className="py-2.5 px-3">Tx Number</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Food Items Breakdown (परिकार विवरण)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Amount (NPR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transactions.map((tx, idx) => {
                    const isCredit = tx.paymentStatus === 'CREDIT';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/50 break-inside-avoid">
                        <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-900 whitespace-nowrap">
                          <div>{tx.dateBSFormatted || tx.dateBS}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{tx.dateAD}</div>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                          {tx.transactionNumber}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-slate-700">
                            {tx.type === 'PURCHASE' ? 'खाजा (Purchase)' : tx.type === 'PAYMENT_OUT' ? 'भुक्तानी (Payment)' : 'फिर्ता (Return)'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
                          {tx.items && tx.items.length > 0 ? (
                            <div className="space-y-0.5">
                              {tx.items.map((item, iIdx) => (
                                <div key={iIdx} className="flex items-center justify-between gap-3 text-[11px]">
                                  <span className="font-semibold text-slate-900">{item.name}</span>
                                  <span className="text-slate-600 font-mono text-[10px] shrink-0">
                                    {item.qty} × Rs.{item.unitPrice} = <strong>Rs.{item.totalPrice}</strong>
                                  </span>
                                </div>
                              ))}
                              {tx.referenceNote && (
                                <p className="text-[10px] text-slate-500 italic mt-0.5">
                                  Note: {tx.referenceNote}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 italic">
                              {tx.referenceNote || 'General Khata Entry'}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span 
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              isCredit 
                                ? 'bg-red-100 text-red-800 border border-red-300' 
                                : 'bg-blue-100 text-blue-900 border border-blue-300'
                            }`}
                          >
                            {tx.paymentStatus}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-black font-mono text-sm whitespace-nowrap">
                          Rs. {tx.netAmount.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 border-t-2 border-slate-400 font-bold text-slate-900">
                    <td colSpan={6} className="py-3 px-3 text-right uppercase tracking-wider text-xs">
                      Grand Total Ledger Balance:
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono text-base text-slate-950">
                      Rs. {summary.totalSpent.toLocaleString()}
                    </td>
                  </tr>
                  <tr className="bg-red-50 border-t border-red-200 font-bold text-red-900">
                    <td colSpan={6} className="py-2 px-3 text-right uppercase tracking-wider text-xs">
                      Total Due Outstanding (बाँकी रकम):
                    </td>
                    <td className="py-2 px-3 text-right font-black font-mono text-base text-red-700">
                      Rs. {summary.totalCreditDue.toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Official Signatures & Verification Stamp Section */}
          <div className="pt-6 border-t-2 border-slate-300 break-inside-avoid space-y-6">
            <p className="text-xs text-slate-600 text-center italic">
              हामी दुवै पक्ष (खातावाल तथा होटल सञ्चालक) यो खाता विवरण पूर्ण सत्य र आधिकारिक भएको स्वीकार गर्दछौं।
              (Both parties acknowledge and accept this ledger statement as accurate and binding.)
            </p>

            <div className="grid grid-cols-2 gap-8 pt-4">
              {/* Customer Signature Block */}
              <div className="border border-slate-300 rounded-xl p-4 text-center space-y-8 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  खातावालको हस्ताक्षर (Customer Signature)
                </div>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pt-8"></div>
                <div className="text-xs text-slate-700 space-y-0.5">
                  <p className="font-bold text-slate-900">{couponProfile.holderName || 'Blue Fox'}</p>
                  <p className="text-[11px] text-slate-500">Contact: {couponProfile.holderPhone || '+977 9802755605'}</p>
                  <p className="text-[11px] text-slate-500">Date: ________________________</p>
                </div>
              </div>

              {/* Shopkeeper Signature Block */}
              <div className="border border-slate-300 rounded-xl p-4 text-center space-y-8 bg-slate-50/50">
                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  होटल सञ्चालकको हस्ताक्षर तथा छाप (Shopkeeper Sign & Stamp)
                </div>
                <div className="border-b border-dashed border-slate-400 w-3/4 mx-auto pt-8"></div>
                <div className="text-xs text-slate-700 space-y-0.5">
                  <p className="font-bold text-slate-900">{couponProfile.shopName || 'Darjeeling momo'}</p>
                  <p className="text-[11px] text-slate-500">{couponProfile.shopAddress || 'Itahari-6, Sky Plaza'}, Phone: {couponProfile.shopPhone || '9802755605'}</p>
                  <p className="text-[11px] text-slate-500">Date: ________________________</p>
                </div>
              </div>
            </div>

            <div className="text-center text-[10px] text-slate-400 pt-2">
              Blue Fox Digital Credit Khata Engine • System Serial: {couponProfile.couponCode} • Generated: {todayBsStr} BS
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
