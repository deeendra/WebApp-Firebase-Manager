"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DatabaseIcon } from "lucide-react";

export default function LoginPage() {
  const { loginWithGoogle, loading, user } = useAuth();

  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
            <DatabaseIcon className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Firestore Manager
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Enterprise database maintenance tool.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-md bg-secondary p-4 text-sm text-secondary-foreground text-center">
            Restricted access. Only authorized personnel can log in.
          </div>
          <Button 
            className="w-full font-semibold" 
            size="lg" 
            onClick={loginWithGoogle}
          >
            Sign in with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
