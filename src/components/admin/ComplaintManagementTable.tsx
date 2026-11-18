import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Download,
  Eye,
  CheckSquare,
  Square
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../../types';
import { exportComplaintsToPDF } from '../../utils/pdfExport';
import { formatDate, formatNumber, translatePriority, translateStatus } from '../../utils/i18n';

interface ComplaintManagementTableProps {
  complaints: Complaint[];
  onSelectComplaint: (c: Complaint) => void;
  onOpenProgressModal: (c: Complaint) => void;
  onStatusUpdate: (id: string, status: ComplaintStatus) => void;
}

export default function ComplaintManagementTable({
  complaints,
  onSelectComplaint,
  onOpenProgressModal,
  onStatusUpdate,
}: ComplaintManagementTableProps) {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  let filtered = complaints.filter((c) => {
    if (statusFilter !== 'All' && c.status !== statusFilter) return false;
    if (priorityFilter !== 'All' && c.priority !== priorityFilter) return false;
    if (departmentFilter !== 'All' && c.departmentAssigned !== departmentFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        c.ticketNumber.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.location.address.toLowerCase().includes(q) ||
        c.citizenName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((c) => c.id));
    }
  };

  const handleExportPDF = () => {
    exportComplaintsToPDF(filtered, 'Municipal_Grievance_Management_Report');
  };

  return (
    <div className="space-y-4 text-left">
      {/* Search, Filter & Bulk Action Bar */}
      <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={i18n.language === 'hi' ? 'टिकट #, कीवर्ड, नागरिक का नाम, पता खोजें...' : 'Search Ticket #, Keyword, Citizen Name, Street Address...'}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">{i18n.language === 'hi' ? 'सभी स्थितियाँ' : 'All Statuses'}</option>
              <option value="Submitted">{translateStatus('Submitted')}</option>
              <option value="Verified">{translateStatus('Verified')}</option>
              <option value="Assigned">{translateStatus('Assigned')}</option>
              <option value="Work Started">{translateStatus('Work Started')}</option>
              <option value="In Inspection">{translateStatus('In Inspection')}</option>
              <option value="Resolved">{translateStatus('Resolved')}</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">{i18n.language === 'hi' ? 'सभी प्राथमिकताएँ' : 'All Priorities'}</option>
              <option value="Critical">{translatePriority('Critical')}</option>
              <option value="High">{translatePriority('High')}</option>
              <option value="Medium">{translatePriority('Medium')}</option>
              <option value="Low">{translatePriority('Low')}</option>
            </select>

            <button
              onClick={handleExportPDF}
              className="px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{i18n.language === 'hi' ? 'PDF रिपोर्ट' : 'Export PDF'}</span>
            </button>
          </div>
        </div>

        {/* Selected count banner */}
        {selectedIds.length > 0 && (
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center justify-between text-xs font-semibold text-blue-900 dark:text-blue-200">
            <span>{formatNumber(selectedIds.length)} {i18n.language === 'hi' ? 'टिकट चयनित' : 'tickets selected for bulk municipal dispatch'}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  selectedIds.forEach((id) => onStatusUpdate(id, 'Assigned'));
                  setSelectedIds([]);
                }}
                className="px-3 py-1 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
              >
                {i18n.language === 'hi' ? 'सामूहिक प्रेषण करें' : 'Bulk Assign To Field Crew'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-4 w-10">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === filtered.length && filtered.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-4">{i18n.language === 'hi' ? 'टिकट व फोटो' : 'Ticket & Photo'}</th>
                <th className="p-4">{i18n.language === 'hi' ? 'समस्या विवरण' : 'Issue Details'}</th>
                <th className="p-4">{i18n.language === 'hi' ? 'विभाग' : 'Department'}</th>
                <th className="p-4">{t('dashboard.complaints.priority')}</th>
                <th className="p-4">{t('dashboard.complaints.status')}</th>
                <th className="p-4 text-right">{i18n.language === 'hi' ? 'कार्रवाई' : 'Actions'}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="max-w-xs mx-auto space-y-3">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                        {i18n.language === 'hi' ? 'कोई शिकायत नहीं मिली' : 'No grievances match criteria'}
                      </h4>
                      <p className="text-xs text-slate-500">
                        {i18n.language === 'hi' ? 'अपनी खोज या फ़िल्टर मानदंड समायोजित करने का प्रयास करें।' : 'Try clearing your filters or refining your search parameters.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                const isSelected = selectedIds.includes(c.id);
                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors ${
                      isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    <td className="p-4">
                      <button onClick={() => toggleSelect(c.id)}>
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-blue-600" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                        )}
                      </button>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'}
                          alt={c.title}
                          className="w-10 h-10 rounded-xl object-cover shrink-0"
                        />
                        <div>
                          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                            {c.ticketNumber}
                          </span>
                          <div className="text-[10px] text-slate-400">
                            {formatDate(c.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-white line-clamp-1">
                        {c.title}
                      </div>
                      <div className="text-slate-500 text-[11px] truncate">
                        {c.location.address}
                      </div>
                    </td>

                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                      {c.departmentAssigned || 'Roads & Infrastructure'}
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                        c.priority === 'Critical'
                          ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/50 dark:text-red-300 dark:border-red-900'
                          : c.priority === 'High'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {translatePriority(c.priority)}
                      </span>
                    </td>

                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-md font-semibold text-[11px] border ${
                        c.status === 'Resolved' || c.status === 'Closed'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900'
                          : c.status === 'Work Started' || c.status === 'In Inspection'
                          ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900'
                          : c.status === 'Rejected'
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-900'
                          : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-900'
                      }`}>
                        {translateStatus(c.status)}
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onSelectComplaint(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => onOpenProgressModal(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-[11px] transition-colors shadow-xs"
                        >
                          {i18n.language === 'hi' ? 'प्रगति अपडेट' : 'Update'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
