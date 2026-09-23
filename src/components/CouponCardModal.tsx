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
  Pencil,
  IdCard,
  MapPin
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
  const [isGeneratingPass, setIsGeneratingPass] = useState<boolean>(false);

  // Compute the live QR URL for the shopkeeper
  const shopkeeperUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?view=shopkeeper&coupon=${couponProfile.couponCode}`
    : `https://bluefox.khata.np/?view=shopkeeper&coupon=${couponProfile.couponCode}`;

  useEffect(() => {
    if (!isOpen) return;

    // Generate high resolution QR Code
    QRCode.toDataURL(shopkeeperUrl, {
      width: 480,
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

  // Download raw QR code only
  const handleDownloadQrOnly = () => {
    if (!qrDataUrl) return;
    const safeShop = (couponProfile.shopName || 'Darjeeling_momo').replace(/[^a-zA-Z0-9]/g, '_');
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `BlueFox_QR_Only_${safeShop}_${couponProfile.couponCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Generate and Download Full Pass Card with Shopkeeper Details, Customer, and QR
  const handleDownloadFullPass = async () => {
    if (!qrDataUrl) return;
    setIsGeneratingPass(true);

    try {
      const canvas = document.createElement('canvas');
      const width = 850;
      const height = 1200;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // 2. Outer Border with Rounded Accents
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#1e3a8a';
      ctx.strokeRect(18, 18, width - 36, height - 36);

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = '#93c5fd';
      ctx.strokeRect(26, 26, width - 52, height - 52);

      // 3. Top Navy Blue Header Banner
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(28, 28, width - 56, 175);

      // Brand Title
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f59e0b'; // Gold / Amber
      ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
      ctx.fillText('BLUE FOX - KHAJA KHATA', width / 2, 75);

      ctx.fillStyle = '#ffffff';
      ctx.font = '900 32px system-ui, -apple-system, sans-serif';
      ctx.fillText('OFFICIAL FOOD CREDIT PASS', width / 2, 120);

      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillText('दैनिक खाजा तथा उधारो कुपन पास • IMMUTABLE DIGITAL LEDGER', width / 2, 155);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '13px monospace';
      ctx.fillText(`FIXED PASS CODE: ${couponProfile.couponCode}`, width / 2, 182);

      // 4. Shop / Canteen Info Banner
      const shopBoxY = 220;
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(45, shopBoxY, width - 90, 130);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(45, shopBoxY, width - 90, 130);

      ctx.fillStyle = '#0f172a';
      ctx.font = '900 28px system-ui, -apple-system, sans-serif';
      ctx.fillText(couponProfile.shopName || 'Darjeeling momo', width / 2, shopBoxY + 42);

      ctx.fillStyle = '#334155';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      const address = couponProfile.shopAddress || 'Itahari-6, Sky Plaza';
      const phone = couponProfile.shopPhone || '9802755605';
      ctx.fillText(`Address: ${address}  •  Phone: ${phone}`, width / 2, shopBoxY + 78);

      ctx.fillStyle = '#059669'; // Emerald
      ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
      ctx.fillText('✓ AUTHORIZED CANTEEN & SNACK PARTNER • VERIFIED PASS', width / 2, shopBoxY + 108);

      // 5. Load and Draw High-Res Central QR
      const qrImg = new Image();
      await new Promise((resolve, reject) => {
        qrImg.onload = resolve;
        qrImg.onerror = reject;
        qrImg.src = qrDataUrl;
      });

      const qrBoxSize = 420;
      const qrBoxX = (width - qrBoxSize) / 2;
      const qrBoxY = 370;

      // QR Container Box
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 2;
      ctx.strokeRect(qrBoxX, qrBoxY, qrBoxSize, qrBoxSize);

      // QR Image
      const qrSize = 360;
      const qrX = (width - qrSize) / 2;
      const qrY = qrBoxY + 16;
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);

      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
      ctx.fillText('Scan with Any Smartphone Camera to Open Live Ledger', width / 2, qrBoxY + qrBoxSize - 18);

      // 6. Customer & Pass Details Box
      const custBoxY = 810;
      ctx.fillStyle = '#eff6ff';
      ctx.fillRect(45, custBoxY, width - 90, 260);
      ctx.strokeStyle = '#bfdbfe';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(45, custBoxY, width - 90, 260);

      // Details Header
      ctx.textAlign = 'left';
      ctx.fillStyle = '#1e3a8a';
      ctx.font = '900 18px system-ui, -apple-system, sans-serif';
      ctx.fillText('ACCOUNT HOLDER & PASS SPECIFICATIONS (खातावाल विवरण):', 65, custBoxY + 36);

      // Detail Rows
      const rowX = 65;
      ctx.font = 'bold 19px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(`Customer Name (ग्राहक): ${couponProfile.holderName || 'Bipin Chhetri'}`, rowX, custBoxY + 76);

      ctx.font = '17px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#334155';
      ctx.fillText(`Customer Phone: ${couponProfile.holderPhone || '+977 9801234567'}`, rowX, custBoxY + 112);
      ctx.fillText(`Registered Shop: ${couponProfile.shopName || 'Darjeeling momo'} (${couponProfile.shopAddress || 'Itahari-6, Sky Plaza'})`, rowX, custBoxY + 148);
      ctx.fillText(`Validity Session: ${couponProfile.issueDateBS} to ${couponProfile.validUntilBS} BS`, rowX, custBoxY + 184);

      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#0369a1';
      ctx.fillText(`Credit Limit (उधारो सिमा): Rs. ${(couponProfile.creditLimit || 15000).toLocaleString()}`, rowX, custBoxY + 222);

      // 7. Footer Notice
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748b';
      ctx.font = '14px system-ui, -apple-system, sans-serif';
      ctx.fillText('Blue Fox Food Credit System • Digital Scannable Canteen Pass', width / 2, 1110);
      ctx.fillText('Keep this pass handy for daily snack orders and shopkeeper verification.', width / 2, 1135);

      // Trigger download
      const safeShop = (couponProfile.shopName || 'Darjeeling_momo').replace(/[^a-zA-Z0-9]/g, '_');
      const safeHolder = (couponProfile.holderName || 'Bipin_Chhetri').replace(/[^a-zA-Z0-9]/g, '_');
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `BlueFox_Full_Pass_${safeShop}_${safeHolder}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to download full pass:', err);
    } finally {
      setIsGeneratingPass(false);
    }
  };

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
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
            <IdCard className="w-6 h-6" />
          </div>

          <h3 className="text-xl font-black tracking-tight text-white">
            Blue Fox - Khaja Khata
          </h3>
          <p className="text-xs text-blue-200 font-medium mt-0.5">
            Official Food Credit Digital & Print Full Coupon Pass
          </p>
        </div>

        {/* Physical Pass Design */}
        <div className="p-5 sm:p-6 space-y-4">
          
          <div 
            className="bg-gradient-to-b from-blue-50/80 to-slate-50 border-2 border-dashed border-blue-300 rounded-2xl p-4 text-center relative shadow-xs"
            id="printable-coupon-pass"
          >
            {/* Stamp Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 text-white text-[11px] font-mono tracking-wider font-bold mb-3 shadow-xs">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>FIXED COUPON CODE: {couponProfile.couponCode}</span>
            </div>

            {/* Shop Details Banner */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs mb-3 text-left">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-sm font-extrabold text-blue-950 flex items-center gap-1.5" id="pass-shop-name">
                    <Store className="w-4 h-4 text-blue-700 shrink-0" />
                    <span>{couponProfile.shopName || 'Darjeeling momo'}</span>
                  </h4>
                  <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5" id="pass-shop-address">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{couponProfile.shopAddress || 'Itahari-6, Sky Plaza'}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 block">Phone:</span>
                  <span className="text-xs font-mono font-bold text-blue-900" id="pass-shop-phone">
                    {couponProfile.shopPhone || '9802755605'}
                  </span>
                </div>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm inline-block mx-auto">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="Fixed Coupon QR Code" 
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain mx-auto" 
                  id="coupon-qr-image"
                />
              ) : (
                <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                  Generating High-Res QR...
                </div>
              )}
            </div>

            <p className="text-xs font-bold text-blue-950 mt-2">
              Scan with Any Mobile Camera
            </p>
            <p className="text-[11px] text-slate-500">
              Shopkeeper scans this pass to view live credit ledger & statements
            </p>

            {/* Coupon Holder & Account Details */}
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
                    title="Edit Customer Name"
                    id="edit-customer-name-inline-btn"
                  >
                    <Pencil className="w-3 h-3 text-blue-700" />
                    <span>Edit</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" /> Customer Phone:
                </span>
                <span className="font-mono text-slate-700">{couponProfile.holderPhone}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Valid Session:
                </span>
                <span className="font-mono text-slate-700">{couponProfile.issueDateBS} to {couponProfile.validUntilBS}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons: Full Pass Download vs QR Only */}
          <div className="space-y-2 pt-1">
            {/* Primary Action: Download Full Pass Card (PNG) */}
            <button
              onClick={handleDownloadFullPass}
              disabled={isGeneratingPass || !qrDataUrl}
              className="w-full py-3 px-4 rounded-xl bg-blue-950 hover:bg-blue-900 active:bg-blue-800 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              id="download-full-pass-btn"
            >
              <Download className="w-4 h-4 text-amber-300" />
              <span>{isGeneratingPass ? 'Generating Full Pass...' : 'Download Full Pass Card (PNG)'}</span>
            </button>

            {/* Secondary Actions: QR Only, Copy Link, Print Slip */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownloadQrOnly}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-all"
                title="Download only the raw QR code square"
                id="download-coupon-qr-btn"
              >
                <QrCode className="w-3.5 h-3.5 text-slate-600" />
                <span>QR Only (PNG)</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 border border-slate-300 transition-all"
                id="copy-shopkeeper-url-btn"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-600" />
                    <span>Copy Scan URL</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Edit Customer & Coupon Pass Details Button */}
          <button
            onClick={() => {
              onClose();
              onOpenEditModal();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
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
