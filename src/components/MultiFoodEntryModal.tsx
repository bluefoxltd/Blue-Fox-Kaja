import React, { useState } from 'react';
import { 
  X, 
  Plus, 
  Trash2, 
  Utensils, 
  Undo2, 
  Wallet, 
  ShieldAlert, 
  Sparkles,
  Check
} from 'lucide-react';
import { 
  TransactionType, 
  PaymentStatus, 
  MealCategory, 
  FoodOrderItem, 
  LedgerTransaction, 
  CouponProfile 
} from '../types';
import { 
  adToBs, 
  formatBsDateString, 
  formatBsDisplay, 
  formatNepaliRupees 
} from '../utils/nepaliDate';
import { POPULAR_SNACK_PRESETS } from '../utils/storage';

interface MultiFoodEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  couponProfile: CouponProfile;
  initialType?: TransactionType;
  onSaveTransaction: (tx: LedgerTransaction) => void;
}

export const MultiFoodEntryModal: React.FC<MultiFoodEntryModalProps> = ({
  isOpen,
  onClose,
  couponProfile,
  initialType = 'PURCHASE',
  onSaveTransaction,
}) => {
  if (!isOpen) return null;

  const todayAd = new Date().toISOString().split('T')[0];
  const [selectedDateAD, setSelectedDateAD] = useState<string>(todayAd);
  const [txType, setTxType] = useState<TransactionType>(initialType);
  const [mealCategory, setMealCategory] = useState<MealCategory>('SNACK_KHAJA');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    initialType === 'PAYMENT_OUT' ? 'PAID' : 'CREDIT'
  );
  const [paymentMethod, setPaymentMethod] = useState<'COUPON_CREDIT' | 'CASH' | 'FONEPAY_QR' | 'ESEWA' | 'KHALTI' | 'BANK_TRANSFER'>(
    initialType === 'PAYMENT_OUT' ? 'FONEPAY_QR' : 'COUPON_CREDIT'
  );
  const [shopName, setShopName] = useState<string>(couponProfile.shopName);
  const [referenceNote, setReferenceNote] = useState<string>('');

  // Multi-Food items array
  const [items, setItems] = useState<FoodOrderItem[]>([
    { id: 'item_1', name: 'Buff Steam Momo', qty: 2, unitPrice: 150, totalPrice: 300, notes: '' },
    { id: 'item_2', name: 'Milk Tea / Dudh Chiya', qty: 2, unitPrice: 30, totalPrice: 60, notes: '' },
  ]);

  // Payment out direct amount
  const [paymentOutAmount, setPaymentOutAmount] = useState<number>(500);

  // Derive Nepali Date
  const bsObj = adToBs(new Date(selectedDateAD));
  const bsDateStr = formatBsDateString(bsObj);
  const bsFormatted = formatBsDisplay(bsObj, false);
  const bsFormattedNp = formatBsDisplay(bsObj, true);

  // Subtotal calculations
  const calculateTotal = () => {
    if (txType === 'PAYMENT_OUT') {
      return paymentOutAmount || 0;
    }
    return items.reduce((acc, curr) => acc + (Number(curr.totalPrice) || 0), 0);
  };

  const netTotal = calculateTotal();

  // Item row operations
  const handleAddItem = (presetName?: string, presetPrice?: number) => {
    const newItem: FoodOrderItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name: presetName || '',
      qty: 1,
      unitPrice: presetPrice || 100,
      totalPrice: presetPrice || 100,
      notes: '',
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleUpdateItem = (id: string, field: keyof FoodOrderItem, value: any) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          const qty = field === 'qty' ? Number(value) : item.qty;
          const price = field === 'unitPrice' ? Number(value) : item.unitPrice;
          updated.totalPrice = Math.max(0, (qty || 0) * (price || 0));
        }
        return updated;
      })
    );
  };

  const handleQuickAddPreset = (preset: { name: string; defaultPrice: number }) => {
    // Check if an empty row exists
    const emptyIndex = items.findIndex((i) => !i.name.trim());
    if (emptyIndex !== -1) {
      const updated = [...items];
      updated[emptyIndex].name = preset.name;
      updated[emptyIndex].unitPrice = preset.defaultPrice;
      updated[emptyIndex].totalPrice = updated[emptyIndex].qty * preset.defaultPrice;
      setItems(updated);
    } else {
      handleAddItem(preset.name, preset.defaultPrice);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (txType !== 'PAYMENT_OUT') {
      const validItems = items.filter((i) => i.name.trim().length > 0 && i.qty > 0);
      if (validItems.length === 0) {
        alert('Please add at least one food item with name and quantity.');
        return;
      }
    } else {
      if (!paymentOutAmount || paymentOutAmount <= 0) {
        alert('Please specify a valid payment amount.');
        return;
      }
    }

    const txNumber = `BF-TX-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTx: LedgerTransaction = {
      id: `tx_${Date.now()}`,
      transactionNumber: txNumber,
      timestamp: new Date(selectedDateAD).getTime() + (new Date().getHours() * 3600000),
      dateAD: selectedDateAD,
      dateBS: bsDateStr,
      dateBSFormatted: bsFormatted,
      type: txType,
      mealCategory: txType === 'PAYMENT_OUT' ? 'OTHER' : mealCategory,
      shopName: shopName.trim() || couponProfile.shopName,
      couponCode: couponProfile.couponCode,
      items: txType === 'PAYMENT_OUT' ? [] : items.filter((i) => i.name.trim().length > 0),
      subtotal: netTotal,
      discount: 0,
      netAmount: netTotal,
      paymentStatus: txType === 'PAYMENT_OUT' ? 'PAID' : paymentStatus,
      paymentMethod: txType === 'PAYMENT_OUT' ? paymentMethod : (paymentStatus === 'CREDIT' ? 'COUPON_CREDIT' : paymentMethod),
      referenceNote: referenceNote.trim() || undefined,
      isImmutable: true, // Immutability requirement
      createdAt: new Date().toISOString(),
    };

    onSaveTransaction(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-2 sm:p-4 overflow-y-auto backdrop-blur-xs">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        id="multi-food-entry-modal"
      >
        {/* Header (Navy Blue theme) */}
        <div className="bg-blue-950 text-white px-5 py-3.5 flex items-center justify-between border-b border-blue-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-800 flex items-center justify-center text-amber-300">
              {txType === 'PURCHASE' && <Utensils className="w-4 h-4" />}
              {txType === 'PURCHASE_RETURN' && <Undo2 className="w-4 h-4 text-orange-300" />}
              {txType === 'PAYMENT_OUT' && <Wallet className="w-4 h-4 text-emerald-300" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
                {txType === 'PURCHASE' && 'New Daily Khaja Entry (खाजा खर्च)'}
                {txType === 'PURCHASE_RETURN' && 'Food Purchase Return (खाजा फिर्ता)'}
                {txType === 'PAYMENT_OUT' && 'Payment Out to Shop (रकम भुक्तानी)'}
              </h2>
              <p className="text-[11px] text-blue-200 font-mono">
                Coupon: {couponProfile.couponCode} • {couponProfile.holderName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-blue-900 transition-colors"
            id="modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Type Tabs */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex gap-1.5 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTxType('PURCHASE');
              setPaymentStatus('CREDIT');
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              txType === 'PURCHASE'
                ? 'bg-blue-950 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
            id="tab-mode-purchase"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>1. Food Purchase (खाजा)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTxType('PURCHASE_RETURN');
              setPaymentStatus('CREDIT');
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              txType === 'PURCHASE_RETURN'
                ? 'bg-orange-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
            id="tab-mode-return"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>2. Food Return (फिर्ता)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTxType('PAYMENT_OUT');
              setPaymentStatus('PAID');
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              txType === 'PAYMENT_OUT'
                ? 'bg-emerald-700 text-white shadow-sm font-bold'
                : 'text-slate-600 hover:bg-slate-200'
            }`}
            id="tab-mode-payment-out"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>3. Payment Out (भुक्तानी)</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* Row 1: Date (AD + BS sync) & Shop Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Date (मिति)
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={selectedDateAD}
                  onChange={(e) => setSelectedDateAD(e.target.value)}
                  className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800"
                  required
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 font-medium">
                <span>नेपाली मिति: {bsFormattedNp}</span>
                <span className="font-mono text-slate-600">({bsDateStr} BS)</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Shop / Canteen (पसलको नाम)
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder="e.g. Shree Krishna Khaja Ghar"
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800"
                required
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Where coupon was presented</p>
            </div>
          </div>

          {/* Row 2: Status & Payment Method for Purchases / Returns */}
          {txType !== 'PAYMENT_OUT' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Status (खर्च स्थिति)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatus('CREDIT');
                      setPaymentMethod('COUPON_CREDIT');
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      paymentStatus === 'CREDIT'
                        ? 'bg-red-600 text-white border-red-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-red-50'
                    }`}
                    id="btn-status-credit"
                  >
                    <span className="w-2 h-2 rounded-full bg-current" />
                    <span>Credit / Unpaid (उधारो)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setPaymentStatus('PAID');
                      setPaymentMethod('CASH');
                    }}
                    className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                      paymentStatus === 'PAID'
                        ? 'bg-blue-950 text-white border-blue-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50'
                    }`}
                    id="btn-status-paid"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Paid / चुक्ता (Navy Blue)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Meal Category & Method
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={mealCategory}
                    onChange={(e) => setMealCategory(e.target.value as MealCategory)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="SNACK_KHAJA">खाजा (Snack)</option>
                    <option value="LUNCH">दिउँसो खाना (Lunch)</option>
                    <option value="BREAKFAST">बिहान खाजा (Breakfast)</option>
                    <option value="DINNER">साँझ खाना (Dinner)</option>
                    <option value="BEVERAGE">चिया/पानी (Beverage)</option>
                    <option value="OTHER">अन्य (Other)</option>
                  </select>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="COUPON_CREDIT">Coupon Credit (कुपन)</option>
                    <option value="CASH">Cash (नगद)</option>
                    <option value="FONEPAY_QR">Fonepay / QR</option>
                    <option value="ESEWA">eSewa</option>
                    <option value="KHALTI">Khalti</option>
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* PAYMENT OUT FIELDS */
            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900">
                  Payment Out to Shopkeeper (उधारो रकम चुक्ता / तिरेको)
                </span>
                <span className="text-[11px] bg-emerald-200 text-emerald-900 font-semibold px-2 py-0.5 rounded">
                  Decreases Credit Due
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Settlement Amount (रू. Amount Paid)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={paymentOutAmount}
                    onChange={(e) => setPaymentOutAmount(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-sm font-bold rounded-lg border border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-600"
                    placeholder="e.g. 500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Paid Via (भुक्तानी माध्यम)
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-300 bg-white"
                  >
                    <option value="FONEPAY_QR">Fonepay / Bank QR</option>
                    <option value="CASH">Cash (नगद)</option>
                    <option value="ESEWA">eSewa Wallet</option>
                    <option value="KHALTI">Khalti</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* MULTI-FOOD ITEMS BASKET (FOR PURCHASES AND RETURNS) */}
          {txType !== 'PAYMENT_OUT' && (
            <div>
              {/* Preset quick buttons */}
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quick Add Popular Canteen Food (एक-क्लिक खाजा):</span>
                  </span>
                  <span className="text-[11px] text-slate-400">Click to add row</span>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200">
                  {POPULAR_SNACK_PRESETS.slice(0, 10).map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleQuickAddPreset(p)}
                      className="px-2 py-0.5 rounded-full text-[11px] bg-white hover:bg-blue-100 hover:text-blue-900 border border-slate-300 text-slate-700 transition-colors flex items-center gap-1"
                    >
                      <span>{p.name}</span>
                      <span className="text-slate-400">Rs.{p.defaultPrice}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Multiple Item List Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="bg-slate-100 px-3 py-2 text-xs font-bold text-slate-700 grid grid-cols-12 gap-2 border-b border-slate-200">
                  <div className="col-span-5 sm:col-span-5">Food Item Name (खाजाको नाम)</div>
                  <div className="col-span-2 sm:col-span-2 text-center">Qty</div>
                  <div className="col-span-2 sm:col-span-2 text-right">Price (Rs.)</div>
                  <div className="col-span-2 sm:col-span-2 text-right">Total (Rs.)</div>
                  <div className="col-span-1 sm:col-span-1 text-center">Del</div>
                </div>

                <div className="divide-y divide-slate-100 bg-white max-h-56 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={item.id} className="p-2 sm:px-3 text-xs grid grid-cols-12 gap-2 items-center hover:bg-slate-50">
                      {/* Name */}
                      <div className="col-span-5 sm:col-span-5">
                        <input
                          type="text"
                          placeholder="e.g. Buff Momo / Chiya"
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-slate-300 focus:ring-1 focus:ring-blue-800"
                          required
                        />
                      </div>

                      {/* Qty */}
                      <div className="col-span-2 sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.qty}
                          onChange={(e) => handleUpdateItem(item.id, 'qty', e.target.value)}
                          className="w-full px-1.5 py-1 text-xs text-center rounded border border-slate-300 font-semibold"
                          required
                        />
                      </div>

                      {/* Unit Price */}
                      <div className="col-span-2 sm:col-span-2">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={item.unitPrice}
                          onChange={(e) => handleUpdateItem(item.id, 'unitPrice', e.target.value)}
                          className="w-full px-1.5 py-1 text-xs text-right rounded border border-slate-300 font-semibold"
                          required
                        />
                      </div>

                      {/* Item Total */}
                      <div className="col-span-2 sm:col-span-2 text-right font-bold text-slate-800">
                        Rs. {item.totalPrice}
                      </div>

                      {/* Delete */}
                      <div className="col-span-1 sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={items.length <= 1}
                          className="text-slate-400 hover:text-red-600 disabled:opacity-30 p-1"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Row Button & Total Bar */}
                <div className="bg-slate-50 p-2.5 px-3 flex items-center justify-between border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleAddItem()}
                    className="px-2.5 py-1 rounded text-xs font-semibold bg-white hover:bg-slate-100 text-blue-900 border border-slate-300 flex items-center gap-1 shadow-2xs"
                    id="btn-add-food-row"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Another Food Item</span>
                  </button>

                  <div className="text-right">
                    <span className="text-xs text-slate-500 mr-2 font-medium">Order Subtotal:</span>
                    <span className="text-sm font-black text-slate-900">
                      {formatNepaliRupees(netTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reference Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Remarks / Bill Reference (कैफियत)
            </label>
            <input
              type="text"
              value={referenceNote}
              onChange={(e) => setReferenceNote(e.target.value)}
              placeholder="e.g. 5 PM Office evening snack with coupon, or receipt #442"
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-800"
            />
          </div>

          {/* Immutability Audit Policy Notice */}
          <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-start gap-2 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-snug text-[11px]">
              <strong>Audit Guarantee:</strong> As specified, entered khata transactions are permanent and cannot be arbitrarily modified or erased, ensuring verifiable trust with the canteen owner. For any corrections, record a <em>Food Purchase Return</em> or <em>Payment Out</em>.
            </p>
          </div>

          {/* Bottom Total & Save Bar */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                Net Transaction Amount
              </p>
              <p className={`text-xl font-black ${
                paymentStatus === 'CREDIT' ? 'text-red-600' : 'text-blue-950'
              }`}>
                {formatNepaliRupees(netTotal)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 border border-slate-300"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-950 hover:bg-blue-900 active:bg-blue-800 shadow-md flex items-center gap-1.5 transition-all"
                id="btn-save-entry"
              >
                <Check className="w-4 h-4" />
                <span>Save to Permanent Khata</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};
