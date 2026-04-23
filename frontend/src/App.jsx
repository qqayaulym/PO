import React, { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import useLocalStorage from "./hooks/useLocalStorage";
import { useToast } from "./hooks/useToast";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Notification from "./components/Notification";
import ScrollTopButton from "./components/ScrollTopButton";

import HomePage from "./pages/HomePage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import CoursesPage from "./pages/CoursesPage";
import CartPage from "./pages/CartPage";
import AdminPage from "./pages/AdminPage";
import LessonPage from "./pages/LessonPage";
import NotFoundPage from "./pages/NotFoundPage";

import "./style/style.css";

function RequireAuth({ currentUser, adminOnly = false, children }) {
  if (!currentUser) {
    return <Navigate to="/signin" />;
  }

  if (adminOnly && currentUser.role !== "admin") {
    return <Navigate to="/courses" />;
  }

  return children;
}

export default function App() {
  const location = useLocation();
  const hideLayout =
    location.pathname.startsWith("/signin") || location.pathname.startsWith("/signup");

  const [theme, setTheme] = useLocalStorage("theme", "light");
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const raw = localStorage.getItem("currentUser");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const [cart, setCart] = useLocalStorage("cart", []);
  const [favorites, setFavorites] = useLocalStorage("favorites", []);
  const { toasts, show: showToast, remove } = useToast();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  const toggleTheme = () => setTheme((value) => (value === "dark" ? "light" : "dark"));

  const logout = () => {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setFavorites([]);
    showToast("Жүйеден шықтыңыз", "info");
  };

  return (
    <div className="app-wrapper">
      {!hideLayout && (
        <Header
          currentUser={currentUser}
          logout={logout}
          toggleTheme={toggleTheme}
          theme={theme}
        />
      )}

      <main>
        <Routes>
          <Route path="/" element={<HomePage currentUser={currentUser} />} />
          <Route
            path="/signin"
            element={
              <SignInPage
                setCurrentUser={setCurrentUser}
                setFavorites={setFavorites}
                showToast={showToast}
              />
            }
          />
          <Route path="/signup" element={<SignUpPage showToast={showToast} />} />

          <Route
            path="/courses"
            element={
              <RequireAuth currentUser={currentUser}>
                <CoursesPage
                  cart={cart}
                  setCart={setCart}
                  currentUser={currentUser}
                  favorites={favorites}
                  setFavorites={setFavorites}
                  showToast={showToast}
                />
              </RequireAuth>
            }
          />

          <Route
            path="/cart"
            element={
              <RequireAuth currentUser={currentUser}>
                <CartPage cart={cart} setCart={setCart} showToast={showToast} />
              </RequireAuth>
            }
          />

          <Route
            path="/admin"
            element={
              <RequireAuth currentUser={currentUser} adminOnly>
                <AdminPage showToast={showToast} />
              </RequireAuth>
            }
          />

          <Route
            path="/course/:id"
            element={
              <RequireAuth currentUser={currentUser}>
                <LessonPage showToast={showToast} />
              </RequireAuth>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!hideLayout && <Footer />}

      <Notification toasts={toasts} remove={remove} />
      <ScrollTopButton />
    </div>
  );
}
