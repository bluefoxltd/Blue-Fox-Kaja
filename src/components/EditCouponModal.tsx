import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserCheck, 
  Store, 
  Phone, 
  Calendar, 
  CreditCard, 
  ShieldCheck, 
  Save, 
  RotateCcw,
  Check
} from 'lucide-react';
import { CouponProfile } from '../types';
import { DEFAULT_COUPON } from '../utils/storage';

interface EditCouponModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponProfile: CouponProfile;
  onSave: (updated: CouponProfile) => void;
}

export const EditCouponModal: React.FC<EditCouponModalProps> = ({
  isOpen,
  onClose,
  couponProfile,
  onSave,
}) => {
  const [formData, setFormData] = useState<CouponProfile>(couponProfile);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setFormData(couponProfile);
      setSavedSuccess(false);
      setErrorMsg('');
    }
  }, [isOpen, couponProfile]);

  if (!isOpen) return null;

  const handleChange = (field: keyof CouponProfile, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.holderName.trim()) {
      setErrorMsg('Customer name cannot be empty. कृपया ग्राहकको नाम प्रविष्ट गर्नुहोस्।');
      return;
    }

    if (!formData.couponCode.trim()) {
      setErrorMsg('Coupon code cannot be empty. कृपया कुपन कोड प्रविष्ट गर्नुहोस्।');
      return;
    }

    // Auto update QR payload URL based on current origin and new coupon code
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const updatedProfile: CouponProfile = {
      ...formData,
      holderName: formData.holderName.trim(),
      holderPhone: formData.holderPhone.trim(),
      shopName: formData.shopName.trim() || 'Darjeeling momo',
      shopAddress: formData.shopAddress.trim() || 'Itahari-6, Sky Plaza',
      shopPhone: (formData.shopPhone || '').trim() || '9802755605',
      couponCode: formData.couponCode.trim().toUpperCase(),
      creditLimit: Number(formData.creditLimit) || 15000,
      fixedQrPayload: `${origin}/?view=shopkeeper&coupon=${encodeURIComponent(formData.couponCode.trim().toUpperCase())}`,
    };

    onSave(updatedProfile);
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleResetToDefault = () => {
    setFormData(DEFAULT_COUPON);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-3 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="edit-coupon-modal"
      >
        {/* Navy Blue Header */}
        <div className="bg-blue-950 text-white p-5 relative border-b border-blue-900">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-blue-300 hover:text-white p-1 rounded-lg hover:bg-blue-900 transition-colors"
            id="edit-coupon-close-btn"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-900 border border-blue-800 flex items-center justify-center text-amber-300 shadow-inner">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black tracking-tight text-white">
                Edit Customer & Coupon Details
              </h3>
              <p className="text-xs text-blue-200 font-medium mt-0.5">
                कुपन प्राप्त गर्ने ग्राहकको नाम र विवरण सम्पादन गर्नुहोस्
              </p>
            </div>
          </div>
        </div>

        {/* Success confirmation notification */}
        {savedSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-800">
              Customer Details Updated!
            </h4>
            <p className="text-xs text-slate-500">
              Coupon is now assigned to <strong className="text-blue-950">{formData.holderName}</strong>.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {errorMsg}
              </div>
            )}

            {/* Customer (To Whom Coupon is Provided) */}
            <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-blue-950 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-blue-800" />
                  <span>Customer Name (कुपन प्राप्त गर्ने ग्राहक / खातावाल):</span>
                </label>
                <span className="text-[10px] uppercase font-bold text-blue-800 bg-blue-100 px-2 py-0.5 rounded">
                  Required
                </span>
              </div>
              <input
                type="text"
                value={formData.holderName}
                onChange={(e) => handleChange('holderName', e.target.value)}
                placeholder="e.g. Bipin Chhetri"
                className="w-full px-3.5 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-xs"
                id="input-customer-name"
                required
              />
              <p className="text-[11px] text-slate-500">
                You can change whose name appears on the coupon pass, the shopkeeper's QR scanner view, and all daily khata records.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Customer Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Phone Number (सम्पर्क नम्बर):</span>
                </label>
                <input
                  type="text"
                  value={formData.holderPhone}
                  onChange={(e) => handleChange('holderPhone', e.target.value)}
                  placeholder="e.g. +977 9801234567"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  id="input-customer-phone"
                />
              </div>

              {/* Coupon Code / ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Coupon Pass ID (कुपन कोड):</span>
                </label>
                <input
                  type="text"
                  value={formData.couponCode}
                  onChange={(e) => handleChange('couponCode', e.target.value)}
                  placeholder="e.g. BF-FOX-7821"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 uppercase"
                  id="input-coupon-code"
                  required
                />
              </div>
            </div>

            {/* Shop / Canteen Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-slate-400" />
                  <span>Shop / Canteen Name:</span>
                </label>
                <input
                  type="text"
                  value={formData.shopName}
                  onChange={(e) => handleChange('shopName', e.target.value)}
                  placeholder="e.g. Darjeeling momo"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  id="input-shop-name"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span>Shop Address:</span>
                </label>
                <input
                  type="text"
                  value={formData.shopAddress}
                  onChange={(e) => handleChange('shopAddress', e.target.value)}
                  placeholder="e.g. Itahari-6, Sky Plaza"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  id="input-shop-address"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>Shop Phone:</span>
                </label>
                <input
                  type="text"
                  value={formData.shopPhone || ''}
                  onChange={(e) => handleChange('shopPhone', e.target.value)}
                  placeholder="e.g. 9802755605"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  id="input-shop-phone"
                />
              </div>
            </div>

            {/* Credit Limit and Validity Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  <span>Credit Limit (रु.):</span>
                </label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  value={formData.creditLimit || 15000}
                  onChange={(e) => handleChange('creditLimit', Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
                  id="input-credit-limit"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Issued (वि.सं.):</span>
                </label>
                <input
                  type="text"
                  value={formData.issueDateBS}
                  onChange={(e) => handleChange('issueDateBS', e.target.value)}
                  placeholder="2083-01-01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  id="input-issue-date-bs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>Valid Until (वि.सं.):</span>
                </label>
                <input
                  type="text"
                  value={formData.validUntilBS}
                  onChange={(e) => handleChange('validUntilBS', e.target.value)}
                  placeholder="2083-12-30"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  id="input-valid-until-bs"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleResetToDefault}
                className="px-3 py-2 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl flex items-center gap-1 transition-colors"
                title="Reset to default details"
                id="reset-coupon-default-btn"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                  id="cancel-edit-coupon-btn"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 rounded-xl flex items-center gap-1.5 shadow-sm transition-all focus:ring-2 focus:ring-blue-400"
                  id="save-coupon-changes-btn"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
