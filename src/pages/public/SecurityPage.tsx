import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  Lock,
  Database,
  KeyRound,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Server
} from 'lucide-react';

export const SecurityPage: React.FC = () => {
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
              Security & Architecture
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-4 text-xs">
          <Link to="/" className="text-[#202521]/70 hover:text-[#202521] font-medium hidden sm:inline">
            Overview
          </Link>
          <Link to="/how-it-works" className="text-[#202521]/70 hover:text-[#202521] font-medium hidden sm:inline">
            How It Works
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1 mb-4 rounded-full bg-[#202521] text-[#FFFDF7] text-xs font-mono">
            <Shield className="w-3.5 h-3.5 text-[#66734A]" />
            <span className="font-semibold uppercase tracking-wider text-[10px]">Zero-Trust Supply-Chain Security</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[#202521] font-sans">
            Security & Trust Architecture
          </h1>
          <p className="text-base sm:text-lg text-[#202521]/80 mt-4 leading-relaxed font-normal">
            How MilkyWay protects supply-chain data integrity, enforces strict institutional role boundaries, and separates deterministic detection from AI reasoning.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Pillar 1 */}
          <div className="bg-[#FFFDF7] p-6 rounded-2xl border border-[#202521]/15 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#26352D] text-[#FFFDF7] flex items-center justify-center mb-4">
              <Database className="w-5 h-5 text-[#66734A]" />
            </div>
            <h3 className="text-lg font-bold text-[#202521] font-sans">
              Append-Only BigQuery Journal
            </h3>
            <p className="text-sm text-[#202521]/80 mt-2 leading-relaxed font-normal">
              Supply-chain events are write-once and cryptographically chained via SHA-256 digests. The database layer explicitly prohibits <code>UPDATE</code> and <code>DELETE</code> operations. Any correction is registered as a compensating event referencing the prior transaction hash.
            </p>
            <div className="mt-4 pt-3 border-t border-[#202521]/10 text-xs font-mono text-[#66734A] font-semibold">
              Tamper-evident supply ledger
            </div>
          </div>

          {/* Pillar 2 */}
          <div className="bg-[#FFFDF7] p-6 rounded-2xl border border-[#202521]/15 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#26352D] text-[#FFFDF7] flex items-center justify-center mb-4">
              <KeyRound className="w-5 h-5 text-[#B78632]" />
            </div>
            <h3 className="text-lg font-bold text-[#202521] font-sans">
              Strict Institutional Role Separation (RBAC)
            </h3>
            <p className="text-sm text-[#202521]/80 mt-2 leading-relaxed font-normal">
              Farmer and Officer access are decoupled with independent authorization boundaries. Farmer identities can only submit milk yields; they have zero access to investigation cases, anomaly flags, or officer notes. Officer access requires cryptographic token verification and clearance claims.
            </p>
            <div className="mt-4 pt-3 border-t border-[#202521]/10 text-xs font-mono text-[#B78632] font-semibold">
              Firestore security rules enforcement
            </div>
          </div>

          {/* Pillar 3 */}
          <div className="bg-[#FFFDF7] p-6 rounded-2xl border border-[#202521]/15 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#26352D] text-[#FFFDF7] flex items-center justify-center mb-4">
              <Server className="w-5 h-5 text-[#607481]" />
            </div>
            <h3 className="text-lg font-bold text-[#202521] font-sans">
              Google Cloud Secret Manager
            </h3>
            <p className="text-sm text-[#202521]/80 mt-2 leading-relaxed font-normal">
              All backend credentials, BigQuery service accounts, and Gemini API keys are retrieved dynamically at runtime via Google Cloud Secret Manager. Zero secrets exist in source code, client bundles, or committed repository configurations.
            </p>
            <div className="mt-4 pt-3 border-t border-[#202521]/10 text-xs font-mono text-[#607481] font-semibold">
              Zero-hardcoded secrets policy
            </div>
          </div>

          {/* Pillar 4 */}
          <div className="bg-[#FFFDF7] p-6 rounded-2xl border border-[#202521]/15 shadow-xs">
            <div className="w-10 h-10 rounded-xl bg-[#26352D] text-[#FFFDF7] flex items-center justify-center mb-4">
              <ShieldCheck className="w-5 h-5 text-[#9E4939]" />
            </div>
            <h3 className="text-lg font-bold text-[#202521] font-sans">
              Deterministic Anomaly Engine Boundary
            </h3>
            <p className="text-sm text-[#202521]/80 mt-2 leading-relaxed font-normal">
              The AI model is never permitted to calculate whether a batch is anomalous from raw figures. Anomaly detection is purely deterministic SQL and mathematical mass-balance calculation. The Google ADK agent only reasons over already computed, verifiable discrepancy flags.
            </p>
            <div className="mt-4 pt-3 border-t border-[#202521]/10 text-xs font-mono text-[#9E4939] font-semibold">
              Separation of math and reasoning
            </div>
          </div>
        </div>

        {/* Security Architecture Diagram */}
        <div className="bg-[#26352D] text-[#FFFDF7] p-6 sm:p-8 rounded-2xl border border-white/10 font-mono text-xs">
          <div className="text-[11px] text-[#D8D3C7]/70 uppercase tracking-widest mb-4 font-bold">
            Technical Architecture Flow
          </div>
          <pre className="overflow-x-auto text-[11px] leading-relaxed text-[#D8D3C7]">
{`                MILKYWAY WEB APP
                       |
                Firebase Auth (RBAC)
                       |
                       ▼
              Officer Console
                       |
                       ▼
                 Backend API (Cloud Run)
                       |
         ┌─────────────┼─────────────┐
         ▼             ▼             ▼
     BigQuery      Firestore      Agent
    Event Journal   App Data       ADK
  (Append-Only)  (Cases/Notes)       |
                                     ▼
                                MCP Server
                                     |
                                     ▼
                                BigQuery
`}
          </pre>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] font-bold text-xs rounded-full font-mono transition-all shadow-md cursor-pointer"
          >
            <span>Proceed to Authenticated Console</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#202521] text-[#D8D3C7] py-8 border-t border-white/10 text-center text-xs font-mono">
        <p>© 2026 MilkyWay Supply-Chain Intelligence. For Authorized Food Safety Personnel Only.</p>
      </footer>
    </div>
  );
};
