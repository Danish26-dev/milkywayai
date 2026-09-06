import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  AlertTriangle,
  FileSearch,
  Building2,
  Truck,
  ShieldCheck,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  BadgeCheck,
  Shield
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = () => {
  const { officer, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const query = searchQuery.trim().toUpperCase();
    if (query.startsWith('BATCH') || query.startsWith('MW-')) {
      navigate(`/app/batches?search=${encodeURIComponent(query)}`);
    } else if (query.startsWith('CASE') || query.startsWith('INV')) {
      navigate(`/app/investigations?search=${encodeURIComponent(query)}`);
    } else {
      navigate(`/app/batches?search=${encodeURIComponent(query)}`);
    }
  };

  const navItems = [
    { name: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
    { name: 'Batches', path: '/app/batches', icon: Layers },
    { name: 'Alerts', path: '/app/alerts', icon: AlertTriangle, badge: '2' },
    { name: 'Investigations', path: '/app/investigations', icon: FileSearch, badge: '4' },
    { name: 'Facilities', path: '/app/facilities', icon: Building2 },
    { name: 'Vehicles', path: '/app/vehicles', icon: Truck },
    ...(role === 'ADMIN' ? [{ name: 'Admin Console', path: '/app/admin', icon: Shield }] : [])
  ];

  // Derive current section name for breadcrumb
  const currentPath = location.pathname;
  let sectionLabel = 'Console';
  if (currentPath.includes('/dashboard')) sectionLabel = 'Investigation Priority Dashboard';
  else if (currentPath.includes('/batches')) sectionLabel = 'Supply-Chain Batch Ledger';
  else if (currentPath.includes('/alerts')) sectionLabel = 'Active Anomaly Alerts';
  else if (currentPath.includes('/investigations')) sectionLabel = 'Case Dossiers & Evidence';
  else if (currentPath.includes('/facilities')) sectionLabel = 'Registered Dairy Facilities';
  else if (currentPath.includes('/vehicles')) sectionLabel = 'Milk Tankers & GPS Transit';
  else if (currentPath.includes('/profile')) sectionLabel = 'Officer Credentials & Jurisdiction';
  else if (currentPath.includes('/admin')) sectionLabel = 'National Directorate Admin Console';

  return (
    <div className="min-h-screen bg-[#F4F1E8] text-[#202521] flex flex-col antialiased">
      {/* Top Banner: Strict Regulatory Notice */}
      <div className="bg-[#202521] text-[#D8D3C7] text-[11px] font-mono px-4 py-1.5 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#66734A]" />
          <span className="font-semibold tracking-wider text-[#FFFDF7]">STATE FOOD SAFETY ENFORCEMENT PORTAL</span>
          <span className="hidden md:inline text-[#D8D3C7]/60">|</span>
          <span className="hidden md:inline text-[#D8D3C7]/80">Decision Support System for Physical Inspections</span>
        </div>
        <div className="flex items-center gap-4 text-[10px]">
          <span className="hidden sm:inline text-[#B78632] font-semibold">
            NON-DIAGNOSTIC NOTICE: SYSTEM DOES NOT TEST MILK OR DIAGNOSE ADULTERATION
          </span>
          <span className="text-[#D8D3C7]/60 font-mono">APPEND-ONLY JOURNAL v1.4</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="hidden md:flex flex-col w-64 bg-[#26352D] text-[#FFFDF7] border-r border-[#202521]/20 select-none">
          {/* Brand Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-white/20 p-0.5 overflow-hidden shrink-0 shadow-xs">
                <img
                  src="/milkyway-logo.png"
                  alt="MilkyWay Emblem"
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-[#FFFDF7] font-sans block leading-tight">
                  MilkyWay
                </span>
                <span className="text-[10px] font-mono text-[#D8D3C7]/70 uppercase tracking-widest block">
                  Officer Console
                </span>
              </div>
            </div>
            <a
              href="/"
              title="View Public Overview"
              className="p-1.5 rounded-lg text-[#D8D3C7]/70 hover:text-[#FFFDF7] hover:bg-white/10 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Primary Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-widest text-[#D8D3C7]/50 font-bold">
              Investigation Modules
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/app/dashboard'}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide transition-all ${
                      isActive
                        ? 'bg-[#66734A] text-[#FFFDF7] shadow-xs font-semibold'
                        : 'text-[#D8D3C7] hover:text-[#FFFDF7] hover:bg-white/10'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#9E4939] text-[#FFFDF7] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Append-Only Journal Verification Box */}
          <div className="p-3 mx-3 mb-3 rounded-lg bg-[#202521] border border-white/10 text-[11px] font-mono text-[#D8D3C7]">
            <div className="flex items-center gap-1.5 text-[#66734A] font-bold text-[10px] uppercase mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Cryptographic Chain</span>
            </div>
            <div className="text-[10px] text-[#D8D3C7]/70 leading-relaxed">
              BigQuery Event Stream: <span className="text-[#FFFDF7] font-semibold">Synchronized</span>
            </div>
            <div className="text-[9px] text-[#D8D3C7]/50 truncate mt-0.5">
              Head: 3f78a69...d12e
            </div>
          </div>

          {/* Officer Session Block */}
          <div className="p-3 border-t border-white/10 bg-[#202521]/60">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-lg bg-[#66734A] text-[#FFFDF7] flex items-center justify-center font-bold text-xs font-mono">
                {officer?.displayName?.split(' ').map(n => n[0]).join('') || 'FO'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#FFFDF7] truncate">
                    {officer?.displayName || 'Officer'}
                  </span>
                  <BadgeCheck className="w-3.5 h-3.5 text-[#66734A] shrink-0" />
                </div>
                <span className="text-[10px] font-mono text-[#D8D3C7]/70 block truncate">
                  {officer?.badgeNumber || 'FSO-IND-9021'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[10px] text-[#D8D3C7]/80 pt-1 border-t border-white/10 font-mono">
              <NavLink
                to="/app/profile"
                className="hover:text-[#FFFDF7] hover:underline"
              >
                Role: <span className="font-bold text-[#66734A]">{role || 'OFFICER'}</span> • {officer?.clearanceLevel?.replace('_', ' ') || 'L2 ENFORCEMENT'}
              </NavLink>
              <button
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                title="Sign out of console"
                className="p-1 hover:text-[#9E4939] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          {/* Top Navigation Bar */}
          <header className="bg-[#FFFDF7] border-b border-[#202521]/15 sticky top-0 z-20 px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Mobile Menu Toggle & Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-[#202521] hover:bg-[#F4F1E8]"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <div className="flex items-center gap-2 text-xs font-mono text-[#202521]/70">
                <span className="font-semibold text-[#26352D] hidden sm:inline">MilkyWay Console</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#202521]/40 hidden sm:inline" />
                <span className="font-bold text-[#202521]">{sectionLabel}</span>
              </div>
            </div>

            {/* Central Search Bar */}
            <form onSubmit={handleSearchSubmit} className="hidden sm:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#202521]/40 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search batch ID, case ID, or facility (e.g., MW-PB-26, AMR)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F4F1E8] border border-[#202521]/20 rounded-md focus:outline-hidden focus:border-[#26352D] font-mono text-[#202521]"
                />
              </div>
            </form>

            {/* Right Action Cluster */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Active Alerts Bell */}
              <NavLink
                to="/app/alerts"
                className="relative p-2 rounded-lg text-[#202521]/80 hover:text-[#202521] hover:bg-[#F4F1E8] transition-colors"
                title="Active Anomaly Alerts"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#9E4939]" />
              </NavLink>

              {/* Jurisdiction Pill */}
              <div className="hidden lg:flex flex-col text-right">
                <span className="text-[11px] font-bold text-[#202521] leading-tight">
                  {officer?.district || 'Sonipat & Rohtak Zone'}
                </span>
                <span className="text-[10px] font-mono text-[#66734A] leading-tight">
                  Clearance Level 2 Active
                </span>
              </div>

              {/* Public Site Return Button */}
              <a
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#26352D] bg-[#F4F1E8] hover:bg-[#D8D3C7]/50 rounded-md border border-[#202521]/15 transition-colors"
              >
                <span>Landing Page</span>
              </a>
            </div>
          </header>

          {/* Mobile Navigation Drawer */}
          {mobileMenuOpen && (
            <div className="md:hidden bg-[#26352D] text-[#FFFDF7] border-b border-white/10 px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium tracking-wide ${
                        isActive ? 'bg-[#66734A] text-[#FFFDF7]' : 'text-[#D8D3C7] hover:bg-white/10'
                      }`
                    }
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-[#9E4939] text-[#FFFDF7] rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#D8D3C7]">
                <span>{officer?.displayName} ({officer?.badgeNumber})</span>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                  }}
                  className="text-[#9E4939] font-bold"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}

          {/* Main Route Content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};
