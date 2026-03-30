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
    loadImageAsDataURL("/assets/uploads/infinexy-solution-logo.jpeg"),
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
  return `<tr>
    <td style="background:#f0f4ff;font-weight:600;width:38%;padding:8px 12px;border:1px solid #d0d8f0;font-size:12px;color:#1a2c6b;">${label}</td>
    <td style="padding:8px 12px;border:1px solid #d0d8f0;font-size:12px;color:#222;background:#fff;">${value || "&mdash;"}</td>
  </tr>`;
}

function section(title: string, rows: string): string {
  return `<div style="margin-bottom:20px;">
    <div style="background:linear-gradient(90deg,#1a2c6b 0%,#2a3f8f 100%);color:white;padding:8px 14px;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;border-left:4px solid #c9a84c;">${title}</div>
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
    : "&mdash;";

  const docList: Array<{ key: string; label: string }> = [
    { key: "class10Cert", label: "Class 10th Certificate" },
    { key: "class12Cert", label: "Class 12th Certificate" },
    { key: "diploma", label: "Diploma Certificate" },
    { key: "bachelor", label: "Bachelor's Degree" },
    { key: "master", label: "Master's Degree" },
    { key: "experienceCert", label: "Experience Certificate" },
    { key: "leavingLetter", label: "Relieving Letter" },
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
      return `<div style="page-break-before:always;padding:24px 28px;">
        <div style="display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #1a2c6b;padding-bottom:12px;margin-bottom:16px;">
          ${logoDataUrl ? `<img src="${logoDataUrl}" style="height:50px;object-fit:contain;" />` : `<div style="font-size:18px;font-weight:800;color:#1a2c6b;">INFINEXY SOLUTION</div>`}
          <div style="text-align:right;">
            <div style="font-size:10px;color:#666;">Employee: ${e.fullName}</div>
            <div style="font-size:10px;color:#666;">Document</div>
          </div>
        </div>
        <div style="background:linear-gradient(90deg,#1a2c6b 0%,#2a3f8f 100%);color:white;padding:8px 14px;font-weight:700;font-size:12px;margin-bottom:14px;letter-spacing:0.05em;border-left:4px solid #c9a84c;">${label}</div>
        <div style="text-align:center;"><img src="${img}" style="max-width:100%;max-height:680px;object-fit:contain;border:1px solid #d0d8f0;" /></div>
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
  body { font-family: 'Arial', sans-serif; font-size: 13px; color: #1a1a1a; background: white; }
  @media print {
    .no-print { display: none; }
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>

<!-- Corporate Header -->
<div style="background:#1a2c6b;padding:0;">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:16px 28px;">
    <div style="display:flex;align-items:center;gap:16px;">
      ${
        logoDataUrl
          ? `<img src="${logoDataUrl}" style="height:64px;object-fit:contain;background:white;padding:6px 10px;border-radius:4px;" />`
          : `<div style="font-size:26px;font-weight:900;color:white;letter-spacing:0.04em;">INFINEXY SOLUTION</div>`
      }
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;color:#c9a84c;letter-spacing:0.06em;text-transform:uppercase;margin-bottom:3px;">Human Resources Division</div>
      <div style="font-size:10px;color:#ccd6f6;">infinexyfinance@gmail.com</div>
      <div style="font-size:10px;color:#ccd6f6;">Mo. 8460071353</div>
    </div>
  </div>
  <div style="background:#c9a84c;height:3px;"></div>
</div>

<!-- Document Title Banner -->
<div style="background:#f7f9ff;border-bottom:1px solid #d0d8f0;padding:14px 28px;display:flex;justify-content:space-between;align-items:center;">
  <div>
    <div style="font-size:18px;font-weight:800;color:#1a2c6b;letter-spacing:0.08em;text-transform:uppercase;">HR Induction Form</div>
    <div style="font-size:11px;color:#888;margin-top:2px;">Official Employee Onboarding Record</div>
  </div>
  <div style="text-align:right;">
    <div style="font-size:10px;color:#666;">Date Submitted</div>
    <div style="font-size:13px;font-weight:700;color:#1a2c6b;">${submittedDate}</div>
  </div>
</div>

<!-- Body -->
<div style="padding:24px 28px;">

<!-- Personal Info Section -->
<div style="margin-bottom:20px;">
  <div style="background:linear-gradient(90deg,#1a2c6b 0%,#2a3f8f 100%);color:white;padding:8px 14px;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;border-left:4px solid #c9a84c;">Personal Information</div>
  <div style="display:flex;gap:16px;margin-top:1px;">
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
    ${
      passportDataUrl
        ? `<div style="width:120px;flex-shrink:0;">
           <img src="${passportDataUrl}" style="width:120px;height:150px;object-fit:cover;border:2px solid #1a2c6b;" />
           <div style="text-align:center;font-size:9px;color:#666;margin-top:4px;">Passport Photo</div>
         </div>`
        : `<div style="width:120px;flex-shrink:0;border:2px dashed #c9a84c;height:150px;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;text-align:center;">Passport<br/>Photo</div>`
    }
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

<!-- Declaration -->
<div style="margin-bottom:20px;">
  <div style="background:linear-gradient(90deg,#1a2c6b 0%,#2a3f8f 100%);color:white;padding:8px 14px;font-weight:700;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;border-left:4px solid #c9a84c;">Declaration</div>
  <div style="padding:12px 14px;border:1px solid #d0d8f0;font-size:12px;font-style:italic;background:#f7f9ff;color:#333;line-height:1.6;">
    I hereby declare that the information provided above is true and correct to the best of my knowledge.
    I understand that providing false information may lead to termination of association with INFINEXY SOLUTION.
  </div>
  <table style="width:100%;border-collapse:collapse;">${row("Declaration Date", e.declarationDate)}</table>
  ${
    signatureDataUrl
      ? `<div style="margin-top:10px;padding:10px 14px;border:1px solid #d0d8f0;background:#f7f9ff;">
         <div style="font-size:11px;font-weight:700;color:#1a2c6b;margin-bottom:6px;letter-spacing:0.04em;">EMPLOYEE SIGNATURE</div>
         <img src="${signatureDataUrl}" style="height:65px;border:1px solid #d0d8f0;padding:4px;background:white;" />
       </div>`
      : ""
  }
</div>

<!-- Footer on main page -->
<div style="border-top:2px solid #1a2c6b;margin-top:10px;padding-top:10px;display:flex;justify-content:space-between;align-items:center;">
  <div style="font-size:9px;color:#888;">This is a confidential HR document. Unauthorized disclosure is prohibited.</div>
  <div style="font-size:9px;color:#888;">Infinexy Solution &copy; ${new Date().getFullYear()}</div>
</div>

</div>

${docPages}

<div class="no-print" style="text-align:center;padding:20px;background:#f7f9ff;border-top:1px solid #d0d8f0;">
  <button onclick="window.print()" style="background:#1a2c6b;color:white;padding:10px 32px;border:none;border-radius:4px;font-size:14px;font-weight:600;cursor:pointer;letter-spacing:0.04em;">Print / Save as PDF</button>
</div>

</body>
</html>`;
}
