"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import EditorToolbar from "./EditorToolbar";
import Spinner from "@/components/ui/Spinner";
import { createClient } from "@/lib/supabase";
import { toast } from "sonner";

export default function EmailEditor({ campaignId, step }) {
  const [subject, setSubject] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: "Start writing your email..." }),
    ],
    content: "<p></p>",
    editorProps: {
      attributes: { class: "min-h-[300px] outline-none text-sm leading-relaxed p-4" },
    },
  });

  useEffect(() => {
    const load = async () => {
      if (!editor || !campaignId || !step) return;
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("steps")
          .select("subject, body, content_json")
          .eq("id", step)
          .single();

        if (data) {
          setSubject(data.subject || "");
          if (data.content_json) {
            editor.commands.setContent(data.content_json);
          } else if (data.body) {
            editor.commands.setContent(data.body);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [editor, campaignId, step]);

  const saveEmail = async () => {
    if (!editor || !campaignId || !step || saving) return;
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("steps")
      .update({
        subject,
        body: editor.getHTML(),
        content_json: editor.getJSON(),
      })
      .eq("id", step);

    if (error) {
      toast.error("Failed to save email");
    } else {
      toast.success("Email saved");
    }
    setSaving(false);
  };

  if (!editor || loading) return null;

  return (
    <div className="border rounded-xl overflow-hidden bg-white">
      <div className="border-b p-4">
        <input
          type="text"
          placeholder="Email subject..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full outline-none text-lg font-medium"
        />
      </div>

      <EditorToolbar editor={editor} />

      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      <div className="border-t p-4 flex justify-end">
        <button
          onClick={saveEmail}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <Spinner />}
          {saving ? "Saving..." : "Save Email"}
        </button>
      </div>
    </div>
  );
}
