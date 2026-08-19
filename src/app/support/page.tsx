"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Bug, Lightbulb, HelpCircle, Plus, CheckCircle2, Clock, XCircle, User } from "lucide-react";
import { fetchSupportPosts, type SupportPostSummary } from "./actions";
import "./support.css";

// 카테고리 메타
const CATEGORY_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  bug: { icon: Bug, label: "버그 신고", color: "#e53e3e" },
  improvement: { icon: Lightbulb, label: "개선 요청", color: "#f59e0b" },
  question: { icon: HelpCircle, label: "문의", color: "#3b82f6" },
};

// 상태 메타
const STATUS_META: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  pending: { icon: Clock, label: "대기 중", color: "#94a3b8" },
  answered: { icon: CheckCircle2, label: "답변 완료", color: "#10b981" },
  closed: { icon: XCircle, label: "종료", color: "#64748b" },
};

// 상대 시간
function getRelativeTime(date: Date) {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffMin = Math.floor(diffMs / (1000 * 60));
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  return format(target, "yyyy.MM.dd", { locale: ko });
}

export default function SupportPage() {
  const { status } = useSession();
  const [posts, setPosts] = useState<SupportPostSummary[] | null>(null);
  const [filter, setFilter] = useState<"all" | "mine" | "bug" | "improvement" | "question">("all");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status !== "authenticated") return;

    const load = async () => {
      const result = await fetchSupportPosts();
      if (result.success && result.data) {
        setPosts(result.data);
      } else {
        setError(result.message ?? "불러오기 실패");
      }
    };
    load();
  }, [status]);

// 필터링된 목록
const filteredPosts = posts?.filter((p) => {
  if (filter === "all") return true;
  if (filter === "mine") return p.isMine;
  return p.category === filter;
});

  return (
    <div className="support-container">
      {/* 헤더 */}
      <div className="support-header">
        <div className="support-title-block">
          <h1 className="support-title">고객 센터</h1>
          <p className="support-subtitle">불편사항이나 개선 아이디어를 자유롭게 남겨주세요</p>
        </div>
        <Link href="/support/write" className="support-write-btn">
          <Plus size={18} strokeWidth={2.5} />
          <span>글쓰기</span>
        </Link>
      </div>

     {/* 카테고리 필터 */}
      <div className="support-filters">
        <button
          className={`support-filter ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          전체
        </button>
        <button
          className={`support-filter ${filter === "mine" ? "active" : ""}`}
          onClick={() => setFilter("mine")}
        >
          <User size={14} strokeWidth={2} />
          <span>내 글</span>
        </button>
        {Object.entries(CATEGORY_META).map(([key, meta]) => {
          const Icon = meta.icon;
          return (
            <button
              key={key}
              className={`support-filter ${filter === key ? "active" : ""}`}
              onClick={() => setFilter(key as typeof filter)}
              style={filter === key ? { color: meta.color, borderColor: meta.color } : undefined}
            >
              <Icon size={14} strokeWidth={2} />
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* 목록 */}
      <div className="support-list">
        {error && (
          <div className="support-empty">
            <p>{error}</p>
          </div>
        )}

        {!error && posts === null && (
          <div className="support-empty">
            <p>불러오는 중...</p>
          </div>
        )}

        {!error && posts !== null && filteredPosts?.length === 0 && (
          <div className="support-empty">
            <p>
              {filter === "all"
                ? "아직 등록된 게시글이 없어요."
                : filter === "mine"
                ? "작성한 게시글이 없어요."
                : "해당 카테고리에 게시글이 없어요."}
            </p>
            <p className="support-empty-hint">첫 게시글을 작성해보세요!</p>
          </div>
        )}

        {filteredPosts?.map((post) => {
          const category = CATEGORY_META[post.category] ?? CATEGORY_META.question;
          const statusMeta = STATUS_META[post.status] ?? STATUS_META.pending;
          const CategoryIcon = category.icon;
          const StatusIcon = statusMeta.icon;

          return (
            <Link key={post.id} href={`/support/${post.id}`} className="support-item">
              <div className="support-item-left">
                <div
                  className="support-category-badge"
                  style={{ background: `${category.color}20`, color: category.color }}
                >
                  <CategoryIcon size={14} strokeWidth={2} />
                  <span>{category.label}</span>
                </div>
                <div className="support-item-content">
                  <h3 className="support-item-title">
                    {post.title}
                    {post.isMine && <span className="support-item-mine-badge">내 글</span>}
                  </h3>
                  <div className="support-item-meta">
                    <span className="support-item-author">
                      <span className="support-author-badge">{post.authorInitial}</span>
                      {post.isMine ? "나" : "익명"}
                    </span>
                    <span className="support-item-dot">·</span>
                    <span className="support-item-time">{getRelativeTime(post.createdAt)}</span>
                  </div>
                </div>
              </div>

              <div
                className="support-status-badge"
                style={{ color: statusMeta.color }}
              >
                <StatusIcon size={14} strokeWidth={2} />
                <span>{statusMeta.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}