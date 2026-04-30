"use client";

export default function EditorToolbar({ editor }) {
  if (!editor) return null;

  return (
    <div className="flex gap-2 border-b p-2 bg-gray-50 text-sm">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`px-2 py-1 rounded ${
          editor.isActive("bold") ? "bg-gray-300" : "bg-white"
        }`}
      >
        Bold
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`px-2 py-1 rounded ${
          editor.isActive("italic") ? "bg-gray-300" : "bg-white"
        }`}
      >
        Italic
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className="px-2 py-1 rounded bg-white"
      >
        Bullet List
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className="px-2 py-1 rounded bg-white"
      >
        Numbered List
      </button>

      <button
        onClick={() => {
          const url = window.prompt("Enter URL");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        }}
        className="px-2 py-1 rounded bg-white"
      >
        Link
      </button>

      <button
        onClick={() =>
          editor.chain().focus().insertContent("{{FIRST_NAME}}").run()
        }
        className="px-2 py-1 rounded bg-white"
      >
        Variable
      </button>
    </div>
  );
}
