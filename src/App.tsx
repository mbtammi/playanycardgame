import { useCurrentPage } from './store';
import Header from './components/Header';
import Footer from './components/Footer';
import LandingPage from './pages/LandingPage';
import RuleBuilderPage from './pages/RuleBuilderPage';
import GamePage from './pages/GamePage';
import ExamplesPage from './pages/ExamplesPage';

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col">
      <Header />
      <main className="flex-1">
        {renderPage()}
      </main>
      <Footer />
    </div>
  );
}

export default App;
