"use client";

import { useState } from "react";
import { FieldSchema } from "@/hooks/useCollectionData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Edit2, AlertTriangle } from "lucide-react";
import { updateDoc, deleteField, writeBatch, collection, getDocs, query, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export function SchemaManager({ schema, collectionName, onUpdate }: { schema: FieldSchema[], collectionName: string, onUpdate: () => void }) {
  const [renamingField, setRenamingField] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const maxDocs = Math.max(...schema.map(s => s.count), 0);

  const handleDeleteField = async (fieldName: string) => {
    if (!confirm(`Are you sure you want to delete the field "${fieldName}" from all documents? This action cannot be undone.`)) return;
    
    setIsProcessing(true);
    try {
      const q = query(collection(db, collectionName), limit(1000));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      let count = 0;
      snapshot.forEach((d) => {
        if (d.data()[fieldName] !== undefined) {
          batch.update(d.ref, { [fieldName]: deleteField() });
          count++;
        }
      });
      
      if (count > 0) {
        await batch.commit();
        toast.success(`Deleted field "${fieldName}" from ${count} documents.`);
        onUpdate();
      } else {
        toast.info(`Field "${fieldName}" not found in any documents.`);
      }
    } catch (e: any) {
      toast.error(`Error deleting field: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRenameField = async () => {
    if (!renamingField || !newName.trim() || renamingField === newName.trim()) {
      setRenamingField(null);
      return;
    }

    const fieldToRename = renamingField;
    const finalNewName = newName.trim();
    
    setIsProcessing(true);
    try {
      const q = query(collection(db, collectionName), limit(1000));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      let count = 0;
      snapshot.forEach((d) => {
        const data = d.data();
        if (data[fieldToRename] !== undefined) {
          batch.update(d.ref, { 
            [finalNewName]: data[fieldToRename],
            [fieldToRename]: deleteField()
          });
          count++;
        }
      });
      
      if (count > 0) {
        await batch.commit();
        toast.success(`Renamed "${fieldToRename}" to "${finalNewName}" in ${count} documents.`);
        onUpdate();
      }
    } catch (e: any) {
      toast.error(`Error renaming field: ${e.message}`);
    } finally {
      setIsProcessing(false);
      setRenamingField(null);
    }
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle>Schema & Ghost Fields Detection</CardTitle>
        <CardDescription>
          Analyzed {maxDocs} documents. Fields present in only a few documents might be AI hallucinations (Ghost Fields).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Field Name</TableHead>
                <TableHead>Detected Types</TableHead>
                <TableHead>Presence</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schema.map((field) => {
                const isGhost = maxDocs > 0 && field.count < maxDocs * 0.2; 
                return (
                  <TableRow key={field.name}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {field.name}
                        {isGhost && (
                          <Badge variant="destructive" className="ml-2 bg-destructive/20 text-destructive border-none">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Ghost Field?
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {field.types.map(t => (
                          <Badge key={t} variant="outline" className="bg-secondary/50 text-xs">
                            {t}
                          </Badge>
                        ))}
                        {field.types.length > 1 && (
                          <Badge variant="destructive" className="text-xs">Inconsistent</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{field.count} docs</span>
                        <span className="text-xs text-muted-foreground">({Math.round((field.count / maxDocs) * 100)}%)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Dialog open={renamingField === field.name} onOpenChange={(open) => {
                          if (open) {
                            setRenamingField(field.name);
                            setNewName(field.name);
                          } else {
                            setRenamingField(null);
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={isProcessing}>
                              <Edit2 className="h-4 w-4 mr-1" /> Rename
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Rename Field</DialogTitle>
                              <DialogDescription>
                                This will rename the field "{field.name}" across all documents in this collection.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                              <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">
                                  New Name
                                </Label>
                                <Input
                                  id="name"
                                  value={newName}
                                  onChange={(e) => setNewName(e.target.value)}
                                  className="col-span-3"
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setRenamingField(null)}>Cancel</Button>
                              <Button onClick={handleRenameField} disabled={isProcessing}>
                                {isProcessing ? "Processing..." : "Save changes"}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteField(field.name)}
                          disabled={isProcessing}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {schema.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No fields found in this collection.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
