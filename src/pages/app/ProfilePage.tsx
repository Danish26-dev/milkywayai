import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UserCheck,
  BadgeCheck,
  Building2,
  Lock,
  KeyRound,
  LogOut
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { officer, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#66734A]" />
          <h1 className="text-2xl font-bold font-sans text-[#202521]">
            Officer Credentials & Clearance
          </h1>
        </div>
        <p className="text-xs text-[#202521]/70 mt-1 font-normal">
          Verified institutional credentials for the State Food Safety Enforcement Cell.
        </p>
      </div>

      <div className="bg-[#FFFDF7] p-6 rounded-xl border border-[#202521]/15 shadow-xs space-y-6">
        <div className="flex items-center gap-4 pb-6 border-b border-[#202521]/10">
          <div className="w-16 h-16 rounded-2xl bg-[#26352D] text-[#FFFDF7] flex items-center justify-center font-bold font-mono text-xl shadow-xs">
            {officer?.displayName?.split(' ').map(n => n[0]).join('') || 'FO'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-sans text-[#202521]">
                {officer?.displayName || 'Officer'}
              </h2>
              <BadgeCheck className="w-5 h-5 text-[#66734A]" />
            </div>
            <span className="text-xs font-mono text-[#202521]/70 block mt-0.5">
              Badge: {officer?.badgeNumber || 'FSO-IND-9021'} • {officer?.email}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#F4F1E8]/50 p-3 rounded-lg border border-[#202521]/10">
            <span className="text-[#202521]/60 block text-[10px]">Department</span>
            <span className="font-bold text-[#202521] mt-0.5 block">{officer?.department}</span>
          </div>
          <div className="bg-[#F4F1E8]/50 p-3 rounded-lg border border-[#202521]/10">
            <span className="text-[#202521]/60 block text-[10px]">Jurisdiction</span>
            <span className="font-bold text-[#202521] mt-0.5 block">{officer?.jurisdiction}</span>
          </div>
          <div className="bg-[#F4F1E8]/50 p-3 rounded-lg border border-[#202521]/10">
            <span className="text-[#202521]/60 block text-[10px]">Assigned District</span>
            <span className="font-bold text-[#202521] mt-0.5 block">{officer?.district}</span>
          </div>
          <div className="bg-[#F4F1E8]/50 p-3 rounded-lg border border-[#202521]/10">
            <span className="text-[#202521]/60 block text-[10px]">Clearance Level</span>
            <span className="font-bold text-[#66734A] mt-0.5 block">{officer?.clearanceLevel} (Authorized)</span>
          </div>
        </div>

        <div className="pt-4 border-t border-[#202521]/10 flex items-center justify-between">
          <div className="text-xs font-mono text-[#202521]/60">
            Session: Authenticated via Firebase Custom Claims
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg bg-[#9E4939] hover:bg-[#853c2e] text-[#FFFDF7] text-xs font-bold font-mono transition-colors flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Officer Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
