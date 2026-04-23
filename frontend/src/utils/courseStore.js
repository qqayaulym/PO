import { coursesData, lessonData } from "../data/coursesData";

const COURSES_KEY = "coursesCatalog";
const LESSONS_KEY = "lessonsCatalog";

const levelOrder = {
  Бастауыш: 1,
  Орта: 2,
  Күрделі: 3,
};

const defaultCourses = coursesData.map((course, index) => ({
  ...course,
  likes: course.likes ?? 0,
  order: course.order ?? index,
}));

const defaultLessons = { ...lessonData };

function readStorage(key, fallbackValue) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallbackValue;
  } catch {
    return fallbackValue;
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeCourse(course, index) {
  return {
    ...defaultCourses[index],
    ...course,
    likes: Number(course?.likes ?? defaultCourses[index]?.likes ?? 0),
    price: Number(course?.price ?? defaultCourses[index]?.price ?? 0),
    order: Number(course?.order ?? defaultCourses[index]?.order ?? index),
  };
}

export function getStoredCourses() {
  const stored = readStorage(COURSES_KEY, null);

  if (!Array.isArray(stored) || stored.length === 0) {
    writeStorage(COURSES_KEY, defaultCourses);
    return defaultCourses;
  }

  const normalized = stored.map((course, index) => normalizeCourse(course, index));
  writeStorage(COURSES_KEY, normalized);
  return normalized;
}

export function saveStoredCourses(courses) {
  const normalized = courses.map((course, index) => normalizeCourse(course, index));
  writeStorage(COURSES_KEY, normalized);
  return normalized;
}

export function getStoredLessons() {
  const stored = readStorage(LESSONS_KEY, null);

  if (!stored || typeof stored !== "object" || Array.isArray(stored)) {
    writeStorage(LESSONS_KEY, defaultLessons);
    return defaultLessons;
  }

  const normalized = { ...defaultLessons, ...stored };
  writeStorage(LESSONS_KEY, normalized);
  return normalized;
}

export function saveStoredLessons(lessons) {
  const normalized = { ...lessons };
  writeStorage(LESSONS_KEY, normalized);
  return normalized;
}

export function getLevelRank(level) {
  return levelOrder[level] ?? 99;
}

export function buildLessonDraft(courseUrl, existingLesson) {
  return {
    courseUrl,
    title: existingLesson?.title ?? "",
    theory: existingLesson?.theory ?? "",
    preCode: existingLesson?.preCode ?? "",
    task: existingLesson?.task ?? "",
    requiredSteps: Array.isArray(existingLesson?.requiredSteps)
      ? existingLesson.requiredSteps.join(", ")
      : "",
    downloadContent: existingLesson?.downloadContent ?? "",
    next: existingLesson?.next ?? "",
  };
}
