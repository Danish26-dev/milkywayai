import React, { useState } from 'react';
import { ShieldCheck, Lock, Database, KeyRound, Server, FileText, CheckCircle2, AlertOctagon } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'threat-model'>('architecture');

  const securityPillars = [
    {
      title: 'Firebase Authentication',
      subtitle: 'Federated Identity & Zero Stored Credentials',
      description:
        'Uses federated identity and passwordless tokens. Eliminates custom password handling and protects officer credentials from local storage compromises.',
      icon: KeyRound,
      badge: 'GSI / Auth Tokens',
    },
    {
      title: 'Role-Based Access Control',
      subtitle: 'Strict Farmer vs. Officer Separation',
      description:
        'Role claims are cryptographically enforced on every request boundary. A farmer identity can never invoke officer-only investigation tools or view anomaly cases.',
      icon: Lock,
      badge: 'Claim-Bound RBAC',
    },
    {
      title: 'Isolated Firestore State',
      subtitle: 'Owner-Bound Path Security',
      description:
        'Security rules enforce request.auth.uid == userId for private operational records. Zero default allow rules; document reads require authenticated role verification.',
      icon: Database,
      badge: 'firestore.rules Enforced',
    },
    {
      title: 'Server-Side Authorization',
      subtitle: 'Context-Bound MCP Tool Boundaries',
      description:
        'All MCP tool endpoints run in sandboxed Cloud Run environments. Tool invocations validate officer jurisdiction headers before executing downstream queries.',
      icon: Server,
      badge: 'Cloud Run Middleware',
    },
    {
      title: 'BigQuery Append-Only Journal',
      subtitle: 'Write-Once Provenance Ledger',
      description:
        'Batch event tables are immutable write-once tables. Historical telemetry cannot be updated or deleted. Corrections are recorded as compensating events.',
      icon: FileText,
      badge: 'Write-Once Append-Only',
    },
    {
      title: 'Google Cloud Secret Manager',
      subtitle: 'Zero Hardcoded Secrets',
      description:
        'Gemini API keys, service accounts, and database credentials are dynamically injected at runtime via Secret Manager, never bundled in frontend assets.',
      icon: ShieldCheck,
      badge: 'Runtime Secret Accessor',
    },
  ];

  const threatZones = [
    {
      zone: '1. Input Surfaces',
      risk: 'Malicious farmer payload, crafted weight ticket, prompt injection via free-text delivery notes.',
      countermeasure:
        'Strict Zod schema validation; deterministic math executed upstream of LLM; free-text notes treated strictly as passive string data.',
    },
    {
      zone: '2. Planning & Reasoning',
      risk: 'Agent manipulated into skipping required MCP tools or hallucinating an adulteration finding.',
      countermeasure:
        'Deterministic state engine mandates tool invocation sequence; non-diagnostic output guardrails forbid adulteration claims.',
    },
    {
      zone: '3. Tool Execution',
      risk: 'Privilege escalation via MCP tools; invoking get_facility_history outside officer jurisdiction.',
      countermeasure:
        'Context-bound authorization token validated at MCP server boundary; parameter format validation on all facility IDs.',
    },
    {
      zone: '4. Memory & State',
      risk: 'Cross-role data leak: farmer discovering confidential regional anomaly investigation dossiers.',
      countermeasure:
        'Firestore security rules partition /cases/ to authenticated officer claim lookups only; client-side isolation.',
    },
    {
      zone: '5. Inter-System Comms',
      risk: 'BigQuery credential exposure; Gemini API token leaked in client bundle or network payload.',
      countermeasure:
        'All AI and BigQuery operations proxied via Cloud Run backend; Secret Manager IAM binding restricts token access.',
    },
  ];

  return (
    <section id="security" className="py-20 bg-[#F4F1E8] border-b border-[#26352D]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 mb-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#66734A]" />
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-[#66734A] font-bold">
              Operational Security & Data Integrity
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#202521] tracking-tight font-sans">
            Built like a system that handles sensitive operational data.
          </h2>
          <p className="mt-3 text-base sm:text-lg text-[#202521]/80 leading-relaxed font-normal">
            Food safety enforcement data requires strict legal defensibility, non-repudiation, and institutional access control. MilkyWay implements zero-trust architecture across all ingestion and investigation layers.
          </p>
        </div>

        {/* Tab Controls - Sleek Pills */}
        <div className="flex items-center gap-2.5 mb-8 border-b border-[#26352D]/10 pb-4">
          <button
            onClick={() => setActiveTab('architecture')}
            className={`px-5 py-2.5 text-xs font-mono font-bold rounded-full transition-all cursor-pointer shadow-xs ${
              activeTab === 'architecture'
                ? 'bg-[#26352D] text-[#FFFDF7] shadow-md scale-102'
                : 'bg-[#FFFDF7] text-[#202521] border border-[#26352D]/15 hover:bg-[#D8D3C7]/60'
            }`}
          >
            Security Architecture Pillars
          </button>
          <button
            onClick={() => setActiveTab('threat-model')}
            className={`px-5 py-2.5 text-xs font-mono font-bold rounded-full transition-all cursor-pointer shadow-xs ${
              activeTab === 'threat-model'
                ? 'bg-[#26352D] text-[#FFFDF7] shadow-md scale-102'
                : 'bg-[#FFFDF7] text-[#202521] border border-[#26352D]/15 hover:bg-[#D8D3C7]/60'
            }`}
          >
            5-Zone Threat Modeling Matrix
          </button>
        </div>

        {activeTab === 'architecture' ? (
          /* 6 Architecture Pillars */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityPillars.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="bg-[#FFFDF7] border border-[#26352D]/10 rounded-2xl p-6 hover:border-[#66734A]/40 transition-all hover:shadow-md flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-xl bg-[#26352D] text-[#FFFDF7] flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono text-[#66734A] bg-[#66734A]/10 px-2.5 py-0.5 rounded-full font-bold border border-[#66734A]/20">
                        {p.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#202521] font-sans mb-1">
                      {p.title}
                    </h3>
                    <span className="text-xs font-mono text-[#8A6A4A] block mb-3 font-semibold">
                      {p.subtitle}
                    </span>
                    <p className="text-xs text-[#202521]/80 leading-relaxed font-normal">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#26352D]/8 flex items-center gap-1.5 text-[11px] font-mono text-[#66734A] font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified Compliance Rule</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Threat Model Summary Table */
          <div className="bg-[#FFFDF7] border border-[#26352D]/15 rounded-3xl overflow-hidden shadow-md">
            <div className="p-5 bg-[#26352D] text-[#FFFDF7] flex items-center justify-between text-xs font-mono">
              <span className="font-bold uppercase tracking-wider">
                Agentic Threat Summary Table (OWASP Top 10 & LLM Standard)
              </span>
              <span className="text-[#D8D3C7] bg-white/10 px-3 py-1 rounded-full text-[10px] font-semibold">
                5 Security Threat Zones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans">
                <thead className="bg-[#D8D3C7]/40 border-b border-[#26352D]/15 text-[#202521] font-mono">
                  <tr>
                    <th className="p-4 font-bold uppercase text-[11px]">Threat Zone</th>
                    <th className="p-4 font-bold uppercase text-[11px]">Identified Vulnerability Risk</th>
                    <th className="p-4 font-bold uppercase text-[11px]">Engineered Countermeasure</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26352D]/10 font-mono text-[11px]">
                  {threatZones.map((tz) => (
                    <tr key={tz.zone} className="hover:bg-[#F4F1E8] transition-colors">
                      <td className="p-4 font-bold text-[#202521] align-top whitespace-nowrap">
                        {tz.zone}
                      </td>
                      <td className="p-4 text-[#B78632] align-top font-medium">
                        {tz.risk}
                      </td>
                      <td className="p-4 text-[#202521] font-sans text-xs align-top leading-relaxed">
                        {tz.countermeasure}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
