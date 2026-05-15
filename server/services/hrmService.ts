import { supabaseAdmin } from "./supabaseAdmin.ts";
import { calculateGratuity, calculateLeaveBalance, checkNearExpiry } from "../utils/calculations.ts";
import { stringify } from "csv-stringify/sync";
import { emailService } from "./emailService.ts";

export class HRMService {
  /**
   * Employees
   */
  async getEmployees() {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .select("*, documents(*)")
      .order("full_name");
    
    if (error) throw error;

    // Map snake_case to camelCase for frontend compatibility
    return (data || []).map(emp => {
      const docs = emp.documents || [];
      const visaDoc = docs.find((d: any) => d.document_type === 'Visa');
      const laborDoc = docs.find((d: any) => d.document_type === 'Labor Card');
      const healthDoc = docs.find((d: any) => d.document_type === 'Health Card');

      return {
        id: emp.id,
        empId: emp.emp_id,
        fullName: emp.full_name,
        jobTitle: emp.job_title,
        hireDate: emp.hire_date,
        branch: emp.branch,
        visaStatus: emp.visa_status,
        workLocation: emp.work_location,
        nationality: emp.nationality,
        passportAvailability: emp.passport_availability,
        passportNumber: emp.passport_number,
        dateOfBirth: emp.date_of_birth,
        passportIssueDate: emp.passport_issue_date,
        passportExpiryDate: emp.passport_expiry_date,
        address: emp.address,
        personalNo: emp.personal_no,
        contractType: emp.contract_type,
        status: emp.status,
        department: emp.department,
        laborCardNumber: emp.labor_card_number,
        iban: emp.iban,
        bankRoutingCode: emp.bank_routing_code,
        visaExpiry: visaDoc ? visaDoc.expiry_date : undefined,
        laborCardExpiry: laborDoc ? laborDoc.expiry_date : undefined,
        healthCardExpiry: healthDoc ? healthDoc.expiry_date : undefined,
        createdAt: emp.created_at,
        updatedAt: emp.updated_at
      };
    });
  }

  async getEmployeeById(id: string) {
    const { data: emp, error: empError } = await supabaseAdmin
      .from("employees")
      .select("*")
      .eq("id", id)
      .single();
    
    if (empError) return null;

    const { data: salaryData, error: salaryError } = await supabaseAdmin
      .from("salaries")
      .select("*")
      .eq("employee_id", id)
      .maybeSingle();

    const { data: documents, error: docsError } = await supabaseAdmin
      .from("documents")
      .select("*")
      .eq("employee_id", id);
      
    const settings = await this.getSettings();
    
    // Calculate near expiry statuses for documents
    const documentsWithStatus = (documents || []).map(d => ({
      id: d.id,
      documentType: d.document_type,
      issueDate: d.issue_date,
      expiryDate: d.expiry_date,
      fileName: d.file_name,
      fileUrl: d.file_url,
      expiryStatus: checkNearExpiry(d.expiry_date, settings.alertThresholds)
    }));

    // Map salary
    const salary = salaryData ? {
      basicSalary: salaryData.basic_salary,
      housingAllowance: salaryData.housing_allowance,
      transportAllowance: salaryData.transport_allowance,
      otherAllowances: salaryData.other_allowances,
      deductions: salaryData.deductions,
      totalSalary: salaryData.total_salary
    } : null;

    const visaDoc = (documents || []).find(d => d.document_type === 'Visa');
    const laborDoc = (documents || []).find(d => d.document_type === 'Labor Card');
    const healthDoc = (documents || []).find(d => d.document_type === 'Health Card');

    return {
      id: emp.id,
      empId: emp.emp_id,
      fullName: emp.full_name,
      jobTitle: emp.job_title,
      hireDate: emp.hire_date,
      branch: emp.branch,
      visaStatus: emp.visa_status,
      workLocation: emp.work_location,
      nationality: emp.nationality,
      passportAvailability: emp.passport_availability,
      passportNumber: emp.passport_number,
      dateOfBirth: emp.date_of_birth,
      passportIssueDate: emp.passport_issue_date,
      passportExpiryDate: emp.passport_expiry_date,
      address: emp.address,
      personalNo: emp.personal_no,
      contractType: emp.contract_type,
      status: emp.status,
      department: emp.department,
      laborCardNumber: emp.labor_card_number,
      iban: emp.iban,
      bankRoutingCode: emp.bank_routing_code,
      visaExpiry: visaDoc ? visaDoc.expiry_date : undefined,
      laborCardExpiry: laborDoc ? laborDoc.expiry_date : undefined,
      healthCardExpiry: healthDoc ? healthDoc.expiry_date : undefined,
      salary,
      documents: documentsWithStatus
    };
  }

