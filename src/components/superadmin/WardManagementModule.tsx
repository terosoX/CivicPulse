import React, { useState } from 'react';
import {
  MapPin,
  Users,
  Building,
  Edit3,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Ward } from '../../types';

interface WardManagementModuleProps {
  wards: Ward[];
  onUpdateWard: (ward: Ward) => Promise<void>;
  onCreateWard: (ward: Partial<Ward>) => Promise<void>;
}

export default function WardManagementModule({
  wards,
  onUpdateWard,
  onCreateWard,
}: WardManagementModuleProps) {
  const [editingWard, setEditingWard] = useState<Ward | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newWardData, setNewWardData] = useState<Partial<Ward>>({
    name: '',
    code: '',
    councillor: '',
    population: 40000,
    activeComplaints: 0,
    resolvedComplaints: 0,
  });

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWard) return;
    await onUpdateWard(editingWard);
    setEditingWard(null);
  };

  const handleCreateWard = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateWard(newWardData);
    setIsAddModalOpen(false);
    setNewWardData({
      name: '',
      code: '',
      councillor: '',
      population: 40000,
      activeComplaints: 0,
      resolvedComplaints: 0,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
              <MapPin className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Municipal Ward & Territorial Governance
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Oversee ward jurisdictions, population demography, elected councillor leads, and spatial resolution performance.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Add Municipal Ward
        </button>
      </div>

      {/* Wards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wards.map((ward) => (
          <div
            key={ward.id}
            className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm hover:border-emerald-500/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-[#1F2937] text-slate-600 dark:text-slate-300">
                    {ward.code}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                    {ward.name}
                  </h3>
                </div>
                <button
                  onClick={() => setEditingWard(ward)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-slate-800 transition-colors"
                  title="Edit Ward Metadata"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-[#374151]">
                <div className="flex items-center gap-2">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>Councillor: <strong>{ward.councillor}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-slate-400" />
                  <span>Population: <strong>{ward.population.toLocaleString()} Residents</strong></span>
                </div>
              </div>
            </div>

            {/* Metrics */}
            <div className="pt-3 border-t border-slate-100 dark:border-[#374151] grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1F2937]">
                <div className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                  {ward.activeComplaints}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Active Issues
                </div>
              </div>
              <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#1F2937]">
                <div className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  {ward.resolvedComplaints}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold">
                  Resolved Total
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Ward Modal */}
      {editingWard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#374151] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#374151] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit Ward Metadata
              </h3>
              <button onClick={() => setEditingWard(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ward Name</label>
                <input
                  type="text"
                  value={editingWard.name}
                  onChange={(e) => setEditingWard({ ...editingWard, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ward Code</label>
                  <input
                    type="text"
                    value={editingWard.code}
                    onChange={(e) => setEditingWard({ ...editingWard, code: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Population</label>
                  <input
                    type="number"
                    value={editingWard.population}
                    onChange={(e) => setEditingWard({ ...editingWard, population: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Councillor / Representative</label>
                <input
                  type="text"
                  value={editingWard.councillor}
                  onChange={(e) => setEditingWard({ ...editingWard, councillor: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingWard(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Save Ward Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Ward Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#374151] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#374151] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Register New Municipal Ward
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateWard} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ward Name</label>
                <input
                  type="text"
                  required
                  value={newWardData.name}
                  onChange={(e) => setNewWardData({ ...newWardData, name: e.target.value })}
                  placeholder="e.g. Ward 7 - Tech Corridor West"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Ward Code</label>
                  <input
                    type="text"
                    required
                    value={newWardData.code}
                    onChange={(e) => setNewWardData({ ...newWardData, code: e.target.value })}
                    placeholder="W-07"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Population</label>
                  <input
                    type="number"
                    value={newWardData.population}
                    onChange={(e) => setNewWardData({ ...newWardData, population: Number(e.target.value) })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Councillor Name</label>
                <input
                  type="text"
                  required
                  value={newWardData.councillor}
                  onChange={(e) => setNewWardData({ ...newWardData, councillor: e.target.value })}
                  placeholder="e.g. Smt. Radhika Saxena"
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
                >
                  Register Ward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
