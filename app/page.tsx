"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setError("");

    try {
      // Check if user exists
      const res = await fetch("/api/users/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        throw new Error("Failed to verify user");
      }

      const data = await res.json();

      if (data.exists) {
        // Log them in using NextAuth credentials provider
        const signInResult = await signIn("credentials", {
          email,
          redirect: false,
        });

        if (signInResult?.error) {
          setError("Failed to sign in. Please try again.");
        } else {
          router.push("/dashboard");
        }
      } else {
        // User does not exist, redirect to onboarding with email in query
        router.push(`/onboarding?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-background">
      {/* Subtle animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20" />
      
      {/* Logo Top Left */}
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground text-xl">
          T
        </div>
        <span className="font-heading font-bold text-xl tracking-tight">TrackIT</span>
      </div>

      <div className="relative z-10 w-full max-w-md p-8">
        <div className="bg-card border border-border rounded-2xl shadow-sm p-8 flex flex-col gap-6 relative overflow-hidden">
          <div className="flex flex-col gap-2 text-center">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">Document your IT journey</h1>
            <p className="text-muted-foreground text-sm">Replace the physical logbook with a structured digital experience. Track tasks, log challenges, and document what you learn during your Industrial Training.</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                className="w-full bg-input text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
              />
              {error && <span className="text-destructive text-sm font-medium">{error}</span>}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground font-medium rounded-lg px-4 py-3 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <span className="animate-pulse">Continuing...</span>
              ) : (
                "Continue"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
