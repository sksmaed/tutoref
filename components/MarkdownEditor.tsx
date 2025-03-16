import React, { useState } from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

const mdParser = new MarkdownIt();

interface MarkdownEditorProps {
  initialContent: string;
  onSave: (content: string) => void;
}

const MarkdownEditor = ({ initialContent, onSave }: MarkdownEditorProps) => {
  const [content, setContent] = useState(initialContent);

  const handleEditorChange = ({ text }: { text: string }) => {
    setContent(text);
  };

  const handleSave = () => {
    onSave(content);
  };

  return (
    <div>
      <MdEditor
        value={content}
        style={{ height: '500px' }}
        renderHTML={(text) => mdParser.render(text)}
        onChange={handleEditorChange}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
};

export default MarkdownEditor;