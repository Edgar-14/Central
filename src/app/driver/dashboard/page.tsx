import { DriverWallet } from "@/components/driver/driver-wallet";

export default function DriverDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi Billetera</h1>
        <p className="text-muted-foreground">
          Aquí puedes ver tu saldo, historial de transacciones y estatus Pro.
        </p>
      </div>
      <DriverWallet />
    </div>
  );
}
