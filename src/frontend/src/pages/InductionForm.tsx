import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Toaster } from "@/components/ui/sonner";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { EmployeeStatus } from "../backend";
import FileUpload from "../components/FileUpload";
import SignaturePad from "../components/SignaturePad";
import { useActor } from "../hooks/useActor";
import { uploadDataURL } from "../lib/blobStorage";

const STEPS = [
  "Personal Info",
  "Work Profile",
  "Education",
  "Bank Details",
  "KYC",
  "Declaration",
  "Review & Submit",
];

const POST_OPTIONS = ["Tele Caller", "Back Office", "Sales Executive"];
const CALLING_OPTIONS = [
  "Personal Loan",
  "Jumbo Loan",
  "Loan Against Property",
  "Credit Card",
  "Vehicle Loan",
  "Home Loan",
  "Business Loan",
  "Loan Against Security",
  "Car Loan",
  "Education Loan",
];

interface FD {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  alternatePhone: string;
  email: string;
  fullAddress: string;
  postApplying: string[];
  typesOfCalling: string[];
  hasExperience: boolean;
  experienceDetails: string;
  expCertFileId: string;
  expCertName: string;
  leavingLetterFileId: string;
  leavingLetterName: string;
  slip1FileId: string;
  slip1Name: string;
  slip2FileId: string;
  slip2Name: string;
  slip3FileId: string;
  slip3Name: string;
  educationLevel: string;
  class10FileId: string;
  class10Name: string;
  class12FileId: string;
  class12Name: string;
  diplomaFileId: string;
  diplomaName: string;
  bachelorFileId: string;
  bachelorName: string;
  masterFileId: string;
  masterName: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  chequeFileId: string;
  chequeName: string;
  aadhaarNumber: string;
  panNumber: string;
  aadhaarCardFileId: string;
  aadhaarCardName: string;
  panCardFileId: string;
  panCardName: string;
  passportPhotoFileId: string;
  passportPhotoName: string;
  declarationDate: string;
  signatureFileId: string;
}

const INIT: FD = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  alternatePhone: "",
  email: "",
  fullAddress: "",
  postApplying: [],
  typesOfCalling: [],
  hasExperience: false,
  experienceDetails: "",
  expCertFileId: "",
  expCertName: "",
  leavingLetterFileId: "",
  leavingLetterName: "",
  slip1FileId: "",
  slip1Name: "",
  slip2FileId: "",
  slip2Name: "",
  slip3FileId: "",
  slip3Name: "",
  educationLevel: "",
  class10FileId: "",
  class10Name: "",
  class12FileId: "",
  class12Name: "",
  diplomaFileId: "",
  diplomaName: "",
  bachelorFileId: "",
  bachelorName: "",
  masterFileId: "",
  masterName: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  upiId: "",
  chequeFileId: "",
  chequeName: "",
  aadhaarNumber: "",
  panNumber: "",
  aadhaarCardFileId: "",
  aadhaarCardName: "",
  panCardFileId: "",
  panCardName: "",
  passportPhotoFileId: "",
  passportPhotoName: "",
  declarationDate: new Date().toISOString().split("T")[0],
  signatureFileId: "",
};

function toggleArray(arr: string[], val: string): string[] {
  return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
}

