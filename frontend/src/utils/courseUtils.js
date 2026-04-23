export const emptyCourseForm = {
  id: null,
  title: "",
  description: "",
  category: "database",
  level: "Бастауыш",
  price: 0,
};

export function buildLessonDraft(course) {
  return {
    title: course?.lesson?.title || (course?.title ? `${course.title} сабағы` : ""),
    theory: course?.lesson?.theory || "",
    preCode: course?.lesson?.preCode || "",
    task: course?.lesson?.task || "",
    requiredSteps: Array.isArray(course?.lesson?.requiredSteps)
      ? course.lesson.requiredSteps.join(", ")
      : "",
    downloadContent: course?.lesson?.downloadContent || "",
  };
}
