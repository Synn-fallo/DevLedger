import { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { periodOptions, type PeriodKey, type DateRange } from '../../lib/dateUtils';

interface DateRangePickerProps {
  selectedPeriod: PeriodKey;
  onPeriodChange: (period: PeriodKey) => void;
  customRange: DateRange | null;
  onCustomRangeChange: (range: DateRange | null) => void;
  periodOptions: typeof periodOptions;
}

export function DateRangePicker({
  selectedPeriod,
  onPeriodChange,
  customRange,
  onCustomRangeChange,
  periodOptions
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');

  const handlePeriodSelect = (period: PeriodKey) => {
    onPeriodChange(period);
    if (period !== 'custom') {
      onCustomRangeChange(null);
    }
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (tempStartDate && tempEndDate) {
      onCustomRangeChange({
        startDate: new Date(tempStartDate),
        endDate: new Date(tempEndDate),
        label: `Personnalisé (${new Date(tempStartDate).toLocaleDateString('fr-FR')} - ${new Date(tempEndDate).toLocaleDateString('fr-FR')})`
      });
      onPeriodChange('custom');
      setIsOpen(false);
    }
  };

  const getCurrentLabel = () => {
    if (selectedPeriod === 'custom' && customRange) {
      return customRange.label;
    }
    return periodOptions.find(opt => opt.value === selectedPeriod)?.label || 'Ce mois';
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <Calendar className="w-4 h-4" />
        <span>{getCurrentLabel()}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 z-20">
            <div className="p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-white">Choisir une période</h3>
            </div>
            <div className="p-2 max-h-96 overflow-y-auto">
              {periodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handlePeriodSelect(option.value as PeriodKey)}
                  className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedPeriod === option.value && selectedPeriod !== 'custom'
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
              
              {/* Période personnalisée */}
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-2">Période personnalisée</p>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={tempStartDate}
                    onChange={(e) => setTempStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Date de début"
                  />
                  <input
                    type="date"
                    value={tempEndDate}
                    onChange={(e) => setTempEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
                    placeholder="Date de fin"
                  />
                  <button
                    onClick={handleCustomApply}
                    disabled={!tempStartDate || !tempEndDate}
                    className="w-full mt-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Appliquer
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}