import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CombinedSavedQuotes from "@/components/quotation/CombinedSavedQuotes";
import FolderManager from "@/components/quotation/FolderManager";

export default function UnifiedDashboard() {
  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-5xl space-y-8">
        <div>
          <p className="text-sm font-medium text-muted-foreground">North London Loft Rooms Ltd</p>
          <h1 className="text-4xl font-bold tracking-tight">Quotation System</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            One shared quotation engine for Loft and Extension work. Quote-specific products and saved data remain separate while common features are maintained once.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Extension</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Create, revise and export extension quotations.</p>
              <Button asChild className="w-full"><Link href="/unified/extension">Open Extension Quotes</Link></Button>
              <Button asChild variant="outline" className="w-full"><Link href="/unified/extension/admin">Extension Admin</Link></Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Loft</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">Create, revise and export loft quotations.</p>
              <Button asChild className="w-full"><Link href="/unified/loft">Open Loft Quotes</Link></Button>
              <Button asChild variant="outline" className="w-full"><Link href="/unified/loft/admin">Loft Admin</Link></Button>
            </CardContent>
          </Card>
        </div>

        <FolderManager />

        <CombinedSavedQuotes />

        <Card>
          <CardHeader><CardTitle>Existing Data</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Import exports from the current Loft and Extension apps into their new isolated storage namespaces.
            </p>
            <Button asChild variant="outline"><Link href="/unified/migrate">Migrate Existing Data</Link></Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
