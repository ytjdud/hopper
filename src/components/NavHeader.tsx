import { useNavigate, useLocation } from 'react-router-dom';
import logoSrc from '../assets/logo.png';

export default function NavHeader() {
  const navigate = useNavigate();
  const location = useLocation();

  const isMap = location.pathname === '/' || location.pathname.startsWith('/map');
  const isCalendar = location.pathname.startsWith('/calendar');

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <button onClick={() => navigate('/')} className="flex items-center">
          <img src={logoSrc} alt="Hopper" className="h-8" />
        </button>

        {/* Navigation Tabs */}
        <nav className="flex gap-1">
          <button
            onClick={() => navigate('/')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isMap
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              Map
            </span>
          </button>
          <button
            onClick={() => navigate('/calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isCalendar
                ? 'bg-blue-600 text-white'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Calendar
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
}
