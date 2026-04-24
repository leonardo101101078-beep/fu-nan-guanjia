import { useState } from 'react';
import BottomNav from './components/BottomNav';
import Ledger from './routes/Ledger';
import Overview from './routes/Overview';
import Profile from './routes/Profile';
import './App.css';

export type TabId = 'ledger' | 'overview' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('ledger');
  const [darkMode, setDarkMode] = useState<boolean>(() =>
    localStorage.getItem('theme') === 'dark'
  );

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      return next;
    });
  };

  return (
    <div className="app-container" data-theme={darkMode ? 'dark' : ''}>
      <main className="page-content">
        {activeTab === 'ledger'   && <Ledger   key="ledger" />}
        {activeTab === 'overview' && <Overview key="overview" />}
        {activeTab === 'profile'  && (
          <Profile
            key="profile"
            onToggleDark={toggleDark}
            darkMode={darkMode}
          />
        )}
      </main>
      <BottomNav activeTab={activeTab} onChange={setActiveTab} />
    </div>
  );
}
