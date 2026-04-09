/**
 * config.ts
 *
 * Creates a properly typed backend actor using HttpAgent + Actor.createActor
 * with a manually-defined IDL matching the Motoko backend.
 *
 * This bypasses the empty generated IDL factory (declarations/backend.did.js)
 * which has no method definitions until pnpm bindgen is re-run.
 */

import { Actor, HttpAgent } from "@icp-sdk/core/agent";
import { IDL } from "@icp-sdk/core/candid";

// ---- Candid IDL matching Motoko backend ----

const StatusVariant = IDL.Variant({
  pending: IDL.Null,
  active: IDL.Null,
  inactive: IDL.Null,
});

const EmployeeRecordIDL = IDL.Record({
  id: IDL.Text,
  fullName: IDL.Text,
  dateOfBirth: IDL.Text,
  gender: IDL.Text,
  phone: IDL.Text,
  alternatePhone: IDL.Opt(IDL.Text),
  email: IDL.Text,
  fullAddress: IDL.Text,
  postApplying: IDL.Text,
  typesOfCalling: IDL.Vec(IDL.Text),
  hasExperience: IDL.Bool,
  experienceDetails: IDL.Opt(IDL.Text),
  educationLevel: IDL.Text,
  bankName: IDL.Text,
  accountHolderName: IDL.Text,
  accountNumber: IDL.Text,
  ifscCode: IDL.Text,
  upiId: IDL.Text,
  aadhaarNumber: IDL.Text,
  panNumber: IDL.Text,
  declarationDate: IDL.Text,
  signatureFileId: IDL.Opt(IDL.Text),
  experienceCertificateFileId: IDL.Opt(IDL.Text),
  leavingLetterFileId: IDL.Opt(IDL.Text),
  salarySlip1FileId: IDL.Opt(IDL.Text),
  salarySlip2FileId: IDL.Opt(IDL.Text),
  salarySlip3FileId: IDL.Opt(IDL.Text),
  class10CertFileId: IDL.Opt(IDL.Text),
  class12CertFileId: IDL.Opt(IDL.Text),
  diplomaFileId: IDL.Opt(IDL.Text),
  bachelorFileId: IDL.Opt(IDL.Text),
  masterFileId: IDL.Opt(IDL.Text),
  cancelledChequeFileId: IDL.Opt(IDL.Text),
  aadhaarCardFileId: IDL.Opt(IDL.Text),
  panCardFileId: IDL.Opt(IDL.Text),
  passportPhotoFileId: IDL.Opt(IDL.Text),
  submittedAt: IDL.Int,
  status: StatusVariant,
});

const backendIDL = IDL.Service({
  // Admin auth
  verifyAdminLogin: IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], ["query"]),
  changeAdminPassword: IDL.Func([IDL.Text, IDL.Text], [IDL.Bool], []),

  // Employee records
  submitEmployeeRecord: IDL.Func([EmployeeRecordIDL], [IDL.Text], []),
  getEmployeeRecord: IDL.Func([IDL.Text], [IDL.Opt(EmployeeRecordIDL)], ["query"]),
  getAllEmployeeRecords: IDL.Func([], [IDL.Vec(EmployeeRecordIDL)], ["query"]),
  updateEmployeeRecord: IDL.Func([IDL.Text, EmployeeRecordIDL], [EmployeeRecordIDL], []),
  deleteEmployeeRecord: IDL.Func([IDL.Text], [], []),

  // Document storage
  storeDocument: IDL.Func([IDL.Vec(IDL.Nat8), IDL.Text], [IDL.Text], []),
  getDocumentBlob: IDL.Func([IDL.Text], [IDL.Opt(IDL.Vec(IDL.Nat8))], ["query"]),

  // Acceptance letters
  recordAcceptanceLetter: IDL.Func([IDL.Text, IDL.Text], [], []),
  getAcceptanceLetter: IDL.Func([IDL.Text], [IDL.Opt(IDL.Text)], ["query"]),
  getAllAcceptanceLetters: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Text, IDL.Text))], ["query"]),
});

// ---- EmployeeStatus: Candid variant encoding ----
// Motoko #pending/#active/#inactive variants serialize as { pending: null } etc.
// These are used both for encoding (sending to canister) and as display keys.
export const EmployeeStatus = {
  pending: "pending",
  active: "active",
  inactive: "inactive",
} as const;

export type EmployeeStatus = (typeof EmployeeStatus)[keyof typeof EmployeeStatus];

// Raw Candid variant type returned from the canister
export type CandidStatus = { pending: null } | { active: null } | { inactive: null };

/** Extract string key from a Candid variant status object */
export function statusKey(status: CandidStatus): EmployeeStatus {
  if ("pending" in status) return "pending";
  if ("active" in status) return "active";
  return "inactive";
}