export default function InductionForm() {
  const [step, setStep] = useState(0);
  const [fd, setFd] = useState<FD>(INIT);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signatureEmpty, setSignatureEmpty] = useState(true);
  const [uploadingSignature, setUploadingSignature] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { actor, isFetching } = useActor();

  const set = useCallback((key: keyof FD, val: string | boolean | string[]) => {
    setFd((p) => ({ ...p, [key]: val }));
    setErrors((p) => {
      const n = { ...p };
      delete n[key];
      return n;
    });
  }, []);

  const validateStep = (s: number): boolean => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!fd.fullName.trim()) e.fullName = "Required";
      if (!fd.dateOfBirth) e.dateOfBirth = "Required";
      if (!fd.gender) e.gender = "Required";
      if (!fd.phone.trim()) e.phone = "Required";
      if (!fd.alternatePhone.trim()) e.alternatePhone = "Required";
      if (!fd.email.trim()) e.email = "Required";
      if (!fd.fullAddress.trim()) e.fullAddress = "Required";
    }
    if (s === 2) {
      if (!fd.educationLevel.trim()) e.educationLevel = "Required";
      if (!fd.class10FileId) e.class10FileId = "Required";
    }
    if (s === 3) {
      if (!fd.bankName.trim()) e.bankName = "Required";
      if (!fd.accountHolderName.trim()) e.accountHolderName = "Required";
      if (!fd.accountNumber.trim()) e.accountNumber = "Required";
      if (!fd.ifscCode.trim()) e.ifscCode = "Required";
      if (!fd.chequeFileId) e.chequeFileId = "Required";
    }
    if (s === 4) {
      if (
        !fd.aadhaarNumber ||
        fd.aadhaarNumber.replace(/\D/g, "").length !== 12
      )
        e.aadhaarNumber = "Must be 12 digits";
      if (
        !fd.panNumber ||
        !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fd.panNumber.toUpperCase())
      )
        e.panNumber = "Format: ABCDE1234F";
      if (!fd.aadhaarCardFileId) e.aadhaarCardFileId = "Required";
      if (!fd.panCardFileId) e.panCardFileId = "Required";
      if (!fd.passportPhotoFileId) e.passportPhotoFileId = "Required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = async () => {
    if (step === 5) {
      // Upload signature before moving to review
      if (signatureEmpty) {
        toast.error("Please draw your signature before proceeding.");
        return;
      }
      const canvas = canvasRef.current;
      if (canvas) {
        setUploadingSignature(true);
        try {
          const dataUrl = canvas.toDataURL("image/png");
          const hash = await uploadDataURL(dataUrl);
          set("signatureFileId", hash);
        } catch {
          toast.error("Failed to upload signature. Please try again.");
          setUploadingSignature(false);
          return;
        }
        setUploadingSignature(false);
      }
    }
    if (!validateStep(step)) return;
    setStep((p) => Math.min(p + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  };

  const back = () => {
    setStep((p) => Math.max(p - 1, 0));
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!actor) {
      toast.error("Backend not ready, please wait.");
      return;
    }
    setSubmitting(true);
    try {
      await actor.submitEmployeeRecord({
        id: `emp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        fullName: fd.fullName,
        dateOfBirth: fd.dateOfBirth,
        gender: fd.gender,
        phone: fd.phone,
        alternatePhone: fd.alternatePhone || undefined,
        email: fd.email,
        fullAddress: fd.fullAddress,
        postApplying: fd.postApplying.join(", "),
        typesOfCalling: fd.typesOfCalling,
        hasExperience: fd.hasExperience,
        experienceDetails: fd.experienceDetails || undefined,
        experienceCertificateFileId: fd.expCertFileId || undefined,
        leavingLetterFileId: fd.leavingLetterFileId || undefined,
        salarySlip1FileId: fd.slip1FileId || undefined,
        salarySlip2FileId: fd.slip2FileId || undefined,
        salarySlip3FileId: fd.slip3FileId || undefined,
        educationLevel: fd.educationLevel,
        class10CertFileId: fd.class10FileId || undefined,
        class12CertFileId: fd.class12FileId || undefined,
        diplomaFileId: fd.diplomaFileId || undefined,
        bachelorFileId: fd.bachelorFileId || undefined,
        masterFileId: fd.masterFileId || undefined,
        bankName: fd.bankName,
        accountHolderName: fd.accountHolderName,
        accountNumber: fd.accountNumber,
        ifscCode: fd.ifscCode,
        upiId: fd.upiId || "",
        cancelledChequeFileId: fd.chequeFileId || undefined,
        aadhaarNumber: fd.aadhaarNumber,
        panNumber: fd.panNumber.toUpperCase(),
        aadhaarCardFileId: fd.aadhaarCardFileId || undefined,
        panCardFileId: fd.panCardFileId || undefined,
        passportPhotoFileId: fd.passportPhotoFileId || undefined,
        declarationDate: fd.declarationDate,
        signatureFileId: fd.signatureFileId || undefined,
        status: EmployeeStatus.pending,
        submittedAt: BigInt(Date.now()) * 1000000n,
      });
      setSubmitted(true);
      window.scrollTo(0, 0);
    } catch (err) {
      console.error(err);
      toast.error("Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md text-center bg-white rounded-xl shadow-lg p-10">
          <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h2
            className="text-2xl font-bold mb-3"
            style={{
              color: "#1a2c6b",
              fontFamily: "'Playfair Display', serif",
            }}
          >
            Form Submitted Successfully!
          </h2>
          <p className="text-muted-foreground">
            Your form has been submitted successfully. Our HR team will contact
            you shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      {/* Header */}
      <header className="maroon-header shadow-md">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div
              className="text-xl font-bold text-black"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              HR INDUCTION FORM
            </div>
            <div className="text-black text-xs mt-0.5">
              Email: infinexyfinance@gmail.com | Mo. 8460071353
            </div>
          </div>
          <img
            src="/assets/uploads/WhatsApp-Image-2026-02-27-at-11.18.04-AM-1-1.jpeg"
            alt="Infinexy Finance"
            className="h-12 object-contain"
          />
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 overflow-x-auto">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-1.5 shrink-0">
                  <div
                    className={`step-indicator ${
                      i === step
                        ? "step-active"
                        : i < step
                          ? "step-completed"
                          : "step-inactive"
                    }`}
                  >
                    {i < step ? "✓" : i + 1}
                  </div>
                  <span
                    className={`text-xs font-medium hidden sm:block ${
                      i === step
                        ? "text-primary"
                        : i < step
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }`}
                  >
                    {s}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`h-0.5 w-4 mx-1 ${
                      i < step ? "bg-amber-400" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Body */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          {/* Section Title */}
          <div className="section-header">{STEPS[step]}</div>
          <div className="p-6 space-y-5">
            {step === 0 && <Step1Personal fd={fd} set={set} errors={errors} />}
            {step === 1 && <Step2Work fd={fd} set={set} />}
            {step === 2 && <Step3Education fd={fd} set={set} errors={errors} />}
            {step === 3 && <Step4Bank fd={fd} set={set} errors={errors} />}
            {step === 4 && <Step5KYC fd={fd} set={set} errors={errors} />}
            {step === 5 && (
              <Step6Declaration
                fd={fd}
                canvasRef={canvasRef}
                signatureEmpty={signatureEmpty}
                setSignatureEmpty={setSignatureEmpty}
              />
            )}
            {step === 6 && (
              <Step7Review
                fd={fd}
                onEdit={() => {
                  setStep(0);
                  window.scrollTo(0, 0);
                }}
                onSubmit={handleSubmit}
                submitting={submitting}
                actorReady={!!actor && !isFetching}
              />
            )}
          </div>

          {/* Navigation */}
          {step < 6 && (
            <div className="px-6 pb-6 flex justify-between">
              <Button
                variant="outline"
                onClick={back}
                disabled={step === 0}
                data-ocid="form.button"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={next}
                disabled={uploadingSignature}
                style={{ background: "#1a2c6b", color: "white" }}
                data-ocid="form.primary_button"
              >
                {uploadingSignature
                  ? "Uploading Signature..."
                  : step === 5
                    ? "Proceed to Review"
                    : "Next"}
                {!uploadingSignature && (
                  <ChevronRight className="w-4 h-4 ml-1" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      <footer className="text-center text-xs text-muted-foreground py-6">
        © {new Date().getFullYear()}. Built with love using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}

/* ---- Step Components ---- */

type SetFn = (key: keyof FD, val: string | boolean | string[]) => void;

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-0.5">{msg}</p>;
}

function Field({
  label,
  required,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {children}
      <Err msg={error} />
    </div>
  );
}

function Step1Personal({
  fd,
  set,
  errors,
}: { fd: FD; set: SetFn; errors: Record<string, string> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Field label="Full Name" required error={errors.fullName}>
        <Input
          value={fd.fullName}
          onChange={(e) => set("fullName", e.target.value)}
          placeholder="Enter full name"
          data-ocid="personal.input"
        />
      </Field>
      <Field label="Date of Birth" required error={errors.dateOfBirth}>
        <Input
          type="date"
          value={fd.dateOfBirth}
          onChange={(e) => set("dateOfBirth", e.target.value)}
          data-ocid="personal.input"
        />
      </Field>
      <Field label="Gender" required error={errors.gender}>
        <RadioGroup
          value={fd.gender}
          onValueChange={(v) => set("gender", v)}
          className="flex gap-6 mt-1"
          data-ocid="personal.radio"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem value="Male" id="male" />
            <Label htmlFor="male">Male</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="Female" id="female" />
            <Label htmlFor="female">Female</Label>
          </div>
        </RadioGroup>
      </Field>
      <Field label="Phone Number" required error={errors.phone}>
        <Input
          type="tel"
          value={fd.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Mobile number"
          data-ocid="personal.input"
        />
      </Field>
      <Field
        label="Alternate Contact Number"
        required
        error={errors.alternatePhone}
      >
        <Input
          type="tel"
          value={fd.alternatePhone}
          onChange={(e) => set("alternatePhone", e.target.value)}
          placeholder="Alternate mobile number"
          data-ocid="personal.input"
        />
      </Field>
      <Field label="Email Address" required error={errors.email}>
        <Input
          type="email"
          value={fd.email}
          onChange={(e) => set("email", e.target.value)}
          placeholder="Email address"
          data-ocid="personal.input"
        />
      </Field>
      <div className="md:col-span-2">
        <Field label="Full Address" required error={errors.fullAddress}>
          <Textarea
            value={fd.fullAddress}
            onChange={(e) => set("fullAddress", e.target.value)}
            placeholder="House no, Street, City, State, PIN code"
            rows={3}
            data-ocid="personal.textarea"
          />
        </Field>
      </div>
    </div>
  );
}

function Step2Work({ fd, set }: { fd: FD; set: SetFn }) {
  return (
    <div className="space-y-6">
      <div>
        <Label className="font-semibold mb-2 block">
          Applying For the post of
        </Label>
        <div className="flex flex-wrap gap-4">
          {POST_OPTIONS.map((p) => (
            <div key={p} className="flex items-center gap-2">
              <Checkbox
                id={p}
                checked={fd.postApplying.includes(p)}
                onCheckedChange={() =>
                  set("postApplying", toggleArray(fd.postApplying, p))
                }
                data-ocid="work.checkbox"
              />
              <Label htmlFor={p}>{p}</Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label className="font-semibold mb-2 block">Types of Calling</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {CALLING_OPTIONS.map((c) => (
            <div key={c} className="flex items-center gap-2">
              <Checkbox
                id={c}
                checked={fd.typesOfCalling.includes(c)}
                onCheckedChange={() =>
                  set("typesOfCalling", toggleArray(fd.typesOfCalling, c))
                }
                data-ocid="work.checkbox"
              />
              <Label htmlFor={c} className="text-sm">
                {c}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Checkbox
            id="hasExp"
            checked={fd.hasExperience}
            onCheckedChange={(v) => set("hasExperience", !!v)}
            data-ocid="work.checkbox"
          />
          <Label htmlFor="hasExp" className="font-semibold">
            I have prior work experience
          </Label>
        </div>

        {fd.hasExperience && (
          <div className="space-y-4 pl-6 border-l-2 border-primary/20">
            <Field label="Experience Details">
              <Textarea
                value={fd.experienceDetails}
                onChange={(e) => set("experienceDetails", e.target.value)}
                placeholder="Describe your previous work experience..."
                rows={3}
                data-ocid="work.textarea"
              />
            </Field>
            <FileUpload
              label="Upload Experience Certificate"
              fileId={fd.expCertFileId}
              fileName={fd.expCertName}
              onUploaded={(id, name) => {
                set("expCertFileId", id);
                set("expCertName", name);
              }}
              data-ocid="work.upload_button"
            />
            <FileUpload
              label="Upload Leaving Letter"
              fileId={fd.leavingLetterFileId}
              fileName={fd.leavingLetterName}
              onUploaded={(id, name) => {
                set("leavingLetterFileId", id);
                set("leavingLetterName", name);
              }}
              data-ocid="work.upload_button"
            />
            <div>
              <Label className="font-semibold mb-2 block">
                Upload 3 Month Salary Slips
              </Label>
              <div className="space-y-3">
                <FileUpload
                  label="Month 1 Salary Slip"
                  fileId={fd.slip1FileId}
                  fileName={fd.slip1Name}
                  onUploaded={(id, name) => {
                    set("slip1FileId", id);
                    set("slip1Name", name);
                  }}
                  data-ocid="work.upload_button"
                />
                <FileUpload
                  label="Month 2 Salary Slip"
                  fileId={fd.slip2FileId}
                  fileName={fd.slip2Name}
                  onUploaded={(id, name) => {
                    set("slip2FileId", id);
                    set("slip2Name", name);
                  }}
                  data-ocid="work.upload_button"
                />
                <FileUpload
                  label="Month 3 Salary Slip"
                  fileId={fd.slip3FileId}
                  fileName={fd.slip3Name}
                  onUploaded={(id, name) => {
                    set("slip3FileId", id);
                    set("slip3Name", name);
                  }}
                  data-ocid="work.upload_button"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Step3Education({
  fd,
  set,
  errors,
}: { fd: FD; set: SetFn; errors: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <Field
        label="Education Level / Qualification"
        required
        error={errors.educationLevel}
      >
        <Input
          value={fd.educationLevel}
          onChange={(e) => set("educationLevel", e.target.value)}
          placeholder="e.g. Bachelor of Commerce, 12th Pass, etc."
          data-ocid="education.input"
        />
      </Field>
      <div className="space-y-3">
        <FileUpload
          label="Upload Class 10th Certificate"
          required
          fileId={fd.class10FileId}
          fileName={fd.class10Name}
          onUploaded={(id, name) => {
            set("class10FileId", id);
            set("class10Name", name);
          }}
          data-ocid="education.upload_button"
        />
        {errors.class10FileId && <Err msg={errors.class10FileId} />}
        <FileUpload
          label="Upload Class 12th Certificate"
          optional
          fileId={fd.class12FileId}
          fileName={fd.class12Name}
          onUploaded={(id, name) => {
            set("class12FileId", id);
            set("class12Name", name);
          }}
          data-ocid="education.upload_button"
        />
        <FileUpload
          label="Upload Diploma Certificate"
          optional
          fileId={fd.diplomaFileId}
          fileName={fd.diplomaName}
          onUploaded={(id, name) => {
            set("diplomaFileId", id);
            set("diplomaName", name);
          }}
          data-ocid="education.upload_button"
        />
        <FileUpload
          label="Upload Bachelor's Degree Certificate"
          optional
          fileId={fd.bachelorFileId}
          fileName={fd.bachelorName}
          onUploaded={(id, name) => {
            set("bachelorFileId", id);
            set("bachelorName", name);
          }}
          data-ocid="education.upload_button"
        />
        <FileUpload
          label="Upload Master's Degree Certificate"
          optional
          fileId={fd.masterFileId}
          fileName={fd.masterName}
          onUploaded={(id, name) => {
            set("masterFileId", id);
            set("masterName", name);
          }}
          data-ocid="education.upload_button"
        />
      </div>
    </div>
  );
}

function Step4Bank({
  fd,
  set,
  errors,
}: { fd: FD; set: SetFn; errors: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Bank Name" required error={errors.bankName}>
          <Input
            value={fd.bankName}
            onChange={(e) => set("bankName", e.target.value)}
            placeholder="e.g. State Bank of India"
            data-ocid="bank.input"
          />
        </Field>
        <Field
          label="Account Holder Name"
          required
          error={errors.accountHolderName}
        >
          <Input
            value={fd.accountHolderName}
            onChange={(e) => set("accountHolderName", e.target.value)}
            placeholder="As per bank records"
            data-ocid="bank.input"
          />
        </Field>
        <Field label="Account Number" required error={errors.accountNumber}>
          <Input
            value={fd.accountNumber}
            onChange={(e) => set("accountNumber", e.target.value)}
            placeholder="Bank account number"
            data-ocid="bank.input"
          />
        </Field>
        <Field label="IFSC Code" required error={errors.ifscCode}>
          <Input
            value={fd.ifscCode}
            onChange={(e) => set("ifscCode", e.target.value.toUpperCase())}
            placeholder="e.g. SBIN0001234"
            data-ocid="bank.input"
          />
        </Field>
        <Field label="UPI ID (if any)">
          <Input
            value={fd.upiId}
            onChange={(e) => set("upiId", e.target.value)}
            placeholder="e.g. yourname@upi"
            data-ocid="bank.input"
          />
        </Field>
      </div>
      <FileUpload
        label="Upload Cancelled Cheque or Bank Statement"
        required
        fileId={fd.chequeFileId}
        fileName={fd.chequeName}
        onUploaded={(id, name) => {
          set("chequeFileId", id);
          set("chequeName", name);
        }}
        data-ocid="bank.upload_button"
      />
      {errors.chequeFileId && <Err msg={errors.chequeFileId} />}
    </div>
  );
}

function Step5KYC({
  fd,
  set,
  errors,
}: { fd: FD; set: SetFn; errors: Record<string, string> }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field label="Aadhaar Number" required error={errors.aadhaarNumber}>
          <Input
            value={fd.aadhaarNumber}
            onChange={(e) =>
              set(
                "aadhaarNumber",
                e.target.value.replace(/\D/g, "").slice(0, 12),
              )
            }
            placeholder="12-digit Aadhaar number"
            maxLength={12}
            data-ocid="kyc.input"
          />
        </Field>
        <Field label="PAN Number" required error={errors.panNumber}>
          <Input
            value={fd.panNumber}
            onChange={(e) => set("panNumber", e.target.value.toUpperCase())}
            placeholder="e.g. ABCDE1234F"
            maxLength={10}
            data-ocid="kyc.input"
          />
        </Field>
      </div>
      <div className="space-y-3">
        <FileUpload
          label="Upload Aadhaar Card"
          required
          fileId={fd.aadhaarCardFileId}
          fileName={fd.aadhaarCardName}
          onUploaded={(id, name) => {
            set("aadhaarCardFileId", id);
            set("aadhaarCardName", name);
          }}
          data-ocid="kyc.upload_button"
        />
        {errors.aadhaarCardFileId && <Err msg={errors.aadhaarCardFileId} />}
        <FileUpload
          label="Upload PAN Card"
          required
          fileId={fd.panCardFileId}
          fileName={fd.panCardName}
          onUploaded={(id, name) => {
            set("panCardFileId", id);
            set("panCardName", name);
          }}
          data-ocid="kyc.upload_button"
        />
        {errors.panCardFileId && <Err msg={errors.panCardFileId} />}
        <FileUpload
          label="Upload Passport Size Photo (White Background)"
          required
          fileId={fd.passportPhotoFileId}
          fileName={fd.passportPhotoName}
          onUploaded={(id, name) => {
            set("passportPhotoFileId", id);
            set("passportPhotoName", name);
          }}
          accept="image/*"
          data-ocid="kyc.upload_button"
        />
        {errors.passportPhotoFileId && <Err msg={errors.passportPhotoFileId} />}
      </div>
    </div>
  );
}

function Step6Declaration({
  fd,
  canvasRef,
  signatureEmpty,
  setSignatureEmpty,
}: {
  fd: FD;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  signatureEmpty: boolean;
  setSignatureEmpty: (v: boolean) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <p className="text-sm leading-relaxed text-foreground">
          I hereby declare that the information provided above is true and
          correct to the best of my knowledge. I understand that providing false
          information may lead to termination of association with{" "}
          <strong>INFINEXY FINANCE</strong>.
        </p>
      </div>
      <Field label="Date">
        <Input
          value={fd.declarationDate}
          readOnly
          className="bg-gray-50 w-48"
        />
      </Field>
      <div className="space-y-2">
        <Label className="font-semibold">
          Signature <span className="text-destructive">*</span>
        </Label>
        <p className="text-xs text-muted-foreground">
          Please draw your signature in the box below using mouse or touch
        </p>
        <SignaturePad
          canvasRef={canvasRef}
          width={600}
          height={180}
          onSignatureChange={(isEmpty) => setSignatureEmpty(isEmpty)}
        />
        {signatureEmpty && (
          <p className="text-xs text-destructive">
            Please draw your signature to continue
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value?: string }) {
  return (
    <tr>
      <td className="py-2 px-3 text-sm font-semibold text-muted-foreground bg-gray-50 w-1/3 border">
        {label}
      </td>
      <td className="py-2 px-3 text-sm border">{value || "—"}</td>
    </tr>
  );
}

function ReviewSection({
  title,
  children,
}: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="section-header mb-0">{title}</div>
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

function FileReviewRow({
  label,
  fileName,
}: { label: string; fileName?: string }) {
  if (!fileName) return null;
  return <ReviewRow label={label} value={`✓ ${fileName}`} />;
}

function Step7Review({
  fd,
  onEdit,
  onSubmit,
  submitting,
  actorReady,
}: {
  fd: FD;
  onEdit: () => void;
  onSubmit: () => void;
  submitting: boolean;
  actorReady: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Please review all information carefully before submitting.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          data-ocid="review.button"
        >
          <ChevronLeft className="w-3 h-3 mr-1" /> Edit Form
        </Button>
      </div>

      <ReviewSection title="Personal Information">
        <ReviewRow label="Full Name" value={fd.fullName} />
        <ReviewRow label="Date of Birth" value={fd.dateOfBirth} />
        <ReviewRow label="Gender" value={fd.gender} />
        <ReviewRow label="Phone" value={fd.phone} />
        <ReviewRow label="Alternate Phone" value={fd.alternatePhone} />
        <ReviewRow label="Email" value={fd.email} />
        <ReviewRow label="Address" value={fd.fullAddress} />
      </ReviewSection>

      <ReviewSection title="Work Profile">
        <ReviewRow
          label="Post Applying For"
          value={fd.postApplying.join(", ")}
        />
        <ReviewRow
          label="Types of Calling"
          value={fd.typesOfCalling.join(", ")}
        />
        <ReviewRow
          label="Has Experience"
          value={fd.hasExperience ? "Yes" : "No"}
        />
        {fd.hasExperience && (
          <ReviewRow label="Experience Details" value={fd.experienceDetails} />
        )}
        <FileReviewRow
          label="Experience Certificate"
          fileName={fd.expCertName}
        />
        <FileReviewRow label="Leaving Letter" fileName={fd.leavingLetterName} />
        <FileReviewRow label="Salary Slip 1" fileName={fd.slip1Name} />
        <FileReviewRow label="Salary Slip 2" fileName={fd.slip2Name} />
        <FileReviewRow label="Salary Slip 3" fileName={fd.slip3Name} />
      </ReviewSection>

      <ReviewSection title="Education">
        <ReviewRow label="Qualification" value={fd.educationLevel} />
        <FileReviewRow
          label="Class 10th Certificate"
          fileName={fd.class10Name}
        />
        <FileReviewRow
          label="Class 12th Certificate"
          fileName={fd.class12Name}
        />
        <FileReviewRow label="Diploma" fileName={fd.diplomaName} />
        <FileReviewRow label="Bachelor's Degree" fileName={fd.bachelorName} />
        <FileReviewRow label="Master's Degree" fileName={fd.masterName} />
      </ReviewSection>

      <ReviewSection title="Bank Details">
        <ReviewRow label="Bank Name" value={fd.bankName} />
        <ReviewRow label="Account Holder" value={fd.accountHolderName} />
        <ReviewRow label="Account Number" value={fd.accountNumber} />
        <ReviewRow label="IFSC Code" value={fd.ifscCode} />
        <ReviewRow label="UPI ID" value={fd.upiId} />
        <FileReviewRow label="Cancelled Cheque" fileName={fd.chequeName} />
      </ReviewSection>

      <ReviewSection title="KYC Details">
        <ReviewRow label="Aadhaar Number" value={fd.aadhaarNumber} />
        <ReviewRow label="PAN Number" value={fd.panNumber} />
        <FileReviewRow label="Aadhaar Card" fileName={fd.aadhaarCardName} />
        <FileReviewRow label="PAN Card" fileName={fd.panCardName} />
        <FileReviewRow label="Passport Photo" fileName={fd.passportPhotoName} />
      </ReviewSection>

      <ReviewSection title="Declaration">
        <ReviewRow label="Declaration Date" value={fd.declarationDate} />
        <ReviewRow
          label="Signature"
          value={fd.signatureFileId ? "✓ Uploaded" : "—"}
        />
      </ReviewSection>

      <div className="flex justify-end pt-2">
        <Button
          onClick={onSubmit}
          disabled={submitting || !actorReady}
          style={{ background: "#1a2c6b", color: "white" }}
          className="px-8"
          data-ocid="review.submit_button"
        >
          {submitting
            ? "Submitting..."
            : !actorReady
              ? "Connecting..."
              : "Submit Form"}
        </Button>
      </div>
    </div>
  );
}
