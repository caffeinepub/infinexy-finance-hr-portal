import type { EmployeeRecord } from "../backend.d";
import { getEmployeeExtras } from "./adminAuth";
import { getFileURL } from "./blobStorage";

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

async function resolveFileURLs(
  employee: EmployeeRecord,
): Promise<Record<string, string>> {
  const fileFields: Array<[string, string | undefined]> = [
    ["passportPhoto", employee.passportPhotoFileId],
    ["aadhaarCard", employee.aadhaarCardFileId],
    ["panCard", employee.panCardFileId],
    ["class10Cert", employee.class10CertFileId],
    ["class12Cert", employee.class12CertFileId],
    ["diploma", employee.diplomaFileId],
    ["bachelor", employee.bachelorFileId],
    ["master", employee.masterFileId],
    ["experienceCert", employee.experienceCertificateFileId],
    ["leavingLetter", employee.leavingLetterFileId],
    ["salarySlip1", employee.salarySlip1FileId],
    ["salarySlip2", employee.salarySlip2FileId],
    ["salarySlip3", employee.salarySlip3FileId],
    ["cancelledCheque", employee.cancelledChequeFileId],
    ["signature", employee.signatureFileId],
  ];

  const urls: Record<string, string> = {};
  await Promise.all(
    fileFields.map(async ([key, fileId]) => {
      if (fileId) {
        try {
          urls[key] = await getFileURL(fileId);
        } catch {
          // skip
        }
      }
    }),
  );
  return urls;
}

export async function generateEmployeePDF(
  employee: EmployeeRecord,
): Promise<void> {
  const extras = getEmployeeExtras(employee.id);
  const fileURLs = await resolveFileURLs(employee);

  const [logoDataUrl, passportDataUrl, signatureDataUrl] = await Promise.all([
    loadImageAsDataURL("/assets/uploads/Screenshot-2026-03-14-102450-2.png"),
    fileURLs.passportPhoto
      ? loadImageAsDataURL(fileURLs.passportPhoto)
      : Promise.resolve(null),
    fileURLs.signature
      ? loadImageAsDataURL(fileURLs.signature)
      : Promise.resolve(null),
  ]);

  const docKeys = [
    "aadhaarCard",
    "panCard",
    "class10Cert",
    "class12Cert",
    "diploma",
    "bachelor",
    "master",
    "experienceCert",
    "leavingLetter",
    "salarySlip1",
    "salarySlip2",
    "salarySlip3",
    "cancelledCheque",
  ];
  const docImgs: Record<string, string | null> = {};
  await Promise.all(
    docKeys.map(async (k) => {
      if (fileURLs[k]) {
        docImgs[k] = await loadImageAsDataURL(fileURLs[k]);
      }
    }),
  );

  const win = window.open("", "_blank", "width=900,height=700");
  if (!win) {
    alert("Please allow popups to generate PDF");
    return;
  }

  const html = buildPDFHTML(
    employee,
    extras,
    logoDataUrl,
    passportDataUrl,
    signatureDataUrl,
    docImgs,
  );
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 800);
}

function row(label: string, value: string | undefined): string {
  return `<tr><td style="background:#f8f3f0;font-weight:600;width:35%;padding:7px 10px;border:1px solid #d1d5db;font-size:12px;">${label}</td><td style="padding:7px 10px;border:1px solid #d1d5db;font-size:12px;">${value || "\u2014"}</td></tr>`;
}

function section(title: string, rows: string): string {
  return `<div style="margin-bottom:18px;">
    <div style="background:#7B1C1C;color:white;padding:7px 12px;font-weight:700;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">${title}</div>
    <table style="width:100%;border-collapse:collapse;">${rows}</table>
  </div>`;
}

