import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('username'); // Clear user data
    navigate('/login'); // Redirect to login page
  };

  const isLoggedIn = !!localStorage.getItem('username'); // Check if user is logged in

  return (
    <nav style={styles.navbar}>
      <div style={styles.logo}>
        <Link to="/" style={styles.link}>
          Hermes
        </Link>
      </div>
      <div style={styles.navLinks}>
        {isLoggedIn ? (
          <>
            <Link to="/chat" style={styles.link}>
              Chat
            </Link>
            <Link to="/friends" style={styles.link}>
              Friends
            </Link>
            <Link to="/create-group" style={styles.button}>
              Create Group Chat
            </Link>
            <button onClick={handleLogout} style={styles.logoutButton}>
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" style={styles.link}>
              Login
            </Link>
            <Link to="/signup" style={styles.link}>
              Signup
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#007bff',
    padding: '10px 20px',
    color: 'white',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  navLinks: {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
  },
  link: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
  },
  button: {
    color: 'white',
    textDecoration: 'none',
    fontSize: '16px',
    padding: '5px 10px',
    border: 'none', 
    borderRadius: '5px',
    backgroundColor: 'transparent', 
    cursor: 'pointer',
    transition: '0.3s',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    color: 'white',
    border: 'none',
    fontSize: '16px',
    cursor: 'pointer',
  },
};

export default Navbar;
