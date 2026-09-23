/**
 * Storage and Data Persistence for Blue Fox - Khaja Khata
 */
import { LedgerTransaction, CouponProfile, LedgerSummary, FoodOrderItem } from '../types';
import { adToBs, formatBsDateString, formatBsDisplay } from './nepaliDate';

const STORAGE_KEY_LEDGER = 'bluefox_khaja_khata_ledger_v2';
const STORAGE_KEY_COUPON = 'bluefox_khaja_khata_coupon_v4';
const STORAGE_KEY_ADMIN_PIN = 'bluefox_admin_pin_code_v1';
const DB_CLEARED_VERSION_KEY = 'bluefox_db_cleared_confirmed_v2';

export const DEFAULT_ADMIN_PIN = '1234';

export function getLiveShopkeeperQrUrl(couponCode: string = 'BF-FOX-7821'): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin}/?view=shopkeeper&coupon=${encodeURIComponent(couponCode)}`;
  }
  return `/?view=shopkeeper&coupon=${encodeURIComponent(couponCode)}`;
}

export const DEFAULT_COUPON: CouponProfile = {
  couponCode: 'BF-FOX-7821',
  holderName: 'Blue Fox',
  holderPhone: '+977 9802755605',
  shopName: 'Darjeeling momo',
  shopAddress: 'Itahari-6, Sky Plaza',
  shopPhone: '9802755605',
  issueDateBS: '2083-01-01',
  validUntilBS: '2083-12-30',
  creditLimit: 25000,
  fixedQrPayload: getLiveShopkeeperQrUrl('BF-FOX-7821'),
};

export function getStoredAdminPin(): string {
  try {
    if (typeof window !== 'undefined') {
      const pin = localStorage.getItem(STORAGE_KEY_ADMIN_PIN);
      if (pin && pin.trim().length === 4) return pin.trim();
    }
  } catch (e) {
    // fallback
  }
  return DEFAULT_ADMIN_PIN;
}

export function saveStoredAdminPin(newPin: string): boolean {
  try {
    if (typeof window !== 'undefined' && newPin.trim().length === 4) {
      localStorage.setItem(STORAGE_KEY_ADMIN_PIN, newPin.trim());
      return true;
    }
  } catch (e) {
    console.error('Failed to save admin PIN:', e);
  }
  return false;
}

export function checkAdminPin(enteredPin: string): boolean {
  const currentPin = getStoredAdminPin();
  return enteredPin.trim() === currentPin;
}

// Clean, empty database initialization (zero dummy/seed transactions)
export function generateSeedTransactions(): LedgerTransaction[] {
  return [];
}

export function loadTransactions(): LedgerTransaction[] {
  try {
    // Clean up any legacy v1 seed data
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('bluefox_khaja_khata_ledger_v1')) {
        localStorage.removeItem('bluefox_khaja_khata_ledger_v1');
      }

      // Check if user has initialized clean database
      const clearedMarker = localStorage.getItem(DB_CLEARED_VERSION_KEY);
      if (!clearedMarker) {
        // Initializing clean database as requested by user
        localStorage.setItem(DB_CLEARED_VERSION_KEY, 'true');
        localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify([]));
        return [];
      }
    }

    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_LEDGER) : null;
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to load ledger from localStorage:', err);
    return [];
  }
}

export function saveTransactions(txs: LedgerTransaction[]): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(txs));
    }
  } catch (err) {
    console.error('Failed to save ledger to localStorage:', err);
  }
}

/**
 * Clear All Database Transactions
 */
export function clearAllTransactions(): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify([]));
      localStorage.removeItem('bluefox_khaja_khata_ledger_v1');
      localStorage.setItem(DB_CLEARED_VERSION_KEY, 'true');
    }
  } catch (err) {
    console.error('Failed to clear database in localStorage:', err);
  }
}

/**
 * Reset / Seed with Demo Sample Data (Optional, if requested by user)
 */
export function resetToSampleData(): LedgerTransaction[] {
  const seeds = generateSeedTransactions();
  saveTransactions(seeds);
  return seeds;
}

export function loadCouponProfile(): CouponProfile {
  try {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const raw = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY_COUPON) : null;
    
    if (!raw) {
      // Check if previous version had customized customer name
      let previousHolder = DEFAULT_COUPON.holderName;
      let previousPhone = DEFAULT_COUPON.holderPhone;
      try {
        const oldV1 = localStorage.getItem('bluefox_khaja_khata_coupon_v1');
        if (oldV1) {
          const parsed = JSON.parse(oldV1);
          if (parsed.holderName) previousHolder = parsed.holderName;
          if (parsed.holderPhone) previousPhone = parsed.holderPhone;
        }
      } catch (e) {
        // ignore
      }

      const defaultWithOrigin: CouponProfile = {
        ...DEFAULT_COUPON,
        holderName: previousHolder,
        holderPhone: previousPhone,
        shopName: 'Darjeeling momo',
        shopAddress: 'Itahari-6, Sky Plaza',
        shopPhone: '9802755605',
        fixedQrPayload: `${origin}/?view=shopkeeper&coupon=${DEFAULT_COUPON.couponCode}`,
      };
      saveCouponProfile(defaultWithOrigin);
      return defaultWithOrigin;
    }

    const parsed: CouponProfile = JSON.parse(raw);
    parsed.shopName = 'Darjeeling momo';
    parsed.shopAddress = 'Itahari-6, Sky Plaza';
    parsed.shopPhone = '9802755605';
    parsed.fixedQrPayload = `${origin}/?view=shopkeeper&coupon=${encodeURIComponent(parsed.couponCode || DEFAULT_COUPON.couponCode)}`;
    if (!parsed.holderName || parsed.holderName === 'Bipin Chhetri') {
      parsed.holderName = 'Blue Fox';
      parsed.holderPhone = '+977 9802755605';
    }
    saveCouponProfile(parsed);
    return parsed;
  } catch (err) {
    return DEFAULT_COUPON;
  }
}

export function saveCouponProfile(profile: CouponProfile): void {
  try {
    localStorage.setItem(STORAGE_KEY_COUPON, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to save coupon profile:', err);
  }
}

/**
 * Calculate Summary Metrics adhering to color guidelines:
 * - Total Spent (Green)
 * - Total Credit / Due to Shop (Red)
 * - Total Paid to Shop (Navy Blue)
 */
export function calculateLedgerSummary(transactions: LedgerTransaction[]): LedgerSummary {
  let totalSpent = 0; // All food purchases
  let totalReturns = 0;
  let creditPurchases = 0;
  let directPaidPurchases = 0;
  let paymentOutTotal = 0;

  for (const tx of transactions) {
    if (tx.type === 'PURCHASE') {
      totalSpent += tx.netAmount;
      if (tx.paymentStatus === 'CREDIT') {
        creditPurchases += tx.netAmount;
      } else {
        directPaidPurchases += tx.netAmount;
      }
    } else if (tx.type === 'PURCHASE_RETURN') {
      totalReturns += tx.netAmount;
      // Return offsets credit if was on credit or is general credit return
      creditPurchases = Math.max(0, creditPurchases - tx.netAmount);
    } else if (tx.type === 'PAYMENT_OUT') {
      paymentOutTotal += tx.netAmount;
    }
  }

  // Net payable balance to shop = (Total Credit purchases - returns - payments out)
  const totalCreditDue = Math.max(0, creditPurchases - paymentOutTotal);
  const totalPaid = directPaidPurchases + paymentOutTotal;

  return {
    totalSpent,
    totalCreditDue,
    totalPaid,
    totalReturns,
    netPayableBalance: totalCreditDue,
  };
}

/**
 * Export ledger to CSV format and trigger direct file download
 */
export function exportLedgerToCsv(transactions: LedgerTransaction[], couponCode: string): void {
  const headers = [
    'Tx Number',
    'Date (BS)',
    'Date (AD)',
    'Type',
    'Category',
    'Food Items Breakdown',
    'Total Amount (NPR)',
    'Status',
    'Payment Method',
    'Shop Name',
    'Notes',
  ];

  const rows = transactions.map((t) => {
    const itemsStr = t.items && t.items.length > 0
      ? t.items.map((i) => `${i.name} [Qty: ${i.qty} @ Rs.${i.unitPrice} = Rs.${i.totalPrice}]`).join('; ')
      : t.type === 'PAYMENT_OUT' ? 'Payment Settlement to Shop' : 'N/A';

    return [
      t.transactionNumber,
      `"${t.dateBSFormatted || t.dateBS}"`,
      t.dateAD,
      t.type,
      t.mealCategory || 'N/A',
      `"${itemsStr.replace(/"/g, '""')}"`,
      t.netAmount,
      t.paymentStatus,
      t.paymentMethod || 'N/A',
      `"${t.shopName.replace(/"/g, '""')}"`,
      `"${(t.referenceNote || '').replace(/"/g, '""')}"`,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BlueFox_KhajaKhata_${couponCode}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export JSON backup
 */
