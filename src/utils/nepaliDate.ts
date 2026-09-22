/**
 * Nepali Calendar (Bikram Sambat - BS) Utilities
 * Supports accurate BS <-> AD conversion, month names, and filter ranges.
 */

// Days in months for BS years (2078 to 2085)
// Format: [Baisakh, Jestha, Ashadh, Shrawan, Bhadra, Ashwin, Kartik, Mangsir, Poush, Magh, Falgun, Chaitra]
const BS_MONTH_DAYS: Record<number, number[]> = {
  2078: [31, 31, 31, 32, 31, 31, 30, 29, 30, 29, 30, 30],
  2079: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2080: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 30],
  2081: [31, 31, 32, 32, 31, 30, 30, 30, 29, 30, 29, 31],
  2082: [31, 32, 31, 32, 31, 30, 30, 30, 29, 30, 30, 30],
  2083: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30],
  2084: [31, 31, 32, 31, 32, 30, 30, 29, 30, 29, 30, 30],
  2085: [31, 32, 31, 32, 31, 30, 30, 30, 29, 29, 30, 31],
};

// Anchor point: 2080-01-01 BS corresponds to 2023-04-14 AD
const ANCHOR_BS_YEAR = 2080;
const ANCHOR_BS_MONTH = 1;
const ANCHOR_BS_DAY = 1;
const ANCHOR_AD_DATE = new Date(2023, 3, 14); // Month index 3 is April

export interface NepaliDateObject {
  year: number;
  month: number; // 1 to 12
  day: number; // 1 to 32
}

export const NEPALI_MONTHS = [
  { index: 1, nameEn: 'Baisakh', nameNp: 'बैशाख', daysDefault: 31 },
  { index: 2, nameEn: 'Jestha', nameNp: 'जेठ', daysDefault: 31 },
  { index: 3, nameEn: 'Ashadh', nameNp: 'असार', daysDefault: 32 },
  { index: 4, nameEn: 'Shrawan', nameNp: 'श्रावण', daysDefault: 32 },
  { index: 5, nameEn: 'Bhadra', nameNp: 'भाद्र', daysDefault: 31 },
  { index: 6, nameEn: 'Ashoj', nameNp: 'असोज', daysDefault: 30 },
  { index: 7, nameEn: 'Kartik', nameNp: 'कार्तिक', daysDefault: 30 },
  { index: 8, nameEn: 'Mangsir', nameNp: 'मंसिर', daysDefault: 29 },
  { index: 9, nameEn: 'Poush', nameNp: 'पुष', daysDefault: 30 },
  { index: 10, nameEn: 'Magh', nameNp: 'माघ', daysDefault: 29 },
  { index: 11, nameEn: 'Falgun', nameNp: 'फागुन', daysDefault: 30 },
  { index: 12, nameEn: 'Chaitra', nameNp: 'चैत', daysDefault: 30 },
];

/**
 * Convert AD Date to BS Date
 */
export function adToBs(adDateInput: Date | string): NepaliDateObject {
  const adDate = typeof adDateInput === 'string' ? new Date(adDateInput) : adDateInput;
  // Normalize both dates to UTC midnight for exact day diff
  const utc1 = Date.UTC(adDate.getFullYear(), adDate.getMonth(), adDate.getDate());
  const utc2 = Date.UTC(ANCHOR_AD_DATE.getFullYear(), ANCHOR_AD_DATE.getMonth(), ANCHOR_AD_DATE.getDate());
  let dayDiff = Math.floor((utc1 - utc2) / (1000 * 60 * 60 * 24));

  let bsYear = ANCHOR_BS_YEAR;
  let bsMonth = ANCHOR_BS_MONTH;
  let bsDay = ANCHOR_BS_DAY;

  if (dayDiff >= 0) {
    while (dayDiff > 0) {
      const yearDays = BS_MONTH_DAYS[bsYear] || [31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30];
      const daysInCurrentMonth = yearDays[bsMonth - 1];
      const daysLeftInMonth = daysInCurrentMonth - bsDay + 1;

      if (dayDiff >= daysLeftInMonth) {
        dayDiff -= daysLeftInMonth;
        bsDay = 1;
        bsMonth++;
        if (bsMonth > 12) {
          bsMonth = 1;
          bsYear++;
        }
      } else {
        bsDay += dayDiff;
        dayDiff = 0;
      }
    }
  } else {
    // Past dates prior to 2080-01-01
    while (dayDiff < 0) {
      if (bsDay > 1) {
        const canGoBack = bsDay - 1;
        const toSubtract = Math.min(-dayDiff, canGoBack);
        bsDay -= toSubtract;
        dayDiff += toSubtract;
      } else {
        bsMonth--;
        if (bsMonth < 1) {
          bsMonth = 12;
          bsYear--;
        }
        const yearDays = BS_MONTH_DAYS[bsYear] || [31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30];
        const daysInPrevMonth = yearDays[bsMonth - 1];
        bsDay = daysInPrevMonth;
        dayDiff += 1;
      }
    }
  }

  return { year: bsYear, month: bsMonth, day: bsDay };
}

