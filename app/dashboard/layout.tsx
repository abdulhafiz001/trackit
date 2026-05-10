"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, Calendar as CalendarIcon, CheckCircle2 } from "lucide-react";
import { getWeekNumber } from "@/lib/dateUtils";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading" || !session) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  const user = session.user as any;
  const totalWeeks = user?.itDurationWeeks || 24; 
  let startDate = new Date();
  if (user?.startDate) {
    const parsed = new Date(user.startDate);
    if (!isNaN(parsed.getTime())) startDate = parsed;
  }
  
  // Calculate current week
  const currentWeek = Math.max(1, Math.min(getWeekNumber(new Date(), startDate), totalWeeks));
  
  const weeks = Array.from({ length: totalWeeks }, (_, i) => i + 1);

  const toggleMobileSidebar = () => setIsMobileOpen(!isMobileOpen);

  return (
    <div className="h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground text-xl">
            T
          </div>
          <span className="font-heading font-bold text-lg tracking-tight">TrackIT</span>
        </div>
        <button onClick={toggleMobileSidebar} className="text-foreground p-2">
          {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Sidebar Backdrop */}
      {isMobileOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-80 max-w-[85vw] bg-card border-r border-border md:static md:w-72 md:max-w-none flex flex-col transition-transform duration-300
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Mobile Sidebar Header */}
        <div className="flex md:hidden items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground text-xl">
              T
            </div>
            <span className="font-heading font-bold text-lg tracking-tight">TrackIT</span>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setIsMobileOpen(false)}
            className="rounded-lg p-2 text-foreground hover:bg-secondary transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:flex items-center gap-2 p-6 border-b border-border">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground text-xl">
            T
          </div>
          <span className="font-heading font-bold text-xl tracking-tight">TrackIT</span>
        </div>

        {/* User Profile */}
        <div className="p-6 flex flex-col gap-1 border-b border-border bg-secondary/10">
          <span className="font-medium text-sm truncate">{session.user?.name}</span>
          <span className="text-xs text-muted-foreground truncate">{session.user?.email}</span>
        </div>

        {/* Weeks List */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1 hide-scrollbar">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Your Logbook</div>
          
          <Link 
            href="/dashboard"
            onClick={() => setIsMobileOpen(false)}
            className={`
              flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
              ${pathname === "/dashboard" ? "bg-primary/10 text-primary" : "hover:bg-secondary/50 text-foreground"}
            `}
          >
            <CalendarIcon size={16} />
            Current Week
          </Link>

          <div className="mt-4 mb-2 px-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">History</div>
          
          {weeks.map(w => {
            const isCompleted = w < currentWeek;
            const isActive = pathname === `/dashboard/week/${w}`;
            return (
              <Link
                key={w}
                href={`/dashboard/week/${w}`}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors group
                  ${isActive ? "bg-secondary text-foreground" : "hover:bg-secondary/50 text-muted-foreground hover:text-foreground"}
                `}
              >
                <span>Week {w}</span>
                {isCompleted && <CheckCircle2 size={14} className="text-primary opacity-70 group-hover:opacity-100" />}
              </Link>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border">
          <button 
            onClick={() => signOut({ callbackUrl: "/" })}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background overflow-y-auto relative z-0">
        {children}
      </main>
    </div>
  );
}
