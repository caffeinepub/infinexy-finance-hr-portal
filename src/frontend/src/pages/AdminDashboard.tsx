import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toaster } from "@/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import {
  Download,
  Eye,
  FileText,
  Key,
  LogOut,
  Printer,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type EmployeeRecord,
  EmployeeStatus,
  denormalizeRecord,
  normalizeRecord,
} from "../config";
import { useActor } from "../hooks/useActor";
import {
  changePassword,
  getEmployeeExtras,
  isAuthenticated,
  logout,
  saveEmployeeExtras,
} from "../lib/adminAuth";
import { getFileURL } from "../lib/blobStorage";
import { generateEmployeePDF } from "../lib/pdfGenerator";

async function loadImageAsDataURL(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

async function printAcceptanceLetter(
  emp: EmployeeRecord,
  acceptedDate: string,
): Promise<void> {
  const logoDataUrl = await loadImageAsDataURL(
    "/assets/uploads/infinexy-solution-logo.jpeg",
  );

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Please allow popups to print the acceptance letter.");
    return;
  }

  const logoHtml = logoDataUrl
    ? `<img src="${logoDataUrl}" style="height:60px;object-fit:contain;background:white;padding:6px 10px;border-radius:4px;" />`
    : `<div style="font-size:22px;font-weight:900;color:white;letter-spacing:0.04em;">INFINEXY SOLUTION</div>`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Employment Terms & Performance Agreement - ${emp.fullName}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Times New Roman', Times, serif; font-size: 13px; color: #1a1a1a; background: white; line-height: 1.6; }
  @media print {
    .no-print { display: none !important; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
  ul { padding-left: 0; list-style: none; }
  ul li { margin-bottom: 8px; padding-left: 0; }
</style>
</head>
<body>

<!-- Header -->
<div style="background:#1a2c6b;padding:0;">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 28px;">
    <div style="display:flex;align-items:center;gap:16px;">
      ${logoHtml}
      <div>
        <div style="font-size:22px;font-weight:900;color:white;letter-spacing:0.06em;font-family:Georgia,serif;">INFINEXY SOLUTION</div>
        <div style="font-size:10px;color:#c9a84c;letter-spacing:0.08em;text-transform:uppercase;margin-top:2px;">Employment Terms &amp; Performance Agreement</div>
      </div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;color:#c9a84c;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:3px;">Human Resources Division</div>
      <div style="font-size:10px;color:#ccd6f6;">infinexyfinance@gmail.com</div>
    </div>
  </div>
  <div style="background:#c9a84c;height:3px;"></div>
</div>

<!-- Document Title Banner -->
<div style="padding:14px 28px 10px;border-bottom:1px solid #d0d8f0;text-align:center;">
  <div style="font-size:16px;font-weight:800;color:#1a2c6b;letter-spacing:0.1em;text-transform:uppercase;font-family:Georgia,serif;">EMPLOYMENT TERMS &amp; PERFORMANCE AGREEMENT</div>
</div>

<!-- Body -->
<div style="padding:24px 36px;">

  <!-- Employee Details -->
  <table style="width:100%;border-collapse:collapse;margin-bottom:18px;font-size:13px;">
    <tr>
      <td style="padding:5px 0;font-weight:700;width:160px;color:#1a2c6b;">Date:</td>
      <td style="padding:5px 0;">March 29, 2026</td>
      <td style="padding:5px 0;font-weight:700;width:160px;color:#1a2c6b;">Employee ID:</td>
      <td style="padding:5px 0;">${emp.id}</td>
    </tr>
    <tr>
      <td style="padding:5px 0;font-weight:700;color:#1a2c6b;">Employee Name:</td>
      <td style="padding:5px 0;">${emp.fullName}</td>
      <td style="padding:5px 0;font-weight:700;color:#1a2c6b;">Position:</td>
      <td style="padding:5px 0;">${emp.postApplying || "&mdash;"}</td>
    </tr>
  </table>
  <div style="border-bottom:1px solid #d0d8f0;margin-bottom:16px;"></div>

  <!-- Subject -->
  <p style="margin-bottom:14px;font-size:13px;"><strong>Subject:</strong> Formal Acceptance of Performance and Confidentiality Terms</p>

  <p style="margin-bottom:16px;font-size:13px;">
    This document serves as a binding agreement between <strong>Infinexy Solution</strong> (the "Company") and
    <strong>${emp.fullName}</strong> (the "Employee"). By signing this letter, the Employee acknowledges and agrees to the
    following specific terms and conditions governing their employment:
  </p>

  <!-- Section 1 -->
  <div style="margin-bottom:16px;">
    <div style="background:linear-gradient(90deg,#1a2c6b 0%,#2a3f8f 100%);color:white;padding:7px 14px;font-weight:700;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;border-left:4px solid #c9a84c;margin-bottom:10px;">
      1. Performance-Linked Salary Structure
    </div>
    <p style="margin-bottom:8px;font-size:13px;padding:0 4px;">
      The Employee understands that their role is target-driven. The monthly salary is contingent upon the successful
      completion of the assigned Loan Disbursement Targets.
    </p>
    <ul style="margin-left:20px;font-size:13px;padding:0 4px;">
      <li style="margin-bottom:7px;">
        <strong>Target Achievement:</strong> The Employee is required to achieve 100% of the monthly loan disbursement
        target as set by the management.
      </li>
      <li style="margin-bottom:7px;">
        <strong>Penalty for Non-Completion:</strong> In the event the Employee fails to achieve the assigned monthly loan
        target, the Employee shall be entitled to receive only <strong>20% (twenty percent)</strong> of their total gross
        monthly salary. The remaining 80% is considered performance-contingent and will be forfeited for that month.
      </li>
    </ul>
  </div>

  <!-- Section 2 -->
  <div style="margin-bottom:16px;">
    <div style="background:linear-gradient(90deg,#1a2c6b 0%,#2a3f8f 100%);color:white;padding:7px 14px;font-weight:700;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;border-left:4px solid #c9a84c;margin-bottom:10px;">
      2. Data Security and Confidentiality
    </div>
    <p style="margin-bottom:8px;font-size:13px;padding:0 4px;">
      The Employee will have access to sensitive company data, including client financial records, lead databases,
      and proprietary lending algorithms.
    </p>
    <ul style="margin-left:20px;font-size:13px;padding:0 4px;">
      <li style="margin-bottom:7px;">
        <strong>Non-Disclosure:</strong> The Employee agrees to maintain strict confidentiality. No data shall be copied,
        transferred, or shared with third parties without written authorization.
      </li>
      <li style="margin-bottom:7px;">
        <strong>Liability for Data Theft:</strong> If the Employee is found responsible for any data theft, unauthorized
        data transfer, or breach of company digital security, they shall be legally bound to pay a penalty of
        <strong>Rs. 1,00,000 (One Lakh Rupees)</strong> to the Company.
      </li>
      <li style="margin-bottom:7px;">
        <strong>Legal Action:</strong> This penalty is independent of any further criminal or civil legal proceedings
        the Company may initiate to recover damages.
      </li>
    </ul>
  </div>

  <!-- Section 3 -->
  <div style="margin-bottom:20px;">
    <div style="background:linear-gradient(90deg,#1a2c6b 0%,#2a3f8f 100%);color:white;padding:7px 14px;font-weight:700;font-size:12px;letter-spacing:0.06em;text-transform:uppercase;border-left:4px solid #c9a84c;margin-bottom:10px;">
      3. General Terms &amp; Conditions
    </div>
    <p style="font-size:13px;padding:0 4px;">
      The Employee agrees to abide by all other standard operating procedures, codes of conduct, and internal policies
      of the Company as updated from time to time.
    </p>
  </div>

  <!-- Declaration & Acceptance -->
  <div style="border:2px solid #c9a84c;border-radius:4px;padding:16px 18px;background:#fffdf5;margin-bottom:20px;">
    <div style="font-weight:800;color:#1a2c6b;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px;font-family:Georgia,serif;">
      DECLARATION &amp; ACCEPTANCE
    </div>
    <p style="font-size:13px;margin-bottom:14px;">
      I, <strong>${emp.fullName}</strong>, have read and fully understood the terms mentioned above. I voluntarily agree
      to the performance-linked salary structure (including the 20% payout clause for missed targets) and the financial
      liability of Rs. 1,00,000 in the event of a data breach or theft.
    </p>
    <table style="width:100%;border-collapse:collapse;margin-top:10px;">
      <tr>
        <td style="width:45%;padding-right:24px;vertical-align:bottom;">
          <div style="border-bottom:1px solid #555;margin-bottom:5px;height:36px;"></div>
          <div style="font-size:11px;color:#555;">Employee Signature</div>
        </td>
        <td style="width:10%;"></td>
        <td style="width:45%;vertical-align:bottom;">
          <div style="border-bottom:1px solid #555;margin-bottom:5px;height:36px;"></div>
          <div style="font-size:11px;color:#555;">Date</div>
        </td>
      </tr>
      <tr><td colspan="3" style="height:18px;"></td></tr>
      <tr>
        <td style="width:45%;padding-right:24px;vertical-align:bottom;">
          <div style="border-bottom:1px solid #555;margin-bottom:5px;height:36px;"></div>
          <div style="font-size:11px;color:#555;">Witness Signature</div>
        </td>
        <td></td>
        <td></td>
      </tr>
    </table>
  </div>

  <!-- Accepted Notice -->
  <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:4px;padding:10px 14px;text-align:center;font-size:12px;font-weight:700;color:#166534;margin-bottom:20px;">
    &#10003; Employee accepted this agreement on: ${acceptedDate}
  </div>

  <!-- Footer -->
  <div style="border-top:2px solid #1a2c6b;padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:9px;color:#888;">This is a confidential HR document. Unauthorized disclosure is prohibited.</div>
    <div style="font-size:9px;color:#888;">Infinexy Solution &copy; ${new Date().getFullYear()}</div>
  </div>

</div>

<div class="no-print" style="text-align:center;padding:20px;background:#f7f9ff;border-top:1px solid #d0d8f0;">
  <button onclick="window.print()" style="background:#1a2c6b;color:white;padding:10px 32px;border:none;border-radius:4px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:0.04em;">Print Letter</button>
</div>

</body>
</html>`;

  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 800);
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  active: "bg-green-100 text-green-800 border-green-300",
  inactive: "bg-red-100 text-red-800 border-red-300",
};

export default function AdminDashboard() {
  const router = useRouter();
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"employees" | "letters">(
    "employees",
  );
  const [selectedEmployee, setSelectedEmployee] =
    useState<EmployeeRecord | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [editExtras, setEditExtras] = useState({
    dateOfJoining: "",
    dateOfLeaving: "",
  });
  const [editStatus, setEditStatus] = useState<EmployeeStatus>(
    EmployeeStatus.pending,
  );
  const [pwdForm, setPwdForm] = useState({
    current: "",
    newPwd: "",
    confirm: "",
  });
  const [passportURL, setPassportURL] = useState<string | null>(null);
  const [letterEmployee, setLetterEmployee] = useState<EmployeeRecord | null>(
    null,
  );
  const [acceptanceMap, setAcceptanceMap] = useState<Record<string, string>>(
    {},
  );
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.navigate({ to: "/admin/login" });
  }, [router]);

  const { data: employees = [], isLoading } = useQuery<EmployeeRecord[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!actor) return [];
      const [rawRecords, letters] = await Promise.all([
        actor.getAllEmployeeRecords(),
        actor.getAllAcceptanceLetters(),
      ]);
      setAcceptanceMap(Object.fromEntries(letters));
      return rawRecords.map(normalizeRecord);
    },
    enabled: isAuthenticated(),
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!actor) throw new Error("No actor");
      await actor.deleteEmployeeRecord(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee record deleted.");
      setDeleteId(null);
    },
    onError: () => toast.error("Delete failed."),
  });

  const updateMutation = useMutation({
    mutationFn: async (emp: EmployeeRecord) => {
      if (!actor) throw new Error("No actor");
      const raw = await actor.updateEmployeeRecord(
        emp.id,
        denormalizeRecord(emp),
      );
      return normalizeRecord(raw);
    },
    onSuccess: (_, emp) => {
      saveEmployeeExtras(emp.id, editExtras);
      qc.invalidateQueries({ queryKey: ["employees"] });
      toast.success("Employee record updated.");
      setSelectedEmployee(null);
    },
    onError: () => toast.error("Update failed."),
  });

  const filtered = employees.filter(
    (e) =>
      e.fullName.toLowerCase().includes(search.toLowerCase()) ||
      e.phone.includes(search),
  );

  const letterEmployees = employees.filter((e) => !!acceptanceMap[e.id]);

  const openEmployee = async (emp: EmployeeRecord) => {
    setSelectedEmployee(emp);
    const extras = getEmployeeExtras(emp.id);
    setEditExtras({
      dateOfJoining: extras.dateOfJoining || "",
      dateOfLeaving: extras.dateOfLeaving || "",
    });
    setEditStatus(emp.status);
    setPassportURL(null);
    if (emp.passportPhotoFileId) {
      try {
        const url = await getFileURL(emp.passportPhotoFileId);
        setPassportURL(url);
      } catch {
        // skip
      }
    }
  };

  const saveEmployee = () => {
    if (!selectedEmployee) return;
    updateMutation.mutate({ ...selectedEmployee, status: editStatus });
  };

  const handleChangePwd = async () => {
    if (pwdForm.newPwd !== pwdForm.confirm) {
      toast.error("New passwords do not match.");
      return;
    }
    setPwdLoading(true);
    const ok = await changePassword(pwdForm.current, pwdForm.newPwd);
    setPwdLoading(false);
    if (ok) {
      toast.success("Password changed successfully.");
      setChangePwdOpen(false);
      setPwdForm({ current: "", newPwd: "", confirm: "" });
    } else {
      toast.error("Current password is incorrect.");
    }
  };

  const handleLogout = () => {
    logout();
    router.navigate({ to: "/admin/login" });
  };

  const handleDownloadPDF = async (emp: EmployeeRecord) => {
    saveEmployeeExtras(emp.id, editExtras);
    await generateEmployeePDF(emp);
  };

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      <header className="maroon-header shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img
              src="/assets/uploads/infinexy-solution-logo.jpeg"
              alt="Infinexy Solution logo"
              className="h-10 object-contain"
            />
            <div>
              <div
                className="text-white font-bold text-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                INFINEXY SOLUTION
              </div>
              <div className="text-amber-200 text-xs">HR Management Portal</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-amber-300 text-amber-200 hover:bg-white/10"
              onClick={() => setChangePwdOpen(true)}
              data-ocid="dashboard.open_modal_button"
            >
              <Key className="w-4 h-4 mr-1" /> Change Password
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-red-300 text-red-200 hover:bg-white/10"
              onClick={handleLogout}
              data-ocid="dashboard.button"
            >
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Employees",
              count: employees.length,
              color: "#1a2c6b",
            },
            {
              label: "Pending",
              count: employees.filter(
                (e) => e.status === EmployeeStatus.pending,
              ).length,
              color: "#d97706",
            },
            {
              label: "Active",
              count: employees.filter((e) => e.status === EmployeeStatus.active)
                .length,
              color: "#16a34a",
            },
            {
              label: "Inactive",
              count: employees.filter(
                (e) => e.status === EmployeeStatus.inactive,
              ).length,
              color: "#dc2626",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-lg border shadow-sm p-4"
            >
              <div className="text-2xl font-bold" style={{ color: s.color }}>
                {s.count}
              </div>
              <div className="text-sm text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveTab("employees")}
            data-ocid="dashboard.tab"
            className="flex items-center gap-2 px-5 py-2 rounded-t-lg border text-sm font-semibold transition-colors"
            style={
              activeTab === "employees"
                ? {
                    background: "#1a2c6b",
                    color: "white",
                    borderColor: "#1a2c6b",
                  }
                : {
                    background: "white",
                    color: "#1a2c6b",
                    borderColor: "#1a2c6b",
                  }
            }
          >
            <Users className="w-4 h-4" /> Employee Records
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("letters")}
            data-ocid="dashboard.tab"
            className="flex items-center gap-2 px-5 py-2 rounded-t-lg border text-sm font-semibold transition-colors"
            style={
              activeTab === "letters"
                ? {
                    background: "#1a2c6b",
                    color: "white",
                    borderColor: "#1a2c6b",
                  }
                : {
                    background: "white",
                    color: "#1a2c6b",
                    borderColor: "#1a2c6b",
                  }
            }
          >
            <FileText className="w-4 h-4" /> Acceptance Letters
            {letterEmployees.length > 0 && (
              <span
                className="ml-1 px-1.5 py-0.5 rounded-full text-xs font-bold"
                style={
                  activeTab === "letters"
                    ? { background: "white", color: "#1a2c6b" }
                    : { background: "#1a2c6b", color: "white" }
                }
              >
                {letterEmployees.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "employees" && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between gap-4 flex-wrap">
              <h2
                className="text-lg font-bold flex items-center gap-2"
                style={{
                  color: "#1a2c6b",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                <Users className="w-5 h-5" /> Employee Records
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or phone..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 w-64"
                    data-ocid="dashboard.search_input"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    qc.invalidateQueries({ queryKey: ["employees"] })
                  }
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {isLoading || isFetching ? (
              <div
                className="p-12 text-center"
                data-ocid="dashboard.loading_state"
              >
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-muted-foreground">
                  Loading employee records...
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div
                className="p-12 text-center"
                data-ocid="dashboard.empty_state"
              >
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">
                  No employee records found.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {[
                        "#",
                        "Full Name",
                        "Phone",
                        "Post Applied",
                        "Status",
                        "Submitted",
                        "Joining Date",
                        "Acceptance Letter",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filtered.map((emp, i) => {
                      const extras = getEmployeeExtras(emp.id);
                      return (
                        <tr
                          key={emp.id}
                          className="hover:bg-gray-50 transition-colors"
                          data-ocid={`employees.item.${i + 1}`}
                        >
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            {i + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-sm">
                            {emp.fullName}
                          </td>
                          <td className="px-4 py-3 text-sm">{emp.phone}</td>
                          <td className="px-4 py-3 text-sm">
                            {emp.postApplying}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[emp.status]}`}
                            >
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {emp.submittedAt
                              ? new Date(
                                  Number(emp.submittedAt) / 1000000,
                                ).toLocaleDateString("en-IN")
                              : "\u2014"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {extras.dateOfJoining || "\u2014"}
                          </td>
                          <td className="px-4 py-3">
                            {acceptanceMap[emp.id] ? (
                              <Button
                                size="sm"
                                variant="outline"
                                style={{
                                  borderColor: "#1a2c6b",
                                  color: "#1a2c6b",
                                }}
                                onClick={() => setLetterEmployee(emp)}
                                data-ocid={`employees.secondary_button.${i + 1}`}
                              >
                                View Letter
                              </Button>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEmployee(emp)}
                                data-ocid={`employees.edit_button.${i + 1}`}
                              >
                                <Eye className="w-3 h-3 mr-1" /> View
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-amber-700 border-amber-300"
                                onClick={() => handleDownloadPDF(emp)}
                                data-ocid={`employees.download_button.${i + 1}`}
                              >
                                <Download className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/30"
                                onClick={() => setDeleteId(emp.id)}
                                data-ocid={`employees.delete_button.${i + 1}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "letters" && (
          <div className="bg-white rounded-lg border shadow-sm">
            <div className="p-4 border-b flex items-center justify-between gap-4 flex-wrap">
              <h2
                className="text-lg font-bold flex items-center gap-2"
                style={{
                  color: "#1a2c6b",
                  fontFamily: "'Playfair Display', serif",
                }}
              >
                <FileText className="w-5 h-5" /> Employee Acceptance Letters
              </h2>
              <Button
                variant="outline"
                size="icon"
                onClick={() =>
                  qc.invalidateQueries({ queryKey: ["employees"] })
                }
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>

            {isLoading || isFetching ? (
              <div
                className="p-12 text-center"
                data-ocid="letters.loading_state"
              >
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                <p className="text-muted-foreground">Loading letters...</p>
              </div>
            ) : letterEmployees.length === 0 ? (
              <div className="p-12 text-center" data-ocid="letters.empty_state">
                <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium">
                  No acceptance letters received yet.
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Letters will appear here after employees complete and accept
                  the Employment Terms &amp; Performance Agreement.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      {[
                        "#",
                        "Employee Name",
                        "Phone",
                        "Position",
                        "Accepted Date",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {letterEmployees.map((emp, i) => (
                      <tr
                        key={emp.id}
                        className="hover:bg-gray-50 transition-colors"
                        data-ocid={`letters.item.${i + 1}`}
                      >
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-sm">
                          {emp.fullName}
                        </td>
                        <td className="px-4 py-3 text-sm">{emp.phone}</td>
                        <td className="px-4 py-3 text-sm">
                          {emp.postApplying}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {acceptanceMap[emp.id] || "\u2014"}
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            size="sm"
                            onClick={() =>
                              printAcceptanceLetter(
                                emp,
                                acceptanceMap[emp.id] || "",
                              )
                            }
                            style={{ background: "#1a2c6b", color: "white" }}
                            data-ocid={`letters.primary_button.${i + 1}`}
                          >
                            <Printer className="w-3 h-3 mr-1" /> Print
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Employee Detail Dialog */}
      <Dialog
        open={!!selectedEmployee}
        onOpenChange={(o) => !o && setSelectedEmployee(null)}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="employees.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{
                color: "#1a2c6b",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Employee Details &mdash; {selectedEmployee?.fullName}
            </DialogTitle>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-4 text-sm">
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3
                  className="font-bold text-sm mb-3"
                  style={{ color: "#1a2c6b" }}
                >
                  Admin Actions
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Status</Label>
                    <Select
                      value={editStatus}
                      onValueChange={(v) => setEditStatus(v as EmployeeStatus)}
                    >
                      <SelectTrigger data-ocid="employees.select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={EmployeeStatus.pending}>
                          Pending
                        </SelectItem>
                        <SelectItem value={EmployeeStatus.active}>
                          Active
                        </SelectItem>
                        <SelectItem value={EmployeeStatus.inactive}>
                          Inactive
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Date of Joining</Label>
                    <Input
                      type="date"
                      value={editExtras.dateOfJoining}
                      onChange={(e) =>
                        setEditExtras((p) => ({
                          ...p,
                          dateOfJoining: e.target.value,
                        }))
                      }
                      data-ocid="employees.input"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date of Leaving (Future)</Label>
                    <Input
                      type="date"
                      value={editExtras.dateOfLeaving}
                      onChange={(e) =>
                        setEditExtras((p) => ({
                          ...p,
                          dateOfLeaving: e.target.value,
                        }))
                      }
                      data-ocid="employees.input"
                    />
                  </div>
                </div>
              </div>

              {passportURL && (
                <div className="flex justify-end">
                  <img
                    src={passportURL}
                    alt="Employee passport size"
                    className="w-24 h-28 object-cover border-2 border-primary rounded"
                  />
                </div>
              )}

              <DetailSection title="Personal Information">
                <FieldRow label="Full Name" value={selectedEmployee.fullName} />
                <FieldRow
                  label="Date of Birth"
                  value={selectedEmployee.dateOfBirth}
                />
                <FieldRow label="Gender" value={selectedEmployee.gender} />
                <FieldRow label="Phone" value={selectedEmployee.phone} />
                <FieldRow
                  label="Alternate Phone"
                  value={selectedEmployee.alternatePhone}
                />
                <FieldRow label="Email" value={selectedEmployee.email} />
                <FieldRow
                  label="Address"
                  value={selectedEmployee.fullAddress}
                />
              </DetailSection>

              <DetailSection title="Work Profile">
                <FieldRow
                  label="Post Applying"
                  value={selectedEmployee.postApplying}
                />
                <FieldRow
                  label="Types of Calling"
                  value={(selectedEmployee.typesOfCalling || []).join(", ")}
                />
                <FieldRow
                  label="Has Experience"
                  value={selectedEmployee.hasExperience ? "Yes" : "No"}
                />
                <FieldRow
                  label="Experience Details"
                  value={selectedEmployee.experienceDetails}
                />
              </DetailSection>

              <DetailSection title="Education">
                <FieldRow
                  label="Qualification"
                  value={selectedEmployee.educationLevel}
                />
              </DetailSection>

              <DetailSection title="Bank Details">
                <FieldRow label="Bank Name" value={selectedEmployee.bankName} />
                <FieldRow
                  label="Account Holder"
                  value={selectedEmployee.accountHolderName}
                />
                <FieldRow
                  label="Account Number"
                  value={selectedEmployee.accountNumber}
                />
                <FieldRow label="IFSC Code" value={selectedEmployee.ifscCode} />
                <FieldRow label="UPI ID" value={selectedEmployee.upiId} />
              </DetailSection>

              <DetailSection title="KYC Details">
                <FieldRow
                  label="Aadhaar Number"
                  value={selectedEmployee.aadhaarNumber}
                />
                <FieldRow
                  label="PAN Number"
                  value={selectedEmployee.panNumber}
                />
              </DetailSection>

              <DetailSection title="Uploaded Documents">
                <DocRow
                  label="Class 10th Certificate"
                  fileId={selectedEmployee.class10CertFileId}
                />
                <DocRow
                  label="Class 12th Certificate"
                  fileId={selectedEmployee.class12CertFileId}
                />
                <DocRow
                  label="Diploma"
                  fileId={selectedEmployee.diplomaFileId}
                />
                <DocRow
                  label="Bachelor's Degree"
                  fileId={selectedEmployee.bachelorFileId}
                />
                <DocRow
                  label="Master's Degree"
                  fileId={selectedEmployee.masterFileId}
                />
                <DocRow
                  label="Experience Certificate"
                  fileId={selectedEmployee.experienceCertificateFileId}
                />
                <DocRow
                  label="Relieving Letter"
                  fileId={selectedEmployee.leavingLetterFileId}
                />
                <DocRow
                  label="Salary Slip 1"
                  fileId={selectedEmployee.salarySlip1FileId}
                />
                <DocRow
                  label="Salary Slip 2"
                  fileId={selectedEmployee.salarySlip2FileId}
                />
                <DocRow
                  label="Salary Slip 3"
                  fileId={selectedEmployee.salarySlip3FileId}
                />
                <DocRow
                  label="Cancelled Cheque / Bank Statement"
                  fileId={selectedEmployee.cancelledChequeFileId}
                />
                <DocRow
                  label="Aadhaar Card"
                  fileId={selectedEmployee.aadhaarCardFileId}
                />
                <DocRow
                  label="PAN Card"
                  fileId={selectedEmployee.panCardFileId}
                />
                <DocRow
                  label="Passport Size"
                  fileId={selectedEmployee.passportPhotoFileId}
                />
                <DocRow
                  label="Signature"
                  fileId={selectedEmployee.signatureFileId}
                />
              </DetailSection>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedEmployee(null)}
              data-ocid="employees.cancel_button"
            >
              Close
            </Button>
            <Button
              onClick={() =>
                selectedEmployee && handleDownloadPDF(selectedEmployee)
              }
              variant="outline"
              className="border-amber-400 text-amber-700"
              data-ocid="employees.secondary_button"
            >
              <Download className="w-4 h-4 mr-1" /> Download PDF
            </Button>
            <Button
              onClick={saveEmployee}
              disabled={updateMutation.isPending}
              style={{ background: "#1a2c6b", color: "white" }}
              data-ocid="employees.save_button"
            >
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Acceptance Letter Dialog */}
      <Dialog
        open={!!letterEmployee}
        onOpenChange={(o) => !o && setLetterEmployee(null)}
      >
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto print:block"
          data-ocid="acceptance.dialog"
        >
          <DialogHeader>
            <DialogTitle
              style={{
                color: "#1a2c6b",
                fontFamily: "'Playfair Display', serif",
              }}
            >
              Employment Terms &amp; Performance Agreement
            </DialogTitle>
          </DialogHeader>
          {letterEmployee && (
            <div
              style={{ fontFamily: "'Times New Roman', serif" }}
              className="space-y-4 text-[14px] leading-relaxed text-gray-800"
            >
              {/* Letter Header */}
              <div
                className="flex items-center justify-between px-6 py-4 rounded-lg"
                style={{ background: "#1a2c6b" }}
              >
                <div>
                  <div
                    className="text-xl font-bold text-white"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    INFINEXY SOLUTION
                  </div>
                  <div className="text-xs text-white/70 mt-0.5">
                    Employment Terms & Performance Agreement
                  </div>
                </div>
                <img
                  src="/assets/uploads/infinexy-solution-logo.jpeg"
                  alt="Infinexy"
                  className="h-12 object-contain bg-white rounded p-1"
                />
              </div>
              <div className="h-1 rounded" style={{ background: "#c9a84c" }} />

              <div
                className="text-center font-bold text-base uppercase tracking-wide"
                style={{ color: "#1a2c6b" }}
              >
                EMPLOYMENT TERMS &amp; PERFORMANCE AGREEMENT
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm border-b pb-3">
                <div>
                  <span className="font-semibold">Date:</span> March 29, 2026
                </div>
                <div>
                  <span className="font-semibold">Employee ID:</span>{" "}
                  {letterEmployee.id}
                </div>
                <div>
                  <span className="font-semibold">Employee Name:</span>{" "}
                  {letterEmployee.fullName}
                </div>
                <div>
                  <span className="font-semibold">Position:</span>{" "}
                  {letterEmployee.postApplying}
                </div>
              </div>

              <div>
                <span className="font-semibold">Subject:</span> Formal
                Acceptance of Performance and Confidentiality Terms
              </div>

              <p>
                This document serves as a binding agreement between{" "}
                <strong>Infinexy Solution</strong> (the "Company") and{" "}
                <strong>{letterEmployee.fullName}</strong> (the "Employee"). By
                signing this letter, the Employee acknowledges and agrees to the
                following specific terms and conditions governing their
                employment:
              </p>

              <div className="space-y-3">
                <div>
                  <div className="font-bold" style={{ color: "#1a2c6b" }}>
                    1. Performance-Linked Salary Structure
                  </div>
                  <p className="mt-1">
                    The Employee understands that their role is target-driven.
                    The monthly salary is contingent upon the successful
                    completion of the assigned Loan Disbursement Targets.
                  </p>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>
                      <span className="font-semibold">Target Achievement:</span>{" "}
                      The Employee is required to achieve 100% of the monthly
                      loan disbursement target as set by the management.
                    </li>
                    <li>
                      <span className="font-semibold">
                        Penalty for Non-Completion:
                      </span>{" "}
                      In the event the Employee fails to achieve the assigned
                      monthly loan target, the Employee shall be entitled to
                      receive only <strong>20% (twenty percent)</strong> of
                      their total gross monthly salary. The remaining 80% is
                      considered performance-contingent and will be forfeited
                      for that month.
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="font-bold" style={{ color: "#1a2c6b" }}>
                    2. Data Security and Confidentiality
                  </div>
                  <p className="mt-1">
                    The Employee will have access to sensitive company data,
                    including client financial records, lead databases, and
                    proprietary lending algorithms.
                  </p>
                  <ul className="mt-1 ml-4 space-y-1">
                    <li>
                      <span className="font-semibold">Non-Disclosure:</span> The
                      Employee agrees to maintain strict confidentiality. No
                      data shall be copied, transferred, or shared with third
                      parties without written authorization.
                    </li>
                    <li>
                      <span className="font-semibold">
                        Liability for Data Theft:
                      </span>{" "}
                      If the Employee is found responsible for any data theft,
                      unauthorized data transfer, or breach of company digital
                      security, they shall be legally bound to pay a penalty of{" "}
                      <strong>Rs. 1,00,000 (One Lakh Rupees)</strong> to the
                      Company.
                    </li>
                    <li>
                      <span className="font-semibold">Legal Action:</span> This
                      penalty is independent of any further criminal or civil
                      legal proceedings the Company may initiate to recover
                      damages.
                    </li>
                  </ul>
                </div>
                <div>
                  <div className="font-bold" style={{ color: "#1a2c6b" }}>
                    3. General Terms &amp; Conditions
                  </div>
                  <p className="mt-1">
                    The Employee agrees to abide by all other standard operating
                    procedures, codes of conduct, and internal policies of the
                    Company as updated from time to time.
                  </p>
                </div>
              </div>

              <div
                className="border rounded-lg p-4 mt-2"
                style={{ borderColor: "#c9a84c", background: "#fffdf5" }}
              >
                <div
                  className="font-bold uppercase tracking-wide mb-2"
                  style={{ color: "#1a2c6b" }}
                >
                  DECLARATION &amp; ACCEPTANCE
                </div>
                <p>
                  I, <strong>{letterEmployee.fullName}</strong>, have read and
                  fully understood the terms mentioned above. I voluntarily
                  agree to the performance-linked salary structure (including
                  the 20% payout clause for missed targets) and the financial
                  liability of Rs. 1,00,000 in the event of a data breach or
                  theft.
                </p>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="border-b border-gray-400 pb-1 mb-1" />
                    <div className="text-xs text-gray-500">
                      Employee Signature
                    </div>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 pb-1 mb-1" />
                    <div className="text-xs text-gray-500">Date</div>
                  </div>
                  <div>
                    <div className="border-b border-gray-400 pb-1 mb-1" />
                    <div className="text-xs text-gray-500">
                      Witness Signature
                    </div>
                  </div>
                </div>
              </div>

              {letterEmployee && acceptanceMap[letterEmployee.id] && (
                <div className="text-sm text-green-700 font-semibold text-center border border-green-200 bg-green-50 rounded-lg py-2">
                  ✓ Employee accepted this agreement on:{" "}
                  {acceptanceMap[letterEmployee.id]}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              onClick={() =>
                letterEmployee &&
                printAcceptanceLetter(
                  letterEmployee,
                  acceptanceMap[letterEmployee.id] || "",
                )
              }
              style={{ background: "#1a2c6b", color: "white" }}
              data-ocid="acceptance.primary_button"
            >
              Print Letter
            </Button>
            <Button
              variant="outline"
              onClick={() => setLetterEmployee(null)}
              data-ocid="acceptance.close_button"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="employees.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The employee record will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="employees.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="employees.confirm_button"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Change Password Dialog */}
      <Dialog open={changePwdOpen} onOpenChange={setChangePwdOpen}>
        <DialogContent className="max-w-sm" data-ocid="changepassword.dialog">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={pwdForm.current}
                onChange={(e) =>
                  setPwdForm((p) => ({ ...p, current: e.target.value }))
                }
                data-ocid="changepassword.input"
              />
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={pwdForm.newPwd}
                onChange={(e) =>
                  setPwdForm((p) => ({ ...p, newPwd: e.target.value }))
                }
                data-ocid="changepassword.input"
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={pwdForm.confirm}
                onChange={(e) =>
                  setPwdForm((p) => ({ ...p, confirm: e.target.value }))
                }
                data-ocid="changepassword.input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setChangePwdOpen(false)}
              data-ocid="changepassword.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleChangePwd}
              disabled={pwdLoading}
              style={{ background: "#1a2c6b", color: "white" }}
              data-ocid="changepassword.save_button"
            >
              {pwdLoading ? "Saving..." : "Change Password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailSection({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="section-header">{title}</div>
      <div className="divide-y border border-t-0">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex px-3 py-2 text-sm">
      <span className="w-40 font-semibold text-muted-foreground shrink-0">
        {label}
      </span>
      <span>{value || "\u2014"}</span>
    </div>
  );
}

function DocRow({ label, fileId }: { label: string; fileId?: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!fileId) return;
    getFileURL(fileId)
      .then(setUrl)
      .catch(() => {});
  }, [fileId]);

  if (!fileId) return null;

  return (
    <div className="flex px-3 py-2 text-sm items-center">
      <span className="w-40 font-semibold text-muted-foreground shrink-0">
        {label}
      </span>
      {url ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-xs"
        >
          View Document
        </a>
      ) : (
        <span className="text-xs text-muted-foreground">Loading...</span>
      )}
    </div>
  );
}
