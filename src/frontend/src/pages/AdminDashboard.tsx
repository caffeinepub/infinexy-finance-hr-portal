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
  Key,
  LogOut,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { type EmployeeRecord, EmployeeStatus } from "../backend";
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

const STATUS_COLORS: Record<EmployeeStatus, string> = {
  [EmployeeStatus.pending]: "bg-yellow-100 text-yellow-800 border-yellow-300",
  [EmployeeStatus.active]: "bg-green-100 text-green-800 border-green-300",
  [EmployeeStatus.inactive]: "bg-red-100 text-red-800 border-red-300",
};

export default function AdminDashboard() {
  const router = useRouter();
  const { actor, isFetching } = useActor();
  const qc = useQueryClient();

  const [search, setSearch] = useState("");
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
  const [pwdLoading, setPwdLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.navigate({ to: "/admin/login" });
  }, [router]);

  const { data: employees = [], isLoading } = useQuery<EmployeeRecord[]>({
    queryKey: ["employees"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEmployeeRecords();
    },
    enabled: !!actor && !isFetching,
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
      return actor.updateEmployeeRecord(emp.id, emp);
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
              src="/assets/uploads/WhatsApp-Image-2026-02-27-at-11.18.04-AM-1-1.jpeg"
              alt="Infinexy Finance logo"
              className="h-10 object-contain"
            />
            <div>
              <div
                className="text-white font-bold text-lg"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                INFINEXY FINANCE
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
            <div className="p-12 text-center" data-ocid="dashboard.empty_state">
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
                              data-ocid={`employees.secondary_button.${i + 1}`}
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
                  label="Leaving Letter"
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
