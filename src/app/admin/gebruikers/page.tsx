import DeelnemersClient from "@/components/admin/DeelnemersClient";
import AccountsClient from "@/components/admin/AccountsClient";

export default function DeelnemersPage() {
  return (
    <div className="space-y-6">
      <DeelnemersClient />
      <AccountsClient />
    </div>
  );
}
