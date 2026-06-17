import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Activity,
  MapPin,
  Users,
  Trophy,
  User,
  Flame,
  Route,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { currentUser } from '@/data/mockUser';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: '仪表盘' },
  { to: '/record', icon: Activity, label: '运动记录' },
  { to: '/routes', icon: MapPin, label: '路线探索' },
  { to: '/community', icon: Users, label: '社区广场' },
  { to: '/challenges', icon: Trophy, label: '挑战活动' },
  { to: '/profile', icon: User, label: '个人中心' },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen fixed left-0 top-0 bg-white border-r border-ink-200 z-40">
      <div className="flex items-center gap-3 px-6 py-5 border-b border-ink-100">
        <div className="w-10 h-10 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand-glow">
          <Route className="w-5 h-5 text-white" strokeWidth={2.5} />
        </div>
        <div>
          <h1 className="text-xl font-bold font-display gradient-text tracking-tight">
            TrackPath
          </h1>
          <p className="text-[10px] text-ink-400 font-medium">
            记录每一次奔跑
          </p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group',
                isActive
                  ? 'bg-brand-gradient text-white shadow-brand-glow scale-[1.02]'
                  : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-200',
                    !isActive && 'group-hover:scale-110'
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-ink-100">
        <div className="p-3 rounded-2xl bg-ink-50 hover:bg-ink-100 transition-colors cursor-pointer group">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-11 h-11 rounded-xl object-cover border-2 border-white shadow-sm"
              />
              {currentUser.streakDays > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-gradient flex items-center justify-center border-2 border-white">
                  <Flame className="w-3 h-3 text-white" fill="currentColor" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink-800 truncate">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="px-1.5 py-0.5 rounded-md bg-gold-gradient text-[10px] font-bold text-white">
                  Lv.{currentUser.level}
                </div>
                <span className="text-[11px] text-ink-500">
                  连续{currentUser.streakDays}天
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
