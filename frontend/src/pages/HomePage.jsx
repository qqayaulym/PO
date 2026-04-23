import React from "react";
import { useNavigate } from "react-router-dom";
import "../style/main.css";
import "../style/style.css";

function HomePage({ currentUser }) {
  const navigate = useNavigate();

  return (
    <main>
      <div className="primary-div">
        <div className="left-content">
          <h2>Басты бет</h2>

          <p>
            SQLite-тың негіздерінен бастап күрделі сұраныстарға дейін: деректер базасымен
            жұмыс істеудің барлық қажетті дағдыларын нақты практикалық жобалар арқылы
            меңгеріңіз.
          </p>

          <div className="buttons">
            {!currentUser && (
              <button onClick={() => navigate("/signup")} className="signUp-button">
                Тіркелу
              </button>
            )}

            <button onClick={() => navigate("/courses")} className="to-courses-button">
              Курстарға өту
            </button>
          </div>
        </div>

        <div className="right-image">
          <img src="/1759225973086.png" alt="SQLite" className="MySQL-photo" />
        </div>
      </div>

      <div className="container">
        <div className="secondary-div">
          <img src="/database.svg" alt="database" />
          <h3>Практикалық сабақтар</h3>
        </div>

        <div className="secondary-div">
          <img src="/test.jpg" alt="test" />
          <h3>Мини-тесттер мен бағалау</h3>
        </div>

        <div className="secondary-div">
          <img src="/Flag_of_Kazakhstan.svg.png" alt="content" />
          <h3>Қазақша контент</h3>
        </div>
      </div>

      <section className="roadmap-section">
        <h3>Оқу жол картасы</h3>
        <div className="roadmap-grid">
          <article>
            <h4>1-қадам: Негіздер</h4>
            <p>Кесте құру, өріс типтері, INSERT және SELECT-пен бастайсыз.</p>
          </article>
          <article>
            <h4>2-қадам: Сұраулар</h4>
            <p>WHERE, ORDER BY, LIMIT арқылы нақты фильтрлеуді үйренесіз.</p>
          </article>
          <article>
            <h4>3-қадам: Байланыстар</h4>
            <p>JOIN және foreign key арқылы бірнеше кестемен жұмыс істейсіз.</p>
          </article>
        </div>
      </section>
    </main>
  );
}

export default HomePage;
