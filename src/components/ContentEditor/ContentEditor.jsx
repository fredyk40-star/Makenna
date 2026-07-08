import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaPlus, FaSave, FaTrash, FaUndo, FaRedo, FaBold, FaItalic, FaUnderline, FaListOl, FaListUl, FaHeading, FaImage, FaPalette, FaCode, FaEye, FaEdit, FaTimes } from 'react-icons/fa';

const ContentEditorComponent = ({ initialContent = 
  `<h1>Welcome to the Interactive Content Editor!</h1>
<p>Use this editor to create rich learning content with text, images, and more.</p>
<p><b>Bold</b>, <i>italic</i>, <u>underline</u>, and lists are all supported.</p>
<img src="https://via.placeholder.com/150" alt="placeholder"/>
<p>You can also insert code snippets:</p>
<pre><code>function greet() {
  console.log("Hello, Makenna!");
}</code></pre>
`,
  onSave }) => {
  const [content, setContent] = useState(initialContent);
  const [history, setHistory] = useState([initialContent]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [previewMode, setPreviewMode] = useState(false);
  const editorRef = useRef(null);

  const applyFormat = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    setContent(editorRef.current.innerHTML);
  }, []);

  const handleInput = useCallback(() => {
    const newContent = editorRef.current.innerHTML;
    if (newContent !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1);
      setHistory([...newHistory, newContent]);
      setHistoryIndex(newHistory.length);
    }
    setContent(newContent);
  }, [history, historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setContent(history[historyIndex - 1]);
      setHistoryIndex(prev => prev - 1);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setContent(history[historyIndex + 1]);
      setHistoryIndex(prev => prev + 1);
    }
  }, [history, historyIndex]);

  const insertHtml = useCallback((html) => {
    const selection = window.getSelection();
    if (selection.getRangeAt && selection.rangeCount) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement("div");
      el.innerHTML = html;
      const frag = document.createDocumentFragment();
      let node, lastNode;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        range.setStartAfter(lastNode);
        range.collapse(true);
      }
      selection.removeAllRanges();
      selection.addRange(range);
    }
    handleInput(); // Update content and history
  }, [handleInput]);

  const insertImage = useCallback(() => {
    const url = prompt("Enter image URL:");
    if (url) {
      applyFormat("insertImage", url);
    }
  }, [applyFormat]);

  const insertCodeBlock = useCallback(() => {
    insertHtml("<pre><code>// Your code here</code></pre>");
  }, [insertHtml]);

  const handleSave = () => {
    onSave?.(content);
    alert("Content saved!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-soft p-6"
    >
      <h2 className="text-2xl font-bold font-baloo mb-4 text-gray-800 dark:text-white">
        Interactive Content Editor <FaEdit className="inline-block ml-2 text-purple-500" />
      </h2>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
        <button onClick={() => applyFormat("bold")} className="toolbar-btn" title="Bold"><FaBold /></button>
        <button onClick={() => applyFormat("italic")} className="toolbar-btn" title="Italic"><FaItalic /></button>
        <button onClick={() => applyFormat("underline")} className="toolbar-btn" title="Underline"><FaUnderline /></button>
        <span className="border-l border-gray-300 dark:border-gray-600 mx-2"></span>
        <button onClick={() => applyFormat("insertOrderedList")} className="toolbar-btn" title="Ordered List"><FaListOl /></button>
        <button onClick={() => applyFormat("insertUnorderedList")} className="toolbar-btn" title="Unordered List"><FaListUl /></button>
        <span className="border-l border-gray-300 dark:border-gray-600 mx-2"></span>
        <button onClick={() => applyFormat("formatBlock", "H1")} className="toolbar-btn" title="Heading 1"><FaHeading />1</button>
        <button onClick={() => applyFormat("formatBlock", "H2")} className="toolbar-btn" title="Heading 2"><FaHeading />2</button>
        <button onClick={insertImage} className="toolbar-btn" title="Insert Image"><FaImage /></button>
        <button onClick={insertCodeBlock} className="toolbar-btn" title="Insert Code Block"><FaCode /></button>
        <span className="border-l border-gray-300 dark:border-gray-600 mx-2"></span>
        <button onClick={undo} disabled={historyIndex === 0} className="toolbar-btn" title="Undo"><FaUndo /></button>
        <button onClick={redo} disabled={historyIndex === history.length - 1} className="toolbar-btn" title="Redo"><FaRedo /></button>
        <span className="border-l border-gray-300 dark:border-gray-600 mx-2"></span>
        <button onClick={() => setPreviewMode(!previewMode)} className="toolbar-btn" title="Toggle Preview">
          {previewMode ? <FaEdit /> : <FaEye />}
        </button>
        <button onClick={handleSave} className="toolbar-btn bg-green-500 text-white hover:bg-green-600" title="Save"><FaSave /> Save</button>
      </div>

      {/* Editor Area */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {previewMode ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="editor-output p-4 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[300px] bg-gray-50 dark:bg-gray-700 prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              ref={editorRef}
              contentEditable={true}
              onInput={handleInput}
              className="editor-input p-4 border border-gray-300 dark:border-gray-600 rounded-lg min-h-[300px] focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: content }}
              suppressContentEditableWarning={true}
            />
          )}
        </AnimatePresence>
      </div>

      <style jsx>{`
        .toolbar-btn {
          padding: 8px 12px;
          border-radius: 8px;
          background-color: #e5e7eb; /* Light gray */
          color: #1f2937; /* Dark gray */
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease-in-out;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }
        .toolbar-btn:hover {
          background-color: #d1d5db; /* Slightly darker gray */
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transform: translateY(-1px);
        }
        .dark .toolbar-btn {
          background-color: #374151; /* Darker gray for dark mode */
          color: #d1d5db; /* Light gray for text */
        }
        .dark .toolbar-btn:hover {
          background-color: #4b5563; /* Even darker gray on hover */
        }
        .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .editor-input::-webkit-scrollbar {
          width: 8px;
        }
        .editor-input::-webkit-scrollbar-track {
          background: #f1f1f1; /* Light gray scrollbar track */
          border-radius: 10px;
        }
        .editor-input::-webkit-scrollbar-thumb {
          background: #888; /* Darker gray scrollbar thumb */
          border-radius: 10px;
        }
        .dark .editor-input::-webkit-scrollbar-track {
          background: #1f2937; /* Darker scrollbar track for dark mode */
        }
        .dark .editor-input::-webkit-scrollbar-thumb {
          background: #555; /* Lighter scrollbar thumb for dark mode */
        }

        .prose {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
        }
        .dark .prose {
          color: #eee;
        }
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          font-family: "Baloo 2", cursive;
          font-weight: 700;
          color: #1f2937;
        }
        .dark .prose h1, .dark .prose h2, .dark .prose h3, .dark .prose h4, .dark .prose h5, .dark .prose h6 {
          color: #eee;
        }
        .prose p {
          margin-bottom: 1em;
        }
        .prose ul, .prose ol {
          margin-left: 1.5em;
          margin-bottom: 1em;
        }
        .prose img {
          max-width: 100%;
          height: auto;
          display: block;
          margin: 1em 0;
          border-radius: 8px;
        }
        .prose pre {
          background-color: #f3f4f6;
          padding: 1em;
          border-radius: 8px;
          overflow-x: auto;
        }
        .dark .prose pre {
          background-color: #1f2937;
        }
        .prose code {
          font-family: monospace;
          color: #c026d3; /* purple-600 */
        }
        .dark .prose code {
          color: #e879f9; /* purple-400 */
        }
      `}</style>
    </motion.div>
  );
};

export default ContentEditorComponent;