import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, Loader2, ArrowRight } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess?: () => void;
}

export function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    const err = isLogin
      ? await signIn(email, password)
      : await signUp(email, password);

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      // Login and Signup both go straight in
      onAuthSuccess?.();
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="w-full max-w-sm">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-medium tracking-tight">Kaizen</h1>
        <p className="text-white/50 font-mono text-sm mt-1">
          {isLogin ? 'Sign in to sync your tasks' : 'Create your account'}
        </p>
      </motion.div>

      {/* Form */}
      <motion.form
        key={isLogin ? 'login' : 'signup'}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        onSubmit={handleSubmit}
        className="space-y-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: 0.05 }}
        >
          <label htmlFor="email" className="block text-sm font-mono text-white/50 mb-1">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition"
            placeholder="you@example.com"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: 0.1 }}
        >
          <label htmlFor="password" className="block text-sm font-mono text-white/50 mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-white/30 transition"
            placeholder="••••••••"
          />
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="flex items-center gap-2 text-red-400 text-sm bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2"
            >
              <AlertCircle size={14} />
              {error}
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
              className="text-green-400 text-sm bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2"
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          type="submit"
          disabled={loading}
          whileHover={!loading ? { scale: 1.01 } : {}}
          whileTap={!loading ? { scale: 0.99 } : {}}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="w-full bg-white text-black font-medium rounded-lg py-2.5 text-sm hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Please wait...
            </>
          ) : (
            <>
              {isLogin ? 'Sign In' : 'Sign Up'}
              <ArrowRight size={16} />
            </>
          )}
        </motion.button>
      </motion.form>

      {/* Switch mode */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4, delay: 0.2 }}
        className="text-white/40 text-sm mt-6 flex items-center justify-center gap-2"
      >
        <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
        <motion.button
          onClick={switchMode}
          whileHover={{ scale: 1.05, color: 'rgba(255,255,255,1)' }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
          className="text-white underline underline-offset-2"
        >
          {isLogin ? 'Sign Up' : 'Sign In'}
        </motion.button>
      </motion.div>
    </div>
  );
}
