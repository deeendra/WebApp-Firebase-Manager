"use client";

import { use } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { useCollectionData } from "@/hooks/useCollectionData";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataExplorer } from "@/components/collection/DataExplorer";
import { SchemaManager } from "@/components/collection/SchemaManager";
import { DatabaseIcon, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CollectionPage({ params }: { params: Promise<{ collectionName: string }> }) {
  const resolvedParams = use(params);
  const decodedName = decodeURIComponent(resolvedParams.collectionName);
  
  const { documents, schema, loading, error, refetch } = useCollectionData(decodedName);

  return (
    <AppLayout>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <DatabaseIcon className="h-6 w-6 text-primary" />
              {decodedName}
            </h1>
            <p className="text-muted-foreground mt-1">
              {loading ? "Scanning collection..." : `${documents.length} documents loaded`}
            </p>
          </div>
        </div>
        <Button onClick={refetch} variant="secondary" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Refresh Data
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
          Error loading collection: {error}
        </div>
      )}

      {!loading && !error && (
        <Tabs defaultValue="data" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="data">Data Explorer</TabsTrigger>
            <TabsTrigger value="schema">Schema & Ghost Fields</TabsTrigger>
          </TabsList>
          <TabsContent value="data" className="mt-0 border-none p-0 outline-none">
            <DataExplorer documents={documents} schema={schema} collectionName={decodedName} onUpdate={refetch} />
          </TabsContent>
          <TabsContent value="schema" className="mt-0 border-none p-0 outline-none">
            <SchemaManager schema={schema} collectionName={decodedName} onUpdate={refetch} />
          </TabsContent>
        </Tabs>
      )}

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
    </AppLayout>
  );
}
