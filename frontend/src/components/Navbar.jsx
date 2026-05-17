import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Leaf, LogOut, User, Menu } from 'lucide-react';
import { useState } from 'react';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Basic check for logged in user (from localStorage for now)
  const user = JSON.parse(localStorage.getItem('user'));
  
  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="navbar glass">
      <div className="container nav-container">
        <Link to="/" className="logo flex items-center" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Leaf className="text-primary" style={{ color: 'var(--primary)' }} />
          <span className="heading-md" style={{ margin: 0, fontFamily: 'Outfit' }}>SmartCrop Doctor</span>
        </Link>
        
        <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Home</Link>
          
          {user ? (
            <>
              <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>Dashboard</Link>
              <button onClick={handleLogout} className="btn-outline" style={{ padding: '0.5rem 1rem' }}>
                <LogOut size={16} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/register" className="btn-primary" style={{ padding: '0.5rem 1rem' }}>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
