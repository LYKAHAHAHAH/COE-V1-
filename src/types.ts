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

export interface IssuedCOE {
  id: string;
  data: CertificateData;
  assets: CertificateAssets;
  dateIssued: string; // ISO string or Date string
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
  logo1: "https://picsum.photos/seed/doh/200/200",
  logo2: "https://picsum.photos/seed/dswd/200/200",
  logo3: "https://picsum.photos/seed/pcso/200/200",
  logo4: "https://picsum.photos/seed/philhealth/300/100",
};
