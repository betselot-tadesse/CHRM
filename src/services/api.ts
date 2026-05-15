import { supabase } from "./supabase.ts";

export const api = {
  getEmployees: async () => {
    const res = await fetch("/api/hrm/employees");
    return res.json();
  },
  getEmployeeDetail: async (id: string) => {
    const res = await fetch(`/api/hrm/employees/${id}`);
    return res.json();
  },
  createEmployee: async (data: any) => {
    const res = await fetch("/api/hrm/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateEmployee: async (id: string, data: any) => {
    const res = await fetch(`/api/hrm/employees/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteEmployee: async (id: string) => {
    const res = await fetch(`/api/hrm/employees/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },
  terminateEmployee: async (id: string, terminationDate: string, reason: string) => {
    const res = await fetch(`/api/hrm/employees/${id}/terminate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ terminationDate, reason })
    });
    return res.json();
  },
  updateSalary: async (id: string, data: any) => {
    const res = await fetch(`/api/hrm/employees/${id}/salary`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getGratuity: async (id: string) => {
    const res = await fetch(`/api/hrm/employees/${id}/gratuity`);
    return res.json();
  },
  getLeaveBalance: async (id: string) => {
    const res = await fetch(`/api/hrm/employees/${id}/leave-balance`);
    return res.json();
  },
  createLeaveRequest: async (id: string, data: any) => {
    const res = await fetch(`/api/hrm/employees/${id}/leaves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  getAlerts: async () => {
    const res = await fetch("/api/hrm/alerts");
    return res.json();
  },
  getAllLeaves: async () => {
    const res = await fetch("/api/hrm/leaves");
    return res.json();
  },
  updateLeaveStatus: async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch(`/api/hrm/leaves/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    return res.json();
  },
  triggerEmailAlerts: async () => {
    const res = await fetch("/api/hrm/alerts/trigger-email", {
      method: "POST"
    });
    return res.json();
  },
  getReports: async () => {
    const res = await fetch("/api/hrm/reports");
    return res.json();
  },
  getSettings: async () => {
    const res = await fetch("/api/hrm/settings");
    return res.json();
  },
  updateSettings: async (data: any) => {
    const res = await fetch("/api/hrm/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  getAllDocuments: async () => {
    const res = await fetch("/api/hrm/documents");
    return res.json();
  },
  addDocument: async (id: string, data: any) => {
    const res = await fetch(`/api/hrm/employees/${id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  uploadFile: async (employeeId: string, file: File, onProgress?: (pct: number) => void) => {
    const timestamp = Date.now();
    const cleanFileName = file.name.replace(/[^\w\d.]/g, '_');
    const path = `${employeeId}/${timestamp}_${cleanFileName}`;
    const bucket = 'documents';
    
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.trim() === '') {
      return Promise.reject(new Error("Supabase is not configured. Please provide VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Settings > Secrets."));
    }

    if (!supabaseUrl.startsWith("https://") && !supabaseUrl.startsWith("http://")) {
      return Promise.reject(new Error("Invalid VITE_SUPABASE_URL format. Must be an absolute URL starting with http:// or https://."));
    }

    const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucket}/${path}`;

    return new Promise<{ url: string; name: string }>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('Authorization', `Bearer ${supabaseAnonKey}`);
      xhr.setRequestHeader('apikey', supabaseAnonKey);
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(Math.round(percentComplete));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${path}`;
          resolve({ url: publicUrl, name: file.name });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Network error during upload. Double check your VITE_SUPABASE_URL is correct and active.'));
      
      const formData = new FormData();
      formData.append('file', file);
      // Supabase storage expects the file directly in the body for /object/{path} or as multipart
      // Actually standard upload is just the file body
      xhr.send(file);
    });
  },
  exportEmployees: async () => {
    const res = await fetch("/api/hrm/export/employees");
    return res.blob();
  },
  exportWPS: async (month: string) => {
    const res = await fetch(`/api/hrm/export/wps/${month}`);
    return res.blob();
  },
  getDocumentTypes: async () => {
    const res = await fetch("/api/hrm/document-types");
    return res.json();
  },
  updateDocumentTypes: async (types: string[]) => {
    const res = await fetch("/api/hrm/document-types", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ types })
    });
    return res.json();
  },
  getLeavePolicies: async () => {
    const res = await fetch("/api/hrm/leave-policies");
    return res.json();
  },
  getTradeLicenses: async () => {
    const res = await fetch("/api/hrm/trade-licenses");
    return res.json();
  },
  createTradeLicense: async (data: any) => {
    const res = await fetch("/api/hrm/trade-licenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  updateTradeLicense: async (id: string, data: any) => {
    const res = await fetch(`/api/hrm/trade-licenses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteTradeLicense: async (id: string) => {
    const res = await fetch(`/api/hrm/trade-licenses/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },
  getQuotaLogs: async (id: string) => {
    const res = await fetch(`/api/hrm/trade-licenses/${id}/logs`);
    return res.json();
  },
  updateLeavePolicies: async (policies: any[]) => {
    const res = await fetch("/api/hrm/leave-policies", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ policies })
    });
    return res.json();
  }
};