function buildPDFHTML(
  e: EmployeeRecord,
  extras: { dateOfJoining?: string; dateOfLeaving?: string },
  logoDataUrl: string | null,
  passportDataUrl: string | null,
  signatureDataUrl: string | null,
  docImgs: Record<string, string | null>,
): string {
  const submittedDate = e.submittedAt
    ? new Date(Number(e.submittedAt) / 1000000).toLocaleDateString("en-IN")
    : "\u2014";

  const docList: Array<{ key: string; label: string }> = [
    { key: "class10Cert", label: "Class 10th Certificate" },
    { key: "class12Cert", label: "Class 12th Certificate" },
    { key: "diploma", label: "Diploma Certificate" },
    { key: "bachelor", label: "Bachelor's Degree" },
    { key: "master", label: "Master's Degree" },
    { key: "experienceCert", label: "Experience Certificate" },
    { key: "leavingLetter", label: "Leaving Letter" },
    { key: "salarySlip1", label: "Salary Slip - Month 1" },
    { key: "salarySlip2", label: "Salary Slip - Month 2" },
    { key: "salarySlip3", label: "Salary Slip - Month 3" },
    { key: "cancelledCheque", label: "Cancelled Cheque / Bank Statement" },
    { key: "aadhaarCard", label: "Aadhaar Card" },
    { key: "panCard", label: "PAN Card" },
  ];

  const docPages = docList
    .map(({ key, label }) => {
      const img = docImgs[key];
      if (!img) return "";
      return `<div style="page-break-before:always;padding:20px;">
        <div style="background:#7B1C1C;color:white;padding:7px 12px;font-weight:700;font-size:13px;margin-bottom:12px;">${label}</div>
        <div style="text-align:center;"><img src="${img}" style="max-width:100%;max-height:700px;object-fit:contain;border:1px solid #d1d5db;" /></div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${e.fullName} - HR Induction Form</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, sans-serif; font-size: 13px; color: #1a1a1a; background: white; }
  @media print {
    .no-print { display: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<div style="background:#7B1C1C;color:white;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;">
  <div>
    <div style="font-size:22px;font-weight:800;letter-spacing:0.05em;">INFINEXY FINANCE</div>
    <div style="font-size:10px;margin-top:4px;color:#f0d0a0;">Email: infinexyfinance@gmail.com &nbsp;|&nbsp; Mo. 8460071353</div>
  </div>
  ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:55px;object-fit:contain;" />` : ""}
</div>

<div style="text-align:center;padding:16px;border-bottom:2px solid #7B1C1C;">
  <div style="font-size:18px;font-weight:800;color:#7B1C1C;letter-spacing:0.08em;">HR INDUCTION FORM</div>
  <div style="font-size:11px;color:#666;margin-top:4px;">Submitted: ${submittedDate}</div>
</div>

<div style="padding:20px;">

<div style="margin-bottom:18px;">
  <div style="background:#7B1C1C;color:white;padding:7px 12px;font-weight:700;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Personal Information</div>
  <div style="display:flex;gap:16px;margin-top:2px;">
    <div style="flex:1;">
      <table style="width:100%;border-collapse:collapse;">
        ${row("Full Name", e.fullName)}
        ${row("Date of Birth", e.dateOfBirth)}
        ${row("Gender", e.gender)}
        ${row("Phone Number", e.phone)}
        ${row("Alternate Phone", e.alternatePhone)}
        ${row("Email", e.email)}
        ${row("Full Address", e.fullAddress)}
        ${row("Date of Joining", extras.dateOfJoining)}
        ${row("Date of Leaving", extras.dateOfLeaving)}
      </table>
    </div>
    ${passportDataUrl ? `<div style="width:110px;flex-shrink:0;"><img src="${passportDataUrl}" style="width:110px;height:140px;object-fit:cover;border:1px solid #d1d5db;" /></div>` : "<div style='width:110px;flex-shrink:0;border:1px dashed #ccc;height:140px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#999;'>No Photo</div>"}
  </div>
</div>

${section(
  "Work Profile Details",
  row("Post Applying For", e.postApplying) +
    row("Types of Calling", (e.typesOfCalling || []).join(", ")) +
    row("Has Experience", e.hasExperience ? "Yes" : "No") +
    row("Experience Details", e.experienceDetails),
)}

${section("Education Details", row("Education Level / Qualification", e.educationLevel))}

${section(
  "Bank & Payment Details",
  row("Bank Name", e.bankName) +
    row("Account Holder Name", e.accountHolderName) +
    row("Account Number", e.accountNumber) +
    row("IFSC Code", e.ifscCode) +
    row("UPI ID", e.upiId),
)}

${section("KYC Details", row("Aadhaar Number", e.aadhaarNumber) + row("PAN Number", e.panNumber))}

<div style="margin-bottom:18px;">
  <div style="background:#7B1C1C;color:white;padding:7px 12px;font-weight:700;font-size:13px;letter-spacing:0.05em;text-transform:uppercase;">Declaration</div>
  <div style="padding:10px;border:1px solid #d1d5db;font-size:12px;font-style:italic;">
    I hereby declare that the information provided above is true and correct to the best of my knowledge.
    I understand that providing false information may lead to termination of association with INFINEXY FINANCE.
  </div>
  <table style="width:100%;border-collapse:collapse;margin-top:2px;">${row("Date", e.declarationDate)}</table>
  ${signatureDataUrl ? `<div style="margin-top:8px;"><div style="font-size:11px;font-weight:600;margin-bottom:4px;">Signature:</div><img src="${signatureDataUrl}" style="height:60px;border:1px solid #d1d5db;padding:4px;" /></div>` : ""}
</div>

</div>

${docPages}

<div class="no-print" style="text-align:center;padding:20px;">
  <button onclick="window.print()" style="background:#7B1C1C;color:white;padding:10px 28px;border:none;border-radius:4px;font-size:14px;cursor:pointer;">Print / Save as PDF</button>
</div>

</body>
</html>`;
}
