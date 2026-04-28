import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth-context";
import { Heart, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Serenity" },
      { name: "description", content: "Sign in or continue as guest to use Serenity." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, signInAnonymously, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) navigate({ to: "/" });
  }, [user, navigate]);

  const wrap = async (fn: () => Promise<void>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      navigate({ to: "/" });
    } catch (e: any) {
      toast.error(e?.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-dvh bg-surface-1 grid place-items-center p-6">
      <div className="w-full max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="size-10 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center shadow-[var(--shadow-soft)]">
            <Heart className="size-5 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight">Serenity</span>
        </Link>

        <Card className="p-8 bg-card border-border shadow-[var(--shadow-soft)]">
          <h1 className="font-display text-3xl font-semibold tracking-tight mb-2">Welcome</h1>
          <p className="text-muted-foreground text-sm mb-6">
            Your sessions stay private to your account.
          </p>

          <Tabs defaultValue="signin">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-si">Email</Label>
                <Input id="email-si" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-si">Password</Label>
                <Input id="pw-si" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button
                disabled={busy || !email || !password}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => wrap(() => signInWithEmail(email, password), "Signed in")}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Sign in"}
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email-su">Email</Label>
                <Input id="email-su" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pw-su">Password (8+ characters)</Label>
                <Input id="pw-su" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button
                disabled={busy || !email || password.length < 8}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={() => wrap(() => signUpWithEmail(email, password), "Account created — you're signed in")}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : "Create account"}
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-wider text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => wrap(signInAnonymously, "Continuing as guest")}
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : "Continue as guest"}
          </Button>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Guest sessions are saved on this device. Create an account to access them anywhere.
          </p>
        </Card>
      </div>
    </div>
  );
}
