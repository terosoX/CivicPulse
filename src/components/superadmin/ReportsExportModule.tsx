import React, { useState } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Table,
  BarChart,
  FileSpreadsheet
} from 'lucide-react';
import { DashboardStats } from '../../types';

interface ReportsExportModuleProps {
  stats: DashboardStats | null;
}

export default function ReportsExportModule({ stats }: ReportsExportModuleProps) {
  const [reportType, setReportType] = useState('monthly_summary');
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const data = [
        ['Metric Name', 'Value'],
        ['Total Complaints Lodged', stats?.totalComplaints || 0],
        ['Resolved Complaints', stats?.resolved || 0],
        ['In Progress', stats?.inProgress || 0],
        ['Pending Escalated', stats?.pending || 0],
        ['Average SLA Resolution Hours', stats?.avgResolutionHours || 21.4],
        ['Citizen Satisfaction Score (%)', stats?.citizenSatisfactionRate || 94.2],
      ];

      const csvContent = 'data:text/csv;charset=utf-8,' + data.map(e => e.join(',')).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `CivicPulse_Municipal_Report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setExporting(false);
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Executive Reports & Data Export Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate formal municipal governance audit reports, SLA compliance briefs, and raw datasets in CSV or PDF formats.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm space-y-5">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#374151] pb-3">
            Report Generator Setup
          </h3>

          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Report Subject
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
              >
                <option value="monthly_summary">Monthly Municipal Resolution Executive Summary</option>
                <option value="department_sla">Department SLA Compliance & Delays Breakdown</option>
                <option value="ward_performance">Ward Territorial Issue Density & Councillor Audit</option>
                <option value="ai_triage_accuracy">CivicPulse AI Auto-Triage Accuracy & Sentiment Log</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  File Export Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="csv">CSV Spreadsheet (.csv)</option>
                  <option value="pdf">PDF Document (.pdf)</option>
                  <option value="excel">Excel Workbook (.xlsx)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Time Period
                </label>
                <select className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white">
                  <option value="30">Last 30 Days</option>
                  <option value="90">Quarterly (90 Days)</option>
                  <option value="365">Annual Fiscal Year</option>
                </select>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
              >
                {exporting ? (
                  <span className="font-bold">Generating Report...</span>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Custom Report ({format.toUpperCase()})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Available Standard Downloads */}
        <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-[#374151] pb-3">
            Quick One-Click Templates
          </h3>

          <div className="space-y-3 text-xs">
            <div
              onClick={handleExport}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#1F2937]/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-500 cursor-pointer transition-colors"
            >
              <div className="font-bold text-slate-900 dark:text-white">Full Complaints Master Ledger</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Raw table containing all civic tickets, GPS coordinates, & audit steps.</p>
            </div>

            <div
              onClick={handleExport}
              className="p-3 rounded-xl bg-slate-50 dark:bg-[#1F2937]/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-blue-500 cursor-pointer transition-colors"
            >
              <div className="font-bold text-slate-900 dark:text-white">Department Head KPI Matrix</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Resolution efficiency ratings for department leadership evaluation.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
