"use client";

import { useState } from "react";
import { FieldSchema } from "@/hooks/useCollectionData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { doc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, Save, X } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export function DataExplorer({ documents, schema, collectionName, onUpdate }: { documents: any[], schema: FieldSchema[], collectionName: string, onUpdate: () => void }) {
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  
  const [isAdding, setIsAdding] = useState(false);
  const [newDocData, setNewDocData] = useState<any>({});
  const [newDocId, setNewDocId] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this document?")) return;
    try {
      await deleteDoc(doc(db, collectionName, id));
      toast.success("Document deleted.");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEditStart = (doc: any) => {
    setEditingDocId(doc.id);
    setEditFormData({ ...doc });
  };

  const handleEditSave = async () => {
    if (!editingDocId) return;
    try {
      const { id, ...dataToSave } = editFormData;
      // Filter out undefined values
      const cleanedData = Object.keys(dataToSave).reduce((acc: any, key) => {
        if (dataToSave[key] !== undefined) acc[key] = dataToSave[key];
        return acc;
      }, {});
      await updateDoc(doc(db, collectionName, id), cleanedData);
      toast.success("Document updated.");
      setEditingDocId(null);
      onUpdate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleAddSave = async () => {
    try {
      if (newDocId.trim()) {
        await setDoc(doc(db, collectionName, newDocId.trim()), newDocData);
      } else {
        const { collection, addDoc } = await import("firebase/firestore");
        await addDoc(collection(db, collectionName), newDocData);
      }
      toast.success("Document added.");
      setIsAdding(false);
      setNewDocData({});
      setNewDocId("");
      onUpdate();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Add Document</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Document</DialogTitle>
              <DialogDescription>Create a new document in {collectionName}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm font-medium">Document ID</label>
                <Input className="col-span-3" placeholder="Auto-generated if left blank" value={newDocId} onChange={e => setNewDocId(e.target.value)} />
              </div>
              <hr className="border-border" />
              {schema.map(field => (
                <div key={field.name} className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">{field.name}</label>
                  <Input 
                    className="col-span-3"
                    value={newDocData[field.name] || ""}
                    onChange={e => setNewDocData({...newDocData, [field.name]: e.target.value})}
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button onClick={handleAddSave}>Save Document</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border border-border overflow-x-auto bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px] sticky left-0 bg-card z-10 shadow-sm border-r border-border">Actions</TableHead>
              <TableHead className="whitespace-nowrap min-w-[150px]">ID</TableHead>
              {schema.map(field => (
                <TableHead key={field.name} className="whitespace-nowrap min-w-[150px]">{field.name}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.map((d) => {
              const isEditing = editingDocId === d.id;
              return (
                <TableRow key={d.id}>
                  <TableCell className="sticky left-0 bg-card z-10 shadow-sm border-r border-border">
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={handleEditSave} className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10">
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setEditingDocId(null)} className="h-8 w-8 text-muted-foreground hover:bg-muted">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditStart(d)} className="h-8 w-8 text-muted-foreground hover:text-foreground">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{d.id}</TableCell>
                  {schema.map(field => (
                    <TableCell key={field.name}>
                      {isEditing ? (
                        <Input 
                          value={editFormData[field.name] || ""} 
                          onChange={(e) => setEditFormData({...editFormData, [field.name]: e.target.value})}
                          className="h-8"
                        />
                      ) : (
                        <div className="truncate max-w-[200px]" title={String(d[field.name] ?? "")}>
                          {d[field.name] !== undefined && d[field.name] !== null 
                            ? (typeof d[field.name] === "object" ? JSON.stringify(d[field.name]) : String(d[field.name])) 
                            : <span className="text-muted-foreground italic text-xs">-</span>}
                        </div>
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
            {documents.length === 0 && (
              <TableRow>
                <TableCell colSpan={schema.length + 2} className="text-center py-8 text-muted-foreground">
                  No documents found in this collection.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
