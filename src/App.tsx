import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Home } from "./pages/home/Home";
import { Solver } from "./pages/solver/Solver";
import { Game } from "./pages/game/Game.component";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/solver" element={<Solver />} />
        <Route path="/game" element={<Game />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
