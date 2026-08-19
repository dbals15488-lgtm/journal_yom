"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bug, Lightbulb, HelpCircle, ArrowLeft } from "lucide-react";
import { createSupportPost } from "../actions";
import "../support.css";

const CATEGORIES = [
  { key: "bug", label: "버그 신고", icon: Bug, color: "#e53e3e", desc: "앱 사용 중 문제가 발생했어요" },
  { key: "improvement", label: "개선 요청", icon: Lightbulb, color: "#f59e0b", desc: "이런 기능이 있으면 좋겠어요" },
  { key: "question", label: "문의", icon: HelpCircle, color: "#3b82f6", desc: "궁금한 점이 있어요" },
];

export default function SupportWritePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);

    if (!category) {
      setError("카테고리를 선택해주세요.");
      return;
    }
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }
    if (!content.trim()) {
      setError("내용을 입력해주세요.");
      return;
    }

    setIsSubmitting(true);

    const result = await createSupportPost({
      title,
      content,
      category,
    });

    setIsSubmitting(false);

    if (result.success && result.postId) {
      router.push(`/support/${result.postId}`);
    } else {
      setError(result.message ?? "저장 실패");
    }
  };

  return (
    <div className="support-container">
      {/* 뒤로가기 */}
      <Link href="/support" className="support-back-link">
        <ArrowLeft size={16} strokeWidth={2.5} />
        <span>목록으로</span>
      </Link>

      {/* 헤더 */}
      <div className="support-header">
        <div className="support-title-block">
          <h1 className="support-title">새 게시글 작성</h1>
          <p className="support-subtitle">
            작성한 내용은 본인과 관리자만 볼 수 있어요
          </p>
        </div>
      </div>

      {/* 카테고리 선택 */}
      <div className="write-section">
        <div className="write-label">카테고리 *</div>
        <div className="write-category-grid">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`write-category-card ${isActive ? "active" : ""}`}
                style={
                  isActive
                    ? { borderColor: cat.color, background: `${cat.color}15` }
                    : undefined
                }
              >
                <div
                  className="write-category-icon"
                  style={{ background: `${cat.color}20`, color: cat.color }}
                >
                  <Icon size={20} strokeWidth={2} />
                </div>
                <div className="write-category-text">
                  <div className="write-category-title" style={isActive ? { color: cat.color } : undefined}>
                    {cat.label}
                  </div>
                  <div className="write-category-desc">{cat.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 제목 */}
      <div className="write-section">
        <div className="write-label">제목 *</div>
        <input
          type="text"
          className="write-title-input"
          placeholder="제목을 입력해주세요"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={100}
          disabled={isSubmitting}
        />
        <div className="write-char-count">{title.length} / 100</div>
      </div>

      {/* 내용 */}
      <div className="write-section">
        <div className="write-label">내용 *</div>
        <textarea
          className="write-content-input"
          placeholder="자세히 작성해주시면 빠른 답변에 도움이 돼요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
          disabled={isSubmitting}
        />
        <div className="write-char-count">{content.length}자</div>
      </div>

      {/* 에러 메시지 */}
      {error && <div className="write-error">{error}</div>}

      {/* 액션 버튼 */}
      <div className="write-actions">
        <Link href="/support" className="write-cancel-btn">
          취소
        </Link>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !title.trim() || !content.trim() || !category}
          className="write-submit-btn"
        >
          {isSubmitting ? "저장 중..." : "게시글 등록"}
        </button>
      </div>
    </div>
  );
}