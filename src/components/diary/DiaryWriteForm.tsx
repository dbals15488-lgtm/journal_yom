"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(
  async () => {
    const { default: MQ } = await import("react-quill-new");
    return MQ;
  },
  {
    ssr: false,
    loading: () => <p>에디터를 로딩 중입니다...</p>,
  },
);

const modules = {
  toolbar: {
    container: [
      ["htmlEdit"],
      [{ font: [] }, { size: [] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ script: "sub" }, { script: "super" }],
      [{ header: "1" }, { header: "2" }, "blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }, { align: [] }],
      ["link", "image", "video"],
      ["clean"],
    ],
  },
};

const formats = [
  "font", "size", "bold", "italic", "underline", "strike", "color", "background",
  "script", "header", "blockquote", "code-block", "list", "indent", "direction",
  "align", "link", "image", "video",
];

interface DiaryWriteFormProps {
  title: string;
  content: string;
  selectedFile: File[];
  onTitleChange: (val: string) => void;
  onContentChange: (val: string) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileRemove: (idx: number) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function DiaryWriteForm({
  title,
  content,
  selectedFile,
  onTitleChange,
  onContentChange,
  onFileChange,
  onFileRemove,
  onSave,
  onCancel,
}: DiaryWriteFormProps) {
  const [isHtmlMode, setIsHtmlMode] = useState(false);

  const formatHtmlSource = (htmlString: string) => {
    if (!htmlString) return "";
    return htmlString
      .replace(/\n/g, "")
      .replace(/(<\/p>|<\/div>|<\/h1>|<\/h2>|<\/blockquote>|<\/pre>|<br\s*\/?>)/gi, "$1\n")
      .replace(/(<p>|<p\s[^>]*>|<div>|<div\s[^>]*>|<h1>|<h2>|<blockquote>|<pre>)/gi, "\n$1")
      .replace(/\n+/g, "\n")
      .trim();
  };

  const toggleHtmlMode = () => {
    setIsHtmlMode((prev) => {
      const nextMode = !prev;
      if (nextMode) {
        onContentChange(formatHtmlSource(content));
      }
      return nextMode;
    });
  };

  if (modules.toolbar && !(modules.toolbar as Record<string, unknown>).handlers) {
    (modules.toolbar as Record<string, unknown>).handlers = {
      htmlEdit: toggleHtmlMode,
    };
  }

  return (
    <section className="write-section">
      <div className="write-header">
        <h2 className="write-heading">일지 작성하기</h2>
      </div>
      <input
        type="text"
        placeholder="제목을 입력해주세요"
        className="write-title"
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
      />

      <div className={`editor-wrapper ${isHtmlMode ? "html-mode" : ""}`}>
        {isHtmlMode ? (
          <div>
            <div className="ql-toolbar ql-snow html-editor-toolbar">
              <button type="button" className="ql-htmlEdit" onClick={toggleHtmlMode} />
            </div>
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              className="html-textarea"
              placeholder="HTML 소스코드를 입력해 주세요."
            />
            <div className="html-spacer" />
          </div>
        ) : (
          <ReactQuill
            theme="snow"
            value={content}
            onChange={onContentChange}
            modules={modules}
            formats={formats}
            className="quill-editor"
          />
        )}
      </div>

      <div className="write-footer">
        <div className="file_upload_box">
          <div className="file-list file-list-area">
            {selectedFile.map((file, idx) => (
              <div key={idx} className="file-item">
                📄 {file.name}
                <button
                  type="button"
                  onClick={() => onFileRemove(idx)}
                  className="file-remove-btn"
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
          <input type="file" className="file-upload" onChange={onFileChange} />
          <span className="file-warning">*파일은 5MB 이하, 최대 3개까지 등록이 가능합니다.</span>
        </div>

        <div>
          <button className="view-btn save-btn-gap" onClick={onSave}>저장하기</button>
          <button className="delete-btn" onClick={onCancel}>취소</button>
        </div>
      </div>
    </section>
  );
}
