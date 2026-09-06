import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ShieldCheck, Lock, KeyRound, AlertTriangle, ArrowRight, CheckCircle2, UserCheck } from 'lucide-react';

interface OfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScrollToOfficerPreview: () => void;
}

export const OfficerModal: React.FC<OfficerModalProps> = ({
  isOpen,
  onClose,
  onScrollToOfficerPreview,
}) => {
  const [authStep, setAuthStep] = useState<'prompt' | 'authenticated'>('prompt');
  const [selectedRole, setSelectedRole] = useState<'lead_officer' | 'field_inspector'>('lead_officer');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSimulateLogin = () => {
    setAuthStep('authenticated');
  };

  const handleProceedToConsole = () => {
    onClose();
    onScrollToOfficerPreview();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#202521]/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-[#F4F1E8] border border-[#26352D]/20 rounded-3xl shadow-2xl p-6 sm:p-8 text-[#202521]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#202521]/60 hover:text-[#202521] hover:bg-[#D8D3C7]/50 rounded-full transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-[#26352D]/15 p-0.5 shadow-xs shrink-0">
            <img
              src="/milkyway-logo.png"
              alt="MilkyWay Emblem"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-[#66734A] font-bold">
                Restricted Government Gateway
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#B78632]" />
            </div>
            <h3 className="text-xl font-bold font-sans text-[#202521]">
              Food Safety Officer Portal
            </h3>
          </div>
        </div>

        {authStep === 'prompt' ? (
          <div>
            <p className="text-xs text-[#202521]/80 mb-5 leading-relaxed font-normal">
              Access to MilkyWay anomaly cases, batch custody trails, and facility investigation dossiers is strictly restricted to certified enforcement officers under regional dairy jurisdictions.
            </p>

            {/* Role credential preview */}
            <div className="space-y-3 mb-6 font-mono text-xs">
              <span className="text-[10px] font-bold uppercase text-[#202521]/70 tracking-wider block">
                Select Simulation Credential (Zero Password Handled):
              </span>

              <div
                onClick={() => setSelectedRole('lead_officer')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedRole === 'lead_officer'
                    ? 'bg-[#FFFDF7] border-[#26352D] ring-2 ring-[#26352D]/20 shadow-xs'
                    : 'bg-[#F4F1E8] border-[#26352D]/15 hover:bg-[#D8D3C7]/40'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[#202521]">
                  <span>FSO-7740 (Lead Food Safety Officer)</span>
                  <span className="text-[9px] px-2.5 py-0.5 bg-[#26352D] text-[#FFFDF7] rounded-full font-bold">
                    ROLE: OFFICER
                  </span>
                </div>
                <p className="text-[11px] text-[#202521]/70 mt-1 font-sans">
                  Full clearance: Anomaly queue triage, MCP forensic brief synthesis, dispatch orders.
                </p>
              </div>

              <div
                onClick={() => setSelectedRole('field_inspector')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedRole === 'field_inspector'
                    ? 'bg-[#FFFDF7] border-[#26352D] ring-2 ring-[#26352D]/20 shadow-xs'
                    : 'bg-[#F4F1E8] border-[#26352D]/15 hover:bg-[#D8D3C7]/40'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-[#202521]">
                  <span>INSP-309 (Field Inspector)</span>
                  <span className="text-[9px] px-2.5 py-0.5 bg-[#66734A] text-[#FFFDF7] rounded-full font-bold">
                    ROLE: FIELD_AGENT
                  </span>
                </div>
                <p className="text-[11px] text-[#202521]/70 mt-1 font-sans">
                  Field view: Direct dispatch coordinates, tank dip-calibration checklists.
                </p>
              </div>
            </div>

            {/* Security Notice */}
            <div className="bg-[#D8D3C7]/50 p-3.5 rounded-2xl border border-[#26352D]/10 text-[11px] font-mono text-[#202521] flex items-center gap-2.5 mb-6">
              <ShieldCheck className="w-4 h-4 text-[#66734A] shrink-0" />
              <span>
                Firebase Auth custom claim verification active: <code className="bg-[#FFFDF7] px-1.5 py-0.5 rounded-full text-[10px]">request.auth.token.role == 'officer'</code>
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  onClose();
                  navigate('/login');
                }}
                className="px-4 py-2.5 bg-[#66734A] hover:bg-[#56613e] text-[#FFFDF7] text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Go to Official /login Page</span>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={onClose}
                  className="px-3 py-2 text-xs font-semibold text-[#202521]/70 hover:text-[#202521] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSimulateLogin}
                  className="px-5 py-2.5 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-bold rounded-full transition-all flex items-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Preview</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Authenticated Confirmation View */
          <div className="py-2">
            <div className="p-4 bg-[#66734A]/15 border border-[#66734A]/40 rounded-2xl mb-6 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#66734A] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#202521] font-mono text-sm block">
                  Officer Credential Verified
                </span>
                <p className="text-xs text-[#202521]/85 mt-1">
                  Authenticated as <strong>{selectedRole === 'lead_officer' ? 'FSO-7740' : 'INSP-309'}</strong>. Session token granted read privileges on BigQuery anomaly tables and Gemini MCP investigation endpoints.
                </p>
              </div>
            </div>

            <div className="bg-[#FFFDF7] p-4 rounded-2xl border border-[#26352D]/10 text-xs font-mono space-y-1.5 mb-6">
              <div className="flex justify-between">
                <span className="text-[#202521]/60">JWT Claims:</span>
                <span className="text-[#202521] font-bold">role: officer, sector: 04-corridor</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#202521]/60">Jurisdiction:</span>
                <span className="text-[#202521]">North Valley Cooperative Belt</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#202521]/60">Active Priority Flags:</span>
                <span className="text-[#B78632] font-bold">1 High, 1 Medium, 1 Low</span>
              </div>
            </div>

            <button
              onClick={handleProceedToConsole}
              className="w-full py-3 bg-[#26352D] hover:bg-[#202521] text-[#FFFDF7] text-xs font-bold rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:scale-[1.01]"
            >
              <span>View Officer Investigation Console</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
