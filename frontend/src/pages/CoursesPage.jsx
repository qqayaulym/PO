import React, { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import "../style/courses.css";

function CoursesPage({ cart, setCart, currentUser, favorites, setFavorites, showToast }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [courses, setCourses] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const deferredSearch = useDeferredValue(search);
  const navigate = useNavigate();

  const filterOptions = useMemo(
    () => [
      { value: "all", label: "Барлығы" },
      { value: "free", label: "Тегін" },
      { value: "paid", label: "Ақылы" },
      ...Array.from(new Set(courses.map((course) => course.level))).map((level) => ({
        value: `level:${level}`,
        label: level,
      })),
    ],
    [courses]
  );

  useEffect(() => {
    let active = true;

    api.getCourses({
      filter,
      search: deferredSearch,
      sort,
      page,
      limit: 6,
    })
      .then((response) => {
        if (!active) return;
        setCourses(response.items || []);
        setTotalPages(response.totalPages || 1);
      })
      .catch((error) => {
        if (!active) return;
        showToast?.(error.message, "error");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filter, deferredSearch, sort, page, showToast]);

  const toggleCart = (id) => {
    setCart((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleSearchChange = (event) => {
    setIsLoading(true);
    setPage(1);
    setSearch(event.target.value);
  };

  const handleFilterChange = (value) => {
    setIsLoading(true);
    setPage(1);
    setFilter(value);
  };

  const handleSortChange = (event) => {
    setIsLoading(true);
    setPage(1);
    setSort(event.target.value);
  };

  const goToPage = (nextPage) => {
    setIsLoading(true);
    setPage(nextPage);
  };

  const toggleFavorite = async (id) => {
    if (!currentUser?.id) {
      showToast?.("Лайк қою үшін жүйеге кіріңіз.", "error");
      return;
    }

    try {
      const response = await api.toggleLike(id, currentUser.id);
      setFavorites((prev) =>
        response.liked ? [...prev, id] : prev.filter((item) => item !== id)
      );
      setCourses((prev) =>
        prev.map((course) =>
          course.id === id ? { ...course, likes: response.course.likes } : course
        )
      );
      showToast?.(
        response.liked ? "Курсқа лайк қойылды" : "Лайк алынып тасталды",
        response.liked ? "success" : "info"
      );
    } catch (error) {
      showToast?.(error.message, "error");
    }
  };

  return (
    <main>
      <h2 id="courses-page-h2">Оқу бағдарламасы</h2>

      <section className="controls">
        <div className="search-box">
          <input
            type="text"
            placeholder="Курс іздеу..."
            value={search}
            onChange={handleSearchChange}
          />
        </div>

        <div className="filter-group">
          {filterOptions.map((option) => (
            <button
              key={option.value}
              className={`filter-btn ${filter === option.value ? "active" : ""}`}
              onClick={() => handleFilterChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="sort-group">
          <select value={sort} onChange={handleSortChange}>
            <option value="">Сұрыптау</option>
            <option value="title">Атауы бойынша</option>
            <option value="price-asc">Арзаннан қымбатқа</option>
            <option value="price-desc">Қымбаттан арзанға</option>
            <option value="likes">Танымалдылығы</option>
            <option value="level">Деңгейі бойынша</option>
          </select>
        </div>
      </section>

      <div className="courses-container">
        {isLoading ? (
          <p className="no-results">Жүктелуде...</p>
        ) : courses.length === 0 ? (
          <p className="no-results">Нәтиже табылмады</p>
        ) : (
          courses.map((course) => (
            <div key={course.id} className="course-card">
              <div className="course-info">
                <span className="category-tag">{course.level}</span>
                <h3>{course.title}</h3>
                <p>{course.description}</p>
                <p className="price">{course.price === 0 ? "Тегін" : `${course.price} ₸`}</p>
              </div>

              <div className="course-actions">
                <button
                  className={`fav-btn ${favorites.includes(course.id) ? "active" : ""}`}
                  onClick={() => toggleFavorite(course.id)}
                >
                  {favorites.includes(course.id) ? "Лайкты алып тастау" : "Лайк қою"}{" "}
                  <span>({course.likes || 0})</span>
                </button>

                <button className="cart-btn" onClick={() => toggleCart(course.id)}>
                  {cart.includes(course.id) ? "Себеттен алып тастау" : "Себетке қосу"}
                </button>

                <button className="read-btn" onClick={() => navigate(`/course/${course.url}`)}>
                  Оқу →
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button disabled={page <= 1} onClick={() => goToPage(page - 1)}>
          ← Алдыңғы
        </button>
        <span>{page} / {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
          Келесі →
        </button>
      </div>
    </main>
  );
}

export default CoursesPage;
