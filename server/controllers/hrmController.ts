import { Request, Response } from "express";
import { hrmService } from "../services/hrmService.ts";
import { z } from "zod";

// Validations
const employeeSchema = z.object({
  fullName: z.string().min(2),
  nationality: z.string(),
  jobTitle: z.string(),
  department: z.string(),
  hireDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  contractType: z.enum(["limited", "unlimited"]),
  status: z.enum(["active", "terminated"]),
  branch: z.enum(["CPH1", "CPH2", "GTC", "Wise"]),
  visaStatus: z.enum(["Company", "Own", "Emirati"]),
  workLocation: z.string(),
  emiratesIdNumber: z.string().optional(),
  laborCardNumber: z.string().optional(),
  iban: z.string().optional(),
  bankRoutingCode: z.string().optional(),
  visaExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  laborCardExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  healthCardExpiry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
});

const salarySchema = z.object({
  basicSalary: z.number().min(0),
  housingAllowance: z.number().min(0).optional(),
  transportAllowance: z.number().min(0).optional(),
  otherAllowances: z.number().min(0).optional(),
  deductions: z.number().min(0).optional()
});

const leaveRequestSchema = z.object({
  leaveType: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  daysRequested: z.number().min(1),
  reason: z.string().optional()
});

export const getEmployees = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getEmployees();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getEmployeeDetail = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.getEmployeeById(req.params.id);
    if (!data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createEmployee = async (req: Request, res: Response) => {
  try {
    const validated = employeeSchema.parse(req.body);
    const data = await hrmService.createEmployee(validated);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || err });
  }
};

export const updateEmployee = async (req: Request, res: Response) => {
  try {
    const validated = employeeSchema.parse(req.body);
    const data = await hrmService.updateEmployee(req.params.id, validated);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || err });
  }
};

export const deleteEmployee = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.deleteEmployee(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSalary = async (req: Request, res: Response) => {
  try {
    const validated = salarySchema.parse(req.body);
    const data = await hrmService.updateSalary(req.params.id, validated);
    res.json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || err });
  }
};

export const getLeaveBalance = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.getLeaveBalance(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const validated = leaveRequestSchema.parse(req.body);
    const data = await hrmService.createLeaveRequest(req.params.id, validated);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(400).json({ error: err.message || err });
  }
};

export const getAllLeaves = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getAllLeaves();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    const data = await hrmService.updateLeaveStatus(id, status);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllDocuments = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getAllDocuments();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const addDocument = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.addDocument(req.params.id, req.body);
    res.status(201).json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getReports = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getReportsData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getSettings = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getSettings();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.updateSettings(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getDocumentTypes = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getDocumentTypes();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateDocumentTypes = async (req: Request, res: Response) => {
  try {
    const { types } = req.body;
    const data = await hrmService.updateDocumentTypes(types);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getLeavePolicies = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getLeavePolicies();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getTradeLicenses = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getTradeLicenses();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const createTradeLicense = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.createTradeLicense(req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const updateTradeLicense = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.updateTradeLicense(req.params.id, req.body);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteTradeLicense = async (req: Request, res: Response) => {
  try {
    await hrmService.deleteTradeLicense(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getQuotaLogs = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.getQuotaLogs(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};


export const updateLeavePolicies = async (req: Request, res: Response) => {
  try {
    const { policies } = req.body;
    const data = await hrmService.updateLeavePolicies(policies);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const terminateEmployee = async (req: Request, res: Response) => {
  try {
    const { terminationDate, reason } = req.body;
    const data = await hrmService.terminateEmployee(req.params.id, terminationDate, reason);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getGratuity = async (req: Request, res: Response) => {
  try {
    const data = await hrmService.getGratuityInfo(req.params.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const getAlerts = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.getComplianceSummary();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const triggerEmailAlerts = async (_req: Request, res: Response) => {
  try {
    const data = await hrmService.triggerEmailNotifications();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const exportEmployees = async (_req: Request, res: Response) => {
  try {
    const csv = await hrmService.exportEmployeesCSV();
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=employees.csv");
    res.status(200).send(csv);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const exportWPS = async (req: Request, res: Response) => {
  try {
    const { month } = req.params; // Expecting YYYY-MM
    const sif = await hrmService.exportWPSSIF(month);
    res.setHeader("Content-Type", "text/plain");
    res.setHeader("Content-Disposition", `attachment; filename=WPS_SIF_${month}.sif`);
    res.status(200).send(sif);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
