import { useCurrentPage } from './store';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import RuleBuilderPage from './pages/RuleBuilderPage';
import GamePage from './pages/GamePage';
import ExamplesPage from './pages/ExamplesPage';
import './App.css';

function App() {
  const currentPage = useCurrentPage();

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage />;
      case 'rule-builder':
        return <RuleBuilderPage />;
      case 'game':
        return <GamePage />;
      case 'examples':
        return <ExamplesPage />;
      default:
        return <LandingPage />;
    }
  };

  return (
    <div className="app-container">
      <Header />
      <main className="app-main">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
