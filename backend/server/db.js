import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import bcrypt from "bcrypt";
import { seedCourses } from "./data/seedData.js";

const DATA_DIR = path.resolve(process.cwd(), "server", "data");
const DB_PATH = process.env.DB_FILE
  ? path.resolve(process.cwd(), process.env.DB_FILE)
  : path.join(DATA_DIR, "app.db");

fs.mkdirSync(DATA_DIR, { recursive: true });

export const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON");

function stringifyJson(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function run(sql, params = {}) {
  return db.prepare(sql).run(params);
}

function get(sql, params = {}) {
  return db.prepare(sql).get(params);
}

function all(sql, params = {}) {
  return db.prepare(sql).all(params);
}

function hasColumn(tableName, columnName) {
  const columns = all(`PRAGMA table_info(${tableName})`);
  return columns.some((column) => column.name === columnName);
}

function parseJsonSafe(value, fallback) {
  try {
    return JSON.parse(value ?? "");
  } catch {
    return fallback;
  }
}

export function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      level TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
      likes_count INTEGER NOT NULL DEFAULT 0 CHECK (likes_count >= 0),
      order_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL UNIQUE,
      title TEXT NOT NULL,
      theory TEXT NOT NULL DEFAULT '',
      pre_code TEXT NOT NULL DEFAULT '',
      task TEXT NOT NULL DEFAULT '',
      required_steps TEXT NOT NULL DEFAULT '[]',
      download_content TEXT NOT NULL DEFAULT '',
      quiz_question TEXT NOT NULL DEFAULT '',
      quiz_options TEXT NOT NULL DEFAULT '[]',
      quiz_answer_index INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS enrollments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS course_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE (user_id, course_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );
  `);

  if (!hasColumn("lessons", "quiz_question")) {
    db.exec("ALTER TABLE lessons ADD COLUMN quiz_question TEXT NOT NULL DEFAULT ''");
  }
  if (!hasColumn("lessons", "quiz_options")) {
    db.exec("ALTER TABLE lessons ADD COLUMN quiz_options TEXT NOT NULL DEFAULT '[]'");
  }
  if (!hasColumn("lessons", "quiz_answer_index")) {
    db.exec("ALTER TABLE lessons ADD COLUMN quiz_answer_index INTEGER NOT NULL DEFAULT 0");
  }

  const adminExists = get("SELECT id FROM users WHERE email = :email", {
    email: "admin@sqlstudy.kz",
  });

  if (!adminExists) {
    run(
      `INSERT INTO users (full_name, email, phone, password_hash, role)
       VALUES (:full_name, :email, :phone, :password_hash, :role)`,
      {
        full_name: "Әкімші",
        email: "admin@sqlstudy.kz",
        phone: "+77000000000",
        password_hash: bcrypt.hashSync("admin123", 10),
        role: "admin",
      }
    );
  }

  const courseCount = get("SELECT COUNT(*) AS count FROM courses");
  if (courseCount.count === 0) {
    const insertCourse = db.prepare(`
      INSERT INTO courses (title, slug, description, category, level, price, likes_count, order_index)
      VALUES (:title, :slug, :description, :category, :level, :price, :likes_count, :order_index)
    `);
    const insertLesson = db.prepare(`
      INSERT INTO lessons (
        course_id, title, theory, pre_code, task, required_steps, download_content,
        quiz_question, quiz_options, quiz_answer_index
      )
      VALUES (
        :course_id, :title, :theory, :pre_code, :task, :required_steps, :download_content,
        :quiz_question, :quiz_options, :quiz_answer_index
      )
    `);

    db.exec("BEGIN");
    try {
      for (const item of seedCourses) {
        const courseInfo = insertCourse.run({
          title: item.title,
          slug: item.slug,
          description: item.description,
          category: item.category,
          level: item.level,
          price: item.price,
          likes_count: item.likes_count,
          order_index: item.order_index,
        });
        insertLesson.run({
          course_id: Number(courseInfo.lastInsertRowid),
          title: item.lesson.title,
          theory: item.lesson.theory,
          pre_code: item.lesson.pre_code,
          task: item.lesson.task,
          required_steps: stringifyJson(item.lesson.required_steps, []),
          download_content: item.lesson.download_content,
          quiz_question: item.lesson.quiz?.question || "",
          quiz_options: stringifyJson(item.lesson.quiz?.options, []),
          quiz_answer_index: Number(item.lesson.quiz?.answerIndex || 0),
        });
      }
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }

  syncSeedLessons();
}

function syncSeedLessons() {
  const insertCourse = db.prepare(`
    INSERT INTO courses (title, slug, description, category, level, price, likes_count, order_index)
    VALUES (:title, :slug, :description, :category, :level, :price, :likes_count, :order_index)
  `);
  const insertLesson = db.prepare(`
    INSERT INTO lessons (
      course_id, title, theory, pre_code, task, required_steps, download_content,
      quiz_question, quiz_options, quiz_answer_index
    )
    VALUES (
      :course_id, :title, :theory, :pre_code, :task, :required_steps, :download_content,
      :quiz_question, :quiz_options, :quiz_answer_index
    )
  `);
  const updateLesson = db.prepare(`
    UPDATE lessons
    SET title = :title,
        theory = :theory,
        pre_code = :pre_code,
        task = :task,
        required_steps = :required_steps,
        download_content = :download_content,
        quiz_question = :quiz_question,
        quiz_options = :quiz_options,
        quiz_answer_index = :quiz_answer_index,
        updated_at = CURRENT_TIMESTAMP
    WHERE course_id = :course_id
  `);

  for (const item of seedCourses) {
    let course = get("SELECT id FROM courses WHERE slug = :slug", { slug: item.slug });
    if (!course) {
      const result = insertCourse.run({
        title: item.title,
        slug: item.slug,
        description: item.description,
        category: item.category,
        level: item.level,
        price: item.price,
        likes_count: item.likes_count,
        order_index: item.order_index,
      });
      course = { id: Number(result.lastInsertRowid) };

      insertLesson.run({
        course_id: course.id,
        title: item.lesson.title,
        theory: item.lesson.theory,
        pre_code: item.lesson.pre_code,
        task: item.lesson.task,
        required_steps: stringifyJson(item.lesson.required_steps, []),
        download_content: item.lesson.download_content,
        quiz_question: item.lesson.quiz?.question || "",
        quiz_options: stringifyJson(item.lesson.quiz?.options, []),
        quiz_answer_index: Number(item.lesson.quiz?.answerIndex || 0),
      });
      continue;
    }
    const currentLesson = get(
      `SELECT download_content, quiz_question, quiz_options
       FROM lessons
       WHERE course_id = :course_id`,
      { course_id: course.id }
    );
    const isMissingQuiz =
      !currentLesson?.quiz_question ||
      currentLesson.quiz_question.trim().length === 0 ||
      currentLesson.quiz_options === "[]";
    const hasOldMaterials =
      !currentLesson?.download_content || currentLesson.download_content.trim().length < 60;
    if (!isMissingQuiz && !hasOldMaterials) continue;

    updateLesson.run({
      course_id: course.id,
      title: item.lesson.title,
      theory: item.lesson.theory,
      pre_code: item.lesson.pre_code,
      task: item.lesson.task,
      required_steps: stringifyJson(item.lesson.required_steps, []),
      download_content: item.lesson.download_content,
      quiz_question: item.lesson.quiz?.question || "",
      quiz_options: stringifyJson(item.lesson.quiz?.options, []),
      quiz_answer_index: Number(item.lesson.quiz?.answerIndex || 0),
    });
  }
}

export function listUsers() {
  return all(
    `SELECT id, full_name, email, phone, role, created_at
     FROM users
     ORDER BY datetime(created_at) DESC`
  );
}

export function getUserByEmail(email) {
  return get("SELECT * FROM users WHERE email = :email", { email });
}

export function getUserById(id) {
  return get(
    `SELECT id, full_name, email, phone, role, created_at
     FROM users
     WHERE id = :id`,
    { id }
  );
}

export function createUser({ fullName, email, phone, passwordHash, role = "user" }) {
  const result = run(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES (:full_name, :email, :phone, :password_hash, :role)`,
    {
      full_name: fullName,
      email,
      phone: phone || "",
      password_hash: passwordHash,
      role,
    }
  );

  return getUserById(Number(result.lastInsertRowid));
}

