import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import PredictorPage from './pages/PredictorPage';
import MarketAnalysisPage from './pages/MarketAnalysisPage';
import HistoryPage from './pages/HistoryPage';
import BacktestPage from './pages/BacktestPage';
import WatchlistPage from './pages/WatchlistPage';
import PortfolioPage from './pages/PortfolioPage';
import DashboardPage from './pages/DashboardPage';
import CommunityPage from './pages/CommunityPage';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ChatWidget from './components/ChatWidget';
import './index.css';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ThemeProvider>
          <ToastProvider>
            <Navbar />
            <Routes>
              <Route path="/"           element={<PredictorPage />} />
              <Route path="/market"     element={<MarketAnalysisPage />} />
              <Route path="/history"    element={<HistoryPage />} />
              <Route path="/backtest"   element={<BacktestPage />} />
              <Route path="/watchlist"  element={<WatchlistPage />} />
              <Route path="/portfolio"  element={<PortfolioPage />} />
              <Route path="/dashboard"  element={<DashboardPage />} />
              <Route path="/community"  element={<CommunityPage />} />
            </Routes>
            <ChatWidget />
          </ToastProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
