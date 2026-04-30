"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("campaigns")
        .select("id, name, status, created_at")
        .order("created_at", { ascending: false });

      if (data) setCampaigns(data);
    };

    load();
  }, []);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Campaigns</h1>
        <Link
          href="/dashboard/campaigns/new"
          className="px-4 py-2 bg-black text-white rounded"
        >
          + Create Campaign
        </Link>
      </div>

      <div className="space-y-3">
        {campaigns.length === 0 && (
          <p className="text-sm text-gray-400 py-8 text-center">
            No campaigns yet. Create your first one.
          </p>
        )}
        {campaigns.map((campaign) => (
          <Link
            key={campaign.id}
            href={`/dashboard/campaigns/${campaign.id}`}
            className="block border rounded-lg p-4 bg-white hover:bg-gray-50"
          >
            <div className="flex items-center justify-between">
              <p className="font-medium">{campaign.name}</p>
              <span className="text-xs px-2 py-1 bg-gray-100 rounded capitalize">
                {campaign.status}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1">Click to open workspace</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
