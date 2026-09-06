import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

interface ProtectedRouteProps {
  requiredRole?: 'OFFICER' | 'ADMIN';
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ requiredRole, children }) => {
  const { isAuthenticated, isLoading, role } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-[#26352D] text-[#FFFDF7] px-6 py-4 rounded-xl shadow-lg border border-white/10">
          <div className="w-5 h-5 border-2 border-white/20 border-t-[#66734A] rounded-full animate-spin" />
          <div className="font-mono text-xs">
            <span className="font-bold tracking-wider">VERIFYING ENFORCEMENT CREDENTIALS...</span>
            <span className="block text-[10px] text-[#D8D3C7]/70 mt-0.5">Validating Firebase session & RBAC claims</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect unauthenticated users to /login and preserve destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check required role
  if (requiredRole && role !== requiredRole && role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-[#F4F1E8] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#FFFDF7] border border-[#9E4939]/30 rounded-xl p-6 shadow-sm text-center">
          <div className="w-12 h-12 rounded-full bg-[#9E4939]/10 text-[#9E4939] flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#202521] mb-1">Access Restricted</h2>
          <p className="text-xs text-[#202521]/70 mb-4">
            This module requires elevated <span className="font-mono font-bold text-[#9E4939]">{requiredRole}</span> clearance.
            Your current assigned role is <span className="font-mono font-bold">{role}</span>.
          </p>
          <a
            href="/app/dashboard"
            className="inline-block px-4 py-2 bg-[#26352D] text-[#FFFDF7] text-xs font-bold rounded-lg hover:bg-[#202521] transition-colors"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children ? <>{children}</> : <Outlet />;
};
