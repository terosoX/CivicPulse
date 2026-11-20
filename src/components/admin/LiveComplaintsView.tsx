import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Building2,
  MapPin,
  Calendar,
  Sparkles,
  Camera,
  MessageSquare,
  ShieldAlert,
  X,
  Send,
  Check,
  ExternalLink
} from 'lucide-react';
import { Complaint, ComplaintStatus, PriorityLevel, User } from '../../types';
import { formatDate } from '../../utils/i18n';
import { exportComplaintsToPDF } from '../../utils/pdfExport';
import { api } from '../../services/api';

interface LiveComplaintsViewProps {
  complaints: Complaint[];
  user?: User | null;
  onSelectComplaint?: (c: Complaint) => void;
  onOpenProgressModal?: (c: Complaint) => void;
  onRefreshData?: () => void;
  onStatusUpdate?: (id: string, status: ComplaintStatus) => void;
}

export default function LiveComplaintsView({
  complaints,
  user,
  onSelectComplaint,
  onOpenProgressModal,
  onRefreshData,
  onStatusUpdate,
}: LiveComplaintsViewProps) {
  // Filters & Search
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedPriority, setSelectedPriority] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'priority'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Detailed Complaint Modal / Slide-over state
  const [detailedComplaint, setDetailedComplaint] = useState<Complaint | null>(null);
  const [adminRemarkText, setAdminRemarkText] = useState('');
  const [savingRemark, setSavingRemark] = useState(false);
  const [saveRemarkSuccess, setSaveRemarkSuccess] = useState(false);
  const [remarkError, setRemarkError] = useState<string | null>(null);
  const [assignDept, setAssignDept] = useState('');
  const [assignOfficer, setAssignOfficer] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Filter categories (all 10 civic categories)
  const categories = [
    'All',
    'Potholes & Road Damage',
    'Garbage & Solid Waste',
    'Water Leakage & Supply',
    'Streetlighting & Electrical',
    'Drainage & Sewage Overflow',
    'Illegal Dumping & Encroachment',
    'Fallen Tree & Horticulture',
    'Parks & Public Amenities',
    'Public Health & Sanitation',
    'Traffic & Signage Issues',
  ];

  // Filter statuses
  const statuses = [
    'All',
    'Submitted',
    'Verified',
    'Assigned',
    'Officer En Route',
    'Work Started',
    'In Inspection',
    'Resolved',
    'Closed',
    'Rejected',
  ];

  // Departments
  const departments = [
    'All',
    'Roads & Infrastructure',
    'Solid Waste & Sanitation',
    'Water Supply & Sewage',
    'Electrical & Streetlighting',
    'Drainage & Stormwater',
    'Parks & Horticulture',
    'Public Health & Encroachment',
    'Municipal Engineering',
  ];

  // Priorities
  const priorities = ['All', 'Critical', 'High', 'Medium', 'Low'];

  React.useEffect(() => {
    if (detailedComplaint) {
      const refreshed = complaints.find((c) => c.id === detailedComplaint.id);
      if (refreshed && refreshed !== detailedComplaint) {
        setDetailedComplaint(refreshed);
      }
    }
  }, [complaints]);

  // Filter and Sort Logic
  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      // Category filter
      if (selectedCategory !== 'All' && c.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatus !== 'All' && c.status !== selectedStatus) {
        return false;
      }

      // Department filter
      if (selectedDepartment !== 'All') {
        const assigned = c.departmentAssigned || '';
        if (!assigned.toLowerCase().includes(selectedDepartment.toLowerCase().slice(0, 6))) {
          return false;
        }
      }

      // Priority filter
      if (selectedPriority !== 'All' && c.priority !== selectedPriority) {
        return false;
      }

      // Search Query
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          c.ticketNumber.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.location.address.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.citizenName.toLowerCase().includes(q)
        );
      }

      return true;
    }).sort((a, b) => {
      if (sortOrder === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortOrder === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortOrder === 'priority') {
        const weight: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (weight[b.priority] || 0) - (weight[a.priority] || 0);
      }
      return 0;
    });
  }, [complaints, search, selectedCategory, selectedStatus, selectedDepartment, selectedPriority, sortOrder]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage) || 1;
  const paginatedComplaints = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredComplaints.slice(start, start + itemsPerPage);
  }, [filteredComplaints, currentPage, itemsPerPage]);

  const handleOpenDetail = (c: Complaint) => {
    setDetailedComplaint(c);
    setAssignDept(c.departmentAssigned || 'Roads & Infrastructure');
    setAssignOfficer(c.officerAssigned || 'Eng. Vikram Sethi');
    setAssignSuccess(false);
    setAdminRemarkText('');
    setSaveRemarkSuccess(false);
    setRemarkError(null);
  };

  const handleAssignOfficial = async () => {
    if (!detailedComplaint || !assignDept) return;
    setAssigning(true);
    setRemarkError(null);
    setAssignSuccess(false);
    try {
      const updated = await api.assignComplaint(
        detailedComplaint.id,
        assignDept,
        assignOfficer.trim() || undefined
      );
      setDetailedComplaint(updated);
      setAssignSuccess(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setAssignSuccess(false), 2500);
    } catch (e: any) {
      setRemarkError(e?.message || 'Failed to assign department & officer');
    } finally {
      setAssigning(false);
    }
  };

  const handleSaveAdminRemark = async () => {
    if (!detailedComplaint || !adminRemarkText.trim()) return;
    setSavingRemark(true);
    setRemarkError(null);
    try {
      const updated = await api.updateComplaintStatus(detailedComplaint.id, {
        notes: `Official Note: ${adminRemarkText.trim()}`,
        updatedBy: user ? `${user.name} (${user.role})` : 'Municipal Administrator',
      });
      setDetailedComplaint(updated);
      setSaveRemarkSuccess(true);
      if (onRefreshData) onRefreshData();
      setTimeout(() => setSaveRemarkSuccess(false), 2500);
      setAdminRemarkText('');
    } catch (e: any) {
      setRemarkError(e?.message || 'Failed to save official remark');
    } finally {
      setSavingRemark(false);
    }
  };

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Critical':
        return 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]';
      case 'High':
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
      case 'Medium':
        return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
      case 'Low':
      default:
        return 'bg-[#F2F4F7] text-[#475467] border-[#D0D5DD]';
    }
  };

  const getStatusBadge = (status: ComplaintStatus) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'bg-[#ECFDF5] text-[#16A34A] border-[#A7F3D0]';
      case 'Work Started':
      case 'In Inspection':
      case 'Officer En Route':
        return 'bg-[#F0FDFA] text-[#0D9488] border-[#99F6E4]';
      case 'Assigned':
      case 'Verified':
        return 'bg-[#EFF6FF] text-[#2563EB] border-[#BFDBFE]';
      case 'Rejected':
        return 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]';
      case 'Submitted':
      case 'Pending':
      default:
        return 'bg-[#FFFBEB] text-[#D97706] border-[#FDE68A]';
    }
  };

  return (
    <div className="space-y-5 text-left">
      {/* Header and Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#EAECF0] dark:border-[#1E293B]">
        <div>
          <h2 className="text-xl font-bold text-[#101828] dark:text-white tracking-tight">
            Live Complaint Management
          </h2>
          <p className="text-xs text-[#667085] dark:text-slate-400 mt-1">
            Real-time municipal grievance triage, status verification, and lifecycle auditing
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => exportComplaintsToPDF(filteredComplaints, 'Live_Complaint_Registry')}
            className="w-full sm:w-auto min-h-[40px] px-3 py-2 rounded-lg bg-white dark:bg-[#111827] border border-[#D0D5DD] dark:border-[#374151] text-[#344054] dark:text-slate-300 hover:bg-[#F9FAFB] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-[#667085]" />
            <span>Export Table PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#111827] border border-[#EAECF0] dark:border-[#374151] shadow-xs space-y-3.5">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#667085] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by ticket #, citizen name, street address, or category..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs text-[#101828] dark:text-white placeholder-[#98A2B3] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            />
          </div>

          {/* Quick Clear Filter Button if any active */}
          {(search || selectedCategory !== 'All' || selectedStatus !== 'All' || selectedDepartment !== 'All' || selectedPriority !== 'All') && (
            <button
              onClick={() => {
                setSearch('');
                setSelectedCategory('All');
                setSelectedStatus('All');
                setSelectedDepartment('All');
                setSelectedPriority('All');
                setCurrentPage(1);
              }}
              className="text-xs text-[#DC2626] font-semibold hover:underline self-end lg:self-auto shrink-0"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Multi-Filter Select Row */}
        <div className="grid grid-cols-1 min-[380px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 pt-1">
          {/* Category Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <label className="block text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Priority
            </label>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              {priorities.map((pri) => (
                <option key={pri} value={pri}>
                  {pri}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Date */}
          <div>
            <label className="block text-[10px] font-semibold text-[#667085] uppercase tracking-wider mb-1">
              Sort By
            </label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="priority">Highest Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Complaints Mobile Cards + Desktop Table Container */}
      <div className="rounded-xl bg-white dark:bg-[#111827] border border-[#EAECF0] dark:border-[#374151] shadow-xs overflow-hidden">
        {/* Mobile Card View */}
        <div className="md:hidden divide-y divide-[#EAECF0] dark:divide-[#334155]">
          {paginatedComplaints.length === 0 ? (
            <div className="p-8 text-center text-[#667085] space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#F2F4F7] dark:bg-[#1F2937] flex items-center justify-center mx-auto">
                <Search className="w-5 h-5" />
              </div>
              <div className="font-semibold text-sm text-[#101828] dark:text-white">No grievances found</div>
              <p className="text-xs">Try clearing or modifying your filter criteria to expand results.</p>
            </div>
          ) : (
            paginatedComplaints.map((c) => (
              <div
                key={c.id}
                onClick={() => handleOpenDetail(c)}
                className="p-4 space-y-2.5 text-xs hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono font-bold text-[#2563EB]">{c.ticketNumber}</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(c.priority)}`}>
                      {c.priority}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(c.status)}`}>
                      {c.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <img
                    src={c.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=200'}
                    alt={c.title}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    className="w-10 h-10 rounded-md object-cover shrink-0 border border-[#EAECF0] dark:border-[#374151]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-[#101828] dark:text-white line-clamp-1">{c.title}</div>
                    <div className="text-[11px] text-[#667085] truncate">{c.category}</div>
                  </div>
                </div>

                <div className="text-[11px] text-[#475467] dark:text-slate-300 space-y-0.5">
                  <div className="truncate">{c.citizenName} • {c.location.address}</div>
                  <div className="text-[#667085] truncate">{c.departmentAssigned || 'Roads & Infrastructure'} • {formatDate(c.createdAt)}</div>
                </div>

                <div className="flex flex-wrap justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                  {onOpenProgressModal && (
                    <button
                      onClick={() => onOpenProgressModal(c)}
                      className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Update Stage</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleOpenDetail(c)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-[#F2F4F7] hover:bg-[#EAECF0] dark:bg-[#334155] text-[#344054] dark:text-slate-200 text-xs font-semibold inline-flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Manage</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] dark:bg-[#1F2937] text-[#667085] font-semibold border-b border-[#EAECF0] dark:border-[#374151] text-[11px] uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Ticket ID</th>
                <th className="px-4 py-3">Issue Category</th>
                <th className="px-4 py-3">Citizen & Location</th>
                <th className="px-4 py-3">Assigned Department</th>
                <th className="px-4 py-3">Reported Date</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#EAECF0] dark:divide-[#334155] bg-white dark:bg-[#111827]">
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-[#667085]">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="w-10 h-10 rounded-full bg-[#F2F4F7] dark:bg-[#1F2937] flex items-center justify-center mx-auto text-[#667085]">
                        <Search className="w-5 h-5" />
                      </div>
                      <div className="font-semibold text-sm text-[#101828] dark:text-white">
                        No grievances found
                      </div>
                      <p className="text-xs text-[#667085]">
                        Try clearing or modifying your filter criteria to expand results.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => handleOpenDetail(c)}
                    className="hover:bg-[#F9FAFB] dark:hover:bg-[#1F2937] transition-colors cursor-pointer"
                  >
                    {/* Ticket ID */}
                    <td className="px-4 py-3.5 font-mono font-bold text-[#2563EB] whitespace-nowrap">
                      {c.ticketNumber}
                    </td>

                    {/* Category & Thumbnail */}
                    <td className="px-4 py-3.5 max-w-xs">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={c.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=200'}
                          alt={c.title}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                          className="w-9 h-9 rounded-md object-cover shrink-0 border border-[#EAECF0] dark:border-[#374151]"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-[#101828] dark:text-white truncate">
                            {c.title}
                          </div>
                          <div className="text-[11px] text-[#667085] truncate">
                            {c.category}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Citizen & Location */}
                    <td className="px-4 py-3.5 text-[#344054] dark:text-slate-300">
                      <div className="font-medium truncate max-w-[170px]">{c.citizenName}</div>
                      <div className="text-[11px] text-[#667085] truncate max-w-[170px]">
                        {c.location.address}
                      </div>
                    </td>

                    {/* Department Assigned */}
                    <td className="px-4 py-3.5 text-[#344054] dark:text-slate-300 font-medium whitespace-nowrap">
                      {c.departmentAssigned || 'Roads & Infrastructure'}
                    </td>

                    {/* Reported Date */}
                    <td className="px-4 py-3.5 text-[#667085] font-mono text-[11px] whitespace-nowrap">
                      {formatDate(c.createdAt)}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(c.priority)}`}>
                        {c.priority}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(c.status)}`}>
                        {c.status}
                      </span>
                    </td>

                    {/* Action Button */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        {onOpenProgressModal && (
                          <button
                            onClick={() => onOpenProgressModal(c)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Update</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenDetail(c)}
                          className="px-2.5 py-1.5 rounded-lg bg-[#F2F4F7] hover:bg-[#EAECF0] dark:bg-[#334155] dark:hover:bg-[#475467] text-[#344054] dark:text-slate-200 text-xs font-semibold transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-[#667085]" />
                          <span>Manage</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-[#F9FAFB] dark:bg-[#1F2937] border-t border-[#EAECF0] dark:border-[#374151] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#667085]">
          <div>
            Showing <span className="font-semibold text-[#101828] dark:text-white">{filteredComplaints.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to{' '}
            <span className="font-semibold text-[#101828] dark:text-white">
              {Math.min(currentPage * itemsPerPage, filteredComplaints.length)}
            </span>{' '}
            of <span className="font-semibold text-[#101828] dark:text-white">{filteredComplaints.length}</span> complaints
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F2F4F7] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 font-semibold text-[#101828] dark:text-white">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#F2F4F7] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Complaint Modal / Slide-Over */}
      {detailedComplaint && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-6 overflow-y-auto animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-[#111827] w-full max-w-3xl rounded-t-2xl sm:rounded-xl border border-[#EAECF0] dark:border-[#374151] shadow-2xl overflow-hidden sm:my-auto flex flex-col max-h-[92dvh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#EAECF0] dark:border-[#374151] flex items-start justify-between gap-3 bg-[#F9FAFB] dark:bg-[#1F2937]">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#BFDBFE]">
                    {detailedComplaint.ticketNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadge(detailedComplaint.status)}`}>
                    {detailedComplaint.status}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getPriorityBadge(detailedComplaint.priority)}`}>
                    {detailedComplaint.priority} Priority
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-[#101828] dark:text-white mt-1.5 break-words">
                  {detailedComplaint.title}
                </h3>
              </div>

              <button
                onClick={() => setDetailedComplaint(null)}
                aria-label="Close complaint details"
                className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-[#667085] hover:text-[#101828] hover:bg-[#EAECF0] dark:hover:bg-[#334155] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body Content */}
            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
              {/* Citizen Description */}
              <div>
                <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                  Citizen Description
                </label>
                <p className="text-xs text-[#344054] dark:text-slate-200 leading-relaxed p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151]">
                  {detailedComplaint.description}
                </p>
              </div>

              {/* Uploaded Evidence Photo & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                    Uploaded Evidence Photo
                  </label>
                  <img
                    src={detailedComplaint.images[0] || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?q=80&w=800'}
                    alt="Complaint evidence"
                    onError={(e) => {
                      e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 200"><rect width="400" height="200" fill="%231f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%239ca3af" font-family="sans-serif" font-size="13">Evidence Image Unavailable</text></svg>';
                    }}
                    className="w-full h-44 object-cover rounded-lg border border-[#EAECF0] dark:border-[#374151]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-1">
                    Location Information
                  </label>
                  <div className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-[#101828] dark:text-white font-medium">
                      <MapPin className="w-4 h-4 text-[#DC2626] shrink-0" />
                      <span>{detailedComplaint.location.address}</span>
                    </div>
                    <div className="text-[11px] text-[#667085]">
                      Ward: <strong className="text-[#344054] dark:text-slate-200">{detailedComplaint.location.ward}</strong>
                    </div>
                    <div className="text-[11px] font-mono text-[#667085]">
                      GPS: {detailedComplaint.location.lat.toFixed(4)}, {detailedComplaint.location.lng.toFixed(4)}
                    </div>
                    <div className="text-[11px] text-[#667085]">
                      Reported By: <strong className="text-[#344054] dark:text-slate-200">{detailedComplaint.citizenName}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Classification Result */}
              <div className="p-4 rounded-xl bg-[#EFF6FF] dark:bg-[#0F1E36] border border-[#BFDBFE] dark:border-[#1E3A8A]">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#DBEAFE] dark:border-[#1E3A8A]">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-xs font-bold text-[#1E40AF] dark:text-[#93C5FD]">
                      Rule-Based Bilingual Triage Summary
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-[#1E40AF] dark:text-[#93C5FD] bg-white dark:bg-[#111827] px-2 py-0.5 rounded border border-[#BFDBFE] dark:border-[#1E3A8A]">
                    {detailedComplaint.aiAnalysis?.trainedModelLoaded ? 'Hybrid ML + Rules' : 'Deterministic Ontology'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 block">Detected Category</span>
                    <span className="font-semibold text-[#101828] dark:text-white">
                      {detailedComplaint.aiAnalysis?.detectedCategory || detailedComplaint.category}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 block">Suggested Priority</span>
                    <span className="font-semibold text-[#101828] dark:text-white">
                      {detailedComplaint.aiAnalysis?.suggestedPriority || detailedComplaint.priority}
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] text-[#667085] dark:text-slate-400 block">Recommended Department</span>
                    <span className="font-semibold text-[#101828] dark:text-white">
                      {detailedComplaint.aiAnalysis?.recommendedDepartment || detailedComplaint.departmentAssigned || 'Roads & Infrastructure'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Department & Officer Assignment Controls */}
              <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#1F2937] border border-[#EAECF0] dark:border-[#374151] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#2563EB]" />
                    <span className="text-xs font-bold text-[#101828] dark:text-white">
                      Department Dispatch & Officer Assignment
                    </span>
                  </div>
                  {assignSuccess && (
                    <span className="text-[11px] font-semibold text-[#16A34A] flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Dispatched
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <select
                    value={assignDept}
                    onChange={(e) => setAssignDept(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-xs font-medium text-[#101828] dark:text-white"
                  >
                    {departments.filter((d) => d !== 'All').map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={assignOfficer}
                    onChange={(e) => setAssignOfficer(e.target.value)}
                    placeholder="Officer / Field Worker Name"
                    className="px-3 py-2 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#111827] text-xs text-[#101828] dark:text-white"
                  />

                  <button
                    type="button"
                    onClick={handleAssignOfficial}
                    disabled={assigning}
                    className="min-h-[38px] px-3 py-2 rounded-lg bg-[#111827] dark:bg-[#2563EB] hover:opacity-90 text-white text-xs font-semibold disabled:opacity-50 transition-opacity"
                  >
                    {assigning ? 'Assigning...' : 'Assign Department & Crew'}
                  </button>
                </div>
              </div>

              {/* Status History Timeline */}
              <div>
                <label className="text-[11px] font-bold text-[#667085] uppercase tracking-wider block mb-2">
                  Status History & Audit Trail
                </label>
                <div className="space-y-2 border border-[#EAECF0] dark:border-[#374151] rounded-lg p-3 bg-white dark:bg-[#1F2937] divide-y divide-[#F2F4F7] dark:divide-[#1E293B]">
                  {detailedComplaint.statusHistory?.map((step, idx) => (
                    <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-[#101828] dark:text-white">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                          <span>{step.status}</span>
                          <span className="text-[10px] text-[#667085] font-normal">by {step.updatedBy}</span>
                        </div>
                        {step.notes && (
                          <div className="text-[11px] text-[#667085] dark:text-slate-400 pl-5 mt-0.5">
                            "{step.notes}"
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-[#98A2B3]">
                        {formatDate(step.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resolution Evidence (If After Image Available) */}
              {detailedComplaint.afterImage && (
                <div>
                  <label className="text-[11px] font-bold text-[#16A34A] uppercase tracking-wider block mb-1">
                    Resolution Evidence (Field Work Verified)
                  </label>
                  <img
                    src={detailedComplaint.afterImage}
                    alt="Resolution evidence"
                    className="w-full h-44 object-cover rounded-lg border border-[#A7F3D0]"
                  />
                </div>
              )}

              {/* Admin Remarks Input */}
              <div className="pt-2 border-t border-[#EAECF0] dark:border-[#374151]">
                <label className="text-[11px] font-bold text-[#101828] dark:text-white uppercase tracking-wider block mb-1.5">
                  Official Admin Remarks & Directives
                </label>
                {remarkError && (
                  <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-medium">
                    {remarkError}
                  </div>
                )}
                <div className="flex flex-col min-[420px]:flex-row gap-2">
                  <input
                    type="text"
                    value={adminRemarkText}
                    onChange={(e) => setAdminRemarkText(e.target.value)}
                    placeholder="Enter official observation, directive to field crew, or resolution note..."
                    className="flex-1 min-w-0 px-3 py-2.5 rounded-lg border border-[#D0D5DD] dark:border-[#374151] bg-white dark:bg-[#1F2937] text-xs text-[#101828] dark:text-white focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                  <button
                    onClick={handleSaveAdminRemark}
                    disabled={savingRemark || !adminRemarkText.trim()}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-50 transition-colors shrink-0 flex items-center justify-center gap-1.5"
                  >
                    {savingRemark ? (
                      <span>Saving...</span>
                    ) : saveRemarkSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Save Note</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 pb-safe bg-[#F9FAFB] dark:bg-[#1F2937] border-t border-[#EAECF0] dark:border-[#374151] flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                {onOpenProgressModal && (
                  <button
                    onClick={() => {
                      const target = detailedComplaint;
                      setDetailedComplaint(null);
                      onOpenProgressModal(target);
                    }}
                    className="min-h-[40px] px-4 py-2 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Update Status / Upload After-Photo</span>
                  </button>
                )}
                {onSelectComplaint && (
                  <button
                    onClick={() => {
                      const target = detailedComplaint;
                      setDetailedComplaint(null);
                      onSelectComplaint(target);
                    }}
                    className="min-h-[40px] px-3 py-2 rounded-lg bg-white dark:bg-[#111827] border border-[#D0D5DD] dark:border-[#374151] text-xs font-semibold text-[#344054] dark:text-slate-200 hover:bg-[#F2F4F7] flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Full Timeline</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setDetailedComplaint(null)}
                className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-lg bg-white dark:bg-[#111827] border border-[#D0D5DD] dark:border-[#374151] text-xs font-semibold text-[#344054] dark:text-slate-300 hover:bg-[#F2F4F7]"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
