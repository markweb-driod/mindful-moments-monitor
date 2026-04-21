import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Heart, History, BookOpen, Info, Mic, Camera, Layers, Home, LogOut, User as UserIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { useEffect, type ReactNode } from "react";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/voice", label: "Voice", icon: Mic },
  { to: "/face", label: "Facial", icon: Camera },
  { to: "/multimodal", label: "Multi-modal", icon: Layers },
  { to: "/history", label: "History", icon: History },
  { to: "/resources", label: "Resources", icon: BookOpen },
  { to: "/about", label: "About", icon: Info },
] as const;

export function SiteLayout({ children, requireAuth = true }: { children: ReactNode; requireAuth?: boolean }) {
  const loc = useLocation();
  const navigate = useNavigate();
  const { user, loading, signOut } = useAuth();

  useEffect(() => {
    if (!loading && requireAuth && !user) {
      navigate({ to: "/auth" });
    }
  }, [loading, requireAuth, user, navigate]);

  if (requireAuth && (loading || !user)) {
    return (
      <div className="min-h-dvh grid place-items-center bg-surface-1">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-surface-1 text-foreground font-sans antialiased">
      <header className="sticky top-0 z-30 border-b border-border bg-surface-1/85 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between gap-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-accent grid place-items-center shadow-[var(--shadow-soft)]">
              <Heart className="size-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">Serenity</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map((item) => {
              const active = loc.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "px-3.5 py-2 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground hover:bg-surface-2"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {user && (
              <>
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <UserIcon className="size-3.5" />
                  {user.is_anonymous ? "Guest" : user.email}
                </span>
                <Button size="sm" variant="ghost" onClick={() => signOut()}>
                  <LogOut className="size-4" />
                </Button>
              </>
            )}
          </div>
        </div>
        {/* Mobile nav */}
        <nav className="md:hidden flex overflow-x-auto gap-1 px-4 pb-3">
          {NAV.map((item) => {
            const Icon = item.icon;
            const active = loc.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap",
                  active ? "bg-foreground text-background" : "bg-surface-2 text-muted-foreground"
                )}
              >
                <Icon className="size-3.5" /> {item.label}
              </Link>
            );
          })}
          {user && (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap bg-surface-2 text-muted-foreground"
            >
              <LogOut className="size-3.5" /> Sign out
            </button>
          )}
        </nav>
      </header>
      <main>{children}</main>
      <footer className="border-t border-border mt-24 py-10 bg-surface-2">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          <p>
            Serenity is an educational mental wellness tool. It is not a substitute for professional medical advice.
          </p>
          <p className="mt-2">© {new Date().getFullYear()} Serenity Monitor</p>
        </div>
      </footer>
    </div>
  );
}
