import InstellingenClient from "@/components/admin/InstellingenClient";
import PuntensysteemClient from "@/components/admin/PuntensysteemClient";
import BonusvragenClient from "@/components/admin/BonusvragenClient";

export default function InstellingenPage() {
  return (
    <div className="space-y-4">
      <InstellingenClient />
      <PuntensysteemClient />
      <BonusvragenClient />
    </div>
  );
}
