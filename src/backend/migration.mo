import Map "mo:core/Map";

module {

  type OldActor = {
    // Fields still present in new actor (must be in migration input)
    var stableEmployeeRecords : [(Text, {
      aadhaarCardFileId : ?Text;
      aadhaarNumber : Text;
      accountHolderName : Text;
      accountNumber : Text;
      alternatePhone : ?Text;
      bachelorFileId : ?Text;
      bankName : Text;
      cancelledChequeFileId : ?Text;
      class10CertFileId : ?Text;
      class12CertFileId : ?Text;
      dateOfBirth : Text;
      declarationDate : Text;
      diplomaFileId : ?Text;
      educationLevel : Text;
      email : Text;
      experienceCertificateFileId : ?Text;
      experienceDetails : ?Text;
      fullAddress : Text;
      fullName : Text;
      gender : Text;
      hasExperience : Bool;
      id : Text;
      ifscCode : Text;
      leavingLetterFileId : ?Text;
      masterFileId : ?Text;
      panCardFileId : ?Text;
      panNumber : Text;
      passportPhotoFileId : ?Text;
      phone : Text;
      postApplying : Text;
      salarySlip1FileId : ?Text;
      salarySlip2FileId : ?Text;
      salarySlip3FileId : ?Text;
      signatureFileId : ?Text;
      status : { #active; #inactive; #pending };
      submittedAt : Int;
      typesOfCalling : [Text];
      upiId : Text;
    })];
    var stableDocumentStore : [(Text, Blob)];
    var stableDocumentNames : [(Text, Text)];
    var stableAcceptanceLetters : [(Text, Text)];
    var stableDocumentIdCounter : Nat;
    var adminUsername : Text;
    var adminPasswordHash : Text;
  };

  // New stable state: same fields minus accessControlState and userProfiles
  type NewActor = {
    var stableEmployeeRecords : [(Text, {
      aadhaarCardFileId : ?Text;
      aadhaarNumber : Text;
      accountHolderName : Text;
      accountNumber : Text;
      alternatePhone : ?Text;
      bachelorFileId : ?Text;
      bankName : Text;
      cancelledChequeFileId : ?Text;
      class10CertFileId : ?Text;
      class12CertFileId : ?Text;
      dateOfBirth : Text;
      declarationDate : Text;
      diplomaFileId : ?Text;
      educationLevel : Text;
      email : Text;
      experienceCertificateFileId : ?Text;
      experienceDetails : ?Text;
      fullAddress : Text;
      fullName : Text;
      gender : Text;
      hasExperience : Bool;
      id : Text;
      ifscCode : Text;
      leavingLetterFileId : ?Text;
      masterFileId : ?Text;
      panCardFileId : ?Text;
      panNumber : Text;
      passportPhotoFileId : ?Text;
      phone : Text;
      postApplying : Text;
      salarySlip1FileId : ?Text;
      salarySlip2FileId : ?Text;
      salarySlip3FileId : ?Text;
      signatureFileId : ?Text;
      status : { #active; #inactive; #pending };
      submittedAt : Int;
      typesOfCalling : [Text];
      upiId : Text;
    })];
    var stableDocumentStore : [(Text, Blob)];
    var stableDocumentNames : [(Text, Text)];
    var stableAcceptanceLetters : [(Text, Text)];
    var stableDocumentIdCounter : Nat;
    var adminUsername : Text;
    var adminPasswordHash : Text;
  };

  public func run(old : OldActor) : NewActor {
    // Drop accessControlState and userProfiles; carry forward all other stable fields
    {
      var stableEmployeeRecords = old.stableEmployeeRecords;
      var stableDocumentStore = old.stableDocumentStore;
      var stableDocumentNames = old.stableDocumentNames;
      var stableAcceptanceLetters = old.stableAcceptanceLetters;
      var stableDocumentIdCounter = old.stableDocumentIdCounter;
      var adminUsername = old.adminUsername;
      var adminPasswordHash = old.adminPasswordHash;
    };
  };
};
