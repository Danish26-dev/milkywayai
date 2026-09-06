import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  FileSearch,
  Scale,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Send,
  Lock,
  Layers,
  FileText,
  ListOrdered
} from 'lucide-react';
import { investigationService } from '../../services';
import { InvestigationCase, OfficerNote } from '../../types/models';
import { useAuth } from '../../context/AuthContext';

export const InvestigationDetailPage: React.FC = () => {
  const { caseId } = useParams<{ caseId: string }>();
  const { officer } = useAuth();
  const [caseData, setCaseData] = useState<InvestigationCase | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<OfficerNote['actionTaken']>('INTERNAL_REVIEW');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);
  const [escalateSuccess, setEscalateSuccess] = useState<boolean>(false);

  useEffect(() => {
    async function loadCase() {
      if (!caseId) return;
      setIsLoading(true);
      try {
        const c = await investigationService.getCaseById(caseId);
        setCaseData(c);
      } catch (err) {
        console.error('Failed to load investigation case:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadCase();
  }, [caseId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseData || !newNoteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      const added = await investigationService.addOfficerNote(caseData.id, {
        caseId: caseData.id,
        officerId: officer?.id || 'off-delhi-042',
        officerBadge: officer?.badgeNumber || 'FSO-IND-9021',
        officerName: officer?.displayName || 'P. Verma',
        noteText: newNoteText.trim(),
        actionTaken: selectedAction
      });

      setCaseData(prev => prev ? {
        ...prev,
        officerNotes: [...prev.officerNotes, added]
      } : null);
      setNewNoteText('');
    } catch (err) {
      console.error('Failed to append officer note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleEscalateInspection = async () => {
    if (!caseData) return;
    try {
      await investigationService.updateCaseStatus(
        caseData.id,
        'ESCALATED_TO_INSPECTION',
        officer?.id || 'off-delhi-042'
      );
      setCaseData(prev => prev ? { ...prev, status: 'ESCALATED_TO_INSPECTION' } : null);
      setEscalateSuccess(true);
      setTimeout(() => setEscalateSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to escalate case:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center text-xs font-mono text-[#202521]/60">
        Loading Investigation Case Dossier...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center bg-[#FFFDF7] rounded-xl border border-[#202521]/15">
        <h2 className="text-lg font-bold text-[#202521]">Case File Not Found</h2>
        <p className="text-xs text-[#202521]/70 mt-1 font-mono">
          No records located for identifier: {caseId}
        </p>
        <Link
          to="/app/investigations"
          className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-[#26352D] text-[#FFFDF7] text-xs font-bold rounded-lg"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Dossiers</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <div>
        <Link
          to="/app/investigations"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-[#202521]/70 hover:text-[#202521] mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Investigation Dossiers</span>
        </Link>

        {/* Case Header Card */}
        <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#202521]/15 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold font-mono text-[#202521]">
                {caseData.caseNumber}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  caseData.priority === 'IMMEDIATE'
                    ? 'bg-[#9E4939] text-[#FFFDF7]'
                    : caseData.priority === 'HIGH'
                    ? 'bg-[#B78632] text-[#FFFDF7]'
                    : 'bg-[#607481] text-[#FFFDF7]'
                }`}
              >
                {caseData.priority} Priority
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#F4F1E8] text-[#202521] border border-[#202521]/15">
                {caseData.status.replace(/_/g, ' ')}
              </span>
            </div>
            <div className="text-xs text-[#202521]/75 mt-1.5 font-sans flex flex-wrap items-center gap-3">
              <span>Target Facility: <strong>{caseData.facilityName}</strong></span>
              <span>•</span>
              <Link to={`/app/batches/${caseData.batchId}`} className="text-[#26352D] font-mono font-bold hover:underline">
                Batch: {caseData.batchCode}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {caseData.status !== 'ESCALATED_TO_INSPECTION' && (
              <button
                onClick={handleEscalateInspection}
                className="px-4 py-2 bg-[#9E4939] hover:bg-[#853c2e] text-[#FFFDF7] text-xs font-bold font-mono rounded-lg transition-colors cursor-pointer shadow-xs"
              >
                Escalate to Physical Inspection
              </button>
            )}
            {escalateSuccess && (
              <span className="text-xs font-mono text-[#66734A] font-bold">
                ✓ Case Escalated
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Discrepancy Metric & Investigation Brief */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Brief & Hypotheses (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Investigation Brief */}
          {caseData.brief ? (
            <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs p-6">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#202521]/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#26352D]" />
                  <h2 className="text-base font-bold text-[#202521] font-sans">
                    Investigation Brief
                  </h2>
                </div>
                <span className="text-[10px] font-mono text-[#66734A] bg-[#66734A]/10 px-2 py-0.5 rounded font-bold">
                  {caseData.brief.agentVersion}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-[#202521]/90 leading-relaxed font-normal">
                {caseData.brief.summary}
              </p>

              <div className="mt-4 p-3.5 rounded-lg bg-[#F4F1E8]/60 border border-[#202521]/10 text-xs text-[#202521]/80">
                <span className="font-bold text-[#26352D] block mb-1">
                  Deterministic Discrepancy Analysis:
                </span>
                <p className="font-normal">{caseData.brief.discrepancyAnalysis}</p>
              </div>

              {/* Hypotheses for Field Inspector */}
              <div className="mt-5">
                <span className="text-xs font-bold font-sans text-[#202521] uppercase tracking-wider block mb-2">
                  Hypotheses for Field Inspector:
                </span>
                <ul className="space-y-2 text-xs text-[#202521]/85">
                  {caseData.brief.hypothesesForFieldInspector.map((hyp, i) => (
                    <li key={i} className="flex items-start gap-2 bg-[#FFFDF7] p-2.5 rounded-lg border border-[#202521]/10">
                      <span className="w-4 h-4 rounded-full bg-[#26352D] text-[#FFFDF7] text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span>{hyp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Targeted Inspection Checklist */}
              <div className="mt-5 pt-4 border-t border-[#202521]/10">
                <div className="flex items-center gap-2 mb-2">
                  <ListOrdered className="w-4 h-4 text-[#66734A]" />
                  <span className="text-xs font-bold font-sans text-[#202521] uppercase tracking-wider">
                    Recommended Inspection Focus ({caseData.brief.recommendedInspectionFocus.urgency}):
                  </span>
                </div>
                <div className="space-y-1.5 pl-6 text-xs text-[#202521]/85 list-disc font-normal">
                  {caseData.brief.recommendedInspectionFocus.specificChecklist.map((check, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#66734A]" />
                      <span>{check}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Explicit Non-Diagnostic Disclaimer */}
              <div className="mt-6 p-3 rounded-lg bg-[#202521] text-[#D8D3C7] text-[11px] font-mono leading-relaxed">
                <span className="text-[#B78632] font-bold block mb-0.5">
                  STATUTORY NOTICE:
                </span>
                {caseData.brief.nonDiagnosticDisclaimer}
              </div>
            </div>
          ) : (
            <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 p-6 text-center text-xs font-mono text-[#202521]/60">
              Brief awaiting preliminary evidence review.
            </div>
          )}

          {/* Evidence Items Section */}
          <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs p-6">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#202521]/10">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#66734A]" />
                <h3 className="text-base font-bold text-[#202521] font-sans">
                  Immutable Evidence Collection ({caseData.evidenceItems.length})
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#202521]/60">
                MCP Tool Source
              </span>
            </div>

            {caseData.evidenceItems.length > 0 ? (
              <div className="space-y-3">
                {caseData.evidenceItems.map((ev) => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl bg-[#F4F1E8]/50 border border-[#202521]/10 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-[#202521]">{ev.title}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#26352D] font-bold border border-[#202521]/10">
                        Tool: {ev.mcpToolSource}
                      </span>
                    </div>
                    <p className="text-xs text-[#202521]/80 mt-1 font-normal leading-relaxed">
                      {ev.details}
                    </p>
                    <div className="mt-3 pt-2 border-t border-[#202521]/10 flex items-center justify-between text-[10px] font-mono text-[#202521]/60">
                      <span>Verified Immutable: Yes</span>
                      <span>Confidence: {(ev.confidenceScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-mono text-[#202521]/60 py-4 text-center">
                No external evidence items linked yet.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Append-Only Officer Notes & Actions (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#FFFDF7] rounded-xl border border-[#202521]/15 shadow-xs p-6">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-[#202521]/10">
              <UserCheck className="w-4 h-4 text-[#26352D]" />
              <h3 className="text-base font-bold text-[#202521] font-sans">
                Append-Only Officer Log
              </h3>
            </div>

            {/* Existing Notes */}
            <div className="space-y-3 max-h-80 overflow-y-auto mb-4">
              {caseData.officerNotes.map((note) => (
                <div
                  key={note.id}
                  className="p-3 rounded-lg bg-[#F4F1E8] border border-[#202521]/10 text-xs font-sans"
                >
                  <div className="flex items-center justify-between text-[10px] font-mono text-[#202521]/70 mb-1">
                    <span className="font-bold text-[#26352D]">{note.officerName} ({note.officerBadge})</span>
                    <span>{new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <p className="text-xs text-[#202521]/90 font-normal leading-relaxed">
                    {note.noteText}
                  </p>
                  {note.actionTaken && (
                    <div className="mt-2 pt-1 border-t border-[#202521]/10 text-[10px] font-mono font-bold text-[#9E4939]">
                      ACTION: {note.actionTaken.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Add Note Form */}
            <form onSubmit={handleAddNote} className="space-y-3 pt-3 border-t border-[#202521]/10">
              <div>
                <label className="text-[11px] font-bold font-sans text-[#202521] block mb-1">
                  Append Case Note:
                </label>
                <textarea
                  rows={3}
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Record investigative observation or dispatch order..."
                  className="w-full p-2.5 text-xs bg-[#F4F1E8] border border-[#202521]/20 rounded-lg focus:outline-hidden focus:border-[#26352D] text-[#202521]"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-[#202521]/70 block mb-1">
                  Enforcement Action Taken:
                </label>
                <select
                  value={selectedAction}
                  onChange={(e) => setSelectedAction(e.target.value as OfficerNote['actionTaken'])}
                  className="w-full p-2 text-xs bg-[#F4F1E8] border border-[#202521]/20 rounded-lg text-[#202521] font-mono"
                >
                  <option value="INTERNAL_REVIEW">Internal Review</option>
                  <option value="DISPATCHED_INSPECTION_TEAM">Dispatched Inspection Team</option>
                  <option value="REQUESTED_REWEIGH">Requested Reweigh</option>
                  <option value="EVIDENTIARY_FREEZE">Evidentiary Freeze</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingNote}
                className="w-full py-2 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-bold font-mono rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmittingNote ? 'Appending...' : 'Append to Permanent Log'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
