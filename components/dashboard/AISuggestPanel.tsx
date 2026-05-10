"use client";

import { useState, useEffect } from "react";
import { Sparkles, Check, X } from "lucide-react";
import { format } from "date-fns";

interface AISuggestPanelProps {
  date: Date;
  onAccept: (text: string) => void;
  onDismiss: () => void;
}

export default function AISuggestPanel({ date, onAccept, onDismiss }: AISuggestPanelProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestion, setSuggestion] = useState("");
  const [displayedText, setDisplayedText] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSuggestion = async () => {
      setIsLoading(true);
      setError("");
      try {
        const res = await fetch("/api/ai/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentDate: format(date, "yyyy-MM-dd") }),
        });
        const data = await res.json();
        
        if (!res.ok) throw new Error(data.error || "Failed to generate");
        
        setSuggestion(data.suggestion);
        setIsLoading(false);
      } catch (err: any) {
        setError(err.message || "AI is taking a break. Try again or write your entry manually.");
        setIsLoading(false);
      }
    };

    fetchSuggestion();
  }, [date]);

  // Typewriter effect
  useEffect(() => {
    if (!isLoading && suggestion && !error) {
      let currentIndex = 0;
      const interval = setInterval(() => {
        setDisplayedText(suggestion.substring(0, currentIndex + 1));
        currentIndex++;
        if (currentIndex === suggestion.length) {
          clearInterval(interval);
        }
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isLoading, suggestion, error]);

  const isTypingComplete = displayedText.length === suggestion.length && suggestion.length > 0;

  return (
    <div className="bg-secondary/30 rounded-xl border border-primary/20 p-4 flex flex-col gap-3 relative overflow-hidden mt-4">
      {isLoading && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent w-full h-full animate-[shimmer_1.5s_infinite]" />
      )}
      
      <div className="flex items-center gap-2 text-primary font-medium text-sm">
        <Sparkles size={16} className={isLoading ? "animate-pulse" : ""} />
        {isLoading ? "Analysing your entries..." : "AI Suggestion"}
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <blockquote className="text-sm text-foreground/90 border-l-2 border-primary/50 pl-3 py-1 italic min-h-[60px]">
          {displayedText}
          {!isTypingComplete && !isLoading && <span className="inline-block w-1.5 h-4 bg-primary ml-1 animate-pulse" />}
        </blockquote>
      )}

      {!isLoading && !error && (
        <div className="flex items-center justify-between mt-2 pt-3 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Generated based on recent entries</span>
          <div className="flex gap-2">
            <button 
              onClick={onDismiss}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:bg-secondary transition-colors flex items-center gap-1"
            >
              <X size={14} /> Dismiss
            </button>
            <button 
              onClick={() => onAccept(suggestion)}
              disabled={!isTypingComplete}
              className={`
                px-3 py-1.5 rounded-md text-xs font-bold text-primary-foreground bg-primary flex items-center gap-1 transition-all
                ${isTypingComplete ? "hover:bg-primary/90 hover:scale-105 shadow-md shadow-primary/20" : "opacity-50 cursor-not-allowed"}
              `}
            >
              <Check size={14} /> Use This
            </button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}
