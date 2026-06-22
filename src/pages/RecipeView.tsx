import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { getRecipe } from "../data/recipes";
import StepImage from "../components/StepImage";

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const ss = s % 60;
  return `${m}:${ss.toString().padStart(2, "0")}`;
}

function Timer({ seconds, accent }: { seconds: number; accent: string }) {
  const [left, setLeft] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    setLeft(seconds);
    setRunning(false);
  }, [seconds]);

  useEffect(() => {
    if (!running) return;
    ref.current = window.setInterval(() => {
      setLeft((l) => {
        if (l <= 1) {
          window.clearInterval(ref.current!);
          setRunning(false);
          return 0;
        }
        return l - 1;
      });
    }, 1000);
    return () => { if (ref.current) window.clearInterval(ref.current); };
  }, [running]);

  return (
    <div className="timer" style={{ ["--accent" as string]: accent }}>
      <span className="timer-time">{fmt(left)}</span>
      <button
        className="timer-btn"
        onClick={() => (left === 0 ? (setLeft(seconds), setRunning(true)) : setRunning((r) => !r))}
      >
        {left === 0 ? "重置" : running ? "暂停" : "计时"}
      </button>
    </div>
  );
}

export default function RecipeView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const recipe = id ? getRecipe(id) : undefined;
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<"next" | "prev">("next");

  useEffect(() => {
    setPage(0);
  }, [id]);

  if (!recipe) {
    return (
      <div className="page recipe-view">
        <p>没找到这道菜。</p>
        <Link className="btn" to="/library">回餐点库</Link>
      </div>
    );
  }

  const totalPages = recipe.steps.length + 1; // cover + steps
  const isCover = page === 0;

  function go(to: number) {
    if (to < 0 || to >= totalPages) return;
    setDir(to > page ? "next" : "prev");
    setPage(to);
  }

  return (
    <div className="page recipe-view" style={{ ["--accent" as string]: recipe.accent }}>
      <div className="rv-bar">
        <button className="rv-back" onClick={() => navigate(-1)} aria-label="返回">‹ 返回</button>
        <span className="rv-progress">
          {isCover ? "封面" : `第 ${page} 步 / 共 ${recipe.steps.length} 步`}
        </span>
      </div>

      <div className="booklet">
        <div className={"leaf " + dir} key={page}>
          {isCover ? (
            <div className="cover">
              <div className="cover-emoji">{recipe.emoji}</div>
              <h1 className="cover-name">{recipe.name}</h1>
              <p className="cover-en">{recipe.nameEn}</p>
              <p className="cover-blurb">{recipe.blurb}</p>

              <div className="cover-macros">
                <div><b>{recipe.kcal}</b><span>kcal</span></div>
                <div><b>{recipe.protein}g</b><span>蛋白</span></div>
                <div><b>{recipe.carbs}g</b><span>碳水</span></div>
                <div><b>{recipe.fat}g</b><span>脂肪</span></div>
              </div>
              <p className="cover-serv">{recipe.servings} 人份 · 共 {recipe.steps.length} 步</p>

              <div className="cover-ing">
                <h3>需要准备</h3>
                <ul>
                  {recipe.ingredients.map((ing, i) => (
                    <li key={i}>
                      <span className="ing-name">{ing.name}</span>
                      <span className="ing-amt">{ing.amount}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div className="step-page">
              <StepImage
                recipeId={recipe.id}
                stepIndex={page}
                emoji={recipe.emoji}
                accent={recipe.accent}
                alt={`${recipe.name} 第 ${page} 步:${recipe.steps[page - 1].title}`}
              />
              <div className="step-body">
                <span className="step-no">STEP {page}</span>
                <h2 className="step-title">{recipe.steps[page - 1].title}</h2>
                <p className="step-content">{recipe.steps[page - 1].content}</p>
                {recipe.steps[page - 1].timerSeconds && (
                  <Timer seconds={recipe.steps[page - 1].timerSeconds!} accent={recipe.accent} />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flip-controls">
        <button className="flip-btn" onClick={() => go(page - 1)} disabled={page === 0}>
          ‹ 上一页
        </button>
        <div className="dots" aria-hidden="true">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              className={"dot" + (i === page ? " on" : "")}
              onClick={() => go(i)}
            />
          ))}
        </div>
        {page < totalPages - 1 ? (
          <button className="flip-btn primary" onClick={() => go(page + 1)}>
            {page === 0 ? "开始做 ›" : "下一页 ›"}
          </button>
        ) : (
          <Link className="flip-btn primary done" to="/">完成 ✓</Link>
        )}
      </div>
    </div>
  );
}
