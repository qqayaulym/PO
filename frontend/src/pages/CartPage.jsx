import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "../style/cart.css";

function CartPage({ cart = [], setCart, showToast }) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    api.getAllCourses()
      .then((response) => setCourses(response.items || []))
      .catch((error) => showToast?.(error.message, "error"));
  }, [showToast]);

  const cartItems = useMemo(
    () => courses.filter((course) => cart.includes(course.id)),
    [cart, courses]
  );

  const total = useMemo(
    () => cartItems.reduce((acc, course) => acc + course.price, 0),
    [cartItems]
  );

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((itemId) => itemId !== id));
    showToast?.("Курс себеттен өшірілді", "info");
  };

  return (
    <main className="cart-container">
      <div className="cart-header">
        <div>
          <p className="cart-kicker">Checkout</p>
          <h2>Менің себетім</h2>
          <p className="cart-subtitle">Таңдалған курстарды қарап, оқу жолыңызды жалғастырыңыз.</p>
        </div>
        <button className="back-link" onClick={() => navigate("/courses")}>
          ← Курстарға қайту
        </button>
      </div>

      {cartItems.length === 0 ? (
        <div className="empty-cart">
          <div className="empty-icon">🛒</div>
          <p>Себетіңіз әзірге бос</p>
          <button className="main-btn" onClick={() => navigate("/courses")}>
            Курстарды қарау
          </button>
        </div>
      ) : (
        <div className="cart-content">
          <div className="cart-list">
            {cartItems.map((course) => (
              <div key={course.id} className="cart-item">
                <div className="item-info">
                  <span className="item-badge">{course.level || "Курс"}</span>
                  <h4>{course.title}</h4>
                  <p className="item-description">{course.description}</p>
                  <div className="item-meta">
                    <span className="item-category">{course.category}</span>
                    <span className="item-likes">❤️ {course.likes || 0}</span>
                  </div>
                </div>

                <div className="item-controls">
                  <span className="item-price">{course.price === 0 ? "Тегін" : `${course.price} ₸`}</span>
                  <button className="open-btn" onClick={() => navigate(`/course/${course.url}`)}>
                    Оқу
                  </button>
                  <button className="delete-btn" onClick={() => removeFromCart(course.id)}>
                    Өшіру
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-chip">{cartItems.length} курс таңдалды</div>
            <div className="summary-details">
              <span>Жалпы сома:</span>
              <span className="total-amount">{total} ₸</span>
            </div>
            <p className="summary-note">
              Курстар сатып алынғаннан кейін кез келген уақытта оқу бетіне орала аласыз.
            </p>
            <button
              className="checkout-btn"
              onClick={() => showToast?.("Төлем модулі кейін қосылады", "info")}
            >
              Төлем жасауға өту
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default CartPage;
