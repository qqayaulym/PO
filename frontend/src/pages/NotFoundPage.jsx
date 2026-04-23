import { useNavigate } from "react-router-dom";
import "../style/notfound.css";

export default function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <main className="not-found-page">
      <section className="not-found-card">
        <span className="not-found-code">404 Error</span>
        <h1 className="not-found-title">Бет бұлттардың арасына жасырынып қалды</h1>
        <p className="not-found-text">
          Сіз іздеген парақша табылмады немесе мекенжайы өзгерген болуы мүмкін.
          Басты бетке оралып, курстарды қайта қарап шығайық.
        </p>

        <div className="not-found-accent">
          <div className="not-found-pill">SQL әлеміне қайта оралу</div>
          <div className="not-found-pill">Жаңа курстарды көру</div>
          <div className="not-found-pill">Қауіпсіз навигация</div>
        </div>

        <div className="not-found-actions">
          <button className="not-found-primary" onClick={() => navigate("/")}>
            Басты бетке қайту
          </button>
          <button className="not-found-secondary" onClick={() => navigate("/courses")}>
            Курстар тізіміне өту
          </button>
        </div>
      </section>
    </main>
  );
}
