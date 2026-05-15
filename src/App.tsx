import React, { useState, useEffect } from "react";
import { Users, FileText, Landmark, CalendarDays, Plus, Search, ChevronRight, AlertCircle, Database, LayoutDashboard, Download, Edit, Trash2, X, CreditCard, Check, BarChart3, PieChart, Settings, Mail, Bell, Files, Upload, ShieldCheck, Building, History } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { api } from "./services/api.ts";
import { format, differenceInDays } from "date-fns";
import { z } from "zod";

import { SEED_EMPLOYEES } from "./data/seedData.ts";
import { calculateGratuity, calculateLeaveBalance, checkNearExpiry } from "./utils/calculations.ts";

const employeeSchema = z.object({
  empId: z.string().optional(),
  fullName: z.string().min(2, "Full name is required"),
  jobTitle: z.string().min(2, "Job title is required"),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  branch: z.enum(["CPH1", "CPH2", "GTC", "Wise"]),
  visaStatus: z.enum(["Company", "Own", "Emirati"]),
  workLocation: z.string().min(2, "Work location is required"),
  nationality: z.string().min(2, "Nationality is required"),
  passportAvailability: z.string().optional().or(z.literal("")),
  passportNumber: z.string().optional().or(z.literal("")),
  dateOfBirth: z.string().optional().or(z.literal("")),
  passportIssueDate: z.string().optional().or(z.literal("")),
  passportExpiryDate: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  personalNo: z.string().optional().or(z.literal("")),
  contractType: z.enum(["limited", "unlimited"]),
  status: z.enum(["active", "terminated"]),
  department: z.string().min(2, "Department is required"),
  laborCardNumber: z.string().optional(),
  iban: z.string().optional(),
  bankRoutingCode: z.string().optional(),
  visaExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  laborCardExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  healthCardExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal(""))
});

type EmployeeFormData = z.infer<typeof employeeSchema>;

const leaveRequestSchema = z.object({
  leaveType: z.enum(["Annual", "Sick", "Emergency", "Maternity", "Paternity", "Unpaid"]),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Start date is required"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "End date is required"),
  daysRequested: z.number().min(1, "At least 1 day is required"),
  reason: z.string().optional()
});

type LeaveRequestData = z.infer<typeof leaveRequestSchema>;

const salaryUpdateSchema = z.object({
  basicSalary: z.number().min(0, "Basic salary must be positive"),
  housingAllowance: z.number().min(0).default(0),
  transportAllowance: z.number().min(0).default(0),
  otherAllowances: z.number().min(0).default(0),
  deductions: z.number().min(0).default(0)
});

type SalaryUpdateData = z.infer<typeof salaryUpdateSchema>;

// --- Components ---

