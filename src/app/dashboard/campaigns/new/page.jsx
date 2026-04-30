"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const createCampaign = async () => {
    if (!name.trim()) return;
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("campaigns")
      .insert({ name: name.trim(), status: "draft", user_id: user.id })
      .select("id")
      .single();

    if (error) {
      toast.error("Failed to create campaign. Please try again.");
      setLoading(false);
      return;
    }

    toast.success("Campaign created");
    router.push(`/dashboard/campaigns/${data.id}`);
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Create New Campaign</h1>

      <input
        type="text"
        placeholder="Campaign Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && createCampaign()}
        className="w-full border p-3 rounded mb-4 outline-none focus:border-black transition-colors"
      />

      <button
        onClick={createCampaign}
        disabled={loading || !name.trim()}
        className="px-4 py-2 bg-black text-white rounded disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create Campaign"}
      </button>
    </div>
  );
}
