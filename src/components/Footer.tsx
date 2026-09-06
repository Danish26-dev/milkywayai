import React from 'react';

interface FooterProps {
  onOpenOfficerPortal: () => void;
  onNavigateSection: (sectionId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenOfficerPortal, onNavigateSection }) => {
  return (
    <footer className="bg-[#202521] text-[#FFFDF7] py-14 border-t border-[#26352D]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between pb-8 border-b border-white/10 gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white shadow-xs border border-white/20 flex items-center justify-center p-0.5 shrink-0">
              <img
                src="/milkyway-logo.png"
                alt="MilkyWay Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-[#FFFDF7] font-sans">
                MilkyWay
              </span>
              <p className="text-[10px] uppercase font-mono tracking-widest text-[#66734A] font-bold">
                Supply-Chain Intelligence
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono text-[#D8D3C7]">
            <button
              onClick={() => onNavigateSection('three-stakeholders')}
              className="hover:text-[#FFFDF7] transition-colors cursor-pointer"
            >
              Three Worlds
            </button>
            <button
              onClick={() => onNavigateSection('origin-farmer')}
              className="hover:text-[#FFFDF7] transition-colors cursor-pointer"
            >
              Origin
            </button>
            <button
              onClick={() => onNavigateSection('movement-chain')}
              className="hover:text-[#FFFDF7] transition-colors cursor-pointer"
            >
              Movement
            </button>
            <button
              onClick={() => onNavigateSection('the-discrepancy')}
              className="hover:text-[#FFFDF7] transition-colors cursor-pointer"
            >
              Discrepancy
            </button>
            <button
              onClick={() => onNavigateSection('officer-preview')}
              className="hover:text-[#FFFDF7] transition-colors cursor-pointer"
            >
              Officer Console
            </button>
            <button
              onClick={() => onNavigateSection('physical-inspection')}
              className="hover:text-[#FFFDF7] transition-colors cursor-pointer"
            >
              Physical Inspection
            </button>
            <button
              onClick={onOpenOfficerPortal}
              className="px-4 py-1.5 rounded-full bg-[#B78632]/20 text-[#B78632] hover:bg-[#B78632] hover:text-[#202521] border border-[#B78632]/40 transition-all cursor-pointer font-bold shadow-xs"
            >
              Officer Login
            </button>
          </div>
        </div>

        {/* Bottom copyright & mandatory legal disclaimer */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#D8D3C7]/70 font-mono gap-4 text-center sm:text-left">
          <p className="font-sans text-xs">
            "Traceability intelligence for safer milk supply chains."
          </p>
          <p className="text-[11px] max-w-lg text-[#D8D3C7]/60">
            Notice: MilkyWay is an intelligence platform for anomaly detection and physical inspection prioritization. It does not perform chemical milk adulteration testing or replace laboratory analysis.
          </p>
        </div>
      </div>
    </footer>
  );
};