const LeaveRequestModal = ({ 
  isOpen, 
  onClose, 
  onSave,
  employeeName
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (data: LeaveRequestData) => Promise<void>,
  employeeName: string
}) => {
  const [formData, setFormData] = useState<Partial<LeaveRequestData>>({
    leaveType: 'Annual',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    daysRequested: 1
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        leaveType: 'Annual',
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
        daysRequested: 1
      });
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = leaveRequestSchema.parse({
        ...formData,
        daysRequested: Number(formData.daysRequested)
      });
      setErrors({});
      setIsSubmitting(true);
      await onSave(validatedData);
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-xl overflow-hidden"
      >
        <div className="bg-[#1e293b] p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight uppercase">Request Personnel Leave</h2>
            <p className="text-[10px] text-gray-400 font-mono mt-1">SST_HRM_LEAVE_FORM // EMP: {employeeName}</p>
          </div>
          <button onClick={onClose} className="hover:text-gray-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Leave Type</label>
              <select 
                value={formData.leaveType} 
                onChange={e => setFormData({ ...formData, leaveType: e.target.value as any })}
                className="w-full px-4 py-0 border border-[var(--border)] rounded flex h-10 text-sm bg-white outline-none"
              >
                <option value="Annual">Annual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Emergency">Emergency Leave</option>
                <option value="Maternity">Maternity Leave</option>
                <option value="Paternity">Paternity Leave</option>
                <option value="Unpaid">Unpaid Leave</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Total Days</label>
              <input 
                type="number" 
                value={formData.daysRequested || ''} 
                onChange={e => setFormData({ ...formData, daysRequested: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
              />
              {errors.daysRequested && <p className="text-[10px] text-red-500 font-bold">{errors.daysRequested}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Start Date</label>
              <input 
                type="date" 
                value={formData.startDate || ''} 
                onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
              />
              {errors.startDate && <p className="text-[10px] text-red-500 font-bold">{errors.startDate}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">End Date</label>
              <input 
                type="date" 
                value={formData.endDate || ''} 
                onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
              />
              {errors.endDate && <p className="text-[10px] text-red-500 font-bold">{errors.endDate}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Reason / Remarks</label>
            <textarea 
              value={formData.reason || ''} 
              onChange={e => setFormData({ ...formData, reason: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-[var(--border)] rounded text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white"
              placeholder="Provide reason for leave..."
            ></textarea>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 border border-gray-200 rounded text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-600"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-2 bg-[#1e293b] text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {isSubmitting ? "PROCESSING..." : "SUBMIT_REQUEST"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const DocumentUploadModal = ({
  isOpen,
  onClose,
  employeeId,
  employeeName,
  onSuccess
}: {
  isOpen: boolean,
  onClose: () => void,
  employeeId: string,
  employeeName: string,
  onSuccess: () => void
}) => {
  const [formData, setFormData] = useState({
    type: "Passport",
    issueDate: "",
    expiryDate: ""
  });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [docTypes, setDocTypes] = useState<string[]>(["Passport", "Visa", "Labor Card", "Emirates ID"]);

  useEffect(() => {
    if (isOpen) {
      setFormData({ type: "Passport", issueDate: "", expiryDate: "" });
      setSelectedFiles([]);
      setUploadProgress({});
      setIsSubmitting(false);
      api.getDocumentTypes().then(types => {
        if (Array.isArray(types) && types.length > 0) {
          setDocTypes(types);
          setFormData(prev => ({ ...prev, type: types[0] }));
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.expiryDate) return alert("Expiry date is mandatory.");
    if (selectedFiles.length === 0) return alert("Please select a file to upload.");

    try {
      setIsSubmitting(true);
      const uploadPromises = selectedFiles.map(async (file) => {
        const { url, name } = await api.uploadFile(employeeId, file, (pct) => {
          setUploadProgress(prev => ({ ...prev, [file.name]: pct }));
        });
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        await api.addDocument(employeeId, {
          documentType: formData.type,
          issueDate: formData.issueDate,
          expiryDate: formData.expiryDate,
          fileName: name,
          fileUrl: url
        });
      });
      await Promise.all(uploadPromises);
      onSuccess();
      onClose();
    } catch (err: any) {
      alert(`Upload Error: ${err.message || 'Failed to upload document.'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white max-w-md w-full shadow-2xl rounded"
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#1e293b]">Upload Document</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">TARGET: {employeeName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={16} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Document Type</label>
            <select 
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white"
            >
              {docTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Issue Date</label>
              <input 
                type="date"
                value={formData.issueDate}
                onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm font-mono focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Expiry Date</label>
              <input 
                type="date"
                required
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm font-mono focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Digital Asset</label>
            <input 
              type="file" 
              multiple
              onChange={handleFileChange}
              className="w-full text-sm font-mono file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-2 bg-gray-50 p-3 rounded border border-[var(--border)]">
              {selectedFiles.map(file => (
                <div key={file.name} className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-mono">
                     <span className="truncate max-w-[200px] font-bold">{file.name}</span>
                     <span className={uploadProgress[file.name] === 100 ? "text-green-600" : ""}>
                       {uploadProgress[file.name] || 0}%
                     </span>
                  </div>
                  <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${uploadProgress[file.name] === 100 ? "bg-green-500" : "bg-[var(--primary)]"}`}
                      style={{ width: `${uploadProgress[file.name] || 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)] mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 border border-gray-200 rounded text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-all text-gray-600"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting || selectedFiles.length === 0}
              className="px-8 py-2 bg-[var(--primary)] text-white rounded text-xs font-bold uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? "UPLOADING..." : "UPLOAD"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const SalaryModal = ({ 

  isOpen, 
  onClose, 
  onSave,
  initialData,
  employeeName
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (data: SalaryUpdateData) => Promise<void>,
  initialData?: any,
  employeeName: string
}) => {
  const [formData, setFormData] = useState<SalaryUpdateData>({
    basicSalary: 0,
    housingAllowance: 0,
    transportAllowance: 0,
    otherAllowances: 0,
    deductions: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData({
        basicSalary: initialData.basicSalary || 0,
        housingAllowance: initialData.housingAllowance || 0,
        transportAllowance: initialData.transportAllowance || 0,
        otherAllowances: initialData.otherAllowances || 0,
        deductions: initialData.deductions || 0
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = salaryUpdateSchema.parse(formData);
      setErrors({});
      setIsSubmitting(true);
      await onSave(validatedData);
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const total = formData.basicSalary + formData.housingAllowance + formData.transportAllowance + formData.otherAllowances - formData.deductions;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="bg-[#1e293b] p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tight uppercase">Adjust Compensation</h2>
            <p className="text-[10px] text-gray-400 font-mono mt-1">SST_HRM_FIN_MOD // EMP: {employeeName}</p>
          </div>
          <button onClick={onClose} className="hover:text-gray-300 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400">Basic Salary (AED)</label>
              <input 
                type="number" 
                value={formData.basicSalary || ''} 
                onChange={e => setFormData({ ...formData, basicSalary: Number(e.target.value) })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none font-mono"
              />
              {errors.basicSalary && <p className="text-[10px] text-red-500 font-bold">{errors.basicSalary}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Housing Allowance</label>
                <input 
                  type="number" 
                  value={formData.housingAllowance || ''} 
                  onChange={e => setFormData({ ...formData, housingAllowance: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Transport Allowance</label>
                <input 
                  type="number" 
                  value={formData.transportAllowance || ''} 
                  onChange={e => setFormData({ ...formData, transportAllowance: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Other (Mobile/Bonus)</label>
                <input 
                  type="number" 
                  value={formData.otherAllowances || ''} 
                  onChange={e => setFormData({ ...formData, otherAllowances: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400 text-red-500">Deductions</label>
                <input 
                  type="number" 
                  value={formData.deductions || ''} 
                  onChange={e => setFormData({ ...formData, deductions: Number(e.target.value) })}
                  className="w-full px-4 py-2 border border-red-100 rounded flex h-10 text-sm focus:ring-1 focus:ring-red-500 outline-none font-mono text-red-600"
                />
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg border-2 border-dashed flex justify-between items-center">
            <span className="text-xs font-bold uppercase text-gray-500">Calculated Monthly Total</span>
            <span className="text-xl font-mono font-bold text-[var(--primary)]">AED {total.toLocaleString()}</span>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)] uppercase">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-6 py-2 border border-gray-200 rounded text-xs font-bold text-gray-500 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-2 bg-[#1e293b] text-white rounded text-xs font-bold tracking-widest hover:bg-black transition-all disabled:opacity-50"
            >
              {isSubmitting ? "UPDATING..." : "COMMIT_CHANGES"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const SidebarItem = ({ icon: Icon, label, active, onClick, badge }: { icon: any, label: string, active: boolean, onClick: () => void, badge?: number }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between px-6 py-3 text-sm font-medium transition-colors ${
      active ? "bg-[rgba(255,255,255,0.1)] text-white border-l-4 border-[#3b82f6]" : "text-[#94a3b8] hover:text-white hover:bg-[rgba(255,255,255,0.05)]"
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} />
      {label}
    </div>
    {badge && (
      <span className="bg-[#ef4444] text-white px-1.5 py-0.5 rounded text-[10px] font-extrabold">{badge}</span>
    )}
  </button>
);

const StatCard = ({ label, value, subtext, color = "var(--text-main)" }: { label: string, value: string | number, subtext?: string, color?: string }) => (
  <div className="technical-card p-5">
    <p className="text-[12px] font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</p>
    <p className="text-2xl font-bold" style={{ color }}>{value}</p>
    {subtext && <p className="text-[11px] text-[var(--text-muted)] mt-2 font-medium">{subtext}</p>}
  </div>
);

const EmployeeModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (data: EmployeeFormData) => Promise<void>, 
  initialData?: any 
}) => {
  const [formData, setFormData] = useState<Partial<EmployeeFormData>>(initialData || {
    contractType: 'unlimited',
    status: 'active',
    department: 'Operations',
    branch: 'CPH1',
    visaStatus: 'Company'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {
        contractType: 'unlimited',
        status: 'active',
        department: 'Operations',
        branch: 'CPH1',
        visaStatus: 'Company'
      });
      setErrors({});
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validatedData = employeeSchema.parse(formData);
      setErrors({});
      setIsSubmitting(true);
      await onSave(validatedData);
      onClose();
    } catch (err) {
      if (err instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        err.issues.forEach((e) => {
          if (e.path[0]) newErrors[e.path[0] as string] = e.message;
        });
        setErrors(newErrors);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="technical-card w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
      >
        <div className="flex justify-between items-center p-6 border-b border-[var(--border)] sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold uppercase tracking-tight flex items-center gap-2">
            <Plus size={20} className="text-[var(--primary)]" />
            {initialData ? 'Edit Employee Profile' : 'Personnel Enrollment'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Emp ID</label>
              <input 
                type="text" 
                value={formData.empId || ''} 
                onChange={e => setFormData({ ...formData, empId: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Full Name</label>
              <input 
                type="text" 
                value={formData.fullName || ''} 
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
              {errors.fullName && <p className="text-[10px] text-red-500 font-bold">{errors.fullName}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Job Title</label>
              <input 
                type="text" 
                value={formData.jobTitle || ''} 
                onChange={e => setFormData({ ...formData, jobTitle: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
              {errors.jobTitle && <p className="text-[10px] text-red-500 font-bold">{errors.jobTitle}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Hire Date</label>
              <input 
                type="date" 
                value={formData.hireDate || ''} 
                onChange={e => setFormData({ ...formData, hireDate: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white"
              />
              {errors.hireDate && <p className="text-[10px] text-red-500 font-bold">{errors.hireDate}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Nationality</label>
              <input 
                type="text" 
                value={formData.nationality || ''} 
                onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
              {errors.nationality && <p className="text-[10px] text-red-500 font-bold">{errors.nationality}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Date of Birth</label>
              <input 
                type="date" 
                value={formData.dateOfBirth || ''} 
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Personal No</label>
              <input 
                type="text" 
                value={formData.personalNo || ''} 
                onChange={e => setFormData({ ...formData, personalNo: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Address</label>
              <input 
                type="text" 
                value={formData.address || ''} 
                onChange={e => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Passport Availability (Y/N)</label>
              <input 
                type="text" 
                value={formData.passportAvailability || ''} 
                onChange={e => setFormData({ ...formData, passportAvailability: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Passport No.</label>
              <input 
                type="text" 
                value={formData.passportNumber || ''} 
                onChange={e => setFormData({ ...formData, passportNumber: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Passport Issue Date</label>
              <input 
                type="date" 
                value={formData.passportIssueDate || ''} 
                onChange={e => setFormData({ ...formData, passportIssueDate: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Passport Expiry Date</label>
              <input 
                type="date" 
                value={formData.passportExpiryDate || ''} 
                onChange={e => setFormData({ ...formData, passportExpiryDate: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white"
              />
            </div>


            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Branch</label>
              <select 
                value={formData.branch || ''} 
                onChange={e => setFormData({ ...formData, branch: e.target.value as any })}
                className="w-full px-4 py-0 border border-[var(--border)] rounded flex h-10 text-sm bg-white outline-none"
              >
                <option value="CPH1">CPH1</option>
                <option value="CPH2">CPH2</option>
                <option value="GTC">GTC</option>
                <option value="Wise">Wise</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Visa Status</label>
              <select 
                value={formData.visaStatus || ''} 
                onChange={e => setFormData({ ...formData, visaStatus: e.target.value as any })}
                className="w-full px-4 py-0 border border-[var(--border)] rounded flex h-10 text-sm bg-white outline-none"
              >
                <option value="Company">Company</option>
                <option value="Own">Own</option>
                <option value="Emirati">Emirati</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Work Location</label>
              <input 
                type="text" 
                value={formData.workLocation || ''} 
                onChange={e => setFormData({ ...formData, workLocation: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
              {errors.workLocation && <p className="text-[10px] text-red-500 font-bold">{errors.workLocation}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Department</label>
              <input 
                type="text" 
                value={formData.department || ''} 
                onChange={e => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none"
              />
              {errors.department && <p className="text-[10px] text-red-500 font-bold">{errors.department}</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Contract Type</label>
              <select 
                value={formData.contractType || ''} 
                onChange={e => setFormData({ ...formData, contractType: e.target.value as any })}
                className="w-full px-4 py-0 border border-[var(--border)] rounded flex h-10 text-sm bg-white outline-none"
              >
                <option value="unlimited">Unlimited</option>
                <option value="limited">Limited</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Status</label>
              <select 
                value={formData.status || ''} 
                onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full px-4 py-0 border border-[var(--border)] rounded flex h-10 text-sm bg-white outline-none"
              >
                <option value="active">Active</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <h3 className="text-[10px] font-bold uppercase text-[var(--primary)] tracking-[0.2em] mb-4">WPS & Financial Banking Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Labor Card Number</label>
                <input 
                  type="text" 
                  placeholder="14-digit ID"
                  value={formData.laborCardNumber || ''} 
                  onChange={e => setFormData({ ...formData, laborCardNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">IBAN (UAE)</label>
                <input 
                  type="text" 
                  placeholder="AE..."
                  value={formData.iban || ''} 
                  onChange={e => setFormData({ ...formData, iban: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Bank Routing Code</label>
                <input 
                  type="text" 
                  placeholder="9-digit code"
                  value={formData.bankRoutingCode || ''} 
                  onChange={e => setFormData({ ...formData, bankRoutingCode: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <h3 className="text-[10px] font-bold uppercase text-[var(--primary)] tracking-[0.2em] mb-4">Compliance Documents Validity</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Visa Expiry</label>
                <input 
                  type="date" 
                  value={formData.visaExpiry || ''} 
                  onChange={e => setFormData({ ...formData, visaExpiry: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
                />
                {errors.visaExpiry && <p className="text-[10px] text-red-500 font-bold">{errors.visaExpiry}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Labor Card Expiry</label>
                <input 
                  type="date" 
                  value={formData.laborCardExpiry || ''} 
                  onChange={e => setFormData({ ...formData, laborCardExpiry: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
                />
                {errors.laborCardExpiry && <p className="text-[10px] text-red-500 font-bold">{errors.laborCardExpiry}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-widest">Health Card Validity</label>
                <input 
                  type="date" 
                  value={formData.healthCardExpiry || ''} 
                  onChange={e => setFormData({ ...formData, healthCardExpiry: e.target.value })}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
                />
                {errors.healthCardExpiry && <p className="text-[10px] text-red-500 font-bold">{errors.healthCardExpiry}</p>}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-[var(--border)]">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-2 border border-[var(--border)] text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-8 py-2 bg-[var(--primary)] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
              {initialData ? 'Commit Changes' : 'Initialize Profile'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// --- Main Views ---

const DashboardView = ({ employees, alerts, onSelectEmployee }: { employees: any[], alerts: any[], onSelectEmployee: (id: string) => void }) => {
  const activeEmployees = Array.isArray(employees) ? employees.filter(e => e.status === "active").length : 0;
  
  const expiringCount = alerts.length;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard label="Total Employees" value={Array.isArray(employees) ? employees.length : 0} subtext="Global count" />
        <StatCard label="Active Status" value={activeEmployees} subtext="Currently employed" />
        <StatCard label="Critical Alerts" value={expiringCount} subtext="Next 30 days" color={expiringCount > 0 ? "#ef4444" : "var(--text-main)"} />
        <StatCard label="Leave Requests" value="0" subtext="Pending approval" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="technical-card p-6 border-l-4 border-red-500">
            <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-red-600 uppercase tracking-tight">
              <AlertCircle size={16} /> Urgent Compliance Alerts
            </h3>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <div 
                    key={alert.id} 
                    onClick={() => onSelectEmployee(alert.employeeId)}
                    className="flex justify-between items-center p-3 bg-red-50 border border-red-100 rounded-lg cursor-pointer hover:bg-red-100 transition-colors group"
                  >
                    <div>
                      <p className="text-sm font-bold text-red-900">{alert.employeeName}</p>
                      <p className="text-[11px] text-red-700 font-medium uppercase tracking-tight">{alert.documentType} Expiry</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-red-600">{alert.daysLeft < 0 ? 'EXPIRED' : `${alert.daysLeft} DAYS LEFT`}</p>
                      <p className="text-[10px] text-red-400 group-hover:text-red-700 font-mono transition-colors">{alert.expiryDate ? format(new Date(alert.expiryDate), 'dd/MM/yyyy') : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No urgent document expiries detected.</p>
            )}
          </div>
        </div>

        <div className="technical-card p-6">
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-[var(--text-main)] uppercase tracking-tight">
            <LayoutDashboard size={16} /> System Metrics
          </h3>
          <div className="space-y-4">
            {[ 
              { label: "Gratuity Provisions", value: "AED 1.2M", status: "ok" },
              { label: "Visa Renewals", value: `${alerts.filter(a => a.documentType === 'Visa').length} Pending`, status: "warning" },
              { label: "Labour Card Expiry", value: `${alerts.filter(a => a.documentType === 'Labor Card').length} Critical`, status: "critical" }
            ].map((item, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b grid-line">
                <span className="text-sm text-gray-600">{item.label}</span>
                <span className="text-sm font-mono font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EmployeeListView = ({ 
  employees, 
  onSelect, 
  onAdd, 
  onEdit, 
  onDelete 
}: { 
  employees: any[], 
  onSelect: (id: string) => void,
  onAdd: () => void,
  onEdit: (emp: any) => void,
  onDelete: (id: string) => void
}) => {
  const [filterType, setFilterType] = useState<string>("all");
  const [visaFilter, setVisaFilter] = useState<string>("all");
  const [departmentFilter, setDepartmentFilter] = useState<string>("all");
  const [nationalityFilter, setNationalityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name_asc");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const safeEmployees = Array.isArray(employees) ? employees : [];
  
  // Extract unique options
  const departments = Array.from(new Set(safeEmployees.map(e => e.department).filter(Boolean)));
  const nationalities = Array.from(new Set(safeEmployees.map(e => e.nationality).filter(Boolean)));

  const filteredEmployees = safeEmployees.filter(emp => {
    const branchMatch = filterType === "all" || emp.branch === filterType;
    const visaMatch = visaFilter === "all" || emp.visaStatus === visaFilter;
    const deptMatch = departmentFilter === "all" || emp.department === departmentFilter;
    const natMatch = nationalityFilter === "all" || emp.nationality === nationalityFilter;
    const statusMatch = statusFilter === "all" || emp.status === statusFilter;
    
    const searchLower = searchQuery.toLowerCase().trim();
    const searchMatch = searchQuery.trim() === "" || 
      emp.fullName?.toLowerCase().includes(searchLower) ||
      emp.jobTitle?.toLowerCase().includes(searchLower) ||
      emp.branch?.toLowerCase().includes(searchLower);

    return branchMatch && visaMatch && deptMatch && natMatch && statusMatch && searchMatch;
  });

  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    switch (sortBy) {
      case "name_asc":
        return a.fullName?.localeCompare(b.fullName || "");
      case "name_desc":
        return b.fullName?.localeCompare(a.fullName || "");
      case "hire_asc":
        return new Date(a.hireDate || 0).getTime() - new Date(b.hireDate || 0).getTime();
      case "hire_desc":
        return new Date(b.hireDate || 0).getTime() - new Date(a.hireDate || 0).getTime();
      case "job_asc":
        return a.jobTitle?.localeCompare(b.jobTitle || "");
      case "job_desc":
        return b.jobTitle?.localeCompare(a.jobTitle || "");
      default:
        return 0;
    }
  });

  const handleExport = async () => {
    try {
      const blob = await api.exportEmployees();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crystal_hospitality_roster_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("Export failed. Please verify system connection.");
    }
  };

  return (
    <div className="technical-card overflow-hidden">
      <div className="flex flex-col gap-4 p-4 border-b border-[var(--border)] bg-gray-50/50">
        <div className="flex justify-between items-center bg-transparent">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
              <input 
                type="text" 
                placeholder="Search roster..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#3b82f6] w-64 text-[var(--text-main)] transition-all outline-none"
              />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-[var(--border)] rounded-lg text-sm px-3 py-2 bg-white text-[var(--text-main)] outline-none focus:ring-1 focus:ring-[#3b82f6]"
            >
              <option value="all">All Companies</option>
              <option value="CPH1">CPH1</option>
              <option value="CPH2">CPH2</option>
              <option value="GTC">GTC</option>
              <option value="Wise">Wise</option>
            </select>
            <select 
              value={visaFilter}
              onChange={(e) => setVisaFilter(e.target.value)}
              className="border border-[var(--border)] rounded-lg text-sm px-3 py-2 bg-white text-[var(--text-main)] outline-none focus:ring-1 focus:ring-[#3b82f6]"
            >
              <option value="all">Any Visa</option>
              <option value="Company">Company</option>
              <option value="Own">Own</option>
              <option value="Emirati">Emirati</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-[var(--border)] text-[var(--text-main)] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-all shadow-sm"
            >
              <Download size={16} /> Export CSV
            </button>
            <button 
              onClick={onAdd}
              className="flex items-center gap-2 bg-[#3b82f6] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 transition-all shadow-sm"
            >
              <Plus size={16} /> Add Employee
            </button>
          </div>
        </div>
        <div className="flex gap-4 items-center flex-wrap">
          <select 
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="border border-[var(--border)] rounded-lg text-sm px-3 py-2 bg-white text-[var(--text-main)] outline-none focus:ring-1 focus:ring-[#3b82f6]"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={String(dept)} value={String(dept)}>{String(dept)}</option>
            ))}
          </select>
          <select 
            value={nationalityFilter}
            onChange={(e) => setNationalityFilter(e.target.value)}
            className="border border-[var(--border)] rounded-lg text-sm px-3 py-2 bg-white text-[var(--text-main)] outline-none focus:ring-1 focus:ring-[#3b82f6]"
          >
            <option value="all">All Nationalities</option>
            {nationalities.map(nat => (
              <option key={String(nat)} value={String(nat)}>{String(nat)}</option>
            ))}
          </select>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-[var(--border)] rounded-lg text-sm px-3 py-2 bg-white text-[var(--text-main)] outline-none focus:ring-1 focus:ring-[#3b82f6]"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="terminated">Terminated</option>
            <option value="on_leave">On Leave</option>
          </select>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-[var(--border)] rounded-lg text-sm px-3 py-2 bg-white text-[var(--text-main)] outline-none focus:ring-1 focus:ring-[#3b82f6] ml-auto"
          >
            <option value="name_asc">Sort: Name (A-Z)</option>
            <option value="name_desc">Sort: Name (Z-A)</option>
            <option value="hire_asc">Sort: Hire Date (Oldest)</option>
            <option value="hire_desc">Sort: Hire Date (Newest)</option>
            <option value="job_asc">Sort: Job Title (A-Z)</option>
            <option value="job_desc">Sort: Job Title (Z-A)</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#f8fafc] border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider text-center w-12">#</th>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Employee Name</th>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Visa (Company)</th>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Passport Number</th>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y border-[var(--border)]">
            {sortedEmployees.map((emp, idx) => (
              <tr key={emp.id} className="hover:bg-[#f8fafc] group transition-colors cursor-pointer" onClick={() => onSelect(emp.id)}>
                <td className="px-6 py-4 text-[10px] font-mono text-gray-400 text-center">{idx + 1}</td>
                <td className="px-6 py-4 font-semibold text-[var(--text-main)]">{emp.fullName}</td>
                <td className="px-6 py-4">
                <span className="text-[10px] font-bold bg-[#f1f5f9] text-[#475569] px-2 py-1 rounded">
                  {emp.branch}
                </span>
                </td>
                <td className="px-6 py-4 text-[12px] font-mono text-gray-500">{emp.passportNumber || '-'}</td>
                <td className="px-6 py-4">
                 <span className={`status-pill ${emp.status === 'active' ? 'status-success' : 'status-danger'}`}>
                   {emp.status}
                 </span>
               </td>
               <td className="px-6 py-4 text-right">
                 <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                   <button 
                     onClick={() => onEdit(emp)}
                     className="p-1.5 hover:bg-gray-100 rounded-md text-gray-400 hover:text-[var(--primary)] transition-all"
                   >
                     <Edit size={14} />
                   </button>
                   <button 
                     onClick={() => { if(confirm('Are you sure you want to delete this employee?')) onDelete(emp.id); }}
                     className="p-1.5 hover:bg-red-50 rounded-md text-gray-400 hover:text-red-500 transition-all"
                   >
                     <Trash2 size={14} />
                   </button>
                   <ChevronRight size={16} className="text-gray-300 mt-1" />
                 </div>
               </td>
             </tr>
           ))}
         </tbody>
       </table>
      </div>
      {filteredEmployees.length === 0 && (
        <div className="p-12 text-center text-gray-400 font-mono text-xs uppercase tracking-widest">
          No records identified matching current criteria.
        </div>
      )}
    </div>
  );
};

const EmployeeDetailView = ({ employeeId, onBack, onRefresh }: { employeeId: string, onBack: () => void, onRefresh?: () => void }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false);
  const [isGratuityModalOpen, setIsGratuityModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        if (!data) setLoading(true);
        // Fetch employee base data
        const empParams = await api.getEmployeeDetail(employeeId);
        
        if (empParams && empParams.error) {
          setData({ error: "Employee record not found or network connection failed." });
          setLoading(false);
          return;
        }

        const employeeData = {
          fullName: empParams.fullName,
          jobTitle: empParams.jobTitle,
          hireDate: empParams.hireDate,
          branch: empParams.branch,
          visaStatus: empParams.visaStatus,
          workLocation: empParams.workLocation,
          nationality: empParams.nationality,
          contractType: empParams.contractType,
          status: empParams.status,
          department: empParams.department,
          laborCardNumber: empParams.laborCardNumber,
          iban: empParams.iban,
          bankRoutingCode: empParams.bankRoutingCode,
          passportAvailability: empParams.passportAvailability,
          passportNumber: empParams.passportNumber,
          dateOfBirth: empParams.dateOfBirth,
          passportIssueDate: empParams.passportIssueDate,
          passportExpiryDate: empParams.passportExpiryDate,
          address: empParams.address,
          personalNo: empParams.personalNo
        };

        const salary = empParams.salary;
        const documents = empParams.documents;

        // Fetch leaves from API
        const leavesData = await api.getAllLeaves();
        const employeeLeaves = Array.isArray(leavesData) ? leavesData.filter((l: any) => l.employeeId === employeeId) : [];

        // Fetch leaves calculation from API
        const leaveData = await api.getLeaveBalance(employeeId);
        
        const gratuityAmount = calculateGratuity(employeeData.hireDate, salary?.basicSalary || 0);

        const leaveHistory = employeeLeaves.map((l: any) => ({
          id: l.id,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          daysRequested: l.daysRequested,
          status: l.status,
          reason: l.reason
        }));

        setData({
          ...employeeData,
          salary,
          documents,
          gratuity: { amount: gratuityAmount },
          leave: { balance: leaveData?.balance || 0, usedDays: leaveData?.usedDays || 0 },
          leaveHistory
        });
      } catch (err: any) {
        console.warn("Profile load error:", err);
        setData({ error: err.message || "Failed to load employee parameters due to network issue." });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employeeId, refreshTrigger]);

  const handleSaveLeaveRequest = async (leaveData: LeaveRequestData) => {
    try {
      await api.createLeaveRequest(employeeId, leaveData);
      setRefreshTrigger(prev => prev + 1);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Leave Request Error: ${err.message}`);
    }
  };

  const handleUpdateSalary = async (salaryData: SalaryUpdateData) => {
    try {
      await api.updateSalary(employeeId, salaryData);
      setRefreshTrigger(prev => prev + 1);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Payroll Update Error: ${err.message}`);
    }
  };

  const handleTerminate = async (terminationDate: string, reason: string) => {
    try {
      await api.terminateEmployee(employeeId, terminationDate, reason);
      setRefreshTrigger(prev => prev + 1);
      if (onRefresh) onRefresh();
      setIsTerminateModalOpen(false);
    } catch (err: any) {
      alert(`Termination Error: ${err.message}`);
    }
  };

  const handleEditSave = async (updatedData: EmployeeFormData) => {
    try {
      await api.updateEmployee(employeeId, updatedData);
      setRefreshTrigger(prev => prev + 1);
      if (onRefresh) onRefresh();
      setIsEditModalOpen(false);
    } catch (err: any) {
      alert(`Update Error: ${err.message}`);
    }
  };

  const editFormData = React.useMemo(() => {
    if (!data) return undefined;
    return {
      ...data,
      hireDate: data.hireDate ? data.hireDate.substring(0, 10) : '',
      visaExpiry: data.documents?.find((d: any) => d.documentType === 'Visa')?.expiryDate?.substring(0, 10) || '',
      laborCardExpiry: data.documents?.find((d: any) => d.documentType === 'Labor Card')?.expiryDate?.substring(0, 10) || '',
      healthCardExpiry: data.documents?.find((d: any) => d.documentType === 'Health Card')?.expiryDate?.substring(0, 10) || ''
    };
  }, [data]);

  if (loading) return <div className="p-8 text-center text-gray-500 font-mono text-sm animate-pulse">ACQUIRING DATA_STREAM...</div>;
  if (!data || data.error) {
    return (
      <div className="p-8 technical-card text-center">
        <AlertCircle className="mx-auto text-red-500 mb-4" size={32} />
        <h3 className="font-bold text-lg mb-2">Error Loading Profile</h3>
        <p className="text-gray-500 text-sm mb-6">{data?.error || "Connection failed to backend services."}</p>
        <button onClick={onBack} className="px-4 py-2 bg-black text-white rounded text-sm font-bold uppercase">Back to Roster</button>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <button onClick={onBack} className="text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] mb-4 flex items-center gap-1 transition-colors">
            <ChevronRight className="rotate-180" size={14} /> Back to Roster
          </button>
          <h2 className="text-3xl font-bold text-[var(--text-main)] tracking-tight">{data.fullName}</h2>
          <p className="text-[var(--text-muted)] font-medium text-sm mt-1 uppercase tracking-wider">{data.jobTitle} | {data.department} | <span className="bg-[#3b82f6] text-white px-1.5 py-0.5 rounded text-[10px]">{data.branch}</span></p>
        </div>
        <div className="flex gap-2">
          {data.status !== "terminated" ? (
            <button 
              onClick={() => setIsTerminateModalOpen(true)}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors"
            >
              Terminate
            </button>
          ) : (
            <span className="px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-bold uppercase tracking-wider">Terminated</span>
          )}
          <button onClick={() => setIsEditModalOpen(true)} className="px-4 py-2 border border-[var(--border)] rounded-lg text-sm font-semibold text-[var(--text-main)] hover:bg-[#f8fafc]">Edit Profile</button>
          <button className="px-4 py-2 bg-[#3b82f6] text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-600">Generate Report</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="technical-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
              <Database size={14} /> Core Parameters
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-12">
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Personal No.</p>
                <p className="text-sm font-mono">{data.personalNo || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Nationality</p>
                <p className="text-sm font-medium">{data.nationality || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Date of Birth</p>
                <p className="text-sm font-mono">{data.dateOfBirth || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Hire Date</p>
                <p className="text-sm font-mono">{data.hireDate ? format(new Date(data.hireDate), 'dd/MM/yyyy') : '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Contract Type</p>
                <p className="text-sm font-medium capitalize">{data.contractType || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Address</p>
                <p className="text-sm font-medium truncate" title={data.address || ''}>{data.address || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Emirates ID</p>
                <p className="text-sm font-mono">{data.emiratesIdNumber || 'N/A'}</p>
              </div>
            </div>
          </div>

          <div className="technical-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-6 flex items-center gap-2">
              <FileText size={14} /> Passport Information
            </h3>
            <div className="grid grid-cols-2 gap-y-6 gap-x-12">
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Passport Availability</p>
                <p className="text-sm font-medium">{data.passportAvailability || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Passport Number</p>
                <p className="text-sm font-mono">{data.passportNumber || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Issue Date</p>
                <p className="text-sm font-mono">{data.passportIssueDate || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Expiry Date</p>
                <p className="text-sm font-mono">{data.passportExpiryDate || '-'}</p>
              </div>
            </div>
          </div>

          <div className="technical-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                <FileText size={14} /> Documents & Compliance
              </h3>
              <button onClick={() => setIsUploadModalOpen(true)} className="text-[10px] font-bold uppercase text-blue-600 hover:underline">Upload Document</button>
            </div>
            <div className="space-y-4">
              {data.documents?.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 border-2 border-dashed grid-line rounded text-center">No documents indexed</p>
              ) : (
                data.documents?.map((doc: any, i: number) => (
                  <div key={i} className="flex justify-between items-center p-3 border rounded grid-line hover:border-gray-400 transition-colors">
                    <div>
                      <p className="text-sm font-semibold capitalize">{doc.documentType.replace('_', ' ')}</p>
                      <p className="text-[11px] text-gray-500 font-mono">Expires: {doc.expiryDate ? format(new Date(doc.expiryDate), 'dd/MM/yyyy') : ''}</p>
                    </div>
                    <div className="text-right">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                         doc.expiryStatus.status === 'critical' ? 'bg-red-100 text-red-700' :
                         doc.expiryStatus.status === 'warning' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                       }`}>
                         {doc.expiryStatus.status}
                       </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financials & Leaves */}
        <div className="space-y-6">
          <div className="technical-card p-6 bg-[#f8fafc] border-[var(--primary)] border-l-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                <Landmark size={14} /> Salary & Gratuity
              </h3>
              <button 
                onClick={() => setIsSalaryModalOpen(true)}
                className="text-[10px] font-bold uppercase text-blue-600 hover:underline"
              >
                Adjust Pay
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Basic Salary</span>
                <span className="text-sm font-bold">AED {data.salary?.basicSalary.toLocaleString() || '0'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-[var(--text-muted)]">Total Monthly</span>
                <span className="text-sm font-bold">AED {data.salary?.totalSalary.toLocaleString() || '0'}</span>
              </div>
              
              {data.salary?.deductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-red-500">Gross Deductions</span>
                  <span className="text-sm font-bold text-red-500">(- AED {data.salary.deductions.toLocaleString()})</span>
                </div>
              )}

              <div className="pt-4 border-t border-[var(--border)] mt-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Gratuity Accrued</span>
                  <span className="text-lg font-bold text-[var(--primary)]">AED {data.gratuity?.amount.toLocaleString()}</span>
                </div>
                <p className="text-[10px] text-[var(--text-muted)] mt-2">Calculated based on UAE Labor Law Article 51</p>
                <button 
                  onClick={() => setIsGratuityModalOpen(true)}
                  className="w-full mt-4 py-2 bg-blue-50 text-blue-600 text-xs font-bold uppercase hover:bg-blue-100 transition-colors tracking-widest rounded transition-all"
                >
                  Open Gratuity Calculator
                </button>
              </div>
            </div>
          </div>

          <div className="technical-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <CreditCard size={14} /> WPS Banking Details
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">Labor ID</span>
                <span className="text-xs font-mono">{data.laborCardNumber || 'NOT_SET'}</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-2">
                <span className="text-[10px] uppercase font-bold text-gray-400">Routing Code</span>
                <span className="text-xs font-mono">{data.bankRoutingCode || 'NOT_SET'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-gray-400">IBAN</span>
                <span className="text-[11px] font-mono bg-gray-50 p-2 rounded break-all">{data.iban || 'NOT_REGISTERED'}</span>
              </div>
            </div>
          </div>

          <div className="technical-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <CalendarDays size={14} /> Leave Management
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Available</p>
                <p className="text-xl font-mono font-bold">{data.leave?.balance}D</p>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <p className="text-[10px] font-bold text-gray-500 uppercase">Used</p>
                <p className="text-xl font-mono font-bold">{data.leave?.usedDays}D</p>
              </div>
            </div>
            <button 
              onClick={() => setIsLeaveModalOpen(true)}
              className="w-full mt-4 py-2 bg-gray-100 text-xs font-bold uppercase hover:bg-gray-200 transition-colors uppercase tracking-widest"
            >
              Request Leave
            </button>
          </div>

          <div className="technical-card p-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Plus size={14} className="rotate-45" /> Request History
            </h3>
            <div className="space-y-3">
              {data.leaveHistory?.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic font-mono">No records on file</p>
              ) : (
                data.leaveHistory.map((req: any) => (
                  <div key={req.id} className="p-3 border rounded grid-line bg-white">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[11px] font-bold uppercase">{req.leaveType}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        req.status === 'approved' ? 'bg-green-100 text-green-700' :
                        req.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                      <span>{format(new Date(req.startDate), 'dd/MM/yyyy')} - {format(new Date(req.endDate), 'dd/MM/yyyy')}</span>
                      <span className="font-bold">{req.daysRequested}D</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <LeaveRequestModal 
        isOpen={isLeaveModalOpen} 
        onClose={() => setIsLeaveModalOpen(false)} 
        onSave={handleSaveLeaveRequest}
        employeeName={data.fullName}
      />

      <SalaryModal 
        isOpen={isSalaryModalOpen} 
        onClose={() => setIsSalaryModalOpen(false)} 
        onSave={handleUpdateSalary}
        initialData={data.salary}
        employeeName={data.fullName}
      />

      <TerminateModal
        isOpen={isTerminateModalOpen}
        onClose={() => setIsTerminateModalOpen(false)}
        onSave={handleTerminate}
        employeeName={data.fullName}
      />

      <GratuityCalculatorModal
        isOpen={isGratuityModalOpen}
        onClose={() => setIsGratuityModalOpen(false)}
        employeeName={data.fullName}
        hireDate={data.hireDate}
        basicSalary={data.salary?.basicSalary || 0}
      />

      <EmployeeModal 
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditSave}
        initialData={editFormData}
      />

      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        employeeId={data.id}
        employeeName={data.fullName}
        onSuccess={() => setRefreshTrigger(prev => prev + 1)}
      />
    </motion.div>
  );
};

const TerminateModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  employeeName 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  onSave: (date: string, reason: string) => void, 
  employeeName: string 
}) => {
  const [terminationDate, setTerminationDate] = useState("");
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-red-600">Terminate Employment</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">TARGET: {employeeName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(terminationDate, reason); }} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Effective Date</label>
            <input 
              type="date" 
              required
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Reason Code</label>
            <select 
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-50 focus:bg-white focus:ring-2 focus:ring-red-500 outline-none"
            >
              <option value="">Select reason...</option>
              <option value="resignation">Resignation</option>
              <option value="termination_with_cause">Termination (With Cause)</option>
              <option value="termination_without_cause">Termination (Without Cause)</option>
              <option value="redundancy">Redundancy / Layoff</option>
              <option value="contract_expiry">End of Contract</option>
            </select>
          </div>
          <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded font-medium">
            Warning: This action will mark the employee as terminated and may trigger end-of-service benefits calculations.
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
            <button type="submit" className="px-5 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm transition-all uppercase tracking-wider">Execute Termination</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const GratuityCalculatorModal = ({ 
  isOpen, 
  onClose, 
  employeeName,
  hireDate,
  basicSalary
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  employeeName: string,
  hireDate: string,
  basicSalary: number
}) => {
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().substring(0, 10));

  if (!isOpen) return null;

  const estimatedGratuity = calculateGratuity(hireDate, basicSalary, terminationDate);

  const start = new Date(hireDate);
  const end = new Date(terminationDate);
  const totalDays = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 3600 * 24));
  const totalYears = (totalDays / 365.25).toFixed(2);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-main)]">Gratuity Calculator</h2>
            <p className="text-xs text-gray-500 font-mono mt-1">TARGET: {employeeName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={20} /></button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Hire Date</label>
              <input 
                type="text" 
                disabled
                value={format(new Date(hireDate), 'dd/MM/yyyy')}
                className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-100 outline-none cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-2">Basic Salary (AED)</label>
              <input 
                type="text" 
                disabled
                value={basicSalary.toLocaleString()}
                className="w-full px-4 py-2 border rounded-lg text-sm bg-gray-100 outline-none cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-blue-600 uppercase mb-2">Projected Termination Date</label>
            <input 
              type="date" 
              required
              value={terminationDate}
              onChange={(e) => setTerminationDate(e.target.value)}
              className="w-full px-4 py-2 border border-blue-200 rounded-lg text-sm bg-blue-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded border mt-4">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">Years of Service</span>
              <span className="text-sm font-bold">{totalYears} Years</span>
            </div>
            <div className="flex justify-between mb-2 pb-2 border-b">
              <span className="text-sm text-gray-600">Eligibility</span>
              <span className="text-sm font-bold">{Number(totalYears) >= 1 ? 'Eligible' : 'Not Eligible (< 1 Year)'}</span>
            </div>
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs font-bold uppercase text-gray-500">Estimated Gratuity</span>
              <span className="text-2xl font-bold text-[var(--primary)]">AED {estimatedGratuity.toLocaleString()}</span>
            </div>
          </div>

          <div className="text-[10px] text-gray-400 text-center italic mt-2">
            Calculated based on UAE Labor Law Article 51.<br />
            21 days for the first 5 years, 30 days for each additional year.
          </div>

          <div className="flex justify-end pt-4 border-t mt-4">
            <button type="button" onClick={onClose} className="w-full px-5 py-3 text-sm font-bold text-white bg-[var(--primary)] hover:bg-black rounded-lg shadow-sm transition-all uppercase tracking-wider">
              Close Calculator
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const FinanceView = () => {
  const [month, setMonth] = useState(new Date().toISOString().substring(0, 7));
  const [isExporting, setIsExporting] = useState(false);

  const handleWPSExport = async () => {
    try {
      setIsExporting(true);
      const blob = await api.exportWPS(month);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `WPS_SIF_${month}.sif`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert("WPS Export failed. Ensure all personnel have IBAN and Labor IDs configured.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="technical-card p-8 bg-white">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold tracking-tighter uppercase italic">Wages Protection System (WPS)</h2>
            <p className="text-xs text-[var(--text-muted)] font-mono mt-2 tracking-widest uppercase">Central Bank of the United Arab Emirates // SIF Generation Module</p>
          </div>
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded text-[10px] font-bold uppercase tracking-[0.2em] border border-blue-100">
            UAE Compliance: Active
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <p className="text-sm leading-relaxed text-[var(--text-main)] italic border-l-4 border-blue-500 pl-4">
              "The Wages Protection System (WPS) is an electronic salary transfer system that allows companies to pay workers' wages via banks, bureaux de change, and financial institutions approved and authorized by the Central Bank of the UAE."
            </p>
            <div className="p-6 bg-[#f8fafc] border border-[var(--border)] rounded-lg space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-[var(--primary)]">SIF File Parameters</h4>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Target Payroll Month</label>
                <input 
                  type="month" 
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="w-full px-4 py-2 border border-[var(--border)] rounded flex h-10 text-sm focus:ring-1 focus:ring-[var(--primary)] outline-none bg-white font-mono"
                />
              </div>
              <button 
                onClick={handleWPSExport}
                disabled={isExporting}
                className="w-full py-4 bg-[#1e293b] text-white rounded text-xs font-bold uppercase tracking-[0.3em] hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isExporting ? "GENERATING_SIF..." : "ENCRYPT_&_GENERATE_SIF"}
                <Download size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Compliance Checklist</h4>
            {[
              "14-Digit Labor Card Number presence",
              "Valid UAE IBAN (AE Prefix)",
              "9-Digit Central Bank Routing Code",
              "Minimum 70% Salary Disbursement",
              "Active UAE Establishment ID (MoHRE)"
            ].map((check, i) => (
              <div key={i} className="flex items-center gap-3 p-3 border-b border-dashed border-gray-200">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                <span className="text-[11px] font-medium text-gray-600">{check}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Establishment ID" value="1234567890123" subtext="Registered with MoHRE" />
        <StatCard label="Payer Bank Code" value="123456789" subtext="Central Bank Routing" />
        <StatCard label="SIF Version" value="1.0" subtext="Current Standard" />
      </div>
    </div>
  );
};

const LeavesManagementView = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeaves = async () => {
    try {
      setLoading(true);
      const data = await api.getAllLeaves();
      setLeaves(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Failed to load leaves", e);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, []);

  const handleUpdateStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await api.updateLeaveStatus(id, status);
      loadLeaves();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 font-mono text-sm animate-pulse">SYNCING_LEAVE_REGISTRIES...</div>;

  return (
    <div className="space-y-6">
      <div className="technical-card overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#f8fafc] border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Employee</th>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Type</th>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Period</th>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Days</th>
              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Status</th>
              <th className="px-6 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y border-[var(--border)] bg-white">
            {leaves.map((l: any) => (
              <tr key={l.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-900">{l.employeeName}</td>
                <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{l.leaveType}</td>
                <td className="px-6 py-4 font-mono text-xs">
                  {format(new Date(l.startDate), 'dd/MM/yyyy')} - {format(new Date(l.endDate), 'dd/MM/yyyy')}
                </td>
                <td className="px-6 py-4 font-bold">{l.daysRequested}D</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    l.status === 'approved' ? 'bg-green-100 text-green-700' :
                    l.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                  }`}>
                    {l.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {l.status === 'pending' ? (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(l.id, 'approved')}
                        className="p-1.5 bg-green-50 text-green-600 rounded hover:bg-green-100 transition-colors"
                        title="Approve"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(l.id, 'rejected')}
                        className="p-1.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                        title="Decline"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400 font-mono uppercase">Processed</span>
                  )}
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-gray-400 font-mono text-sm uppercase tracking-widest">
                  No leave applications currently in circulation.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const ReportsView = () => {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await api.getReports();
        if (data && !data.error) {
          setReportData(data);
        } else {
          console.error("Reports data error", data?.error);
        }
      } catch (e) {
        console.error("Failed to load reports", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-400 font-mono text-sm animate-pulse">GENERATING_ANALYTICAL_MODELS...</div>;
  if (!reportData) return null;

  const totalDeptEmployees = Object.values(reportData.demographics.byDepartment).reduce((a: any, b: any) => a + b, 0) as number;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 1. Demographics Section */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4 flex items-center gap-2">
          <PieChart size={16} /> Personnel Demographics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="technical-card p-6 bg-white">
            <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-4">Distribution by Department</h4>
            <div className="space-y-3">
              {Object.entries(reportData.demographics.byDepartment).map(([dept, count]: any) => (
                <div key={dept} className="flex items-center gap-4">
                  <span className="text-xs font-mono w-24 truncate">{dept}</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--primary)]" 
                      style={{ width: `${(count / (totalDeptEmployees || 1)) * 100}%` }} 
                    />
                  </div>
                  <span className="text-xs font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="technical-card p-6 bg-white">
            <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-4">Distribution by Nationality</h4>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
              {Object.entries(reportData.demographics.byNationality).sort((a: any, b: any) => b[1] - a[1]).map(([nat, count]: any) => (
                <div key={nat} className="flex justify-between items-center border-b border-dashed border-gray-100 pb-2">
                  <span className="text-xs font-medium">{nat}</span>
                  <span className="text-xs font-mono font-bold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Salary Summary Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] flex items-center gap-2">
            <Landmark size={16} /> Compensation Intelligence
          </h3>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase text-gray-400">Total Payroll Costs</p>
            <p className="text-xl font-bold text-[var(--primary)] tracking-tighter">
              AED {Math.round(reportData.salarySummary.totalPayroll || 0).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <StatCard label="Total Basic" value={`AED ${Math.round(reportData.salarySummary.totalBasic).toLocaleString()}`} subtext="Operational Fixed Cost" />
          <StatCard label="Total Allowances" value={`AED ${Math.round(reportData.salarySummary.totalAllowances).toLocaleString()}`} subtext="Variable Components" />
          <StatCard label="Total Deductions" value={`AED ${Math.round(reportData.salarySummary.totalDeductions).toLocaleString()}`} subtext="Fine/Tax Adjustments" />
          <StatCard label="Avg. Salary" value={`AED ${Math.round(reportData.salarySummary.avgSalary).toLocaleString()}`} subtext="Per Employee" />
        </div>
        <div className="technical-card p-0 bg-white overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h4 className="text-[10px] font-bold uppercase text-gray-400">Payroll Expenditure by Department</h4>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50">
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Department</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Headcount</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Basic Salary</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Allowances</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Deductions</th>
                  <th className="p-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider text-right">Avg Salary</th>
                  <th className="p-4 text-[10px] font-bold text-[var(--primary)] uppercase tracking-wider text-right">Total Payroll</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {Object.entries(reportData.salarySummary.byDepartment).map(([dept, data]: any) => (
                  <tr key={dept} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-xs font-bold uppercase text-gray-900">{dept}</td>
                    <td className="p-4 text-xs font-mono text-gray-600 text-right">{data.count}</td>
                    <td className="p-4 text-xs font-mono text-gray-600 text-right">AED {Math.round(data.totalBasic).toLocaleString()}</td>
                    <td className="p-4 text-xs font-mono text-green-600 text-right">+AED {Math.round(data.allowances).toLocaleString()}</td>
                    <td className="p-4 text-xs font-mono text-red-600 text-right">-AED {Math.round(data.deductions).toLocaleString()}</td>
                    <td className="p-4 text-xs font-mono font-bold text-gray-700 text-right">AED {Math.round(data.avgSalary).toLocaleString()}</td>
                    <td className="p-4 text-sm font-mono font-bold text-[var(--primary)] text-right">AED {Math.round(data.totalSalary).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Leave Trend Section */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4 flex items-center gap-2">
          <BarChart3 size={16} /> Workforce Availability Trends
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="technical-card p-6 bg-slate-900 text-white col-span-1 md:col-span-1">
             <h4 className="text-[10px] font-bold uppercase text-slate-500 mb-6">Application Status</h4>
             <div className="space-y-6">
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-2xl font-bold text-green-400">{reportData.leaveTrends.approvedTotal}</p>
                   <p className="text-[10px] uppercase font-bold text-slate-400">Approved</p>
                 </div>
                 <div className="h-10 w-1 bg-green-500/20 rounded-full overflow-hidden">
                    <div className="w-full bg-green-500" style={{ height: '100%' }} />
                 </div>
               </div>
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-2xl font-bold text-orange-400">{reportData.leaveTrends.pendingTotal}</p>
                   <p className="text-[10px] uppercase font-bold text-slate-400">Pending</p>
                 </div>
                 <div className="h-10 w-1 bg-orange-500/20 rounded-full overflow-hidden">
                    <div className="w-full bg-orange-500" style={{ height: '100%' }} />
                 </div>
               </div>
             </div>
          </div>
          <div className="technical-card p-6 bg-white col-span-1 md:col-span-2">
             <h4 className="text-[10px] font-bold uppercase text-gray-400 mb-6">Leave Categorization</h4>
             <div className="flex flex-wrap gap-4">
                {Object.entries(reportData.leaveTrends.byType).map(([type, count]: any) => (
                  <div key={type} className="px-4 py-3 border border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                    <p className="text-lg font-bold">{count}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">{type}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const DocumentsView = ({ employees }: { employees: any[] }) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [formData, setFormData] = useState({
    type: "Emirates ID",
    issueDate: "",
    expiryDate: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [systemDocTypes, setSystemDocTypes] = useState<string[]>(["Emirates ID"]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const [data, types] = await Promise.all([
        api.getAllDocuments(),
        api.getDocumentTypes()
      ]);
      setDocuments(Array.isArray(data) ? data : []);
      if (Array.isArray(types)) {
        setSystemDocTypes(types.length > 0 ? types : ["Emirates ID"]);
        if (types.length > 0 && !formData.type) {
          setFormData(prev => ({ ...prev, type: types[0] }));
        }
      }
    } catch (e) {
      console.error(e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files));
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) return alert("Please select an employee.");
    if (!formData.expiryDate) return alert("Expiry date is mandatory.");
    if (selectedFiles.length === 0) return alert("Please select at least one file to upload.");

    try {
      setIsSubmitting(true);
      
      const uploadPromises = selectedFiles.map(async (file) => {
        try {
          const { url, name } = await api.uploadFile(selectedEmployee, file, (pct) => {
            setUploadProgress(prev => ({ ...prev, [file.name]: pct }));
          });
          
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

          await api.addDocument(selectedEmployee, {
            documentType: formData.type,
            issueDate: formData.issueDate,
            expiryDate: formData.expiryDate,
            fileName: name,
            fileUrl: url
          });
          return { success: true, file: file.name };
        } catch (err) {
          console.error("Upload failed for", file.name, err);
          return { success: false, file: file.name, error: err };
        }
      });

      const results = await Promise.all(uploadPromises);
      const failures = results.filter(r => !r.success);

      if (failures.length > 0) {
        alert(`Finished processing. ${failures.length} files failed to upload.`);
      } else {
        alert("All documents processed and integrated into registry.");
      }

      setFormData({ type: systemDocTypes.length > 0 ? systemDocTypes[0] : "Emirates ID", issueDate: "", expiryDate: "" });
      setSelectedFiles([]);
      setUploadProgress({});
      loadDocuments();
    } catch (e) {
      alert("Registration sequence interrupted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const docTypes = systemDocTypes;

  if (loading) return <div className="p-8 text-center text-gray-400 font-mono text-sm animate-pulse">RELOADING_DOCUMENT_VAULT...</div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Registration Form */}
        <div className="lg:col-span-1">
          <div className="technical-card p-6 bg-white sticky top-24">
            <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
              <Upload size={16} className="text-[var(--primary)]" /> Archive New Document
            </h3>
            <form onSubmit={handleAddDocument} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Target Personnel</label>
                <select 
                  value={selectedEmployee}
                  onChange={e => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-white outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  <option value="">-- SELECT EMPLOYEE --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.fullName}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Document Category</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm bg-white outline-none focus:ring-1 focus:ring-[var(--primary)]"
                >
                  {docTypes.map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Issue Date</label>
                  <input 
                    type="date"
                    value={formData.issueDate}
                    onChange={e => setFormData({ ...formData, issueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm font-mono focus:ring-1 focus:ring-[var(--primary)] outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase text-[var(--text-muted)]">Expiry Date</label>
                  <input 
                    type="date"
                    value={formData.expiryDate}
                    onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 border border-[var(--border)] rounded text-sm font-mono focus:ring-1 focus:ring-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="border-2 border-dashed border-gray-100 rounded-lg p-8 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer group block relative">
                   <input 
                     type="file" 
                     multiple 
                     onChange={handleFileChange}
                     className="absolute inset-0 opacity-0 cursor-pointer"
                   />
                   <Files size={32} className="mx-auto text-gray-300 group-hover:text-[var(--primary)] transition-colors mb-2" />
                   <p className="text-[10px] font-bold text-gray-400 uppercase">
                      {selectedFiles.length > 0 
                        ? `${selectedFiles.length} files staged for archival` 
                        : "Drop PNG, JPEG or PDF here"}
                   </p>
                </label>
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-3 mt-4 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedFiles.map((file, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between items-center text-[9px] font-mono font-bold uppercase text-gray-500">
                         <span className="truncate max-w-[140px]">{file.name}</span>
                         <span className={uploadProgress[file.name] === 100 ? "text-green-600" : ""}>
                           {uploadProgress[file.name] || 0}%
                         </span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${uploadProgress[file.name] === 100 ? "bg-green-500" : "bg-[var(--primary)]"}`}
                          style={{ width: `${uploadProgress[file.name] || 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button 
                type="submit"
                disabled={isSubmitting || selectedFiles.length === 0}
                className="w-full py-3 bg-[#1e293b] text-white rounded text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'SECURE_UPLOADING...' : 'Archive Documents'}
              </button>
            </form>
          </div>
        </div>

        {/* Global Documents Registry */}
        <div className="lg:col-span-2">
           <div className="technical-card bg-white overflow-hidden">
             <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[#f8fafc]">
               <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500">Document Registry Matrix</h3>
               <span className="text-[10px] font-mono text-slate-400">TOTAL_ACTIVE_FILES: {documents.length}</span>
             </div>
             <table className="w-full text-left text-sm">
                <thead className="bg-white border-b border-[var(--border)]">
                  <tr>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Employee</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Type</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Status</th>
                    <th className="px-6 py-3 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Expiry</th>
                    <th className="px-6 py-3 text-right text-[10px] font-bold uppercase text-gray-400 tracking-wider">Attachment</th>
                  </tr>
                </thead>
                <tbody className="divide-y border-[var(--border)] font-mono">
                  {documents.map(d => {
                    const expiry = checkNearExpiry(d.expiryDate);
                    return (
                      <tr key={d.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 font-bold text-gray-900 border-l-2 border-transparent group-hover:border-[var(--primary)] font-sans">{d.employeeName}</td>
                        <td className="px-6 py-4 text-xs font-bold text-gray-500 uppercase font-sans">{d.documentType}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            expiry.status === 'expired' ? 'bg-red-600 text-white' :
                            expiry.status === 'critical' ? 'bg-red-100 text-red-600' :
                            'bg-green-100 text-green-600'
                          }`}>
                            {expiry.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-[11px]">{format(new Date(d.expiryDate), 'dd/MM/yyyy')}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2 text-xs font-sans">
                            {d.fileName ? (
                              <span className="text-[10px] font-bold text-blue-500 hover:underline cursor-pointer flex items-center gap-1">
                                <Files size={12} /> {d.fileName.slice(-3).toUpperCase()}
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-gray-400 flex items-center gap-1 opacity-50">
                                <AlertCircle size={12} /> NO_FILE
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {documents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-gray-300 uppercase tracking-widest text-xs italic">
                        Vault empty. No digital assets verified.
                      </td>
                    </tr>
                  )}
                </tbody>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
};

const SettingsView = () => {
  const [settings, setSettings] = useState<any>(null);
  const [docTypes, setDocTypes] = useState<string[]>([]);
  const [newDocType, setNewDocType] = useState("");
  const [leavePolicies, setLeavePolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [data, types, policies] = await Promise.all([
          api.getSettings(),
          api.getDocumentTypes(),
          api.getLeavePolicies()
        ]);
        setSettings(data);
        setDocTypes(Array.isArray(types) ? types : []);
        setLeavePolicies(Array.isArray(policies) ? policies : []);
      } catch (e) {
        console.error("Failed to load settings", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleAddDocType = () => {
    if (newDocType.trim() && !docTypes.includes(newDocType.trim())) {
      setDocTypes([...docTypes, newDocType.trim()]);
      setNewDocType("");
    }
  };

  const handleRemoveDocType = (type: string) => {
    setDocTypes(docTypes.filter(t => t !== type));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await Promise.all([
        api.updateSettings(settings),
        api.updateDocumentTypes(docTypes),
        api.updateLeavePolicies(leavePolicies)
      ]);
      alert("Settings successfully updated across the system architecture.");
    } catch (e) {
      alert("Failed to synchronize settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const addPolicy = () => {
    setLeavePolicies([
      ...leavePolicies, 
      { id: Date.now().toString(), name: "New Policy", accrualRate: 0, maxCarryOver: 0, eligibilityMonths: 0, customRules: [] }
    ]);
  };

  const removePolicy = (index: number) => {
    setLeavePolicies(leavePolicies.filter((_, i) => i !== index));
  };

  const updatePolicy = (index: number, field: string, value: string | number) => {
    const updated = [...leavePolicies];
    updated[index] = { ...updated[index], [field]: value };
    setLeavePolicies(updated);
  };

  const addPolicyRule = (policyIndex: number) => {
    const updated = [...leavePolicies];
    if (!updated[policyIndex].customRules) {
      updated[policyIndex].customRules = [];
    }
    updated[policyIndex].customRules.push({ id: Date.now().toString(), name: "", value: "" });
    setLeavePolicies(updated);
  };

  const updatePolicyRule = (policyIndex: number, ruleIndex: number, field: string, value: string) => {
    const updated = [...leavePolicies];
    updated[policyIndex].customRules[ruleIndex] = { ...updated[policyIndex].customRules[ruleIndex], [field]: value };
    setLeavePolicies(updated);
  };

  const removePolicyRule = (policyIndex: number, ruleIndex: number) => {
    const updated = [...leavePolicies];
    updated[policyIndex].customRules = updated[policyIndex].customRules.filter((_: any, i: number) => i !== ruleIndex);
    setLeavePolicies(updated);
  };

  if (loading) return <div className="p-8 text-center text-gray-400 font-mono text-sm animate-pulse">RETRIVING_SYSTEM_CONFIGURATION...</div>;
  if (!settings || !settings.alertThresholds || !settings.notificationChannels) return <div className="p-12 text-center text-gray-400 uppercase tracking-widest text-xs italic">System configuration unavailable. Please check connectivity.</div>;

  return (
    <div className="max-w-2xl animate-in slide-in-from-bottom-4 duration-500">
      <form onSubmit={handleSave} className="space-y-8">
        {/* Thresholds */}
        <div className="technical-card p-8 bg-white space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={18} className="text-[var(--primary)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Expiry Thresholds (Days)</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Configure the lead time for system-generated alerts. Documents within these windows will trigger status escalations.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-red-500 tracking-widest">Critical</label>
              <input 
                type="number"
                value={settings.alertThresholds.critical}
                onChange={e => setSettings({
                  ...settings,
                  alertThresholds: { ...settings.alertThresholds, critical: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded font-mono text-sm bg-red-50/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-orange-500 tracking-widest">Warning</label>
              <input 
                type="number"
                value={settings.alertThresholds.warning}
                onChange={e => setSettings({
                  ...settings,
                  alertThresholds: { ...settings.alertThresholds, warning: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded font-mono text-sm bg-orange-50/30"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-blue-500 tracking-widest">Information</label>
              <input 
                type="number"
                value={settings.alertThresholds.info}
                onChange={e => setSettings({
                  ...settings,
                  alertThresholds: { ...settings.alertThresholds, info: parseInt(e.target.value) }
                })}
                className="w-full px-4 py-2 border border-[var(--border)] rounded font-mono text-sm bg-blue-50/30"
              />
            </div>
          </div>
        </div>

        {/* Channels */}
        <div className="technical-card p-8 bg-white space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <Bell size={18} className="text-[var(--primary)]" />
            <h3 className="text-sm font-bold uppercase tracking-wider">Notification Channels</h3>
          </div>
          
          <div className="space-y-4">
             <label className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-blue-600">
                    <Database size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">In-App Registry Alerts</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase">System Dashboard & Compliance List</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.notificationChannels.inApp}
                  onChange={e => setSettings({
                    ...settings,
                    notificationChannels: { ...settings.notificationChannels, inApp: e.target.checked }
                  })}
                  className="w-5 h-5 accent-[var(--primary)]"
                />
             </label>

             <label className="flex items-center justify-between p-4 border border-[var(--border)] rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded flex items-center justify-center text-purple-600">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-bold">Email Dispatch</p>
                    <p className="text-[10px] text-gray-400 font-mono uppercase">SMTP_RELAY // DAILY_DIGEST</p>
                  </div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.notificationChannels.email}
                  onChange={e => setSettings({
                    ...settings,
                    notificationChannels: { ...settings.notificationChannels, email: e.target.checked }
                  })}
                  className="w-5 h-5 accent-[var(--primary)]"
                />
             </label>

             {settings.notificationChannels.email && (
               <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                 <div className="flex justify-between items-center mb-2">
                   <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Manual Dispatch Sync</p>
                   <button 
                     type="button"
                     onClick={async () => {
                       try {
                         const res = await api.triggerEmailAlerts();
                         alert(res.message);
                       } catch (err) {
                         alert("Failed to trigger dispatch. Check SMTP environment variables.");
                       }
                     }}
                     className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold uppercase rounded hover:bg-blue-700 transition-colors"
                   >
                     Trigger Alerts Now
                   </button>
                 </div>
                 <p className="text-[10px] text-blue-600 leading-relaxed italic">
                   Note: SMTP_HOST and SMTP_USER must be defined in your secure vault (.env) for dispatch functionality to execute.
                 </p>
               </div>
             )}
          </div>
        </div>

        {/* Custom Document Types */}
        <div className="technical-card p-8 bg-white space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Files size={18} className="text-[var(--primary)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Document Taxonomy</h3>
            </div>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Configure acceptable compliance artifacts. These classifications dictate upload categories across the registry.
          </p>
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <input 
                type="text" 
                value={newDocType}
                onChange={e => setNewDocType(e.target.value)}
                placeholder="e.g. Non-Disclosure Agreement"
                className="flex-1 px-4 py-2 border border-[var(--border)] rounded font-mono text-sm bg-gray-50/30"
              />
              <button 
                type="button"
                onClick={handleAddDocType}
                className="px-6 py-2 bg-gray-900 text-white text-[10px] uppercase font-bold tracking-widest rounded hover:bg-black transition-colors shrink-0"
              >
                Register Category
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {docTypes.map(type => (
                <div key={type} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-xs font-mono">
                  <span>{type}</span>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveDocType(type)}
                    className="text-gray-400 hover:text-red-500 transition-colors ml-1"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              {docTypes.length === 0 && (
                <span className="text-xs text-gray-400 italic">No custom classifications detected.</span>
              )}
            </div>
          </div>
        </div>

        {/* Leave Policies */}
        <div className="technical-card p-8 bg-white space-y-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-[var(--primary)]" />
              <h3 className="text-sm font-bold uppercase tracking-wider">Leave Policies</h3>
            </div>
            <button 
              type="button" 
              onClick={addPolicy}
              className="text-xs uppercase font-bold text-[var(--primary)] hover:underline"
            >
              + Add Policy
            </button>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            Configure company-wide leave policies including accrual rates, carry-over limits, and tenure requirements.
          </p>
          
          <div className="space-y-4">
            {leavePolicies.map((policy, index) => (
              <div key={policy.id} className="p-4 border border-gray-200 rounded relative group relative">
                <button 
                  type="button"
                  onClick={() => removePolicy(index)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <X size={14} />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Policy Name</label>
                    <input 
                      type="text" 
                      value={policy.name}
                      onChange={(e) => updatePolicy(index, "name", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Accrual Rate (Days/Mo)</label>
                    <input 
                      type="number" 
                      step="0.01"
                      value={policy.accrualRate}
                      onChange={(e) => updatePolicy(index, "accrualRate", parseFloat(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Max Carry Over (Days)</label>
                    <input 
                      type="number" 
                      value={policy.maxCarryOver}
                      onChange={(e) => updatePolicy(index, "maxCarryOver", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50/50"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-gray-400 mb-1">Eligibility (Months)</label>
                    <input 
                      type="number" 
                      value={policy.eligibilityMonths}
                      onChange={(e) => updatePolicy(index, "eligibilityMonths", parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-200 rounded text-sm bg-gray-50/50"
                    />
                  </div>
                </div>
                
                {/* Custom Rules */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-3">
                    <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">Custom Rules</label>
                    <button 
                      type="button" 
                      onClick={() => addPolicyRule(index)}
                      className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-2 py-1 rounded font-bold uppercase transition-colors"
                    >
                      + Add Rule
                    </button>
                  </div>
                  <div className="space-y-2">
                    {policy.customRules?.map((rule: any, ruleIndex: number) => (
                      <div key={rule.id || ruleIndex} className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Rule Name (e.g. Min Age)"
                          value={rule.name}
                          onChange={(e) => updatePolicyRule(index, ruleIndex, "name", e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 flex-grow"
                        />
                        <input
                          type="text"
                          placeholder="Condition / Value"
                          value={rule.value}
                          onChange={(e) => updatePolicyRule(index, ruleIndex, "value", e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-xs bg-gray-50 flex-grow"
                        />
                        <button
                          type="button"
                          onClick={() => removePolicyRule(index, ruleIndex)}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    {(!policy.customRules || policy.customRules.length === 0) && (
                      <p className="text-xs text-gray-400 italic">No custom rules defined.</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {leavePolicies.length === 0 && (
              <span className="text-xs text-gray-400 italic">No leave policies defined.</span>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button 
            type="submit"
            disabled={isSaving}
            className="px-10 py-4 bg-[#1e293b] text-white rounded text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isSaving ? 'Synchronizing...' : 'Finalize & Persist Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
};

const Header = () => {
  return (
    <header className="h-16 border-b border-[var(--border)] bg-white flex items-center justify-between px-8 z-10 sticky top-0 mb-8">
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-[22px] tracking-tight text-[var(--text-main)]">Operations Overview</h1>
        <div className="h-4 w-[1px] bg-[var(--border)] mx-2"></div>
        <div className="text-[var(--text-muted)] text-sm">UAE Compliance Zone: <strong>Sharjah, Al Qasimiyah</strong></div>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-8 h-8 rounded-full bg-gray-200 border border-[var(--border)] overflow-hidden">
          <img src="https://picsum.photos/seed/hr/100" referrerPolicy="no-referrer" alt="User" />
        </div>
      </div>
    </header>
  );
};

const getExpiryStatus = (dateStr: string, thresholdDays: number) => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  const now = new Date();
  const daysDiff = differenceInDays(date, now);
  if (daysDiff < 0) return 'expired';
  if (daysDiff <= thresholdDays) return 'expiring-soon';
  return 'valid';
};

const ExpiryBadge = ({ dateStr, thresholdDays }: { dateStr: string, thresholdDays: number }) => {
  if (!dateStr) return <span>-</span>;
  const status = getExpiryStatus(dateStr, thresholdDays);
  const formatted = format(new Date(dateStr), 'dd/MM/yyyy');
  
  if (status === 'expired') {
    return <span className="inline-flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded" title="Expired"><AlertCircle size={12}/> {formatted}</span>;
  }
  if (status === 'expiring-soon') {
    return <span className="inline-flex items-center gap-1 text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded" title={`Expiring within ${thresholdDays} days`}><AlertCircle size={12}/> {formatted}</span>;
  }
  return <span className="text-gray-700">{formatted}</span>;
};

const TradeLicensesView = () => {
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [alertThreshold, setAlertThreshold] = useState(30);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<any>(null);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);
  const [activeLogs, setActiveLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeLicenseName, setActiveLicenseName] = useState("");
  const [quotaNote, setQuotaNote] = useState("");

  const [formData, setFormData] = useState<any>({
    s_no: "",
    type_of_land: "",
    company_name: "",
    license_issue_date: "",
    license_expiry_date: "",
    e_channels_expiry_date: "",
    visa_quota_utilized: 0,
    visa_quota_unutilized: 0,
    remarks: ""
  });

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const data = await api.getTradeLicenses();
      setLicenses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load trade licenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  const handleOpenModal = (lic?: any) => {
    if (lic) {
      setEditingLicense(lic);
      setFormData({
        s_no: lic.s_no || "",
        type_of_land: lic.type_of_land || "",
        company_name: lic.company_name || "",
        license_issue_date: lic.license_issue_date || "",
        license_expiry_date: lic.license_expiry_date || "",
        e_channels_expiry_date: lic.e_channels_expiry_date || "",
        visa_quota_utilized: lic.visa_quota_utilized || 0,
        visa_quota_unutilized: lic.visa_quota_unutilized || 0,
        remarks: lic.remarks || "",
        quota_note: ""
      });
    } else {
      setEditingLicense(null);
      setFormData({
        s_no: licenses.length + 1,
        type_of_land: "Mainland",
        company_name: "",
        license_issue_date: "",
        license_expiry_date: "",
        e_channels_expiry_date: "",
        visa_quota_utilized: 0,
        visa_quota_unutilized: 0,
        remarks: "",
        quota_note: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleOpenLogs = async (lic: any) => {
    setIsLogsModalOpen(true);
    setActiveLicenseName(lic.company_name);
    try {
      setLogsLoading(true);
      const logs = await api.getQuotaLogs(lic.id);
      setActiveLogs(Array.isArray(logs) ? logs : []);
    } catch (error) {
      console.error("Failed to load logs", error);
      setActiveLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingLicense) {
        await api.updateTradeLicense(editingLicense.id, formData);
      } else {
        await api.createTradeLicense(formData);
      }
      setIsModalOpen(false);
      fetchLicenses();
    } catch (error) {
      console.error("Failed to save license", error);
      alert("Failed to save license. Check console for details.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this license?")) {
      try {
        await api.deleteTradeLicense(id);
        fetchLicenses();
      } catch (error) {
        console.error("Failed to delete license", error);
        alert("Failed to delete license.");
      }
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400 font-mono text-sm animate-pulse">LOADING_LICENSES...</div>;

  const filteredLicenses = licenses.filter(lic => 
    (lic.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lic.type_of_land || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (lic.remarks || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center bg-white p-6 rounded technical-card">
        <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
          <Building size={16} className="text-[var(--primary)]" /> Company Trade Licenses & Quota
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Alert Threshold:</span>
            <select
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="text-xs border rounded-full px-3 py-1.5 outline-none focus:border-[var(--primary)] font-mono text-gray-700 bg-gray-50"
            >
              <option value={15}>15 Days</option>
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border rounded-full text-xs font-mono w-64 focus:outline-none focus:border-[var(--primary)]"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[var(--primary)]/90 transition-colors"
          >
            <Plus size={14} /> Add License
          </button>
        </div>
      </div>

      <div className="technical-card bg-white overflow-hidden overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#f8fafc] border-b border-[var(--border)]">
            <tr>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider">S.No</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Type of Land</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider">Company Name</th>
              <th colSpan={2} className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider text-center border-l bg-blue-50/30">Trade License</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-l">eChannels Expiry</th>
              <th colSpan={2} className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider text-center border-l bg-blue-50/30">Visa Quota</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-l">Remarks</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase text-gray-400 tracking-wider border-l text-center">Actions</th>
            </tr>
            <tr className="border-t border-[var(--border)]">
              <th colSpan={3}></th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider text-center border-l bg-blue-50/30">Issue Date</th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider text-center bg-blue-50/30">Expiry Date</th>
              <th className="border-l"></th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider text-center border-l bg-blue-50/30">Utilized</th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase text-gray-500 tracking-wider text-center bg-blue-50/30">Unutilized</th>
              <th colSpan={2} className="border-l"></th>
            </tr>
          </thead>
          <tbody className="divide-y border-[var(--border)] font-mono">
            {filteredLicenses.map((lic, index) => (
              <tr key={lic.id || index} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-bold text-gray-500">{lic.s_no}</td>
                <td className="px-6 py-4 text-xs font-bold text-gray-700">{lic.type_of_land}</td>
                <td className="px-6 py-4 text-xs font-bold text-gray-900 uppercase">{lic.company_name}</td>
                <td className="px-6 py-4 text-[11px] border-l text-center">{lic.license_issue_date ? format(new Date(lic.license_issue_date), 'dd/MM/yyyy') : '-'}</td>
                <td className="px-6 py-4 text-[11px] text-center"><ExpiryBadge dateStr={lic.license_expiry_date} thresholdDays={alertThreshold} /></td>
                <td className="px-6 py-4 text-[11px] border-l text-center"><ExpiryBadge dateStr={lic.e_channels_expiry_date} thresholdDays={alertThreshold} /></td>
                <td className="px-6 py-4 text-xs font-bold border-l text-center">{lic.visa_quota_utilized}</td>
                <td className="px-6 py-4 text-xs font-bold text-center">{lic.visa_quota_unutilized}</td>
                <td className="px-6 py-4 text-[11px] font-sans text-gray-600 border-l max-w-xs truncate" title={lic.remarks}>{lic.remarks}</td>
                <td className="px-6 py-4 border-l text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleOpenLogs(lic)} className="p-1 text-gray-400 hover:text-[var(--primary)] transition-colors"><History size={14} /></button>
                    <button onClick={() => handleOpenModal(lic)} className="p-1 text-gray-400 hover:text-[var(--primary)] transition-colors"><Edit size={14} /></button>
                    <button onClick={() => handleDelete(lic.id)} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredLicenses.length === 0 && (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-xs text-gray-400 font-sans">No records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="technical-card w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-[var(--border)] bg-gray-50/50">
                <h2 className="text-lg font-bold uppercase tracking-tight text-gray-800">
                  {editingLicense ? "Edit License" : "Add License"}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">S.No</label>
                    <input type="number" value={formData.s_no} onChange={(e) => setFormData({...formData, s_no: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Type of Land</label>
                    <select value={formData.type_of_land} onChange={(e) => setFormData({...formData, type_of_land: e.target.value})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none">
                      <option value="Mainland">Mainland</option>
                      <option value="Hamiriya Freezone">Hamiriya Freezone</option>
                      <option value="SAIF Zone">SAIF Zone</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Company Name</label>
                  <input type="text" value={formData.company_name} onChange={(e) => setFormData({...formData, company_name: e.target.value.toUpperCase()})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none font-bold text-gray-900" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">License Issue Date</label>
                    <input type="date" value={formData.license_issue_date} onChange={(e) => setFormData({...formData, license_issue_date: e.target.value})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none font-mono" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">License Expiry Date</label>
                    <input type="date" value={formData.license_expiry_date} onChange={(e) => setFormData({...formData, license_expiry_date: e.target.value})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none font-mono" />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 text-red-500">eChannels Expiry Date</label>
                  <input type="date" value={formData.e_channels_expiry_date} onChange={(e) => setFormData({...formData, e_channels_expiry_date: e.target.value})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Visa Quota Utilized</label>
                    <input type="number" value={formData.visa_quota_utilized} onChange={(e) => setFormData({...formData, visa_quota_utilized: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Visa Quota Unutilized</label>
                    <input type="number" value={formData.visa_quota_unutilized} onChange={(e) => setFormData({...formData, visa_quota_unutilized: parseInt(e.target.value) || 0})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none" />
                  </div>
                </div>
                {editingLicense && (
                  (editingLicense.visa_quota_utilized !== formData.visa_quota_utilized || 
                   editingLicense.visa_quota_unutilized !== formData.visa_quota_unutilized) && (
                    <div className="bg-orange-50 p-3 rounded border border-orange-100">
                      <label className="block text-[10px] font-bold text-orange-800 uppercase tracking-widest mb-1 flex items-center gap-1">
                        <AlertCircle size={10} /> Quota Change Note (Optional)
                      </label>
                      <input type="text" placeholder="Reason for quota change..." value={formData.quota_note || ""} onChange={(e) => setFormData({...formData, quota_note: e.target.value})} className="w-full px-3 py-2 border border-orange-200 rounded text-xs outline-none bg-white" />
                    </div>
                  )
                )}
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Remarks</label>
                  <textarea rows={3} value={formData.remarks} onChange={(e) => setFormData({...formData, remarks: e.target.value})} className="w-full px-3 py-2 border rounded text-xs focus:border-[var(--primary)] outline-none resize-none"></textarea>
                </div>
              </div>

              <div className="p-6 bg-gray-50 border-t flex justify-end gap-3 mt-auto">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider">Cancel</button>
                <button onClick={handleSave} className="px-4 py-2 bg-[var(--primary)] text-white rounded text-xs font-bold hover:bg-[var(--primary)]/90 transition-colors shadow-sm uppercase tracking-wider flex items-center gap-2">
                  <Check size={14} /> Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isLogsModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="technical-card w-full max-w-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-[var(--border)] bg-gray-50/50">
                <h2 className="text-lg font-bold uppercase tracking-tight text-gray-800 flex items-center gap-2">
                  <History size={18} className="text-[var(--primary)]" /> 
                  Quota Logs: <span className="text-gray-500">{activeLicenseName}</span>
                </h2>
                <button onClick={() => setIsLogsModalOpen(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-colors">
                  <X size={18} />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                {logsLoading ? (
                  <div className="text-center text-xs font-mono text-gray-400 animate-pulse py-8">LOADING_LOGS...</div>
                ) : activeLogs.length === 0 ? (
                  <div className="text-center text-xs font-mono text-gray-400 py-8">NO_QUOTA_LOGS_FOUND</div>
                ) : (
                  <div className="space-y-4">
                    {activeLogs.map((log, i) => (
                      <div key={i} className="flex gap-4 p-4 border border-[var(--border)] rounded bg-gray-50/30 text-sm">
                        <div className="flex-shrink-0 pt-0.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            {log.action === 'INITIAL_QUOTA' ? <Plus size={14} /> : <Edit size={14} />}
                          </div>
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="font-bold text-gray-800">{log.action === 'INITIAL_QUOTA' ? 'Initial Quota Created' : 'Quota Updated'}</div>
                            <div className="text-xs text-gray-500 font-mono">{format(new Date(log.timestamp), 'dd MMM yyyy, HH:mm')}</div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Utilized</span>
                              <div className="flex items-center gap-2 font-mono">
                                {log.action === 'QUOTA_UPDATE' && (
                                  <>
                                    <span className="text-gray-500 line-through">{log.previousUtilized}</span>
                                    <ChevronRight size={12} className="text-gray-400"/>
                                  </>
                                )}
                                <span className={log.action === 'QUOTA_UPDATE' && log.previousUtilized !== log.newUtilized ? 'text-blue-600 font-bold' : 'text-gray-800'}>
                                  {log.newUtilized}
                                </span>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Unutilized</span>
                              <div className="flex items-center gap-2 font-mono">
                                {log.action === 'QUOTA_UPDATE' && (
                                  <>
                                    <span className="text-gray-500 line-through">{log.previousUnutilized}</span>
                                    <ChevronRight size={12} className="text-gray-400"/>
                                  </>
                                )}
                                <span className={log.action === 'QUOTA_UPDATE' && log.previousUnutilized !== log.newUnutilized ? 'text-blue-600 font-bold' : 'text-gray-800'}>
                                  {log.newUnutilized}
                                </span>
                              </div>
                            </div>
                          </div>

                          {log.note && (
                            <div className="mt-2 text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                              <span className="font-bold mr-1">Note:</span>{log.note}
                            </div>
                          )}
                          <div className="mt-2 text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Users size={10} /> By {log.user || 'System'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "trade-licenses" | "roster" | "finance" | "compliance" | "leaves" | "reports" | "settings" | "documents">("dashboard");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaveEmployee = async (data: EmployeeFormData) => {
    try {
      if (editingEmployee) {
        await api.updateEmployee(editingEmployee.id, data);
      } else {
        await api.createEmployee(data);
      }
      handleRefresh();
    } catch (err: any) {
      alert(`System Error: ${err.message}`);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    try {
      await api.deleteEmployee(id);
      handleRefresh();
    } catch (err: any) {
      alert(`Purge Error: ${err.message}`);
    }
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setInitError(null);

        if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
          setInitError("Supabase Configuration Missing: Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to the Secrets panel.");
          setLoading(false);
          return;
        }

        const employeeData = await api.getEmployees();
        
        if (employeeData && employeeData.error) {
          console.warn("Backend error fetching employees:", employeeData.error);
          setInitError("Backend Connection Error: " + employeeData.error);
          setLoading(false);
          return;
        }

        const alertsData = await api.getAlerts();
        
        // --- Deduplication Logic ---
        const seen = new Set<string>();
        const uniqueData: any[] = [];
        const duplicateIds: string[] = [];

        for (const emp of (Array.isArray(employeeData) ? employeeData : [])) {
          const name = emp.fullName?.trim();
          if (seen.has(name)) {
            duplicateIds.push(emp.id);
          } else {
            seen.add(name);
            uniqueData.push(emp);
          }
        }

        if (duplicateIds.length > 0) {
          console.log(`Cleaning up ${duplicateIds.length} duplicate records...`);
          try {
            await Promise.all(duplicateIds.map(id => api.deleteEmployee(id)));
          } catch(e) {
            console.error("Failed to delete duplicates", e);
          }
        }
        // --- End Deduplication ---

        setEmployees(uniqueData.length > 0 ? uniqueData : SEED_EMPLOYEES);
        setAlerts(Array.isArray(alertsData) ? alertsData : []);
      } catch (err: any) {
        console.error("Initialization/Load error:", err);
        if (err.message && (err.message.includes("NetworkError") || err.message.includes("fetch"))) {
          setInitError("System Connection Failure: Could not reach Supabase. Please verify your VITE_SUPABASE_URL is accessible and valid (e.g., https://...supabase.co, not a localhost URL if you're in the cloud).");
        } else {
          setInitError(err.message || "An unexpected error occurred during database initialization.");
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [refreshKey]);

  const handleEditClick = async (emp: any) => {
    try {
      const fullEmp = await api.getEmployeeDetail(emp.id);
      
      // Map documents to specific fields for the form
      const visa = fullEmp.documents?.find((d: any) => d.documentType === 'Visa');
      const labor = fullEmp.documents?.find((d: any) => d.documentType === 'Labor Card');
      const health = fullEmp.documents?.find((d: any) => d.documentType === 'Health Card');
      
      setEditingEmployee({
        ...fullEmp,
        hireDate: fullEmp.hireDate ? fullEmp.hireDate.substring(0, 10) : '',
        visaExpiry: visa?.expiryDate ? visa.expiryDate.substring(0, 10) : '',
        laborCardExpiry: labor?.expiryDate ? labor.expiryDate.substring(0, 10) : '',
        healthCardExpiry: health?.expiryDate ? health.expiryDate.substring(0, 10) : '',
      });
      setIsModalOpen(true);
    } catch (err) {
      alert("System failed to retrieve full personnel record.");
    }
  };

  const handleRefresh = () => setRefreshKey(prev => prev + 1);

  const handleExport = async () => {
    window.open('/api/hrm/export/employees', '_blank');
  };

  return (
    <div className="min-h-screen flex bg-[#f4f7fa]">
      {/* Sidebar */}
      <nav className="w-60 bg-[#1e293b] flex flex-col fixed inset-y-0">
        <div className="px-6 py-8">
          <div className="flex items-center gap-2 text-white font-extrabold text-xl tracking-tight">
            Crystal HRM <span className="text-[10px] bg-[#3b82f6] px-1.5 py-0.5 rounded">PRO</span>
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active={activeTab === "dashboard"} onClick={() => { setActiveTab("dashboard"); setSelectedEmployeeId(null); }} />
          <SidebarItem icon={Building} label="Trade Licenses" active={activeTab === "trade-licenses"} onClick={() => { setActiveTab("trade-licenses"); setSelectedEmployeeId(null); }} />
          <SidebarItem icon={Users} label="Employees" active={activeTab === "roster"} onClick={() => { setActiveTab("roster"); setSelectedEmployeeId(null); }} />
          <SidebarItem icon={FileText} label="Document Expiry" active={activeTab === "compliance"} onClick={() => { setActiveTab("compliance"); setSelectedEmployeeId(null); }} badge={alerts.length > 0 ? alerts.length : undefined} />
          <SidebarItem icon={Files} label="Document Vault" active={activeTab === "documents"} onClick={() => { setActiveTab("documents"); setSelectedEmployeeId(null); }} />
          <SidebarItem icon={CalendarDays} label="Leave Requests" active={activeTab === "leaves"} onClick={() => { setActiveTab("leaves"); setSelectedEmployeeId(null); }} />
          <SidebarItem icon={BarChart3} label="HR Intelligence" active={activeTab === "reports"} onClick={() => { setActiveTab("reports"); setSelectedEmployeeId(null); }} />
          <SidebarItem icon={Landmark} label="Payroll & Gratuity" active={activeTab === "finance"} onClick={() => { setActiveTab("finance"); setSelectedEmployeeId(null); }} />
          <SidebarItem icon={Settings} label="System Settings" active={activeTab === "settings"} onClick={() => { setActiveTab("settings"); setSelectedEmployeeId(null); }} />
        </div>
        
        <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
          <button 
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#3b82f6] text-white rounded text-xs font-bold uppercase hover:bg-blue-600 transition-colors"
          >
            <Download size={14} /> Export Archive
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 ml-60 min-h-screen flex flex-col">
        <Header />
        
        <div className="flex-1 px-8 pb-8 max-w-7xl w-full mx-auto">
          {initError ? (
            <div className="technical-card p-12 text-center mt-20 border-red-200 bg-red-50/30">
               <div className="w-16 h-16 bg-red-100 rounded flex items-center justify-center mx-auto mb-6 border border-red-200">
                <Landmark size={32} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-3 tracking-tight uppercase">System Initialization Failed</h2>
              <p className="text-sm text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">{initError}</p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button 
                  onClick={handleRefresh}
                  className="px-8 py-3 bg-[#1e293b] text-white rounded text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-all"
                >
                  Reconnect / Retry
                </button>
                <button 
                  onClick={() => setInitError(null)}
                  className="px-8 py-3 border border-gray-200 text-gray-600 rounded text-[10px] font-bold uppercase tracking-widest hover:bg-gray-50 transition-all"
                >
                  Enter Maintenance Mode
                </button>
              </div>
            </div>
          ) : loading ? (
             <div className="h-full flex items-center justify-center text-gray-400 font-mono text-sm">INITIALIZING_SYSTEM_RESOURCES...</div>
          ) : (
            <AnimatePresence mode="wait">
              {selectedEmployeeId ? (
                <div key="detail">
                  <EmployeeDetailView 
                    employeeId={selectedEmployeeId} 
                    onBack={() => setSelectedEmployeeId(null)} 
                    onRefresh={handleRefresh}
                  />
                </div>
              ) : (
                <motion.div 
                  key={activeTab}
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <h2 className="text-2xl font-bold capitalize">{activeTab.replace('-', ' ')}</h2>
                      <p className="text-sm text-gray-500 font-mono mt-1">SST_HRM_00X // SYSTEM_ACTIVE</p>
                    </div>
                  </div>

                  {activeTab === "dashboard" && <DashboardView employees={employees} alerts={alerts} onSelectEmployee={setSelectedEmployeeId} />}
                  {activeTab === "trade-licenses" && <TradeLicensesView />}
                  {activeTab === "compliance" && (
                    <div className="space-y-6">
                      <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold uppercase tracking-tight flex items-center gap-2">
                          <FileText size={20} className="text-red-500" />
                          Compliance & Document Monitoring
                        </h2>
                      </div>
                      <div className="technical-card overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-[#f8fafc] border-b border-[var(--border)]">
                            <tr>
                              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Employee</th>
                              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Document Type</th>
                              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Expiry Date</th>
                              <th className="px-6 py-3 font-semibold text-[var(--text-muted)] uppercase text-[12px] tracking-wider">Calculated Status</th>
                              <th className="px-6 py-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y border-[var(--border)]">
                            {alerts.map((alert: any) => (
                              <tr key={alert.id} className="hover:bg-red-50/30 transition-colors">
                                <td className="px-6 py-4 font-bold text-gray-900">{alert.employeeName}</td>
                                <td className="px-6 py-4 text-xs font-bold uppercase text-gray-500">{alert.documentType}</td>
                                <td className="px-6 py-4 font-mono text-xs">{alert.expiryDate ? format(new Date(alert.expiryDate), 'dd/MM/yyyy') : ''}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${alert.status === 'expired' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700'}`}>
                                    {alert.status === 'expired' ? 'EXPIRED' : `${alert.daysLeft} DAYS REMAINING`}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                    onClick={() => setSelectedEmployeeId(alert.employeeId)}
                                    className="text-[10px] font-bold uppercase text-[var(--primary)] hover:underline"
                                  >
                                    Inspect Profile
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {alerts.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-12 text-center text-gray-400 font-mono text-sm uppercase tracking-widest">
                                  All systems cleared. No compliance violations detected.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  {activeTab === "roster" && (
                    <EmployeeListView 
                      employees={employees} 
                      onSelect={setSelectedEmployeeId} 
                      onAdd={() => { setEditingEmployee(null); setIsModalOpen(true); }}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteEmployee}
                    />
                  )}
                  {activeTab === "finance" && <FinanceView />}
                  {activeTab === "leaves" && <LeavesManagementView />}
                  {activeTab === "reports" && <ReportsView />}
                  {activeTab === "settings" && <SettingsView />}
                  {activeTab === "documents" && <DocumentsView employees={employees} />}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      <EmployeeModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEmployee}
        initialData={editingEmployee}
      />
    </div>
  );
}
