import React from "react";
import { Link, useNavigate } from "react-router-dom";

const Header = ({ theme, toggleTheme, currentUser, logout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <header className="header">
      <div className="header-container">
        <h1 className="logo">SQLite with me</h1>
        <nav>
          <ul>
            <li><Link to="/">Басты бет</Link></li>
            <li><Link to="/courses">Сабақтар</Link></li>
            <li><Link to="/cart">Себет</Link></li>
            {currentUser?.role === "admin" && <li><Link to="/admin">Админ</Link></li>}
            {!currentUser ? (
              <li><Link to="/signin">Кіру</Link></li>
            ) : (
              <li><button onClick={handleLogout} className="btn-logout">Шығу</button></li>
            )}
            <li>
              <button onClick={toggleTheme} className="theme-btn">
                {theme === "dark" ? "☀️ Жарық" : "🌙 Қараңғы"}
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
