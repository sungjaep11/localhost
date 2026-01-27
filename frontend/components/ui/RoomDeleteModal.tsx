"use client";

import React from "react";

export type RoomDeleteModalMode = "confirm" | "success" | "error";

export interface RoomDeleteModalProps {
  open: boolean;
  mode: RoomDeleteModalMode;
  message?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0, 0, 0, 0.6)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  animation: "roomDeleteFadeIn 0.2s ease-out",
};

const cardStyle: React.CSSProperties = {
  minWidth: "320px",
  maxWidth: "90vw",
  padding: "1.75rem 2rem",
  background: "linear-gradient(160deg, rgba(20, 25, 45, 0.98), rgba(10, 15, 35, 0.98))",
  border: "2px solid rgba(0, 255, 255, 0.35)",
  borderRadius: "20px",
  boxShadow: "0 0 40px rgba(0, 255, 255, 0.2), inset 0 1px 0 rgba(255,255,255,0.08)",
  textAlign: "center",
  animation: "roomDeleteScaleIn 0.25s ease-out",
};

const titleStyle: React.CSSProperties = {
  fontSize: "1.25rem",
  fontWeight: 700,
  color: "#e8f4fc",
  marginBottom: "0.5rem",
};

const messageStyle: React.CSSProperties = {
  fontSize: "1rem",
  color: "rgba(232, 244, 252, 0.9)",
  lineHeight: 1.5,
  marginBottom: "1.5rem",
};

const btnBase: React.CSSProperties = {
  padding: "0.65rem 1.4rem",
  borderRadius: "12px",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s ease",
  border: "none",
};

const btnCancelStyle: React.CSSProperties = {
  ...btnBase,
  background: "rgba(255,255,255,0.12)",
  color: "#b0c4d4",
  border: "1px solid rgba(255,255,255,0.2)",
};

const btnConfirmStyle: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, #00c2ff, #0088cc)",
  color: "#fff",
  boxShadow: "0 4px 14px rgba(0, 194, 255, 0.4)",
};

const btnDangerStyle: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, #ff4757, #cc2a38)",
  color: "#fff",
  boxShadow: "0 4px 14px rgba(255, 71, 87, 0.4)",
};

const btnSuccessStyle: React.CSSProperties = {
  ...btnBase,
  background: "linear-gradient(135deg, #00d68f, #00a86b)",
  color: "#fff",
  boxShadow: "0 4px 14px rgba(0, 214, 143, 0.4)",
};

const iconWrap: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  margin: "0 auto 1rem",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1.75rem",
};

export function RoomDeleteModal({
  open,
  mode,
  message,
  onConfirm,
  onCancel,
}: RoomDeleteModalProps) {
  if (!open) return null;

  const isConfirm = mode === "confirm";
  const isSuccess = mode === "success";
  const isError = mode === "error";

  const titles: Record<RoomDeleteModalMode, string> = {
    confirm: "방 삭제",
    success: "삭제 완료",
    error: "삭제 실패",
  };

  const defaultMessages: Record<RoomDeleteModalMode, string> = {
    confirm: "정말 이 방을 삭제하시겠습니까?",
    success: "방이 삭제되었습니다.",
    error: "방 삭제에 실패했습니다.",
  };

  const displayMessage = message ?? defaultMessages[mode];

  const iconBoxStyle: React.CSSProperties = {
    ...iconWrap,
    ...(isConfirm && {
      background: "rgba(255, 71, 87, 0.2)",
      border: "2px solid rgba(255, 71, 87, 0.5)",
    }),
    ...(isSuccess && {
      background: "rgba(0, 214, 143, 0.2)",
      border: "2px solid rgba(0, 214, 143, 0.5)",
    }),
    ...(isError && {
      background: "rgba(255, 165, 0, 0.2)",
      border: "2px solid rgba(255, 165, 0, 0.5)",
    }),
  };

  return (
    <>
      <style>{`
        @keyframes roomDeleteFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes roomDeleteScaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      <div style={overlayStyle} onClick={onCancel || (() => {})} role="presentation">
        <div
          style={cardStyle}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby="room-delete-modal-title"
        >
          <div style={iconBoxStyle}>
            {isConfirm && "🗑️"}
            {isSuccess && "✓"}
            {isError && "⚠"}
          </div>
          <h2 id="room-delete-modal-title" style={titleStyle}>
            {titles[mode]}
          </h2>
          <p style={messageStyle}>{displayMessage}</p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            {isConfirm && onCancel && (
              <button
                type="button"
                style={btnCancelStyle}
                onClick={onCancel}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.2)";
                  e.currentTarget.style.color = "#e8f4fc";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = (btnCancelStyle.background as string) ?? "rgba(255,255,255,0.12)";
                  e.currentTarget.style.color = (btnCancelStyle.color as string) ?? "#b0c4d4";
                }}
              >
                취소
              </button>
            )}
            <button
              type="button"
              style={
                isConfirm ? btnDangerStyle : isSuccess ? btnSuccessStyle : { ...btnConfirmStyle, background: "linear-gradient(135deg, #ff9500, #cc7700)" }
              }
              onClick={onConfirm}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = isConfirm
                  ? "0 6px 20px rgba(255, 71, 87, 0.5)"
                  : isSuccess
                  ? "0 6px 20px rgba(0, 214, 143, 0.5)"
                  : "0 6px 20px rgba(255, 149, 0, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = isConfirm
                  ? (btnDangerStyle.boxShadow as string)
                  : isSuccess
                  ? (btnSuccessStyle.boxShadow as string)
                  : "0 4px 14px rgba(255, 149, 0, 0.4)";
              }}
            >
              {isConfirm ? "삭제" : "확인"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
