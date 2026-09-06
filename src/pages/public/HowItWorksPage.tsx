import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Scale,
  Truck,
  Building2,
  FileSearch,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Compass
} from 'lucide-react';

export const HowItWorksPage: React.FC = () => {
  const steps = [
    {
      num: '01',
      title: 'Milk Farmer',
      actor: 'Dairy Producer',
      desc: 'Local dairy farmers milk cows and buffaloes into calibrated stainless cans. Morning and evening yields are weighed, registered, and brought to the village collection depot.',
      evidence: 'Farmer ID, Weighbridge slip, timestamped fat/SNF preliminary dip',
      color: '#66734A'
    },
    {
      num: '02',
      title: 'Milk Collection',
      actor: 'Village Co-op Center',
      desc: 'Individual farmer yields are combined into bulk collection batches. Chilling begins immediately to prevent bacterial growth while volumetric intake is registered.',
      evidence: 'Aggregate batch creation event, initial composite volume, chilling temperature log',
      color: '#26352D'
    },
    {
      num: '03',
      title: 'Processing Hub',
      actor: 'Dairy Processing Unit',
      desc: 'Raw milk is pasteurized, standardized, and packaged or converted into derivative dairy products. Standard process shrinkage and evaporation are mathematically tracked.',
      evidence: 'Inflow flowmeter reading, pasteurizer temperature log, post-process yield record',
      color: '#8A6A4A'
    },
    {
      num: '04',
      title: 'Transport Corridor',
      actor: 'Insulated Road Tanker',
      desc: 'Liquid milk is transferred between chilling hubs and city processing plants using insulated road tankers. GPS transit tracks speed, route compliance, and temperature integrity.',
      evidence: 'Tanker registration, cryptographic seal barcode, highway departure/arrival times, continuous GPS pings',
      color: '#607481'
    },
    {
      num: '05',
      title: 'Receiving Facility',
      actor: 'Urban Distribution Depot',
      desc: 'Receiving dock logs arrival, verifies physical seals, checks temperature, and measures volumetric discharge at the receiving weighbridge manifold.',
      evidence: 'Discharge weighbridge tare, physical seal verification timestamp, receiving flowmeter volume',
      color: '#B78632'
    },
    {
      num: '06',
      title: 'MilkyWay Anomaly Detection',
      actor: 'Deterministic Compute Engine',
      desc: 'MilkyWay executes mathematical mass-balance checks and highway velocity verification against the BigQuery append-only event stream. Discrepancies exceeding physical tolerance trigger alerts.',
      evidence: 'Mathematical variance ratio: Output - (Input - Evaporation) > Permissible Threshold',
      color: '#9E4939'
    },
    {
      num: '07',
      title: 'Officer Investigation',
      actor: 'Food Safety Officer & ADK Agent',
      desc: 'Food safety officers review evidence dossiers. The Google ADK investigation agent cross-references facility history, vehicle transit records, and related batches to formulate inspection hypotheses.',
      evidence: 'Evidence confidence score, discrepancy magnitude, facility anomaly history, targeted inspection checklist',
      color: '#26352D'
    },
    {
      num: '08',
      title: 'Physical Inspection',
      actor: 'Field Enforcement Team',
      desc: 'Inspectors are dispatched directly to the highlighted facility and tank valves. Official physical samples are drawn under legal chain-of-custody for accredited laboratory testing.',
      evidence: 'Legal seal numbers, certified lab analysis certificate, enforcement disposition report',
      color: '#66734A'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F1E8] text-[#202521] flex flex-col font-sans">
      {/* Header Bar */}
      <header className="bg-[#FFFDF7] border-b border-[#202521]/15 sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#26352D]/15 p-0.5 overflow-hidden">
            <img src="/milkyway-logo.png" alt="MilkyWay Emblem" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className="font-bold text-lg text-[#202521] leading-tight block">MilkyWay</span>
            <span className="text-[9px] font-mono text-[#66734A] uppercase tracking-widest font-bold block">
              Supply-Chain Intelligence
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <Link to="/" className="text-[#202521]/70 hover:text-[#202521] font-medium hidden sm:inline">
            Overview
          </Link>
          <Link to="/security" className="text-[#202521]/70 hover:text-[#202521] font-medium hidden sm:inline">
            Security Architecture
          </Link>
          <Link
            to="/app/dashboard"
            className="px-4 py-2 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] rounded-full font-bold text-xs font-mono flex items-center gap-1.5 transition-all shadow-xs"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Enter Officer Console</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        {/* Title Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-4 rounded-full bg-[#26352D] text-[#FFFDF7] text-xs font-mono">
            <Compass className="w-3.5 h-3.5 text-[#66734A]" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">End-to-End Operational Lifecycle</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#202521] font-sans">
            How MilkyWay Works
          </h1>
          <p className="text-base sm:text-lg text-[#202521]/80 mt-4 leading-relaxed font-normal">
            From rural farm milk collection to urban processing and targeted physical inspection — understanding how data integrity drives food safety decisions.
          </p>
        </div>

        {/* The Core Flow Line */}
        <div className="bg-[#26352D] text-[#FFFDF7] p-4 sm:p-6 rounded-2xl mb-12 shadow-sm border border-white/10 font-mono text-xs overflow-x-auto">
          <div className="text-[10px] text-[#D8D3C7]/70 uppercase tracking-widest mb-2 font-bold">
            The Complete Flow Chain
          </div>
          <div className="flex items-center gap-2 whitespace-nowrap text-[#FFFDF7]">
            <span className="px-2.5 py-1 rounded bg-white/10 font-bold">FARMER</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-white/10 font-bold">COLLECTION</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-white/10 font-bold">PROCESSING</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-white/10 font-bold">TRANSPORT</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-white/10 font-bold">FACILITY</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#9E4939] font-bold">ANOMALY DETECTED</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#B78632] font-bold">INVESTIGATION</span>
            <span>→</span>
            <span className="px-2.5 py-1 rounded bg-[#66734A] font-bold">PHYSICAL INSPECTION</span>
          </div>
        </div>

        {/* Step-by-Step Breakdown */}
        <div className="space-y-6">
          {steps.map((step) => (
            <div
              key={step.num}
              className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 p-6 shadow-xs flex flex-col md:flex-row md:items-start gap-6"
            >
              <div className="flex md:flex-col items-center md:items-start justify-between gap-2 shrink-0 md:w-44">
                <span className="text-2xl font-bold font-mono text-[#26352D]">
                  {step.num}
                </span>
                <span className="text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded bg-[#F4F1E8] text-[#202521]">
                  {step.actor}
                </span>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-[#202521] font-sans">
                  {step.title}
                </h3>
                <p className="text-sm text-[#202521]/80 mt-1.5 leading-relaxed font-normal">
                  {step.desc}
                </p>

                <div className="mt-4 pt-4 border-t border-[#202521]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="text-[#202521]/70">
                    <span className="font-bold text-[#26352D]">Journal Evidence:</span>{' '}
                    <span>{step.evidence}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Non-Diagnostic Boundary Warning Callout */}
        <div className="mt-12 p-6 rounded-2xl bg-[#26352D] text-[#FFFDF7] border border-[#202521]/20">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-[#66734A] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-base font-bold font-sans text-[#FFFDF7]">
                Non-Diagnostic Boundary
              </h3>
              <p className="text-xs sm:text-sm text-[#D8D3C7]/90 mt-1.5 leading-relaxed font-normal">
                MilkyWay is an operational decision support system that detects unexplained supply-chain discrepancies and logistics movements. The system does <strong>NOT</strong> test milk or determine whether milk is adulterated. Physical inspection, legal sampling, and laboratory chemical analysis remain mandatory for any regulatory food safety enforcement action.
              </p>
              <div className="mt-4">
                <Link
                  to="/app/dashboard"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFFDF7] hover:bg-[#F4F1E8] text-[#26352D] font-bold text-xs rounded-full transition-all font-mono"
                >
                  <span>Explore Officer Priority Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#202521] text-[#D8D3C7] py-8 border-t border-white/10 text-center text-xs font-mono">
        <p>© 2026 MilkyWay Supply-Chain Intelligence. For Authorized Food Safety Personnel Only.</p>
      </footer>
    </div>
  );
};
