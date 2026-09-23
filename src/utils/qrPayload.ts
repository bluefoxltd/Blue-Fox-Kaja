import { LedgerTransaction } from '../types';

/**
 * Encodes strings into URL-safe Base64 without unicode corruption
 */
function toUrlSafeBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (e) {
    console.error('Error in toUrlSafeBase64:', e);
    return '';
  }
}

/**
 * Decodes URL-safe Base64 into unicode string
 */
function fromUrlSafeBase64(base64url: string): string {
  try {
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    console.error('Error in fromUrlSafeBase64:', e);
    return '';
  }
}

/**
 * Encodes the ledger transactions into a compact URL-safe payload
 */
export function encodeTransactionsForQr(txs: LedgerTransaction[]): string {
  if (!txs || txs.length === 0) return '';

  try {
    // Keep transactions up to latest 60 to ensure crisp QR code
    const subset = txs.slice(0, 60).map((t) => ({
      id: t.id,
      tn: t.transactionNumber,
      ts: t.timestamp,
      d: t.dateAD,
      db: t.dateBS,
      df: t.dateBSFormatted,
      tp: t.type,
      mc: t.mealCategory,
      s: t.shopName,
      c: t.couponCode,
      i: (t.items || []).map((item) => ({
        id: item.id,
        n: item.name,
        q: item.qty,
        u: item.unitPrice,
        t: item.totalPrice,
      })),
      sub: t.subtotal,
      dsc: t.discount,
      net: t.netAmount,
      ps: t.paymentStatus,
      pm: t.paymentMethod,
    }));

    const json = JSON.stringify(subset);
    return toUrlSafeBase64(json);
  } catch (e) {
    console.error('Failed to encode transactions for QR:', e);
    return '';
  }
}

/**
 * Decodes transactions from the QR link URL parameter (?d=...)
 */
export function decodeTransactionsFromQr(encoded: string): LedgerTransaction[] {
  if (!encoded || !encoded.trim()) return [];

  try {
    const json = fromUrlSafeBase64(encoded.trim());
    if (!json) return [];
    
    const subset = JSON.parse(json);
    if (!Array.isArray(subset)) return [];

    return subset.map((m: any) => ({
      id: m.id,
      transactionNumber: m.tn || m.transactionNumber || m.id,
      timestamp: m.ts || m.timestamp || Date.now(),
      dateAD: m.d || m.dateAD || '',
      dateBS: m.db || m.dateBS || '',
      dateBSFormatted: m.df || m.dateBSFormatted || m.db || '',
      type: m.tp || m.type || 'PURCHASE',
      mealCategory: m.mc || m.mealCategory || 'SNACK_KHAJA',
      shopName: m.s || m.shopName || 'Darjeeling momo',
      couponCode: m.c || m.couponCode || 'BF-FOX-7821',
      items: Array.isArray(m.i)
        ? m.i.map((item: any) => ({
            id: item.id || item.name,
            name: item.n || item.name,
            qty: item.q || item.qty || 1,
            unitPrice: item.u || item.unitPrice || 0,
            totalPrice: item.t || item.totalPrice || 0,
          }))
        : [],
      subtotal: m.sub !== undefined ? m.sub : m.net || 0,
      discount: m.dsc !== undefined ? m.dsc : 0,
      netAmount: m.net !== undefined ? m.net : m.netAmount || 0,
      paymentStatus: m.ps || m.paymentStatus || 'CREDIT',
      paymentMethod: m.pm || m.paymentMethod || 'COUPON_CREDIT',
      isImmutable: true,
      createdAt: m.ca || new Date(m.ts || Date.now()).toISOString(),
    }));
  } catch (e) {
    console.error('Failed to decode transactions from QR:', e);
    return [];
  }
}

/**
 * Builds the full shopkeeper URL embedding both coupon and live ledger data
 */
export function buildShopkeeperQrUrl(couponCode: string, transactions: LedgerTransaction[]): string {
  const origin = typeof window !== 'undefined' && window.location.origin
    ? window.location.origin
    : 'https://bluefox.khata.np';

  const cleanCode = encodeURIComponent((couponCode || 'BF-FOX-7821').trim().toUpperCase());
  const encodedData = encodeTransactionsForQr(transactions);

  if (encodedData) {
    return `${origin}/?view=shopkeeper&coupon=${cleanCode}&d=${encodedData}`;
  }
  return `${origin}/?view=shopkeeper&coupon=${cleanCode}`;
}
