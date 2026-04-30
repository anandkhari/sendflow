"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Papa from "papaparse";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function ProspectsPage() {
  const { campaignId } = useParams();

  const [showImportOptions, setShowImportOptions] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [prospects, setProspects] = useState([]);
  const [selected, setSelected] = useState([]);
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [campaignStatus, setCampaignStatus] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const loadProspects = async () => {
    if (!campaignId) return;
    const supabase = createClient();

    const [{ data: prospectsData }, { data: campaignData }] = await Promise.all([
      supabase
        .from("prospects")
        .select("id, email, first_name, last_name, company, created_at")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false }),
      supabase.from("campaigns").select("status").eq("id", campaignId).single(),
    ]);

    if (prospectsData) setProspects(prospectsData);
    if (campaignData) setCampaignStatus(campaignData.status);
  };

  useEffect(() => {
    loadProspects();
  }, [campaignId]);

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );

  const deleteSelected = async () => {
    const supabase = createClient();
    const { error } = await supabase.from("prospects").delete().in("id", selected);
    if (error) {
      toast.error("Failed to delete prospects");
    } else {
      toast.success(`Deleted ${selected.length} prospect${selected.length !== 1 ? "s" : ""}`);
      setSelected([]);
      loadProspects();
    }
  };

  const exportSelected = () => {
    const rows = prospects.filter((p) => selected.includes(p.id));
    const csv =
      "email,first_name,last_name,company\n" +
      rows
        .map((r) => `${r.email},${r.first_name || ""},${r.last_name || ""},${r.company || ""}`)
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "prospects.csv";
    a.click();
  };

  const syncProspects = async () => {
    if (campaignStatus !== "active") {
      toast.error("Campaign must be active to sync prospects");
      return;
    }
    setSyncing(true);
    try {
      const res = await fetch("/api/campaign/reschedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campaignId }),
      });
      const json = await res.json();
      if (json.created > 0) {
        toast.success(`${json.created} job${json.created !== 1 ? "s" : ""} queued for new prospects`);
      } else {
        toast.success("All prospects already have jobs queued");
      }
    } catch {
      toast.error("Failed to sync prospects");
    } finally {
      setSyncing(false);
    }
  };

  const queueJobsIfActive = async () => {
    if (campaignStatus !== "active") return;
    const res = await fetch("/api/campaign/reschedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaignId }),
    });
    const json = await res.json();
    if (json.created > 0) {
      toast.success(`${json.created} job${json.created !== 1 ? "s" : ""} queued for new prospects`);
    }
  };

  const addProspect = async () => {
    if (!campaignId || !email) return;
    const supabase = createClient();
    const { error } = await supabase.from("prospects").insert({
      campaign_id: campaignId,
      email,
      first_name: firstName,
      company,
    });
    if (error) {
      toast.error("Failed to add prospect");
      return;
    }
    toast.success("Prospect added");
    setFirstName("");
    setEmail("");
    setCompany("");
    setShowManualForm(false);
    setShowImportOptions(false);
    loadProspects();
    await queueJobsIfActive();
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file || !campaignId) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const supabase = createClient();
        const rows = results.data
          .filter((r) => r.email)
          .map((r) => ({
            campaign_id: campaignId,
            email: r.email,
            first_name: r.first_name || r.name || "",
            last_name: r.last_name || "",
            company: r.company || "",
          }));

        if (rows.length === 0) {
          toast.error("No valid rows found in CSV (missing email column?)");
          return;
        }

        const { error } = await supabase.from("prospects").upsert(rows, {
          onConflict: "campaign_id,email",
          ignoreDuplicates: true,
        });

        if (error) {
          toast.error("Failed to import prospects");
        } else {
          toast.success(`Imported ${rows.length} prospect${rows.length !== 1 ? "s" : ""}`);
          await queueJobsIfActive();
        }

        setShowImportOptions(false);
        loadProspects();
      },
    });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Prospects</h2>
        <div className="flex gap-2">
          {campaignStatus === "active" && (
            <button
              onClick={syncProspects}
              disabled={syncing}
              className="px-4 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {syncing ? "Syncing..." : "Sync Prospects"}
            </button>
          )}
          <button
            onClick={() => setShowImportOptions(true)}
            className="px-4 py-2 bg-black text-white rounded text-sm"
          >
            Import Prospects
          </button>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="flex gap-3 mt-6">
          <button onClick={exportSelected} className="px-3 py-2 border rounded">
            Export Selected
          </button>
          <button
            onClick={deleteSelected}
            className="px-3 py-2 bg-red-500 text-white rounded"
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* IMPORT MODAL */}
      {showImportOptions && !showManualForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-100 space-y-4">
            <h3 className="text-lg font-semibold">Import Prospects</h3>
            <label className="w-full border rounded-lg p-3 hover:bg-gray-50 text-left block cursor-pointer">
              Upload CSV File
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
            <button
              onClick={() => setShowManualForm(true)}
              className="w-full border rounded-lg p-3 hover:bg-gray-50 text-left"
            >
              Enter Prospects Manually
            </button>
            <button onClick={() => setShowImportOptions(false)} className="text-sm text-gray-500">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* MANUAL FORM */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-125 space-y-4">
            <h3 className="text-lg font-semibold">Add Prospect Manually</h3>
            <input
              type="text"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full border rounded p-3"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-3"
            />
            <input
              type="text"
              placeholder="Company (optional)"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full border rounded p-3"
            />
            <div className="flex justify-between mt-4">
              <button onClick={() => setShowManualForm(false)} className="text-sm text-gray-500">
                Back
              </button>
              <button onClick={addProspect} className="px-4 py-2 bg-black text-white rounded">
                Add Prospect
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROSPECT TABLE */}
      <div className="mt-8 border rounded-xl overflow-hidden bg-white">
        <div className="grid grid-cols-9 text-xs uppercase tracking-wide text-gray-500 bg-gray-50 px-4 py-3">
          <div>
            <input
              type="checkbox"
              onChange={(e) =>
                setSelected(e.target.checked ? prospects.map((p) => p.id) : [])
              }
            />
          </div>
          <div className="col-span-2">Email</div>
          <div>Added</div>
          <div>Status</div>
          <div>Sent</div>
          <div>Opens</div>
          <div>Clicks</div>
          <div>Responses</div>
        </div>

        {prospects.length === 0 && (
          <div className="p-8 text-sm text-gray-400">No prospects added yet.</div>
        )}

        {prospects.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-9 items-center px-4 py-4 text-sm border-t hover:bg-gray-50"
          >
            <div>
              <input
                type="checkbox"
                checked={selected.includes(p.id)}
                onChange={() => toggleSelect(p.id)}
              />
            </div>
            <div className="col-span-2 font-medium text-gray-800">{p.email}</div>
            <div className="text-gray-500">
              {p.created_at ? new Date(p.created_at).toLocaleDateString() : "-"}
            </div>
            <div>
              <span className="px-2 py-1 text-xs bg-gray-100 rounded">draft</span>
            </div>
            <div className="text-gray-400">0</div>
            <div className="text-gray-400">0</div>
            <div className="text-gray-400">0</div>
            <div className="text-gray-400">0</div>
          </div>
        ))}
      </div>
    </div>
  );
}
