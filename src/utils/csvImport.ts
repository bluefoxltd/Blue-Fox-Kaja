import { LedgerTransaction, FoodOrderItem, TransactionType, PaymentStatus } from '../types';
import { getCurrentBsDate, formatBsDateString, bsToAdString, formatBsDisplay } from './nepaliDate';

/**
 * Split CSV line respecting double quotes and escaped quotes
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

/**
 * Parse line items string back to structured FoodOrderItem array
 * Handles: "Ice [Qty: 5 @ Rs.20 = Rs.100]; Chiya [Qty: 2 @ Rs.20 = Rs.40]"
 * or "Ice (5), Chiya (2)"
 * or "Ice, Chiya"
 */
function parseItemsString(rawStr: string, totalAmount: number): FoodOrderItem[] {
  if (!rawStr || rawStr.trim() === '' || rawStr.toLowerCase() === 'n/a') {
    return [
      {
        id: `item_${Date.now()}_1`,
        name: 'Snack Item',
        qty: 1,
        unitPrice: totalAmount,
        totalPrice: totalAmount,
      },
    ];
  }

  const items: FoodOrderItem[] = [];
  const parts = rawStr.split(/;|(?<=\]),|(?<=\))\s*,/);

  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx].trim();
    if (!part) continue;

    // Pattern 1: Name [Qty: 5 @ Rs.20 = Rs.100]
    const match1 = part.match(/^([^\[]+)\[Qty:\s*(\d+(?:\.\d+)?)\s*@\s*Rs\.?\s*(\d+(?:\.\d+)?)\s*=\s*Rs\.?\s*(\d+(?:\.\d+)?)\]/i);
    if (match1) {
      const name = match1[1].trim();
      const qty = parseFloat(match1[2]) || 1;
      const unitPrice = parseFloat(match1[3]) || 0;
      const itemTotal = parseFloat(match1[4]) || qty * unitPrice;
      items.push({
        id: `item_imp_${Date.now()}_${idx}`,
        name: name || 'Snack Item',
        qty,
        unitPrice,
        totalPrice: itemTotal,
      });
      continue;
    }

    // Pattern 2: Name (Qty x Rate) or Name x Qty
    const match2 = part.match(/^([^(x]+)(?:(?:\((?:x|qty:?\s*)?(\d+)(?:\s*@\s*Rs\.?\s*(\d+))?\))|(?:\s*x\s*(\d+)))/i);
    if (match2) {
      const name = match2[1].trim();
      const qty = parseFloat(match2[2] || match2[4]) || 1;
      const unitPrice = parseFloat(match2[3]) || (totalAmount / qty);
      items.push({
        id: `item_imp_${Date.now()}_${idx}`,
        name: name || 'Snack Item',
        qty,
        unitPrice,
        totalPrice: qty * unitPrice,
      });
      continue;
    }

    // Pattern 3: Simple item name
    const cleanName = part.replace(/^"|"$/g, '').trim();
    if (cleanName && cleanName.toLowerCase() !== 'n/a') {
      items.push({
        id: `item_imp_${Date.now()}_${idx}`,
        name: cleanName,
        qty: 1,
        unitPrice: 0,
        totalPrice: 0,
      });
    }
  }

  // If items had 0 prices, distribute totalAmount among them
  if (items.length > 0 && items.every((i) => i.totalPrice === 0) && totalAmount > 0) {
    const share = Math.round(totalAmount / items.length);
    items.forEach((item, i) => {
      if (i === items.length - 1) {
        item.totalPrice = totalAmount - share * (items.length - 1);
        item.unitPrice = item.totalPrice / (item.qty || 1);
      } else {
        item.totalPrice = share;
        item.unitPrice = share / (item.qty || 1);
      }
    });
  }

  if (items.length === 0) {
    items.push({
      id: `item_imp_${Date.now()}_1`,
      name: rawStr.substring(0, 50) || 'Snack Item',
      qty: 1,
      unitPrice: totalAmount,
      totalPrice: totalAmount,
    });
  }

  return items;
}

