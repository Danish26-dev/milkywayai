import React from 'react';
import { Truck, Search, FlaskConical, Scale, ShieldAlert, CheckCircle2, ArrowRight } from 'lucide-react';

export const InspectionSection: React.FC = () => {
  const inspectionActivities = [
    {
      step: '01',
      title: 'Tanker Inspection',
      icon: Truck,
      color: '#26352D',
      desc: 'Inspecting physical manifold valves, CIP wash certificates, mechanical seal integrity, and GPS dataloggers on transport vehicles.'
    },
    {
      step: '02',
      title: 'Facility Audit',
      icon: Search,
      color: '#66734A',
      desc: 'Examining on-site weighbridge logs, bulk chilling vat dipstick calibrations, holding tank capacities, and physical intake ledgers.'
    },
    {
      step: '03',
      title: 'Milk Sampling',
      icon: FlaskConical,
      color: '#8A6A4A',
      desc: 'Drawing representative physical samples from multiple depths using aseptic sampling dippers and sealing in tamper-evident vials.'
    },
    {
      step: '04',
      title: 'Laboratory Testing',
      icon: Scale,
      color: '#607481',
      desc: 'Certified accredited food safety laboratories execute Rose-Gottlieb fat extraction, freezing point depression cryoscopy, and chromatography.'
    },
    {
      step: '05',
      title: 'Legal Enforcement',
      icon: ShieldAlert,
      color: '#9E4939',
      desc: 'Authorities issue formal regulatory notices, seize non-compliant dairy inventory, or initiate statutory enforcement under food safety law.'
    }
  ];

  return (
    <section id="physical-inspection" className="py-20 bg-[#F4F1E8] border-b border-[#26352D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#26352D]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#26352D] font-bold">
              SECTION 6 • PHYSICAL INSPECTION
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#202521] tracking-tight font-sans">
            Where testing actually happens.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202521]/80 leading-relaxed font-normal">
            MilkyWay prioritizes locations. Officers perform physical inspections. Testing and confirmation happen in the physical world with certified instruments and human authority—never inside software.
          </p>
        </div>

        {/* 5 Physical Inspection Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-12">
          {inspectionActivities.map((act) => {
            const Icon = act.icon;
            return (
              <div
                key={act.step}
                className="bg-[#FFFDF7] border border-[#26352D]/15 rounded-3xl p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-mono font-bold text-[#26352D]">
                      {act.step}
                    </span>
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-[#FFFDF7]"
                      style={{ backgroundColor: act.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="font-bold text-base text-[#202521] mb-2 font-sans">
                    {act.title}
                  </h3>
                  <p className="text-xs text-[#202521]/80 leading-relaxed">
                    {act.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#26352D]/10 text-[10px] font-mono text-[#26352D]/60 uppercase">
                  Physical World Action
                </div>
              </div>
            );
          })}
        </div>

        {/* Clear Boundary Comparison: Software vs Physical World */}
        <div className="bg-[#26352D] text-[#FFFDF7] rounded-3xl p-7 sm:p-9 border-2 border-[#26352D] shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-white/15">
            {/* Left: What MilkyWay Software Does */}
            <div className="pr-0 md:pr-8">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#66734A] font-bold block mb-2">
                INSIDE MILKYWAY (DIGITAL REALM)
              </span>
              <h4 className="text-xl font-bold text-[#FFFDF7] font-sans mb-3">
                Trace, Detect & Prioritize
              </h4>
              <ul className="space-y-2.5 text-xs text-[#D8D3C7]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#66734A] shrink-0 mt-0.5" />
                  <span>Tracks volumetric inputs, outputs, and custody events across supply chain</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#66734A] shrink-0 mt-0.5" />
                  <span>Calculates deterministic mass-balance deficits and route velocity impossibilities</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#66734A] shrink-0 mt-0.5" />
                  <span>Ranks facilities and transit corridors by evidentiary inspection priority</span>
                </li>
              </ul>
            </div>

            {/* Right: What Human Officers & Labs Do */}
            <div className="pt-6 md:pt-0 pl-0 md:pl-8">
              <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#B78632] font-bold block mb-2">
                OUTSIDE MILKYWAY (PHYSICAL REALM)
              </span>
              <h4 className="text-xl font-bold text-[#FFFDF7] font-sans mb-3">
                Inspect, Test & Enforce
              </h4>
              <ul className="space-y-2.5 text-xs text-[#D8D3C7]">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#B78632] shrink-0 mt-0.5" />
                  <span>Officers physically visit prioritized chilling centers, tankers, and factories</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#B78632] shrink-0 mt-0.5" />
                  <span>Sterile milk samples are drawn, sealed, and sent to certified laboratories</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#B78632] shrink-0 mt-0.5" />
                  <span>Certified lab findings determine compliance, dilution, or statutory violation</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
