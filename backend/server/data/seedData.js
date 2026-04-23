export const seedCourses = [
  {
    title: "SQLite Кіріспе",
    slug: "course1",
    category: "database",
    price: 0,
    level: "Бастауыш",
    description: "SQLite негіздері, файлдық база және алғашқы SQL командалары.",
    likes_count: 8,
    order_index: 0,
    lesson: {
      title: "1. SQLite-қа кіріспе",
      theory:
        "SQLite — жеңіл, серверсіз реляциялық мәліметтер қоры. Мәліметтер бір файлда сақталады, сондықтан оқу жобаларына, прототипке және шағын қосымшаларға өте ыңғайлы. SQLite-те SQL синтаксисі классикалық SQL-ге жақын, сондықтан кейін MySQL/PostgreSQL-ке көшу оңай.",
      pre_code:
        "CREATE TABLE students (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  name TEXT NOT NULL,\n  email TEXT UNIQUE\n);\n\nINSERT INTO students (name, email) VALUES ('Aruzhan', 'aruzhan@mail.kz');",
      task:
        "\"students\" кестесін құрып, кемінде 2 студент қосыңыз. Соңында барлық жазбаны SELECT арқылы көрсетіңіз.",
      required_steps: [
        "create table students",
        "insert into students",
        "select * from students",
      ],
      quiz: {
        question: "SQLite-тің басты артықшылығы қайсы?",
        options: [
          "Бөлек серверсіз жұмыс істейді",
          "Тек бұлтта ғана жұмыс істейді",
          "SQL қолдамайды",
        ],
        answerIndex: 0,
      },
      download_content:
        "1-сабақ: SQLite кіріспе\n\nҚосымша материалдар:\n1) SQLite бөлек сервер процесін қажет етпейді.\n2) База бір .db файлында сақталады.\n3) Негізгі командалар: CREATE TABLE, INSERT, SELECT.\n\nПрактика:\n- Екі студент жазбасын енгізіңіз.\n- SELECT * FROM students; сұранысын тексеріңіз.\n\nTip: PRIMARY KEY + AUTOINCREMENT жиі қолданылады.",
    },
  },
  {
    title: "Кесте құру және типтер",
    slug: "course2",
    category: "database",
    price: 0,
    level: "Бастауыш",
    description: "INTEGER, TEXT, REAL және кесте құрылымын жобалау негіздері.",
    likes_count: 6,
    order_index: 1,
    lesson: {
      title: "2. Кестелер және типтер",
      theory:
        "Кесте жобалауда өріс типін дұрыс таңдау деректер сапасына тікелей әсер етеді. SQLite-та TEXT, INTEGER, REAL сияқты негізгі типтер бар. NOT NULL, UNIQUE, DEFAULT сияқты шектеулерді қолдану қателерді азайтып, кестені сенімді етеді.",
      pre_code:
        "CREATE TABLE courses (\n  id INTEGER PRIMARY KEY AUTOINCREMENT,\n  title TEXT NOT NULL,\n  price REAL DEFAULT 0,\n  level TEXT NOT NULL\n);\n\nCREATE INDEX idx_courses_level ON courses(level);",
      task:
        "\"courses\" кестесін құрып, title, price, level өрістерін қосыңыз. level өрісі бос болмауы керек.",
      required_steps: ["create table courses", "title text", "price real", "level text"],
      quiz: {
        question: "Баға өрісіне қай тип ең қолайлы?",
        options: ["TEXT", "REAL", "BLOB"],
        answerIndex: 1,
      },
      download_content:
        "2-сабақ: Кесте құру және типтер\n\nҚосымша материалдар:\n1) INTEGER — бүтін сандар.\n2) REAL — ондық сандар (баға, рейтинг).\n3) TEXT — жолдық мәндер.\n\nПрактика:\n- NOT NULL және DEFAULT шектеулерін тексеріңіз.\n- Мүмкін болса, INDEX қосып көріңіз.\n\nTip: Қажетті минимумнан артық өріс қоспау — жақсы дизайн белгісі.",
    },
  },
  {
    title: "SELECT және WHERE",
    slug: "course3",
    category: "database",
    price: 500,
    level: "Орта",
    description: "Деректерді таңдау, сүзу және іздеу сұрауларын құру.",
    likes_count: 15,
    order_index: 2,
    lesson: {
      title: "3. SELECT негіздері",
      theory:
        "SELECT сұранысы кестеден керекті ақпаратты алуға арналған. WHERE арқылы шарт қоямыз, ORDER BY арқылы сұрыптаймыз, LIMIT арқылы нәтижені шектейміз. Бұл командалар нақты аналитикалық сұраныстардың негізі болып саналады.",
      pre_code:
        "SELECT title, price\nFROM courses\nWHERE price > 0\nORDER BY price DESC\nLIMIT 5;",
      task:
        "\"courses\" кестесінен ақылы курстарды шығарып, бағасы бойынша кеміту ретімен көрсетіңіз.",
      required_steps: ["select", "from courses", "where price > 0", "order by"],
      quiz: {
        question: "Нәтижені аздан көпке сұрыптау үшін қай кілт сөз керек?",
        options: ["ORDER BY ... ASC", "GROUP BY", "HAVING"],
        answerIndex: 0,
      },
      download_content:
        "3-сабақ: SELECT және WHERE\n\nҚосымша материалдар:\n1) WHERE — фильтрация үшін.\n2) ORDER BY — сұрыптау үшін.\n3) LIMIT — нәтижені қысқарту үшін.\n\nПрактика:\n- price > 0 және level='Орта' шарттарын бірге қолданып көріңіз.\n- Бірнеше баған таңдап шығарыңыз.\n\nTip: Сұранысты алдымен қарапайым жазып, кейін шарттарды көбейтіңіз.",
    },
  },
  {
    title: "JOIN байланыстары",
    slug: "course4",
    category: "database",
    price: 700,
    level: "Орта",
    description: "Кестелер арасындағы байланысты JOIN арқылы оқу.",
    likes_count: 18,
    order_index: 3,
    lesson: {
      title: "4. JOIN операциясы",
      theory:
        "JOIN бірнеше кестедегі мәліметтерді бір сұраныста біріктіреді. Бұл шынайы жобалардағы ең маңызды дағдылардың бірі. INNER JOIN ортақ байланысы бар жазбаларды көрсетсе, LEFT JOIN сол жақ кестедегі барлық жолды сақтайды.",
      pre_code:
        "SELECT u.full_name, c.title\nFROM enrollments e\nJOIN users u ON u.id = e.user_id\nJOIN courses c ON c.id = e.course_id\nORDER BY u.full_name;",
      task:
        "\"users\", \"enrollments\" және \"courses\" кестелерін JOIN арқылы байланыстырып, пайдаланушы аты мен курс атауын шығарыңыз.",
      required_steps: ["join users", "join courses", "on", "from enrollments"],
      quiz: {
        question: "LEFT JOIN не береді?",
        options: [
          "Тек екі кестедегі ортақ жолдарды",
          "Сол жақ кестедегі барлық жолдарды",
          "Кестедегі баған аттарын ғана",
        ],
        answerIndex: 1,
      },
      download_content:
        "4-сабақ: JOIN байланыстары\n\nҚосымша материалдар:\n1) INNER JOIN — тек сәйкес жолдар.\n2) LEFT JOIN — сол жақ кестенің барлық жолы.\n3) FOREIGN KEY дұрыс орнатылса JOIN оңайлайды.\n\nПрактика:\n- JOIN нәтижесін ORDER BY арқылы реттеңіз.\n- LEFT JOIN қолданып, жазылмаған қолданушыларды тексеріңіз.\n\nTip: JOIN логикасын алдымен қағазға сызып алу пайдалы.",
    },
  },
  {
    title: "UPDATE және DELETE",
    slug: "course5",
    category: "database",
    price: 500,
    level: "Орта",
    description: "Деректерді жаңарту және жою командаларын қауіпсіз қолдану.",
    likes_count: 10,
    order_index: 4,
    lesson: {
      title: "5. UPDATE және DELETE",
      theory:
        "UPDATE кестедегі бар жазбаларды өзгертеді, ал DELETE қажет емес жазбаларды жояды. Бұл командаларды WHERE шартынсыз қолдану қауіпті, себебі барлық жазба өзгеруі немесе жойылуы мүмкін.",
      pre_code:
        "UPDATE courses\nSET price = 1000\nWHERE id = 3;\n\nDELETE FROM courses\nWHERE id = 10;",
      task:
        "\"courses\" кестесінде бір курстың бағасын UPDATE арқылы өзгертіңіз, кейін тест жазбасын DELETE арқылы өшіріңіз.",
      required_steps: ["update courses", "set", "where", "delete from courses"],
      quiz: {
        question: "Қай команда жазбаны толық жояды?",
        options: ["UPDATE", "DELETE", "ALTER"],
        answerIndex: 1,
      },
      download_content:
        "5-сабақ: UPDATE және DELETE\n\nҚосымша материалдар:\n1) UPDATE әрдайым WHERE-пен қолданылғаны дұрыс.\n2) DELETE алдында SELECT-пен тексеру қауіпсіз.\n3) Транзакция қолдану (BEGIN/ROLLBACK) қателіктен қорғайды.\n\nПрактика:\n- Бір өрісті жаңартыңыз.\n- Тек бір нақты id бойынша жою сұранысын жазыңыз.",
    },
  },
  {
    title: "Агрегация және топтау",
    slug: "course6",
    category: "database",
    price: 900,
    level: "Күрделі",
    description: "COUNT, AVG, SUM және GROUP BY көмегімен аналитикалық сұраулар.",
    likes_count: 12,
    order_index: 5,
    lesson: {
      title: "6. GROUP BY және агрегат функциялары",
      theory:
        "Агрегат функциялары (COUNT, SUM, AVG, MIN, MAX) мәліметтерге талдау жасауға көмектеседі. GROUP BY жазбаларды топтарға бөліп, әр топ бойынша есеп шығаруға мүмкіндік береді.",
      pre_code:
        "SELECT level, COUNT(*) AS total_courses, AVG(price) AS avg_price\nFROM courses\nGROUP BY level\nORDER BY total_courses DESC;",
      task:
        "\"courses\" кестесін деңгейі бойынша топтап, әр деңгей үшін курстар санын COUNT арқылы шығарыңыз.",
      required_steps: ["select level", "count(*)", "from courses", "group by level"],
      quiz: {
        question: "Әр топ бойынша санау үшін қай функция қолданылады?",
        options: ["COUNT()", "SUM()", "LOWER()"],
        answerIndex: 0,
      },
      download_content:
        "6-сабақ: Агрегация және топтау\n\nҚосымша материалдар:\n1) COUNT() — жазба санын есептейді.\n2) AVG() — орташа мән береді.\n3) GROUP BY — топтап есептеу үшін.\n\nПрактика:\n- level бойынша COUNT шығарыңыз.\n- category бойынша AVG(price) есептеңіз.\n\nTip: GROUP BY кезінде SELECT ішіндегі бағандарға назар аударыңыз.",
    },
  },
];
