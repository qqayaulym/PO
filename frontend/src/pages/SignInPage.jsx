import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "../style/form.css";

function SignInPage({ setCurrentUser, setFavorites, setEnrolledCourseIds, showToast }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await api.signIn(formData);
      setCurrentUser(response.user);
      setFavorites(response.likedCourseIds || []);
      setEnrolledCourseIds(response.enrolledCourseIds || []);
      showToast(`${response.user.fullName}, қош келдіңіз!`, "success");
      navigate("/");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-intro">
        <p className="auth-kicker">SQL Study Hub</p>
        <h2 className="sign-title">Кіру</h2>
        <p className="auth-subtitle">
          Оқу прогресін, ашылған курстарды және сабақтарды жалғастыру үшін аккаунтқа кіріңіз.
        </p>
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
        />

        <label htmlFor="password">Құпиясөз:</label>
        <input
          type="password"
          id="password"
          name="password"
          required
          minLength={6}
          value={formData.password}
          onChange={handleChange}
        />

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Күтіңіз..." : "Кіру"}
        </button>

        <p className="form-switch">
          Аккаунтыңыз жоқ па?
          <button type="button" className="inline-link-btn" onClick={() => navigate("/signup")}>
            Тіркелу
          </button>
        </p>
      </form>
    </main>
  );
}

export default SignInPage;
