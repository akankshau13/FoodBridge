import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { AppView } from '../types/foodbridge';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  onStartDonation: () => void;
}

const NAV_ITEMS: Array<{ id: AppView; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'donor', label: 'Donor Portal' },
  { id: 'ngo', label: 'NGO Browse' },
  { id: 'ai-insights', label: 'AI Insights' },
  { id: 'admin', label: 'Admin' },
];

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onStartDonation,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (view: AppView) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-[#DCE7DF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleLinkClick('home')}
          className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 cursor-pointer focus-visible:rounded-md"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 28 28"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="28" height="28" rx="7" fill="#15803D" />
            <path
              d="M6.5 18.5C8.8 13.8 12.2 11.5 14 11.5C15.8 11.5 19.2 13.8 21.5 18.5"
              stroke="#FFFFFF"
              strokeWidth="2.1"
              strokeLinecap="round"
            />
            <path
              d="M14 11.5C14 8.5 16.2 6.8 18.8 6.8C18.8 9.2 16.8 11.5 14 11.5Z"
              fill="#BBF7D0"
            />
            <path
              d="M5.5 19.5H22.5"
              stroke="#DCFCE7"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="font-display text-xl font-bold tracking-tight text-[#0F2418]">
            FoodBridge
          </span>
        </button>

        {/* Zone 2: Concise Single-Line Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLinkClick(item.id)}
                className={`relative py-5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'text-[#15803D] font-semibold'
                    : 'text-[#475E51] hover:text-[#0F2418]'
                }`}
              >
                {item.label}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-[#15803D] rounded-t"
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary CTA + Mobile Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              onStartDonation();
              setMobileOpen(false);
            }}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Donate Food
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#DCE7DF] text-[#0F2418] hover:bg-[#F2F7F4] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Responsive Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#DCE7DF] bg-white px-4 py-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLinkClick(item.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-[#15803D] font-semibold'
                    : 'text-[#475E51] hover:bg-[#F7FAF8] hover:text-[#0F2418]'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                onStartDonation();
                setMobileOpen(false);
              }}
              className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] rounded-lg transition-colors cursor-pointer"
            >
              Donate Food
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
