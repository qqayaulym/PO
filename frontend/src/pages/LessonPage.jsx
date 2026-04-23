import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import "../style/course.css";

function LessonContent({ course, nextCourse, navigate, showToast }) {
  const [userCode, setUserCode] = useState("");
  const [feedback, setFeedback] = useState({ text: "", type: "" });
  const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizResult, setQuizResult] = useState("");
  const lesson = course?.lesson;

  if (!lesson) {
    return <div className="text-white text-center py-20">Сабақ табылмады.</div>;
  }

  const hasQuiz = lesson.quiz?.question && Array.isArray(lesson.quiz?.options) && lesson.quiz.options.length > 1;

  const checkTask = () => {
    const code = userCode.toLowerCase().trim();
    if (!code) {
      setFeedback({ text: "Ешнәрсе жазбадыңыз!", type: "error" });
      return;
    }

    const isCorrect = lesson.requiredSteps.every((step) => code.includes(step.toLowerCase()));

    if (isCorrect) {
      setFeedback({ text: "Тамаша! Тапсырма сәтті орындалды!", type: "success" });
      showToast("Тапсырма орындалды!", "success");
    } else {
      setFeedback({
        text: "Қате немесе командалар жетіспейді. Қайта тексеріңіз.",
        type: "error",
      });
    }
  };

  const checkQuiz = () => {
    if (!hasQuiz) return;
    if (quizAnswer === null) {
      setQuizResult("Жауап нұсқасын таңдаңыз.");
      return;
    }

    if (quizAnswer === lesson.quiz.answerIndex) {
      setQuizResult("Дұрыс! Мини-тест сәтті өтті.");
      showToast("Мини-тест дұрыс орындалды", "success");
    } else {
      setQuizResult("Қате жауап. Тағы бір рет көріңіз.");
    }
  };

  return (
    <main className="animate-fade-in lesson-page">
      <section className="theory">
        <h2>{lesson.title}</h2>
        <div className="theory-content">
          <p>{lesson.theory}</p>
          <pre className="code-block">{lesson.preCode}</pre>

          <article className="materials-block">
            <h3>Қосымша материалдар</h3>
            <pre className="materials-text">{lesson.downloadContent}</pre>
          </article>

          <div className="download-container">
            <button
              className="download-btn"
              onClick={() => {
                const blob = new Blob([lesson.downloadContent], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.href = url;
                link.download = `sqlite_${course.slug}.txt`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Конспектіні жүктеу (.txt)
            </button>
          </div>
        </div>
      </section>

      <section className="practice">
        <h2>Практикалық тапсырма</h2>
        <p><i>Тапсырма: {lesson.task}</i></p>
        <textarea
          value={userCode}
          onChange={(event) => setUserCode(event.target.value)}
          placeholder="SQL командаларын осында енгізіңіз..."
        />
        <div className="btn-group">
          <button className="btn-check" onClick={checkTask}>Жауапты тексеру</button>
          <button className="btn-reset" onClick={() => setUserCode("")}>Тазалау</button>
        </div>
        {feedback.text && <div id="feedback" className={feedback.type}>{feedback.text}</div>}

        {hasQuiz && (
          <section className="quiz-card">
            <h3>Мини-тест</h3>
            <p>{lesson.quiz.question}</p>
            <div className="quiz-options">
              {lesson.quiz.options.map((option, index) => (
                <label key={`${option}-${index}`} className="quiz-option">
                  <input
                    type="radio"
                    name="lesson-quiz"
                    checked={quizAnswer === index}
                    onChange={() => setQuizAnswer(index)}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </div>
            <button className="btn-check" onClick={checkQuiz}>Мини-тестті тексеру</button>
            {quizResult ? <p className="quiz-result">{quizResult}</p> : null}
          </section>
        )}

        {feedback.type === "success" && (
          <button
            className="next-lesson"
            onClick={() => navigate(nextCourse ? `/course/${nextCourse.slug}` : "/courses")}
          >
            {nextCourse ? "Келесі сабаққа өту" : "Курстарға оралу"}
          </button>
        )}
      </section>
    </main>
  );
}

const LessonPage = ({ showToast }) => {
  const navigate = useNavigate();
  const { id: slug } = useParams();
  const [course, setCourse] = useState(undefined);
  const [allCourses, setAllCourses] = useState([]);

  useEffect(() => {
    let active = true;

    Promise.all([api.getCourse(slug), api.getAllCourses()])
      .then(([courseResponse, allResponse]) => {
        if (!active) return;
        setCourse(courseResponse.item || null);
        setAllCourses(allResponse.items || []);
      })
      .catch(() => {
        if (!active) return;
        setCourse(null);
        setAllCourses([]);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const nextCourse = useMemo(() => {
    if (!course || allCourses.length === 0) return null;

    const sorted = [...allCourses].sort((a, b) => {
      if (a.orderIndex === b.orderIndex) return a.id - b.id;
      return a.orderIndex - b.orderIndex;
    });
    const currentIndex = sorted.findIndex((item) => item.slug === course.slug);
    if (currentIndex < 0 || currentIndex === sorted.length - 1) return null;

    return sorted[currentIndex + 1];
  }, [course, allCourses]);

  if (course === undefined) {
    return <div className="text-white text-center py-20">Жүктелуде...</div>;
  }

  return <LessonContent course={course} nextCourse={nextCourse} navigate={navigate} showToast={showToast} />;
};

export default LessonPage;
