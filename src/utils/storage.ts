/**
 * Storage and Data Persistence for Blue Fox - Khaja Khata
 */
import { LedgerTransaction, CouponProfile, LedgerSummary, FoodOrderItem } from '../types';
import { adToBs, formatBsDateString, formatBsDisplay } from './nepaliDate';

const STORAGE_KEY_LEDGER = 'bluefox_khaja_khata_ledger_v2';
const STORAGE_KEY_COUPON = 'bluefox_khaja_khata_coupon_v3';
const DB_CLEARED_VERSION_KEY = 'bluefox_db_cleared_confirmed_v2';

export const DEFAULT_COUPON: CouponProfile = {
  couponCode: 'BF-FOX-7821',
  holderName: 'Bipin Chhetri',
  holderPhone: '+977 9801234567',
  shopName: 'Darjeeling momo',
  shopAddress: 'Itahari-6, Sky Plaza',
  shopPhone: '9802755605',
  issueDateBS: '2083-01-01',
  validUntilBS: '2083-12-30',
  creditLimit: 15000,
  fixedQrPayload: 'https://ais-pre-ptlaj6yq7utfzpaev2jmqd-670520544893.asia-southeast1.run.app/?view=shopkeeper&coupon=BF-FOX-7821',
};

// Seed realistic transactions showing multi-item food purchases, return, and payment out
export function generateSeedTransactions(): LedgerTransaction[] {
  const today = new Date();
  
  const d0 = new Date(today);
  const d1 = new Date(today);
  d1.setDate(today.getDate() - 1);
  const d2 = new Date(today);
  d2.setDate(today.getDate() - 2);
  const d3 = new Date(today);
  d3.setDate(today.getDate() - 4);
  const d4 = new Date(today);
  d4.setDate(today.getDate() - 6);

  const makeBs = (date: Date) => {
    const bs = adToBs(date);
    return {
      bsStr: formatBsDateString(bs),
      bsFormatted: formatBsDisplay(bs, false),
    };
  };

  const bs0 = makeBs(d0);
  const bs1 = makeBs(d1);
  const bs2 = makeBs(d2);
  const bs3 = makeBs(d3);
  const bs4 = makeBs(d4);

  return [
    {
      id: 'tx_001',
      transactionNumber: 'BF-TX-1001',
      timestamp: d4.getTime(),
      dateAD: d4.toISOString().split('T')[0],
      dateBS: bs4.bsStr,
      dateBSFormatted: bs4.bsFormatted,
      type: 'PURCHASE',
      mealCategory: 'SNACK_KHAJA',
      shopName: 'Shree Krishna Khaja Ghar & Canteen',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'itm_1', name: 'Buff Steam Momo (2 Plate)', qty: 2, unitPrice: 150, totalPrice: 300, notes: 'Spicy achar' },
        { id: 'itm_2', name: 'Milk Tea / Dudh Chiya', qty: 3, unitPrice: 30, totalPrice: 90 },
        { id: 'itm_3', name: 'Samosa Tarkari', qty: 2, unitPrice: 35, totalPrice: 70 },
      ],
      subtotal: 460,
      discount: 0,
      netAmount: 460,
      paymentStatus: 'CREDIT', // Red (Credit)
      paymentMethod: 'COUPON_CREDIT',
      referenceNote: 'Office evening snacks with coupon verify',
      isImmutable: true,
      createdAt: d4.toISOString(),
    },
    {
      id: 'tx_002',
      transactionNumber: 'BF-TX-1002',
      timestamp: d3.getTime(),
      dateAD: d3.toISOString().split('T')[0],
      dateBS: bs3.bsStr,
      dateBSFormatted: bs3.bsFormatted,
      type: 'PURCHASE',
      mealCategory: 'LUNCH',
      shopName: 'Shree Krishna Khaja Ghar & Canteen',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'itm_4', name: 'Chicken Chowmein (Special)', qty: 2, unitPrice: 180, totalPrice: 360 },
        { id: 'itm_5', name: 'Mountain Dew (Can)', qty: 2, unitPrice: 70, totalPrice: 140 },
        { id: 'itm_6', name: 'Alu Dum Puri Set', qty: 1, unitPrice: 100, totalPrice: 100 },
      ],
      subtotal: 600,
      discount: 0,
      netAmount: 600,
      paymentStatus: 'CREDIT', // Red (Credit)
      paymentMethod: 'COUPON_CREDIT',
      referenceNote: 'Afternoon lunch with team',
      isImmutable: true,
      createdAt: d3.toISOString(),
    },
    {
      id: 'tx_003',
      transactionNumber: 'BF-TX-1003',
      timestamp: d2.getTime(),
      dateAD: d2.toISOString().split('T')[0],
      dateBS: bs2.bsStr,
      dateBSFormatted: bs2.bsFormatted,
      type: 'PURCHASE_RETURN', // Food Purchase Return
      mealCategory: 'OTHER',
      shopName: 'Shree Krishna Khaja Ghar & Canteen',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'itm_7', name: 'Mountain Dew (Can - Returned unchilled)', qty: 2, unitPrice: 70, totalPrice: 140, notes: 'Returned to shopkeeper dai' },
      ],
      subtotal: 140,
      discount: 0,
      netAmount: 140,
      paymentStatus: 'CREDIT', // Reverses credit
      paymentMethod: 'COUPON_CREDIT',
      referenceNote: 'Returned warm cans; shopkeeper adjusted on credit balance',
      isImmutable: true,
      createdAt: d2.toISOString(),
    },
    {
      id: 'tx_004',
      transactionNumber: 'BF-TX-1004',
      timestamp: d1.getTime(),
      dateAD: d1.toISOString().split('T')[0],
      dateBS: bs1.bsStr,
      dateBSFormatted: bs1.bsFormatted,
      type: 'PURCHASE',
      mealCategory: 'BREAKFAST',
      shopName: 'Shree Krishna Khaja Ghar & Canteen',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'itm_8', name: 'Aloo Paratha with Curd', qty: 2, unitPrice: 110, totalPrice: 220 },
        { id: 'itm_9', name: 'Black Tea / Kalo Chiya', qty: 2, unitPrice: 20, totalPrice: 40 },
      ],
      subtotal: 260,
      discount: 0,
      netAmount: 260,
      paymentStatus: 'PAID', // Navy Blue (Paid on spot)
      paymentMethod: 'CASH',
      referenceNote: 'Paid direct cash at counter',
      isImmutable: true,
      createdAt: d1.toISOString(),
    },
    {
      id: 'tx_005',
      transactionNumber: 'BF-TX-1005',
      timestamp: d0.getTime() - 1000 * 60 * 60 * 3,
      dateAD: d0.toISOString().split('T')[0],
      dateBS: bs0.bsStr,
      dateBSFormatted: bs0.bsFormatted,
      type: 'PAYMENT_OUT', // Payment Out: user settles outstanding credit
      mealCategory: 'OTHER',
      shopName: 'Shree Krishna Khaja Ghar & Canteen',
      couponCode: 'BF-FOX-7821',
      items: [],
      subtotal: 500,
      discount: 0,
      netAmount: 500,
      paymentStatus: 'PAID', // Navy Blue settled payment
      paymentMethod: 'FONEPAY_QR',
      referenceNote: 'Partial credit payment sent via Fonepay to Shopkeeper QR',
      isImmutable: true,
      createdAt: d0.toISOString(),
    },
    {
      id: 'tx_006',
      transactionNumber: 'BF-TX-1006',
      timestamp: d0.getTime(),
      dateAD: d0.toISOString().split('T')[0],
      dateBS: bs0.bsStr,
      dateBSFormatted: bs0.bsFormatted,
      type: 'PURCHASE',
      mealCategory: 'SNACK_KHAJA',
      shopName: 'Shree Krishna Khaja Ghar & Canteen',
      couponCode: 'BF-FOX-7821',
      items: [
        { id: 'itm_10', name: 'Buff C-Momo (Hot Chilly)', qty: 1, unitPrice: 170, totalPrice: 170 },
        { id: 'itm_11', name: 'Cold Drink 250ml', qty: 1, unitPrice: 60, totalPrice: 60 },
      ],
      subtotal: 230,
      discount: 0,
      netAmount: 230,
      paymentStatus: 'CREDIT', // Red (Credit)
      paymentMethod: 'COUPON_CREDIT',
      referenceNote: 'Today 5 PM snack using coupon',
      isImmutable: true,
      createdAt: d0.toISOString(),
    }
  ];
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
    // If shopName is still the old placeholder, update to Darjeeling momo
    if (parsed.shopName === 'Shree Krishna Khaja Ghar & Canteen' || !parsed.shopPhone) {
      parsed.shopName = 'Darjeeling momo';
      parsed.shopAddress = 'Itahari-6, Sky Plaza';
      parsed.shopPhone = '9802755605';
      saveCouponProfile(parsed);
    }
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