/** Convert a string status to Candid variant for sending to canister */
export function statusToCandid(status: EmployeeStatus): CandidStatus {
  if (status === "active") return { active: null };
  if (status === "inactive") return { inactive: null };
  return { pending: null };
}

// ---- EmployeeRecord types ----
/** Raw record as returned from the canister (status is Candid variant) */
export interface EmployeeRecordRaw {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  alternatePhone: [] | [string];
  email: string;
  fullAddress: string;
  postApplying: string;
  typesOfCalling: string[];
  hasExperience: boolean;
  experienceDetails: [] | [string];
  educationLevel: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  aadhaarNumber: string;
  panNumber: string;
  declarationDate: string;
  signatureFileId: [] | [string];
  experienceCertificateFileId: [] | [string];
  leavingLetterFileId: [] | [string];
  salarySlip1FileId: [] | [string];
  salarySlip2FileId: [] | [string];
  salarySlip3FileId: [] | [string];
  class10CertFileId: [] | [string];
  class12CertFileId: [] | [string];
  diplomaFileId: [] | [string];
  bachelorFileId: [] | [string];
  masterFileId: [] | [string];
  cancelledChequeFileId: [] | [string];
  aadhaarCardFileId: [] | [string];
  panCardFileId: [] | [string];
  passportPhotoFileId: [] | [string];
  submittedAt: bigint;
  status: CandidStatus;
}

/** Normalized record used in the UI (optional fields unwrapped, status as string) */
export interface EmployeeRecord {
  id: string;
  fullName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  alternatePhone?: string;
  email: string;
  fullAddress: string;
  postApplying: string;
  typesOfCalling: string[];
  hasExperience: boolean;
  experienceDetails?: string;
  educationLevel: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  aadhaarNumber: string;
  panNumber: string;
  declarationDate: string;
  signatureFileId?: string;
  experienceCertificateFileId?: string;
  leavingLetterFileId?: string;
  salarySlip1FileId?: string;
  salarySlip2FileId?: string;
  salarySlip3FileId?: string;
  class10CertFileId?: string;
  class12CertFileId?: string;
  diplomaFileId?: string;
  bachelorFileId?: string;
  masterFileId?: string;
  cancelledChequeFileId?: string;
  aadhaarCardFileId?: string;
  panCardFileId?: string;
  passportPhotoFileId?: string;
  submittedAt: bigint;
  status: EmployeeStatus;
}

function opt<T>(val: [] | [T]): T | undefined {
  return val.length > 0 ? val[0] : undefined;
}

function optArr<T>(val: T | undefined): [] | [T] {
  return val !== undefined && val !== null ? [val] : [];
}

/** Convert a raw canister record to a normalized UI record */
export function normalizeRecord(raw: EmployeeRecordRaw): EmployeeRecord {
  return {
    id: raw.id,
    fullName: raw.fullName,
    dateOfBirth: raw.dateOfBirth,
    gender: raw.gender,
    phone: raw.phone,
    alternatePhone: opt(raw.alternatePhone),
    email: raw.email,
    fullAddress: raw.fullAddress,
    postApplying: raw.postApplying,
    typesOfCalling: raw.typesOfCalling,
    hasExperience: raw.hasExperience,
    experienceDetails: opt(raw.experienceDetails),
    educationLevel: raw.educationLevel,
    bankName: raw.bankName,
    accountHolderName: raw.accountHolderName,
    accountNumber: raw.accountNumber,
    ifscCode: raw.ifscCode,
    upiId: raw.upiId,
    aadhaarNumber: raw.aadhaarNumber,
    panNumber: raw.panNumber,
    declarationDate: raw.declarationDate,
    signatureFileId: opt(raw.signatureFileId),
    experienceCertificateFileId: opt(raw.experienceCertificateFileId),
    leavingLetterFileId: opt(raw.leavingLetterFileId),
    salarySlip1FileId: opt(raw.salarySlip1FileId),
    salarySlip2FileId: opt(raw.salarySlip2FileId),
    salarySlip3FileId: opt(raw.salarySlip3FileId),
    class10CertFileId: opt(raw.class10CertFileId),
    class12CertFileId: opt(raw.class12CertFileId),
    diplomaFileId: opt(raw.diplomaFileId),
    bachelorFileId: opt(raw.bachelorFileId),
    masterFileId: opt(raw.masterFileId),
    cancelledChequeFileId: opt(raw.cancelledChequeFileId),
    aadhaarCardFileId: opt(raw.aadhaarCardFileId),
    panCardFileId: opt(raw.panCardFileId),
    passportPhotoFileId: opt(raw.passportPhotoFileId),
    submittedAt: raw.submittedAt,
    status: statusKey(raw.status),
  };
}

