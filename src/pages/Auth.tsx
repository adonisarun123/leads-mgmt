import { useState } from "react";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const Auth = () => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          hd: "ezyhelpers.com",
          prompt: "select_account",
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 shadow-sm text-center">
        <h1 className="mb-1 text-xl font-semibold text-card-foreground">EzyHelpers Ops</h1>
        <p className="mb-6 text-sm text-muted-foreground">Sign in with your @ezyhelpers.com account</p>
        <Button onClick={handleGoogleSignIn} className="w-full gap-2" disabled={loading}>
          {loading ? "Please wait..." : "Sign in with Google"}
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">Only @ezyhelpers.com accounts are allowed</p>
      </div>
    </div>
  );
};

export default Auth;
