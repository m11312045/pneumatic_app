import { useState } from 'react';
import { Login } from './components/Login';
import { Quiz } from './components/Quiz';
import { History } from './components/History';
import { User } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'quiz' | 'history'>('quiz');

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('quiz');
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-indigo-600">氣壓元件識別練習系統</h1>
            <div className="flex items-center gap-4">
              <span className="text-gray-700">
                {currentUser.name} ({currentUser.studentId})
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('quiz')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'quiz'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  開始練習
                </button>
                <button
                  onClick={() => setCurrentView('history')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    currentView === 'history'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  歷史記錄
                </button>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {currentView === 'quiz' ? (
          <Quiz user={currentUser} />
        ) : (
          <History user={currentUser} />
        )}
      </main>
    </div>
  );
}
