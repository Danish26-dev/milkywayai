import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bot,
  Layers,
  Building2,
  Truck,
  Scale,
  Clock,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  FileSearch,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { auth } from '../../lib/firebase';

interface BatchSearchData {
  batchId: string;
  batchCode: string;
  status: string;
  origin: {
    facilityId: string;
    name: string;
    location: string;
  };
  quantity: {
    initialLitres: number;
    currentLitres: number;
    unaccountedDiscrepancyLitres: number;
  };
  timeline: Array<{
    eventId: string;
    eventType: string;
    timestamp: string;
    facilityId: string;
    facilityName: string;
    quantityLitres: number;
    vehicleId?: string;
    latitude?: number;
    longitude?: number;
  }>;
  facilities: Array<{
    facilityId: string;
    name: string;
    type: string;
    location: string;
  }>;
  vehicles: Array<{
    vehicleId: string;
    registrationNumber: string;
    capacityLitres: number;
    status: string;
  }>;
  anomalies: Array<{
    anomalyId: string;
    anomalyType: string;
    severity: string;
    observedValue: number;
    expectedValue: number;
    differenceValue: number;
    evidence: string;
    detectedAt: string;
    status: string;
  }>;
  associatedCaseId: string | null;
}

interface InvestigationStep {
  name: string;
  label: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'ERROR';
  details?: string;
}

const INITIAL_STEPS: InvestigationStep[] = [
  { name: 'trace_batch', label: 'Tracing batch', status: 'PENDING' },
  { name: 'get_facility_history', label: 'Checking facility history', status: 'PENDING' },
  { name: 'get_vehicle_history', label: 'Checking vehicle history', status: 'PENDING' },
  { name: 'get_related_batches', label: 'Finding related batches', status: 'PENDING' },
  { name: 'correlate_evidence', label: 'Correlating evidence', status: 'PENDING' }
];