/** Convert a normalized UI record to Candid raw format for the canister */
export function denormalizeRecord(emp: EmployeeRecord): EmployeeRecordRaw {
  return {
    id: emp.id,
    fullName: emp.fullName,
    dateOfBirth: emp.dateOfBirth,
    gender: emp.gender,
    phone: emp.phone,
    alternatePhone: optArr(emp.alternatePhone),
    email: emp.email,
    fullAddress: emp.fullAddress,
    postApplying: emp.postApplying,
    typesOfCalling: emp.typesOfCalling,
    hasExperience: emp.hasExperience,
    experienceDetails: optArr(emp.experienceDetails),
    educationLevel: emp.educationLevel,
    bankName: emp.bankName,
    accountHolderName: emp.accountHolderName,
    accountNumber: emp.accountNumber,
    ifscCode: emp.ifscCode,
    upiId: emp.upiId,
    aadhaarNumber: emp.aadhaarNumber,
    panNumber: emp.panNumber,
    declarationDate: emp.declarationDate,
    signatureFileId: optArr(emp.signatureFileId),
    experienceCertificateFileId: optArr(emp.experienceCertificateFileId),
    leavingLetterFileId: optArr(emp.leavingLetterFileId),
    salarySlip1FileId: optArr(emp.salarySlip1FileId),
    salarySlip2FileId: optArr(emp.salarySlip2FileId),
    salarySlip3FileId: optArr(emp.salarySlip3FileId),
    class10CertFileId: optArr(emp.class10CertFileId),
    class12CertFileId: optArr(emp.class12CertFileId),
    diplomaFileId: optArr(emp.diplomaFileId),
    bachelorFileId: optArr(emp.bachelorFileId),
    masterFileId: optArr(emp.masterFileId),
    cancelledChequeFileId: optArr(emp.cancelledChequeFileId),
    aadhaarCardFileId: optArr(emp.aadhaarCardFileId),
    panCardFileId: optArr(emp.panCardFileId),
    passportPhotoFileId: optArr(emp.passportPhotoFileId),
    submittedAt: emp.submittedAt,
    status: statusToCandid(emp.status),
  };
}

// ---- Backend actor interface (uses raw Candid types) ----
export interface BackendActor {
  verifyAdminLogin(username: string, passwordHash: string): Promise<boolean>;
  changeAdminPassword(oldHash: string, newHash: string): Promise<boolean>;
  submitEmployeeRecord(record: EmployeeRecordRaw): Promise<string>;
  getEmployeeRecord(id: string): Promise<[] | [EmployeeRecordRaw]>;
  getAllEmployeeRecords(): Promise<EmployeeRecordRaw[]>;
  updateEmployeeRecord(id: string, record: EmployeeRecordRaw): Promise<EmployeeRecordRaw>;
  deleteEmployeeRecord(id: string): Promise<void>;
  storeDocument(data: Uint8Array, fileName: string): Promise<string>;
  getDocumentBlob(id: string): Promise<[] | [Uint8Array]>;
  recordAcceptanceLetter(employeeId: string, acceptedDate: string): Promise<void>;
  getAcceptanceLetter(employeeId: string): Promise<[] | [string]>;
  getAllAcceptanceLetters(): Promise<[string, string][]>;
}

// ---- Canister config loading ----
let configCache: { canisterId: string; host: string | undefined } | null = null;

async function loadCanisterConfig(): Promise<{
  canisterId: string;
  host: string | undefined;
}> {
  if (configCache) return configCache;

  const envCanisterId = process.env.CANISTER_ID_BACKEND;

  try {
    const base = (process.env.BASE_URL ?? "/").replace(/\/?$/, "/");
    const resp = await fetch(`${base}env.json`);
    const json = (await resp.json()) as {
      backend_canister_id?: string;
      backend_host?: string;
    };
    const canisterId =
      json.backend_canister_id && json.backend_canister_id !== "undefined"
        ? json.backend_canister_id
        : (envCanisterId ?? "");
    const host =
      json.backend_host && json.backend_host !== "undefined"
        ? json.backend_host
        : undefined;
    configCache = { canisterId, host };
    return configCache;
  } catch {
    configCache = { canisterId: envCanisterId ?? "", host: undefined };
    return configCache;
  }
}

// ---- Singleton actor ----
let actorSingleton: BackendActor | null = null;

export async function createActorWithConfig(): Promise<BackendActor> {
  if (actorSingleton) return actorSingleton;

  const { canisterId, host } = await loadCanisterConfig();

  if (!canisterId) {
    throw new Error(
      "CANISTER_ID_BACKEND is not configured. Cannot create actor.",
    );
  }

  const agent = new HttpAgent({ host });

  // Fetch root key on local replica (non-production)
  if (
    !host ||
    host.includes("localhost") ||
    host.includes("127.0.0.1")
  ) {
    try {
      await agent.fetchRootKey();
    } catch {
      // ignore — may fail if already fetched
    }
  }

  const actor = Actor.createActor<BackendActor>(() => backendIDL, {
    agent,
    canisterId,
  });

  actorSingleton = actor;
  return actor;
}
