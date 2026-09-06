import React, { useState } from 'react';
import { Milk, MapPin, Calendar, Clock, Thermometer, ShieldCheck, CheckCircle2, ChevronRight, FileText, Sparkles } from 'lucide-react';

export const OriginSection: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<number>(0);

  const farmData = [
    {
      farmId: 'FARM-019',
      farmerName: 'Elias & Miriam Vance',
      coop: 'Valley Green Dairy Cooperative #04',
      location: 'Sector 4, Greenfield Ridge',
      cattleCount: '48 Grass-Fed Holsteins',
      milkingTime: '05:30 AM (Morning Batch)',
      volume: '1,000 Litres',
      temp: '3.8°C',
      fatContent: '4.15% Butterfat',
      snf: '8.82% SNF',
      docketId: 'DOC-FARM-20260905-019',
      notes: 'Clean herd milking. Bulk chilling vat inspected; custody transferred to collection route truck.'
    },
    {
      farmId: 'FARM-042',
      farmerName: 'Devon Agricultural Trust',
      coop: 'Valley Green Dairy Cooperative #04',
      location: 'Sector 7, North Meadow',
      cattleCount: '62 Certified Jerseys',
      milkingTime: '06:00 AM (Morning Batch)',
      volume: '1,250 Litres',
      temp: '3.6°C',
      fatContent: '4.60% Butterfat',
      snf: '9.05% SNF',
      docketId: 'DOC-FARM-20260905-042',
      notes: 'Morning aggregation complete. Dual stainless storage silos sealed with tamper-evident band.'
    }
  ];

  const current = farmData[selectedFarm];

  return (
    <section id="origin-farmer" className="py-20 bg-[#FFFDF7] border-b border-[#26352D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Badge & Title */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#66734A]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#66734A] font-bold">
              SECTION 1 • THE ORIGIN
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#202521] tracking-tight font-sans">
            Every litre starts somewhere.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202521]/80 leading-relaxed font-normal">
            Before milk travels through tankers, chilling facilities, or pasteurizers, it begins at the farm. Milk production and collection events become the very first immutable entries in the supply-chain digital trail.
          </p>
        </div>

        {/* 2-Column Farm Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Column: Agricultural Environment & Practices */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div className="bg-[#F4F1E8] border border-[#66734A]/25 rounded-3xl p-7 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#66734A]/15 text-[#66734A] flex items-center justify-center font-bold">
                  <Milk className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-mono text-[#8A6A4A] uppercase tracking-wider font-bold">
                    Agricultural Grounding
                  </span>
                  <h3 className="text-xl font-bold text-[#202521]">
                    The Physical Milking Environment
                  </h3>
                </div>
              </div>

              <p className="text-sm text-[#202521]/80 leading-relaxed mb-6 font-normal">
                Real milk is produced by real animals under careful agricultural management. Herds graze pasture, enter sanitized milking parlors twice daily, and dispatch milk directly into on-farm refrigerated bulk tanks at 4°C.
              </p>

              {/* Physical Milking Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div className="bg-[#FFFDF7] border border-[#66734A]/20 rounded-2xl p-4">
                  <span className="text-[11px] font-mono text-[#66734A] uppercase font-bold block">
                    Farm Infrastructure
                  </span>
                  <p className="text-xs text-[#202521]/80 mt-1 font-medium">
                    Certified bulk storage vats, clean-in-place (CIP) wash pipelines, and continuous temperature dataloggers.
                  </p>
                </div>

                <div className="bg-[#FFFDF7] border border-[#8A6A4A]/25 rounded-2xl p-4">
                  <span className="text-[11px] font-mono text-[#8A6A4A] uppercase font-bold block">
                    Collection Cans & Tanks
                  </span>
                  <p className="text-xs text-[#202521]/80 mt-1 font-medium">
                    Calibrated tare weights, food-grade 304 stainless steel, and mechanical dipsticks with verified graduations.
                  </p>
                </div>

                <div className="bg-[#FFFDF7] border border-[#8A6A4A]/25 rounded-2xl p-4">
                  <span className="text-[11px] font-mono text-[#8A6A4A] uppercase font-bold block">
                    Cooperative Weigh-In
                  </span>
                  <p className="text-xs text-[#202521]/80 mt-1 font-medium">
                    Each farmer's morning and evening contribution is weighed and sampled for baseline butterfat and density.
                  </p>
                </div>

                <div className="bg-[#FFFDF7] border border-[#66734A]/20 rounded-2xl p-4">
                  <span className="text-[11px] font-mono text-[#66734A] uppercase font-bold block">
                    Write-Once First Event
                  </span>
                  <p className="text-xs text-[#202521]/80 mt-1 font-medium">
                    The volumetric weight is signed and committed to the digital journal before the collection truck departs.
                  </p>
                </div>
              </div>
            </div>

            {/* Farm Selector Pill Tabs */}
            <div className="bg-[#F4F1E8] border border-[#26352D]/10 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-mono text-[#202521]/70 font-semibold">
                Select Origin Farm Record:
              </span>
              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setSelectedFarm(0)}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-mono font-bold rounded-full transition-all cursor-pointer ${
                    selectedFarm === 0
                      ? 'bg-[#66734A] text-[#FFFDF7] shadow-xs'
                      : 'bg-[#FFFDF7] text-[#202521] border border-[#66734A]/20 hover:bg-[#66734A]/10'
                  }`}
                >
                  FARM-019 (1,000 L)
                </button>
                <button
                  onClick={() => setSelectedFarm(1)}
                  className={`flex-1 sm:flex-none px-4 py-2 text-xs font-mono font-bold rounded-full transition-all cursor-pointer ${
                    selectedFarm === 1
                      ? 'bg-[#66734A] text-[#FFFDF7] shadow-xs'
                      : 'bg-[#FFFDF7] text-[#202521] border border-[#66734A]/20 hover:bg-[#66734A]/10'
                  }`}
                >
                  FARM-042 (1,250 L)
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Origin Farm Digital Docket (The First Journal Entry) */}
          <div className="lg:col-span-6 bg-[#F4F1E8] border-2 border-[#66734A]/30 rounded-3xl p-6 sm:p-8 shadow-md flex flex-col justify-between">
            <div>
              {/* Docket Header */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#66734A]/20 mb-6 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-[#66734A] font-bold uppercase tracking-[0.2em] block">
                    ORIGIN DISPATCH DOCKET
                  </span>
                  <h4 className="text-lg font-bold text-[#202521] font-mono mt-0.5">
                    {current.docketId}
                  </h4>
                </div>
                <span className="text-xs font-mono px-3 py-1 bg-[#66734A]/15 text-[#66734A] rounded-full font-bold border border-[#66734A]/30">
                  APPEND-ONLY EVENT #01
                </span>
              </div>

              {/* Farmer and Cooperative Details */}
              <div className="bg-[#FFFDF7] rounded-2xl p-5 border border-[#66734A]/20 mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#202521]/60 font-mono text-[10px] uppercase block">
                      Producer Name
                    </span>
                    <span className="font-bold text-[#202521] text-sm mt-0.5 block">
                      {current.farmerName}
                    </span>
                    <span className="text-[#66734A] text-[11px] font-mono mt-0.5 block">
                      ID: {current.farmId}
                    </span>
                  </div>

                  <div>
                    <span className="text-[#202521]/60 font-mono text-[10px] uppercase block">
                      Agricultural Cooperative
                    </span>
                    <span className="font-bold text-[#202521] text-sm mt-0.5 block">
                      {current.coop}
                    </span>
                    <span className="text-[#202521]/70 text-[11px] mt-0.5 block">
                      {current.location}
                    </span>
                  </div>
                </div>
              </div>

              {/* Physical Quantities & Telemetry */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 font-mono">
                <div className="bg-[#FFFDF7] border border-[#66734A]/20 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-[#202521]/60 uppercase block">Dispatched</span>
                  <span className="text-lg font-bold text-[#66734A] mt-1 block">
                    {current.volume}
                  </span>
                </div>

                <div className="bg-[#FFFDF7] border border-[#66734A]/20 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-[#202521]/60 uppercase block">Chilling Temp</span>
                  <span className="text-lg font-bold text-[#202521] mt-1 block">
                    {current.temp}
                  </span>
                </div>

                <div className="bg-[#FFFDF7] border border-[#66734A]/20 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-[#202521]/60 uppercase block">Butterfat</span>
                  <span className="text-lg font-bold text-[#8A6A4A] mt-1 block">
                    {current.fatContent.split(' ')[0]}
                  </span>
                </div>

                <div className="bg-[#FFFDF7] border border-[#66734A]/20 rounded-2xl p-3 text-center">
                  <span className="text-[10px] text-[#202521]/60 uppercase block">SNF Solids</span>
                  <span className="text-lg font-bold text-[#202521] mt-1 block">
                    {current.snf.split(' ')[0]}
                  </span>
                </div>
              </div>

              {/* Dispatch Field Notes */}
              <div className="bg-[#FFFDF7] rounded-2xl p-4 border border-[#66734A]/15 text-xs text-[#202521]/80 leading-relaxed font-sans">
                <span className="font-bold text-[#66734A] block mb-1 font-mono text-[11px] uppercase">
                  Farm Collection Verification:
                </span>
                {current.notes}
              </div>
            </div>

            {/* Cryptographic Proof / Write-Once Commit Footer */}
            <div className="pt-6 mt-6 border-t border-[#66734A]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#66734A]" />
                <span className="text-[11px] font-mono text-[#202521]/75">
                  Committed to BigQuery Ledger: <span className="font-bold text-[#202521]">2026-09-05T05:45:00Z</span>
                </span>
              </div>
              <span className="text-[10px] font-mono bg-[#66734A] text-[#FFFDF7] px-3 py-1 rounded-full font-bold">
                VERIFIED IMMUTABLE
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
