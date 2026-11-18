import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Clock, AlertTriangle, CheckCircle2, Building, Percent } from 'lucide-react';
import { DashboardStats } from '../../types';
import { formatNumber, translateStatus } from '../../utils/i18n';

interface StatsCardsProps {
  stats: DashboardStats | null;
}

export default function StatsCards({ stats }: StatsCardsProps) {
  const { t } = useTranslation();

  // Honest metrics sourced strictly from actual application state
  const total = stats ? stats.totalComplaints : 0;
  const pending = stats ? stats.pending : 0;
  const inProgress = stats ? stats.inProgress : 0;
  const resolved = stats ? stats.resolved : 0;
  const avgHours = stats ? stats.avgResolutionHours : 0;
  const satisfaction = stats ? stats.citizenSatisfactionRate : 0;

  const metrics = [
    {
      label: t('landing.totalComplaints'),
      value: formatNumber(total),
      icon: FileText,
      description: 'Total lodged citywide',
    },
    {
      label: translateStatus('Pending'),
      value: formatNumber(pending),
      icon: Clock,
      description: 'Awaiting triage & review',
    },
    {
      label: translateStatus('In Progress'),
      value: formatNumber(inProgress),
      icon: AlertTriangle,
      description: 'Field teams dispatched',
    },
    {
      label: t('landing.resolved'),
      value: formatNumber(resolved),
      icon: CheckCircle2,
      description: 'Verified & completed',
    },
    {
      label: t('landing.avgResolutionTime'),
      value: avgHours > 0 ? `${formatNumber(avgHours)} hrs` : '—',
      icon: Building,
      description: 'Average resolution SLA',
    },
    {
      label: t('landing.satisfactionRate'),
      value: satisfaction > 0 ? `${formatNumber(satisfaction)}%` : '—',
      icon: Percent,
      description: 'Citizen satisfaction score',
    },
  ];

  return (
    <section aria-label="City Grievance Statistics" className="py-8 bg-[#F5F7FA] dark:bg-[#0B1120] border-b border-[#E5E7EB] dark:border-[#374151] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {metrics.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-lg bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#374151] shadow-xs"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate">
                    {m.label}
                  </span>
                  <Icon className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                </div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {m.value}
                </div>
                <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 truncate">
                  {m.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
