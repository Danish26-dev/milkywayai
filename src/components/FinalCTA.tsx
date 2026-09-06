import React from 'react';
import { ArrowRight, ShieldCheck, Lock } from 'lucide-react';

interface FinalCTAProps {
  onEnter: () => void;
}

export const FinalCTA: React.FC<FinalCTAProps> = ({ onEnter }) => {
  return (
    <section className="py-24 bg-[#26352D] text-[#FFFDF7] relative overflow-hidden border-b border-[#26352D]">
      {/* Subtle architectural background line accents */}
      <div className="absolute inset-0 bg-subtle-grid opacity-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="flex items-center justify-center mb-6">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white shadow-md border border-white/20 p-1">
            <img
              src="/milkyway-logo.png"
              alt="MilkyWay Official Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 rounded-full bg-[#202521] border border-white/15 text-xs font-mono text-[#D8D3C7] shadow-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#66734A]" />
          <span className="font-semibold tracking-wider uppercase text-[10px]">
            Institutional Food Safety Deployment
          </span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#FFFDF7] max-w-3xl mx-auto leading-tight font-sans mb-6">
          Know where to look before you send an inspector.
        </h2>

        <p className="text-base sm:text-lg text-[#D8D3C7]/90 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          MilkyWay turns fragmented supply-chain events into evidence that helps Food Safety Officers prioritize where physical inspection should happen first.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            id="final-enter-btn"
            onClick={onEnter}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#FFFDF7] hover:bg-[#F4F1E8] text-[#26352D] text-sm font-bold tracking-wide rounded-full transition-all duration-200 cursor-pointer shadow-lg hover:scale-[1.01]"
          >
            <Lock className="w-4 h-4 text-[#26352D]" />
            <span>Enter MilkyWay Console</span>
            <ArrowRight className="w-4 h-4 text-[#26352D]" />
          </button>
        </div>

        <div className="mt-10 pt-8 border-t border-white/15 flex flex-wrap items-center justify-center gap-6 text-xs text-[#D8D3C7]/80 font-mono">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#66734A]" />
            Strict Role Separation (Officer / Farmer)
          </span>
          <span>•</span>
          <span>Append-Only Supply Journal</span>
          <span>•</span>
          <span>Physical Inspection Decision Support</span>
        </div>
      </div>
    </section>
  );
};