  async createEmployee(data: any) {
    const { data: res, error } = await supabaseAdmin
      .from("employees")
      .insert([{
        full_name: data.fullName,
        job_title: data.jobTitle,
        hire_date: data.hireDate,
        branch: data.branch,
        visa_status: data.visaStatus,
        work_location: data.workLocation,
        nationality: data.nationality,
        emp_id: data.empId,
        passport_availability: data.passportAvailability,
        passport_number: data.passportNumber,
        date_of_birth: data.dateOfBirth,
        passport_issue_date: data.passportIssueDate,
        passport_expiry_date: data.passportExpiryDate,
        address: data.address,
        personal_no: data.personalNo,
        contract_type: data.contractType || 'unlimited',
        status: data.status || 'active',
        department: data.department || 'Operations',
        labor_card_number: data.laborCardNumber,
        iban: data.iban,
        bank_routing_code: data.bankRoutingCode
      }])
      .select()
      .single();

    if (error) throw error;

    // Handle Documents
    const documentUpdates = [];
    if (data.visaExpiry) documentUpdates.push({ employee_id: res.id, document_type: 'Visa', expiry_date: data.visaExpiry });
    if (data.laborCardExpiry) documentUpdates.push({ employee_id: res.id, document_type: 'Labor Card', expiry_date: data.laborCardExpiry });
    if (data.healthCardExpiry) documentUpdates.push({ employee_id: res.id, document_type: 'Health Card', expiry_date: data.healthCardExpiry });

    if (documentUpdates.length > 0) {
      const { error: docError } = await supabaseAdmin.from("documents").insert(documentUpdates);
      if (docError) console.error("Error creating document tracks:", docError);
    }

    return { id: res.id, ...data };
  }

