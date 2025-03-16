import React, { useState } from "react";
import MDEditor from "@uiw/react-md-editor";

interface MarkdownEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
}

const MarkdownEditor = ({ initialContent, onSave }: MarkdownEditorProps) => {
  const [content, setContent] = useState(initialContent);

  return (
    <div className="container">
      <MDEditor value={content} onChange={(value) => setContent(value || "")} />
      <button onClick={() => onSave(content)} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
        Save
      </button>
    </div>
  );
};

export default MarkdownEditor;