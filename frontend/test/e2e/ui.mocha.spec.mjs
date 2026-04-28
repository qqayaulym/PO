import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..", "..");
const distRoot = path.join(projectRoot, "dist");
const baseUrl = "http://127.0.0.1:4173";
const screenshotDir = path.join(projectRoot, "test-artifacts");

const dashboardPayload = {
  users: 128,
  courses: 6,
  lessons: 18,
  likes: 74,
  enrollments: 39,
};

const coursesPayload = {
  items: [
    {
      id: 1,
      title: "SQL негіздері",
      description: "SELECT, INSERT, UPDATE және DELETE командаларын үйрену курсы.",
      level: "Beginner",
      price: 0,
      likes: 14,
      slug: "sql-basics",
      url: "sql-basics",
      orderIndex: 1,
    },
    {
      id: 2,
      title: "JOIN және аналитика",
      description: "JOIN, GROUP BY және агрегаттық функциялармен жұмыс.",
      level: "Intermediate",
      price: 12000,
      likes: 28,
      slug: "join-analytics",
      url: "join-analytics",
      orderIndex: 2,
    },
  ],
  totalPages: 1,
};

const lessonPayload = {
  item: {
    id: 1,
    title: "SQL негіздері",
    description: "SELECT, INSERT, UPDATE және DELETE командаларын үйрену курсы.",
    level: "Beginner",
    price: 0,
    likes: 14,
    slug: "sql-basics",
    orderIndex: 1,
    lesson: {
      title: "SELECT сұранысы",
      theory: "SELECT арқылы кестеден мәлімет аламыз.",
      preCode: "SELECT * FROM users;",
      downloadContent: "SELECT * FROM users;",
      task: "users кестесіндегі барлық жазбаны шығарыңыз.",
      requiredSteps: ["select", "from users"],
      quiz: {
        question: "Барлық бағандарды таңдау үшін не жазылады?",
        options: ["SELECT ALL", "SELECT *", "SHOW *"],
        answerIndex: 1,
      },
    },
  },
};

const allCoursesPayload = {
  items: coursesPayload.items.map((course) => ({ ...course })),
};

const studentSession = {
  currentUser: {
    id: 7,
    fullName: "Aruzhan Student",
    role: "student",
  },
  favorites: [1],
  enrolledCourseIds: [1],
};

const adminSession = {
  currentUser: {
    id: 1,
    fullName: "Admin User",
    role: "admin",
  },
  favorites: [],
  enrolledCourseIds: [1],
};

const chromeCandidates = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
];

let browser;
let staticServer;

function getChromePath() {
  const envPath = process.env.CHROME_BIN;
  if (envPath && fs.existsSync(envPath)) return envPath;

  const found = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error("Chrome немесе Edge браузері табылмады. CHROME_BIN айнымалысын орнатыңыз.");
  }

  return found;
}

