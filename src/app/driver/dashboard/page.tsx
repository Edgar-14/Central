import { DriverWallet } from '@/components/driver/driver-wallet';
import type { Driver, Transaction } from '@/lib/types';

// Mock data for a driver
const mockDriver: Driver = {
  uid: "driver789",
  personalInfo: { fullName: "Carlos Sanchez", email: "carlos.s@example.com", phone: "", address: "", curp: "", rfc: "", nss: "" },
  vehicleInfo: { type: "Motocicleta", brand: "Honda CB190R", plate: "MNO-789" },
  legal: { contractVersion: "v1.2", signatureTimestamp: 0, ipAddress: "" },
  documents: { ineUrl: "", licenseUrl: "", insuranceUrl: "", addressProofUrl: "", taxIdUrl: "", circulationCardUrl: "" },
  wallet: { currentBalance: 1250.75, debtLimit: -500 },
  proStatus: { level: "Oro", points: 1250 },
  operationalStatus: "active",
  shipdayId: "shipday123",
};

// Mock data for transactions
const mockTransactions: Transaction[] = [
  { id: "txn1", date: Date.now() - 86400000 * 1, type: "credit_delivery", amount: 120.00, orderId: "ORD-001", description: "Entrega de comida" },
  { id: "txn2", date: Date.now() - 86400000 * 2, type: "credit_delivery", amount: 85.50, orderId: "ORD-002", description: "Entrega de paquetería" },
  { id: "txn3", date: Date.now() - 86400000 * 3, type: "debit_commission", amount: -12.00, orderId: "ORD-001", description: "Comisión de servicio" },
  { id: "txn4", date: Date.now() - 86400000 * 4, type: "credit_delivery", amount: 250.00, orderId: "ORD-003", description: "Entrega express" },
  { id: "txn5", date: Date.now() - 86400000 * 5, type: "payout", amount: -1500.00, orderId: "PAY-001", description: "Retiro a cuenta bancaria" },
];

export default function DriverDashboardPage() {
  return (
    <div className="space-y-6">
       <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Billetera</h1>
        <p className="text-muted-foreground">Consulta tu balance, historial de transacciones y nivel Pro.</p>
      </div>
      <DriverWallet driver={mockDriver} transactions={mockTransactions} />
    </div>
  );
}
