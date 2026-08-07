import PuntensysteemClient from "@/components/admin/PuntensysteemClient";
import BonusvragenClient from "@/components/admin/BonusvragenClient";

export default function PuntensysteemPage() {
  return (
    <div className="space-y-4">
      <PuntensysteemClient />
      <BonusvragenClient />
    </div>
  );
}
