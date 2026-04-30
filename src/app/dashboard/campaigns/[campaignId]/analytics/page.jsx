"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const FILTERS = ["All", "Opened", "Not Opened", "Clicked", "Failed"];

function CellBadge({ job }) {
  if (!job) return <span className="text-gray-300 text-xs">—</span>;
  if (job.clicked)
    return <span className="inline-block px-2 py-0.5 rounded text-xs bg-purple-100 text-purple-700 font-medium">Clicked</span>;
  if (job.opened)
    return <span className="inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-700 font-medium">Opened</span>;
  if (job.status === "sent")
    return <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-500">Sent</span>;
  if (job.status === "failed")
    return <span className="inline-block px-2 py-0.5 rounded text-xs bg-red-100 text-red-600">Failed</span>;
  if (job.status === "pending")
    return <span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-400">Pending</span>;
  return <span className="text-gray-300 text-xs">—</span>;
}

export default function AnalyticsPage() {
  const { campaignId } = useParams();

  const [steps, setSteps] = useState([]);
  const [prospects, setProspects] = useState([]);
  const [jobMap, setJobMap] = useState({});
  const [stepStats, setStepStats] = useState([]);
  const [globalStats, setGlobalStats] = useState({ sent: 0, opened: 0, clicked: 0, failed: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!campaignId) return;

    const load = async () => {
      const supabase = createClient();

      const [{ data: stepsData }, { data: prospectsData }, { data: jobsData }] = await Promise.all([
        supabase.from("steps").select("id, step_order, subject").eq("campaign_id", campaignId).order("step_order"),
        supabase.from("prospects").select("id, email").eq("campaign_id", campaignId),
        supabase
          .from("jobs")
          .select("id, prospect_id, step_id, status, email, sent_at, tracking_events(event_type, created_at)")
          .eq("campaign_id", campaignId),
      ]);

      const jobs = jobsData || [];
      const stepsArr = stepsData || [];
      const prospectsArr = prospectsData || [];

      // jobMap[prospect_id][step_id] = { status, opened, clicked, openedAt, clickedAt }
      const map = {};
      for (const job of jobs) {
        if (!map[job.prospect_id]) map[job.prospect_id] = {};
        const events = job.tracking_events || [];
        const opens  = events.filter((e) => e.event_type === "open");
        const clicks = events.filter((e) => e.event_type === "click");
        map[job.prospect_id][job.step_id] = {
          status:   job.status,
          sent_at:  job.sent_at,
          opened:   opens.length > 0,
          clicked:  clicks.length > 0,
          openedAt: opens[0]?.created_at  || null,
          clickedAt: clicks[0]?.created_at || null,
        };
      }

      // Per-step breakdown
      const stats = stepsArr.map((step) => {
        const sJobs  = jobs.filter((j) => j.step_id === step.id);
        const sent   = sJobs.filter((j) => j.status === "sent").length;
        const opened = sJobs.filter((j) => (j.tracking_events || []).some((e) => e.event_type === "open")).length;
        const clicked = sJobs.filter((j) => (j.tracking_events || []).some((e) => e.event_type === "click")).length;
        return {
          ...step,
          sent,
          opened,
          clicked,
          openRate:  sent > 0 ? Math.round((opened  / sent) * 100) : null,
          clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : null,
        };
      });

      // Global totals
      const totalSent   = jobs.filter((j) => j.status === "sent").length;
      const totalOpened = jobs.filter((j) => (j.tracking_events || []).some((e) => e.event_type === "open")).length;
      const totalClicked = jobs.filter((j) => (j.tracking_events || []).some((e) => e.event_type === "click")).length;
      const totalFailed  = jobs.filter((j) => j.status === "failed").length;

      // Recent activity feed — last 20 events across all jobs, newest first
      const activity = jobs
        .flatMap((job) =>
          (job.tracking_events || []).map((ev) => ({
            email:     job.email,
            type:      ev.event_type,
            stepOrder: stepsArr.find((s) => s.id === job.step_id)?.step_order ?? 1,
            createdAt: ev.created_at,
          }))
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);

      setSteps(stepsArr);
      setProspects(prospectsArr);
      setJobMap(map);
      setStepStats(stats);
      setGlobalStats({ sent: totalSent, opened: totalOpened, clicked: totalClicked, failed: totalFailed });
      setRecentActivity(activity);
      setLoading(false);
    };

    load();
  }, [campaignId]);

  const filteredProspects = prospects.filter((p) => {
    if (filter === "All") return true;
    const pJobs = steps.map((s) => jobMap[p.id]?.[s.id]).filter(Boolean);
    if (filter === "Opened")     return pJobs.some((j) => j.opened);
    if (filter === "Not Opened") return pJobs.some((j) => j.status === "sent" && !j.opened);
    if (filter === "Clicked")    return pJobs.some((j) => j.clicked);
    if (filter === "Failed")     return pJobs.some((j) => j.status === "failed");
    return true;
  });

  if (loading) return <div className="p-8 text-gray-400 text-sm">Loading analytics...</div>;

  const openRate = globalStats.sent > 0
    ? Math.round((globalStats.opened / globalStats.sent) * 100)
    : null;

  return (
    <div className="space-y-6">

      {/* Global stat tiles */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Sent",      value: globalStats.sent,    color: "text-gray-800"   },
          { label: "Opened",    value: globalStats.opened,  color: "text-green-600"  },
          { label: "Open Rate", value: openRate !== null ? `${openRate}%` : "—", color: "text-green-600" },
          { label: "Clicked",   value: globalStats.clicked, color: "text-purple-600" },
          { label: "Failed",    value: globalStats.failed,  color: "text-red-500"    },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white border rounded-xl p-4 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-2xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Step breakdown */}
      {stepStats.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold">Step Breakdown</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Step</th>
                <th className="px-6 py-3 text-right">Sent</th>
                <th className="px-6 py-3 text-right">Opened</th>
                <th className="px-6 py-3 text-right">Open Rate</th>
                <th className="px-6 py-3 text-right">Clicked</th>
                <th className="px-6 py-3 text-right">Click Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stepStats.map((step) => (
                <tr key={step.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">
                    {step.step_order === 1 ? "Initial Email" : `Followup ${step.step_order - 1}`}
                    {step.subject && (
                      <span className="ml-2 text-xs text-gray-400 font-normal">— {step.subject}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600">{step.sent}</td>
                  <td className="px-6 py-4 text-right text-green-600">{step.opened}</td>
                  <td className="px-6 py-4 text-right font-medium text-green-600">
                    {step.openRate !== null ? `${step.openRate}%` : "—"}
                  </td>
                  <td className="px-6 py-4 text-right text-purple-600">{step.clicked}</td>
                  <td className="px-6 py-4 text-right font-medium text-purple-600">
                    {step.clickRate !== null ? `${step.clickRate}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prospect engagement table */}
      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">
            Prospects
            <span className="ml-2 text-sm text-gray-400 font-normal">{filteredProspects.length}</span>
          </h3>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                  filter === f ? "bg-black text-white" : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-400 uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3 text-left">Email</th>
                {steps.map((s) => (
                  <th key={s.id} className="px-4 py-3 text-center whitespace-nowrap">
                    {s.step_order === 1 ? "Initial" : `Followup ${s.step_order - 1}`}
                  </th>
                ))}
                <th className="px-6 py-3 text-right whitespace-nowrap">Last Activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredProspects.length === 0 ? (
                <tr>
                  <td
                    colSpan={steps.length + 2}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    No prospects match this filter
                  </td>
                </tr>
              ) : (
                filteredProspects.map((p) => {
                  const pJobs = steps.map((s) => jobMap[p.id]?.[s.id]);
                  const lastActivity = pJobs
                    .flatMap((j) => (j ? [j.clickedAt, j.openedAt].filter(Boolean) : []))
                    .sort((a, b) => new Date(b) - new Date(a))[0];

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3 font-mono text-xs text-gray-700">{p.email}</td>
                      {steps.map((s) => (
                        <td key={s.id} className="px-4 py-3 text-center">
                          <CellBadge job={jobMap[p.id]?.[s.id]} />
                        </td>
                      ))}
                      <td className="px-6 py-3 text-right text-xs text-gray-400">
                        {timeAgo(lastActivity)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent activity feed */}
      {recentActivity.length > 0 && (
        <div className="bg-white border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="font-semibold">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {recentActivity.map((ev, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-3 text-sm">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    ev.event_type === "open"
                      ? "bg-green-100 text-green-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {ev.event_type === "open" ? "Opened" : "Clicked"}
                </span>
                <span className="font-mono text-xs text-gray-700">{ev.email}</span>
                <span className="text-xs text-gray-400">
                  Step {ev.stepOrder}
                </span>
                <span className="ml-auto text-xs text-gray-400">{timeAgo(ev.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
