import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Play, Menu, X, Route } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function TopBar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 lg:ml-64">
        <div className="glass border-b border-white/50 px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4">
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg bg-brand-gradient flex items-center justify-center shadow-brand-glow">
                <Route className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-bold font-display gradient-text">
                TrackPath
              </span>
            </div>

            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 group-focus-within:text-brand-500 transition-colors" />
                <input
                  type="text"
                  placeholder="搜索路线、好友、活动..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white/80 border border-ink-200 text-sm text-ink-700 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition-all"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <button className="relative p-2.5 rounded-xl bg-white/80 border border-ink-200 hover:bg-white hover:border-brand-200 transition-all group">
                <Bell className="w-5 h-5 text-ink-500 group-hover:text-brand-500 transition-colors" />
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-brand-500 border-2 border-white animate-pulse" />
              </button>

              <Link
                to="/record"
                className="relative w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center shadow-brand-glow hover:shadow-lg hover:shadow-brand-500/40 transition-all animate-breathe group"
              >
                <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" />
                <span className="absolute -top-1 -left-1 -bottom-1 -right-1 rounded-full bg-brand-gradient opacity-20 blur-md -z-10 group-hover:opacity-30 transition-opacity" />
              </Link>

              <button
                className="lg:hidden p-2.5 rounded-xl bg-white/80 border border-ink-200 hover:bg-white transition-all"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                <AnimatePresence mode="wait">
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X className="w-5 h-5 text-ink-600" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{ rotate: 90, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      exit={{ rotate: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Menu className="w-5 h-5 text-ink-600" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-50 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-ink-900/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              className="absolute left-4 right-4 top-20 rounded-3xl bg-white shadow-2xl overflow-hidden"
              initial={{ y: -20, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.25, type: 'spring', damping: 25 }}
            >
              <div className="p-4 space-y-1">
                {[
                  { to: '/', label: '仪表盘' },
                  { to: '/record', label: '运动记录' },
                  { to: '/routes', label: '路线探索' },
                  { to: '/community', label: '社区广场' },
                  { to: '/challenges', label: '挑战活动' },
                  { to: '/profile', label: '个人中心' },
                ].map((item, idx) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'block px-4 py-3 rounded-xl text-sm font-medium transition-all',
                      idx === 0
                        ? 'bg-brand-gradient text-white'
                        : 'text-ink-700 hover:bg-ink-100'
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
