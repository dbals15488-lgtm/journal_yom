"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Bug,
  Lightbulb,
  HelpCircle,
  ArrowLeft,
  Trash2,
  Lock,
  CheckCircle2,
  Clock,
  XCircle,
  MessageSquare,
} from "lucide-react";
import {
  fetchSupportPostDetail,
  deleteSupportPost,
  submitAdminAnswer,
  updatePostStatus,
  type SupportPostDetail,
} from "../actions";
import "../support.css";

const CATEGORY_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  bug: { icon: Bug, label: "버그 신고", color: "#e53e3e" },
  improvement: { icon: Lightbulb, label: "개선 요청", color: "#f59e0b" },
  question: { icon: HelpCircle, label: "문의", color: "#3b82f6" },
};

const STATUS_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  pending: { icon: Clock, label: "대기 중", color: "#94a3b8" },
  answered: { icon: CheckCircle2, label: "답변 완료", color: "#10b981" },
  closed: { icon: XCircle, label: "종료", color: "#64748b" },
};

export default function SupportDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = parseInt(params.id as string, 10);

  const [post, setPost] = useState<SupportPostDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 관리자 답변 입력 상태
  const [answerText, setAnswerText] = useState("");
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (isNaN(postId)) {
      setError("잘못된 게시글 번호입니다.");
      return;
    }

    const load = async () => {
      const result = await fetchSupportPostDetail(postId);
      if (result.success && result.data) {
        setPost(result.data);
        if (result.data.answer) setAnswerText(result.data.answer);
      } else {
        setError(result.message ?? "불러오기 실패");
      }
    };
    load();
  }, [postId]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까? 되돌릴 수 없어요.")) return;

    setIsDeleting(true);
    const result = await deleteSupportPost(postId);
    setIsDeleting(false);

    if (result.success) {
      router.push("/support");
    } else {
      alert(result.message ?? "삭제 실패");
    }
  };

  const handleAnswerSubmit = async () => {
    if (!answerText.trim()) {
      alert("답변 내용을 입력해주세요.");
      return;
    }

    setIsSubmittingAnswer(true);
    const result = await submitAdminAnswer(postId, answerText);
    setIsSubmittingAnswer(false);

    if (result.success) {
      // 새로고침
      const refreshed = await fetchSupportPostDetail(postId);
      if (refreshed.success && refreshed.data) {
        setPost(refreshed.data);
      }
    } else {
      alert(result.message ?? "답변 저장 실패");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    const result = await updatePostStatus(postId, newStatus);
    setIsUpdatingStatus(false);

    if (result.success) {
      const refreshed = await fetchSupportPostDetail(postId);
      if (refreshed.success && refreshed.data) {
        setPost(refreshed.data);
      }
    } else {
      alert(result.message ?? "상태 변경 실패");
    }
  };

  // 에러 상태
  if (error) {
    return (
      <div className="support-container">
        <Link href="/support" className="support-back-link">
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>목록으로</span>
        </Link>
        <div className="detail-error-card">
          <Lock size={32} strokeWidth={1.5} />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // 로딩 상태
  if (!post) {
    return (
      <div className="support-container">
        <Link href="/support" className="support-back-link">
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>목록으로</span>
        </Link>
        <div className="detail-loading">불러오는 중...</div>
      </div>
    );
  }

  const category = CATEGORY_META[post.category] ?? CATEGORY_META.question;
  const statusMeta = STATUS_META[post.status] ?? STATUS_META.pending;
  const CategoryIcon = category.icon;
  const StatusIcon = statusMeta.icon;

  return (
    <div className="support-container">
      {/* 뒤로가기 */}
      <Link href="/support" className="support-back-link">
        <ArrowLeft size={16} strokeWidth={2.5} />
        <span>목록으로</span>
      </Link>

      {/* 게시글 카드 */}
      <div className="detail-card">
        {/* 상단: 카테고리 + 상태 */}
        <div className="detail-top-row">
          <div
            className="support-category-badge"
            style={{ background: `${category.color}20`, color: category.color }}
          >
            <CategoryIcon size={14} strokeWidth={2} />
            <span>{category.label}</span>
          </div>
          <div className="support-status-badge" style={{ color: statusMeta.color }}>
            <StatusIcon size={14} strokeWidth={2} />
            <span>{statusMeta.label}</span>
          </div>
        </div>

        {/* 제목 */}
        <h1 className="detail-title">{post.title}</h1>

        {/* 작성자 정보 */}
        <div className="detail-meta">
          <div className="detail-author">
            <span className="support-author-badge">{post.authorInitial}</span>
            <span className="detail-author-name">
              {post.isMine ? `${post.authorName} (본인)` : post.isAdmin ? post.authorName : "익명"}
            </span>
          </div>
          <div className="detail-date">
            {format(new Date(post.createdAt), "yyyy년 M월 d일 HH:mm", { locale: ko })}
          </div>
        </div>

        {/* 내용 */}
        <div className="detail-content">{post.content}</div>

        {/* 하단: 삭제 버튼 (본인 or 관리자) */}
        {(post.isMine || post.isAdmin) && (
          <div className="detail-actions">
            <button onClick={handleDelete} disabled={isDeleting} className="detail-delete-btn">
              <Trash2 size={14} strokeWidth={2} />
              <span>{isDeleting ? "삭제 중..." : "삭제"}</span>
            </button>
          </div>
        )}
      </div>

      {/* 관리자 답변 카드 (답변 있으면 표시) */}
      {post.answer && (
        <div className="detail-answer-card">
          <div className="detail-answer-header">
            <div className="detail-answer-badge">
              <MessageSquare size={14} strokeWidth={2} />
              <span>관리자 답변</span>
            </div>
            {post.answeredAt && (
              <div className="detail-date">
                {format(new Date(post.answeredAt), "yyyy년 M월 d일 HH:mm", { locale: ko })}
              </div>
            )}
          </div>
          <div className="detail-answer-content">{post.answer}</div>
        </div>
      )}

      {/* 관리자 전용: 답변 입력 & 상태 변경 */}
      {post.isAdmin && (
        <div className="detail-admin-panel">
          <div className="detail-admin-header">
            <h3 className="detail-admin-title">🔧 관리자 도구</h3>
          </div>

          {/* 답변 작성 */}
          <div className="write-section">
            <div className="write-label">
              {post.answer ? "답변 수정" : "답변 작성"}
            </div>
            <textarea
              className="write-content-input"
              placeholder="답변을 작성해주세요"
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              rows={6}
              disabled={isSubmittingAnswer}
            />
            <div className="detail-admin-actions">
              <button
                onClick={handleAnswerSubmit}
                disabled={isSubmittingAnswer || !answerText.trim()}
                className="write-submit-btn"
              >
                {isSubmittingAnswer ? "저장 중..." : post.answer ? "답변 수정" : "답변 등록"}
              </button>
            </div>
          </div>

          {/* 상태 변경 */}
          <div className="write-section">
            <div className="write-label">상태 변경</div>
            <div className="detail-status-buttons">
              {Object.entries(STATUS_META).map(([key, meta]) => {
                const Icon = meta.icon;
                const isActive = post.status === key;
                return (
                  <button
                    key={key}
                    onClick={() => handleStatusChange(key)}
                    disabled={isUpdatingStatus || isActive}
                    className={`detail-status-btn ${isActive ? "active" : ""}`}
                    style={isActive ? { color: meta.color, borderColor: meta.color } : undefined}
                  >
                    <Icon size={14} strokeWidth={2} />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}