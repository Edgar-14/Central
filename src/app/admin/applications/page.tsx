import { ApplicationsTable } from "@/components/admin/applications-table";
import type { Driver } from "@/lib/types";

// Mock data simulating a Firestore query for pending applications
const pendingApplications: Driver[] = [
  {
    uid: "driver123",
    personalInfo: {
      fullName: "Juan Pérez García",
      email: "juan.perez@example.com",
      phone: "55 1234 5678",
      address: "Av. Siempre Viva 123",
      curp: "PEGA880101HDFXXX",
      rfc: "PEGA880101XXX",
      nss: "12345678901",
    },
    vehicleInfo: { type: "Motocicleta", brand: "Italika FT150", plate: "XYZ-123" },
    legal: { contractVersion: "v1.2", signatureTimestamp: Date.now(), ipAddress: "192.168.1.1" },
    documents: {
      ineUrl: "https://placehold.co/600x400.png",
      licenseUrl: "https://placehold.co/600x400.png",
      insuranceUrl: "https://placehold.co/600x400.png",
      addressProofUrl: "https://placehold.co/600x400.png",
      taxIdUrl: "https://placehold.co/600x400.png",
      circulationCardUrl: "https://placehold.co/600x400.png",
    },
    wallet: { currentBalance: 0, debtLimit: -500 },
    proStatus: { level: "Bronce", points: 0 },
    operationalStatus: "pending_validation",
    shipdayId: null,
  },
  {
    uid: "driver456",
    personalInfo: {
      fullName: "Maria Rodriguez Lopez",
      email: "maria.r@example.com",
      phone: "55 8765 4321",
      address: "Calle Falsa 456",
      curp: "ROLM920510MDFXXX",
      rfc: "ROLM920510XXX",
      nss: "09876543210",
    },
    vehicleInfo: { type: "Automóvil", brand: "Nissan Versa", plate: "ABC-456" },
    legal: { contractVersion: "v1.2", signatureTimestamp: Date.now() - 86400000, ipAddress: "192.168.1.2" },
    documents: {
       ineUrl: "https://placehold.co/600x400.png",
      licenseUrl: "https://placehold.co/600x400.png",
      insuranceUrl: "https://placehold.co/600x400.png",
      addressProofUrl: "https://placehold.co/600x400.png",
      taxIdUrl: "https://placehold.co/600x400.png",
      circulationCardUrl: "https://placehold.co/600x400.png",
    },
    wallet: { currentBalance: 0, debtLimit: -500 },
    proStatus: { level: "Bronce", points: 0 },
    operationalStatus: "pending_validation",
    shipdayId: null,
  },
];


export default function AdminApplicationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Solicitudes Pendientes</h1>
        <p className="text-muted-foreground">Revisa, aprueba o rechaza las nuevas solicitudes de repartidores.</p>
      </div>
      <ApplicationsTable applications={pendingApplications} />
    </div>
  );
}
