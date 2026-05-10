"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "next-auth/react";
import { addDays, format, getDay, startOfDay } from "date-fns";

const STEPS = [
  { id: 1, title: "Personal Details" },
  { id: 2, title: "IT Duration" },
  { id: 3, title: "Start Date" },
  { id: 4, title: "Review" }
];

function OnboardingWizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    organization: "",
    department: "",
    supervisorName: "",
    itDurationWeeks: 24,
    startDate: "",
  });

  useEffect(() => {
    if (!email) {
      router.push("/");
    }
  }, [email, router]);

  const updateForm = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleNext = () => {
    if (step === 1) {
      if (!formData.name || !formData.organization || !formData.department) {
        setError("Please fill all required fields.");
        return;
      }
    }
    if (step === 2) {
      if (formData.itDurationWeeks < 4 || formData.itDurationWeeks > 52) {
        setError("Duration must be between 4 and 52 weeks.");
        return;
      }
    }
    if (step === 3) {
      if (!formData.startDate) {
        setError("Please select a start date.");
        return;
      }
      const day = getDay(new Date(formData.startDate));
      if (day !== 1) {
        setError("IT logbooks typically begin on a Monday. Please select a Monday.");
        return;
      }
    }
    setStep(s => Math.min(s + 1, 4));
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ...formData }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to create account");

      // Log in
      const signInResult = await signIn("credentials", {
        email,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error("Account created, but failed to log in automatically.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setIsLoading(false);
    }
  };

  const calculateEndDatePreview = () => {
    if (!formData.startDate || !formData.itDurationWeeks) return "TBD";
    // Quick estimation for UI preview (business logic is on backend, but this is close enough)
    const weeksMs = formData.itDurationWeeks * 7 * 24 * 60 * 60 * 1000;
    const end = new Date(new Date(formData.startDate).getTime() + weeksMs - (2 * 24 * 60 * 60 * 1000)); // minus weekend
    return format(end, "MMM d, yyyy");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center py-12 px-4">
      {/* Header */}
      <div className="w-full max-w-xl flex items-center justify-between mb-12">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-heading font-bold text-primary-foreground text-xl">
            T
          </div>
          <span className="font-heading font-bold text-xl tracking-tight hidden sm:block">TrackIT</span>
        </div>
        <div className="text-sm font-medium text-muted-foreground">
          Step {step} of 4
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full max-w-xl h-2 bg-secondary rounded-full overflow-hidden mb-12">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${(step / 4) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main Content Area */}
      <div className="w-full max-w-xl bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
        <div className="p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-6"
            >
              {step === 1 && (
                <div className="flex flex-col gap-4">
                  <h2 className="font-heading text-2xl font-semibold">Personal Details</h2>
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => updateForm("name", e.target.value)}
                        className="w-full bg-input text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Place of IT (Organization) *</label>
                      <input
                        type="text"
                        value={formData.organization}
                        onChange={(e) => updateForm("organization", e.target.value)}
                        className="w-full bg-input text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. TechCorp Ltd."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Department *</label>
                      <input
                        type="text"
                        value={formData.department}
                        onChange={(e) => updateForm("department", e.target.value)}
                        className="w-full bg-input text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Software Engineering"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">Supervisor's Name (Optional)</label>
                      <input
                        type="text"
                        value={formData.supervisorName}
                        onChange={(e) => updateForm("supervisorName", e.target.value)}
                        className="w-full bg-input text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Dr. Jane Smith"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="flex flex-col gap-4">
                  <h2 className="font-heading text-2xl font-semibold">How many weeks is your IT?</h2>
                  <p className="text-sm text-muted-foreground">Check your school's IT handbook if unsure. Most programs are 24 weeks (6 months).</p>
                  <div className="flex flex-col items-center justify-center py-8 gap-6">
                    <span className="text-6xl font-heading font-bold text-primary">{formData.itDurationWeeks}</span>
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Weeks</span>
                    <input
                      type="range"
                      min="4"
                      max="52"
                      value={formData.itDurationWeeks}
                      onChange={(e) => updateForm("itDurationWeeks", parseInt(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="flex flex-col gap-4">
                  <h2 className="font-heading text-2xl font-semibold">Start Date</h2>
                  <p className="text-sm text-muted-foreground">Choose the first working day of your IT placement. It must be a Monday.</p>
                  <div className="pt-4">
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => updateForm("startDate", e.target.value)}
                      className="w-full bg-input text-foreground border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    {formData.startDate && getDay(new Date(formData.startDate)) !== 1 && (
                      <p className="text-warning text-sm mt-2 font-medium">
                        ⚠️ You selected a {format(new Date(formData.startDate), "EEEE")}. Please select a Monday.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="flex flex-col gap-6">
                  <h2 className="font-heading text-2xl font-semibold">Review & Confirm</h2>
                  <div className="bg-secondary rounded-xl p-6 flex flex-col gap-4 text-sm">
                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Name</span>
                      <span className="font-medium text-right">{formData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Organization</span>
                      <span className="font-medium text-right">{formData.organization}<br/><span className="text-xs opacity-80">{formData.department}</span></span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-3">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium text-right">{formData.itDurationWeeks} Weeks</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estimated Schedule</span>
                      <span className="font-medium text-right text-primary">
                        {formData.startDate ? format(new Date(formData.startDate), "MMM d, yyyy") : ""} — <br/>
                        {calculateEndDatePreview()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="text-destructive text-sm font-medium">{error}</div>}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Actions */}
        <div className="bg-secondary/30 p-6 border-t border-border flex justify-between items-center">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Back
            </button>
          ) : <div />}
          
          {step < 4 ? (
            <button
              onClick={handleNext}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Next Step
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center min-w-[140px] disabled:opacity-50 relative overflow-hidden group"
            >
              {isLoading ? (
                <span className="animate-pulse">Creating...</span>
              ) : (
                <>
                  <span className="relative z-10">Start My Logbook</span>
                  <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}} />
    </div>
  );
}

export default function OnboardingWizard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center">Loading onboarding...</div>}>
      <OnboardingWizardContent />
    </Suspense>
  );
}
