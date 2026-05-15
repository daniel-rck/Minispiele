import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from './components/AppShell';
import Dice from './pages/Dice';
import Home from './pages/Home';
import RingSort from './pages/RingSort';
import Timer from './pages/Timer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="ring-sort" element={<RingSort />} />
          <Route path="timer" element={<Timer />} />
          <Route path="dice" element={<Dice />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
