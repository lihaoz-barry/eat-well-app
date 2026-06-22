import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "今日", icon: "☀" },
  { to: "/plan", label: "周计划", icon: "▦" },
  { to: "/library", label: "餐点库", icon: "❖" },
  { to: "/shopping", label: "购物清单", icon: "✓" },
  { to: "/print", label: "打印", icon: "⎙" },
];

export default function Nav() {
  return (
    <nav className="nav" aria-label="主导航">
      {items.map((it) => (
        <NavLink
          key={it.to}
          to={it.to}
          end={it.to === "/"}
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
        >
          <span className="nav-icon" aria-hidden="true">{it.icon}</span>
          <span className="nav-label">{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
