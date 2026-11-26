"use client";

import { useEffect, useState, useRef } from "react";
import {
  fetchChatHistory,
  sendChatMessage,
  clearChatHistory,
  type ChatMessage,
} from "../../app/actions/aiChat";

const QUICK_PROMPTS = ["오늘 뭐 먹을까?", "이번 주 어땠어?", "어떤 운동 추천해?"];

export default function AiAssistantWidget() {
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = async () => {
      const result = await fetchChatHistory();
      if (result.success && result.data) {
        setMessages(result.data);
      } else {
        setMessages([]);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (text?: string) => {
    const message = (text ?? input).trim();
    if (!message || isSending) return;

    setInput("");
    setIsSending(true);

    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: "user",
      content: message,
      createdAt: new Date(),
    };
    setMessages((prev) => [...(prev ?? []), tempUserMsg]);

    const result = await sendChatMessage(message);
    setIsSending(false);

    if (result.success && result.data) {
      setMessages((prev) => {
        const withoutTemp = (prev ?? []).filter((m) => m.id !== tempUserMsg.id);
        return [...withoutTemp, result.data!.userMsg, result.data!.aiMsg];
      });
    } else {
      alert(result.message ?? "전송 실패");
      setMessages((prev) => (prev ?? []).filter((m) => m.id !== tempUserMsg.id));
    }
  };

  const handleClear = async () => {
    if (!confirm("대화 기록을 모두 삭제하시겠습니까?")) return;
    await clearChatHistory();
    setMessages([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="card ai-card">
      <div className="ai-header">
        <h3 className="ai-title">AI 어시스턴트</h3>
        {messages && messages.length > 0 && (
          <button onClick={handleClear} className="ai-clear-btn">
            대화 초기화
          </button>
        )}
      </div>

      <div className="ai-messages" ref={scrollRef}>
        {messages === null ? (
          <p className="ai-loading">불러오는 중...</p>
        ) : messages.length === 0 ? (
          <div className="ai-welcome">
            <p className="ai-welcome-text">
              안녕하세요!
              <br />
              오늘 하루를 함께 관리해드릴게요.
              <br />
              무엇이든 물어보세요.
            </p>
            <div className="ai-quick-prompts">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleSend(prompt)}
                  className="ai-quick-prompt"
                  disabled={isSending}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((m) => (
              <div key={m.id} className={`ai-msg ai-msg-${m.role}`}>
                <div className="ai-msg-bubble">{m.content}</div>
              </div>
            ))}
            {isSending && (
              <div className="ai-msg ai-msg-assistant">
                <div className="ai-msg-bubble ai-msg-typing">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="ai-input-row">
        <input
          type="text"
          className="ai-input"
          placeholder="메시지를 입력하세요..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
        />
        <button
          onClick={() => handleSend()}
          className="ai-send-btn"
          disabled={isSending || !input.trim()}
        >
          {isSending ? "..." : "전송"}
        </button>
      </div>
    </div>
  );
}
