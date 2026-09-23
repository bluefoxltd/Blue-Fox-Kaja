import React from 'react';
import { 
  UtensilsCrossed, 
  QrCode, 
  PlusCircle, 
  Download, 
  Store, 
  FileSpreadsheet, 
  Printer, 
  ShieldCheck,
  Pencil,
  User,
  Trash2,
  FileArchive,
  Lock,
  KeyRound
} from 'lucide-react';
import { CouponProfile, LedgerTransaction, SyncStatus } from '../types';
import { exportLedgerToCsv, exportLedgerToJson } from '../utils/storage';

interface NavbarProps {
  activeView: 'dashboard' | 'shopkeeper' | 'coupon';
  setActiveView: (view: 'dashboard' | 'shopkeeper' | 'coupon') => void;
  couponProfile: CouponProfile;
  transactions: LedgerTransaction[];
  onOpenNewEntry: () => void;
  onOpenCouponModal: () => void;
  onOpenEditCouponModal: () => void;
  onOpenClearDbModal?: () => void;
  onLockAdmin?: () => void;
  onChangePin?: () => void;
  syncStatus?: SyncStatus;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  setActiveView,
  couponProfile,
  transactions,
  onOpenNewEntry,
  onOpenCouponModal,
  onOpenEditCouponModal,
  onOpenClearDbModal,
  onLockAdmin,
  onChangePin,
  syncStatus = 'connected',
}) => {
  const [downloadMenuOpen, setDownloadMenuOpen] = React.useState(false);

  const handleCsvDownload = () => {
    exportLedgerToCsv(transactions, couponProfile.couponCode);
    setDownloadMenuOpen(false);
  };

  const handleJsonDownload = () => {
    exportLedgerToJson(transactions, couponProfile);
    setDownloadMenuOpen(false);
  };

  const handlePrint = () => {
    window.print();
    setDownloadMenuOpen(false);
  };

  return (
    <header className="bg-blue-950 text-white sticky top-0 z-40 shadow-md border-b border-blue-900" id="main-header">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('dashboard')} 
              className="flex items-center gap-2.5 text-left group focus:outline-none"
              id="brand-logo-btn"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-800 border border-blue-700 flex items-center justify-center text-blue-200 shadow-inner group-hover:bg-blue-700 transition-colors">
                <UtensilsCrossed className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-white">
                    Blue Fox
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-800/80 text-blue-200 border border-blue-700/60 font-medium">
                    खाजा खाता
                  </span>
                </div>
                <p className="text-xs text-blue-300 font-mono hidden sm:block">
                  Coupon: {couponProfile.couponCode}
                </p>
              </div>
            </button>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden md:flex items-center bg-blue-900/60 p-1 rounded-xl border border-blue-800/80 text-xs font-medium" id="desktop-nav">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeView === 'dashboard'
                  ? 'bg-white text-blue-950 font-bold shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-blue-800/60'
              }`}
              id="nav-tab-dashboard"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Admin Khata</span>
            </button>

            <button
              onClick={() => setActiveView('shopkeeper')}
              className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                activeView === 'shopkeeper'
                  ? 'bg-white text-blue-950 font-bold shadow-sm'
                  : 'text-blue-200 hover:text-white hover:bg-blue-800/60'
              }`}
              id="nav-tab-shopkeeper"
            >
              <Store className="w-4 h-4 text-emerald-400" />
              <span>Shopkeeper QR View</span>
            </button>

            <button
              onClick={onOpenCouponModal}
              className="px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-blue-200 hover:text-white hover:bg-blue-800/60"
              id="nav-tab-coupon"
            >
              <QrCode className="w-4 h-4 text-amber-300" />
              <span>Fixed Coupon QR</span>
            </button>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Customer Pill with Edit button */}
            <button
              onClick={onOpenEditCouponModal}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 border border-blue-700/80 text-blue-200 hover:text-white transition-colors text-xs"
              title="Click to edit to whom this coupon is provided"
              id="navbar-edit-customer-btn"
            >
              <User className="w-3.5 h-3.5 text-amber-300" />
              <span className="text-[11px] text-blue-300 font-medium">To:</span>
              <span className="font-bold text-white max-w-[120px] truncate">{couponProfile.holderName}</span>
              <Pencil className="w-3 h-3 text-amber-300" />
            </button>

            {/* Download File Dropdown */}
            <div className="relative">
              <button
                onClick={() => setDownloadMenuOpen(!downloadMenuOpen)}
                className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold rounded-lg bg-blue-900/90 hover:bg-blue-800 text-blue-100 border border-blue-700 flex items-center gap-1.5 transition-colors shadow-sm"
                title="Download Ledger Statement / File"
                id="btn-download-menu"
              >
                <Download className="w-4 h-4 text-blue-300" />
                <span className="hidden sm:inline">Download File</span>
              </button>

              {downloadMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-56 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 py-1.5 z-50 text-xs"
                  id="download-dropdown-content"
                >
                  <div className="px-3 py-1.5 font-semibold text-slate-500 uppercase tracking-wider text-[10px] border-b border-slate-100">
                    Export Ledger Options
                  </div>
                  <button
                    onClick={handleCsvDownload}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2.5 transition-colors text-slate-700 font-medium"
                    id="export-csv-btn"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    <span>Download CSV (Excel)</span>
                  </button>
                  <button
                    onClick={handleJsonDownload}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2.5 transition-colors text-slate-700 font-medium"
                    id="export-json-btn"
                  >
                    <Download className="w-4 h-4 text-blue-600" />
                    <span>Download JSON Backup</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="w-full text-left px-3 py-2 hover:bg-slate-100 flex items-center gap-2.5 transition-colors text-slate-700 font-medium border-t border-slate-100"
                    id="print-statement-btn"
                  >
                    <Printer className="w-4 h-4 text-slate-600" />
                    <span>Print Ledger Statement</span>
                  </button>

                  <a
                    href="/api/download-zip"
                    download="bluefox-khaja-khata-final.zip"
                    onClick={() => setDownloadMenuOpen(false)}
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 flex items-center gap-2.5 transition-colors text-blue-900 font-bold border-t border-slate-100"
                    id="download-source-zip-btn"
                  >
                    <FileArchive className="w-4 h-4 text-blue-700" />
                    <span>Download Final Code (.ZIP)</span>
                  </a>

                  {onOpenClearDbModal && (
                    <button
                      onClick={() => {
                        setDownloadMenuOpen(false);
                        onOpenClearDbModal();
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-red-50 flex items-center gap-2.5 transition-colors text-red-600 font-medium border-t border-slate-100"
                      id="navbar-clear-db-btn"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>Clear All Database</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Fixed QR Quick Button */}
            <button
              onClick={onOpenCouponModal}
              className="md:hidden p-2 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-amber-300 border border-blue-700"
              title="View Fixed Coupon QR"
              id="mobile-coupon-btn"
            >
              <QrCode className="w-4 h-4" />
            </button>

            {/* Live Sync Status Pill */}
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-900/60 text-emerald-300 text-[11px] font-semibold border border-emerald-500/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <span>1s Live Cloud Sync</span>
            </div>

            {/* Lock / Sign Out Button for Admin */}
            {onLockAdmin && activeView === 'dashboard' && (
              <button
                onClick={onLockAdmin}
                className="px-2.5 py-1.5 rounded-lg bg-blue-900/80 hover:bg-blue-800 text-amber-300 border border-blue-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                title="Lock Admin Session (Require PIN)"
                id="lock-admin-navbar-btn"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock Admin</span>
              </button>
            )}

            {/* "+ New Daily Snack Entry" Main Call to Action - Only visible to Admin */}
            {activeView !== 'shopkeeper' && (
              <button
                onClick={onOpenNewEntry}
                className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 shadow-sm transition-all focus:ring-2 focus:ring-blue-400 focus:outline-none"
                id="btn-new-food-entry"
              >
                <PlusCircle className="w-4 h-4" />
                <span>+ Daily Snack Entry</span>
              </button>
            )}
          </div>

        </div>

        {/* Mobile Sub-Navigation */}
        <div className="flex md:hidden border-t border-blue-900/70 py-2 gap-2 text-xs font-medium" id="mobile-subnav">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`flex-1 py-1.5 rounded-lg text-center ${
              activeView === 'dashboard'
                ? 'bg-blue-800 text-white font-bold'
                : 'text-blue-300 hover:text-white'
            }`}
          >
            Admin Khata
          </button>
          <button
            onClick={() => setActiveView('shopkeeper')}
            className={`flex-1 py-1.5 rounded-lg text-center ${
              activeView === 'shopkeeper'
                ? 'bg-emerald-800 text-white font-bold'
                : 'text-blue-300 hover:text-white'
            }`}
          >
            Shopkeeper QR View
          </button>
        </div>

      </div>
    </header>
  );
};
