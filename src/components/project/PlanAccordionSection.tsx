import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';

interface PlanAccordionSectionProps {
  title: string;
  icon?: ReactNode;
  count?: number;
  buttonLabel?: string;
  onButtonClick?: () => void;
  children: ReactNode;
  defaultOpen?: boolean;
  tooltip?: string;  // NOUVEAU
}

export function PlanAccordionSection({
  title,
  icon,
  count,
  buttonLabel,
  onButtonClick,
  children,
  defaultOpen = false,
  tooltip  // NOUVEAU
}: PlanAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {icon && <span className="text-gray-500">{icon}</span>}
          <span className="font-medium text-gray-900 dark:text-white">{title}</span>
          {count !== undefined && (
            <span className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
              {count}
            </span>
          )}
          {tooltip && (
            <div className="relative inline-block ml-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTooltip(!showTooltip);
                }}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {showTooltip && (
                <div className="absolute z-10 left-0 top-6 w-64 p-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
                  {tooltip}
                  <div className="absolute -top-1 left-3 w-2 h-2 bg-gray-900 rotate-45"></div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {buttonLabel && onButtonClick && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onButtonClick();
              }}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {buttonLabel}
            </button>
          )}
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>
      
      {isOpen && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {children}
        </div>
      )}
    </div>
  );
}