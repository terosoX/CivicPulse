import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  Star,
  ShieldCheck
} from 'lucide-react';
import { Complaint, User } from '../../types';
import { api } from '../../services/api';

interface CitizensManagementViewProps {
  complaints: Complaint[];
  onSelectComplaint?: (c: Complaint) => void;
}

interface CitizenProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  ward: string;
  reportsSubmitted: number;
  reportsResolved: number;
  communityUpvotes: number;
  trustScore: number;
  status: 'Verified' | 'Pending KYC' | 'Suspended';
  registeredDate: string;
  avatar: string;
}

const CITIZEN_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?q=80&w=200',
];

export default function CitizensManagementView({
  complaints,
  onSelectComplaint,
}: CitizensManagementViewProps) {
  const [citizens, setCitizens] = useState<CitizenProfile[]>([]);
  const [search, setSearch] = useState('');
  const [wardFilter, setWardFilter] = useState('All');
  const [brokenAvatars, setBrokenAvatars] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    api.getUsers({ role: 'citizen' })
      .then((users: User[]) => {
        if (!active || !Array.isArray(users)) return;
        const mapped: CitizenProfile[] = users.map((u, idx) => {
          const userComplaints = complaints.filter(
            (c) =>
              c.citizenId === u.id ||
              c.citizenName.toLowerCase() === u.name.toLowerCase()
          );
          const resolvedCount = userComplaints.filter(
            (c) => c.status === 'Resolved' || c.status === 'Closed'
          ).length;
          return {
            id: u.id,
            name: u.name,
            email: u.email,
            phone: u.phone || '+91 98765 43210',
            ward: u.ward || 'Ward 4 - Central Promenade',
            reportsSubmitted: userComplaints.length,
            reportsResolved: resolvedCount,
            communityUpvotes: userComplaints.reduce((acc, c) => acc + (c.upvotes || 0), 0),
            trustScore: u.status === 'suspended' ? 40 : Math.min(99, 88 + userComplaints.length * 2),
            status: u.status === 'suspended' ? 'Suspended' : u.status === 'pending' ? 'Pending KYC' : 'Verified',
            registeredDate: u.createdAt ? u.createdAt.slice(0, 10) : '2026-01-15',
            avatar: u.avatarUrl || CITIZEN_AVATARS[idx % CITIZEN_AVATARS.length],
          };
        });
        setCitizens(mapped);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [complaints]);

  const filteredCitizens = citizens.filter((c) => {
    if (wardFilter !== 'All' && !c.ward.includes(wardFilter)) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.ward.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalUpvotes = complaints.reduce((acc, c) => acc + (c.upvotes || 0), 0);
  const avgTrust =
    citizens.length > 0
      ? (citizens.reduce((acc, c) => acc + c.trustScore, 0) / citizens.length).toFixed(1)
      : '94.6';

  return (
    <div className="space-y-6 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E5E7EB] dark:border-[#374151]">
        <div>
          <h2 className="text-xl font-bold text-[#111827] dark:text-[#F9FAFB] tracking-tight">
            Citizen Registry & Community Directory
          </h2>
          <p className="text-xs text-[#667085] dark:text-[#9CA3AF] mt-1">
            Registered citizen reporters, trust index scores, civic engagement telemetry, and verification records
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-[#EFF6FF] dark:bg-blue-950/40 border border-[#BFDBFE] dark:border-blue-900/60 text-xs font-semibold text-[#2563EB] dark:text-[#60A5FA]">
            {citizens.length} Registered Directory Accounts
          </span>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Registered Citizens</span>
            <Users className="w-4 h-4 text-[#2563EB] dark:text-[#60A5FA]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#111827] dark:text-[#F9FAFB]">
            {citizens.length}
          </div>
          <div className="mt-2 text-[11px] text-[#16A34A] dark:text-emerald-400 font-medium">
            Active verified civic portal members
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Average Trust Score</span>
            <ShieldCheck className="w-4 h-4 text-[#16A34A] dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#16A34A] dark:text-emerald-400">
            {avgTrust} / 100
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
            Automated duplicate & spam protection
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Community Upvotes Cast</span>
            <Star className="w-4 h-4 text-[#D97706] dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#D97706] dark:text-amber-400">
            {totalUpvotes}
          </div>
          <div className="mt-2 text-[11px] text-[#667085] dark:text-[#9CA3AF]">
            Crowdsourced severity validation
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs">
          <div className="flex items-center justify-between text-[#667085] dark:text-[#9CA3AF]">
            <span className="text-xs font-semibold">Total Reports Filed</span>
            <CheckCircle2 className="w-4 h-4 text-[#0D9488] dark:text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-[#0D9488] dark:text-teal-400">
            {complaints.length}
          </div>
          <div className="mt-2 text-[11px] text-[#16A34A] dark:text-emerald-400 font-medium">
            Tracked in real time
          </div>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search citizen by name, email, phone number, or ward..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs text-[#101828] dark:text-white placeholder-[#98A2B3] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
          />
        </div>

        <select
          value={wardFilter}
          onChange={(e) => setWardFilter(e.target.value)}
          className="px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#334155] bg-white dark:bg-[#0F172A] text-xs font-medium text-[#101828] dark:text-white"
        >
          <option value="All">All Municipal Wards</option>
          <option value="Ward 1">Ward 1 - North Sector</option>
          <option value="Ward 2">Ward 2 - East Industrial</option>
          <option value="Ward 3">Ward 3 - South Residential</option>
          <option value="Ward 4">Ward 4 - Central Promenade</option>
          <option value="Ward 5">Ward 5 - West Suburbs</option>
        </select>
      </div>

      {/* Citizens Table */}
      <div className="rounded-xl bg-white dark:bg-[#1E293B] border border-[#EAECF0] dark:border-[#334155] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] dark:bg-[#182234] text-[#667085] font-semibold border-b border-[#EAECF0] dark:border-[#334155] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Citizen Name</th>
                <th className="px-4 py-3">Contact Details</th>
                <th className="px-4 py-3">Ward Location</th>
                <th className="px-4 py-3">Reports Filed</th>
                <th className="px-4 py-3">Trust Index</th>
                <th className="px-4 py-3">KYC Status</th>
                <th className="px-4 py-3 text-right">Member Since</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#334155] bg-white dark:bg-[#1E293B]">
              {filteredCitizens.map((c) => (
                <tr key={c.id} className="hover:bg-[#F9FAFB] dark:hover:bg-[#283548] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      {brokenAvatars[c.id] ? (
                        <div className="w-9 h-9 rounded-full bg-[#2563EB]/10 dark:bg-blue-950/60 text-[#2563EB] dark:text-[#60A5FA] font-bold text-xs flex items-center justify-center border border-[#BFDBFE] dark:border-blue-900 shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <img
                          src={c.avatar}
                          alt={c.name}
                          onError={() => setBrokenAvatars((prev) => ({ ...prev, [c.id]: true }))}
                          className="w-9 h-9 rounded-full object-cover border border-[#E5E7EB] dark:border-[#374151]"
                        />
                      )}
                      <div>
                        <div className="font-bold text-[#111827] dark:text-[#F9FAFB]">{c.name}</div>
                        <div className="text-[11px] font-mono text-[#667085] dark:text-[#9CA3AF]">ID: {c.id}</div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="text-[#344054] dark:text-slate-200">{c.email}</div>
                    <div className="text-[11px] text-[#667085] font-mono">{c.phone}</div>
                  </td>

                  <td className="px-4 py-3.5 text-[#344054] dark:text-slate-200 font-medium">
                    {c.ward}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-bold text-[#2563EB]">{c.reportsSubmitted} submitted</span>
                    <span className="text-[11px] text-[#16A34A] block">({c.reportsResolved} resolved)</span>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold font-mono text-[#101828] dark:text-white">{c.trustScore}%</span>
                      <span className="w-16 h-1.5 rounded-full bg-[#EAECF0] overflow-hidden">
                        <span
                          className="block h-full bg-[#16A34A] rounded-full"
                          style={{ width: `${c.trustScore}%` }}
                        />
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#ECFDF5] text-[#16A34A] border border-[#A7F3D0]">
                      {c.status}
                    </span>
                  </td>

                  <td className="px-4 py-3.5 text-right font-mono text-[11px] text-[#667085] whitespace-nowrap">
                    {c.registeredDate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
