import InstellingenClient from "@/components/admin/InstellingenClient";
import PuntensysteemClient from "@/components/admin/PuntensysteemClient";
import BonusvragenClient from "@/components/admin/BonusvragenClient";
import SeizoenenClient from "@/components/admin/SeizoenenClient";

export default function InstellingenPage() {
  return (
    <div className="space-y-4">
      <SeizoenenClient />
      <InstellingenClient />
      <PuntensysteemClient />
      <BonusvragenClient />
    </div>
  );
}