export function exportLedgerToJson(transactions: LedgerTransaction[], profile: CouponProfile): void {
  const data = {
    app: 'Blue Fox - Khaja Khata',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    couponProfile: profile,
    transactions,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `BlueFox_Backup_${profile.couponCode}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Quick snack menu presets for one-click entry in Nepali canteens
 */
export const POPULAR_SNACK_PRESETS: { name: string; defaultPrice: number; category: string }[] = [
  { name: 'Buff Steam Momo', defaultPrice: 150, category: 'Momo' },
  { name: 'Chicken Steam Momo', defaultPrice: 180, category: 'Momo' },
  { name: 'Veg Steam Momo', defaultPrice: 130, category: 'Momo' },
  { name: 'Buff Fried Momo', defaultPrice: 170, category: 'Momo' },
  { name: 'Buff C-Momo (Chilly)', defaultPrice: 180, category: 'Momo' },
  { name: 'Chicken Chowmein', defaultPrice: 160, category: 'Noodles' },
  { name: 'Buff Chowmein', defaultPrice: 150, category: 'Noodles' },
  { name: 'Veg Chowmein', defaultPrice: 120, category: 'Noodles' },
  { name: 'Khaja Set (Chura, Tarkari, Achar)', defaultPrice: 140, category: 'Traditional' },
  { name: 'Samosa Tarkari (Single/Plate)', defaultPrice: 35, category: 'Snack' },
  { name: 'Aloo Chop (2 Pcs)', defaultPrice: 40, category: 'Snack' },
  { name: 'Aloo Paratha & Curd', defaultPrice: 110, category: 'Breakfast' },
  { name: 'Milk Tea / Dudh Chiya', defaultPrice: 25, category: 'Tea/Beverage' },
  { name: 'Black Tea / Kalo Chiya', defaultPrice: 15, category: 'Tea/Beverage' },
  { name: 'Hot Lemon with Honey', defaultPrice: 60, category: 'Tea/Beverage' },
  { name: 'Cold Drink 250ml', defaultPrice: 60, category: 'Beverage' },
  { name: 'Mineral Water (1 Ltr)', defaultPrice: 25, category: 'Beverage' },
  { name: 'Boiled Egg (2 Pcs)', defaultPrice: 50, category: 'Protein' },
  { name: 'Omelette (Double Egg)', defaultPrice: 70, category: 'Protein' },
  { name: 'Chicken Sekuwa (100g)', defaultPrice: 180, category: 'Grill' },
];
