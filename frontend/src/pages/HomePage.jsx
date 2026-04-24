import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "../style/main.css";
import "../style/style.css";

const defaultStats = {
  users: 120,
  courses: 6,
  lessons: 6,
  likes: 69,
  enrollments: 32,
};

function HomePage({ currentUser, enrolledCourseIds = [] }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState(defaultStats);

  useEffect(() => {
    let active = true;

    api.getDashboard()
      .then((response) => {
        if (active) {
          setStats({
            ...defaultStats,
            ...response,
          });
        }
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <div className="primary-div">
        <div className="left-content">
          <span className="hero-kicker">SQL learning platform</span>
          <h2>SQLite-ті теориямен емес, нақты практикамен үйреніңіз</h2>

          <p>
            SQLite-тың негіздерінен бастап күрделі сұраныстарға дейін: деректер базасымен
            жұмыс істеудің барлық қажетті дағдыларын нақты практикалық жобалар арқылы
            меңгеріңіз.
          </p>

          <div className="hero-metrics">
            <div>
              <strong>{stats.courses}</strong>
              <span>курс</span>
            </div>
            <div>
              <strong>{stats.lessons}</strong>
              <span>сабақ</span>
            </div>
            <div>
              <strong>{stats.enrollments}</strong>
              <span>ашылған оқу жолы</span>
            </div>
          </div>

          <div className="buttons">
            {!currentUser && (
              <button onClick={() => navigate("/signup")} className="signUp-button">
                Тіркелу
              </button>
            )}

            <button onClick={() => navigate("/courses")} className="to-courses-button">
              Курстарға өту
            </button>

            {currentUser && (
              <button onClick={() => navigate("/cart")} className="ghost-hero-button">
                Себет пен сатып алулар
              </button>
            )}
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
        <div className="roadmap-head">
          <div>
            <h3>Оқу жол картасы</h3>
            <p>
              Негізден бастап аналитикалық SQL-ге дейін бірізді маршрутпен өтесіз.
            </p>
          </div>
          {currentUser ? (
            <div className="roadmap-progress">
              <strong>{enrolledCourseIds.length}</strong>
              <span>ашылған курс</span>
            </div>
          ) : null}
        </div>
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
          <article>
            <h4>4-қадам: Аналитика</h4>
            <p>GROUP BY, COUNT және AVG арқылы деректерден қорытынды шығарасыз.</p>
          </article>
        </div>
      </section>

      <section className="platform-strip">
        <article>
          <strong>{stats.users}+</strong>
          <span>тіркелген қолданушы</span>
        </article>
        <article>
          <strong>{stats.likes}</strong>
          <span>курстарға қойылған лайк</span>
        </article>
        <article>
          <strong>100%</strong>
          <span>қазақ тіліндегі контент</span>
        </article>
      </section>
    </main>
  );
}

export default HomePage;
