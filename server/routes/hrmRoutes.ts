import { Router } from "express";
import * as hrmController from "../controllers/hrmController.ts";

const router = Router();

// Employees
router.get("/employees", hrmController.getEmployees);
router.post("/employees", hrmController.createEmployee);
router.get("/employees/:id", hrmController.getEmployeeDetail);
router.put("/employees/:id", hrmController.updateEmployee);
router.delete("/employees/:id", hrmController.deleteEmployee);
router.post("/employees/:id/terminate", hrmController.terminateEmployee);

// Salary & Gratuity
router.put("/employees/:id/salary", hrmController.updateSalary);
router.get("/employees/:id/gratuity", hrmController.getGratuity);

// Documents
router.get("/documents", hrmController.getAllDocuments);
router.post("/employees/:id/documents", hrmController.addDocument);

// Leaves
router.get("/employees/:id/leave-balance", hrmController.getLeaveBalance);
router.post("/employees/:id/leaves", hrmController.createLeaveRequest);
router.get("/leaves", hrmController.getAllLeaves);
router.patch("/leaves/:id/status", hrmController.updateLeaveStatus);

// Alerts & Analytics
router.get("/alerts", hrmController.getAlerts);
router.post("/alerts/trigger-email", hrmController.triggerEmailAlerts);
router.get("/reports", hrmController.getReports);

// Settings
router.get("/settings", hrmController.getSettings);
router.put("/settings", hrmController.updateSettings);

// Document Types
router.get("/document-types", hrmController.getDocumentTypes);
router.put("/document-types", hrmController.updateDocumentTypes);

// Leave Policies
router.get("/leave-policies", hrmController.getLeavePolicies);
router.put("/leave-policies", hrmController.updateLeavePolicies);

router.get("/trade-licenses", hrmController.getTradeLicenses);
router.post("/trade-licenses", hrmController.createTradeLicense);
router.put("/trade-licenses/:id", hrmController.updateTradeLicense);
router.delete("/trade-licenses/:id", hrmController.deleteTradeLicense);
router.get("/trade-licenses/:id/logs", hrmController.getQuotaLogs);


// Export
router.get("/export/employees", hrmController.exportEmployees);
router.get("/export/wps/:month", hrmController.exportWPS);

export default router;
