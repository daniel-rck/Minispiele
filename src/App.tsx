import { BrowserRouter, Route, Routes } from 'react-router';
import AppShell from './components/AppShell';
import Home from './pages/Home';
import RingSort from './pages/RingSort';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="ring-sort" element={<RingSort />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
