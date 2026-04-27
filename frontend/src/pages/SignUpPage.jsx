import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "../style/form.css";

function SignUpPage({ showToast }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
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
      await api.signUp(formData);
      showToast("Тіркелу сәтті өтті!", "success");
      navigate("/signin");
    } catch (error) {
      showToast(error.message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main>
      <h2 className="sign-title">Тіркелу</h2>
      <form className="auth-form" onSubmit={handleSubmit}>
        <label htmlFor="fullName">Аты-жөні:</label>
        <input
          type="text"
          id="fullName"
          name="fullName"
          required
          minLength={3}
          maxLength={40}
          value={formData.fullName}
          onChange={handleChange}
        />

        <label htmlFor="email">Email:</label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleChange}
        />

        <label htmlFor="phone">Телефон:</label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />

        <label htmlFor="password">Құпия сөз:</label>
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
          {isSubmitting ? "Күтіңіз..." : "Тіркелу"}
        </button>

        <p className="form-switch">
          Аккаунтыңыз бар ма?
          <button type="button" className="inline-link-btn" onClick={() => navigate("/signin")}>
            Кіру
          </button>
        </p>
      </form>
    </main>
  );
}

export default SignUpPage;
