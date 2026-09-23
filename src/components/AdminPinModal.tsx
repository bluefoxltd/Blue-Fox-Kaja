import React, { useState } from 'react';
import { Lock, X, Check, AlertCircle, KeyRound } from 'lucide-react';
import { syncManager } from '../utils/syncManager';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  mode?: 'verify' | 'change';
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  mode = 'verify',
}) => {
  const [pin, setPin] = useState<string>('');
  const [oldPin, setOldPin] = useState<string>('');
  const [newPin, setNewPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length !== 4) {
      setErrorMsg('Please enter a 4-digit PIN');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const isValid = await syncManager.verifyPin(pin);
      if (isValid) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('bluefox_admin_auth', 'true');
        }
        onSuccess();
        onClose();
      } else {
        setErrorMsg('Incorrect PIN. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Verification error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setErrorMsg('New PIN must be exactly 4 numbers');
      return;
    }
    if (newPin !== confirmPin) {
      setErrorMsg('New PIN and Confirm PIN do not match');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await syncManager.changePin(oldPin, newPin);
      if (res.success) {
        setSuccessMsg('Admin PIN successfully updated!');
        setTimeout(() => {
          onClose();
          setSuccessMsg('');
        }, 1500);
      } else {
        setErrorMsg(res.message || 'Incorrect current PIN');
      }
    } catch (err) {
      setErrorMsg('Failed to change PIN');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-blue-950 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-amber-300" />
            <h3 className="font-extrabold text-sm">
              {mode === 'verify' ? 'Admin Access Verification' : 'Change Admin Security PIN'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-blue-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {errorMsg && (
            <div className="mb-3 p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-3 p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5 font-bold">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {mode === 'verify' ? (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-xs text-slate-600">
                Enter your 4-digit PIN to unlock Blue Fox admin controls and daily snack entries.
              </p>
              <div>
                <input
                  type="password"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  autoFocus
                  className="w-full text-center tracking-[1em] font-mono text-2xl font-black py-3 border-2 border-slate-200 rounded-2xl focus:border-blue-900 focus:outline-none"
                  id="modal-pin-input"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || pin.length !== 4}
                  className="flex-1 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Verifying...' : 'Unlock Admin'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Current PIN:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={oldPin}
                  onChange={(e) => setOldPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Current PIN (••••)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New 4-digit PIN:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="4 digits"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New PIN:</label>
                <input
                  type="password"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Repeat 4 digits"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || newPin.length !== 4}
                  className="flex-1 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Update PIN'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
