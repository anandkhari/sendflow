"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";

export default function StepsPage() {
  const { id } = useParams(); // campaignId from route

  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  // 🔥 Fetch Steps
  async function fetchSteps() {
    if (!id) return;

    try {
      const q = query(
        collection(db, "campaigns", id, "steps"),
        orderBy("order", "asc")
      );

      const snapshot = await getDocs(q);

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSteps(data);
    } catch (err) {
      console.error("Error fetching steps:", err);
    }
  }

  // 🚀 Create New Step
  async function createStep() {
    if (!id) return;

    try {
      setLoading(true);

      const nextOrder = steps.length + 1;

      await addDoc(collection(db, "campaigns", id, "steps"), {
        order: nextOrder,
        type: "email",
        subject: `Step ${nextOrder}`,
        body: "",
        delayDays: nextOrder === 1 ? 0 : 2,
        createdAt: new Date(),
      });

      await fetchSteps();
    } catch (err) {
      console.error("Error creating step:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✏️ Update Delay Days
  async function updateDelay(stepId, value) {
    if (!id) return;

    const delayValue = Number(value);

    try {
      const ref = doc(db, "campaigns", id, "steps", stepId);

      await updateDoc(ref, {
        delayDays: delayValue,
      });

      // 🔥 Update UI instantly without refetch
      setSteps((prev) =>
        prev.map((s) =>
          s.id === stepId ? { ...s, delayDays: delayValue } : s
        )
      );
    } catch (err) {
      console.error("Error updating delay:", err);
    }
  }

  useEffect(() => {
    fetchSteps();
  }, [id]);

  return (
    <div className="p-8 text-white">
      <h1 className="text-2xl font-bold mb-6">Campaign Steps</h1>

      {/* ➕ Add Step Button */}
      <button
        onClick={createStep}
        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-6"
      >
        {loading ? "Creating..." : "Add Step"}
      </button>

      {/* 📩 Steps List */}
      <div className="space-y-4">
        {steps.length === 0 && (
          <p className="text-gray-400">No steps yet.</p>
        )}

        {steps.map((step) => (
          <div
            key={step.id}
            className="border border-gray-700 rounded p-4"
          >
            <p className="font-semibold">
              Step {step.order} — {step.type}
            </p>

            <p className="text-sm text-gray-400">
              Subject: {step.subject || "No subject"}
            </p>

            {/* ⭐ Editable Delay */}
            <div className="mt-2">
              <label className="text-xs text-gray-400">
                Delay (days)
              </label>

              <input
                type="number"
                value={step.delayDays}
                onChange={(e) =>
                  updateDelay(step.id, e.target.value)
                }
                className="mt-1 w-24 bg-gray-900 border border-gray-700 rounded px-2 py-1"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}