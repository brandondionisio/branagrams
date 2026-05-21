import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Home } from "./pages/home/Home.component";
import { Solver } from "./pages/solver/Solver.component";
import { Game } from "./pages/game/Game.component";
import { NotFound } from "./pages/404/404.component";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solver" element={<Solver />} />
        <Route path="/game" element={<Game />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
