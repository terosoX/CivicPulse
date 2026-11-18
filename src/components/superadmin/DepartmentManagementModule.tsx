import React, { useState } from 'react';
import {
  Building2,
  Clock,
  Phone,
  Mail,
  Plus,
  Edit3,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck
} from 'lucide-react';
import { Department } from '../../types';

interface DepartmentManagementModuleProps {
  departments: Department[];
  onUpdateDepartment: (dept: Department) => Promise<void>;
  onCreateDepartment: (dept: Partial<Department>) => Promise<void>;
}

export default function DepartmentManagementModule({
  departments,
  onUpdateDepartment,
  onCreateDepartment,
}: DepartmentManagementModuleProps) {
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newDeptData, setNewDeptData] = useState<Partial<Department>>({
    name: '',
    headName: '',
    email: '',
    phone: '',
    avgResolutionHours: 24,
    activeTickets: 0,
    resolvedTickets: 0,
  });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    await onUpdateDepartment(editingDept);
    setEditingDept(null);
  };

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateDepartment(newDeptData);
    setIsAddModalOpen(false);
    setNewDeptData({
      name: '',
      headName: '',
      email: '',
      phone: '',
      avgResolutionHours: 24,
      activeTickets: 0,
      resolvedTickets: 0,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Municipal Department Management
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure department structures, emergency contacts, leadership assignment, and Service Level Agreements (SLA).
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => (
          <div
            key={dept.id}
            className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm hover:border-indigo-500/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {dept.name}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                    <UserCheck className="w-3.5 h-3.5" />
                    Head: {dept.headName}
                  </div>
                </div>
                <button
                  onClick={() => setEditingDept(dept)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Department SLA & Contact"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-[#374151]">
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dept.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{dept.phone}</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white pt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Target SLA: {dept.avgResolutionHours} Hours Resolution</span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#374151] grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1F2937]">
                <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {dept.activeTickets}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Active Tickets
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1F2937]">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {dept.resolvedTickets}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Resolved Total
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Department Modal */}
      {editingDept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#374151] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#374151] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit {editingDept.name}
              </h3>
              <button onClick={() => setEditingDept(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department Head Name</label>
                <input
                  type="text"
                  value={editingDept.headName}
                  onChange={(e) => setEditingDept({ ...editingDept, headName: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    value={editingDept.email}
                    onChange={(e) => setEditingDept({ ...editingDept, email: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    value={editingDept.phone}
                    onChange={(e) => setEditingDept({ ...editingDept, phone: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Resolution SLA (Hours)</label>
                <input
                  type="number"
                  value={editingDept.avgResolutionHours}
                  onChange={(e) => setEditingDept({ ...editingDept, avgResolutionHours: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingDept(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Save Department SLA
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Department Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#374151] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#374151] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Add New Municipal Department
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDept} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={newDeptData.name}
                  onChange={(e) => setNewDeptData({ ...newDeptData, name: e.target.value })}
                  placeholder="e.g. Smart Transport & Traffic Signal Control"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department Head Name</label>
                <input
                  type="text"
                  required
                  value={newDeptData.headName}
                  onChange={(e) => setNewDeptData({ ...newDeptData, headName: e.target.value })}
                  placeholder="e.g. Er. Sameer Mehta"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Official Email</label>
                  <input
                    type="email"
                    required
                    value={newDeptData.email}
                    onChange={(e) => setNewDeptData({ ...newDeptData, email: e.target.value })}
                    placeholder="traffic@smartcity.gov"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Emergency Phone</label>
                  <input
                    type="text"
                    required
                    value={newDeptData.phone}
                    onChange={(e) => setNewDeptData({ ...newDeptData, phone: e.target.value })}
                    placeholder="+1 555-0800"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target SLA (Hours)</label>
                <input
                  type="number"
                  value={newDeptData.avgResolutionHours}
                  onChange={(e) => setNewDeptData({ ...newDeptData, avgResolutionHours: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
