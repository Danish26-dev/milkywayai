/**
 * MilkyWay Investigation Agent Console
 * 
 * Interactive decision-support console powered by Google ADK & Gemini with MCP tools.
 * 
 * Features:
 * - Autonomous multi-step tool execution with real-time trace telemetry.
 * - Structured investigation brief with mass-balance metrics and confidence scoring.
 * - Multi-turn follow-up queries with session persistence.
 * - Strict non-diagnostic disclaimer enforcement.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Bot,
  Send,
  Sparkles,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Database,
  Truck,
  Building2,
  Layers,
  ChevronRight,
  Terminal,
  RefreshCw,
  Info,
  ArrowRight,
  FileSearch,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface McpToolRecord {
  tool: string;
  args: Record<string, any>;
  timestamp: string;
  duration_ms: number;
  success: boolean;
  resultSummary?: string;
  error?: string;
}

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  toolCalls?: McpToolRecord[];
  timestamp: string;
}

export const InvestigationAgentPage: React.FC = () => {
  const { officer } = useAuth();
  const [searchParams] = useSearchParams();
  const initialBatch = searchParams.get('batch') || '';

  const [sessionId, setSessionId] = useState<string>(() => `session-${Date.now()}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeToolAudit, setActiveToolAudit] = useState<McpToolRecord[]>([]);
  const [selectedToolRecord, setSelectedToolRecord] = useState<McpToolRecord | null>(null);
  const [agentStatus, setAgentStatus] = useState<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch status of Agent & MCP Server
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch('/api/agent/status', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setAgentStatus(data);
        }
      } catch (err) {
        console.warn('Failed to fetch agent status:', err);
      }
    };
    fetchStatus();
  }, []);

  // Auto-trigger investigation if batch param passed in URL
  useEffect(() => {
    if (initialBatch && messages.length === 0) {
      handleSendMessage(`Investigate batch ${initialBatch}.`);
    }
  }, [initialBatch]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    setInputText('');
    setLoading(true);

    const userMsg: ChatMessage = {
      role: 'user',
      content: text,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMsg]);

    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'demo-token'}`
        },
        body: JSON.stringify({
          sessionId,
          message: text
        })
      });

      if (!res.ok) {
        throw new Error(`HTTP error ${res.status}`);
      }

      const data = await res.json();

      const modelMsg: ChatMessage = {
        role: 'model',
        content: data.message,
        toolCalls: data.toolCalls,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, modelMsg]);

      if (data.toolCalls && data.toolCalls.length > 0) {
        setActiveToolAudit(prev => [...prev, ...data.toolCalls]);
      }
    } catch (err: any) {
      console.error('Agent turn failed:', err);
      setMessages(prev => [
        ...prev,
        {
          role: 'model',
          content: `Unable to complete investigation turn: ${err.message}. Please check connection or retry.`,
          timestamp: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const resetSession = () => {
    const newId = `session-${Date.now()}`;
    setSessionId(newId);
    setMessages([]);
    setActiveToolAudit([]);
    setSelectedToolRecord(null);
  };

  // Helper to parse sections from the structured brief
  const parseBrief = (content: string) => {
    const isBrief = content.includes('Batch:') && content.includes('Primary anomaly:');
    if (!isBrief) return null;

    const extractSection = (header: string, nextHeaders: string[]): string => {
      const idx = content.indexOf(header);
      if (idx === -1) return '';
      const start = idx + header.length;
      let end = content.length;
      for (const nextH of nextHeaders) {
        const nextIdx = content.indexOf(nextH, start);
        if (nextIdx !== -1 && nextIdx < end) {
          end = nextIdx;
        }
      }
      return content.substring(start, end).trim();
    };

    const batch = extractSection('Batch:', ['Primary anomaly:']);
    const primaryAnomaly = extractSection('Primary anomaly:', ['Observed:']);
    const observed = extractSection('Observed:', ['Expected:']);
    const expected = extractSection('Expected:', ['Unaccounted:']);
    const unaccounted = extractSection('Unaccounted:', ['Evidence:']);
    const evidence = extractSection('Evidence:', ['Interpretation:']);
    const interpretation = extractSection('Interpretation:', ['Recommended action:']);
    const recommendedAction = extractSection('Recommended action:', ['Evidence confidence:']);
    const evidenceConfidence = extractSection('Evidence confidence:', ['Disclaimer:']);
    const disclaimer = extractSection('Disclaimer:', []);

    return {
      batch,
      primaryAnomaly,
      observed,
      expected,
      unaccounted,
      evidence,
      interpretation,
      recommendedAction,
      evidenceConfidence,
      disclaimer
    };
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/10 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#202521] text-[#E0C068] flex items-center justify-center shadow-sm">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold font-serif text-[#202521]">MilkyWay Investigation Agent</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#2E4057]/10 text-[#2E4057] border border-[#2E4057]/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Google ADK & Gemini
                </span>
              </div>
              <p className="text-sm text-[#202521]/70 mt-1">
                Autonomous supply-chain evidence correlation & physical inspection prioritization using the MilkyWay MCP Server.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-xs text-[#202521]/60 font-mono">
              <span className="flex items-center gap-1.5 text-[#3D6E50] font-semibold">
                <span className="w-2 h-2 rounded-full bg-[#3D6E50] animate-pulse" />
                4 MCP Tools Connected
              </span>
              <span>Model: gemini-3.8-flash (Fallback Ladder)</span>
            </div>
            <button
              onClick={resetSession}
              className="px-3 py-2 rounded-lg border border-[#202521]/15 bg-white text-xs font-semibold text-[#202521] hover:bg-[#F4F1E8] transition-colors flex items-center gap-1.5 shadow-sm"
              title="Reset conversation and start fresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Session
            </button>
          </div>
        </div>

        {/* Non-diagnostic Alert Banner */}
        <div className="mt-4 p-3 bg-[#E0C068]/15 border border-[#E0C068]/40 rounded-lg flex items-start gap-3 text-xs text-[#202521]/80">
          <Info className="w-4 h-4 text-[#8C6D1F] flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-[#8C6D1F]">Non-Diagnostic Regulatory Constraint: </span>
            The investigation agent reasons over precomputed anomalies to prioritize inspection resources. It does not make food-safety or adulteration determinations, which require physical inspection and laboratory testing.
          </div>
        </div>
      </div>

      {/* Main Grid: Chat Stream (Left 7 cols) & MCP Tool Trace Telemetry (Right 5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Multi-Turn Conversation */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/10 flex flex-col h-[650px] shadow-sm overflow-hidden">
            
            {/* Conversation Messages Container */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-[#F4F1E8] border border-[#202521]/10 flex items-center justify-center text-[#2E4057]">
                    <FileSearch className="w-7 h-7" />
                  </div>
                  <div className="max-w-md space-y-2">
                    <h3 className="font-serif font-bold text-lg text-[#202521]">Ready for Investigation Inquiry</h3>
                    <p className="text-xs text-[#202521]/70 leading-relaxed">
                      Ask the agent to investigate a milk batch. The agent will autonomously trace the append-only journal, inspect facility throughput, check tanker transit legs, and correlate related batches.
                    </p>
                  </div>

                  {/* Sample Query Buttons */}
                  <div className="w-full max-w-lg pt-3">
                    <p className="text-[11px] font-semibold text-[#202521]/50 uppercase tracking-wider mb-2 text-left">
                      Recommended Officer Inquiries
                    </p>
                    <div className="grid grid-cols-1 gap-2 text-left">
                      <button
                        onClick={() => handleSendMessage('Investigate batch MW-10482.')}
                        className="p-2.5 rounded-lg border border-[#202521]/10 bg-white hover:border-[#8C3A33]/40 hover:bg-[#8C3A33]/5 text-xs text-[#202521] transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#8C3A33]" />
                          <span className="font-semibold text-[#8C3A33]">Investigate batch MW-10482.</span>
                          <span className="text-[#202521]/50 text-[11px]">(330 L Mass-Balance Loss)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#202521]/40 group-hover:text-[#8C3A33] transition-colors" />
                      </button>

                      <button
                        onClick={() => handleSendMessage('Investigate batch BATCH-DEMO-003-ANOMALOUS.')}
                        className="p-2.5 rounded-lg border border-[#202521]/10 bg-white hover:border-[#8C3A33]/40 hover:bg-[#8C3A33]/5 text-xs text-[#202521] transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#8C3A33]" />
                          <span className="font-semibold text-[#8C3A33]">Investigate batch BATCH-DEMO-003-ANOMALOUS.</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#202521]/40 group-hover:text-[#8C3A33] transition-colors" />
                      </button>

                      <button
                        onClick={() => handleSendMessage('Investigate batch BATCH-DEMO-001-CLEAN.')}
                        className="p-2.5 rounded-lg border border-[#202521]/10 bg-white hover:border-[#3D6E50]/40 hover:bg-[#3D6E50]/5 text-xs text-[#202521] transition-all flex items-center justify-between group shadow-2xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#3D6E50]" />
                          <span className="font-semibold text-[#3D6E50]">Investigate batch BATCH-DEMO-001-CLEAN.</span>
                          <span className="text-[#202521]/50 text-[11px]">(Compliant Baseline)</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#202521]/40 group-hover:text-[#3D6E50] transition-colors" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isUser = msg.role === 'user';
                const brief = !isUser ? parseBrief(msg.content) : null;

                return (
                  <div key={idx} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}>
                    <div className="flex items-center gap-2 text-[11px] text-[#202521]/60 px-1 font-mono">
                      {isUser ? (
                        <span>Food Safety Officer ({officer?.badgeNumber || 'FSO-01'})</span>
                      ) : (
                        <span className="flex items-center gap-1 font-semibold text-[#202521]">
                          <Bot className="w-3.5 h-3.5 text-[#2E4057]" />
                          MilkyWay Investigation Agent
                        </span>
                      )}
                      <span>•</span>
                      <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    {/* Message Body */}
                    <div
                      className={`rounded-xl p-4 text-sm max-w-full lg:max-w-2xl shadow-2xs ${
                        isUser
                          ? 'bg-[#202521] text-[#FFFDF7] rounded-tr-xs'
                          : 'bg-[#F4F1E8]/70 border border-[#202521]/10 text-[#202521] rounded-tl-xs'
                      }`}
                    >
                      {/* If response is structured brief, render high-contrast formatted dashboard card */}
                      {!isUser && brief ? (
                        <div className="space-y-4">
                          {/* Brief Header Banner */}
                          <div className="flex items-center justify-between pb-3 border-b border-[#202521]/10">
                            <div>
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#202521]/60">Target Batch</span>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="font-mono font-bold text-base text-[#202521]">{brief.batch}</span>
                                <Link
                                  to={`/app/batches/${encodeURIComponent(brief.batch)}`}
                                  className="text-[11px] text-[#2E4057] underline hover:text-[#202521]"
                                >
                                  View Journal
                                </Link>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-[#202521]/60">Recommended Action</span>
                              <div className="mt-0.5">
                                {brief.recommendedAction.includes('INSPECT NOW') ? (
                                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#8C3A33] text-white tracking-wide inline-flex items-center gap-1 shadow-xs">
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                    INSPECT NOW
                                  </span>
                                ) : brief.recommendedAction.includes('MONITOR') ? (
                                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#8C6D1F] text-white tracking-wide inline-flex items-center gap-1 shadow-xs">
                                    <Clock className="w-3.5 h-3.5" />
                                    MONITOR
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-[#3D6E50] text-white tracking-wide inline-flex items-center gap-1 shadow-xs">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    NO ACTION
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* 3 Metric Cards */}
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2.5 bg-white rounded-lg border border-[#202521]/10">
                              <div className="text-[10px] font-mono text-[#202521]/60">Observed Volume</div>
                              <div className="text-base font-bold font-mono text-[#202521] mt-0.5">{brief.observed}</div>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-[#202521]/10">
                              <div className="text-[10px] font-mono text-[#202521]/60">Expected Volume</div>
                              <div className="text-base font-bold font-mono text-[#202521] mt-0.5">{brief.expected}</div>
                            </div>
                            <div className="p-2.5 bg-white rounded-lg border border-[#202521]/10">
                              <div className="text-[10px] font-mono text-[#202521]/60">Unaccounted Loss</div>
                              <div className={`text-base font-bold font-mono mt-0.5 ${brief.unaccounted.includes('0') && !brief.unaccounted.includes('330') ? 'text-[#3D6E50]' : 'text-[#8C3A33]'}`}>
                                {brief.unaccounted}
                              </div>
                            </div>
                          </div>

                          {/* Primary Anomaly & Confidence Badge */}
                          <div className="flex items-center justify-between text-xs bg-white p-2.5 rounded-lg border border-[#202521]/10">
                            <div>
                              <span className="text-[#202521]/60 text-[11px]">Primary Anomaly: </span>
                              <span className="font-semibold text-[#202521]">{brief.primaryAnomaly}</span>
                            </div>
                            <div>
                              <span className="text-[#202521]/60 text-[11px]">Evidence Confidence: </span>
                              <span className="font-bold text-[#2E4057]">{brief.evidenceConfidence}</span>
                            </div>
                          </div>

                          {/* Evidence Bullets */}
                          <div className="space-y-1.5">
                            <div className="text-xs font-bold uppercase tracking-wider text-[#202521]/80 font-mono">
                              Verified Journal Evidence
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-[#202521]/10 text-xs space-y-1.5 text-[#202521]/90">
                              {brief.evidence.split('\n').filter(line => line.trim().length > 0).map((bullet, bIdx) => (
                                <div key={bIdx} className="flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#2E4057] flex-shrink-0 mt-1.5" />
                                  <span className="leading-relaxed">{bullet.replace(/^[*•-]\s*/, '')}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Interpretation */}
                          <div className="space-y-1.5">
                            <div className="text-xs font-bold uppercase tracking-wider text-[#202521]/80 font-mono">
                              Evidence Interpretation
                            </div>
                            <div className="bg-white p-3 rounded-lg border border-[#202521]/10 text-xs leading-relaxed text-[#202521]/90">
                              {brief.interpretation}
                            </div>
                          </div>

                          {/* Mandatory Disclaimer Box */}
                          <div className="p-3 bg-[#E0C068]/15 border border-[#E0C068]/40 rounded-lg text-[11px] text-[#202521]/80 leading-relaxed italic">
                            <span className="font-semibold text-[#8C6D1F] not-italic">Disclaimer: </span>
                            “{brief.disclaimer || 'MilkyWay identifies supply-chain anomalies and investigation signals. Physical inspection and laboratory testing are required to determine whether adulteration or another food-safety issue occurred.'}”
                          </div>
                        </div>
                      ) : (
                        /* Standard Text Response / Follow-up */
                        <div className="whitespace-pre-wrap leading-relaxed text-xs sm:text-sm">
                          {msg.content}
                        </div>
                      )}

                      {/* Tool Call Chips on Agent Message */}
                      {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-[#202521]/10 flex flex-wrap items-center gap-1.5">
                          <span className="text-[10px] font-mono text-[#202521]/50 uppercase tracking-wider">
                            Autonomous Tools:
                          </span>
                          {msg.toolCalls.map((t, tIdx) => (
                            <button
                              key={tIdx}
                              onClick={() => setSelectedToolRecord(t)}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-white border border-[#202521]/15 text-[#202521] hover:bg-[#F4F1E8] transition-colors flex items-center gap-1"
                            >
                              <Check className="w-2.5 h-2.5 text-[#3D6E50]" />
                              {t.tool} ({t.duration_ms}ms)
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator with Agent Execution State */}
              {loading && (
                <div className="flex flex-col items-start space-y-1.5 animate-pulse">
                  <div className="flex items-center gap-2 text-[11px] text-[#202521]/60 px-1 font-mono">
                    <Bot className="w-3.5 h-3.5 text-[#2E4057]" />
                    <span>MilkyWay Investigation Agent</span>
                  </div>
                  <div className="rounded-xl rounded-tl-xs p-4 bg-[#F4F1E8]/70 border border-[#202521]/10 text-xs text-[#202521] max-w-md space-y-2">
                    <div className="flex items-center gap-2 font-semibold">
                      <RefreshCw className="w-3.5 h-3.5 text-[#2E4057] animate-spin" />
                      Executing autonomous tool sequence...
                    </div>
                    <div className="space-y-1 text-[11px] text-[#202521]/70 font-mono">
                      <div>• Tracing batch lifecycle from BigQuery journal...</div>
                      <div>• Correlating facility records & tanker routes...</div>
                      <div>• Synthesizing evidence for food-safety officer...</div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Follow-Up Pills */}
            {messages.length > 0 && !loading && (
              <div className="px-4 py-2 bg-[#F4F1E8]/40 border-t border-[#202521]/5 flex items-center gap-2 overflow-x-auto text-[11px]">
                <span className="text-[#202521]/50 font-mono flex-shrink-0">Follow-up:</span>
                <button
                  onClick={() => handleSendMessage('Why did you prioritize Facility FAC-AMUL-03 for inspection?')}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#202521]/10 hover:border-[#202521]/30 text-[#202521] whitespace-nowrap transition-colors"
                >
                  Why prioritize FAC-AMUL-03?
                </button>
                <button
                  onClick={() => handleSendMessage('Check if the same vehicle appears in other anomalies.')}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#202521]/10 hover:border-[#202521]/30 text-[#202521] whitespace-nowrap transition-colors"
                >
                  Check vehicle history
                </button>
                <button
                  onClick={() => handleSendMessage('Summarize the related batches.')}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#202521]/10 hover:border-[#202521]/30 text-[#202521] whitespace-nowrap transition-colors"
                >
                  Correlate peer batches
                </button>
              </div>
            )}

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-[#202521]/10">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  placeholder="Ask the agent to investigate a batch or follow up (e.g. 'Investigate batch MW-10482')..."
                  className="flex-1 bg-[#F4F1E8]/50 border border-[#202521]/15 rounded-lg px-3.5 py-2.5 text-xs sm:text-sm text-[#202521] placeholder-[#202521]/40 focus:outline-none focus:border-[#202521]/40 focus:bg-white transition-all font-sans"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim() || loading}
                  className="px-4 py-2.5 rounded-lg bg-[#202521] text-[#FFFDF7] text-xs font-semibold hover:bg-[#353B36] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Column: MCP Tool Telemetry Trace & Details Drawer */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* MCP Telemetry Card */}
          <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/10 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#202521]/10">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-[#2E4057]" />
                <h2 className="font-serif font-bold text-sm text-[#202521]">MCP Tool Execution Trace</h2>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F4F1E8] border border-[#202521]/10 text-[#202521]/70">
                {activeToolAudit.length} Invocations
              </span>
            </div>

            <p className="text-[11px] text-[#202521]/70 leading-relaxed">
              Every factual claim in an investigation brief is grounded in read-only queries against the MilkyWay BigQuery journal.
            </p>

            {/* List of Executed Tools */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {activeToolAudit.length === 0 ? (
                <div className="p-4 rounded-lg bg-[#F4F1E8]/50 border border-dashed border-[#202521]/15 text-center text-xs text-[#202521]/60">
                  Tool invocations will appear here when an investigation begins.
                </div>
              ) : (
                activeToolAudit.map((record, rIdx) => (
                  <div
                    key={rIdx}
                    onClick={() => setSelectedToolRecord(record)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer text-xs ${
                      selectedToolRecord === record
                        ? 'border-[#2E4057] bg-[#2E4057]/5 shadow-xs'
                        : 'border-[#202521]/10 bg-white hover:border-[#202521]/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#202521] flex items-center gap-1.5">
                        {record.tool === 'trace_batch' && <Layers className="w-3.5 h-3.5 text-[#2E4057]" />}
                        {record.tool === 'get_facility_history' && <Building2 className="w-3.5 h-3.5 text-[#8C6D1F]" />}
                        {record.tool === 'get_vehicle_history' && <Truck className="w-3.5 h-3.5 text-[#3D6E50]" />}
                        {record.tool === 'get_related_batches' && <Database className="w-3.5 h-3.5 text-[#8C3A33]" />}
                        {record.tool}
                      </span>
                      <span className="text-[10px] font-mono text-[#202521]/50">{record.duration_ms}ms</span>
                    </div>

                    <div className="mt-1 text-[11px] text-[#202521]/70 truncate">
                      Args: {JSON.stringify(record.args)}
                    </div>

                    {record.resultSummary && (
                      <div className="mt-1.5 text-[11px] text-[#2E4057] font-medium bg-[#F4F1E8]/60 p-1.5 rounded border border-[#202521]/5">
                        {record.resultSummary}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Selected Tool Inspector Modal / Drawer */}
          {selectedToolRecord && (
            <div className="bg-[#FFFDF7] rounded-xl border border-[#2E4057]/40 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#202521]/10">
                <span className="text-xs font-bold font-mono text-[#2E4057]">
                  Inspect: {selectedToolRecord.tool}
                </span>
                <button
                  onClick={() => setSelectedToolRecord(null)}
                  className="text-xs text-[#202521]/60 hover:text-[#202521]"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-[#202521]/60">Arguments:</span>
                  <pre className="mt-1 p-2 rounded bg-[#202521] text-[#E0C068] text-[10px] overflow-x-auto">
                    {JSON.stringify(selectedToolRecord.args, null, 2)}
                  </pre>
                </div>
                <div>
                  <span className="text-[#202521]/60">Summary:</span>
                  <div className="mt-1 text-xs text-[#202521] font-sans">
                    {selectedToolRecord.resultSummary || 'Executed successfully'}
                  </div>
                </div>
                <div className="text-[10px] text-[#202521]/50">
                  Invoked at: {new Date(selectedToolRecord.timestamp).toISOString()}
                </div>
              </div>
            </div>
          )}

          {/* Connected Tools Architecture Summary */}
          <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/10 p-5 shadow-sm space-y-3">
            <h3 className="font-serif font-bold text-xs text-[#202521] uppercase tracking-wider">
              Connected MCP Investigation Tools
            </h3>
            <div className="space-y-2 text-xs text-[#202521]/80">
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#2E4057] mt-1.5" />
                <div>
                  <span className="font-semibold font-mono text-[#202521]">trace_batch(batch_id): </span>
                  Reconstructs chronological timeline, mass volume checkpoints, and deterministic anomalies.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C6D1F] mt-1.5" />
                <div>
                  <span className="font-semibold font-mono text-[#202521]">get_facility_history(facility_id): </span>
                  Audits throughput, historical loss variances, and past cases at processing plants.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#3D6E50] mt-1.5" />
                <div>
                  <span className="font-semibold font-mono text-[#202521]">get_vehicle_history(vehicle_id): </span>
                  Verifies GPS transit speeds, route integrity, and delivery volume discrepancies.
                </div>
              </div>
              <div className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#8C3A33] mt-1.5" />
                <div>
                  <span className="font-semibold font-mono text-[#202521]">get_related_batches(batch_id): </span>
                  Correlates peer batches sharing facilities or transit windows for systemic patterns.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
