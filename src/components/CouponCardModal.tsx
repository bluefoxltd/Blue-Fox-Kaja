import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Download, 
  Printer, 
  Copy, 
  Check, 
  Store, 
  Phone, 
  Calendar, 
  ExternalLink,
  ShieldCheck,
  Pencil
} from 'lucide-react';
import { CouponProfile } from '../types';

interface CouponCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponProfile: CouponProfile;
  onOpenShopkeeperView: () => void;
  onOpenEditModal: () => void;
}

export const CouponCardModal: React.FC<CouponCardModalProps> = ({
  isOpen,
  onClose,
  couponProfile,
  onOpenShopkeeperView,
  onOpenEditModal,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute the live QR URL for the shopkeeper
  const shopkeeperUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?view=shopkeeper&coupon=${couponProfile.couponCode}`
    : `https://bluefox.khata.np/?view=shopkeeper&coupon=${couponProfile.couponCode}`;

  useEffect(() => {
    if (!isOpen) return;

    // Generate high resolution QR Code
    QRCode.toDataURL(shopkeeperUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0f172a', // Navy blue
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });
  }, [isOpen, shopkeeperUrl, couponProfile.couponCode]);

  if (!isOpen) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shopkeeperUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `BlueFox_Coupon_QR_${couponProfile.couponCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="coupon-card-modal"
      >
        {/* Navy Blue Card Header */}
        <div className="bg-blue-950 text-white p-5 text-center relative border-b border-blue-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-300 hover:text-white p-1 rounded-lg hover:bg-blue-900"
            id="coupon-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-900/80 border border-blue-800 text-amber-300 mb-2 shadow-inner">
            <QrCode className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            Blue Fox - Khaja Khata
          </h3>
          <p className="text-xs text-blue-200 font-medium mt-0.5">
            Official Food Credit Digital & Print Coupon Pass
          </p>
        </div>

        {/* Physical Pass Design */}
        <div className="p-5 sm:p-6 space-y-4">
          
          <div 
            className="bg-gradient-to-b from-blue-50/70 to-slate-50 border-2 border-dashed border-blue-300 rounded-2xl p-4 text-center relative shadow-xs"
            id="printable-coupon-pass"
          >
            {/* Stamp Badge */}
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-950 text-white text-[11px] font-mono tracking-wider font-bold mb-3 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>FIXED COUPON CODE: {couponProfile.couponCode}</span>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm inline-block mx-auto">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Fixed Coupon QR Code" 
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain mx-auto" 
                  id="coupon-qr-image"
                />
              ) : (
                <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                  Generating High-Res QR...
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-blue-950 mt-2">
              Scan with Any Mobile Camera
            </p>
            <p className="text-[11px] text-slate-500">
              Shopkeeper scans this to view live credit ledger & Nepali date statements
            </p>

            {/* Coupon Holder & Shop Details */}
            <div className="mt-4 pt-3 border-t border-slate-200/80 text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Customer (खातावाल):</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-800" id="coupon-modal-holder-name">
                    {couponProfile.holderName}
                  </span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEditModal();
                    }}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-900 text-[11px] font-semibold border border-blue-200 transition-colors"
                    title="Edit Customer Name (to whom coupon is provided)"
                    id="edit-customer-name-inline-btn"
                  >
                    <Pencil className="w-3 h-3 text-blue-700" />
                    <span>Edit Name</span>
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Phone:
                </span>
                <span className="font-mono text-slate-700">{couponProfile.holderPhone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Store className="w-3 h-3 text-slate-400" /> Shop / Canteen:
                </span>
                <span className="font-semibold text-blue-950 text-right truncate max-w-[190px]">
                  {couponProfile.shopName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Valid Session (वि.सं.):
                </span>
                <span className="font-mono text-slate-700">{couponProfile.issueDateBS} to {couponProfile.validUntilBS}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={handleDownloadQrImage}
              className="py-2 px-3 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              id="download-coupon-qr-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download QR (PNG)</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-all"
              id="copy-shopkeeper-url-btn"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-600" />
                  <span>Copy Scan URL</span>
                </>
              )}
            </button>
          </div>

          {/* Edit Customer & Coupon Pass Details Button */}
          <button
            onClick={() => {
              onClose();
              onOpenEditModal();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            id="open-edit-coupon-modal-btn"
          >
            <Pencil className="w-3.5 h-3.5 text-blue-800" />
            <span>Edit Customer Name & Coupon Pass (विवरण सम्पादन)</span>
          </button>

          {/* Direct Switch to Shopkeeper Simulation View */}
          <button
            onClick={() => {
              onClose();
              onOpenShopkeeperView();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
            id="simulate-scan-view-btn"
          >
            <ExternalLink className="w-4 h-4 text-emerald-700" />
            <span>Open Shopkeeper Ledger View (Simulate QR Scan)</span>
          </button>

        </div>
      </div>
    </div>
  );
};
