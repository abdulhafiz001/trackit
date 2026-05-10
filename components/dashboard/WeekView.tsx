"use client";

import { useState, useEffect, useMemo } from "react";
import { format, addDays, startOfWeek, isSameDay, startOfDay } from "date-fns";
import { Calendar as CalendarIcon, CheckCircle, Clock, Search, Edit2, Sparkles, X, ChevronRight } from "lucide-react";
import AISuggestPanel from "@/components/dashboard/AISuggestPanel";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { checkIsNigerianHoliday } from "@/lib/dateUtils";
import { NIGERIAN_HOLIDAYS_SEED } from "@/lib/holidays";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function WeekView({ weekNumber, isCurrentWeek = false }: { weekNumber: number, isCurrentWeek?: boolean }) {
  const { data: session } = useSession();
  const user = session?.user as any;
  let startDate = new Date();
  if (user?.startDate) {
    const parsed = new Date(user.startDate);
    if (!isNaN(parsed.getTime())) startDate = parsed;
  }

  // Calculate the base Monday for the given weekNumber
  // (weekNumber - 1) * 7 days after the startDate's Monday
  const baseMonday = startOfWeek(startDate, { weekStartsOn: 1 });
  const weekStart = addDays(baseMonday, (weekNumber - 1) * 7);
  const weekStartTime = weekStart.getTime();

  // Fetch entries for this week
  const { data, mutate, isLoading } = useSWR(`/api/entries?weekNumber=${weekNumber}`, fetcher);
  const entries = useMemo(() => data?.entries || [], [data?.entries]);

  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  // Form states
  const [taskText, setTaskText] = useState("");
  const [challengesText, setChallengesText] = useState("");
  const [learningsText, setLearningsText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Re-calculate days based on fetched data.
  const days = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => {
      const date = addDays(weekStart, i);
      const dayStart = startOfDay(date);
      const today = startOfDay(new Date());

      const entry = entries.find((e: any) => isSameDay(new Date(e.date), date));

      const isHoliday = checkIsNigerianHoliday(date);
      const holidayInfo = isHoliday ? NIGERIAN_HOLIDAYS_SEED.find(h => isSameDay(startOfDay(new Date(h.date)), dayStart)) : null;

      let status = "pending";
      if (isHoliday) status = "holiday";
      else if (entry) status = "logged";
      else if (dayStart > today) status = "locked";

      return {
        date,
        name: format(date, "EEEE"),
        formatted: format(date, "MMM d, yyyy"),
        status,
        holidayName: holidayInfo?.name || null,
        entry,
      };
    });
  }, [entries, weekStartTime]);

  // Keep the selected day synced with the latest fetched entry data.
  useEffect(() => {
    if (days.length === 0) return;

    setSelectedDay((previous: any) => {
      if (!previous) {
        const todayDay = days.find(d => isSameDay(d.date, new Date()));
        return todayDay || days[0];
      }

      return days.find(d => isSameDay(d.date, previous.date)) || days[0];
    });
  }, [days]);

  const handleOpenDrawer = () => {
    if (!selectedDay) return;
    setTaskText(selectedDay.entry?.tasks || "");
    setChallengesText(selectedDay.entry?.challenges || "");
    setLearningsText(selectedDay.entry?.learnings || "");
    setShowAiPanel(false);
    setIsDrawerOpen(true);
  };

  const handleAiAccept = (text: string) => {
    setTaskText(text);
    setShowAiPanel(false);
  };

  const handleSaveEntry = async () => {
    if (!selectedDay || !taskText) return;
    setIsSaving(true);
    
    try {
      const res = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDay.date.toISOString(),
          weekNumber,
          dayOfWeek: selectedDay.name,
          tasks: taskText,
          challenges: challengesText,
          learnings: learningsText,
          aiGenerated: false, // Update if ai panel was used
        }),
      });
      
      if (res.ok) {
        await mutate();
        // Immediately update the selectedDay so the UI doesn't lag
        setSelectedDay((prev: any) => ({
          ...prev,
          status: "logged",
          entry: {
            ...prev.entry,
            tasks: taskText,
            challenges: challengesText,
            learnings: learningsText,
          }
        }));
        setIsDrawerOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !selectedDay) {
    return <div className="p-8">Loading week...</div>;
  }

  const totalLogged = entries.length;
  // Calculate total logged so far in total duration? Wait, we only have entries for this week in `entries`.
  // To keep it simple, progress will just reflect this week's progress out of 5 for now.
  const weekProgress = Math.round((totalLogged / 5) * 100);

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto w-full p-4 md:p-8 gap-8">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-3xl font-semibold">
            Week {weekNumber}
          </h1>
          {isCurrentWeek && (
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              Current Week
            </div>
          )}
        </div>
        
        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Logged (Week)</span>
            <span className="text-xl font-bold">{totalLogged} / 5</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Progress</span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${weekProgress}%` }} />
              </div>
              <span className="text-sm font-medium">{weekProgress}%</span>
            </div>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Streak</span>
            <span className="text-xl font-bold flex items-center gap-2">🔥 Keep going!</span>
          </div>
          <div className="bg-card border border-border p-4 rounded-xl flex flex-col gap-1">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Status</span>
            <span className="text-sm font-medium mt-1 text-primary flex items-center gap-1"><CheckCircle size={14} /> On Track</span>
          </div>
        </div>
      </div>

      {/* Day Strip */}
      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Select a Day</h2>
        <div className="flex overflow-x-auto pb-4 gap-3 snap-x snap-mandatory hide-scrollbar">
          {days.map((day, i) => {
            const isSelected = isSameDay(day.date, selectedDay.date);
            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`
                  snap-center shrink-0 min-w-[140px] md:min-w-0 md:flex-1 flex flex-col items-center justify-center p-4 rounded-xl border transition-all
                  ${isSelected ? "border-primary bg-primary/5 shadow-[0_0_0_1px_rgba(0,212,184,1)]" : "border-border bg-card hover:bg-secondary/50"}
                `}
              >
                <span className={`text-xs font-bold uppercase tracking-wider mb-1 ${isSelected ? "text-primary" : "text-muted-foreground"}`}>
                  {day.name.substring(0, 3)}
                </span>
                <span className="text-2xl font-heading font-bold mb-3">{format(day.date, "d")}</span>
                
                {/* Status Badge */}
                <div className={`
                  text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1
                  ${day.status === "logged" ? "bg-primary/20 text-primary" : ""}
                  ${day.status === "holiday" ? "bg-destructive/20 text-destructive" : ""}
                  ${day.status === "pending" ? "bg-warning/20 text-warning" : ""}
                  ${day.status === "locked" ? "bg-secondary text-muted-foreground" : ""}
                `}>
                  {day.status === "logged" && <CheckCircle size={10} />}
                  {day.status === "holiday" && <CalendarIcon size={10} />}
                  {day.status === "pending" && <Clock size={10} />}
                  {day.status === "locked" && <X size={10} />}
                  {day.status}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Log Card Detail */}
      <div className="flex-1 bg-card border border-border rounded-2xl p-6 md:p-8 flex flex-col">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-heading text-2xl font-semibold mb-1">{selectedDay.name}</h2>
            <p className="text-muted-foreground">{selectedDay.formatted}</p>
          </div>
          {selectedDay.status !== "holiday" && selectedDay.status !== "locked" && (
            <button 
              onClick={handleOpenDrawer}
              className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Edit2 size={16} />
              {selectedDay.status === "logged" ? "Edit Entry" : "Log Entry"}
            </button>
          )}
        </div>

        <div className="flex-1">
          {selectedDay.status === "holiday" ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-destructive/5 rounded-xl border border-destructive/20 text-destructive">
              <CalendarIcon size={48} className="mb-4 opacity-50" />
              <h3 className="font-heading text-xl font-bold mb-2">Public Holiday</h3>
              <p className="text-sm opacity-80">{selectedDay.holidayName}</p>
            </div>
          ) : selectedDay.status === "locked" ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-secondary/30 rounded-xl border border-border text-muted-foreground">
              <Clock size={48} className="mb-4 opacity-50" />
              <h3 className="font-heading text-xl font-bold mb-2">Future Date</h3>
              <p className="text-sm opacity-80">You can't log entries for the future.</p>
            </div>
          ) : selectedDay.status === "pending" ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-warning/5 rounded-xl border border-warning/20 text-warning">
              <Edit2 size={48} className="mb-4 opacity-50" />
              <h3 className="font-heading text-xl font-bold mb-2">No Entry Yet</h3>
              <p className="text-sm opacity-80 mb-6">You haven't logged anything for this day.</p>
              <button 
                onClick={handleOpenDrawer}
                className="bg-warning text-warning-foreground px-6 py-2 rounded-lg text-sm font-bold shadow-sm hover:opacity-90 transition-opacity"
              >
                Log Now
              </button>
            </div>
          ) : (
            <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
              <div className="mb-6">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Tasks Completed</h4>
                <p className="whitespace-pre-wrap bg-secondary/30 p-4 rounded-xl border border-border">{selectedDay.entry?.tasks}</p>
              </div>
              {selectedDay.entry?.challenges && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Challenges</h4>
                  <p className="whitespace-pre-wrap bg-secondary/10 p-4 rounded-xl border border-border">{selectedDay.entry?.challenges}</p>
                </div>
              )}
              {selectedDay.entry?.learnings && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">What I Learned</h4>
                  <p className="whitespace-pre-wrap bg-secondary/10 p-4 rounded-xl border border-border">{selectedDay.entry?.learnings}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drawer overlay for editing */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-background/80 backdrop-blur-sm">
          <div 
            className="absolute inset-0" 
            onClick={() => !isSaving && setIsDrawerOpen(false)}
          />
          <div className="relative w-full max-w-md bg-card h-full border-l border-border shadow-2xl flex flex-col animate-in slide-in-from-right-full duration-300">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h2 className="font-heading text-xl font-semibold">Log Entry</h2>
                <p className="text-sm text-muted-foreground">{selectedDay.formatted}</p>
              </div>
              <button onClick={() => !isSaving && setIsDrawerOpen(false)} className="p-2 hover:bg-secondary rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">What did you work on today? *</label>
                <textarea 
                  className="w-full bg-input border border-border rounded-xl p-4 min-h-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Describe your tasks..."
                  value={taskText}
                  onChange={(e) => setTaskText(e.target.value)}
                  disabled={isSaving}
                />
                {!showAiPanel ? (
                  <button 
                    onClick={() => setShowAiPanel(true)}
                    disabled={isSaving}
                    className="flex items-center justify-center gap-2 mt-2 w-full py-2.5 rounded-lg border border-primary/30 text-primary font-medium text-sm hover:bg-primary/5 transition-colors group disabled:opacity-50"
                  >
                    <Sparkles size={16} className="group-hover:animate-spin-once" />
                    AI Suggest Entry
                  </button>
                ) : (
                  <AISuggestPanel 
                    date={selectedDay.date} 
                    onAccept={handleAiAccept} 
                    onDismiss={() => setShowAiPanel(false)} 
                  />
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">Challenges (Optional)</label>
                <textarea 
                  className="w-full bg-input border border-border rounded-xl p-4 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Any blockers?"
                  value={challengesText}
                  onChange={(e) => setChallengesText(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-foreground">What I Learned (Optional)</label>
                <textarea 
                  className="w-full bg-input border border-border rounded-xl p-4 min-h-[100px] text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  placeholder="Key takeaways..."
                  value={learningsText}
                  onChange={(e) => setLearningsText(e.target.value)}
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button 
                onClick={() => setIsDrawerOpen(false)}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEntry}
                disabled={!taskText.trim() || isSaving}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? "Saving..." : "Save Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin-once {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(180deg); }
        }
        .animate-spin-once {
          animation: spin-once 0.5s ease-in-out;
        }
      `}} />
    </div>
  );
}
