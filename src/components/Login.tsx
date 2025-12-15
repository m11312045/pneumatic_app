import { useState } from 'react';
import { User } from '../types';
import { LogIn, Loader2 } from 'lucide-react';
import { loginOrRegisterStudent } from '../lib/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (studentId.trim() && name.trim()) {
      setIsLoading(true);
      const user = await loginOrRegisterStudent(studentId.trim(), name.trim());
      setIsLoading(false);
      
      if (user) {
        onLogin(user);
      } else {
        alert('登入失敗，請重試');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-indigo-600" />
          </div>
          <h1 className="text-indigo-600 mb-2">氣壓元件識別練習系統</h1>
          <p className="text-gray-600">請輸入您的資料開始練習</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="studentId" className="block text-gray-700 mb-2">
              學號
            </label>
            <input
              id="studentId"
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="請輸入學號"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-gray-700 mb-2">
              姓名
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="請輸入姓名"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                登入中...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                開始練習
              </>
            )}
          </button>
        </form>

        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">
            <strong>注意：</strong>本系統無需密碼，所有記錄皆公開可查看
          </p>
        </div>
      </div>
    </div>
  );
}