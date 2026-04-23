import React, { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { buildLessonDraft, emptyCourseForm } from "../utils/courseUtils";
import "../style/admin.css";

function AdminPage({ showToast }) {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [lessonCourseId, setLessonCourseId] = useState(null);
  const [lessonForm, setLessonForm] = useState(buildLessonDraft(null));
  const [isLoading, setIsLoading] = useState(true);

  const stats = useMemo(() => {
    const totalRevenue = courses.reduce((sum, course) => sum + (course.price || 0), 0);
    const totalLikes = courses.reduce((sum, course) => sum + (course.likes || 0), 0);
    return {
      totalRevenue,
      totalLikes,
      lessonCount: courses.filter((course) => course.lesson).length,
    };
  }, [courses]);

  const applyDashboard = (usersResponse, coursesResponse, preferredCourseId) => {
    const nextUsers = usersResponse.items || [];
    const nextCourses = coursesResponse.items || [];
    setUsers(nextUsers);
    setCourses(nextCourses);

    if (nextCourses.length > 0) {
      const selectedCourse =
        nextCourses.find((course) => course.id === preferredCourseId) || nextCourses[0];
      setLessonCourseId(selectedCourse.id);
      setLessonForm(buildLessonDraft(selectedCourse));
    } else {
      setLessonCourseId(null);
      setLessonForm(buildLessonDraft(null));
    }
  };

  const loadDashboard = async (preferredCourseId) => {
    try {
      const [usersResponse, coursesResponse] = await Promise.all([api.getUsers(), api.getAllCourses()]);
      applyDashboard(usersResponse, coursesResponse, preferredCourseId);
    } catch (error) {
      showToast?.(error.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    Promise.all([api.getUsers(), api.getAllCourses()])
      .then(([usersResponse, coursesResponse]) => {
        if (!active) return;
        applyDashboard(usersResponse, coursesResponse);
        setIsLoading(false);
      })
      .catch((error) => {
        if (!active) return;
        showToast?.(error.message, "error");
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [showToast]);

  const exportToExcel = () => {
    const rows = [
      ["Course", "Level", "Price", "Likes", "Lesson"],
      ...courses.map((course) => [
        course.title,
        course.level,
        course.price,
        course.likes || 0,
        course.lesson?.title || "Сабақ жоқ",
      ]),
    ];
    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "admin_courses.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUserDelete = async (userId) => {
    if (!window.confirm("Пайдаланушыны өшіргіңіз келе ме?")) return;

    try {
      setIsLoading(true);
      await api.deleteUser(userId);
      await loadDashboard(lessonCourseId);
      showToast?.("Пайдаланушы өшірілді", "info");
    } catch (error) {
      showToast?.(error.message, "error");
    }
  };

  const handleCourseFormChange = ({ target: { name, value } }) => {
    setCourseForm((prev) => ({
      ...prev,
      [name]: name === "price" ? Number(value) : value,
    }));
  };

  const submitCourse = async (event) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      if (courseForm.id) {
        await api.updateCourse(courseForm.id, courseForm);
        showToast?.("Курс жаңартылды", "success");
      } else {
        await api.createCourse(courseForm);
        showToast?.("Жаңа курс қосылды", "success");
      }

      setCourseForm(emptyCourseForm);
      await loadDashboard(lessonCourseId);
    } catch (error) {
      showToast?.(error.message, "error");
    }
  };

  const startCourseEdit = (course) => {
    setCourseForm({
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      category: course.category,
      price: course.price,
    });
  };

  const deleteCourse = async (courseId) => {
    if (!window.confirm("Курсты өшіргіңіз келе ме?")) return;

    try {
      setIsLoading(true);
      await api.deleteCourse(courseId);
      await loadDashboard(lessonCourseId === courseId ? null : lessonCourseId);
      showToast?.("Курс және оған қатысты сабақ өшірілді", "info");
    } catch (error) {
      showToast?.(error.message, "error");
    }
  };

  const handleLessonFormChange = ({ target: { name, value } }) => {
    setLessonForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitLesson = async (event) => {
    event.preventDefault();

    if (!lessonCourseId) {
      showToast?.("Алдымен курс таңдаңыз", "error");
      return;
    }

    try {
      setIsLoading(true);
      await api.updateLesson(lessonCourseId, {
        ...lessonForm,
        requiredSteps: lessonForm.requiredSteps
          .split(",")
          .map((step) => step.trim())
          .filter(Boolean),
      });
      await loadDashboard(lessonCourseId);
      showToast?.("Сабақ сақталды", "success");
    } catch (error) {
      showToast?.(error.message, "error");
    }
  };

  const startLessonEdit = (courseId) => {
    const course = courses.find((item) => item.id === courseId) || null;
    setLessonCourseId(courseId);
    setLessonForm(buildLessonDraft(course));
  };

  return (
    <main className="admin-container">
      <section className="admin-hero">
        <div>
          <p className="admin-kicker">Dashboard</p>
          <h2>Админ панель</h2>
          <p className="admin-subtitle">
            Курстарды, сабақтарды және тіркелген қолданушыларды бір жерден басқарыңыз.
          </p>
        </div>
        <button className="Excell-button" onClick={exportToExcel}>
          Экспорт (CSV)
        </button>
      </section>

      <section className="admin-stats">
        <article className="stat-card">
          <span>Пайдаланушылар</span>
          <strong>{users.length}</strong>
        </article>
        <article className="stat-card">
          <span>Курстар</span>
          <strong>{courses.length}</strong>
        </article>
        <article className="stat-card">
          <span>Сабақтар</span>
          <strong>{stats.lessonCount}</strong>
        </article>
        <article className="stat-card">
          <span>Лайктар</span>
          <strong>{stats.totalLikes}</strong>
        </article>
      </section>

      <section className="admin-section">
        <h3>Тіркелген қолданушылар</h3>
        <div className="admin-list">
          {isLoading ? (
            <p className="admin-empty">Жүктелуде...</p>
          ) : users.length === 0 ? (
            <p className="admin-empty">Әзірге тіркелген қолданушылар жоқ.</p>
          ) : (
            users.map((user) => (
              <div className="admin-row" key={user.id}>
                <div>
                  <strong>{user.full_name}</strong>
                  <p>{user.email}</p>
                </div>
                <div className="row-meta">
                  <span>{user.phone || "Телефон жоқ"}</span>
                  <button className="danger-btn" onClick={() => handleUserDelete(user.id)}>
                    Жою
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="admin-grid">
        <section className="admin-section">
          <div className="section-head">
            <h3>Курстар</h3>
            <span className="section-badge">{courses.length} курс</span>
          </div>

          <form className="admin-form" onSubmit={submitCourse}>
            <input name="title" placeholder="Курс атауы" value={courseForm.title} onChange={handleCourseFormChange} />
            <textarea
              name="description"
              placeholder="Курс сипаттамасы"
              value={courseForm.description}
              onChange={handleCourseFormChange}
            />
            <div className="form-row">
              <select name="level" value={courseForm.level} onChange={handleCourseFormChange}>
                <option value="Бастауыш">Бастауыш</option>
                <option value="Орта">Орта</option>
                <option value="Күрделі">Күрделі</option>
              </select>
              <input name="category" placeholder="Санат" value={courseForm.category} onChange={handleCourseFormChange} />
              <input type="number" min="0" name="price" placeholder="Бағасы" value={courseForm.price} onChange={handleCourseFormChange} />
            </div>
            <div className="form-actions">
              <button type="submit">{courseForm.id ? "Курсты сақтау" : "Курс қосу"}</button>
              <button type="button" className="ghost-btn" onClick={() => setCourseForm(emptyCourseForm)}>
                Тазалау
              </button>
            </div>
          </form>

          <div className="admin-card-list">
            {courses.map((course) => (
              <article key={course.id} className="course-admin-card">
                <div className="course-admin-head">
                  <div>
                    <span className="mini-badge">{course.level}</span>
                    <h4>{course.title}</h4>
                  </div>
                  <span className="likes-chip">❤️ {course.likes || 0}</span>
                </div>
                <p>{course.description}</p>
                <div className="course-admin-meta">
                  <span>{course.category}</span>
                  <span>{course.price === 0 ? "Тегін" : `${course.price} ₸`}</span>
                  <span>{course.lesson?.title || "Сабақ жоқ"}</span>
                </div>
                <div className="card-actions">
                  <button onClick={() => startCourseEdit(course)}>Өзгерту</button>
                  <button className="ghost-btn" onClick={() => startLessonEdit(course.id)}>
                    Сабақты ашу
                  </button>
                  <button className="danger-btn" onClick={() => deleteCourse(course.id)}>
                    Жою
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-section">
          <div className="section-head">
            <h3>Сабақтарды басқару</h3>
            <span className="section-badge">{stats.totalRevenue} ₸ каталог құны</span>
          </div>

          <form className="admin-form" onSubmit={submitLesson}>
            <select value={lessonCourseId || ""} onChange={(event) => startLessonEdit(Number(event.target.value))}>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
            <input name="title" placeholder="Сабақ атауы" value={lessonForm.title} onChange={handleLessonFormChange} />
            <textarea name="theory" placeholder="Теория" value={lessonForm.theory} onChange={handleLessonFormChange} />
            <textarea name="preCode" placeholder="Код мысалы" value={lessonForm.preCode} onChange={handleLessonFormChange} />
            <textarea name="task" placeholder="Тапсырма" value={lessonForm.task} onChange={handleLessonFormChange} />
            <input
              name="requiredSteps"
              placeholder="Тексеру қадамдары, үтір арқылы"
              value={lessonForm.requiredSteps}
              onChange={handleLessonFormChange}
            />
            <textarea
              name="downloadContent"
              placeholder="Жүктелетін конспект мәтіні"
              value={lessonForm.downloadContent}
              onChange={handleLessonFormChange}
            />
            <div className="form-actions">
              <button type="submit">Сабақты сақтау</button>
              <button
                type="button"
                className="danger-btn"
                onClick={() => setLessonForm(buildLessonDraft(courses.find((course) => course.id === lessonCourseId) || null))}
              >
                Сабақты тазарту
              </button>
            </div>
          </form>

          <div className="admin-list">
            {courses.map((course) => (
              <div className="admin-row lesson-row" key={course.id}>
                <div>
                  <strong>{course.title}</strong>
                  <p>{course.lesson?.title || "Сабақ әлі толтырылмаған"}</p>
                </div>
                <div className="row-meta">
                  <span>{(course.lesson?.requiredSteps || []).length} қадам</span>
                  <button onClick={() => startLessonEdit(course.id)}>Өңдеу</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="admin-section">
        <h3>Статистика</h3>
        <div className="stats-list">
          <p>Пайдаланушылар саны: <span id="stat-users">{users.length}</span></p>
          <p>Курстар саны: <span id="stat-courses">{courses.length}</span></p>
          <p>Сабақ саны: <span>{stats.lessonCount}</span></p>
          <p>Жалпы лайк: <span>{stats.totalLikes}</span></p>
        </div>
      </section>
    </main>
  );
}

export default AdminPage;