export function deleteUser(id) {
  return run("DELETE FROM users WHERE id = :id", { id });
}

function baseCoursesQuery() {
  return `
    SELECT
      c.id,
      c.title,
      c.slug,
      c.description,
      c.category,
      c.level,
      c.price,
      c.likes_count,
      c.order_index,
      l.id AS lesson_id,
      l.title AS lesson_title,
      l.theory,
      l.pre_code,
      l.task,
      l.required_steps,
      l.download_content,
      l.quiz_question,
      l.quiz_options,
      l.quiz_answer_index
    FROM courses c
    LEFT JOIN lessons l ON l.course_id = c.id
  `;
}

export function getCourses({
  search = "",
  filter = "all",
  sort = "",
  page = 1,
  limit = 6,
}) {
  const filtersParams = {};

  const where = [];

  if (search.trim()) {
    filtersParams.search = `%${search.trim().toLowerCase()}%`;
    where.push(
      "(lower(c.title) LIKE :search OR lower(c.description) LIKE :search OR lower(c.category) LIKE :search OR lower(c.level) LIKE :search)"
    );
  }

  if (filter === "free") {
    where.push("c.price = 0");
  } else if (filter === "paid") {
    where.push("c.price > 0");
  } else if (filter.startsWith("level:")) {
    filtersParams.level = filter.replace("level:", "");
    where.push("c.level = :level");
  } else if (filter !== "all") {
    filtersParams.category = filter;
    where.push("c.category = :category");
  }

  let orderBy = "c.order_index ASC, c.id ASC";
  if (sort === "title") orderBy = "c.title COLLATE NOCASE ASC";
  if (sort === "price-asc") orderBy = "c.price ASC";
  if (sort === "price-desc") orderBy = "c.price DESC";
  if (sort === "likes") orderBy = "c.likes_count DESC";
  if (sort === "level") {
    orderBy = `CASE c.level
      WHEN 'Бастауыш' THEN 1
      WHEN 'Орта' THEN 2
      WHEN 'Күрделі' THEN 3
      ELSE 99
    END ASC`;
  }

  const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const listParams = {
    ...filtersParams,
    limit,
    offset: (page - 1) * limit,
  };

  const items = all(
    `${baseCoursesQuery()}
     ${whereClause}
     ORDER BY ${orderBy}
     LIMIT :limit OFFSET :offset`,
    listParams
  ).map(mapCourseRow);

  const totalRow = get(
    `SELECT COUNT(*) AS total
     FROM courses c
     ${whereClause}`,
    filtersParams
  );

  return {
    items,
    total: totalRow.total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(totalRow.total / limit)),
  };
}