  async updateEmployee(id: string, data: any) {
    const { data: res, error } = await supabaseAdmin
      .from("employees")
      .update({
        full_name: data.fullName,
        job_title: data.jobTitle,
        hire_date: data.hireDate,
        branch: data.branch,
        visa_status: data.visaStatus,
        work_location: data.workLocation,
        nationality: data.nationality,
        emp_id: data.empId,
        passport_availability: data.passportAvailability,
        passport_number: data.passportNumber,
        date_of_birth: data.dateOfBirth,
        passport_issue_date: data.passportIssueDate,
        passport_expiry_date: data.passportExpiryDate,
        address: data.address,
        personal_no: data.personalNo,
        contract_type: data.contractType,
        status: data.status,
        department: data.department,
        labor_card_number: data.laborCardNumber,
        iban: data.iban,
        bank_routing_code: data.bankRoutingCode,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    // Handle Documents (Upsert)
    const documentUpdates = [];
    if (data.visaExpiry) documentUpdates.push({ employee_id: id, document_type: 'Visa', expiry_date: data.visaExpiry });
    if (data.laborCardExpiry) documentUpdates.push({ employee_id: id, document_type: 'Labor Card', expiry_date: data.laborCardExpiry });
    if (data.healthCardExpiry) documentUpdates.push({ employee_id: id, document_type: 'Health Card', expiry_date: data.healthCardExpiry });

    for (const doc of documentUpdates) {
      await supabaseAdmin.from("documents").upsert(doc, { onConflict: 'employee_id,document_type' });
    }

    return res;
  }

  async deleteEmployee(id: string) {
    const { error } = await supabaseAdmin
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return { success: true };
  }

  async terminateEmployee(id: string, terminationDate: string, reason: string) {
    const { data, error } = await supabaseAdmin
      .from("employees")
      .update({
        status: "terminated",
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    
    // Additional functionality could go here:
    // archiving records, sending final settlement docs, etc.
    // For now we just return the full settlement info which we can calculate using getGratuityInfo

    const gratuity = await this.getGratuityInfo(id);
    const leave = await this.getLeaveBalance(id);

    return {
      success: true,
      employee: data,
      gratuity,
      leaveBalance: leave,
      terminationDate,
      reason
    };
  }

  async addDocument(employeeId: string, data: any) {
    const { data: res, error } = await supabaseAdmin
      .from("documents")
      .insert([{
        employee_id: employeeId,
        document_type: data.documentType,
        issue_date: data.issueDate,
        expiry_date: data.expiryDate,
        file_name: data.fileName,
        file_url: data.fileUrl,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return res;
  }

  async getAllDocuments() {
    const { data, error } = await supabaseAdmin
      .from("documents")
      .select(`
        *,
        employees:employee_id (full_name)
      `)
      .order("expiry_date", { ascending: true });
    
    if (error) throw error;
    return (data || []).map(d => ({
      id: d.id,
      employeeId: d.employee_id,
      employeeName: (d.employees as any)?.full_name || "Unknown",
      documentType: d.document_type,
      issueDate: d.issue_date,
      expiryDate: d.expiry_date,
      fileName: d.file_name,
      fileUrl: d.file_url,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  async ensureStorageBucket() {
    try {
      const { data: buckets } = await supabaseAdmin.storage.listBuckets();
      const exists = buckets?.some(b => b.id === 'documents');
      
      if (!exists) {
        console.log("Initializing 'documents' storage bucket...");
        await supabaseAdmin.storage.createBucket('documents', {
          public: true,
          fileSizeLimit: 5242880, // 5MB limit
        });
      }
    } catch (e) {
      console.warn("Storage bucket initialization failed. It might already exist or permissions are restricted.", e);
    }
  }

  /**
   * Salaries
   */
  async updateSalary(employeeId: string, data: any) {
    const totalSalary = (data.basicSalary || 0) + (data.housingAllowance || 0) + (data.transportAllowance || 0) + (data.otherAllowances || 0) - (data.deductions || 0);
    
    const salaryRow = {
      employee_id: employeeId,
      basic_salary: data.basicSalary,
      housing_allowance: data.housingAllowance,
      transport_allowance: data.transportAllowance,
      other_allowances: data.otherAllowances,
      deductions: data.deductions,
      total_salary: totalSalary,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabaseAdmin
      .from("salaries")
      .upsert(salaryRow, { onConflict: 'employee_id' });

    if (error) throw error;
    return { ...data, totalSalary };
  }

  async getLeaveBalance(employeeId: string) {
    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .select("hire_date")
      .eq("id", employeeId)
      .single();
    
    if (empError) throw new Error("Employee not found");
    
    const { data: leaves, error: leavesError } = await supabaseAdmin
      .from("leaves")
      .select("days_requested")
      .eq("employee_id", employeeId)
      .eq("status", "approved");
    
    if (leavesError) throw leavesError;
    
    const usedDays = (leaves || []).reduce((acc, l) => acc + (l.days_requested || 0), 0);
    const balance = calculateLeaveBalance(employee.hire_date, usedDays);
    
    return { balance, usedDays };
  }

  async getGratuityInfo(employeeId: string) {
    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .select("hire_date")
      .eq("id", employeeId)
      .single();

    const { data: salary, error: salaryError } = await supabaseAdmin
      .from("salaries")
      .select("basic_salary")
      .eq("employee_id", employeeId)
      .maybeSingle();
    
    if (empError || !salary) {
      throw new Error("Employee or salary data missing");
    }
    
    const amount = calculateGratuity(employee.hire_date, salary.basic_salary);
    return { amount, hireDate: employee.hire_date, basicSalary: salary.basic_salary };
  }

  async getAllLeaves() {
    const { data, error } = await supabaseAdmin
      .from("leaves")
      .select(`
        *,
        employees:employee_id (full_name)
      `)
      .order("created_at", { ascending: false });
    
    if (error) throw error;
    return (data || []).map(l => ({
      id: l.id,
      employeeId: l.employee_id,
      employeeName: (l.employees as any)?.full_name || "Unknown",
      leaveType: l.leave_type,
      startDate: l.start_date,
      endDate: l.end_date,
      daysRequested: l.days_requested,
      status: l.status,
      reason: l.reason,
      createdAt: l.created_at
    }));
  }

  async createLeaveRequest(employeeId: string, data: any) {
    const { data: res, error } = await supabaseAdmin
      .from("leaves")
      .insert([{
        employee_id: employeeId,
        leave_type: data.leaveType,
        start_date: data.startDate,
        end_date: data.endDate,
        days_requested: data.daysRequested,
        status: data.status || 'pending', 
        reason: data.reason
      }])
      .select()
      .single();

    if (error) throw error;
    return res;
  }

  async updateLeaveStatus(id: string, status: 'approved' | 'rejected') {
    const { data, error } = await supabaseAdmin
      .from("leaves")
      .update({ status })
      .eq("id", id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async getReportsData() {
    const employees = await this.getEmployees();
    const { data: salaries, error: salariesError } = await supabaseAdmin
      .from("salaries")
      .select("*");
    const { data: leaves, error: leavesError } = await supabaseAdmin
      .from("leaves")
      .select("*");

    if (salariesError || leavesError) throw (salariesError || leavesError);

    // Demographics
    const demographics = {
      byDepartment: {} as Record<string, number>,
      byBranch: {} as Record<string, number>,
      byNationality: {} as Record<string, number>
    };

    employees.forEach((emp: any) => {
      demographics.byDepartment[emp.department] = (demographics.byDepartment[emp.department] || 0) + 1;
      demographics.byBranch[emp.branch] = (demographics.byBranch[emp.branch] || 0) + 1;
      demographics.byNationality[emp.nationality] = (demographics.byNationality[emp.nationality] || 0) + 1;
    });

    // Salary Summary
    const salarySummary = {
      totalBasic: 0,
      totalAllowances: 0,
      totalDeductions: 0,
      avgSalary: 0,
      totalPayroll: 0,
      byDepartment: {} as Record<string, { totalBasic: number, allowances: number, deductions: number, avgSalary: number, totalSalary: number, count: number }>
    };

    salaries?.forEach((sal: any) => {
      const allowances = (sal.housing_allowance || 0) + (sal.transport_allowance || 0) + (sal.other_allowances || 0);
      salarySummary.totalBasic += (sal.basic_salary || 0);
      salarySummary.totalAllowances += allowances;
      salarySummary.totalDeductions += (sal.deductions || 0);
      salarySummary.totalPayroll += sal.total_salary;
      
      const emp = employees.find((e: any) => e.id === sal.employee_id);
      if (emp) {
        if (!salarySummary.byDepartment[emp.department]) {
          salarySummary.byDepartment[emp.department] = {
            totalBasic: 0,
            allowances: 0,
            deductions: 0,
            avgSalary: 0,
            totalSalary: 0,
            count: 0
          };
        }
        
        const dept = salarySummary.byDepartment[emp.department];
        dept.totalBasic += (sal.basic_salary || 0);
        dept.allowances += allowances;
        dept.deductions += (sal.deductions || 0);
        dept.totalSalary += sal.total_salary;
        dept.count += 1;
      }
    });

    Object.values(salarySummary.byDepartment).forEach(dept => {
      dept.avgSalary = dept.totalSalary / dept.count;
    });

    if (salaries && salaries.length > 0) {
      salarySummary.avgSalary = salarySummary.totalPayroll / salaries.length;
    }

    // Leave Trends
    const leaveTrends = {
      byType: {} as Record<string, number>,
      approvedTotal: 0,
      rejectedTotal: 0,
      pendingTotal: 0
    };

    leaves?.forEach((l: any) => {
      leaveTrends.byType[l.leave_type] = (leaveTrends.byType[l.leave_type] || 0) + 1;
      if (l.status === 'approved') leaveTrends.approvedTotal++;
      else if (l.status === 'rejected') leaveTrends.rejectedTotal++;
      else leaveTrends.pendingTotal++;
    });

    return { demographics, salarySummary, leaveTrends };
  }

  async getSettings() {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("id", "global")
      .maybeSingle();
    
    if (error) {
      if (error.code === '42P01' || String(error.message).includes("Could not find the table")) {
        // Table not created yet, return default
        return {
          id: 'global',
          alertThresholds: { critical: 30, warning: 60, info: 90 },
          notificationChannels: { inApp: true, email: false }
        };
      }
      throw error;
    }
    
    // Return default if not found
    if (!data) {
      return {
        id: 'global',
        alertThresholds: { critical: 30, warning: 60, info: 90 },
        notificationChannels: { inApp: true, email: false }
      };
    }

    return {
      id: data.id,
      alertThresholds: data.alert_thresholds || { critical: 30, warning: 60, info: 90 },
      notificationChannels: data.notification_channels || { inApp: true, email: false }
    };
  }

  async updateSettings(data: any) {
    const { error } = await supabaseAdmin
      .from("settings")
      .upsert({
        id: 'global',
        alert_thresholds: data.alertThresholds,
        notification_channels: data.notificationChannels,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (error) throw error;
    return data;
  }

  async getDocumentTypes() {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("id", "document_types")
      .maybeSingle();

    const defaultTypes = ["Emirates ID", "Visa", "Passport", "Healthcard", "Labor Card", "Other"];
    
    if (error || !data || !data.alert_thresholds || !data.alert_thresholds.types) {
      return defaultTypes;
    }

    return data.alert_thresholds.types;
  }

  async updateDocumentTypes(types: string[]) {
    const { error } = await supabaseAdmin
      .from("settings")
      .upsert({
        id: 'document_types',
        alert_thresholds: { types },
        notification_channels: {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (error) throw error;
    return types;
  }

  async getQuotaLogs(licenseId: string) {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("id", `quota_logs_${licenseId}`)
      .maybeSingle();
      
    if (error || !data || !data.alert_thresholds) return [];
    return data.alert_thresholds.logs || [];
  }

  async addQuotaLog(licenseId: string, log: any) {
    const logs = await this.getQuotaLogs(licenseId);
    logs.unshift({ ...log, timestamp: new Date().toISOString() });
    
    await supabaseAdmin
      .from("settings")
      .upsert({
        id: `quota_logs_${licenseId}`,
        alert_thresholds: { logs },
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
    return logs;
  }

  async getTradeLicenses() {
    const { data, error } = await supabaseAdmin
      .from("trade_licenses")
      .select("*")
      .order('s_no', { ascending: true });

    if (error) {
      if (error.code === '42P01') {
        return []; // Table not created yet
      }
      throw error;
    }
    return data || [];
  }

  async createTradeLicense(data: any) {
    const { data: record, error } = await supabaseAdmin
      .from("trade_licenses")
      .insert([{
        ...data,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    
    if (data.visa_quota_utilized !== undefined || data.visa_quota_unutilized !== undefined) {
      await this.addQuotaLog(record.id, {
        action: 'INITIAL_QUOTA',
        previousUtilized: 0,
        newUtilized: data.visa_quota_utilized || 0,
        previousUnutilized: 0,
        newUnutilized: data.visa_quota_unutilized || 0,
        user: 'Admin'
      });
    }

    return record;
  }

  async updateTradeLicense(id: string, data: any) {
    const { data: existing } = await supabaseAdmin.from("trade_licenses").select("*").eq("id", id).single();
    
    if (existing) {
      if ((data.visa_quota_utilized !== undefined && existing.visa_quota_utilized !== data.visa_quota_utilized) || 
          (data.visa_quota_unutilized !== undefined && existing.visa_quota_unutilized !== data.visa_quota_unutilized)) {
        await this.addQuotaLog(id, {
          action: 'QUOTA_UPDATE',
          previousUtilized: existing.visa_quota_utilized,
          newUtilized: data.visa_quota_utilized !== undefined ? data.visa_quota_utilized : existing.visa_quota_utilized,
          previousUnutilized: existing.visa_quota_unutilized,
          newUnutilized: data.visa_quota_unutilized !== undefined ? data.visa_quota_unutilized : existing.visa_quota_unutilized,
          user: 'Admin',
          note: data.quota_note || ''
        });
      }
    }
    
    // Remove quota_note from data so it doesn't fail on table insert
    const updateData = { ...data };
    delete updateData.quota_note;

    const { data: record, error } = await supabaseAdmin
      .from("trade_licenses")
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return record;
  }

  async deleteTradeLicense(id: string) {
    const { error } = await supabaseAdmin
      .from("trade_licenses")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  }

  async getLeavePolicies() {
    const { data, error } = await supabaseAdmin
      .from("settings")
      .select("*")
      .eq("id", "leave_policies")
      .maybeSingle();

    const defaultPolicies = [
      {
        id: "annual",
        name: "Annual Leave",
        accrualRate: 2.5,
        maxCarryOver: 5,
        eligibilityMonths: 6
      },
      {
        id: "sick",
        name: "Sick Leave",
        accrualRate: 1.25,
        maxCarryOver: 0,
        eligibilityMonths: 0
      }
    ];

    if (error || !data || !data.alert_thresholds || !data.alert_thresholds.policies) {
      return defaultPolicies;
    }

    return data.alert_thresholds.policies;
  }

  async updateLeavePolicies(policies: any[]) {
    const { error } = await supabaseAdmin
      .from("settings")
      .upsert({
        id: 'leave_policies',
        alert_thresholds: { policies },
        notification_channels: {},
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
    
    if (error) throw error;
    return policies;
  }

  async getComplianceSummary() {
    const { data: employees, error: empError } = await supabaseAdmin.from("employees").select("id, full_name");
    const { data: docs, error: docsError } = await supabaseAdmin.from("documents").select("*");
    const settings = await this.getSettings();
    
    if (empError || docsError) throw empError || docsError;

    const alerts = (docs || []).map(d => {
      const expiryInfo = checkNearExpiry(d.expiry_date, settings.alertThresholds);
      if (expiryInfo.status === 'critical' || expiryInfo.status === 'expired' || expiryInfo.status === 'warning') {
        const emp = employees.find(e => e.id === d.employee_id);
        return {
          id: d.id,
          employeeId: d.employee_id,
          employeeName: emp?.full_name || 'Unknown',
          documentType: d.document_type,
          expiryDate: d.expiry_date,
          daysLeft: expiryInfo.daysLeft,
          status: expiryInfo.status
        };
      }
      return null;
    }).filter(Boolean);

    return alerts;
  }

  async triggerEmailNotifications() {
    const settings = await this.getSettings();
    if (!settings.notificationChannels.email) {
      return { success: false, message: "Email notifications are disabled in settings." };
    }

    const alerts = await this.getComplianceSummary();
    if (alerts.length === 0) {
      return { success: true, message: "No expiring documents found. No emails sent." };
    }

    // Usually we would send to an admin email or the employee
    // For this demo, we'll send a summary to the SMTP_USER (admin)
    const adminEmail = process.env.SMTP_USER;
    if (!adminEmail) {
      throw new Error("SMTP_USER not configured in environment");
    }

    const alertsHtml = alerts.map((a: any) => `
      <div style="padding: 10px; border-bottom: 1px solid #eee;">
        <strong style="color: ${a.status === 'expired' || a.status === 'critical' ? '#dc2626' : '#ea580c'}">${a.status.toUpperCase()}</strong>: 
        ${a.employeeName} - ${a.documentType} 
        <span style="color: #666; font-size: 0.9em;">(Expires: ${a.expiryDate} - ${a.daysLeft} days remaining)</span>
      </div>
    `).join('');

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #1e293b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 1.5rem;">Document Compliance Alert</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.8;">Automated System Notification</p>
        </div>
        <div style="padding: 20px;">
          <p>The following documents are approaching expiration or have expired:</p>
          <div style="margin-top: 20px;">
            ${alertsHtml}
          </div>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 0.8rem; color: #666;">
            Please log in to the Human Resources Management System to take action.
          </div>
        </div>
      </div>
    `;

    await emailService.sendEmail(adminEmail, "Compliance Alert: Expiring Documents Registry", html);

    return { success: true, message: `Alert email dispatched to ${adminEmail} with ${alerts.length} notifications.` };
  }

  async exportEmployeesCSV() {
    const employees = await this.getEmployees();
    return stringify(employees, { header: true });
  }

  /**
   * UAE WPS SIF Generation
   * Format specified by UAE Central Bank
   */
  async exportWPSSIF(month: string) {
    const employees = await this.getEmployees();
    const fullData = await Promise.all(employees.map(async (e: any) => {
      const details = await this.getEmployeeById(e.id);
      return details;
    }));

    const activeEmployees = fullData.filter((e: any) => e.status === 'active' && e.iban && e.laborCardNumber);
    
    // Header Record (SCR)
    // Format: SCR,EstablishmentID,PayingBankRoutingCode,CreationDate,CreationTime,SalaryMonth,Count,TotalSalary
    const estId = "1234567890123"; // Example Establishment ID
    const payerBankCode = "123456789"; // Example Paying Bank
    const now = new Date();
    const creationDate = now.toISOString().split('T')[0].replace(/-/g, '');
    const creationTime = now.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
    const salaryMonth = month.replace(/-/g, ''); // Format YYYYMM
    
    let totalSalary = 0;
    const edrRows = activeEmployees.map((e: any) => {
      const basic = Number(e.salary?.basicSalary || 0);
      const variable = (Number(e.salary?.housingAllowance || 0) + 
                        Number(e.salary?.transportAllowance || 0) + 
                        Number(e.salary?.otherAllowance || 0));
      const deductions = Number(e.salary?.deductions || 0);
      const lineTotal = basic + variable - deductions;
      totalSalary += lineTotal;

      // EDR,EmployeeID,BankRoutingCode,BankAccount,StartDate,EndDate,Days,FixedSalary,VariableSalary,Deductions
      // Note: Days is typically 30 or calculated from month
      const days = 30;
      const startDate = `${month}-01`.replace(/-/g, '');
      const endDate = `${month}-30`.replace(/-/g, ''); // Simplified

      return `EDR,${e.laborCardNumber},${e.bankRoutingCode},${e.iban},${startDate},${endDate},${days},${basic.toFixed(2)},${variable.toFixed(2)},${deductions.toFixed(2)}`;
    });

    const scr = `SCR,${estId},${payerBankCode},${creationDate},${creationTime},${salaryMonth},${edrRows.length},${totalSalary.toFixed(2)}`;
    
    return [scr, ...edrRows].join("\n");
  }
}

export const hrmService = new HRMService();
