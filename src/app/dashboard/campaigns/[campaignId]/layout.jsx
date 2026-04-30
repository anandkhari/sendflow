"use client";

import { useState, useEffect } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

function StatusBadge({ status }) {
  const styles = {
    draft:     { dot: "bg-gray-400",                    label: "Draft" },
    active:    { dot: "bg-green-500 animate-pulse",     label: "Active" },
    paused:    { dot: "bg-yellow-400",                  label: "Paused" },
    completed: { dot: "bg-blue-400",                    label: "Completed" },
  };
  const { dot, label } = styles[status] || styles.draft;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

function ToggleButton({ status, loading, onClick }) {
  const config = {
    draft:  { label: "Start Campaign", icon: "▶", style: "bg-black text-white hover:bg-gray-800" },
    active: { label: "Pause",          icon: "⏸", style: "border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50" },
    paused: { label: "Resume",         icon: "▶", style: "bg-black text-white hover:bg-gray-800" },
  };
  const { label, icon, style } = config[status] || config.draft;
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${style}`}
    >
      {loading ? <Spinner /> : <span>{icon}</span>}
      {loading ? (status === "draft" ? "Starting..." : status === "active" ? "Pausing..." : "Resuming...") : label}
    </button>
  );
}

export default function CampaignLayout({ children }) {
  const { campaignId } = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const [campaignName, setCampaignName] = useState("");
  const [status, setStatus] = useState("draft");

  useEffect(() => {
    const load = async () => {
      if (!campaignId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("campaigns")
        .select("name, status")
        .eq("id", campaignId)
        .single();

      if (data) {
        setCampaignName(data.name || "");
        setStatus(data.status || "draft");
      }
    };

    load();
  }, [campaignId]);

  const updateStatus = async (newStatus) => {
    if (!campaignId) return;
    setStatus(newStatus);
    const supabase = createClient();
    const { error } = await supabase
      .from("campaigns")
      .update({ status: newStatus })
      .eq("id", campaignId);
    if (error) {
      setStatus(status); // revert optimistic update
      toast.error("Failed to update campaign status");
    } else {
      toast.success(`Campaign ${newStatus}`);
    }
  };

  const [actionLoading, setActionLoading] = useState(false);

  const handleToggle = async () => {
    if (actionLoading) return;
    setActionLoading(true);

    // draft → start (creates jobs)
    if (status === "draft") {
      const toastId = toast.loading("Starting campaign...");
      try {
        const res = await fetch("/api/campaign/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaignId, mailboxId: "default-mailbox" }),
        });
        const json = await res.json();
        if (json.success) {
          setStatus("active");
          toast.success("Campaign started — jobs are queued", { id: toastId });
        } else {
          toast.error(json.error || "Failed to start campaign", { id: toastId });
        }
      } catch {
        toast.error("Could not reach server", { id: toastId });
      }

    // active → pause
    } else if (status === "active") {
      await updateStatus("paused");

    // paused → resume
    } else if (status === "paused") {
      await updateStatus("active");
    }

    setActionLoading(false);
  };

  const basePath = `/dashboard/campaigns/${campaignId}`;
  const isEmailActive     = pathname === basePath;
  const isProspectsActive = pathname === `${basePath}/prospects`;
  const isSettingsActive  = pathname === `${basePath}/settings`;
  const isAnalyticsActive = pathname === `${basePath}/analytics`;

  return (
    <div className="w-full h-full p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-semibold">
                {campaignName || "Loading..."}
              </h1>
              <StatusBadge status={status} />
            </div>
          </div>

          {status !== "completed" && (
            <ToggleButton
              status={status}
              loading={actionLoading}
              onClick={handleToggle}
            />
          )}
        </div>

        <div className="border-b mb-6 flex gap-6 text-sm font-medium">
          <button
            onClick={() => router.push(basePath)}
            className={`pb-3 ${isEmailActive ? "border-b-2 border-black" : "text-gray-500"}`}
          >
            Email
          </button>
          <button
            onClick={() => router.push(`${basePath}/prospects`)}
            className={`pb-3 ${isProspectsActive ? "border-b-2 border-black" : "text-gray-500"}`}
          >
            Prospects
          </button>
          <button
            onClick={() => router.push(`${basePath}/settings`)}
            className={`pb-3 ${isSettingsActive ? "border-b-2 border-black" : "text-gray-500"}`}
          >
            Settings
          </button>
          <button
            onClick={() => router.push(`${basePath}/analytics`)}
            className={`pb-3 ${isAnalyticsActive ? "border-b-2 border-black" : "text-gray-500"}`}
          >
            Analytics
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
