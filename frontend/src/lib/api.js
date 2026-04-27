const rawApiUrl = import.meta.env.VITE_API_URL?.trim();

const API_BASE = rawApiUrl
  ? `${rawApiUrl.replace(/\/+$/, "")}${rawApiUrl.replace(/\/+$/, "").endsWith("/api") ? "" : "/api"}`
  : "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let data = null;

  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!response.ok) {
    throw new Error(data?.message || "Сервермен байланыста қате болды.");
  }

  return data;
}

export const api = {
  signUp(payload) {
    return request("/auth/signup", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  signIn(payload) {
    return request("/auth/signin", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getCourses(params) {
    const query = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        query.set(key, String(value));
      }
    });

    const suffix = query.toString() ? `?${query.toString()}` : "";
    return request(`/courses${suffix}`);
  },
  getAllCourses() {
    return request("/courses/all");
  },
  getCourse(slug) {
    return request(`/courses/${slug}`);
  },
  createCourse(payload) {
    return request("/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateCourse(id, payload) {
    return request(`/courses/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  deleteCourse(id) {
    return request(`/courses/${id}`, {
      method: "DELETE",
    });
  },
  updateLesson(courseId, payload) {
    return request(`/courses/${courseId}/lesson`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  toggleLike(courseId, userId) {
    return request(`/courses/${courseId}/like`, {
      method: "POST",
      body: JSON.stringify({ userId }),
    });
  },
  getUsers() {
    return request("/users");
  },
  getUserEnrollments(userId) {
    return request(`/users/${userId}/enrollments`);
  },
  deleteUser(id) {
    return request(`/users/${id}`, {
      method: "DELETE",
    });
  },
  checkout(payload) {
    return request("/checkout", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  getDashboard() {
    return request("/dashboard");
  },
};
