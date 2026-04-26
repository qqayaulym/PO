import bcrypt from "bcrypt";
import { createClient } from "@supabase/supabase-js";
import { seedCourses } from "./data/seedData.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY =
  process.env.SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error(
    "Supabase env табылмады. SUPABASE_URL және SUPABASE_PUBLISHABLE_KEY мәндерін орнатыңыз."
  );
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function stringifyJson(value, fallback) {
  return JSON.stringify(value ?? fallback);
}

function parseJsonSafe(value, fallback) {
  try {
    return JSON.parse(value ?? "");
  } catch {
    return fallback;
  }
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function buildCoursePayload(item, orderIndexOverride) {
  return {
    title: item.title,
    slug: item.slug,
    description: item.description,
    category: item.category,
    level: item.level,
    price: Number(item.price || 0),
    likes_count: Number(item.likes_count || 0),
    order_index:
      typeof orderIndexOverride === "number"
        ? orderIndexOverride
        : Number(item.order_index || 0),
  };
}

function buildLessonPayload(courseId, lesson, fallbackTitle) {
  return {
    course_id: courseId,
    title: lesson.title || fallbackTitle,
    theory: lesson.theory || "",
    pre_code: lesson.preCode ?? lesson.pre_code ?? "",
    task: lesson.task || "",
    required_steps: stringifyJson(normalizeArray(lesson.requiredSteps ?? lesson.required_steps), []),
    download_content: lesson.downloadContent ?? lesson.download_content ?? "",
    quiz_question: lesson.quiz?.question || lesson.quiz_question || "",
    quiz_options: stringifyJson(normalizeArray(lesson.quiz?.options ?? lesson.quiz_options), []),
    quiz_answer_index: Number(
      lesson.quiz?.answerIndex ?? lesson.quiz_answer_index ?? 0
    ),
  };
}

function mapUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    password_hash: row.password_hash,
    role: row.role,
    created_at: row.created_at,
  };
}

function mapPublicUser(row) {
  if (!row) return null;

  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    created_at: row.created_at,
  };
}

function mapCourseRecord(row) {
  const lessonRow = Array.isArray(row.lessons) ? row.lessons[0] : row.lessons;

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    url: row.slug,
    description: row.description,
    desc: row.description,
    category: row.category,
    level: row.level,
    price: Number(row.price || 0),
    likes: Number(row.likes_count || 0),
    likesCount: Number(row.likes_count || 0),
    orderIndex: Number(row.order_index || 0),
    lesson: lessonRow
      ? {
          id: lessonRow.id,
          title: lessonRow.title,
          theory: lessonRow.theory,
          preCode: lessonRow.pre_code,
          task: lessonRow.task,
          requiredSteps: parseJsonSafe(lessonRow.required_steps, []),
          downloadContent: lessonRow.download_content,
          quiz: {
            question: lessonRow.quiz_question || "",
            options: parseJsonSafe(lessonRow.quiz_options, []),
            answerIndex: Number(lessonRow.quiz_answer_index || 0),
          },
        }
      : null,
  };
}

