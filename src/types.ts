export interface CertificateData {
  patientName: string;
  address: string;
  classification: string;
  assistanceType: string;
  issuanceDate: string;
  agencyName: string;
  signatoryName: string;
  signatoryTitle: string;
  licenseNo: string;
}

export interface LogoAsset {
  src: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CertificateAssets {
  signature: string | null;
  logos: {
    logo1: LogoAsset;
    logo2: LogoAsset;
    logo3: LogoAsset;
    logo4: LogoAsset;
  };
}

export const DEFAULT_AGENCY = "REGION II TRAUMA AND MEDICAL CENTER";
export const DEFAULT_SIGNATORY = "CHARMAINE MARIE A. CASTILLO, RSW, RN";
export const DEFAULT_SIGNATORY_TITLE = "Signature over Name of the Head of the Medical Social Worker Department";
export const DEFAULT_LICENSE = "License No. 0009575/0547558";

export const DEFAULT_LOGOS = {
  logo1: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Department_of_Health_PH.svg/1200px-Department_of_Health_PH.svg.png",
  logo2: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Department_of_Social_Welfare_and_Development_%28DSWD%29.svg/1200px-Department_of_Social_Welfare_and_Development_%28DSWD%29.svg.png",
  logo3: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Philippine_Charity_Sweepstakes_Office_%28PCSO%29.svg/1200px-Philippine_Charity_Sweepstakes_Office_%28PCSO%29.svg.png",
  logo4: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/PhilHealth_logo.svg/1200px-PhilHealth_logo.svg.png",
};
