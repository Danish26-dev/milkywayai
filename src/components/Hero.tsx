import React from 'react';
import { ArrowRight, FileSearch, ShieldCheck, Scale, Compass, ChevronRight } from 'lucide-react';
import { ThreeMilkCanister } from './ThreeMilkCanister';

interface HeroProps {
  onExploreSupplyChain: () => void;
  onSeeMassBalance: () => void;
  onLaunchOfficerConsole: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  onExploreSupplyChain,
  onSeeMassBalance,
  onLaunchOfficerConsole,
}) => {
  return (
    <section
      id="platform"
      className="relative pt-28 pb-14 md:pt-36 md:pb-20 overflow-hidden bg-[#F4F1E8] bg-subtle-grid border-b border-[#26352D]/10"
    >
      {/* Subtle architectural framing lines */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="max-w-7xl mx-auto h-full border-x border-[#26352D]/8 flex justify-between">
          <div className="w-[1px] h-full bg-[#26352D]/5 hidden lg:block" />
          <div className="w-[1px] h-full bg-[#26352D]/5 hidden lg:block" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Core Notice Tag: Grounded Product Boundary */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="text-[10px] tracking-[0.2em] font-bold uppercase py-1.5 px-3.5 border border-[#26352D]/20 rounded-full bg-[#D8D3C7]/60 text-[#26352D] inline-flex items-center gap-2 shadow-2xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#66734A] inline-block" />
            Milk Supply-Chain Traceability & Anomaly Intelligence
          </span>
          <span className="text-[11px] text-[#202521]/70 font-medium">
            Physical Mass-Balance • Append-Only Journal • Non-Diagnostic Evidence Trail
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Editorial Headline & Value Proposition */}
          <div className="lg:col-span-7 flex flex-col justify-center pr-0 lg:pr-6">
            {/* Editorial Headline - Exact requirement */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.08] tracking-tight text-[#202521] mb-6 font-sans">
              The milk supply chain is physical.<br />
              <span className="text-[#66734A]">The investigation must be evidence-based.</span>
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#202521]/80 leading-relaxed max-w-xl mb-8 font-normal">
              MilkyWay creates a digital trail across the milk supply chain, helping food-safety officers identify unexplained quantity discrepancies and prioritize where to investigate first.
            </p>

            {/* Three Call To Action Buttons - Exact requirement */}
            <div className="flex flex-wrap items-center gap-3.5 mb-6">
              <button
                id="hero-explore-supply-chain-btn"
                onClick={onExploreSupplyChain}
                className="px-6 py-3.5 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] rounded-full font-bold shadow-md hover:shadow-lg hover:scale-[1.01] transition-all cursor-pointer text-xs sm:text-sm flex items-center justify-center gap-2"
              >
                <span>Explore the Supply Chain</span>
                <ArrowRight className="w-4 h-4 text-[#FFFDF7]" />
              </button>

              <button
                id="hero-see-mass-balance-btn"
                onClick={onSeeMassBalance}
                className="px-6 py-3.5 bg-[#FFFDF7] border border-[#B78632]/40 rounded-full font-bold text-[#202521] hover:bg-[#D8D3C7]/60 hover:scale-[1.01] transition-all cursor-pointer text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2"
              >
                <Scale className="w-4 h-4 text-[#B78632]" />
                <span>See Mass-Balance Anomaly</span>
              </button>

              <button
                id="hero-launch-officer-console-btn"
                onClick={onLaunchOfficerConsole}
                className="px-6 py-3.5 bg-[#D8D3C7]/50 border border-[#26352D]/20 rounded-full font-bold text-[#26352D] hover:bg-[#26352D] hover:text-[#FFFDF7] transition-all cursor-pointer text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Launch Officer Console</span>
              </button>
            </div>

            {/* Non-Diagnostic Operational Clarification */}
            <p className="text-xs text-[#202521]/60 font-medium tracking-wide italic mb-6">
              MilkyWay identifies supply-chain discrepancies and ranks inspection priority. Physical inspection and laboratory testing confirm actual food-safety violations.
            </p>

            {/* Three Stakeholder Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#26352D]/10 max-w-xl">
              <div className="flex flex-col">
                <span className="text-[10px] font-mono text-[#66734A] uppercase tracking-widest font-bold">
                  01 • Origin
                </span>
                <span className="text-sm font-bold text-[#202521] font-mono mt-0.5">Milk Farmer</span>
                <span className="text-[10px] text-[#202521]/70 font-sans">Where milk originates</span>
              </div>
              <div className="flex flex-col border-l border-[#26352D]/10 pl-4">
                <span className="text-[10px] font-mono text-[#607481] uppercase tracking-widest font-bold">
                  02 • Movement
                </span>
                <span className="text-sm font-bold text-[#202521] font-mono mt-0.5">Dairy Supply Chain</span>
                <span className="text-[10px] text-[#202521]/70 font-sans">How milk moves</span>
              </div>
              <div className="flex flex-col border-l border-[#26352D]/10 pl-4">
                <span className="text-[10px] font-mono text-[#26352D] uppercase tracking-widest font-bold">
                  03 • Investigation
                </span>
                <span className="text-sm font-bold text-[#202521] font-mono mt-0.5">Food Safety Officer</span>
                <span className="text-[10px] text-[#202521]/70 font-sans">Investigates discrepancies</span>
              </div>
            </div>
          </div>

          {/* Right Column: High-Quality 3D Stainless-Steel Milk Canister Hero Object */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="w-full flex flex-col items-center">
              {/* Three.js interactive canvas container */}
              <ThreeMilkCanister />

              {/* Minimal caption below 3D object */}
              <div className="mt-2 text-center">
                <span className="text-[10px] font-mono font-bold uppercase tracking-[0.18em] text-[#26352D]">
                  Stainless-Steel Canister & Physical Supply Trail
                </span>
                <p className="text-[10px] text-[#202521]/60 font-mono mt-0.5">
                  Farm (1,000 L) → Collection (-330 L) → Processing (650 L) → Investigation
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Continuous Supply-Chain Progression Bar (Core Story) */}
        <div className="mt-14 pt-8 border-t border-[#26352D]/15 bg-[#FFFDF7] rounded-3xl p-6 shadow-sm border">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] font-bold text-[#66734A] block">
                Continuous Supply-Chain Progression
              </span>
              <p className="text-xs sm:text-sm font-medium text-[#202521]/90 mt-0.5 font-sans">
                “A farmer records the milk. The supply chain moves it. MilkyWay traces it. An officer investigates the discrepancy.”
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#607481] bg-[#D8D3C7]/40 px-3 py-1 rounded-full shrink-0">
              Deterministic Lineage
            </span>
          </div>

          {/* 4 Continuous Progression Stages: MILK ORIGIN → CHILLING & TRANSIT → PROCESSING → OFFICER INVESTIGATION */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
            {/* Stage 1: Milk Origin (Field Olive: #66734A) */}
            <div className="bg-[#F4F1E8] border-2 border-[#66734A]/40 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#66734A] font-bold text-[10px]">
                <span>01 • ORIGIN</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#66734A]" />
              </div>
              <div className="mt-2">
                <span className="font-bold text-[#202521] text-sm block">MILK ORIGIN</span>
                <span className="text-[10px] text-[#66734A] font-bold uppercase tracking-wider">Field Olive (#66734A)</span>
              </div>
              <span className="text-[11px] text-[#202521]/80 mt-2 font-sans">
                Farmer morning/evening milking logged into immutable digital ledger.
              </span>
            </div>

            {/* Stage 2: Chilling & Transit (Dusty Blue: #607481) */}
            <div className="bg-[#F4F1E8] border-2 border-[#607481]/40 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#607481] font-bold text-[10px]">
                <span>02 • TRANSIT</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#607481]" />
              </div>
              <div className="mt-2">
                <span className="font-bold text-[#202521] text-sm block">CHILLING & TRANSIT</span>
                <span className="text-[10px] text-[#607481] font-bold uppercase tracking-wider">Dusty Blue (#607481)</span>
              </div>
              <span className="text-[11px] text-[#202521]/80 mt-2 font-sans">
                Collection center vats and insulated road tanker GPS transit.
              </span>
            </div>

            {/* Stage 3: Processing (Dusty Blue: #607481) */}
            <div className="bg-[#F4F1E8] border-2 border-[#607481]/40 p-4 rounded-2xl flex flex-col justify-between shadow-xs">
              <div className="flex items-center justify-between text-[#607481] font-bold text-[10px]">
                <span>03 • PROCESSING</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#607481]" />
              </div>
              <div className="mt-2">
                <span className="font-bold text-[#202521] text-sm block">PROCESSING</span>
                <span className="text-[10px] text-[#607481] font-bold uppercase tracking-wider">Dusty Blue (#607481)</span>
              </div>
              <span className="text-[11px] text-[#202521]/80 mt-2 font-sans">
                Pasteurization HTST, clarifying, and packaging reconciliation.
              </span>
            </div>

            {/* Stage 4: Officer Investigation (Charcoal Green: #26352D) */}
            <div className="bg-[#26352D] text-[#FFFDF7] border-2 border-[#B78632]/50 p-4 rounded-2xl flex flex-col justify-between shadow-md">
              <div className="flex items-center justify-between text-[#B78632] font-bold text-[10px]">
                <span>04 • INVESTIGATION</span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#B78632] animate-pulse" />
              </div>
              <div className="mt-2">
                <span className="font-bold text-[#FFFDF7] text-sm block">OFFICER INVESTIGATION</span>
                <span className="text-[10px] text-[#D8D3C7] font-bold uppercase tracking-wider">Charcoal Green (#26352D)</span>
              </div>
              <span className="text-[11px] text-[#D8D3C7] mt-2 font-sans">
                Food Safety Officers prioritize physical inspections based on evidence.
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
