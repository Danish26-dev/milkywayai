import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, ChevronRight, Menu, X, Lock } from 'lucide-react';

interface NavbarProps {
  onOpenOfficerPortal: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenOfficerPortal, onNavigateSection }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Three Worlds', id: 'three-stakeholders' },
    { label: 'Origin', id: 'origin-farmer' },
    { label: 'Movement', id: 'movement-chain' },
    { label: 'Discrepancy', id: 'the-discrepancy' },
    { label: 'Officer Console', id: 'officer-preview' },
    { label: 'Investigation Agent', id: 'investigation-agent' },
    { label: 'Physical Inspection', id: 'physical-inspection' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#F4F1E8]/95 backdrop-blur-md border-b border-[#26352D]/10 shadow-[0_4px_20px_-10px_rgba(38,53,45,0.06)]'
          : 'bg-[#F4F1E8]/85 backdrop-blur-xs border-b border-[#26352D]/5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* MilkyWay Logo */}
        <Link
          to="/"
          className="flex items-center gap-3 group focus:outline-hidden"
          aria-label="MilkyWay - Milk Supply-Chain Intelligence"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden bg-white shadow-xs border border-[#26352D]/15 flex items-center justify-center p-0.5 group-hover:scale-105 transition-all">
            <img
              src="/milkyway-logo.png"
              alt="MilkyWay Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-[#202521] font-sans">
              MilkyWay
            </span>
            <span className="text-[9px] uppercase font-mono tracking-[0.2em] text-[#66734A] font-bold -mt-1">
              Supply-Chain Intelligence
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-5" aria-label="Main Navigation">
          <Link
            to="/how-it-works"
            className="text-xs font-semibold text-[#26352D] hover:text-[#202521] tracking-tight transition-all py-1"
          >
            How It Works
          </Link>
          <Link
            to="/security"
            className="text-xs font-semibold text-[#26352D] hover:text-[#202521] tracking-tight transition-all py-1"
          >
            Security & Trust
          </Link>
          <Link
            to="/journal"
            className="text-xs font-semibold text-[#26352D] hover:text-[#202521] tracking-tight transition-all py-1"
          >
            Supply Journal
          </Link>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigateSection(link.id)}
              className="text-xs font-semibold text-[#202521]/75 hover:text-[#202521] tracking-tight transition-all cursor-pointer py-1"
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Right Action: Officer Login CTA */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/app/dashboard"
            className="px-3.5 py-1.5 rounded-full bg-[#66734A]/15 border border-[#66734A]/30 text-[11px] font-mono font-bold text-[#26352D] hover:bg-[#66734A]/25 transition-all"
          >
            Live Console →
          </Link>

          <button
            onClick={onOpenOfficerPortal}
            className="px-4 py-2 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-mono font-bold rounded-full transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Officer Portal</span>
          </button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="flex xl:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#202521] hover:bg-[#D8D3C7]/40 rounded-xl"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#F4F1E8] border-b border-[#26352D]/10 px-4 pt-2 pb-6 space-y-2">
          <Link
            to="/how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 text-sm font-medium text-[#202521] rounded-xl hover:bg-[#D8D3C7]/40"
          >
            How It Works
          </Link>
          <Link
            to="/journal"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 text-sm font-medium text-[#202521] rounded-xl hover:bg-[#D8D3C7]/40"
          >
            Milk Supply Journal
          </Link>
          <Link
            to="/security"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2 px-3 text-sm font-medium text-[#202521] rounded-xl hover:bg-[#D8D3C7]/40"
          >
            Security & Trust
          </Link>
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                onNavigateSection(link.id);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 text-sm font-medium text-[#202521] rounded-xl hover:bg-[#D8D3C7]/40"
            >
              {link.label}
            </button>
          ))}
          <div className="pt-4 border-t border-[#26352D]/10 space-y-2">
            <Link
              to="/app/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full py-2.5 bg-[#26352D] text-[#FFFDF7] text-xs font-mono font-bold rounded-full flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Enter Officer Console</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
