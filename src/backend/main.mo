import Map "mo:core/Map";
import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Storage "blob-storage/Storage";
import MixinStorage "blob-storage/Mixin";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
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

  type UserProfile = {
    name : Text;
  };

  // Stable backing storage to survive canister upgrades
  stable var stableEmployeeRecords : [(Text, EmployeeRecord)] = [];
  stable var stableDocumentStore : [(Text, Blob)] = [];
  stable var stableDocumentNames : [(Text, Text)] = [];
  stable var stableAcceptanceLetters : [(Text, Text)] = [];
  stable var stableDocumentIdCounter : Nat = 0;

  let employeeRecords = Map.empty<Text, EmployeeRecord>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let documentStore = Map.empty<Text, Blob>();
  let documentNames = Map.empty<Text, Text>();
  var documentIdCounter : Nat = stableDocumentIdCounter;

  // Admin credentials stored in canister for multi-device login.
  // Default password hash is btoa("admin123") = "YWRtaW4xMjM=" (computed on the frontend)
  stable var adminUsername : Text = "admin";
  stable var adminPasswordHash : Text = "YWRtaW4xMjM=";

  let acceptanceLetters = Map.empty<Text, Text>(); // key: employeeId, value: acceptedDate

  // Restore data from stable storage on canister startup
  do {
    for ((k, v) in stableEmployeeRecords.vals()) {
      employeeRecords.add(k, v);
    };
    for ((k, v) in stableDocumentStore.vals()) {
      documentStore.add(k, v);
    };
    for ((k, v) in stableDocumentNames.vals()) {
      documentNames.add(k, v);
    };
    for ((k, v) in stableAcceptanceLetters.vals()) {
      acceptanceLetters.add(k, v);
    };
  };

  // Persist all in-memory data to stable storage before upgrade
  system func preupgrade() {
    stableEmployeeRecords := employeeRecords.entries().toArray();
    stableDocumentStore := documentStore.entries().toArray();
    stableDocumentNames := documentNames.entries().toArray();
    stableAcceptanceLetters := acceptanceLetters.entries().toArray();
    stableDocumentIdCounter := documentIdCounter;
  };

  // Clear stable arrays after upgrade to free memory (data is back in Maps)
  system func postupgrade() {
    stableEmployeeRecords := [];
    stableDocumentStore := [];
    stableDocumentNames := [];
    stableAcceptanceLetters := [];
  };

  // Verify admin login - callable from any device
  public query func verifyAdminLogin(username : Text, passwordHash : Text) : async Bool {
    username == adminUsername and passwordHash == adminPasswordHash;
  };

  // Change admin password - stores new credentials in canister
  public shared func changeAdminPassword(oldHash : Text, newHash : Text) : async Bool {
    if (oldHash != adminPasswordHash) {
      return false;
    };
    adminPasswordHash := newHash;
    true;
  };

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

  // Open to all - employees don't need to log in
  public shared func submitEmployeeRecord(record : EmployeeRecord) : async Text {
    // Upsert: allow resubmission on retry
    employeeRecords.add(record.id, record);
    record.id;
  };

  // No principal auth - admin auth is handled via frontend username/password session
  public query func getEmployeeRecord(id : Text) : async ?EmployeeRecord {
    employeeRecords.get(id);
  };

  public query func getAllEmployeeRecords() : async [EmployeeRecord] {
    employeeRecords.values().toArray();
  };

  public query func getEmployeeRecordsByStatus(status : EmployeeStatus) : async [EmployeeRecord] {
    employeeRecords.values().toArray().filter(
      func(record) { record.status == status }
    );
  };

  public query func getEmployeeRecordsByStatusSorted(status : EmployeeStatus) : async [EmployeeRecord] {
    employeeRecords.values().toArray().filter(
      func(record) { record.status == status }
    ).sort(
      func(record1, record2) {
        switch (record1.status, record2.status) {
          case (#pending, #pending) { #equal };
          case (#pending, _) { #less };
          case (#active, #pending) { #greater };
          case (#active, #active) { #equal };
          case (#active, #inactive) { #less };
          case (#inactive, #inactive) { #equal };
          case (#inactive, _) { #greater };
        };
      }
    );
  };

  public shared func updateEmployeeRecord(id : Text, updatedRecord : EmployeeRecord) : async EmployeeRecord {
    switch (employeeRecords.get(id)) {
      case (null) { Runtime.trap("Employee record not found") };
      case (?_) {
        employeeRecords.add(id, updatedRecord);
        updatedRecord;
      };
    };
  };

  public shared func deleteEmployeeRecord(id : Text) : async () {
    if (not employeeRecords.containsKey(id)) {
      Runtime.trap("Employee record not found");
    };
    employeeRecords.remove(id);
  };

  public shared func getEmployeeCountByStatus(status : Text) : async Nat {
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

  public shared func getEmployeeRecordsByIdPattern(pattern : Text) : async [EmployeeRecord] {
    employeeRecords.entries().toArray().filter(
      func((id, _)) { id.contains(#text pattern) }
    ).map(func((_, record)) { record });
  };

  // Open to all - employees don't need to log in to upload documents
  public shared func storeDocument(data : Blob, fileName : Text) : async Text {
    let id = "doc_" # documentIdCounter.toText();
    documentStore.add(id, data);
    documentNames.add(id, fileName);
    documentIdCounter += 1;
    id;
  };

  public query func getDocumentBlob(id : Text) : async ?Blob {
    documentStore.get(id);
  };

  // Acceptance letter functions
  public shared func recordAcceptanceLetter(employeeId : Text, acceptedDate : Text) : async () {
    acceptanceLetters.add(employeeId, acceptedDate);
  };

  public query func getAcceptanceLetter(employeeId : Text) : async ?Text {
    acceptanceLetters.get(employeeId);
  };

  public query func getAllAcceptanceLetters() : async [(Text, Text)] {
    acceptanceLetters.entries().toArray();
  };
};
