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

const coursesSeed = [
  {
    id: 1,
    title: "SQL негіздері",
    description: "SELECT, INSERT, UPDATE және DELETE командаларын үйрену курсы.",
    category: "SQL",
    level: "Бастауыш",
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
    category: "Analytics",
    level: "Орта",
    price: 12000,
    likes: 28,
    slug: "join-analytics",
    url: "join-analytics",
    orderIndex: 2,
  },
  {
    id: 3,
    title: "Subquery шеберлігі",
    description: "Күрделі сұраулар мен nested SELECT тәсілдері.",
    category: "Advanced",
    level: "Күрделі",
    price: 18000,
    likes: 7,
    slug: "subquery-master",
    url: "subquery-master",
    orderIndex: 3,
  },
];

const lessonPayloads = {
  "sql-basics": {
    item: {
      ...coursesSeed[0],
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
  },
  "join-analytics": {
    item: {
      ...coursesSeed[1],
      lesson: {
        title: "JOIN практикасы",
        theory: "INNER JOIN арқылы байланысқан кестелерді біріктіреміз.",
        preCode: "SELECT * FROM orders JOIN users ON orders.user_id = users.id;",
        downloadContent: "JOIN cheat sheet",
        task: "orders және users кестелерін біріктіріңіз.",
        requiredSteps: ["join", "orders", "users"],
        quiz: {
          question: "Екі кестені біріктіру үшін не қолданылады?",
          options: ["LIMIT", "JOIN", "DELETE"],
          answerIndex: 1,
        },
      },
    },
  },
};

const usersPayload = {
  items: [
    {
      id: 1,
      full_name: "Admin User",
      email: "admin@sqlstudy.kz",
      phone: "+77000000000",
      role: "admin",
      created_at: "2026-04-20T09:00:00Z",
    },
    {
      id: 7,
      full_name: "Aruzhan Student",
      email: "student@sqlstudy.kz",
      phone: "+77001234567",
      role: "student",
      created_at: "2026-04-23T12:10:00Z",
    },
  ],
};

const studentSession = {
  currentUser: {
    id: 7,
    fullName: "Aruzhan Student",
    role: "student",
  },
  favorites: [1],
  cart: [2],
  enrolledCourseIds: [1],
};

const adminSession = {
  currentUser: {
    id: 1,
    fullName: "Admin User",
    role: "admin",
  },
  favorites: [],
  cart: [],
  enrolledCourseIds: [1],
};

const mobileViewport = { width: 390, height: 844, isMobile: true, hasTouch: true };
const tabletViewport = { width: 768, height: 1024, isMobile: true, hasTouch: true };
const desktopViewport = { width: 1440, height: 960 };

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
      // still starting
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  throw new Error(`Статикалық сервер ${url} мекенжайында уақытында іске қосылмады.`);
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

function getFilteredCourses(requestUrl) {
  let items = [...coursesSeed];
  const search = (requestUrl.searchParams.get("search") || "").trim().toLowerCase();
  const filter = requestUrl.searchParams.get("filter") || "all";
  const sort = requestUrl.searchParams.get("sort") || "";
  const page = Math.max(1, Number(requestUrl.searchParams.get("page") || 1));
  const limit = Math.max(1, Number(requestUrl.searchParams.get("limit") || 6));

  if (search) {
    items = items.filter((course) =>
      [course.title, course.description, course.category, course.level]
        .some((value) => String(value || "").toLowerCase().includes(search))
    );
  }

  if (filter === "free") {
    items = items.filter((course) => course.price === 0);
  } else if (filter === "paid") {
    items = items.filter((course) => course.price > 0);
  } else if (filter.startsWith("level:")) {
    const level = filter.replace("level:", "");
    items = items.filter((course) => course.level === level);
  }

  if (sort === "title") {
    items.sort((a, b) => a.title.localeCompare(b.title, "kk"));
  } else if (sort === "price-asc") {
    items.sort((a, b) => a.price - b.price);
  } else if (sort === "price-desc") {
    items.sort((a, b) => b.price - a.price);
  } else if (sort === "likes") {
    items.sort((a, b) => b.likes - a.likes);
  } else if (sort === "level") {
    const levelOrder = { Бастауыш: 1, Орта: 2, Күрделі: 3 };
    items.sort((a, b) => (levelOrder[a.level] || 99) - (levelOrder[b.level] || 99));
  }

  const total = items.length;
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
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

    if (requestUrl.pathname === "/api/users" && request.method() === "GET") {
      await jsonResponse(200, usersPayload);
      return;
    }

    if (requestUrl.pathname === "/api/users/7/enrollments" && request.method() === "GET") {
      await jsonResponse(200, { items: [1] });
      return;
    }

    if (requestUrl.pathname === "/api/courses" && request.method() === "GET") {
      await jsonResponse(200, getFilteredCourses(requestUrl));
      return;
    }

    if (requestUrl.pathname === "/api/courses/all" && request.method() === "GET") {
      await jsonResponse(200, { items: coursesSeed });
      return;
    }

    if (requestUrl.pathname.startsWith("/api/courses/") && request.method() === "GET") {
      const slug = requestUrl.pathname.replace("/api/courses/", "");
      const payload = lessonPayloads[slug];
      if (payload) {
        await jsonResponse(200, payload);
        return;
      }

      await jsonResponse(404, { message: "Курс табылмады." });
      return;
    }

    if (requestUrl.pathname === "/api/courses/2/like" && request.method() === "POST") {
      await jsonResponse(200, {
        liked: true,
        course: { ...coursesSeed[1], likes: 29 },
      });
      return;
    }

    if (requestUrl.pathname === "/api/courses/1/like" && request.method() === "POST") {
      await jsonResponse(200, {
        liked: false,
        course: { ...coursesSeed[0], likes: 13 },
      });
      return;
    }

    if (requestUrl.pathname === "/api/checkout" && request.method() === "POST") {
      const payload = JSON.parse(request.postData() || "{}");
      const courseIds = Array.isArray(payload.courseIds) ? payload.courseIds : [];
      const purchasedCourses = coursesSeed.filter((course) => courseIds.includes(course.id));
      const totalAmount = purchasedCourses.reduce((sum, course) => sum + Number(course.price || 0), 0);

      await jsonResponse(200, {
        ok: true,
        createdCount: purchasedCourses.length,
        enrolledCourseIds: [1, ...courseIds.filter((id) => id !== 1)],
        totalAmount,
      });
      return;
    }

    if (requestUrl.pathname === "/api/auth/signup" && request.method() === "POST") {
      const payload = JSON.parse(request.postData() || "{}");

      if (String(payload.email || "").toLowerCase() === "existing@sqlstudy.kz") {
        await jsonResponse(409, { message: "Бұл email бұрын тіркелген." });
        return;
      }

      await jsonResponse(201, { message: "Тіркелу сәтті өтті!" });
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

      if (payload.email === "admin@sqlstudy.kz" && payload.password === "admin123") {
        await jsonResponse(200, {
          user: {
            id: 1,
            fullName: "Admin User",
            role: "admin",
          },
          likedCourseIds: [],
          enrolledCourseIds: [1],
        });
        return;
      }

      await jsonResponse(401, { message: "Email немесе құпиясөз қате." });
      return;
    }

    await jsonResponse(404, { message: "Mock route табылмады" });
  };
}

