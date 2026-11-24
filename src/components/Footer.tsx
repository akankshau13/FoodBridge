import React from 'react';
import { RotateCcw } from 'lucide-react';
import { AppView } from '../types/foodbridge';

interface FooterProps {
  onNavigate: (view: AppView) => void;
  onResetDemo: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, onResetDemo }) => {
  return (
    <footer className="bg-white border-t border-[#DCE7DF] mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="font-display text-lg font-bold text-[#0F2418]">
              FoodBridge
            </div>
            <p className="text-sm text-[#475E51] max-w-md">
              AI-Powered Food Waste Prediction &amp; Community Donation Platform built for
              campus welfare drives, restaurants, and local NGO networks.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[#475E51]">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="hover:text-[#15803D] transition-colors cursor-pointer"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => onNavigate('donor')}
              className="hover:text-[#15803D] transition-colors cursor-pointer"
            >
              Donor Portal
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ngo')}
              className="hover:text-[#15803D] transition-colors cursor-pointer"
            >
              NGO Browse
            </button>
            <button
              type="button"
              onClick={() => onNavigate('ai-insights')}
              className="hover:text-[#15803D] transition-colors cursor-pointer"
            >
              AI Insights
            </button>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="hover:text-[#15803D] transition-colors cursor-pointer"
            >
              Admin Console
            </button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#EDF3EF] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[#6B8275]">
          <p>
            Society Welfare Fair Demonstration · All sample donors, NGOs, and logistics records are interactive.
          </p>
          <button
            type="button"
            onClick={onResetDemo}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#475E51] hover:text-[#15803D] transition-colors cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Reset Sample Data</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