async function expectSingle(query) {
  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

async function maybeSingle(query) {
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

async function expectMany(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchCoursesWithLessons() {
  return expectMany(
    supabase
      .from("courses")
      .select(
        `
          id,
          title,
          slug,
          description,
          category,
          level,
          price,
          likes_count,
          order_index,
          lessons (
            id,
            title,
            theory,
            pre_code,
            task,
            required_steps,
            download_content,
            quiz_question,
            quiz_options,
            quiz_answer_index
          )
        `
      )
      .order("order_index", { ascending: true })
      .order("id", { ascending: true })
  );
}

async function ensureAdminUser() {
  const adminExists = await maybeSingle(
    supabase.from("users").select("id").eq("email", "admin@sqlstudy.kz")
  );

  if (adminExists) return;

  const passwordHash = await bcrypt.hash("admin123", 10);

  const { error } = await supabase.from("users").insert({
    full_name: "Әкімші",
    email: "admin@sqlstudy.kz",
    phone: "+77000000000",
    password_hash: passwordHash,
    role: "admin",
  });

  if (error && error.code !== "23505") throw error;
}

async function insertSeedCourse(item, orderIndexOverride) {
  const courseRow = await expectSingle(
    supabase
      .from("courses")
      .insert(buildCoursePayload(item, orderIndexOverride))
      .select("id")
  );

  const lessonPayload = buildLessonPayload(
    courseRow.id,
    {
      ...item.lesson,
      pre_code: item.lesson.pre_code,
      required_steps: item.lesson.required_steps,
      download_content: item.lesson.download_content,
      quiz_question: item.lesson.quiz?.question,
      quiz_options: item.lesson.quiz?.options,
      quiz_answer_index: item.lesson.quiz?.answerIndex,
    },
    `${item.title} сабағы`
  );

  const { error } = await supabase.from("lessons").insert(lessonPayload);
  if (error) throw error;
}

async function syncSeedLessons() {
  const courses = await expectMany(supabase.from("courses").select("id, slug"));
  const lessons = await expectMany(
    supabase.from("lessons").select("id, course_id, download_content, quiz_question, quiz_options")
  );

  const courseBySlug = new Map(courses.map((course) => [course.slug, course]));
  const lessonByCourseId = new Map(lessons.map((lesson) => [lesson.course_id, lesson]));

  for (const item of seedCourses) {
    const existingCourse = courseBySlug.get(item.slug);

    if (!existingCourse) {
      await insertSeedCourse(item);
      continue;
    }

    const currentLesson = lessonByCourseId.get(existingCourse.id);
    const isMissingQuiz =
      !currentLesson?.quiz_question ||
      currentLesson.quiz_question.trim().length === 0 ||
      currentLesson.quiz_options === "[]";
    const hasOldMaterials =
      !currentLesson?.download_content || currentLesson.download_content.trim().length < 60;

    if (!currentLesson) {
      const { error } = await supabase
        .from("lessons")
        .insert(buildLessonPayload(existingCourse.id, item.lesson, `${item.title} сабағы`));
      if (error) throw error;
      continue;
    }

    if (!isMissingQuiz && !hasOldMaterials) continue;

    const { error } = await supabase
      .from("lessons")
      .update(buildLessonPayload(existingCourse.id, item.lesson, `${item.title} сабағы`))
      .eq("course_id", existingCourse.id);

    if (error) throw error;
  }
}

export async function initializeDatabase() {
  await ensureAdminUser();

  const { count, error } = await supabase
    .from("courses")
    .select("id", { count: "exact", head: true });

  if (error) throw error;

  if (!count) {
    for (let index = 0; index < seedCourses.length; index += 1) {
      await insertSeedCourse(seedCourses[index], index);
    }
  } else {
    await syncSeedLessons();
  }
}

export async function listUsers() {
  const rows = await expectMany(
    supabase
      .from("users")
      .select("id, full_name, email, phone, role, created_at")
      .order("created_at", { ascending: false })
  );

  return rows.map(mapPublicUser);
}

export async function getUserByEmail(email) {
  return mapUser(await maybeSingle(supabase.from("users").select("*").eq("email", email)));
}

export async function getUserById(id) {
  return mapPublicUser(
    await maybeSingle(
      supabase
        .from("users")
        .select("id, full_name, email, phone, role, created_at")
        .eq("id", id)
    )
  );
}

export async function createUser({ fullName, email, phone, passwordHash, role = "user" }) {
  const row = await expectSingle(
    supabase
      .from("users")
      .insert({
        full_name: fullName,
        email,
        phone: phone || "",
        password_hash: passwordHash,
        role,
      })
      .select("id, full_name, email, phone, role, created_at")
  );

  return mapPublicUser(row);
}

export async function deleteUser(id) {
  const row = await maybeSingle(supabase.from("users").delete().eq("id", id).select("id"));
  return { changes: row ? 1 : 0 };
}

export async function getCourses({ search = "", filter = "all", sort = "", page = 1, limit = 6 }) {
  let items = (await fetchCoursesWithLessons()).map(mapCourseRecord);

  const searchValue = search.trim().toLowerCase();
  if (searchValue) {
    items = items.filter((course) =>
      [course.title, course.description, course.category, course.level]
        .some((value) => String(value || "").toLowerCase().includes(searchValue))
    );
  }

  if (filter === "free") {
    items = items.filter((course) => course.price === 0);
  } else if (filter === "paid") {
    items = items.filter((course) => course.price > 0);
  } else if (filter.startsWith("level:")) {
    const level = filter.replace("level:", "");
    items = items.filter((course) => course.level === level);
  } else if (filter !== "all") {
    items = items.filter((course) => course.category === filter);
  }

  const levelOrder = {
    Бастауыш: 1,
    Орта: 2,
    Күрделі: 3,
  };

  items.sort((a, b) => {
    if (sort === "title") return a.title.localeCompare(b.title, "kk");
    if (sort === "price-asc") return a.price - b.price;
    if (sort === "price-desc") return b.price - a.price;
    if (sort === "likes") return b.likesCount - a.likesCount || a.orderIndex - b.orderIndex;
    if (sort === "level") {
      return (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99);
    }

    return a.orderIndex - b.orderIndex || a.id - b.id;
  });

  const total = items.length;
  const start = (page - 1) * limit;
  const pagedItems = items.slice(start, start + limit);

  return {
    items: pagedItems,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getAllCourses() {
  return (await fetchCoursesWithLessons()).map(mapCourseRecord);
}

export async function getCourseById(id) {
  const course = (await getAllCourses()).find((item) => item.id === Number(id));
  return course || null;
}

export async function getCourseBySlug(slug) {
  const course = (await getAllCourses()).find((item) => item.slug === slug);
  return course || null;
}

export async function createCourse({ title, slug, description, category, level, price }) {
  const courses = await expectMany(supabase.from("courses").select("order_index"));
  const nextOrderIndex = courses.reduce((max, item) => Math.max(max, Number(item.order_index || 0)), -1) + 1;

  const courseRow = await expectSingle(
    supabase
      .from("courses")
      .insert({
        title,
        slug,
        description,
        category,
        level,
        price: Number(price || 0),
        order_index: nextOrderIndex,
      })
      .select("id")
  );

  const { error } = await supabase.from("lessons").insert({
    course_id: courseRow.id,
    title: `${title} сабағы`,
    theory: "",
    pre_code: "",
    task: "",
    required_steps: "[]",
    download_content: "",
    quiz_question: "",
    quiz_options: "[]",
    quiz_answer_index: 0,
  });

  if (error) throw error;

  return getCourseById(courseRow.id);
}

export async function updateCourse(id, { title, slug, description, category, level, price }) {
  const { error } = await supabase
    .from("courses")
    .update({
      title,
      slug,
      description,
      category,
      level,
      price: Number(price || 0),
    })
    .eq("id", id);

  if (error) throw error;

  return getCourseById(id);
}

export async function deleteCourse(id) {
  const row = await maybeSingle(supabase.from("courses").delete().eq("id", id).select("id"));
  return { changes: row ? 1 : 0 };
}

export async function updateLessonByCourseId(courseId, lesson) {
  const current = await maybeSingle(
    supabase
      .from("lessons")
      .select("quiz_question, quiz_options, quiz_answer_index")
      .eq("course_id", courseId)
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

  const { error } = await supabase
    .from("lessons")
    .update({
      title: lesson.title,
      theory: lesson.theory,
      pre_code: lesson.preCode,
      task: lesson.task,
      required_steps: stringifyJson(lesson.requiredSteps, []),
      download_content: lesson.downloadContent,
      quiz_question: lesson.quiz?.question || current?.quiz_question || "",
      quiz_options: stringifyJson(nextQuizOptions, []),
      quiz_answer_index: nextQuizAnswerIndex,
    })
    .eq("course_id", courseId);

  if (error) throw error;

  return getCourseById(courseId);
}

export async function toggleCourseLike(courseId, userId) {
  const existing = await maybeSingle(
    supabase
      .from("course_likes")
      .select("id")
      .eq("course_id", courseId)
      .eq("user_id", userId)
  );

  const courseRow = await expectSingle(
    supabase.from("courses").select("likes_count").eq("id", courseId)
  );

  if (existing) {
    const { error: deleteError } = await supabase
      .from("course_likes")
      .delete()
      .eq("id", existing.id);
    if (deleteError) throw deleteError;

    const { error: updateError } = await supabase
      .from("courses")
      .update({ likes_count: Math.max(0, Number(courseRow.likes_count || 0) - 1) })
      .eq("id", courseId);
    if (updateError) throw updateError;
  } else {
    const { error: insertError } = await supabase
      .from("course_likes")
      .insert({ course_id: courseId, user_id: userId });
    if (insertError) throw insertError;

    const { error: updateError } = await supabase
      .from("courses")
      .update({ likes_count: Number(courseRow.likes_count || 0) + 1 })
      .eq("id", courseId);
    if (updateError) throw updateError;
  }

  return {
    liked: !existing,
    course: await getCourseById(courseId),
  };
}

export async function getLikedCourseIds(userId) {
  const rows = await expectMany(
    supabase
      .from("course_likes")
      .select("course_id")
      .eq("user_id", userId)
      .order("course_id", { ascending: true })
  );

  return rows.map((item) => item.course_id);
}

export async function getEnrolledCourseIds(userId) {
  const rows = await expectMany(
    supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .order("course_id", { ascending: true })
  );

  return rows.map((item) => item.course_id);
}

export async function createEnrollments(userId, courseIds) {
  const uniqueIds = [...new Set((courseIds || []).map((id) => Number(id)).filter(Boolean))];
  if (uniqueIds.length === 0) {
    return {
      createdCount: 0,
      enrolledCourseIds: await getEnrolledCourseIds(userId),
    };
  }

  const existingRows = await expectMany(
    supabase
      .from("enrollments")
      .select("course_id")
      .eq("user_id", userId)
      .in("course_id", uniqueIds)
  );

  const existingIds = new Set(existingRows.map((item) => item.course_id));
  const missingIds = uniqueIds.filter((courseId) => !existingIds.has(courseId));

  if (missingIds.length) {
    const { error } = await supabase.from("enrollments").insert(
      missingIds.map((courseId) => ({
        user_id: userId,
        course_id: courseId,
      }))
    );

    if (error) throw error;
  }

  return {
    createdCount: missingIds.length,
    enrolledCourseIds: await getEnrolledCourseIds(userId),
  };
}

export async function getDashboardStats() {
  const [usersMeta, coursesMeta, lessonsMeta, enrollmentsMeta, courses] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("courses").select("id", { count: "exact", head: true }),
    supabase.from("lessons").select("id", { count: "exact", head: true }),
    supabase.from("enrollments").select("id", { count: "exact", head: true }),
    expectMany(supabase.from("courses").select("likes_count")),
  ]);

  if (usersMeta.error) throw usersMeta.error;
  if (coursesMeta.error) throw coursesMeta.error;
  if (lessonsMeta.error) throw lessonsMeta.error;
  if (enrollmentsMeta.error) throw enrollmentsMeta.error;

  return {
    users: usersMeta.count || 0,
    courses: coursesMeta.count || 0,
    lessons: lessonsMeta.count || 0,
    likes: courses.reduce((sum, course) => sum + Number(course.likes_count || 0), 0),
    enrollments: enrollmentsMeta.count || 0,
  };
}
