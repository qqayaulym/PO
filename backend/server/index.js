import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import {
  createCourse,
  createEnrollments,
  createUser,
  deleteCourse,
  deleteUser,
  getAllCourses,
  getCourseById,
  getEnrolledCourseIds,
  getCourseBySlug,
  getCourses,
  getDashboardStats,
  getLikedCourseIds,
  getUserById,
  getUserByEmail,
  initializeDatabase,
  listUsers,
  toggleCourseLike,
  updateCourse,
  updateLessonByCourseId,
} from "./db.js";
import {
  slugify,
  validateCourse,
  validateLesson,
  validateSignin,
  validateSignup,
} from "./validation.js";

initializeDatabase();

const app = express();
const PORT = Number(process.env.PORT || 4000);

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, storage: "sqlite" });
});

app.post("/api/auth/signup", async (req, res) => {
  const errors = validateSignup(req.body);
  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const email = req.body.email.trim().toLowerCase();
  const exists = getUserByEmail(email);

  if (exists) {
    return res.status(409).json({ message: "Бұл email бұрын тіркелген." });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 10);
  const user = createUser({
    fullName: req.body.fullName.trim(),
    email,
    phone: req.body.phone?.trim() || "",
    passwordHash,
  });

  return res.status(201).json({ user });
});

app.post("/api/auth/signin", async (req, res) => {
  const errors = validateSignin(req.body);
  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const email = req.body.email.trim().toLowerCase();
  const user = getUserByEmail(email);

  if (!user) {
    return res.status(401).json({ message: "Email немесе құпиясөз қате." });
  }

  const isMatch = await bcrypt.compare(req.body.password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ message: "Email немесе құпиясөз қате." });
  }

  return res.json({
    user: {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.created_at,
    },
    likedCourseIds: getLikedCourseIds(user.id),
    enrolledCourseIds: getEnrolledCourseIds(user.id),
  });
});

app.get("/api/users", (_req, res) => {
  res.json({ items: listUsers() });
});

app.get("/api/users/:id/enrollments", (req, res) => {
  const userId = Number(req.params.id);
  const user = getUserById(userId);
  if (!user) {
    return res.status(404).json({ message: "Пайдаланушы табылмады." });
  }

  return res.json({ items: getEnrolledCourseIds(userId) });
});

app.delete("/api/users/:id", (req, res) => {
  const result = deleteUser(Number(req.params.id));
  if (!result.changes) {
    return res.status(404).json({ message: "Пайдаланушы табылмады." });
  }

  return res.json({ ok: true });
});

app.get("/api/courses", (req, res) => {
  const page = Math.max(1, Number(req.query.page || 1));
  const limit = Math.max(1, Math.min(12, Number(req.query.limit || 6)));

  const data = getCourses({
    search: String(req.query.search || ""),
    filter: String(req.query.filter || "all"),
    sort: String(req.query.sort || ""),
    page,
    limit,
  });

  res.json(data);
});

app.get("/api/courses/all", (_req, res) => {
  res.json({ items: getAllCourses() });
});

app.get("/api/courses/:slug", (req, res) => {
  const course = getCourseBySlug(req.params.slug);
  if (!course) {
    return res.status(404).json({ message: "Курс табылмады." });
  }

  return res.json({ item: course });
});

app.post("/api/courses", (req, res) => {
  const errors = validateCourse(req.body);
  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const slug = slugify(req.body.slug || req.body.title);
  const course = createCourse({
    title: req.body.title.trim(),
    slug,
    description: req.body.description.trim(),
    category: req.body.category.trim(),
    level: req.body.level.trim(),
    price: Number(req.body.price || 0),
  });

  return res.status(201).json({ item: course });
});

app.put("/api/courses/:id", (req, res) => {
  const errors = validateCourse(req.body);
  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const courseId = Number(req.params.id);
  const existing = getCourseById(courseId);
  if (!existing) {
    return res.status(404).json({ message: "Курс табылмады." });
  }

  const slug = slugify(req.body.slug || req.body.title);
  const course = updateCourse(courseId, {
    title: req.body.title.trim(),
    slug,
    description: req.body.description.trim(),
    category: req.body.category.trim(),
    level: req.body.level.trim(),
    price: Number(req.body.price || 0),
  });

  return res.json({ item: course });
});

app.delete("/api/courses/:id", (req, res) => {
  const result = deleteCourse(Number(req.params.id));
  if (!result.changes) {
    return res.status(404).json({ message: "Курс табылмады." });
  }

  return res.json({ ok: true });
});

app.put("/api/courses/:id/lesson", (req, res) => {
  const errors = validateLesson(req.body);
  if (errors.length) {
    return res.status(400).json({ message: errors[0], errors });
  }

  const courseId = Number(req.params.id);
  const existing = getCourseById(courseId);
  if (!existing) {
    return res.status(404).json({ message: "Курс табылмады." });
  }

  const course = updateLessonByCourseId(courseId, {
    title: req.body.title.trim(),
    theory: req.body.theory.trim(),
    preCode: req.body.preCode || "",
    task: req.body.task.trim(),
    requiredSteps: Array.isArray(req.body.requiredSteps) ? req.body.requiredSteps : [],
    downloadContent: req.body.downloadContent || "",
  });

  return res.json({ item: course });
});

app.post("/api/courses/:id/like", (req, res) => {
  const userId = Number(req.body.userId);
  if (!userId) {
    return res.status(400).json({ message: "Лайк үшін пайдаланушы идентификаторы керек." });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({ message: "Пайдаланушы табылмады. Қайта кіріңіз." });
  }

  const course = getCourseById(Number(req.params.id));
  if (!course) {
    return res.status(404).json({ message: "Курс табылмады." });
  }

  return res.json(toggleCourseLike(course.id, userId));
});

app.post("/api/checkout", (req, res) => {
  const userId = Number(req.body.userId);
  const courseIds = Array.isArray(req.body.courseIds) ? req.body.courseIds.map(Number) : [];

  if (!userId) {
    return res.status(400).json({ message: "Сатып алу үшін пайдаланушы идентификаторы керек." });
  }

  const user = getUserById(userId);
  if (!user) {
    return res.status(401).json({ message: "Пайдаланушы табылмады. Қайта кіріңіз." });
  }

  const uniqueCourseIds = [...new Set(courseIds.filter(Boolean))];
  if (uniqueCourseIds.length === 0) {
    return res.status(400).json({ message: "Себет бос. Алдымен курс таңдаңыз." });
  }

  const allCourses = getAllCourses();
  const missingCourse = uniqueCourseIds.find(
    (courseId) => !allCourses.some((course) => course.id === courseId)
  );

  if (missingCourse) {
    return res.status(404).json({ message: "Таңдалған курстардың бірі табылмады." });
  }

  const result = createEnrollments(userId, uniqueCourseIds);
  const purchasedCourses = allCourses.filter((course) => uniqueCourseIds.includes(course.id));
  const totalAmount = purchasedCourses.reduce((sum, course) => sum + Number(course.price || 0), 0);

  return res.json({
    ok: true,
    createdCount: result.createdCount,
    enrolledCourseIds: result.enrolledCourseIds,
    totalAmount,
  });
});

app.get("/api/dashboard", (_req, res) => {
  res.json(getDashboardStats());
});

app.use((error, _req, res, _next) => {
  if (error?.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(409).json({ message: "Бұл мән база ішінде бірегей болу керек." });
  }

  console.error(error);
  return res.status(500).json({ message: "Серверде қате пайда болды." });
});

app.listen(PORT, () => {
  console.log(`API is running on http://localhost:${PORT}`);
});