export interface CsvImportResult {
  success: boolean;
  transactions: LedgerTransaction[];
  count: number;
  totalAmount: number;
  error?: string;
}

/**
 * Parse an entire CSV file string into valid LedgerTransaction records
 */
export function parseCsvToTransactions(csvContent: string): CsvImportResult {
  try {
    if (!csvContent || typeof csvContent !== 'string') {
      return { success: false, transactions: [], count: 0, totalAmount: 0, error: 'Empty file' };
    }

    // Split lines handling both \r\n and \n
    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      return {
        success: false,
        transactions: [],
        count: 0,
        totalAmount: 0,
        error: 'CSV file must contain a header row and at least one data row.',
      };
    }

    // Parse header row
    const headerCols = parseCsvLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Locate column indices flexibly
    const txNumIdx = headerCols.findIndex((h) => h.includes('tx') || h.includes('number') || h.includes('id'));
    const dateBsIdx = headerCols.findIndex((h) => h.includes('datebs') || h.includes('bs') || (h.includes('date') && !h.includes('ad')));
    const dateAdIdx = headerCols.findIndex((h) => h.includes('datead') || h.includes('ad'));
    const typeIdx = headerCols.findIndex((h) => h.includes('type'));
    const categoryIdx = headerCols.findIndex((h) => h.includes('cat') || h.includes('meal'));
    const itemsIdx = headerCols.findIndex((h) => h.includes('item') || h.includes('food') || h.includes('desc') || h.includes('detail'));
    const amountIdx = headerCols.findIndex((h) => h.includes('amount') || h.includes('total') || h.includes('price') || h.includes('net'));
    const statusIdx = headerCols.findIndex((h) => h.includes('status') || h.includes('paid') || h.includes('credit'));
    const methodIdx = headerCols.findIndex((h) => h.includes('method'));
    const shopIdx = headerCols.findIndex((h) => h.includes('shop') || h.includes('vendor') || h.includes('hotel'));
    const notesIdx = headerCols.findIndex((h) => h.includes('note') || h.includes('remark'));

    const todayBs = getCurrentBsDate();
    const todayBsStr = formatBsDateString(todayBs);
    const todayAdStr = bsToAdString(todayBs);

    const importedTransactions: LedgerTransaction[] = [];
    let runningTotal = 0;

    for (let r = 1; r < lines.length; r++) {
      const line = lines[r];
      if (!line) continue;

      const cols = parseCsvLine(line);
      if (cols.length === 0 || cols.every((c) => !c)) continue;

      // Extract amount
      let rawAmount = 0;
      if (amountIdx !== -1 && cols[amountIdx]) {
        rawAmount = parseFloat(cols[amountIdx].replace(/[^0-9.-]/g, '')) || 0;
      } else {
        // Fallback: search for first numeric cell
        for (const col of cols) {
          const num = parseFloat(col.replace(/[^0-9.-]/g, ''));
          if (!isNaN(num) && num > 0) {
            rawAmount = num;
            break;
          }
        }
      }

      // Extract Tx Number
      let txNum = txNumIdx !== -1 && cols[txNumIdx] ? cols[txNumIdx].replace(/"/g, '').trim() : '';
      if (!txNum || !txNum.startsWith('BF-TX-')) {
        const randomHex = Math.floor(1000 + Math.random() * 9000);
        txNum = `BF-TX-${randomHex}`;
      }

      // Extract Dates
      let dateBs = dateBsIdx !== -1 && cols[dateBsIdx] ? cols[dateBsIdx].replace(/"/g, '').trim() : '';
      // Clean up BS date format
      const bsMatch = dateBs.match(/(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
      if (bsMatch) {
        dateBs = `${bsMatch[1]}-${bsMatch[2].padStart(2, '0')}-${bsMatch[3].padStart(2, '0')}`;
      } else if (!dateBs.includes('208')) {
        dateBs = todayBsStr;
      }

      let dateAd = dateAdIdx !== -1 && cols[dateAdIdx] ? cols[dateAdIdx].replace(/"/g, '').trim() : '';
      if (!dateAd || !dateAd.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateAd = bsToAdString(dateBs);
      }

      // Extract Type
      let type: TransactionType = 'PURCHASE';
      if (typeIdx !== -1 && cols[typeIdx]) {
        const tStr = cols[typeIdx].toUpperCase();
        if (tStr.includes('PAYMENT') || tStr.includes('OUT') || tStr.includes('SETTLE')) {
          type = 'PAYMENT_OUT';
        } else if (tStr.includes('RETURN')) {
          type = 'PURCHASE_RETURN';
        }
      }

      // Extract Status
      let paymentStatus: PaymentStatus = 'CREDIT';
      if (statusIdx !== -1 && cols[statusIdx]) {
        const sStr = cols[statusIdx].toUpperCase();
        if (sStr.includes('PAID') || sStr.includes('CASH') || sStr.includes('DONE')) {
          paymentStatus = 'PAID';
        }
      } else if (type === 'PAYMENT_OUT') {
        paymentStatus = 'PAID';
      }

      // Extract Items
      const rawItems = itemsIdx !== -1 && cols[itemsIdx] ? cols[itemsIdx].replace(/^"|"$/g, '').trim() : '';
      const items = parseItemsString(rawItems, rawAmount);

      // Extract Notes
      const notes = notesIdx !== -1 && cols[notesIdx] ? cols[notesIdx].replace(/"/g, '').trim() : '';

      // Extract Shop
      const shopName = shopIdx !== -1 && cols[shopIdx] ? cols[shopIdx].replace(/"/g, '').trim() : 'Darjeeling momo';

      // Meal category
      let mealCategory: any = 'SNACK_KHAJA';
      if (categoryIdx !== -1 && cols[categoryIdx]) {
        const catStr = cols[categoryIdx].toUpperCase();
        if (catStr.includes('TEA') || catStr.includes('CHIYA')) mealCategory = 'TEA_COFFEE';
        else if (catStr.includes('LUNCH')) mealCategory = 'LUNCH_KHANA';
        else if (catStr.includes('BREAKFAST')) mealCategory = 'BREAKFAST';
        else if (catStr.includes('DINNER')) mealCategory = 'DINNER';
      }

      // Extract ID or generate stable ID based on txNum
      const id = `tx_${txNum.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;

      // Calculate timestamps
      const parsedAdDate = new Date(dateAd);
      const timestamp = !isNaN(parsedAdDate.getTime()) ? parsedAdDate.getTime() : Date.now() - r * 60000;

      const tx: LedgerTransaction = {
        id,
        transactionNumber: txNum,
        timestamp,
        dateAD: dateAd,
        dateBS: dateBs,
        dateBSFormatted: formatBsDisplay(dateBs),
        type,
        mealCategory,
        shopName: shopName || 'Darjeeling momo',
        couponCode: 'BF-FOX-7821',
        items,
        subtotal: rawAmount,
        discount: 0,
        netAmount: rawAmount,
        paymentStatus,
        paymentMethod: paymentStatus === 'CREDIT' ? 'COUPON_CREDIT' : 'CASH',
        referenceNote: notes || (type === 'PURCHASE' ? 'Imported Khata Record' : 'Account Settlement'),
        isImmutable: true,
        createdAt: new Date(timestamp).toISOString(),
      };

      importedTransactions.push(tx);
      runningTotal += rawAmount;
    }

    if (importedTransactions.length === 0) {
      return {
        success: false,
        transactions: [],
        count: 0,
        totalAmount: 0,
        error: 'No valid transaction records could be parsed from the CSV file.',
      };
    }

    return {
      success: true,
      transactions: importedTransactions,
      count: importedTransactions.length,
      totalAmount: runningTotal,
    };
  } catch (err: any) {
    return {
      success: false,
      transactions: [],
      count: 0,
      totalAmount: 0,
      error: err?.message || 'Error occurred while parsing CSV file.',
    };
  }
}