export const BatchSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialQuery = searchParams.get('q') || searchParams.get('batch') || '';

  const [inputQuery, setInputQuery] = useState(initialQuery || 'MW-10482');
  const [activeQuery, setActiveQuery] = useState(initialQuery || '');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [batchData, setBatchData] = useState<BatchSearchData | null>(null);

  // Investigation Execution State
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [investigationSteps, setInvestigationSteps] = useState<InvestigationStep[]>(INITIAL_STEPS);
  const [investigationResult, setInvestigationResult] = useState<any | null>(null);
  const [investigationError, setInvestigationError] = useState<string | null>(null);

  // Auto-search on initial load if query exists
  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const executeSearch = async (queryToSearch: string) => {
    const q = queryToSearch.trim();
    if (!q) return;

    setIsSearching(true);
    setSearchError(null);
    setBatchData(null);
    setInvestigationResult(null);
    setInvestigationError(null);
    setInvestigationSteps(INITIAL_STEPS);
    setActiveQuery(q);
    setSearchParams({ q });

    try {
      let token: string | null = null;
      try {
        const u = auth.currentUser;
        if (u) token = await u.getIdToken();
      } catch (e) {
        // No token; server will reject unauthenticated requests.
      }

      const res = await fetch(`/api/batches/search?q=${encodeURIComponent(q)}`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `No batch records located matching "${q}"`);
      }

      const json = await res.json();
      setBatchData(json.batch);
    } catch (err: any) {
      console.error('Batch search error:', err);
      setSearchError(err.message || 'Failed to search batch');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(inputQuery);
  };

  /**
   * Start Autonomous Investigation with Real Backend SSE
   */
  const handleStartInvestigation = async () => {
    if (!batchData) return;

    setIsInvestigating(true);
    setInvestigationError(null);
    setInvestigationResult(null);
    setInvestigationSteps(INITIAL_STEPS.map(s => ({ ...s, status: 'PENDING' })));

    let token: string | null = null;
    try {
      const u = auth.currentUser;
      if (u) token = await u.getIdToken();
    } catch (e) {
      // No token; server will reject unauthenticated requests.
    }

    try {
      // Connect to Server-Sent Events (SSE) streaming endpoint
      const sseUrl = `/api/investigations/stream-investigate?batchId=${encodeURIComponent(batchData.batchId)}`;
      const eventSource = new EventSource(sseUrl);

      eventSource.addEventListener('step', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          const { step, status, details } = payload;

          setInvestigationSteps(prev => prev.map(s => {
            if (s.name === step || s.label.toLowerCase().includes(step.replace(/_/g, ' '))) {
              return {
                ...s,
                status: status === 'ACTIVE' ? 'ACTIVE' : status === 'COMPLETED' ? 'COMPLETED' : 'ERROR',
                details: details || s.details
              };
            }
            return s;
          }));
        } catch (err) {
          console.error('Error parsing SSE step:', err);
        }
      });

      eventSource.addEventListener('complete', (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          setInvestigationResult(payload.case);
          setInvestigationSteps(prev => prev.map(s => ({ ...s, status: 'COMPLETED' })));
          setIsInvestigating(false);
          eventSource.close();
        } catch (err) {
          console.error('Error parsing SSE complete:', err);
          setIsInvestigating(false);
          eventSource.close();
        }
      });

      eventSource.addEventListener('error', async (e) => {
        eventSource.close();
        // Fallback to synchronous POST if SSE is blocked in iframe/network
        console.warn('SSE disconnected, falling back to POST /api/investigations/execute');
        try {
          const postRes = await fetch('/api/investigations/execute', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ batchId: batchData.batchId })
          });

          if (!postRes.ok) {
            const errBody = await postRes.json().catch(() => ({}));
            throw new Error(errBody.error || 'Investigation execution failed');
          }

          const postData = await postRes.json();
          setInvestigationResult(postData.case);
          setInvestigationSteps(prev => prev.map(s => ({ ...s, status: 'COMPLETED' })));
        } catch (fallbackErr: any) {
          setInvestigationError(fallbackErr.message || 'Investigation agent encountered a temporary error.');
        } finally {
          setIsInvestigating(false);
        }
      });

    } catch (err: any) {
      console.error('Investigation failed to start:', err);
      setInvestigationError(err.message || 'Failed to start investigation');
      setIsInvestigating(false);
    }
  };

  const isSurplus = (batchData?.quantity.unaccountedDiscrepancyLitres ?? 0) > 0;
  const isLoss = (batchData?.quantity.unaccountedDiscrepancyLitres ?? 0) < 0;

  return (
    <div className="space-y-6">
      {/* Header & Search Bar */}
      <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#202521]/15 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-[#26352D]" />
              <h1 className="text-xl font-bold font-sans text-[#202521]">
                Batch Search & Evidence Dossier
              </h1>
            </div>
            <p className="text-xs text-[#202521]/70 mt-1">
              Search any batch in the append-only BigQuery journal to inspect chain-of-custody, transit logs, and trigger autonomous investigations.
            </p>
          </div>

          {/* Preset Quick Search Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono text-[#202521]/60 uppercase">Quick Lookup:</span>
            {['MW-10482', 'MW-10483', 'MW-10484', 'MW-10485'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setInputQuery(code);
                  executeSearch(code);
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer border ${
                  activeQuery === code
                    ? 'bg-[#26352D] text-[#FFFDF7] border-[#26352D]'
                    : 'bg-[#F4F1E8] text-[#202521] border-[#202521]/15 hover:bg-[#E5E0D0]'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#202521]/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Enter batch identifier (e.g. MW-10482 or BATCH-2026-10482)..."
              className="w-full pl-9 pr-4 py-2.5 bg-[#F4F1E8]/50 border border-[#202521]/20 rounded-lg text-xs font-mono focus:outline-hidden focus:border-[#26352D] focus:bg-[#FFFDF7]"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-5 py-2.5 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-mono font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            <span>Search Batch</span>
          </button>
        </form>
      </div>

      {/* Error state */}
      {searchError && (
        <div className="p-4 bg-[#9E4939]/10 border border-[#9E4939]/30 rounded-xl text-xs text-[#9E4939] flex items-center gap-3">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{searchError}</span>
        </div>
      )}

      {/* Initial Empty State */}
      {!batchData && !isSearching && !searchError && (
        <div className="p-12 text-center bg-[#FFFDF7] rounded-xl border border-[#202521]/15">
          <Layers className="w-8 h-8 text-[#202521]/30 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#202521]">Enter Batch ID to Query Journal</h3>
          <p className="text-xs text-[#202521]/60 mt-1 max-w-md mx-auto">
            Try searching for <span className="font-mono font-bold text-[#202521]">MW-10482</span> to inspect the mass-balance anomaly detected at Anand Collection Center.
          </p>
        </div>
      )}

      {/* Results View */}
      {batchData && (
        <div className="space-y-6">
          {/* 1. Batch Overview & Top Action Bar */}
          <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#202521]/15 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold font-mono text-[#202521]">
                    {batchData.batchCode}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      batchData.status === 'SEALED_FOR_INSPECTION'
                        ? 'bg-[#9E4939] text-[#FFFDF7]'
                        : batchData.status === 'UNDER_ACTIVE_INVESTIGATION'
                        ? 'bg-[#B78632] text-[#FFFDF7]'
                        : batchData.status === 'ANOMALY_FLAGGED'
                        ? 'bg-[#8A6A4A] text-[#FFFDF7]'
                        : 'bg-[#66734A]/10 text-[#66734A]'
                    }`}
                  >
                    {batchData.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="text-xs text-[#202521]/70 mt-1 font-mono">
                  Origin: {batchData.origin.name} ({batchData.origin.location}) • Batch ID: {batchData.batchId}
                </div>
              </div>

              {/* The "Investigate" Action Button */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleStartInvestigation}
                  disabled={isInvestigating}
                  className="px-5 py-2.5 rounded-lg bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-mono font-bold shadow-xs transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isInvestigating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#E0C068]" />
                  ) : (
                    <Bot className="w-4 h-4 text-[#E0C068]" />
                  )}
                  <span>{isInvestigating ? 'Investigating...' : 'Investigate'}</span>
                </button>

                {batchData.associatedCaseId && (
                  <Link
                    to={`/app/investigations/${batchData.associatedCaseId}`}
                    className="px-4 py-2.5 rounded-lg bg-[#FFFDF7] border border-[#202521]/20 hover:bg-[#F4F1E8] text-[#202521] text-xs font-mono font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <FileSearch className="w-3.5 h-3.5 text-[#66734A]" />
                    <span>View Existing Case</span>
                  </Link>
                )}
              </div>
            </div>

            {/* Live Investigation Loading State & Real-time SSE Steps */}
            {(isInvestigating || investigationResult || investigationError) && (
              <div className="mt-6 p-4 rounded-xl bg-[#F4F1E8]/70 border border-[#202521]/15">
                <div className="flex items-center justify-between pb-3 border-b border-[#202521]/10">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-[#26352D]" />
                    <span className="text-xs font-mono font-bold text-[#202521]">
                      ADK Investigation Agent Execution
                    </span>
                  </div>
                  {isInvestigating && (
                    <span className="text-[10px] font-mono text-[#B78632] flex items-center gap-1 font-semibold animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      AUTONOMOUS MCP WORKFLOW RUNNING
                    </span>
                  )}
                  {investigationResult && (
                    <span className="text-[10px] font-mono text-[#66734A] flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="w-3 h-3" />
                      INVESTIGATION BRIEF GENERATED
                    </span>
                  )}
                </div>

                {/* The 5 Real-time Steps */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 mt-3">
                  {investigationSteps.map((step, idx) => {
                    const isPending = step.status === 'PENDING';
                    const isActive = step.status === 'ACTIVE';
                    const isDone = step.status === 'COMPLETED';
                    const isErr = step.status === 'ERROR';

                    return (
                      <div
                        key={step.name}
                        className={`p-2.5 rounded-lg border text-xs font-mono transition-all ${
                          isActive
                            ? 'bg-[#B78632]/10 border-[#B78632] text-[#202521]'
                            : isDone
                            ? 'bg-[#66734A]/10 border-[#66734A]/30 text-[#66734A]'
                            : isErr
                            ? 'bg-[#9E4939]/10 border-[#9E4939]/30 text-[#9E4939]'
                            : 'bg-[#FFFDF7] border-[#202521]/10 text-[#202521]/50'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          {isActive && <Loader2 className="w-3 h-3 animate-spin text-[#B78632]" />}
                          {isDone && <CheckCircle2 className="w-3 h-3 text-[#66734A]" />}
                          {isPending && <span className="text-[10px] font-bold text-[#202521]/40">{idx + 1}.</span>}
                          <span className={`text-[11px] font-bold ${isActive ? 'text-[#B78632]' : ''}`}>
                            {step.label}
                          </span>
                        </div>
                        {step.details && (
                          <div className="text-[9px] text-[#202521]/70 leading-tight line-clamp-2">
                            {step.details}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Error Banner */}
                {investigationError && (
                  <div className="mt-3 p-3 bg-[#9E4939]/10 border border-[#9E4939]/30 rounded-lg text-xs text-[#9E4939] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{investigationError}</span>
                  </div>
                )}

                {/* Investigation Result Brief Snippet */}
                {investigationResult && (
                  <div className="mt-4 p-4 bg-[#FFFDF7] rounded-lg border border-[#66734A]/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#B78632]" />
                        <span className="text-xs font-mono font-bold text-[#202521]">
                          Investigation Brief Complete ({investigationResult.caseNumber || 'Case Record'})
                        </span>
                      </div>
                      <Link
                        to={`/app/investigations/${investigationResult.id}`}
                        className="inline-flex items-center gap-1 text-xs font-mono font-bold text-[#26352D] hover:underline"
                      >
                        <span>Open Case Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <p className="text-xs text-[#202521]/80 mt-2 font-normal">
                      {investigationResult.investigationBrief?.summary || 'Autonomous agent verified discrepancies across facility weighbridges and correlated timestamp velocities.'}
                    </p>
                    <div className="mt-2 text-[10px] font-mono text-[#202521]/60">
                      Recommendation: {investigationResult.investigationBrief?.inspectionRecommendation || 'Target physical inspection at high-variance facility weighbridge.'}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. Quantity & Mass-Balance Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#FFFDF7] p-5 rounded-xl border border-[#202521]/15">
              <span className="text-[10px] font-mono uppercase text-[#202521]/60 block font-bold">
                Origin Intake Quantity
              </span>
              <span className="text-2xl font-bold font-mono text-[#202521] block mt-1">
                {batchData.quantity.initialLitres.toLocaleString()} L
              </span>
              <span className="text-xs text-[#202521]/70 mt-1 block">
                {batchData.origin.name}
              </span>
            </div>

            <div className="bg-[#FFFDF7] p-5 rounded-xl border border-[#202521]/15">
              <span className="text-[10px] font-mono uppercase text-[#202521]/60 block font-bold">
                Current Recorded Quantity
              </span>
              <span className="text-2xl font-bold font-mono text-[#202521] block mt-1">
                {batchData.quantity.currentLitres.toLocaleString()} L
              </span>
              <span className="text-xs text-[#202521]/70 mt-1 block">
                Latest verified journal event
              </span>
            </div>

            <div className="bg-[#FFFDF7] p-5 rounded-xl border border-[#202521]/15">
              <span className="text-[10px] font-mono uppercase text-[#202521]/60 block font-bold">
                Unaccounted Discrepancy
              </span>
              <div className="flex items-center gap-2 mt-1">
                {isSurplus && <TrendingUp className="w-5 h-5 text-[#9E4939]" />}
                {isLoss && <TrendingDown className="w-5 h-5 text-[#8A6A4A]" />}
                <span
                  className={`text-2xl font-bold font-mono ${
                    isSurplus ? 'text-[#9E4939]' : isLoss ? 'text-[#8A6A4A]' : 'text-[#66734A]'
                  }`}
                >
                  {batchData.quantity.unaccountedDiscrepancyLitres !== 0
                    ? `${batchData.quantity.unaccountedDiscrepancyLitres > 0 ? '+' : ''}${batchData.quantity.unaccountedDiscrepancyLitres.toLocaleString()} L`
                    : '0 L (Balanced)'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#202521]/60 mt-1 block">
                {isSurplus ? 'Unmetered surplus flagged' : isLoss ? 'Excess process shrinkage' : 'Within normal tolerance'}
              </span>
            </div>
          </div>

          {/* 3. Anomalies (Non-Diagnostic) */}
          <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#202521]/15">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#9E4939]" />
                <h2 className="text-base font-bold text-[#202521] font-sans">
                  Supply-Chain Anomalies ({batchData.anomalies.length})
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#D8D3C7] bg-[#202521] px-2 py-0.5 rounded">
                DETERMINISTIC ENGINE
              </span>
            </div>

            {batchData.anomalies.length === 0 ? (
              <div className="py-6 text-center text-xs font-mono text-[#66734A] flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                <span>Zero unexplained discrepancies detected in journal for this batch.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {batchData.anomalies.map((anom) => (
                  <div
                    key={anom.anomalyId}
                    className="p-4 rounded-lg bg-[#F4F1E8]/50 border border-[#202521]/15 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#202521]">
                          {anom.anomalyType.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                            anom.severity === 'CRITICAL'
                              ? 'bg-[#9E4939] text-[#FFFDF7]'
                              : 'bg-[#B78632] text-[#FFFDF7]'
                          }`}
                        >
                          {anom.severity}
                        </span>
                      </div>
                      <p className="text-xs text-[#202521]/80 mt-1">
                        {anom.evidence}
                      </p>
                      <div className="text-[10px] font-mono text-[#202521]/60 mt-1">
                        Observed: {anom.observedValue.toLocaleString()} | Expected: {anom.expectedValue.toLocaleString()} | Divergence: {anom.differenceValue > 0 ? '+' : ''}{anom.differenceValue.toLocaleString()}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="text-[10px] font-mono text-[#202521]/50 block">
                        Detected At
                      </span>
                      <span className="text-xs font-mono text-[#202521]">
                        {new Date(anom.detectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Timeline */}
          <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs p-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#202521]/15">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#26352D]" />
                <h2 className="text-base font-bold text-[#202521] font-sans">
                  Chain-of-Custody Timeline ({batchData.timeline.length} Events)
                </h2>
              </div>
              <span className="text-[10px] font-mono text-[#66734A] bg-[#66734A]/10 px-2 py-0.5 rounded font-bold">
                APPEND-ONLY
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="border-b border-[#202521]/10 text-[10px] text-[#202521]/60">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Event Type</th>
                    <th className="py-2.5 px-3">Facility</th>
                    <th className="py-2.5 px-3 text-right">Quantity</th>
                    <th className="py-2.5 px-3">Vehicle</th>
                    <th className="py-2.5 px-3">Event ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202521]/10 text-[11px]">
                  {batchData.timeline.map((evt) => (
                    <tr key={evt.eventId} className="hover:bg-[#F4F1E8]/40">
                      <td className="py-2.5 px-3 text-[#202521]/70">
                        {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#202521]">
                        {evt.eventType.replace(/_/g, ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-[#202521]">
                        {evt.facilityName}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#202521]">
                        {evt.quantityLitres.toLocaleString()} L
                      </td>
                      <td className="py-2.5 px-3 text-[#202521]/70">
                        {evt.vehicleId || '—'}
                      </td>
                      <td className="py-2.5 px-3 text-[10px] text-[#202521]/50">
                        {evt.eventId}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 5. Facilities & Vehicles Grids */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Facilities */}
            <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs p-5">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#202521]/15">
                <Building2 className="w-4 h-4 text-[#26352D]" />
                <h3 className="text-sm font-bold text-[#202521] font-sans">
                  Touched Facilities ({batchData.facilities.length})
                </h3>
              </div>
              <div className="space-y-2.5">
                {batchData.facilities.map((fac) => (
                  <div key={fac.facilityId} className="p-3 rounded-lg bg-[#F4F1E8]/50 border border-[#202521]/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#202521]">{fac.name}</span>
                      <span className="text-[10px] font-mono bg-[#202521]/10 text-[#202521] px-1.5 py-0.5 rounded">
                        {fac.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#202521]/70 mt-1 font-mono">
                      {fac.location} • ID: {fac.facilityId}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vehicles */}
            <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs p-5">
              <div className="flex items-center gap-2 pb-3 mb-3 border-b border-[#202521]/15">
                <Truck className="w-4 h-4 text-[#26352D]" />
                <h3 className="text-sm font-bold text-[#202521] font-sans">
                  Assigned Tankers ({batchData.vehicles.length})
                </h3>
              </div>
              <div className="space-y-2.5">
                {batchData.vehicles.map((veh) => (
                  <div key={veh.vehicleId} className="p-3 rounded-lg bg-[#F4F1E8]/50 border border-[#202521]/10">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold text-[#202521]">{veh.registrationNumber}</span>
                      <span className="text-[10px] font-mono text-[#66734A] bg-[#66734A]/10 px-1.5 py-0.5 rounded">
                        {veh.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#202521]/70 mt-1 font-mono">
                      Capacity: {veh.capacityLitres.toLocaleString()} L • ID: {veh.vehicleId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
