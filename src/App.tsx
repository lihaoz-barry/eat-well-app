import { HashRouter, Route, Routes } from "react-router-dom";
import Nav from "./components/Nav";
import Today from "./pages/Today";
import Planner from "./pages/Planner";
import Library from "./pages/Library";
import Shopping from "./pages/Shopping";
import Print from "./pages/Print";
import RecipeView from "./pages/RecipeView";

export default function App() {
  return (
    <HashRouter>
      <div className="app-shell">
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/plan" element={<Planner />} />
            <Route path="/library" element={<Library />} />
            <Route path="/shopping" element={<Shopping />} />
            <Route path="/print" element={<Print />} />
            <Route path="/recipe/:id" element={<RecipeView />} />
          </Routes>
        </main>
        <Nav />
      </div>
    </HashRouter>
  );
}
