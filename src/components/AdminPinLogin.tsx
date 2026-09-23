import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Delete, 
  ArrowRight, 
  Store, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { syncManager } from '../utils/syncManager';

interface AdminPinLoginProps {
  onSuccess: () => void;
  onOpenShopkeeperView: () => void;
}

export const AdminPinLogin: React.FC<AdminPinLoginProps> = ({
  onSuccess,
  onOpenShopkeeperView,
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [shake, setShake] = useState<boolean>(false);

  // Keypad numbers 1-9, 0
  const handleDigitClick = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg('');
      if (newPin.length === 4) {
        verifyPinCode(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const verifyPinCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    setErrorMsg('');

    try {
      const isValid = await syncManager.verifyPin(codeToVerify);
      if (isValid) {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('bluefox_admin_auth', 'true');
        }
        onSuccess();
      } else {
        setShake(true);
        setErrorMsg('Incorrect PIN. Please try again. (गलत पिन कोड)');
        setTimeout(() => setShake(false), 500);
        setTimeout(() => setPin(''), 600);
      }
    } catch (e) {
      setErrorMsg('Verification failed. Please check your PIN.');
    } finally {
      setIsVerifying(false);
    }
  };

  // Listen to physical keyboard events
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < 4) {
          const newPin = pin + e.key;
          setPin(newPin);
          setErrorMsg('');
          if (newPin.length === 4) {
            verifyPinCode(newPin);
          }
        }
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-950 text-white flex flex-col justify-center items-center px-4 py-8">
      {/* Brand & Badge */}
      <div className="w-full max-w-md mx-auto text-center mb-6 animate-in fade-in slide-in-from-top-4 duration-300">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-blue-900/80 border border-blue-700 text-amber-300 mb-3 shadow-xl">
          <Lock className="w-8 h-8" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          Blue Fox - Khaja Khata
        </h1>
        <p className="text-xs sm:text-sm text-blue-200 mt-1 font-medium">
          दैनिक खाजा तथा उधारो खाता • Admin Security Gate
        </p>
      </div>

      {/* Main PIN Pad Card */}
      <div 
        className={`w-full max-w-sm bg-white/95 text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-blue-200 backdrop-blur-md transition-all ${
          shake ? 'animate-shake' : ''
        }`}
      >
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-950 text-xs font-bold border border-blue-200 mb-2">
            <KeyRound className="w-3.5 h-3.5 text-blue-800" />
            <span>Admin PIN Required</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Enter 4-digit security PIN to access the Blue Fox entry dashboard.
          </p>
        </div>

        {/* PIN Indicators (4 Dots) */}
        <div className="flex justify-center items-center gap-4 mb-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <div
                key={index}
                className={`w-5 h-5 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isFilled
                    ? 'bg-blue-950 border-2 border-blue-950 scale-110 shadow-sm'
                    : 'bg-slate-100 border-2 border-slate-300'
                }`}
              >
                {isFilled && <div className="w-2 h-2 rounded-full bg-amber-400" />}
              </div>
            );
          })}
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs text-center font-bold flex items-center justify-center gap-1.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Number Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigitClick(digit)}
              disabled={isVerifying}
              className="h-14 rounded-2xl bg-slate-100 hover:bg-blue-50 active:bg-blue-100 text-blue-950 font-black text-xl shadow-2xs border border-slate-200 transition-all flex items-center justify-center active:scale-95 disabled:opacity-50"
              id={`keypad-digit-${digit}`}
            >
              {digit}
            </button>
          ))}

          {/* Clear Button */}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center active:scale-95 border border-slate-200"
            title="Clear"
          >
            Clear
          </button>

          {/* Zero */}
          <button
            type="button"
            onClick={() => handleDigitClick('0')}
            disabled={isVerifying}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-blue-50 active:bg-blue-100 text-blue-950 font-black text-xl shadow-2xs border border-slate-200 transition-all flex items-center justify-center active:scale-95 disabled:opacity-50"
            id="keypad-digit-0"
          >
            0
          </button>

          {/* Backspace */}
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-700 font-bold text-sm transition-all flex items-center justify-center active:scale-95 border border-slate-200"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Alternative Exit for Shopkeeper (Darjeeling momo) */}
      <div className="mt-6 text-center max-w-sm">
        <div className="bg-white/10 rounded-2xl p-3.5 border border-white/15 backdrop-blur-xs">
          <p className="text-xs text-blue-200 mb-2">
            Are you from <strong>Darjeeling momo</strong> shop?
          </p>
          <button
            type="button"
            onClick={onOpenShopkeeperView}
            className="w-full py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95"
            id="open-shopkeeper-public-btn"
          >
            <Store className="w-4 h-4" />
            <span>Open Shopkeeper Ledger View (No PIN)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-[11px] text-slate-400 mt-4">
          Customer: <strong>Blue Fox</strong> • Shop: <strong>Darjeeling momo</strong>
        </p>
      </div>
    </div>
  );
};
