import React, { useState } from 'react';
import {
  Tag,
  Clock,
  Building2,
  Sliders,
  Sparkles,
  Edit3,
  CheckCircle2,
  X
} from 'lucide-react';
import { ComplaintCategoryConfig } from '../../types';

interface CategoryManagementModuleProps {
  categories: ComplaintCategoryConfig[];
  onUpdateCategory: (id: string, config: Partial<ComplaintCategoryConfig>) => Promise<void>;
}

export default function CategoryManagementModule({
  categories,
  onUpdateCategory,
}: CategoryManagementModuleProps) {
  const [editingCategory, setEditingCategory] = useState<ComplaintCategoryConfig | null>(null);

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    await onUpdateCategory(editingCategory.id, editingCategory);
    setEditingCategory(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
              <Tag className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Complaint Taxonomy & SLA Rules
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure automated department routing, priority weighting, default resolution SLA hours, and CivicPulse AI auto-classification thresholds.
          </p>
        </div>
      </div>

      {/* Category Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm hover:border-purple-500/40 transition-all space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-xs"
                    style={{ backgroundColor: cat.color || '#3b82f6' }}
                  >
                    <Tag className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      Default Dept: {cat.defaultDepartment}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setEditingCategory(cat)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-slate-800 transition-colors"
                  title="Configure Category SLA Rules"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-[#374151]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Target Resolution SLA:</span>
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    {cat.defaultSlaHours} Hours
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Priority Weight:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      cat.priorityWeight === 'Critical'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : cat.priorityWeight === 'High'
                        ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                    }`}
                  >
                    {cat.priorityWeight} Priority
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">CivicPulse AI Auto-Triage:</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                      cat.autoTriage
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-[#1F2937] dark:text-slate-400'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    {cat.autoTriage ? 'ENABLED' : 'MANUAL'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#374151] shadow-2xl w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#374151] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit SLA & Routing Rules ({editingCategory.name})
              </h3>
              <button onClick={() => setEditingCategory(null)} className="p-1 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Resolution SLA (Hours)</label>
                <input
                  type="number"
                  value={editingCategory.defaultSlaHours}
                  onChange={(e) => setEditingCategory({ ...editingCategory, defaultSlaHours: Number(e.target.value) })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Department Auto-Assignment</label>
                <input
                  type="text"
                  value={editingCategory.defaultDepartment}
                  onChange={(e) => setEditingCategory({ ...editingCategory, defaultDepartment: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Default Priority Weight</label>
                <select
                  value={editingCategory.priorityWeight}
                  onChange={(e) => setEditingCategory({ ...editingCategory, priorityWeight: e.target.value as any })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical Priority</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="autoTriageCheck"
                  checked={editingCategory.autoTriage}
                  onChange={(e) => setEditingCategory({ ...editingCategory, autoTriage: e.target.checked })}
                  className="w-4 h-4 rounded text-purple-600"
                />
                <label htmlFor="autoTriageCheck" className="font-bold text-slate-700 dark:text-slate-300">
                  Enable CivicPulse AI Auto-Classification & Triage for this Category
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold"
                >
                  Save Rules
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