export function getAllCourses() {
  return all(`${baseCoursesQuery()} ORDER BY c.order_index ASC, c.id ASC`).map(mapCourseRow);
}

export function getCourseById(id) {
  const row = get(`${baseCoursesQuery()} WHERE c.id = :id`, { id });
  return row ? mapCourseRow(row) : null;
}

export function getCourseBySlug(slug) {
  const row = get(`${baseCoursesQuery()} WHERE c.slug = :slug`, { slug });
  return row ? mapCourseRow(row) : null;
}

export function createCourse({ title, slug, description, category, level, price }) {
  const lastOrder = get("SELECT COALESCE(MAX(order_index), -1) AS max_order FROM courses");
  const result = run(
    `INSERT INTO courses (title, slug, description, category, level, price, order_index)
     VALUES (:title, :slug, :description, :category, :level, :price, :order_index)`,
    {
      title,
      slug,
      description,
      category,
      level,
      price,
      order_index: Number(lastOrder.max_order) + 1,
    }
  );

  run(
    `INSERT INTO lessons (
      course_id, title, theory, pre_code, task, required_steps, download_content,
      quiz_question, quiz_options, quiz_answer_index
    )
     VALUES (:course_id, :title, '', '', '', '[]', '', '', '[]', 0)`,
    {
      course_id: Number(result.lastInsertRowid),
      title: `${title} сабағы`,
    }
  );

  return getCourseById(Number(result.lastInsertRowid));
}

export function updateCourse(id, { title, slug, description, category, level, price }) {
  run(
    `UPDATE courses
     SET title = :title,
         slug = :slug,
         description = :description,
         category = :category,
         level = :level,
         price = :price
     WHERE id = :id`,
    {
      id,
      title,
      slug,
      description,
      category,
      level,
      price,
    }
  );

  return getCourseById(id);
}

