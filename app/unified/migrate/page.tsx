import Link from "next/link";
import { Button } from "@/components/ui/button";
import DataMigrationPanel from "@/components/quotation/DataMigrationPanel";

export default function MigrationPage() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Button asChild variant="outline">
          <Link href="/unified">Back to Quotation System</Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Data Migration</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Import each existing browser-data export into the correct quote type before replacing the old deployments.
          </p>
        </div>
        <DataMigrationPanel />
      </div>
    </main>
  );
}
