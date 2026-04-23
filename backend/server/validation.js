export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яәіңғүұқөһ\s-]/gi, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function validateSignup(body) {
  const errors = [];

  if (!body.fullName?.trim()) errors.push("Аты-жөні міндетті.");
  if (!isValidEmail(body.email || "")) errors.push("Email форматы қате.");
  if (!body.password || body.password.length < 6) {
    errors.push("Құпиясөз кемінде 6 таңбадан тұруы керек.");
  }

  return errors;
}

export function validateSignin(body) {
  const errors = [];

  if (!isValidEmail(body.email || "")) errors.push("Email форматы қате.");
  if (!body.password?.trim()) errors.push("Құпиясөз енгізіңіз.");

  return errors;
}

export function validateCourse(body) {
  const errors = [];

  if (!body.title?.trim()) errors.push("Курс атауын енгізіңіз.");
  if (!body.description?.trim()) errors.push("Курс сипаттамасын енгізіңіз.");
  if (!body.category?.trim()) errors.push("Санатты енгізіңіз.");
  if (!body.level?.trim()) errors.push("Деңгейді таңдаңыз.");
  if (Number.isNaN(Number(body.price)) || Number(body.price) < 0) {
    errors.push("Баға 0 немесе одан үлкен болу керек.");
  }

  return errors;
}

export function validateLesson(body) {
  const errors = [];

  if (!body.title?.trim()) errors.push("Сабақ атауын енгізіңіз.");
  if (!body.theory?.trim()) errors.push("Теория бөлімі бос болмауы керек.");
  if (!body.task?.trim()) errors.push("Практикалық тапсырма міндетті.");

  return errors;
}
