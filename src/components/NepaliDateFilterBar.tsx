import React, { useState } from 'react';
import { 
  Calendar, 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronDown, 
  Tag
} from 'lucide-react';
import { FilterOptions, TransactionType, PaymentStatus } from '../types';
import { 
  NEPALI_MONTHS, 
  getCurrentBsDate, 
  getThisMonthBsRange, 
  getThisWeekBsRange,
  formatBsDisplay,
  formatBsDateString 
} from '../utils/nepaliDate';

interface NepaliDateFilterBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  totalFilteredCount?: number;
  filteredCount?: number;
  totalCount?: number;
}

export const NepaliDateFilterBar: React.FC<NepaliDateFilterBarProps> = ({
  filters,
  onFilterChange,
  totalFilteredCount,
  filteredCount,
  totalCount,
}) => {
  const displayCount = totalFilteredCount !== undefined ? totalFilteredCount : (filteredCount ?? 0);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const currentBs = getCurrentBsDate();

  // Handle Quick Presets
  const handlePreset = (preset: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'ALL') => {
    if (preset === 'TODAY') {
      const todayStr = formatBsDateString(currentBs);
      onFilterChange({
        ...filters,
        dateRangePreset: 'TODAY',
        fromBS: todayStr,
        toBS: todayStr,
      });
    } else if (preset === 'THIS_WEEK') {
      const week = getThisWeekBsRange();
      onFilterChange({
        ...filters,
        dateRangePreset: 'THIS_WEEK',
        fromBS: week.fromBS,
        toBS: week.toBS,
      });
    } else if (preset === 'THIS_MONTH') {
      const monthRange = getThisMonthBsRange();
      onFilterChange({
        ...filters,
        dateRangePreset: 'THIS_MONTH',
        fromBS: monthRange.fromBS,
        toBS: monthRange.toBS,
      });
    } else if (preset === 'ALL') {
      onFilterChange({
        ...filters,
        dateRangePreset: 'ALL',
        fromBS: '',
        toBS: '',
      });
    }
  };

  const handleReset = () => {
    onFilterChange({
      dateRangePreset: 'ALL',
      fromBS: '',
      toBS: '',
      type: 'ALL',
      paymentStatus: 'ALL',
      searchQuery: '',
    });
    setShowAdvanced(false);
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm" id="nepali-filter-container">
      {/* Top Row: Presets + Search */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        
        {/* Quick Nepali Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="text-xs font-bold text-blue-950 flex items-center gap-1.5 mr-1">
            <Calendar className="w-4 h-4 text-blue-800" />
            <span>नेपाली मिति Filter:</span>
          </div>

          <button
            type="button"
            onClick={() => handlePreset('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.dateRangePreset === 'TODAY'
                ? 'bg-blue-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="preset-today"
          >
            आज (Today)
          </button>

          <button
            type="button"
            onClick={() => handlePreset('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.dateRangePreset === 'THIS_WEEK'
                ? 'bg-blue-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="preset-this-week"
          >
            यो हप्ता (Week)
          </button>

          <button
            type="button"
            onClick={() => handlePreset('THIS_MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.dateRangePreset === 'THIS_MONTH'
                ? 'bg-blue-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="preset-this-month"
          >
            यो महिना (Month)
          </button>

          <button
            type="button"
            onClick={() => handlePreset('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filters.dateRangePreset === 'ALL'
                ? 'bg-blue-950 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            id="preset-all-time"
          >
            सबै (All)
          </button>

          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-colors ${
              showAdvanced || filters.dateRangePreset === 'CUSTOM'
                ? 'border-blue-700 text-blue-900 bg-blue-50'
                : 'border-slate-300 text-slate-600 hover:bg-slate-100'
            }`}
            id="toggle-custom-filter"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>From-To Date</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Right Search Box & Quick Reset */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Momo, Chowmein, etc..."
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-800"
              id="search-filter-input"
            />
          </div>

          {(filters.dateRangePreset !== 'ALL' || filters.type !== 'ALL' || filters.paymentStatus !== 'ALL' || filters.searchQuery) && (
            <button
              onClick={handleReset}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg text-xs flex items-center gap-1"
              title="Reset All Filters"
              id="reset-filters-btn"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

      </div>

      {/* Advanced From-To BS Date & Category Filter Dropdown */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl">
          {/* From Nepali Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              From Nepali Date (वि.सं.)
            </label>
            <input
              type="text"
              placeholder="YYYY-MM-DD (e.g. 2083-06-01)"
              value={filters.fromBS}
              onChange={(e) => onFilterChange({ ...filters, dateRangePreset: 'CUSTOM', fromBS: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono focus:ring-1 focus:ring-blue-800"
              id="filter-from-bs"
            />
            {filters.fromBS && (
              <p className="text-[10px] text-blue-700 mt-0.5 font-medium">
                {formatBsDisplay(filters.fromBS, true)}
              </p>
            )}
          </div>

          {/* To Nepali Date */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              To Nepali Date (वि.सं.)
            </label>
            <input
              type="text"
              placeholder="YYYY-MM-DD (e.g. 2083-06-30)"
              value={filters.toBS}
              onChange={(e) => onFilterChange({ ...filters, dateRangePreset: 'CUSTOM', toBS: e.target.value })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white font-mono focus:ring-1 focus:ring-blue-800"
              id="filter-to-bs"
            />
            {filters.toBS && (
              <p className="text-[10px] text-blue-700 mt-0.5 font-medium">
                {formatBsDisplay(filters.toBS, true)}
              </p>
            )}
          </div>

          {/* Transaction Type Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Transaction Type
            </label>
            <select
              value={filters.type}
              onChange={(e) => onFilterChange({ ...filters, type: e.target.value as 'ALL' | TransactionType })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-blue-800 font-medium"
              id="filter-tx-type"
            >
              <option value="ALL">All Types (सबै कारोबार)</option>
              <option value="PURCHASE">Food Purchase (खाजा खर्च)</option>
              <option value="PURCHASE_RETURN">Purchase Return (खाजा फिर्ता)</option>
              <option value="PAYMENT_OUT">Payment Out (रकम भुक्तानी)</option>
            </select>
          </div>

          {/* Status Filter (Paid Navy Blue vs Credit Red) */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              Credit / Paid Status
            </label>
            <select
              value={filters.paymentStatus}
              onChange={(e) => onFilterChange({ ...filters, paymentStatus: e.target.value as 'ALL' | PaymentStatus })}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:ring-1 focus:ring-blue-800 font-medium"
              id="filter-status-type"
            >
              <option value="ALL">All Status (सबै)</option>
              <option value="CREDIT">Credit Only / उधारो (Red Index)</option>
              <option value="PAID">Paid Only / चुक्ता (Navy Blue Index)</option>
            </select>
          </div>

        </div>
      )}

      {/* Active Filter Pill Summary */}
      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500 pt-1">
        <div className="flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-slate-400" />
          <span>Showing <strong className="text-blue-950 font-bold">{displayCount}</strong> records</span>
          {filters.dateRangePreset !== 'ALL' && (
            <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[11px] font-medium">
              BS: {filters.fromBS || 'Start'} to {filters.toBS || 'Today'}
            </span>
          )}
          {filters.paymentStatus === 'CREDIT' && (
            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-[11px] font-bold">
              Filter: Credit Only (Red)
            </span>
          )}
          {filters.paymentStatus === 'PAID' && (
            <span className="bg-blue-100 text-blue-900 px-2 py-0.5 rounded text-[11px] font-bold">
              Filter: Paid Only (Navy Blue)
            </span>
          )}
        </div>

        <div className="text-[11px] text-slate-400 hidden sm:block">
          Current Date: {formatBsDisplay(currentBs, true)} ({currentBs.year}-{currentBs.month.toString().padStart(2, '0')}-{currentBs.day.toString().padStart(2, '0')} BS)
        </div>
      </div>

    </div>
  );
};
