"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white border rounded-xl p-5">
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-3xl font-semibold">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

const STATUS_DOT = {
  active:    "bg-green-500",
  paused:    "bg-yellow-400",
  draft:     "bg-gray-400",
  completed: "bg-blue-400",
};

export default function DashboardPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState([]);
  const [global, setGlobal] = useState({ active: 0, sent: 0, openRate: 0, clickRate: 0 });
  const [loading, setLoading] = useState(true);
  const [workerRunning, setWorkerRunning] = useState(false);

  const runWorker = async () => {
    setWorkerRunning(true);
    try {
      const res = await fetch("/api/worker/run");
      const json = await res.json();
      if (json.success) {
        toast.success("Worker ran — check console for results");
      } else {
        toast.error("Worker failed");
      }
    } catch {
      toast.error("Could not reach worker");
    } finally {
      setWorkerRunning(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();

      const { data: campaignsData } = await supabase
        .from("campaigns")
        .select("id, name, status")
        .order("created_at", { ascending: false });

      if (!campaignsData?.length) {
        setLoading(false);
        return;
      }

      const ids = campaignsData.map((c) => c.id);

      const [{ data: allJobs }, { data: allProspects }] = await Promise.all([
        supabase.from("jobs").select("id, campaign_id, status").in("campaign_id", ids),
        supabase.from("prospects").select("campaign_id").in("campaign_id", ids),
      ]);

      const sentJobIds = (allJobs || []).filter((j) => j.status === "sent").map((j) => j.id);

      const { data: allEvents } = sentJobIds.length > 0
        ? await supabase.from("tracking_events").select("job_id, type").in("job_id", sentJobIds)
        : { data: [] };

      // Per-campaign stats
      const enriched = campaignsData.map((c) => {
        const cJobs = (allJobs || []).filter((j) => j.campaign_id === c.id);
        const cSentIds = new Set(cJobs.filter((j) => j.status === "sent").map((j) => j.id));
        const cEvents = (allEvents || []).filter((e) => cSentIds.has(e.job_id));
        const sent = cSentIds.size;
        const opens = new Set(cEvents.filter((e) => e.type === "open").map((e) => e.job_id)).size;
        const clicks = new Set(cEvents.filter((e) => e.type === "click").map((e) => e.job_id)).size;
        const prospects = (allProspects || []).filter((p) => p.campaign_id === c.id).length;
        return {
          ...c,
          prospects,
          sent,
          opens,
          clicks,
          openRate:  sent > 0 ? Math.round((opens  / sent) * 100) : null,
          clickRate: sent > 0 ? Math.round((clicks / sent) * 100) : null,
        };
      });

      // Global totals
      const totalSent   = sentJobIds.length;
      const totalOpens  = new Set((allEvents || []).filter((e) => e.type === "open").map((e) => e.job_id)).size;
      const totalClicks = new Set((allEvents || []).filter((e) => e.type === "click").map((e) => e.job_id)).size;

      setCampaigns(enriched);
      setGlobal({
        active:    campaignsData.filter((c) => c.status === "active").length,
        sent:      totalSent,
        openRate:  totalSent > 0 ? Math.round((totalOpens  / totalSent) * 100) : 0,
        clickRate: totalSent > 0 ? Math.round((totalClicks / totalSent) * 100) : 0,
      });
      setLoading(false);
    };

    load();
  }, []);

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={runWorker}
          disabled={workerRunning}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {workerRunning ? <Spinner /> : <span>▶</span>}
          {workerRunning ? "Running..." : "Run Worker"}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Campaigns" value={global.active} />
        <StatCard label="Total Sent"        value={global.sent.toLocaleString()} />
        <StatCard label="Avg Open Rate"     value={`${global.openRate}%`} sub="across all campaigns" />
        <StatCard label="Avg Click Rate"    value={`${global.clickRate}%`} sub="across all campaigns" />
      </div>

      {/* Campaign Table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold">Campaigns</h2>
          <button
            onClick={() => router.push("/dashboard/campaigns/new")}
            className="text-sm px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            + New Campaign
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-16 text-center text-gray-400">
            <p className="text-base mb-1">No campaigns yet</p>
            <p className="text-sm">Create your first campaign to get started</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Campaign</th>
                <th className="px-6 py-3 text-right">Prospects</th>
                <th className="px-6 py-3 text-right">Sent</th>
                <th className="px-6 py-3 text-right">Opens</th>
                <th className="px-6 py-3 text-right">Open %</th>
                <th className="px-6 py-3 text-right">Clicks</th>
                <th className="px-6 py-3 text-right">Click %</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => router.push(`/dashboard/campaigns/${c.id}`)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[c.status] || "bg-gray-400"}`} />
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-gray-400 capitalize">{c.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{c.prospects}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{c.sent}</td>
                  <td className="px-6 py-4 text-right text-gray-600">{c.opens}</td>
                  <td className="px-6 py-4 text-right">
                    {c.openRate === null ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <span className={`font-medium ${c.openRate >= 30 ? "text-green-600" : "text-yellow-600"}`}>
                        {c.openRate}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{c.clicks}</td>
                  <td className="px-6 py-4 text-right">
                    {c.clickRate === null ? (
                      <span className="text-gray-300">—</span>
                    ) : (
                      <span className={`font-medium ${c.clickRate >= 5 ? "text-purple-600" : "text-blue-500"}`}>
                        {c.clickRate}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-400 text-base">→</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
