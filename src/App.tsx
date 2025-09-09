import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import RuleBuilderPage from './pages/RuleBuilderPage';
import GamePage from './pages/GamePage';
import ExamplesPage from './pages/ExamplesPage';
import EmailSignUp from './pages/EmailSignUp';
import AdminDashboard from './pages/AdminDashboard';
import { getDefaultPage } from './utils/environment';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  // Hide header/footer for newsletter signup to create a focused landing page
  const isNewsletterPage = location.pathname === '/newsletter' || 
                          location.pathname === '/signup' || 
                          location.pathname === '/admin';

  return (
    <div className="app-container">
      {!isNewsletterPage && <Header />}
      <main className="app-main">
        <Routes>
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/newsletter" element={<EmailSignUp onComplete={() => {/* Could redirect to landing after signup */}} />} />
          <Route path="/signup" element={<EmailSignUp onComplete={() => {/* Could redirect to landing after signup */}} />} />
          <Route path="/landing" element={<LandingPage />} />
          <Route path="/rule-builder" element={<RuleBuilderPage />} />
          <Route path="/game" element={<GamePage />} />
          <Route path="/examples" element={<ExamplesPage />} />
          <Route path="/" element={<DefaultRoute />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!isNewsletterPage && <Footer />}
    </div>
  );
}

function DefaultRoute() {
  const defaultPage = getDefaultPage();
  
  if (defaultPage === 'newsletter') {
    return <Navigate to="/newsletter" replace />;
  } else if (defaultPage === 'examples') {
    return <Navigate to="/examples" replace />;
  } else {
    return <Navigate to="/landing" replace />;
  }
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
