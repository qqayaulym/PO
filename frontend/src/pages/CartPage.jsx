import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "../style/cart.css";

function CartPage({
  cart = [],
  setCart,
  currentUser,
  enrolledCourseIds = [],
  setEnrolledCourseIds,
  showToast,
}) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    api.getAllCourses()
      .then((response) => setCourses(response.items || []))
      .catch((error) => showToast?.(error.message, "error"));
  }, [showToast]);

  const cartItems = useMemo(
    () =>
      courses.filter(
        (course) => cart.includes(course.id) && !enrolledCourseIds.includes(course.id)
      ),
    [cart, courses, enrolledCourseIds]
  );

  const total = useMemo(
    () => cartItems.reduce((acc, course) => acc + course.price, 0),
    [cartItems]
  );

  const freeCount = useMemo(
    () => cartItems.filter((course) => course.price === 0).length,
    [cartItems]
  );

  const paidCount = cartItems.length - freeCount;

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((itemId) => itemId !== id));
    showToast?.("Курс себеттен өшірілді", "info");
  };

  const handleCheckout = async () => {
    if (!currentUser?.id) {
      showToast?.("Алдымен жүйеге кіріңіз.", "error");
      navigate("/signin");
      return;
    }

    if (cartItems.length === 0) {
      showToast?.("Себетте ашылмаған курс жоқ.", "info");
      return;
    }

    try {
      setIsCheckingOut(true);
      const response = await api.checkout({
        userId: currentUser.id,
        courseIds: cartItems.map((course) => course.id),
      });

      setEnrolledCourseIds(response.enrolledCourseIds || []);
      setCart((prev) =>
        prev.filter((courseId) => !cartItems.some((course) => course.id === courseId))
      );

      showToast?.(
        response.totalAmount > 0
          ? `Сатып алу сәтті өтті. ${response.createdCount} курс ашылды.`
          : `Тегін курстар ашылды: ${response.createdCount}`,
        "success"
      );

      navigate("/courses");
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setIsCheckingOut(false);
    }
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
          <p>Себетіңізде сатып алынбаған курс жоқ</p>
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
                    Қарау
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
            <div className="summary-breakdown">
              <span>{freeCount} тегін</span>
              <span>{paidCount} ақылы</span>
            </div>
            <div className="summary-details">
              <span>Жалпы сома:</span>
              <span className="total-amount">{total} ₸</span>
            </div>
            <p className="summary-note">
              Сатып алу аяқталғаннан кейін курстар аккаунтыңызға бекітіледі және бірден ашылады.
            </p>
            <button className="checkout-btn" disabled={isCheckingOut} onClick={handleCheckout}>
              {isCheckingOut ? "Өңделуде..." : "Сатып алуды аяқтау"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default CartPage;
