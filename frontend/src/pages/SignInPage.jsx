import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "../style/form.css";

function SignInPage({ setCurrentUser, setFavorites, showToast }) {
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
      localStorage.setItem("currentUser", JSON.stringify(response.user));
      setCurrentUser(response.user);
      setFavorites(response.likedCourseIds || []);
      showToast(`${response.user.fullName}, қош келдіңіз!`, "success");
      navigate("/");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h2 className="sign-title">Кіру</h2>

      <form onSubmit={handleSubmit}>
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

        <p>
          Аккаунтыңыз жоқ па?{" "}
          <span onClick={() => navigate("/signup")} style={{ cursor: "pointer" }}>
            Тіркелу
          </span>
        </p>
      </form>
    </main>
  );
}

export default SignInPage;
