import React from 'react';
import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  Wallet, 
  Utensils, 
  AlertCircle, 
  CheckCircle2, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  Receipt
} from 'lucide-react';
import { LedgerTransaction, CouponProfile, LedgerSummary } from '../types';
import { formatNepaliRupees } from '../utils/nepaliDate';

interface DashboardAnalyticsProps {
  transactions: LedgerTransaction[];
  couponProfile: CouponProfile;
  summary: LedgerSummary;
}

export const DashboardAnalytics: React.FC<DashboardAnalyticsProps> = ({
  transactions,
  couponProfile,
  summary,
}) => {
  const creditLimit = couponProfile.creditLimit || 25000;
  const creditUsagePercent = Math.min(100, Math.round((summary.totalCreditDue / creditLimit) * 100));
  const availableCredit = Math.max(0, creditLimit - summary.totalCreditDue);

  // 1. Food Items breakdown
  const itemMap = new Map<string, { count: number; totalSales: number }>();
  transactions.forEach((tx) => {
    if (tx.type === 'PURCHASE' && Array.isArray(tx.items)) {
      tx.items.forEach((item) => {
        const key = item.name.trim();
        if (!key) return;
        const existing = itemMap.get(key) || { count: 0, totalSales: 0 };
        itemMap.set(key, {
          count: existing.count + (item.qty || 1),
          totalSales: existing.totalSales + (item.totalPrice || 0),
        });
      });
    }
  });

  const topItems = Array.from(itemMap.entries())
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.totalSales - a.totalSales)
    .slice(0, 5);

  // 2. Spending by recent BS Dates (Past unique days)
  const dateMap = new Map<string, { spent: number; paid: number }>();
  transactions.forEach((tx) => {
    const d = tx.dateBSFormatted || tx.dateBS || 'Recent';
    const curr = dateMap.get(d) || { spent: 0, paid: 0 };
    if (tx.type === 'PURCHASE') {
      curr.spent += tx.netAmount;
    } else if (tx.type === 'PAYMENT_OUT' || tx.paymentStatus === 'PAID') {
      curr.paid += tx.netAmount;
    }
    dateMap.set(d, curr);
  });

  const recentDays = Array.from(dateMap.entries()).slice(0, 6);
  const maxDayAmount = Math.max(
    ...recentDays.map(([, v]) => Math.max(v.spent, v.paid)),
    1000
  );

  // 3. Payment Method breakdown
  const methodMap = new Map<string, number>();
  transactions.forEach((tx) => {
    if (tx.paymentMethod) {
      const label = tx.paymentMethod.replace('_', ' ');
      methodMap.set(label, (methodMap.get(label) || 0) + tx.netAmount);
    }
  });

  const purchaseCount = transactions.filter((t) => t.type === 'PURCHASE').length;
  const paymentCount = transactions.filter((t) => t.type === 'PAYMENT_OUT' || t.paymentStatus === 'PAID').length;
  const avgPurchaseTicket = purchaseCount > 0 ? Math.round(summary.totalSpent / purchaseCount) : 0;
  const settlementRatio = summary.totalSpent > 0 ? Math.min(100, Math.round((summary.totalPaid / summary.totalSpent) * 100)) : 100;

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300" id="live-analytics-dashboard">
      
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center font-bold">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h2 className="text-lg sm:text-xl font-black text-blue-950">
                लाइभ खाजा एनालिटिक्स (Real-Time Khata Analytics)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Live consumption trends & debt velocity for <strong>{couponProfile.shopName || 'Darjeeling momo'}</strong> & <strong>{couponProfile.holderName || 'Blue Fox'}</strong>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold self-start sm:self-auto">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Live Aggregation</span>
          </div>
        </div>

        {/* 4 Financial Key Ratios */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Settlement Ratio</span>
            <div className="text-xl sm:text-2xl font-black text-blue-950 mt-0.5">
              {settlementRatio}%
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {formatNepaliRupees(summary.totalPaid)} of {formatNepaliRupees(summary.totalSpent)} settled
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Credit Limit Headroom</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-0.5">
              {formatNepaliRupees(availableCredit)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Limit: {formatNepaliRupees(creditLimit)}
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Avg Snack Order</span>
            <div className="text-xl sm:text-2xl font-black text-slate-800 mt-0.5">
              {formatNepaliRupees(avgPurchaseTicket)}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Across {purchaseCount} food bills
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/80">
            <span className="text-[11px] font-bold text-slate-500 uppercase block">Total Settlements</span>
            <div className="text-xl sm:text-2xl font-black text-blue-900 mt-0.5">
              {paymentCount} Payments
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Cash & Fonepay QR
            </p>
          </div>
        </div>

        {/* Credit Utilization Bar */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-600" />
              <span>Credit Due vs Credit Limit ({creditUsagePercent}% Used)</span>
            </span>
            <span className="font-mono text-red-600">{formatNepaliRupees(summary.totalCreditDue)} / {formatNepaliRupees(creditLimit)}</span>
          </div>
          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-2.5 rounded-full transition-all duration-700 ${
                creditUsagePercent > 80 ? 'bg-red-600' : creditUsagePercent > 50 ? 'bg-amber-500' : 'bg-blue-800'
              }`}
              style={{ width: `${creditUsagePercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grid: Popular Snacks + Spending Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        
        {/* Top Ordered Snacks */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="w-4 h-4 text-amber-600" />
              <h3 className="text-sm sm:text-base font-black text-blue-950">
                सबैभन्दा धेरै खपत हुने खाजा (Top Canteen Snacks)
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400">By Revenue</span>
          </div>

          {topItems.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No snacks recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {topItems.map((item, idx) => {
                const pct = summary.totalSpent > 0 ? Math.round((item.totalSales / summary.totalSpent) * 100) : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-800 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-900 text-[10px] flex items-center justify-center font-bold">
                          {idx + 1}
                        </span>
                        <span>{item.name}</span>
                        <span className="text-slate-400 font-normal">({item.count} plates)</span>
                      </span>
                      <span className="font-mono text-blue-950">{formatNepaliRupees(item.totalSales)}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-blue-800 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Spending & Payment Activity */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-800" />
              <h3 className="text-sm sm:text-base font-black text-blue-950">
                दिनहुँ खाजा खर्च तथा भुक्तानी (Daily Activity)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <span>Spent</span>
              </span>
              <span className="flex items-center gap-1 text-blue-900">
                <span className="w-2 h-2 rounded-full bg-blue-900" />
                <span>Paid</span>
              </span>
            </div>
          </div>

          {recentDays.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No activity dates yet.</p>
          ) : (
            <div className="space-y-3">
              {recentDays.map(([date, data], idx) => {
                const spentPct = Math.min(100, Math.round((data.spent / maxDayAmount) * 100));
                const paidPct = Math.min(100, Math.round((data.paid / maxDayAmount) * 100));
                return (
                  <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                      <span>{date}</span>
                      <span className="font-mono text-slate-900">
                        {data.spent > 0 && <span className="text-emerald-700">Spent: {formatNepaliRupees(data.spent)} </span>}
                        {data.paid > 0 && <span className="text-blue-900">| Paid: {formatNepaliRupees(data.paid)}</span>}
                      </span>
                    </div>

                    <div className="space-y-1">
                      {data.spent > 0 && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: `${spentPct}%` }} />
                        </div>
                      )}
                      {data.paid > 0 && (
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-blue-900 h-1.5 rounded-full" style={{ width: `${paidPct}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
