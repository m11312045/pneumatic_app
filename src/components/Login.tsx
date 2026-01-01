import { useState } from 'react';
import type { User } from '../types';
import { LogIn, Loader2 } from 'lucide-react';
import { loginOrRegisterStudent } from '../lib/api';

interface LoginProps {
  onLogin: (user: User) => void;
}

export function Login({ onLogin }: LoginProps) {
  const [studentId, setStudentId] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const sn = studentId.trim();
    const nm = name.trim();

    if (!sn) {
      setError('請輸入學號');
      return;
    }

    setIsLoading(true);
    try {
      const user = await loginOrRegisterStudent(sn, nm);
      onLogin(user);
    } catch (err: any) {
      console.error(err);
      setError(String(err?.message ?? err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
            <LogIn className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-gray-900 mb-1">登入 / 建立學生資料</h2>
          <p className="text-gray-600">輸入學號即可開始（無需密碼）</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-1">學號</label>
            <input
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如：B1234567"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-1">姓名（可不填）</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="例如：王小明"
            />
          </div>

          {error ? <div className="text-red-600 text-sm">錯誤：{error}</div> : null}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                讀取中...
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
