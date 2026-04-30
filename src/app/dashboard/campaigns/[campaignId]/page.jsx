"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import EmailEditor from "@/components/email-editor/EmailEditor";
import Spinner from "@/components/ui/Spinner";
import { toast } from "sonner";

export default function CampaignPage() {
  const params = useParams();
  const campaignId = params?.campaignId;

  const [steps, setSteps] = useState([]);
  const [activeStep, setActiveStep] = useState(null);
  const [addingFollowup, setAddingFollowup] = useState(false);

  useEffect(() => {
    if (!campaignId) return;

    async function loadSteps() {
      const supabase = createClient();
      const { data } = await supabase
        .from("steps")
        .select("id, step_order, delay_days, subject")
        .eq("campaign_id", campaignId)
        .order("step_order");

      if (data && data.length > 0) {
        setSteps(data);
        setActiveStep(data[0].id);
      } else {
        // Create the first step automatically
        const { data: newStep } = await supabase
          .from("steps")
          .insert({ campaign_id: campaignId, step_order: 1, delay_days: 0 })
          .select("id, step_order, delay_days")
          .single();

        if (newStep) {
          setSteps([newStep]);
          setActiveStep(newStep.id);
        }
      }
    }

    loadSteps();
  }, [campaignId]);

  async function createFollowup() {
    if (addingFollowup) return;
    setAddingFollowup(true);
    const nextOrder = steps.length + 1;
    const supabase = createClient();
    const { data: newStep, error } = await supabase
      .from("steps")
      .insert({ campaign_id: campaignId, step_order: nextOrder, delay_days: 2 })
      .select("id, step_order, delay_days")
      .single();

    if (error) {
      toast.error("Failed to add follow-up step");
    } else {
      setSteps((prev) => [...prev, newStep]);
      setActiveStep(newStep.id);
    }
    setAddingFollowup(false);
  }

  async function updateDelay(stepId, newDelay) {
    const supabase = createClient();
    const { error } = await supabase
      .from("steps")
      .update({ delay_days: newDelay })
      .eq("id", stepId);

    if (error) {
      toast.error("Failed to update delay");
      return;
    }
    setSteps((prev) =>
      prev.map((s) => (s.id === stepId ? { ...s, delay_days: newDelay } : s))
    );
  }

  const currentStep = steps.find((s) => s.id === activeStep);

  return (
    <div className="flex h-full">
      {/* STEP SIDEBAR */}
      <div className="w-64 border-r bg-gray-50 p-4 space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            onClick={() => setActiveStep(step.id)}
            className={`p-3 rounded-lg cursor-pointer border ${
              activeStep === step.id
                ? "bg-white border-black"
                : "bg-gray-100 border-transparent"
            }`}
          >
            <div className="font-medium">
              {step.step_order === 1 ? "Initial Email" : `Followup ${step.step_order - 1}`}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Send after {step.delay_days} days
            </div>
          </div>
        ))}

        <button
          onClick={createFollowup}
          disabled={addingFollowup}
          className="w-full py-2 rounded-md border border-dashed border-gray-400 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {addingFollowup ? <Spinner /> : null}
          {addingFollowup ? "Adding..." : "+ Add Followup"}
        </button>
      </div>

      {/* EMAIL EDITOR */}
      <div className="flex-1 p-8">
        {currentStep && (
          <>
            {currentStep.step_order !== 1 && (
              <div className="mb-6 text-sm text-gray-700 flex items-center gap-2">
                <span>Send this email</span>
                <input
                  type="number"
                  min="0"
                  defaultValue={currentStep.delay_days}
                  onBlur={(e) => updateDelay(currentStep.id, Number(e.target.value))}
                  className="w-16 border rounded px-2 py-1 text-sm"
                />
                <span>days after last email</span>
              </div>
            )}
            <EmailEditor key={activeStep} campaignId={campaignId} step={activeStep} />
          </>
        )}
      </div>
    </div>
  );
}
