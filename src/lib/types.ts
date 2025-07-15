
import type { Timestamp } from 'firebase/firestore';

export interface Driver {
  uid: string;
  fullName: string;
  email: string;
  phone: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
    address: string;
    curp: string;
    rfc: string;
    nss: string;
  };
  vehicleInfo: {
    type: 'Motocicleta' | 'Automóvil';
    brand: string;
    plate: string;
  };
  legal: {
    contractVersion: string;
    signatureTimestamp: number;
    ipAddress: string;
  };
  documents: {
    ineUrl: string;
    licenseUrl: string;
    insuranceUrl: string;
    addressProofUrl: string;
    taxIdUrl: string;
    circulationCardUrl: string;
  };
  wallet: {
    currentBalance: number;
    debtLimit: number;
  };
  proStatus: {
    level: 'Bronce' | 'Plata' | 'Oro' | 'Diamante';
    points: number;
  };
  applicationStatus: string;
  applicationSubmittedAt?: Timestamp;
  operationalStatus: 'uninitialized' | 'pending_validation' | 'active' | 'restricted_debt' | 'suspended' | 'rejected';
  shipdayId: string | null;
}

export interface Transaction {
  id: string;
  date: number; // timestamp
  type: 'credit_delivery' | 'debit_commission' | 'payout';
  amount: number;
  orderId: string;
  description: string;
}
