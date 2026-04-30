"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";
import Spinner from "@/components/ui/Spinner";

const DEFAULT_SETTINGS = {
  timezone: "Asia/Kolkata",
  send_start: "09:00",
  send_end: "17:00",
  sending_days: [],
  daily_limit: 30,
  delay_seconds: 60,
  track_opens: true,
  track_clicks: true,
  stop_on_reply: true,
};

export default function SettingsPage() {
  const { campaignId } = useParams();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!campaignId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("campaign_settings")
        .select("*")
        .eq("campaign_id", campaignId)
        .single();

      if (data) {
        setSettings({
          timezone: data.timezone ?? DEFAULT_SETTINGS.timezone,
          // Postgres TIME returns "HH:MM:SS" — slice to "HH:MM" for the time input
          send_start: (data.send_start ?? DEFAULT_SETTINGS.send_start).slice(0, 5),
          send_end: (data.send_end ?? DEFAULT_SETTINGS.send_end).slice(0, 5),
          sending_days: data.sending_days ?? DEFAULT_SETTINGS.sending_days,
          daily_limit: data.daily_limit ?? DEFAULT_SETTINGS.daily_limit,
          delay_seconds: data.delay_seconds ?? DEFAULT_SETTINGS.delay_seconds,
          track_opens: data.track_opens ?? DEFAULT_SETTINGS.track_opens,
          track_clicks: data.track_clicks ?? DEFAULT_SETTINGS.track_clicks,
          stop_on_reply: data.stop_on_reply ?? DEFAULT_SETTINGS.stop_on_reply,
        });
      }
    };

    load();
  }, [campaignId]);

  const update = (key, value) => setSettings((prev) => ({ ...prev, [key]: value }));

  const saveSettings = async () => {
    if (!campaignId) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("campaign_settings").upsert(
      { campaign_id: campaignId, ...settings },
      { onConflict: "campaign_id" }
    );
    setSaving(false);
    if (error) {
      toast.error("Failed to save settings");
    } else {
      toast.success("Settings saved");
    }
  };

  return (
    <div className="space-y-10">
      <h2 className="text-xl font-semibold">Campaign Settings</h2>

      {/* Sending Schedule */}
      <div className="border rounded-xl p-6 space-y-4 bg-white">
        <h3 className="font-semibold">Sending Schedule</h3>

        <div>
          <p className="text-sm mb-1">Timezone</p>
          <select
            value={settings.timezone}
            onChange={(e) => update("timezone", e.target.value)}
            className="border rounded p-2 w-full"
          >
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="UTC">UTC</option>
            <option value="America/New_York">America/New_York</option>
            <option value="Europe/London">Europe/London</option>
          </select>
        </div>

        <div className="flex gap-4">
          <div>
            <p className="text-sm mb-1">Send Window Start</p>
            <input
              type="time"
              value={settings.send_start}
              onChange={(e) => update("send_start", e.target.value)}
              className="border rounded p-2"
            />
          </div>
          <div>
            <p className="text-sm mb-1">Send Window End</p>
            <input
              type="time"
              value={settings.send_end}
              onChange={(e) => update("send_end", e.target.value)}
              className="border rounded p-2"
            />
          </div>
        </div>

        <div>
          <p className="text-sm mb-2">Sending Days</p>
          <div className="flex flex-wrap gap-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <label key={day} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={(settings.sending_days || []).includes(day)}
                  onChange={(e) => {
                    const current = settings.sending_days || [];
                    update(
                      "sending_days",
                      e.target.checked
                        ? [...current, day]
                        : current.filter((d) => d !== day)
                    );
                  }}
                />
                {day}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Sending Limits */}
      <div className="border rounded-xl p-6 space-y-4 bg-white">
        <h3 className="font-semibold">Sending Limits</h3>
        <div>
          <p className="text-sm mb-1">Daily Limit</p>
          <input
            type="number"
            value={settings.daily_limit}
            onChange={(e) => update("daily_limit", Number(e.target.value))}
            className="border rounded p-2 w-full"
          />
        </div>
        <div>
          <p className="text-sm mb-1">Delay Between Emails (seconds)</p>
          <input
            type="number"
            value={settings.delay_seconds}
            onChange={(e) => update("delay_seconds", Number(e.target.value))}
            className="border rounded p-2 w-full"
          />
        </div>
      </div>

      {/* Tracking */}
      <div className="border rounded-xl p-6 space-y-4 bg-white">
        <h3 className="font-semibold">Tracking</h3>
        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={settings.track_opens}
            onChange={(e) => update("track_opens", e.target.checked)}
          />
          Track Opens
        </label>
        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={settings.track_clicks}
            onChange={(e) => update("track_clicks", e.target.checked)}
          />
          Track Clicks
        </label>
        <label className="flex gap-3 items-center">
          <input
            type="checkbox"
            checked={settings.stop_on_reply}
            onChange={(e) => update("stop_on_reply", e.target.checked)}
          />
          Stop Followups On Reply
        </label>
      </div>

      <button
        onClick={saveSettings}
        disabled={saving}
        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving && <Spinner />}
        {saving ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