export function deleteCourse(id) {
  return run("DELETE FROM courses WHERE id = :id", { id });
}

export function updateLessonByCourseId(courseId, lesson) {
  const current = get(
    `SELECT quiz_question, quiz_options, quiz_answer_index
     FROM lessons
     WHERE course_id = :course_id`,
    { course_id: courseId }
  );
  const nextQuizOptions = Array.isArray(lesson.quiz?.options)
    ? lesson.quiz.options
    : parseJsonSafe(current?.quiz_options, []);
  const nextQuizAnswerIndex =
    typeof lesson.quiz?.answerIndex === "number" &&
    lesson.quiz.answerIndex >= 0 &&
    lesson.quiz.answerIndex < nextQuizOptions.length
      ? lesson.quiz.answerIndex
      : Number(current?.quiz_answer_index || 0);

  run(
    `UPDATE lessons
     SET title = :title,
         theory = :theory,
         pre_code = :pre_code,
         task = :task,
         required_steps = :required_steps,
         download_content = :download_content,
         quiz_question = :quiz_question,
         quiz_options = :quiz_options,
         quiz_answer_index = :quiz_answer_index,
         updated_at = CURRENT_TIMESTAMP
     WHERE course_id = :course_id`,
    {
      course_id: courseId,
      title: lesson.title,
      theory: lesson.theory,
      pre_code: lesson.preCode,
      task: lesson.task,
      required_steps: stringifyJson(lesson.requiredSteps, []),
      download_content: lesson.downloadContent,
      quiz_question: lesson.quiz?.question || current?.quiz_question || "",
      quiz_options: stringifyJson(nextQuizOptions, []),
      quiz_answer_index: nextQuizAnswerIndex,
    }
  );

  return getCourseById(courseId);
}

export function toggleCourseLike(courseId, userId) {
  const existing = get(
    `SELECT id FROM course_likes WHERE course_id = :course_id AND user_id = :user_id`,
    { course_id: courseId, user_id: userId }
  );

  if (existing) {
    run("DELETE FROM course_likes WHERE id = :id", { id: existing.id });
    run(
      "UPDATE courses SET likes_count = CASE WHEN likes_count > 0 THEN likes_count - 1 ELSE 0 END WHERE id = :id",
      { id: courseId }
    );
  } else {
    run(
      "INSERT INTO course_likes (course_id, user_id) VALUES (:course_id, :user_id)",
      { course_id: courseId, user_id: userId }
    );
    run("UPDATE courses SET likes_count = likes_count + 1 WHERE id = :id", { id: courseId });
  }

  return {
    liked: !existing,
    course: getCourseById(courseId),
  };
}

export function getLikedCourseIds(userId) {
  return all(
    "SELECT course_id FROM course_likes WHERE user_id = :user_id ORDER BY course_id ASC",
    { user_id: userId }
  ).map((item) => item.course_id);
}

export function getDashboardStats() {
  const users = get("SELECT COUNT(*) AS count FROM users");
  const courses = get("SELECT COUNT(*) AS count FROM courses");
  const lessons = get("SELECT COUNT(*) AS count FROM lessons");
  const likes = get("SELECT COALESCE(SUM(likes_count), 0) AS count FROM courses");

  return {
    users: users.count,
    courses: courses.count,
    lessons: lessons.count,
    likes: likes.count,
  };
}

function mapCourseRow(row) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    url: row.slug,
    description: row.description,
    desc: row.description,
    category: row.category,
    level: row.level,
    price: Number(row.price),
    likes: Number(row.likes_count),
    likesCount: Number(row.likes_count),
    orderIndex: Number(row.order_index || 0),
    lesson: row.lesson_id
      ? {
          id: row.lesson_id,
          title: row.lesson_title,
          theory: row.theory,
          preCode: row.pre_code,
          task: row.task,
          requiredSteps: parseJsonSafe(row.required_steps, []),
          downloadContent: row.download_content,
          quiz: {
            question: row.quiz_question || "",
            options: parseJsonSafe(row.quiz_options, []),
            answerIndex: Number(row.quiz_answer_index || 0),
          },
        }
      : null,
  };
}
