/**
 * MilkyWay Landing Page (Preserved)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/Navbar';
import { Hero } from '../../components/Hero';
import { ThreeStakeholders } from '../../components/ThreeStakeholders';
import { OriginSection } from '../../components/OriginSection';
import { MovementSection } from '../../components/MovementSection';
import { MassBalanceDemo } from '../../components/MassBalanceDemo';
import { OfficerPreview } from '../../components/OfficerPreview';
import { InvestigationWorkflow } from '../../components/InvestigationWorkflow';
import { InspectionSection } from '../../components/InspectionSection';
import { SecuritySection } from '../../components/SecuritySection';
import { FinalCTA } from '../../components/FinalCTA';
import { Footer } from '../../components/Footer';
import { OfficerModal } from '../../components/OfficerModal';

export const LandingPage: React.FC = () => {
  const [officerModalOpen, setOfficerModalOpen] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleScrollToOfficerPreview = () => {
    navigate('/app/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#F4F1E8] text-[#202521] flex flex-col font-sans selection:bg-[#66734A]/20 selection:text-[#26352D]">
      {/* Top sticky navigation bar */}
      <Navbar
        onOpenOfficerPortal={() => setOfficerModalOpen(true)}
        onNavigateSection={handleNavigateSection}
      />

      {/* Main page content sections */}
      <main className="flex-1">
        {/* Hero Section with 3D Stainless-Steel Canister & Progression Bar */}
        <Hero
          onExploreSupplyChain={() => handleNavigateSection('three-stakeholders')}
          onSeeMassBalance={() => handleNavigateSection('the-discrepancy')}
          onLaunchOfficerConsole={() => navigate('/app/dashboard')}
        />

        {/* The Three Worlds Overview: Farmer -> Dairy Movement -> Food Safety Officer */}
        <ThreeStakeholders />

        {/* Section 1: The Origin - "Every litre starts somewhere." */}
        <OriginSection />

        {/* Section 2: The Movement - "Then it starts moving." */}
        <MovementSection />

        {/* Section 3: The Discrepancy - "Every movement leaves a record." */}
        <MassBalanceDemo />

        {/* Section 4: The Food Safety Officer - "Limited inspectors. Too many places to check." */}
        <OfficerPreview />

        {/* Section 5: Investigation Agent - "From anomaly to investigation." */}
        <InvestigationWorkflow />

        {/* Section 6: Physical Inspection - "Where testing actually happens." */}
        <InspectionSection />

        {/* Technical Architecture, Append-Only Journal & Threat Defenses */}
        <SecuritySection />

        {/* Final Call to Action */}
        <FinalCTA onEnter={() => navigate('/app/dashboard')} />
      </main>

      {/* Grounded Regulatory Footer */}
      <Footer
        onOpenOfficerPortal={() => setOfficerModalOpen(true)}
        onNavigateSection={handleNavigateSection}
      />

      {/* Officer Gateway Restricted Access Modal */}
      <OfficerModal
        isOpen={officerModalOpen}
        onClose={() => setOfficerModalOpen(false)}
        onScrollToOfficerPreview={handleScrollToOfficerPreview}
      />
    </div>
  );
};
