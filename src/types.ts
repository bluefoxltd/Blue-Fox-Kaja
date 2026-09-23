/**
 * Blue Fox - Khaja Khata
 * Types & Interfaces for Multi-Item Daily Food Credit Ledger
 */

export type TransactionType = 'PURCHASE' | 'PURCHASE_RETURN' | 'PAYMENT_OUT';

export type PaymentStatus = 'CREDIT' | 'PAID';

export type MealCategory = 'SNACK_KHAJA' | 'LUNCH' | 'BREAKFAST' | 'DINNER' | 'BEVERAGE' | 'OTHER';

export interface FoodOrderItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface LedgerTransaction {
  id: string;
  transactionNumber: string;
  timestamp: number;
  dateAD: string; // YYYY-MM-DD
  dateBS: string; // YYYY-MM-DD (e.g. 2083-06-06)
  dateBSFormatted: string; // e.g. "२०८३ असोज ०६" or "2083 Ashoj 06"
  type: TransactionType;
  mealCategory?: MealCategory;
  shopName: string;
  couponCode: string;
  items: FoodOrderItem[];
  subtotal: number;
  discount: number;
  netAmount: number;
  paymentStatus: PaymentStatus; // CREDIT (Red) or PAID (Navy Blue)
  paymentMethod?: 'CASH' | 'FONEPAY_QR' | 'ESEWA' | 'KHALTI' | 'BANK_TRANSFER' | 'COUPON_CREDIT';
  referenceNote?: string;
  isImmutable: boolean;
  createdAt: string;
}

export interface CouponProfile {
  couponCode: string;
  holderName: string;
  holderPhone: string;
  shopName: string;
  shopAddress: string;
  shopPhone?: string;
  issueDateBS: string;
  validUntilBS: string;
  creditLimit?: number;
  fixedQrPayload: string;
}

export interface FilterOptions {
  dateRangePreset: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL' | 'CUSTOM';
  fromBS: string;
  toBS: string;
  type: 'ALL' | TransactionType;
  paymentStatus: 'ALL' | PaymentStatus;
  searchQuery: string;
}

export interface LedgerSummary {
  totalSpent: number;     // Green (#16a34a)
  totalCreditDue: number; // Red (#dc2626)
  totalPaid: number;      // Navy Blue (#1e3a8a)
  totalReturns: number;
  netPayableBalance: number;
}

export type SyncStatus = 'connected' | 'syncing' | 'offline';
