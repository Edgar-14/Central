

import type { Timestamp } from 'firebase/firestore';

export interface PersonalInfo {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    curp: string;
    rfc: string;
    nss: string;
}

export interface VehicleInfo {
    type: 'Motocicleta' | 'Automóvil';
    brand: string;
    plate: string;
}

export interface LegalInfo {
    contractVersion: string;
    signatureTimestamp: number;
    ipAddress: string;
}

export interface DocumentInfo {
    ineUrl?: string;
    licenseUrl?: string;
    insuranceUrl?: string;
    addressProofUrl?: string;
    taxIdUrl?: string;
    circulationCardUrl?: string;
    trainingEvidenceUrl?: string;
}

export interface Wallet {
    currentBalance: number;
    debtLimit: number;
}

export interface ProStatus {
    level: 'Bronce' | 'Plata' | 'Oro' | 'Diamante';
    points: number;
}

export interface Driver {
  uid: string;
  email: string; // The document ID
  fullName: string;
  phone: string;
  personalInfo: Partial<PersonalInfo>;
  vehicleInfo: Partial<VehicleInfo>;
  legal: Partial<LegalInfo>;
  documents: Partial<DocumentInfo>;
  wallet: Wallet;
  proStatus: ProStatus;
  applicationStatus: string;
  operationalStatus: 'uninitialized' | 'pending_validation' | 'active' | 'restricted_debt' | 'suspended' | 'rejected' | 'approved';
  shipdayId: string | number | null;
  createdAt: Timestamp;
  applicationSubmittedAt?: Timestamp;
  approvedAt?: Timestamp;
}

export interface Transaction {
  id: string;
  date: Timestamp; // Using Firestore Timestamp
  type: 'credit_delivery' | 'debit_commission' | 'payout' | 'credit_tip';
  amount: number;
  orderId?: string;
  description: string;
}
