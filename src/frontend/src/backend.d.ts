import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type Time = bigint;
export interface EmployeeRecord {
    id: string;
    diplomaFileId?: string;
    status: EmployeeStatus;
    signatureFileId?: string;
    experienceDetails?: string;
    ifscCode: string;
    salarySlip1FileId?: string;
    typesOfCalling: Array<string>;
    dateOfBirth: string;
    class10CertFileId?: string;
    class12CertFileId?: string;
    alternatePhone?: string;
    accountHolderName: string;
    salarySlip2FileId?: string;
    fullName: string;
    submittedAt: Time;
    email: string;
    bankName: string;
    passportPhotoFileId?: string;
    panCardFileId?: string;
    salarySlip3FileId?: string;
    leavingLetterFileId?: string;
    hasExperience: boolean;
    masterFileId?: string;
    postApplying: string;
    gender: string;
    bachelorFileId?: string;
    upiId: string;
    panNumber: string;
    cancelledChequeFileId?: string;
    accountNumber: string;
    aadhaarNumber: string;
    phone: string;
    fullAddress: string;
    aadhaarCardFileId?: string;
    educationLevel: string;
    experienceCertificateFileId?: string;
    declarationDate: string;
}
export enum EmployeeStatus {
    active = "active",
    pending = "pending",
    inactive = "inactive"
}
export interface backendInterface {
    changeAdminPassword(oldHash: string, newHash: string): Promise<boolean>;
    deleteEmployeeRecord(id: string): Promise<void>;
    getAcceptanceLetter(employeeId: string): Promise<string | null>;
    getAllAcceptanceLetters(): Promise<Array<[string, string]>>;
    getAllEmployeeRecords(): Promise<Array<EmployeeRecord>>;
    getDocumentBlob(id: string): Promise<Uint8Array | null>;
    getEmployeeCountByStatus(status: string): Promise<bigint>;
    getEmployeeRecord(id: string): Promise<EmployeeRecord | null>;
    getEmployeeRecordsByIdPattern(pattern: string): Promise<Array<EmployeeRecord>>;
    getEmployeeRecordsByStatus(status: EmployeeStatus): Promise<Array<EmployeeRecord>>;
    getEmployeeRecordsByStatusSorted(status: EmployeeStatus): Promise<Array<EmployeeRecord>>;
    recordAcceptanceLetter(employeeId: string, acceptedDate: string): Promise<void>;
    storeDocument(data: Uint8Array, fileName: string): Promise<string>;
    submitEmployeeRecord(record: EmployeeRecord): Promise<string>;
    updateEmployeeRecord(id: string, updatedRecord: EmployeeRecord): Promise<EmployeeRecord>;
    verifyAdminLogin(username: string, passwordHash: string): Promise<boolean>;
}
