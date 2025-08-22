import { useCurrentPage } from './store';
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

function App() {
  const currentPage = useCurrentPage();
  
  // Hide header/footer for newsletter signup to create a focused landing page
  const isNewsletterPage = currentPage === 'newsletter' || currentPage === 'signup' || currentPage === 'default' || currentPage === 'admin';

  const renderPage = () => {
    switch (currentPage) {
      case 'admin':
        return <AdminDashboard />;
      case 'newsletter':
      case 'signup':
        return <EmailSignUp onComplete={() => {/* Could redirect to landing after signup */}} />;
      case 'landing':
        return <LandingPage />;
      case 'rule-builder':
        return <RuleBuilderPage />;
      case 'game':
        return <GamePage />;
      case 'examples':
        return <ExamplesPage />;
      default:
        // Use environment-based default
        const defaultPage = getDefaultPage();
        if (defaultPage === 'newsletter') {
          return <EmailSignUp onComplete={() => {/* Could redirect to landing after signup */}} />;
        } else if (defaultPage === 'examples') {
          return <ExamplesPage />;
        } else {
          return <LandingPage />;
        }
    }
  };

  return (
    <div className="app-container">
      {!isNewsletterPage && <Header />}
      <main className="app-main">
        {renderPage()}
      </main>
      {!isNewsletterPage && <Footer />}
    </div>
  );
}

export default App;
