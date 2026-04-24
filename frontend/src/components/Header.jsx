import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const Header = ({ theme, toggleTheme, currentUser, enrolledCourseIds = [], logout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/signin");
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo-link">
          <h1 className="logo">SQL Study Hub</h1>
          <span className="logo-caption">SQLite бойынша қазақша интерактив оқу</span>
        </Link>

        <nav className="main-nav">
          <ul>
            <li><NavLink className={({ isActive }) => (isActive ? "active" : "")} to="/">Басты бет</NavLink></li>
            <li><NavLink className={({ isActive }) => (isActive ? "active" : "")} to="/courses">Курстар</NavLink></li>
            <li><NavLink className={({ isActive }) => (isActive ? "active" : "")} to="/cart">Себет</NavLink></li>
            {currentUser?.role === "admin" && <li><NavLink className={({ isActive }) => (isActive ? "active" : "")} to="/admin">Админ</NavLink></li>}
            {currentUser ? (
              <li className="user-chip">
                <span>{currentUser.fullName}</span>
                <small>{enrolledCourseIds.length} курс ашық</small>
              </li>
            ) : null}
            {!currentUser ? (
              <li><NavLink className={({ isActive }) => (isActive ? "active" : "")} to="/signin">Кіру</NavLink></li>
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