async function waitForServer(url, timeoutMs = 15000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Статикалық тест сервері ${url} мекенжайында уақытында іске қосылмады.`);
}

function getContentType(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".html") return "text/html; charset=UTF-8";
  if (extension === ".js") return "text/javascript; charset=UTF-8";
  if (extension === ".css") return "text/css; charset=UTF-8";
  if (extension === ".svg") return "image/svg+xml";
  if (extension === ".png") return "image/png";
  if (extension === ".jpg" || extension === ".jpeg") return "image/jpeg";

  return "application/octet-stream";
}

function createStaticServer() {
  return http.createServer((request, response) => {
    const requestPath = new URL(request.url, baseUrl).pathname;
    const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
    const assetPath = path.join(distRoot, relativePath);
    const shouldServeAsset = fs.existsSync(assetPath) && fs.statSync(assetPath).isFile();
    const filePath = shouldServeAsset ? assetPath : path.join(distRoot, "index.html");

    response.writeHead(200, { "Content-Type": getContentType(filePath) });
    response.end(fs.readFileSync(filePath));
  });
}

function createApiHandler() {
  return async (request) => {
    const requestUrl = new URL(request.url());

    if (!requestUrl.pathname.startsWith("/api/")) {
      await request.continue();
      return;
    }

    const jsonResponse = (status, payload) =>
      request.respond({
        status,
        contentType: "application/json; charset=UTF-8",
        body: JSON.stringify(payload),
      });

    if (requestUrl.pathname === "/api/dashboard" && request.method() === "GET") {
      await jsonResponse(200, dashboardPayload);
      return;
    }

    if (requestUrl.pathname === "/api/courses" && request.method() === "GET") {
      await jsonResponse(200, coursesPayload);
      return;
    }

    if (requestUrl.pathname === "/api/courses/all" && request.method() === "GET") {
      await jsonResponse(200, allCoursesPayload);
      return;
    }

    if (requestUrl.pathname === "/api/courses/sql-basics" && request.method() === "GET") {
      await jsonResponse(200, lessonPayload);
      return;
    }

    if (requestUrl.pathname === "/api/users/7/enrollments" && request.method() === "GET") {
      await jsonResponse(200, { items: [1] });
      return;
    }

    if (requestUrl.pathname === "/api/auth/signup" && request.method() === "POST") {
      await jsonResponse(201, {
        message: "Тіркелу сәтті өтті!",
      });
      return;
    }

    if (requestUrl.pathname === "/api/auth/signin" && request.method() === "POST") {
      const payload = JSON.parse(request.postData() || "{}");

      if (payload.email === "student@sqlstudy.kz" && payload.password === "student123") {
        await jsonResponse(200, {
          user: {
            id: 7,
            fullName: "Aruzhan Student",
            role: "student",
          },
          likedCourseIds: [1],
          enrolledCourseIds: [1],
        });
        return;
      }

      await jsonResponse(401, {
        message: "Email немесе құпиясөз қате.",
      });
      return;
    }

    await jsonResponse(404, { message: "Mock route табылмады" });
  };
}

async function createPage(startPath = "/", localStorageState = null) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 960 });
  await page.setRequestInterception(true);
  page.on("request", createApiHandler());

  await page.evaluateOnNewDocument((state) => {
    window.localStorage.clear();

    Object.entries(state || {}).forEach(([key, value]) => {
      window.localStorage.setItem(key, JSON.stringify(value));
    });
  }, localStorageState);

  await page.goto(`${baseUrl}${startPath}`, { waitUntil: "networkidle0" });
  return page;
}

describe("SQL Study Hub UI tests", function () {
  this.timeout(40000);

  before(async function () {
    fs.mkdirSync(screenshotDir, { recursive: true });
    if (!fs.existsSync(path.join(distRoot, "index.html"))) {
      throw new Error("dist/index.html табылмады. Алдымен npm run build орындаңыз.");
    }

    staticServer = createStaticServer();
    await new Promise((resolve, reject) => {
      staticServer.once("error", reject);
      staticServer.listen(4173, "127.0.0.1", resolve);
    });

    await waitForServer(baseUrl);

    browser = await puppeteer.launch({
      executablePath: getChromePath(),
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    });
  });

  after(async function () {
    if (browser) {
      await browser.close();
    }

    if (staticServer) {
      await new Promise((resolve, reject) => {
        staticServer.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }
  });

  describe("1-бөлім: Интерфейс", function () {
    it("Басты бетте логотип көрінеді", async function () {
      const page = await createPage("/");
      const logoText = await page.$eval(".logo", (node) => node.textContent);
      assert.equal(logoText?.trim(), "SQL Study Hub");
      await page.screenshot({ path: path.join(screenshotDir, "home-page.png"), fullPage: true });
      await page.close();
    });

    it("Негізгі батырмалар көрінеді", async function () {
      const page = await createPage("/");
      const buttons = await page.$$eval(".buttons button", (nodes) =>
        nodes.map((node) => node.textContent || "")
      );
      assert.deepEqual(
        buttons.map((item) => item.trim()),
        ["Тіркелу", "Курстарға өту"]
      );
      await page.close();
    });

    it("Мәзір элементтері толық және дұрыс ретпен орналасқан", async function () {
      const page = await createPage("/");
      const navItems = await page.$$eval(".main-nav a", (nodes) =>
        nodes.map((node) => node.textContent || "")
      );
      assert.deepEqual(
        navItems.map((item) => item.trim()),
        ["Басты бет", "Курстар", "Себет", "Кіру"]
      );
      await page.close();
    });

    it("Контенттегі суреттер толық жүктеледі", async function () {
      const page = await createPage("/");
      const imageStates = await page.$$eval("main img", (images) =>
        images.map((img) => ({
          alt: img.getAttribute("alt"),
          complete: img.complete,
          naturalWidth: img.naturalWidth,
        }))
      );

      assert.equal(imageStates.length, 4);
      imageStates.forEach((image) => {
        assert.equal(image.complete, true);
        assert.ok(image.naturalWidth > 0, `Сурет жүктелмеді: ${image.alt}`);
      });

      await page.close();
    });

    it("Бет title дұрыс көрсетіледі", async function () {
      const page = await createPage("/");
      await page.waitForFunction(() => document.title === "SQL Study Hub");
      assert.equal(await page.title(), "SQL Study Hub");
      await page.close();
    });
  });

  describe("2-бөлім: Навигация", function () {
    it("Басты бет сілтемесі пайдаланушыны негізгі бетке қайтарады", async function () {
      const page = await createPage("/courses");
      await page.locator('a[href="/"]').click();
      await page.waitForFunction(() => window.location.pathname === "/");
      assert.equal(await page.$eval(".hero-kicker", (node) => node.textContent), "SQL learning platform");
      await page.close();
    });

    it("Курстар беті ашылып, қорғалған себет беті логинге бағыттайды", async function () {
      const page = await createPage("/");
      await page.locator('a[href="/courses"]').click();
      await page.waitForFunction(() => window.location.pathname === "/courses");
      assert.equal(new URL(page.url()).pathname, "/courses");

      await page.locator('a[href="/cart"]').click();
      await page.waitForFunction(() => window.location.pathname === "/signin");
      assert.equal(new URL(page.url()).pathname, "/signin");
      await page.close();
    });

    it("Логиннен кейін қорғалған маршруттар ашылады", async function () {
      const page = await createPage("/", studentSession);
      await page.locator('a[href="/cart"]').click();
      await page.waitForFunction(() => window.location.pathname === "/cart");
      assert.equal(new URL(page.url()).pathname, "/cart");
      await page.close();
    });

    it("Админ емес қолданушы admin бетіне кіре алмайды", async function () {
      const studentPage = await createPage("/admin", studentSession);
      await studentPage.waitForFunction(() => window.location.pathname === "/");
      assert.equal(new URL(studentPage.url()).pathname, "/");
      await studentPage.close();

      const adminPage = await createPage("/admin", adminSession);
      await adminPage.waitForFunction(() => window.location.pathname === "/admin");
      assert.equal(new URL(adminPage.url()).pathname, "/admin");
      const heading = await adminPage.$eval(".admin-hero h2", (node) => node.textContent);
      assert.equal(heading?.trim(), "Админ панель");
      await adminPage.close();
    });

    it("Қорғалған курс сабағы логинсіз ашылмайды", async function () {
      const page = await createPage("/course/sql-basics");
      await page.waitForFunction(() => window.location.pathname === "/signin");
      assert.equal(new URL(page.url()).pathname, "/signin");
      await page.close();
    });

    it("Артқа және Алға батырмалары маршрутты дұрыс ауыстырады", async function () {
      const page = await createPage("/");
      await page.locator('a[href="/courses"]').click();
      await page.waitForFunction(() => window.location.pathname === "/courses");

      await page.goBack({ waitUntil: "networkidle0" });
      assert.equal(new URL(page.url()).pathname, "/");

      await page.goForward({ waitUntil: "networkidle0" });
      assert.equal(new URL(page.url()).pathname, "/courses");
      await page.close();
    });

    it("Қате маршрут 404 хабарламасын көрсетеді", async function () {
      const page = await createPage("/unknown-page");
      const notFoundText = await page.$eval(".not-found-title", (node) => node.textContent);
      assert.match(notFoundText, /жасырынып қалды/i);
      await page.close();
    });

    it("Бір беттен екіншісіне өткенде контент жаңарады", async function () {
      const page = await createPage("/");
      const homeHeading = await page.$eval(".left-content h2", (node) => node.textContent);
      await page.locator('a[href="/courses"]').click();
      await page.waitForFunction(() => window.location.pathname === "/courses");
      const coursesHeading = await page.$eval("#courses-page-h2", (node) => node.textContent);

      assert.notEqual(homeHeading?.trim(), coursesHeading?.trim());
      assert.equal(coursesHeading?.trim(), "Оқу бағдарламасы");
      await page.screenshot({ path: path.join(screenshotDir, "courses-page.png"), fullPage: true });
      await page.close();
    });
  });

  describe("3-бөлім: Формалар", function () {
    it("Бос форма жіберілгенде required валидациясы іске қосылады", async function () {
      const page = await createPage("/signup");
      await page.locator('button[type="submit"]').click();

      const invalidState = await page.$eval("#fullName", (input) => ({
        valid: input.checkValidity(),
        valueMissing: input.validity.valueMissing,
      }));

      assert.equal(invalidState.valid, false);
      assert.equal(invalidState.valueMissing, true);
      assert.equal(new URL(page.url()).pathname, "/signup");
      await page.close();
    });

    it("Қате email енгізілсе, браузер оны typeMismatch арқылы таниды", async function () {
      const page = await createPage("/signup");
      await page.locator("#email").fill("student-at-mail");

      const emailState = await page.$eval("#email", (input) => ({
        valid: input.checkValidity(),
        typeMismatch: input.validity.typeMismatch,
        message: input.validationMessage,
      }));

      assert.equal(emailState.valid, false);
      assert.equal(emailState.typeMismatch, true);
      assert.ok(emailState.message.length > 0);
      await page.close();
    });

    it("Парольдің минималды ұзындығы тексеріледі", async function () {
      const page = await createPage("/signup");
      await page.locator("#password").fill("123");

      const passwordState = await page.$eval("#password", (input) => ({
        valid: input.checkValidity(),
        tooShort: input.validity.tooShort,
        minLength: input.minLength,
      }));

      assert.equal(passwordState.valid, false);
      assert.equal(passwordState.tooShort, true);
      assert.equal(passwordState.minLength, 6);
      await page.close();
    });

    it("Дұрыс толтырылған тіркелу формасы сәтті жіберіледі", async function () {
      const page = await createPage("/signup");
      await page.locator("#fullName").fill("Aruzhan Student");
      await page.locator("#email").fill("student@sqlstudy.kz");
      await page.locator("#phone").fill("+77001234567");
      await page.locator("#password").fill("student123");
      await page.locator('button[type="submit"]').click();

      await page.waitForFunction(() => window.location.pathname === "/signin");
      assert.equal(new URL(page.url()).pathname, "/signin");
      await page.close();
    });

    it("Қате логин мәліметтерінде нақты хабарлама көрсетіледі", async function () {
      const page = await createPage("/signin");
      await page.locator("#email").fill("wrong@sqlstudy.kz");
      await page.locator("#password").fill("wrongpass");
      await page.locator('button[type="submit"]').click();

      await page.waitForSelector(".toast-error");
      const toastText = await page.$eval(".toast-error span", (node) => node.textContent);
      assert.equal(toastText?.trim(), "Email немесе құпиясөз қате.");
      await page.screenshot({ path: path.join(screenshotDir, "signin-error.png"), fullPage: true });
      await page.close();
    });
  });
});