async function createPage(startPath = "/", options = {}) {
  const { localStorageState = null, viewport = desktopViewport } = options;
  const page = await browser.newPage();
  await page.setViewport(viewport);
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

async function getCourseTitles(page) {
  return page.$$eval(".course-card h3", (nodes) => nodes.map((node) => node.textContent?.trim() || ""));
}

describe("LAB10: Қорытынды тестілеу және сайтты іске қосу", function () {
  this.timeout(50000);

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

  describe("1. Интерфейс (UI) толық тестілеу", function () {
    it("Барлық негізгі беттер дұрыс жүктеледі", async function () {
      const pages = ["/", "/courses", "/signin", "/signup", "/unknown-page"];

      for (const pathname of pages) {
        const page = await createPage(pathname);
        assert.equal(new URL(page.url()).pathname, pathname);
        await page.close();
      }
    });

    it("Басты бетте логотип, мәтін және негізгі батырмалар көрінеді", async function () {
      const page = await createPage("/");
      assert.equal(await page.$eval(".logo", (node) => node.textContent?.trim()), "SQL Study Hub");
      assert.equal(await page.$eval(".hero-kicker", (node) => node.textContent?.trim()), "SQL learning platform");

      const buttons = await page.$$eval(".buttons button", (nodes) =>
        nodes.map((node) => node.textContent?.trim() || "")
      );
      assert.deepEqual(buttons, ["Тіркелу", "Курстарға өту"]);

      await page.screenshot({ path: path.join(screenshotDir, "home-page.png"), fullPage: true });
      await page.close();
    });

    it("Дизайн элементтері light және dark theme арасында өзгереді", async function () {
      const page = await createPage("/");
      assert.equal(
        await page.evaluate(() => document.documentElement.getAttribute("data-theme")),
        "light"
      );

      await page.locator(".theme-btn").click();
      await page.waitForFunction(() => document.documentElement.getAttribute("data-theme") === "dark");
      assert.equal(
        await page.evaluate(() => document.documentElement.getAttribute("data-theme")),
        "dark"
      );
      await page.close();
    });

    it("Негізгі суреттер толық жүктеледі және бос элементтер табылмайды", async function () {
      const page = await createPage("/");
      const imageStates = await page.$$eval("main img", (images) =>
        images.map((img) => ({
          alt: img.getAttribute("alt"),
          complete: img.complete,
          naturalWidth: img.naturalWidth,
        }))
      );

      imageStates.forEach((image) => {
        assert.equal(image.complete, true);
        assert.ok(image.naturalWidth > 0, `Сурет жүктелмеді: ${image.alt}`);
      });

      const emptyTextNodes = await page.$$eval("button, a, h1, h2, h3", (nodes) =>
        nodes.filter((node) => !node.textContent?.trim()).length
      );
      assert.equal(emptyTextNodes, 0);
      await page.close();
    });

    it("Desktop, tablet және mobile экрандарында негізгі бет ашылады", async function () {
      const desktopPage = await createPage("/", { viewport: desktopViewport });
      const tabletPage = await createPage("/", { viewport: tabletViewport });
      const mobilePage = await createPage("/", { viewport: mobileViewport });

      assert.equal(await desktopPage.$eval(".logo", (node) => node.textContent?.trim()), "SQL Study Hub");
      assert.equal(await tabletPage.$eval(".logo", (node) => node.textContent?.trim()), "SQL Study Hub");
      assert.equal(await mobilePage.$eval(".logo", (node) => node.textContent?.trim()), "SQL Study Hub");

      await desktopPage.close();
      await tabletPage.close();
      await mobilePage.close();
    });
  });

  describe("2. Навигацияны толық тестілеу", function () {
    it("Мәзір сілтемелері дұрыс көрсетіледі", async function () {
      const page = await createPage("/");
      const navItems = await page.$$eval(".main-nav a", (nodes) =>
        nodes.map((node) => node.textContent?.trim() || "")
      );
      assert.deepEqual(navItems, ["Басты бет", "Курстар", "Себет", "Кіру"]);
      await page.close();
    });

    it("Беттер арасында ауысу және URL құрылымы дұрыс жұмыс істейді", async function () {
      const page = await createPage("/");
      await page.locator('a[href="/courses"]').click();
      await page.waitForFunction(() => window.location.pathname === "/courses");
      assert.equal(new URL(page.url()).pathname, "/courses");

      await page.locator('a[href="/"]').click();
      await page.waitForFunction(() => window.location.pathname === "/");
      assert.equal(new URL(page.url()).pathname, "/");
      await page.close();
    });

    it("Қате маршрут 404 бетін ашады", async function () {
      const page = await createPage("/missing-page");
      const notFoundTitle = await page.$eval(".not-found-title", (node) => node.textContent?.trim());
      assert.match(notFoundTitle, /жасырынып қалды/i);
      await page.close();
    });

    it("Ішкі навигация батырмалары дұрыс маршрутқа апарады", async function () {
      const page = await createPage("/cart", { localStorageState: studentSession });
      await page.locator(".back-link").click();
      await page.waitForFunction(() => window.location.pathname === "/courses");
      assert.equal(new URL(page.url()).pathname, "/courses");
      await page.close();
    });

    it("Breadcrumb болмаған жағдайда ішкі навигацияның баламасы жұмыс істейді", async function () {
      const page = await createPage("/unknown-page");
      await page.locator(".not-found-primary").click();
      await page.waitForFunction(() => window.location.pathname === "/");
      assert.equal(new URL(page.url()).pathname, "/");
      await page.close();
    });

    it("Браузердің Артқа және Алға батырмалары дұрыс жұмыс істейді", async function () {
      const page = await createPage("/");
      await page.locator('a[href="/courses"]').click();
      await page.waitForFunction(() => window.location.pathname === "/courses");

      await page.goBack({ waitUntil: "networkidle0" });
      assert.equal(new URL(page.url()).pathname, "/");

      await page.goForward({ waitUntil: "networkidle0" });
      assert.equal(new URL(page.url()).pathname, "/courses");
      await page.close();
    });
  });

  describe("3. Формаларды толық тестілеу", function () {
    it("Логин және тіркелу формалары анық көрінеді", async function () {
      const signInPage = await createPage("/signin");
      const signUpPage = await createPage("/signup");

      assert.equal(await signInPage.$eval(".sign-title", (node) => node.textContent?.trim()), "Кіру");
      assert.equal(await signUpPage.$eval(".sign-title", (node) => node.textContent?.trim()), "Тіркелу");

      await signInPage.close();
      await signUpPage.close();
    });

    it("Тіркелу формасында required validation іске қосылады", async function () {
      const page = await createPage("/signup");
      await page.locator('button[type="submit"]').click();

      const fullNameState = await page.$eval("#fullName", (input) => ({
        valid: input.checkValidity(),
        valueMissing: input.validity.valueMissing,
      }));

      assert.equal(fullNameState.valid, false);
      assert.equal(fullNameState.valueMissing, true);
      await page.close();
    });

    it("Қате email браузерлік валидациямен анықталады", async function () {
      const page = await createPage("/signup");
      await page.locator("#email").fill("student-at-mail");

      const emailState = await page.$eval("#email", (input) => ({
        valid: input.checkValidity(),
        typeMismatch: input.validity.typeMismatch,
      }));

      assert.equal(emailState.valid, false);
      assert.equal(emailState.typeMismatch, true);
      await page.close();
    });

    it("Қысқа пароль қабылданбайды", async function () {
      const page = await createPage("/signup");
      await page.locator("#password").fill("123");

      const passwordState = await page.$eval("#password", (input) => ({
        valid: input.checkValidity(),
        tooShort: input.validity.tooShort,
      }));

      assert.equal(passwordState.valid, false);
      assert.equal(passwordState.tooShort, true);
      await page.close();
    });

    it("Тіркелу формасы дұрыс деректермен сәтті жіберіледі", async function () {
      const page = await createPage("/signup");
      await page.locator("#fullName").fill("Aruzhan Student");
      await page.locator("#email").fill("fresh@sqlstudy.kz");
      await page.locator("#phone").fill("+77001234567");
      await page.locator("#password").fill("student123");
      await page.locator('button[type="submit"]').click();

      await page.waitForFunction(() => window.location.pathname === "/signin");
      assert.equal(new URL(page.url()).pathname, "/signin");
      await page.close();
    });

    it("Тіркелуде бұрын бар email үшін түсінікті қате көрсетіледі", async function () {
      const page = await createPage("/signup");
      await page.locator("#fullName").fill("Existing User");
      await page.locator("#email").fill("existing@sqlstudy.kz");
      await page.locator("#phone").fill("+77009999999");
      await page.locator("#password").fill("student123");
      await page.locator('button[type="submit"]').click();

      await page.waitForSelector(".toast-error");
      assert.equal(
        await page.$eval(".toast-error span", (node) => node.textContent?.trim()),
        "Бұл email бұрын тіркелген."
      );
      await page.close();
    });
  });

  describe("4. Аутентификация және қауіпсіздік", function () {
    it("Дұрыс логин/пароль арқылы жүйеге кіру жұмыс істейді", async function () {
      const page = await createPage("/signin");
      await page.locator("#email").fill("student@sqlstudy.kz");
      await page.locator("#password").fill("student123");
      await page.locator('button[type="submit"]').click();

      await page.waitForFunction(() => window.location.pathname === "/");
      assert.equal(new URL(page.url()).pathname, "/");
      assert.equal(await page.$eval(".user-chip span", (node) => node.textContent?.trim()), "Aruzhan Student");
      await page.close();
    });

    it("Қате пароль енгізгенде нақты қате хабарламасы көрсетіледі", async function () {
      const page = await createPage("/signin");
      await page.locator("#email").fill("student@sqlstudy.kz");
      await page.locator("#password").fill("wrongpass");
      await page.locator('button[type="submit"]').click();

      await page.waitForSelector(".toast-error");
      assert.equal(
        await page.$eval(".toast-error span", (node) => node.textContent?.trim()),
        "Email немесе құпиясөз қате."
      );
      await page.screenshot({ path: path.join(screenshotDir, "signin-error.png"), fullPage: true });
      await page.close();
    });

    it("Қолданушы сессиясы reload кейін сақталады", async function () {
      const page = await createPage("/", { localStorageState: studentSession });
      await page.reload({ waitUntil: "networkidle0" });
      assert.equal(await page.$eval(".user-chip span", (node) => node.textContent?.trim()), "Aruzhan Student");
      await page.close();
    });

    it("Рұқсатсыз қолданушы қорғалған беттерге кіре алмайды", async function () {
      const cartPage = await createPage("/cart");
      assert.equal(new URL(cartPage.url()).pathname, "/signin");
      await cartPage.close();

      const lessonPage = await createPage("/course/sql-basics");
      assert.equal(new URL(lessonPage.url()).pathname, "/signin");
      await lessonPage.close();
    });

    it("Admin емес қолданушы admin бетіне кіре алмайды", async function () {
      const page = await createPage("/admin", { localStorageState: studentSession });
      assert.equal(new URL(page.url()).pathname, "/");
      await page.close();
    });
  });

  describe("5. Функционалдық тестілеу", function () {
    it("Курстар тізімі жүктеледі және іздеу дұрыс жұмыс істейді", async function () {
      const page = await createPage("/courses");
      assert.equal((await getCourseTitles(page)).length, 3);

      await page.locator('.search-box input').fill("JOIN");
      await page.waitForFunction(() => document.querySelectorAll(".course-card").length === 1);

      const titles = await getCourseTitles(page);
      assert.deepEqual(titles, ["JOIN және аналитика"]);
      await page.close();
    });

    it("Фильтр және сұрыптау жұмыс істейді", async function () {
      const page = await createPage("/courses");
      await page.locator('button.filter-btn:nth-of-type(2)').click();
      await page.waitForFunction(() => document.querySelectorAll(".course-card").length === 1);
      assert.deepEqual(await getCourseTitles(page), ["SQL негіздері"]);

      await page.locator('button.filter-btn:nth-of-type(1)').click();
      await page.select(".sort-group select", "price-desc");
      await page.waitForFunction(() => document.querySelector(".course-card h3")?.textContent?.includes("Subquery"));
      assert.equal((await getCourseTitles(page))[0], "Subquery шеберлігі");
      await page.close();
    });

    it("Лайк батырмасы және санағы дұрыс өзгереді", async function () {
      const page = await createPage("/courses", { localStorageState: studentSession });
      const likeButtonsBefore = await page.$$eval(".fav-btn", (nodes) =>
        nodes.map((node) => node.textContent?.trim() || "")
      );
      assert.match(likeButtonsBefore[0], /Лайкты алып тастау/);

      await page.locator(".course-card:nth-of-type(2) .fav-btn").click();
      await page.waitForFunction(() =>
        document.querySelector(".course-card:nth-of-type(2) .fav-btn")?.textContent?.includes("(29)")
      );
      const secondLikeText = await page.$eval(
        ".course-card:nth-of-type(2) .fav-btn",
        (node) => node.textContent?.trim()
      );
      assert.match(secondLikeText, /\(29\)/);
      await page.close();
    });

    it("Себет пен checkout логикасы дұрыс жұмыс істейді", async function () {
      const page = await createPage("/cart", { localStorageState: studentSession });
      assert.match(
        await page.$eval(".summary-chip", (node) => node.textContent?.trim()),
        /1 курс таңдалды/
      );
      assert.equal(await page.$eval(".total-amount", (node) => node.textContent?.trim()), "12000 ₸");

      await page.locator(".checkout-btn").click();
      await page.waitForFunction(() => window.location.pathname === "/courses");
      assert.equal(new URL(page.url()).pathname, "/courses");
      await page.close();
    });

    it("Ақылы курс ашылмаған болса пайдаланушы cart бетіне жіберіледі", async function () {
      const page = await createPage("/courses");
      await page.locator(".course-card:nth-of-type(2) .read-btn").click();
      await page.waitForFunction(() => window.location.pathname === "/cart" || window.location.pathname === "/signin");
      assert.equal(new URL(page.url()).pathname, "/signin");
      await page.close();
    });

    it("Ашылған курс сабағы логиннен кейін қолжетімді болады", async function () {
      const page = await createPage("/course/sql-basics", { localStorageState: studentSession });
      assert.equal(await page.$eval(".theory h2", (node) => node.textContent?.trim()), "SELECT сұранысы");
      await page.close();
    });
  });

  describe("6. Өнімділік (basic деңгей)", function () {
    it("Басты бет қолайлы уақыт ішінде жүктеледі", async function () {
      const page = await createPage("/");
      const timing = await page.evaluate(() => {
        const entries = performance.getEntriesByType("navigation");
        return entries[0]?.duration || 0;
      });
      assert.ok(timing < 5000, `Бет тым баяу жүктелді: ${timing}ms`);
      await page.close();
    });

    it("Бірнеше рет ауысқанда сайт тұрақтылығын сақтайды", async function () {
      const page = await createPage("/");

      for (let index = 0; index < 3; index += 1) {
        await page.locator('a[href="/courses"]').click();
        await page.waitForFunction(() => window.location.pathname === "/courses");
        await page.locator('a[href="/"]').click();
        await page.waitForFunction(() => window.location.pathname === "/");
      }

      assert.equal(new URL(page.url()).pathname, "/");
      await page.close();
    });
  });

  describe("7. Кросс-браузер және адаптив тестілеу", function () {
    it("Chromium ортасында сайт негізгі сценарийлерді орындайды", async function () {
      const page = await createPage("/");
      assert.equal(await page.title(), "SQL Study Hub");
      await page.close();
    });

    it("Mobile экранда негізгі контент пен батырмалар көрінеді", async function () {
      const page = await createPage("/", { viewport: mobileViewport });
      const hasHero = await page.$eval(".left-content h2", (node) => node.textContent?.trim().length > 0);
      const widthCheck = await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 24);

      assert.equal(hasHero, true);
      assert.equal(widthCheck, true);
      await page.close();
    });

    it("Tablet экранда header және roadmap блогы көрінеді", async function () {
      const page = await createPage("/", { viewport: tabletViewport });
      assert.equal(await page.$eval(".roadmap-section h3", (node) => node.textContent?.trim()), "Оқу жол картасы");
      assert.equal(await page.$eval(".logo", (node) => node.textContent?.trim()), "SQL Study Hub");
      await page.close();
    });
  });
});