/**
 * Convert BS Date object to formatted string: YYYY-MM-DD
 */
export function formatBsDateString(bs: NepaliDateObject): string {
  const m = bs.month.toString().padStart(2, '0');
  const d = bs.day.toString().padStart(2, '0');
  return `${bs.year}-${m}-${d}`;
}

/**
 * Format BS Date for human reading (e.g. "2083 Ashoj 06" and "२०८३ असोज ०६")
 */
export function formatBsDisplay(bs: NepaliDateObject | string, devanagari: boolean = false): string {
  let year: number;
  let month: number;
  let day: number;

  if (typeof bs === 'string') {
    const parts = bs.split('-').map(Number);
    year = parts[0] || 2083;
    month = parts[1] || 1;
    day = parts[2] || 1;
  } else {
    year = bs.year;
    month = bs.month;
    day = bs.day;
  }

  const monthObj = NEPALI_MONTHS[month - 1] || NEPALI_MONTHS[0];
  const dStr = day.toString().padStart(2, '0');

  if (devanagari) {
    const devYear = toDevanagariNumerals(year);
    const devDay = toDevanagariNumerals(dStr);
    return `${devYear} ${monthObj.nameNp} ${devDay}`;
  }

  return `${year} ${monthObj.nameEn} ${dStr}`;
}

/**
 * Convert English numbers to Devanagari script numerals (०, १, २, ३, ...)
 */
export function toDevanagariNumerals(val: number | string): string {
  const devMap: Record<string, string> = {
    '0': '०',
    '1': '१',
    '2': '२',
    '3': '३',
    '4': '४',
    '5': '५',
    '6': '६',
    '7': '७',
    '8': '८',
    '9': '९',
  };
  return val.toString().replace(/[0-9]/g, (digit) => devMap[digit] || digit);
}

/**
 * Get current Nepali date right now
 */
export function getCurrentBsDate(): NepaliDateObject {
  return adToBs(new Date());
}

/**
 * Parse a BS date string (YYYY-MM-DD) into NepaliDateObject
 */
export function parseBsDate(str: string): NepaliDateObject {
  const parts = str.split('-').map(Number);
  return {
    year: parts[0] || 2083,
    month: parts[1] || 1,
    day: parts[2] || 1,
  };
}

/**
 * Get start and end BS dates for "This Month"
 */
export function getThisMonthBsRange(): { fromBS: string; toBS: string; monthName: string } {
  const cur = getCurrentBsDate();
  const yearDays = BS_MONTH_DAYS[cur.year] || [31, 31, 32, 31, 31, 30, 30, 29, 30, 29, 30, 30];
  const daysInMonth = yearDays[cur.month - 1];

  const fromBS = `${cur.year}-${cur.month.toString().padStart(2, '0')}-01`;
  const toBS = `${cur.year}-${cur.month.toString().padStart(2, '0')}-${daysInMonth.toString().padStart(2, '0')}`;
  const monthName = NEPALI_MONTHS[cur.month - 1]?.nameEn || 'Current Month';

  return { fromBS, toBS, monthName };
}

/**
 * Get start and end BS dates for "This Week" (last 7 days)
 */
export function getThisWeekBsRange(): { fromBS: string; toBS: string } {
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 6);

  const startBs = adToBs(sevenDaysAgo);
  const endBs = adToBs(now);

  return {
    fromBS: formatBsDateString(startBs),
    toBS: formatBsDateString(endBs),
  };
}

/**
 * Format currency in Nepalese Rupees (रू. / Rs.)
 */
export function formatNepaliRupees(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
