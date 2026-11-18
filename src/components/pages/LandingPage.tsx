import React from 'react';
import HeroSection from '../landing/HeroSection';
import StatsCards from '../landing/StatsCards';
import TopCategories from '../landing/TopCategories';
import RecentResolvedSection from '../landing/RecentResolvedSection';
import MapPreviewSection from '../landing/MapPreviewSection';
import AnnouncementsTicker from '../landing/AnnouncementsTicker';
import HowItWorks from '../landing/HowItWorks';
import Footer from '../common/Footer';
import { Complaint, DashboardStats, Announcement, IssueCategory } from '../../types';

interface LandingPageProps {
  stats: DashboardStats | null;
  complaints: Complaint[];
  announcements: Announcement[];
  onReportClick: () => void;
  onExploreMapClick: () => void;
  onTrackClick: () => void;
  onSelectCategory: (cat: IssueCategory) => void;
  onViewComplaint: (c: Complaint) => void;
  onViewAnnouncementsClick?: () => void;
}

export default function LandingPage({
  stats,
  complaints,
  announcements,
  onReportClick,
  onExploreMapClick,
  onTrackClick,
  onSelectCategory,
  onViewComplaint,
  onViewAnnouncementsClick,
}: LandingPageProps) {
  const handleDirectTicketTrack = (ticketNumber: string) => {
    const found = complaints.find(
      (c) => c.ticketNumber.toUpperCase() === ticketNumber.toUpperCase()
    );
    if (found) {
      onViewComplaint(found);
    } else {
      onTrackClick();
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#0B1120] text-[#111827] dark:text-[#F9FAFB] transition-colors">
      {/* Official Announcement Bulletin */}
      <AnnouncementsTicker announcements={announcements} onViewAllClick={onViewAnnouncementsClick} />

      {/* Section A: Compact introduction with instant ticket tracking */}
      <HeroSection
        onReportClick={onReportClick}
        onExploreMapClick={onExploreMapClick}
        onTrackClick={onTrackClick}
        onTrackTicket={handleDirectTicketTrack}
      />

      {/* Section B: Useful civic metrics */}
      <StatsCards stats={stats} />

      {/* Section C: Recent complaint activity with verified evidence */}
      <RecentResolvedSection complaints={complaints} onViewComplaint={onViewComplaint} />

      {/* Section D: Geographic overview of reported civic issues */}
      <MapPreviewSection
        complaints={complaints}
        onExploreMapClick={onExploreMapClick}
        onSelectComplaint={onViewComplaint}
      />

      {/* Directory of Civic Categories */}
      <TopCategories onSelectCategory={onSelectCategory} />

      {/* Section E: How it works - 5-Stage municipal lifecycle */}
      <HowItWorks />

      {/* Section F: Official Footer */}
      <Footer />
    </div>
  );
}
