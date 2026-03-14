import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the access control system
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type EmployeeStatus = {
    #pending;
    #active;
    #inactive;
  };

  module EmployeeStatus {
    public func compare(status1 : EmployeeStatus, status2 : EmployeeStatus) : Order.Order {
      switch (status1, status2) {
        case (#pending, #pending) { #equal };
        case (#pending, _) { #less };
        case (#active, #pending) { #greater };
        case (#active, #active) { #equal };
        case (#active, #inactive) { #less };
        case (#inactive, #inactive) { #equal };
        case (#inactive, _) { #greater };
      };
    };
  };

  type EmployeeRecord = {
    id : Text;
    fullName : Text;
    dateOfBirth : Text;
    gender : Text;
    phone : Text;
    alternatePhone : ?Text;
    email : Text;
    fullAddress : Text;
    postApplying : Text;
    typesOfCalling : [Text];
    hasExperience : Bool;
    experienceDetails : ?Text;
    educationLevel : Text;
    bankName : Text;
    accountHolderName : Text;
    accountNumber : Text;
    ifscCode : Text;
    upiId : Text;
    aadhaarNumber : Text;
    panNumber : Text;
    declarationDate : Text;
    signatureFileId : ?Text;
    experienceCertificateFileId : ?Text;
    leavingLetterFileId : ?Text;
    salarySlip1FileId : ?Text;
    salarySlip2FileId : ?Text;
    salarySlip3FileId : ?Text;
    class10CertFileId : ?Text;
    class12CertFileId : ?Text;
    diplomaFileId : ?Text;
    bachelorFileId : ?Text;
    masterFileId : ?Text;
    cancelledChequeFileId : ?Text;
    aadhaarCardFileId : ?Text;
    panCardFileId : ?Text;
    passportPhotoFileId : ?Text;
    submittedAt : Time.Time;
    status : EmployeeStatus;
  };

  module EmployeeRecord {
    public func compareByStatus(record1 : EmployeeRecord, record2 : EmployeeRecord) : Order.Order {
      EmployeeStatus.compare(record1.status, record2.status);
    };
  };

  public type UserProfile = {
    name : Text;
  };

  let employeeRecords = Map.empty<Text, EmployeeRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();

  // User profile functions required by the instructions
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Public endpoint - no authentication required as per specification
  public shared ({ caller }) func submitEmployeeRecord(record : EmployeeRecord) : async Text {
    if (employeeRecords.containsKey(record.id)) {
      Runtime.trap("Employee record with this ID already exists");
    };

    employeeRecords.add(record.id, record);
    record.id;
  };

  // Admin-only endpoint
  public query ({ caller }) func getEmployeeRecord(id : Text) : async ?EmployeeRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view employee records");
    };
    employeeRecords.get(id);
  };

  // Admin-only endpoint
  public query ({ caller }) func getAllEmployeeRecords() : async [EmployeeRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view employee records");
    };
    employeeRecords.values().toArray();
  };

  // Admin-only endpoint
  public query ({ caller }) func getEmployeeRecordsByStatus(status : EmployeeStatus) : async [EmployeeRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view employee records");
    };
    employeeRecords.values().toArray().filter(
      func(record) { record.status == status }
    );
  };

  // Admin-only endpoint
  public query ({ caller }) func getEmployeeRecordsByStatusSorted(status : EmployeeStatus) : async [EmployeeRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view employee records");
    };
    employeeRecords.values().toArray().filter(
      func(record) { record.status == status }
    ).sort(
      EmployeeRecord.compareByStatus
    );
  };

  // Admin-only endpoint
  public shared ({ caller }) func updateEmployeeRecord(id : Text, updatedRecord : EmployeeRecord) : async EmployeeRecord {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update employee records");
    };
    switch (employeeRecords.get(id)) {
      case (null) { Runtime.trap("Employee record not found") };
      case (?_) {
        employeeRecords.add(id, updatedRecord);
        updatedRecord;
      };
    };
  };

  // Admin-only endpoint
  public shared ({ caller }) func deleteEmployeeRecord(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete employee records");
    };
    if (not employeeRecords.containsKey(id)) {
      Runtime.trap("Employee record not found");
    };
    employeeRecords.remove(id);
  };

  // Admin-only endpoint
  public shared ({ caller }) func getEmployeeCountByStatus(status : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view employee statistics");
    };
    let statusEnum : EmployeeStatus =
      switch (status) {
      case ("pending") { #pending };
      case ("active") { #active };
      case ("inactive") { #inactive };
      case (_) { Runtime.trap("Invalid status") };
    };

    employeeRecords.values().toArray().filter(
      func(record) { record.status == statusEnum }
    ).size();
  };

  // Admin-only endpoint
  public shared ({ caller }) func getEmployeeRecordsByIdPattern(pattern : Text) : async [EmployeeRecord] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can search employee records");
    };
    employeeRecords.entries().toArray().filter(
      func((id, _)) { id.contains(#text pattern) }
    ).map(func((_, record)) { record });
  };
};
