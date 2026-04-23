export const coursesData = [
  { id: 1, title: 'MySQL Кіріспе', category: 'database', price: 0, level: 'Бастауыш', desc: 'MySQL негіздері және орнату қадамдары.', url: 'course1', likes: 8 },
  { id: 2, title: 'MySQL Орнату', category: 'database', price: 0, level: 'Бастауыш', desc: 'Серверді баптау және қауіпсіздік.', url: 'course2', likes: 6 },
  { id: 3, title: 'SELECT негіздері', category: 'database', price: 500, level: 'Орта', desc: 'Деректерді сұрау және таңдау.', url: 'course3', likes: 15 },
  { id: 4, title: 'JOIN операциялары', category: 'database', price: 500, level: 'Орта', desc: 'Кестелерді біріктіру жолдары.', url: 'course4', likes: 18 },
  { id: 5, title: 'Database Design', category: 'database', price: 1000, level: 'Күрделі', desc: 'Деректер қорын жобалау және нормалдау.', url: 'course5', likes: 23 },
  { id: 6, title: 'Performance Tuning', category: 'database', price: 1500, level: 'Күрделі', desc: 'Оптимизация және индекстермен жұмыс.', url: 'course6', likes: 27 },
];

export const lessonData = {
  course1: {
    title: "1. Кіріспе",
    theory: "MySQL — ашық кодты реляциялық мәліметтер қоры жүйесі (RDBMS). Ол деректерді сақтау және басқару үшін қолданылады. Мұнда деректер кестелер түрінде сақталады және SQL тілі арқылы басқарылады.",
    preCode: "sudo apt update\nsudo apt upgrade\nsudo apt install mysql-server",
    commands: [
      { code: "SHOW DATABASES;", desc: "Мәліметтер қорын көру" },
      { code: "CREATE DATABASE name;", desc: "Жаңа қор құру" }
    ],
    task: "\"university\" деген қор құрып, оған \"students\" кестесін қосыңыз.",
    requiredSteps: ['create database university', 'students'],
    downloadContent: "1-сабақ: MySQL-ге кіріспе\n\nНегізгі командалар:\n- SHOW DATABASES;\n- CREATE DATABASE university;",
    next: 'course2'
  },
  course2: {
    title: "2. Орнату",
    theory: "MySQL серверін орнатқаннан кейін оның күйін тексеру және қызметті қосу маңызды. Ол үшін systemctl командалары қолданылады.",
    preCode: "sudo systemctl start mysql\nsudo systemctl status mysql",
    commands: [
      { code: "sudo apt install mysql-server", desc: "Серверді орнату" },
      { code: "sudo systemctl start mysql", desc: "Қызметті іске қосу" }
    ],
    task: "MySQL-ді орнату (install) және қызметті іске қосу (start) командаларын жазыңыз.",
    requiredSteps: ['install mysql-server', 'systemctl start mysql'],
    downloadContent: "2-сабақ: Орнату қадамдары\n\nКомандалар:\nsudo apt install mysql-server\nsudo systemctl start mysql",
    next: 'course3'
  },
  course3: {
    title: "3. SELECT негіздері",
    theory: "SELECT операторы — деректер қорындағы ең көп қолданылатын команда. Ол кестеден қажетті мәліметтерді сүзіп алуға көмектеседі.",
    preCode: "SELECT * FROM students;\nSELECT name, age FROM students WHERE age > 18;",
    commands: [
      { code: "SELECT *", desc: "Барлық бағанды таңдау" },
      { code: "WHERE", desc: "Шарт бойынша сүзу" }
    ],
    task: "\"students\" кестесінен барлық студенттердің атын (name) және жасын (age) алу үшін сұраныс жазыңыз.",
    requiredSteps: ['select name', 'age', 'from students'],
    downloadContent: "3-сабақ: SELECT операторы\n\nМысал: SELECT name FROM students;",
    next: 'course4'
  },
  course4: {
    title: "4. JOIN операциялары",
    theory: "JOIN — бірнеше кестені ортақ бағандары (мысалы, ID) арқылы біріктіру үшін қолданылады. Бұл реляциялық базалардың басты күші.",
    preCode: "SELECT students.name, courses.title \nFROM students \nINNER JOIN courses ON students.course_id = courses.id;",
    commands: [
      { code: "INNER JOIN", desc: "Ортақ мәндерді біріктіру" },
      { code: "ON", desc: "Біріктіру шарты" }
    ],
    task: "\"students\" және \"courses\" кестелерін біріктіріп, студенттердің аты мен курстарын таңдаңыз.",
    requiredSteps: ['join', 'students', 'courses', 'on'],
    downloadContent: "4-сабақ: Кестелерді біріктіру (JOIN).",
    next: 'course5'
  },
  course5: {
    title: "5. Database Design",
    theory: "Деректер қорын дұрыс жобалау (Design) — бұл деректердің қайталануын азайту және олардың тұтастығын сақтау процесі.",
    preCode: "PRIMARY KEY (ID),\nFOREIGN KEY (course_id) REFERENCES courses(id)",
    commands: [
      { code: "PRIMARY KEY", desc: "Бірегей кілт" },
      { code: "NORMALIZATION", desc: "Деректерді нормалдау" }
    ],
    task: "Деректер қорын нормалдау (normalize) және негізгі кілттерді (primary key) қолдану туралы сұраныс жазыңыз.",
    requiredSteps: ['normalize', 'primary key'],
    downloadContent: "5-сабақ: Жобалау негіздері.",
    next: 'course6'
  },
  course6: {
    title: "6. Performance Tuning",
    theory: "Үлкен деректермен жұмыс істегенде сұраныстардың жылдамдығы маңызды. Ол үшін индекстер (INDEX) және EXPLAIN командасы қолданылады.",
    preCode: "CREATE INDEX idx_name ON students(name);\nEXPLAIN SELECT * FROM students;",
    commands: [
      { code: "CREATE INDEX", desc: "Индекс құру" },
      { code: "EXPLAIN", desc: "Сұранысты талдау" }
    ],
    task: "\"students\" кестесіндегі \"name\" бағанына индекс (index) құрыңыз.",
    requiredSteps: ['create index', 'on students', 'name'],
    downloadContent: "6-сабақ: Оптимизация.",
    next: null
  }
};
