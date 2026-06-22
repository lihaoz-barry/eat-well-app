import { useState } from "react";

interface Props {
  recipeId: string;
  stepIndex: number; // 1-based
  emoji: string;
  accent: string;
  alt: string;
}

/**
 * 图片策略:
 *  - 优先加载 /recipes/<recipeId>/step-<n>.jpg(你放真实图或 AI 生成图就会自动显示)
 *  - 找不到则回退到统一风格的占位图,用该菜的 accent 着色 —— 同一道菜风格一致。
 */
export default function StepImage({ recipeId, stepIndex, emoji, accent, alt }: Props) {
  const [failed, setFailed] = useState(false);
  const src = `${import.meta.env.BASE_URL}recipes/${recipeId}/step-${stepIndex}.jpg`;

  if (failed) {
    return (
      <div className="step-img placeholder" role="img" aria-label={`${alt}(占位图)`}>
        <svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <defs>
            <linearGradient id={`g-${recipeId}-${stepIndex}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor={accent} stopOpacity="0.16" />
              <stop offset="1" stopColor={accent} stopOpacity="0.34" />
            </linearGradient>
          </defs>
          <rect width="400" height="300" fill={`url(#g-${recipeId}-${stepIndex})`} />
          <circle cx="200" cy="132" r="62" fill={accent} opacity="0.14" />
          <circle cx="200" cy="132" r="62" fill="none" stroke={accent} strokeWidth="2" opacity="0.5" />
          <text x="200" y="152" textAnchor="middle" fontSize="58">{emoji}</text>
          <text
            x="200"
            y="232"
            textAnchor="middle"
            fontSize="15"
            fill={accent}
            fontWeight="600"
            letterSpacing="0.12em"
          >
            STEP {stepIndex}
          </text>
        </svg>
        <span className="placeholder-tag">占位图 · 可替换</span>
      </div>
    );
  }

  return (
    <img
      className="step-img"
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
