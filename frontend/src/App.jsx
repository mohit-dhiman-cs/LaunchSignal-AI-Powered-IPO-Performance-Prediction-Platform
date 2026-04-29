import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PredictorPage from './pages/PredictorPage';
import MarketAnalysisPage from './pages/MarketAnalysisPage';
import HistoryPage from './pages/HistoryPage';
import { ToastProvider } from './context/ToastContext';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar />
        <Routes>
          <Route path="/"        element={<PredictorPage />} />
          <Route path="/market"  element={<MarketAnalysisPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
