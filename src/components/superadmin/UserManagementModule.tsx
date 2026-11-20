import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Shield,
  UserCheck,
  UserX,
  KeyRound,
  Edit2,
  Trash2,
  Building2,
  MapPin,
  CheckCircle2,
  X,
  AlertTriangle
} from 'lucide-react';
import { User, UserRole } from '../../types';

interface UserManagementModuleProps {
  users: User[];
  onCreateUser: (user: Partial<User>) => Promise<void>;
  onUpdateUser: (id: string, user: Partial<User>) => Promise<void>;
  onDeleteUser: (id: string) => Promise<void>;
  onResetPassword: (id: string) => Promise<void>;
}

export default function UserManagementModule({
  users,
  onCreateUser,
  onUpdateUser,
  onDeleteUser,
  onResetPassword,
}: UserManagementModuleProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    phone: string;
    ward: string;
    department: string;
  }>({
    name: '',
    email: '',
    role: 'citizen',
    phone: '',
    ward: 'Ward 4 - Central Promenade',
    department: 'Roads & Infrastructure',
  });

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.department && u.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.phone && u.phone.includes(searchTerm));

    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || (u.status || 'active') === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleSubmitNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateUser(formData);
    setIsAddModalOpen(false);
    setFormData({
      name: '',
      email: '',
      role: 'citizen',
      phone: '',
      ward: 'Ward 4 - Central Promenade',
      department: 'Roads & Infrastructure',
    });
  };

  const handleSaveEditedUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    await onUpdateUser(editingUser.id, editingUser);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Module Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-[#111827] p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              User & Access Governance
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage citizens, field staff, department leads, and system administrator roles & permissions across municipal wards.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="w-full sm:w-auto min-h-[42px] px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add New User Account
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white dark:bg-[#111827] p-4 rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm">
        {/* Search Field */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, department, or phone..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#1F2937] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#374151] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Role Filter */}
        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1F2937] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#374151] focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="All">All Roles</option>
            <option value="citizen">Citizens</option>
            <option value="officer">Field Officers / Staff</option>
            <option value="admin">Municipal Admins</option>
            <option value="super_admin">Super Admins</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#1F2937] text-slate-900 dark:text-white text-xs border border-slate-200 dark:border-[#374151] focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended / Banned</option>
            <option value="pending">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Users Card List (Mobile) + Table (Tablet/Desktop) */}
      <div className="bg-white dark:bg-[#111827] rounded-2xl border border-slate-200 dark:border-[#374151] shadow-sm overflow-hidden">
        <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10 px-4 text-xs text-slate-400">
              No users matching criteria found.
            </div>
          ) : (
            filteredUsers.map((u) => (
              <div key={u.id} className="p-4 space-y-3 text-xs">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-slate-100 dark:bg-[#1F2937] text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center border border-slate-200 dark:border-[#374151]">
                      {u.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                        <span className="truncate">{u.name}</span>
                        {u.mfaEnabled && <Shield className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{u.email}</div>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      (u.status || 'active') === 'active'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                    }`}
                  >
                    {(u.status || 'active').toUpperCase()}
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold inline-flex items-center gap-1 ${
                      u.role === 'super_admin'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                        : u.role === 'admin'
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                        : u.role === 'officer'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                        : 'bg-slate-100 text-slate-700 dark:bg-[#1F2937] dark:text-slate-300'
                    }`}
                  >
                    {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Municipal Admin' : u.role === 'officer' ? 'Field Officer' : 'Citizen'}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400">
                    Joined {new Date(u.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="text-[11px] text-slate-600 dark:text-slate-300">
                  {u.department || 'General Public'} • <span className="text-slate-400">{u.ward || 'All Wards'}</span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => onResetPassword(u.id)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-[#1F2937] text-slate-600 dark:text-slate-300 hover:text-amber-600 font-semibold flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" /> Reset
                  </button>
                  <button
                    onClick={() => setEditingUser(u)}
                    className="min-h-[36px] px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => onDeleteUser(u.id)}
                    aria-label="Delete Account"
                    className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#1F2937]/80 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-[#374151]">
              <tr>
                <th className="py-3.5 px-4">User Details</th>
                <th className="py-3.5 px-4">Role & Privilege</th>
                <th className="py-3.5 px-4">Department / Ward</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No users matching criteria found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-[#1F2937] text-blue-600 dark:text-blue-400 font-bold flex items-center justify-center border border-slate-200 dark:border-[#374151]">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {u.name}
                            {u.mfaEnabled && (
                              <span title="MFA Protected" className="inline-flex">
                                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                          u.role === 'super_admin'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                            : u.role === 'admin'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : u.role === 'officer'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                            : 'bg-slate-100 text-slate-700 dark:bg-[#1F2937] dark:text-slate-300'
                        }`}
                      >
                        {u.role === 'super_admin' ? 'Super Admin' : u.role === 'admin' ? 'Municipal Admin' : u.role === 'officer' ? 'Field Officer' : 'Citizen'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      <div>{u.department || 'General Public'}</div>
                      <div className="text-[10px] text-slate-400">{u.ward || 'All Wards'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          (u.status || 'active') === 'active'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        }`}
                      >
                        {(u.status || 'active').toUpperCase()}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onResetPassword(u.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Reset Password"
                        >
                          <KeyRound className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Edit User Role/Ward"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteUser(u.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Delete Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-[#111827] rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-[#374151] shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-y-auto p-5 sm:p-6 pb-safe space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#374151] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create New System Account
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                aria-label="Close add user modal"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Er. Rajiv Kapoor"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. rajiv@smartcity.gov"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Account Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="officer">Department Officer</option>
                    <option value="field_worker">Field Worker / Specialist</option>
                    <option value="admin">Municipal Administrator</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 555-0199"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g. Roads & Infrastructure"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Primary Ward</label>
                  <input
                    type="text"
                    value={formData.ward}
                    onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                    placeholder="e.g. Ward 4 - Central Promenade"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white dark:bg-[#111827] rounded-t-2xl sm:rounded-2xl border border-slate-200 dark:border-[#374151] shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-y-auto p-5 sm:p-6 pb-safe space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#374151] pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Edit User Governance Settings
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                aria-label="Close edit user modal"
                className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Role</label>
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  >
                    <option value="citizen">Citizen</option>
                    <option value="officer">Department Officer</option>
                    <option value="field_worker">Field Worker / Specialist</option>
                    <option value="admin">Municipal Administrator</option>
                    <option value="super_admin">Super Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status</label>
                  <select
                    value={editingUser.status || 'active'}
                    onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                  >
                    <option value="active">Active</option>
                    <option value="suspended">Suspended / Banned</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Department Assigned</label>
                <input
                  type="text"
                  value={editingUser.department || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#1F2937] border border-slate-200 dark:border-[#374151] text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 flex flex-col-reverse sm:flex-row justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#1F2937] text-slate-700 dark:text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-auto min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 text-white font-bold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
