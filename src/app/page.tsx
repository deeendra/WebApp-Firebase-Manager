"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export default function DashboardPage() {
  const [collectionName, setCollectionName] = useState("");
  const router = useRouter();

  const handleOpenCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionName.trim()) return;
    router.push(`/collections/${encodeURIComponent(collectionName.trim())}`);
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to Firestore Manager</h1>
          <p className="text-muted-foreground">Manage your Firestore collections, clean up ghost fields, and edit data.</p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle>Open a Collection</CardTitle>
            <CardDescription>Enter the name of the Firestore collection you want to manage.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOpenCollection} className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="e.g. users, products, orders..." 
                  className="pl-9"
                  value={collectionName}
                  onChange={(e) => setCollectionName(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={!collectionName.trim()}>
                Open Collection
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
