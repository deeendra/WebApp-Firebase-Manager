"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, limit, doc, updateDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type FieldSchema = {
  name: string;
  types: string[]; 
  count: number; 
};

export function useCollectionData(collectionName: string) {
  const [documents, setDocuments] = useState<any[]>([]);
  const [schema, setSchema] = useState<FieldSchema[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, collectionName), limit(1000));
      const querySnapshot = await getDocs(q);
      
      const docs: any[] = [];
      const schemaMap: Record<string, { types: Set<string>, count: number }> = {};

      querySnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const id = docSnapshot.id;
        docs.push({ id, ...data });

        Object.keys(data).forEach((key) => {
          const val = data[key];
          let type = typeof val;
          if (val === null) type = "null";
          else if (Array.isArray(val)) type = "array";
          else if (val && typeof val === "object" && typeof val.toDate === 'function') type = "timestamp";

          if (!schemaMap[key]) {
            schemaMap[key] = { types: new Set(), count: 0 };
          }
          schemaMap[key].types.add(type);
          schemaMap[key].count += 1;
        });
      });

      const schemaArray: FieldSchema[] = Object.keys(schemaMap).map(key => ({
        name: key,
        types: Array.from(schemaMap[key].types),
        count: schemaMap[key].count
      })).sort((a, b) => b.count - a.count); // Sort by most common fields

      setDocuments(docs);
      setSchema(schemaArray);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [collectionName]);

  useEffect(() => {
    if (collectionName) {
      fetchData();
    }
  }, [collectionName, fetchData]);

  return { documents, schema, loading, error, refetch: fetchData };
}
