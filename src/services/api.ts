import { Complaint, User, UserRole, Announcement, DashboardStats, AIAnalysisResult, Department, Ward } from '../types';

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('civic_token') : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

async function handleJsonResponse<T>(res: Response, defaultError = 'Request failed'): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    if (!res.ok) {
      throw new Error(`Server error (${res.status}). Please try again.`);
    }
    throw new Error('Server returned non-JSON response.');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error || defaultError);
  }
  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string, role?: string): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    });
    return handleJsonResponse<{ token: string; user: User }>(res, 'Login failed');
  },

  async demoSession(role: UserRole): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/demo-session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    });
    return handleJsonResponse<{ token: string; user: User }>(res, 'Failed to establish demo session');
  },

  async register(data: { name: string; email: string; password: string; phone?: string; ward?: string }): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleJsonResponse<{ token: string; user: User }>(res, 'Registration failed');
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleJsonResponse<{ message: string }>(res, 'Password reset request failed');
  },

  // Complaints
  async getComplaints(filters?: { status?: string; category?: string; ward?: string; priority?: string; search?: string; citizenId?: string }): Promise<Complaint[]> {
    const cleanFilters: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') cleanFilters[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleanFilters).toString();
    const res = await fetch(`/api/complaints${query ? `?${query}` : ''}`);
    return handleJsonResponse<Complaint[]>(res, 'Failed to fetch complaints');
  },

  async getComplaintById(id: string): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}`);
    return handleJsonResponse<Complaint>(res, 'Complaint not found');
  },

  async getComplaintByTicket(ticketNumber: string): Promise<Complaint | null> {
    const res = await fetch(`/api/complaints/${encodeURIComponent(ticketNumber)}`);
    if (res.status === 404) return null;
    return handleJsonResponse<Complaint>(res, 'Failed to fetch complaint ticket');
  },

  async createComplaint(data: Partial<Complaint>): Promise<Complaint> {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<Complaint>(res, 'Failed to submit complaint');
  },

  async submitEmergency(data: { emergencyCategory: string; description?: string; location: any; citizenName?: string; citizenPhone?: string; imageBase64?: string }): Promise<Complaint> {
    const res = await fetch('/api/complaints/emergency', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<Complaint>(res, 'Failed to submit emergency SOS');
  },

  async upvoteComplaint(id: string, userId?: string): Promise<{ success: boolean; upvotes: number; priority?: string }> {
    const res = await fetch(`/api/complaints/${id}/upvote`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ userId }),
    });
    return handleJsonResponse<{ success: boolean; upvotes: number; priority?: string }>(res, 'Failed to support complaint');
  },

  async checkDuplicate(data: { title: string; description?: string; category?: string; location?: any }): Promise<{ duplicateFound: boolean; existingComplaint?: Complaint; distanceMeters?: number; message?: string }> {
    const res = await fetch('/api/ai/check-duplicate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) return { duplicateFound: false };
    return res.json();
  },

  async updateComplaintStatus(id: string, data: { status?: string; notes?: string; updatedBy?: string; afterImage?: string; estimatedResolutionDate?: string }): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}/status`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<Complaint>(res, 'Failed to update complaint status');
  },

  async assignComplaint(
    id: string,
    department?: string,
    officerName?: string,
    estimatedResolutionDate?: string
  ): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}/assign`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ department, officerName, estimatedResolutionDate }),
    });
    return handleJsonResponse<Complaint>(res, 'Failed to assign complaint');
  },

  async submitFeedback(id: string, feedback: { rating: number; review: string; verificationImage?: string; confirmedResolved: boolean }): Promise<Complaint> {
    const res = await fetch(`/api/complaints/${id}/feedback`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(feedback),
    });
    return handleJsonResponse<Complaint>(res, 'Failed to submit feedback');
  },

  // AI
  async analyzeIssue(data: { title: string; description: string; imageBase64?: string; location?: any }): Promise<{ aiAnalysis: AIAnalysisResult }> {
    const res = await fetch('/api/ai/analyze-issue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleJsonResponse<{ aiAnalysis: AIAnalysisResult }>(res, 'Failed to analyze issue');
  },

  async parseVoice(transcript: string): Promise<{ title: string; description: string; category: string; priority: string }> {
    const res = await fetch('/api/ai/voice-parse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    return handleJsonResponse<{ title: string; description: string; category: string; priority: string }>(res, 'Failed to parse voice transcript');
  },

  // Announcements & Stats
  async getAnnouncements(filters?: { search?: string; category?: string; priority?: string; department?: string; status?: string; sortBy?: string }): Promise<Announcement[]> {
    const cleanFilters: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') cleanFilters[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleanFilters).toString();
    const res = await fetch(`/api/announcements${query ? `?${query}` : ''}`);
    if (!res.ok) return [];
    return res.json();
  },

  async getAnnouncementById(id: string): Promise<Announcement> {
    const res = await fetch(`/api/announcements/${id}`);
    return handleJsonResponse<Announcement>(res, 'Announcement not found');
  },

  async createAnnouncement(data: Partial<Announcement>): Promise<Announcement> {
    const res = await fetch('/api/announcements', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<Announcement>(res, 'Failed to create announcement');
  },

  async updateAnnouncement(id: string, data: Partial<Announcement>): Promise<Announcement> {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<Announcement>(res, 'Failed to update announcement');
  },

  async deleteAnnouncement(id: string): Promise<void> {
    const res = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleJsonResponse<{ success: boolean }>(res, 'Failed to delete announcement');
  },

  async bookmarkAnnouncement(id: string, isBookmarked: boolean): Promise<{ success: boolean; bookmarks: number }> {
    const res = await fetch(`/api/announcements/${id}/bookmark`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isBookmarked }),
    });
    return handleJsonResponse<{ success: boolean; bookmarks: number }>(res, 'Failed to bookmark announcement');
  },

  async viewAnnouncement(id: string): Promise<{ success: boolean; views: number }> {
    const res = await fetch(`/api/announcements/${id}/view`, { method: 'POST' });
    return handleJsonResponse<{ success: boolean; views: number }>(res, 'Failed to log announcement view');
  },

  async archiveAnnouncement(id: string): Promise<Announcement> {
    const res = await fetch(`/api/announcements/${id}/archive`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleJsonResponse<Announcement>(res, 'Failed to archive announcement');
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/stats/dashboard');
    return handleJsonResponse<DashboardStats>(res, 'Failed to fetch stats');
  },

  async getStats(): Promise<DashboardStats> {
    return this.getDashboardStats();
  },

  async getDepartments(): Promise<Department[]> {
    const res = await fetch('/api/departments');
    if (!res.ok) return [];
    return res.json();
  },

  async createDepartment(data: Partial<Department>): Promise<Department> {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<Department>(res, 'Failed to create department');
  },

  async updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
    const res = await fetch(`/api/departments/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<Department>(res, 'Failed to update department');
  },

  async getWards(): Promise<Ward[]> {
    const res = await fetch('/api/wards');
    if (!res.ok) return [];
    return res.json();
  },

  async createWard(data: Partial<Ward>): Promise<any> {
    const res = await fetch('/api/wards', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<any>(res, 'Failed to create ward');
  },

  async updateWard(id: string, data: Partial<Ward>): Promise<any> {
    const res = await fetch(`/api/wards/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(data),
    });
    return handleJsonResponse<any>(res, 'Failed to update ward');
  },

  async getNotifications(): Promise<any[]> {
    const res = await fetch('/api/notifications');
    if (!res.ok) return [];
    return res.json();
  },

  async markNotificationRead(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/notifications/${id}/read`, { method: 'POST' });
    return handleJsonResponse<{ success: boolean }>(res, 'Failed to mark notification read');
  },

  async markAllNotificationsRead(): Promise<{ success: boolean }> {
    const res = await fetch('/api/notifications/read-all', { method: 'POST' });
    return handleJsonResponse<{ success: boolean }>(res, 'Failed to mark notifications read');
  },

  // Super Admin Management Endpoints
  async getUsers(filters?: { role?: string; search?: string; status?: string }): Promise<User[]> {
    const cleanFilters: Record<string, string> = {};
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') cleanFilters[k] = String(v);
      });
    }
    const query = new URLSearchParams(cleanFilters).toString();
    const res = await fetch(`/api/admin/users${query ? `?${query}` : ''}`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  async createUser(userData: Partial<User>): Promise<User> {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(userData),
    });
    return handleJsonResponse<User>(res, 'Failed to create user');
  },

  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(userData),
    });
    return handleJsonResponse<User>(res, 'Failed to update user');
  },

  async deleteUser(id: string): Promise<void> {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    await handleJsonResponse<{ success: boolean }>(res, 'Failed to delete user');
  },

  async resetUserPassword(id: string): Promise<{ message: string; tempPassword?: string }> {
    const res = await fetch(`/api/admin/users/${id}/reset-password`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleJsonResponse<{ message: string; tempPassword?: string }>(res, 'Failed to reset password');
  },

  async getAuditLogs(): Promise<any[]> {
    const res = await fetch('/api/admin/audit-logs', { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async getSystemSettings(): Promise<any> {
    const res = await fetch('/api/admin/settings', { headers: authHeaders() });
    if (!res.ok) return {};
    return res.json();
  },

  async updateSystemSettings(settings: any): Promise<any> {
    const res = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(settings),
    });
    return handleJsonResponse<any>(res, 'Failed to update system settings');
  },

  async getCategoryConfigs(): Promise<any[]> {
    const res = await fetch('/api/admin/categories', { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async updateCategoryConfig(id: string, config: any): Promise<any> {
    const res = await fetch(`/api/admin/categories/${id}`, {
      method: 'PUT',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(config),
    });
    return handleJsonResponse<any>(res, 'Failed to update category configuration');
  },

  async getHealthMetrics(): Promise<any> {
    const res = await fetch('/api/admin/health', { headers: authHeaders() });
    if (!res.ok) return {};
    return res.json();
  },

  async getSecuritySessions(): Promise<any[]> {
    const res = await fetch('/api/admin/security/sessions', { headers: authHeaders() });
    if (!res.ok) return [];
    return res.json();
  },

  async terminateSecuritySession(sessionId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/security/sessions/${sessionId}/terminate`, {
      method: 'POST',
      headers: authHeaders(),
    });
    return handleJsonResponse<{ success: boolean }>(res, 'Failed to terminate session');
  },

  async sendEmergencyBroadcast(broadcast: any): Promise<any> {
    const res = await fetch('/api/admin/broadcast', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(broadcast),
    });
    return handleJsonResponse<any>(res, 'Failed to send emergency broadcast');
  },

  async getOfficers(): Promise<any[]> {
    const res = await fetch('/api/stats/officers');
    if (!res.ok) return [];
    return res.json();
  },

  async getWardPerformance(): Promise<any[]> {
    const res = await fetch('/api/stats/wards');
    if (!res.ok) return [];
    return res.json();
  },

  async getPublicTransparencyData(): Promise<any> {
    const res = await fetch('/api/public/transparency');
    return handleJsonResponse<any>(res, 'Failed to fetch public transparency data');
  },

  async predictTrends(): Promise<any> {
    const res = await fetch('/api/ai/predict');
    return handleJsonResponse<any>(res, 'Failed to fetch predictive analytics');
  },

  async getSimilarityMatches(data: { imageBase64?: string; category?: string; ward?: string }): Promise<any> {
    const res = await fetch('/api/ai/similarity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleJsonResponse<any>(res, 'Failed to compute similarity');
  },

  async uploadImage(imageBase64: string): Promise<{ url: string; filename: string; sizeBytes: number }> {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ imageBase64 }),
    });
    return handleJsonResponse<{ url: string; filename: string; sizeBytes: number }>(res, 'Failed to upload image to local storage');
  },
};
