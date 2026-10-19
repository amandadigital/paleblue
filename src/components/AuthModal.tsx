import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, closeAuthModal, user, signIn, signUp } = useAuth();

  const [tab, setTab] = useState<'signin' | 'signup'>('signin');
  const [identifier, setIdentifier] = useState(''); // username or email
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canClose = Boolean(user);
  if (!isAuthModalOpen && user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      if (tab === 'signin') {
        if (!identifier.trim() || !password) {
          setErrorMsg('please enter your username or email and password.');
          setIsSubmitting(false);
          return;
        }
        const res = await signIn(identifier, password);
        if (res.error) setErrorMsg(res.error);
      } else {
        if (!username.trim() || !password) {
          setErrorMsg('username and password are required.');
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setErrorMsg('password must be at least 6 characters.');
          setIsSubmitting(false);
          return;
        }
        const res = await signUp(email, password, username);
        if (res.error) setErrorMsg(res.error);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'encountered an issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-950 sketch-border border-neutral-700 w-full max-w-sm p-6 space-y-5">
        {/* Title */}
        <div className="text-center space-y-1">
          <h2 className="text-3xl font-heading text-white">
            you need an account!
          </h2>
        </div>

        {/* Tab Switch */}
        <div className="grid grid-cols-2 gap-1 bg-black p-1 sketch-border border-neutral-800 text-xs">
          <button
            type="button"
            onClick={() => { setTab('signin'); setErrorMsg(''); }}
            className={`py-1.5 px-2 rounded cursor-pointer transition-all ${
              tab === 'signin' ? 'bg-neutral-900 text-white border border-neutral-700' : 'text-neutral-500 hover:text-white'
            }`}
          >
            sign in
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setErrorMsg(''); }}
            className={`py-1.5 px-2 rounded cursor-pointer transition-all ${
              tab === 'signup' ? 'bg-neutral-900 text-white border border-neutral-700' : 'text-neutral-500 hover:text-white'
            }`}
          >
            sign up
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-2 bg-neutral-900 border border-neutral-700 text-neutral-300 text-xs rounded flex items-center gap-2">
            <AlertCircle size={13} className="shrink-0 text-white" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'signin' ? (
            <>
              <div className="space-y-1">
                <label className="block text-xs text-neutral-400">username or email</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value.toLowerCase())}
                  placeholder="username or email"
                  className="w-full px-3 py-2 bg-black border border-neutral-700 focus:border-white rounded text-white placeholder-neutral-500 outline-none text-sm transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-neutral-400">password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="w-full px-3 py-2 bg-black border border-neutral-700 focus:border-white rounded text-white placeholder-neutral-500 outline-none text-sm transition-colors"
                />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <label className="block text-xs text-neutral-400">username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="username"
                  className="w-full px-3 py-2 bg-black border border-neutral-700 focus:border-white rounded text-white placeholder-neutral-500 outline-none text-sm transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-neutral-400">email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.toLowerCase())}
                  placeholder="email"
                  className="w-full px-3 py-2 bg-black border border-neutral-700 focus:border-white rounded text-white placeholder-neutral-500 outline-none text-sm transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs text-neutral-400">password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="password"
                  className="w-full px-3 py-2 bg-black border border-neutral-700 focus:border-white rounded text-white placeholder-neutral-500 outline-none text-sm transition-colors"
                />
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 sketch-border bg-white text-black text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? 'loading...' : tab === 'signin' ? 'sign in' : 'sign up'}
            </button>
          </div>

          {canClose && (
            <div className="text-center pt-1">
              <button
                type="button"
                onClick={closeAuthModal}
                className="text-xs text-neutral-500 hover:text-white cursor-pointer"
              >
                close
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
