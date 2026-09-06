/**
 * MilkyWay Application Router & Core Provider Setup
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { ProtectedRoute } from './components/auth/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/public/LandingPage';
import { HowItWorksPage } from './pages/public/HowItWorksPage';
import { SecurityPage } from './pages/public/SecurityPage';
import { LoginPage } from './pages/public/LoginPage';

// Authenticated Application Pages
import { DashboardPage } from './pages/app/DashboardPage';
import { BatchesPage } from './pages/app/BatchesPage';
import { BatchDetailPage } from './pages/app/BatchDetailPage';
import { InvestigationsPage } from './pages/app/InvestigationsPage';
import { InvestigationDetailPage } from './pages/app/InvestigationDetailPage';
import { AlertsPage } from './pages/app/AlertsPage';
import { FacilitiesPage } from './pages/app/FacilitiesPage';
import { VehiclesPage } from './pages/app/VehiclesPage';
import { ProfilePage } from './pages/app/ProfilePage';
import { AdminPage } from './pages/app/AdminPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/how-it-works" element={<HowItWorksPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Authenticated Application Console Routes (Protected) */}
          <Route
            path="/app"
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/app/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="batches" element={<BatchesPage />} />
            <Route path="batches/:batchId" element={<BatchDetailPage />} />
            <Route path="investigations" element={<InvestigationsPage />} />
            <Route path="investigations/:caseId" element={<InvestigationDetailPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="facilities" element={<FacilitiesPage />} />
            <Route path="vehicles" element={<VehiclesPage />} />
            <Route path="profile" element={<ProfilePage />} />
            {/* Admin only route */}
            <Route
              path="admin"
              element={
                <ProtectedRoute requiredRole="ADMIN">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
