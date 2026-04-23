(function initTheme() {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
})();

function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.textContent = next === 'dark' ? '☀️ Жарық' : '🌙 Қараңғы';
}

function showNotification(message, type = 'success') {
    const container = document.getElementById('toastContainer') || createToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${message}</span><button onclick="this.parentElement.remove()">✕</button>`;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 3500);
}

function createToastContainer() {
    const div = document.createElement('div');
    div.id = 'toastContainer';
    div.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(div);
    return div;
}

window.addEventListener('scroll', () => {
    const btn = document.getElementById('scrollTop');
    if (btn) btn.style.display = window.scrollY > 300 ? 'flex' : 'none';
});

function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateField(id, rule, errorMsg) {
    const el = document.getElementById(id);
    if (!el) return true;
    const val = el.value.trim();
    const errEl = document.getElementById(id + 'Error');
    const ok = rule(val);
    el.style.borderColor = ok ? 'var(--success, #22c55e)' : 'var(--danger, #ef4444)';
    if (errEl) { errEl.textContent = ok ? '' : errorMsg; errEl.style.display = ok ? 'none' : 'block'; }
    return ok;
}

function validateSignUp() {
    const checks = [
        validateField('username', v => v.length >= 2, 'Аты-жөні кемінде 2 символ болуы керек'),
        validateField('phone',    v => /^\d{11}$/.test(v), 'Телефон: тек 11 сан (мысалы: 77001234567)'),
        validateField('email',    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email форматы дұрыс емес'),
        validateField('password', v => v.length >= 6 && /\d/.test(v), 'Кемінде 6 символ және 1 сан болуы керек'),
    ];
    return checks.every(Boolean);
}

function validateSignIn() {
    const checks = [
        validateField('username', v => v.length >= 1, 'Пайдаланушы атын енгізіңіз'),
        validateField('password', v => v.length >= 1, 'Құпия сөзді енгізіңіз'),
    ];
    return checks.every(Boolean);
}

function togglePassword(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;
    el.type = el.type === 'password' ? 'text' : 'password';
    const btn = el.nextElementSibling;
    if (btn) btn.textContent = el.type === 'password' ? '👁️' : '🙈';
}

function signUp() {
    if (!validateSignUp()) {
        showNotification('Деректерді дұрыс толтырыңыз', 'error');
        return;
    }
    const username = document.getElementById('username').value.trim();
    const phone    = document.getElementById('phone')?.value.trim() || '';
    const email    = document.getElementById('email')?.value.trim() || '';
    const password = document.getElementById('password').value.trim();

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    if (users.find(u => u.username === username)) {
        showNotification('Бұл пайдаланушы аты бос емес!', 'error');
        return;
    }

    users.push({ username, phone, email, password, registered: new Date().toISOString() });
    localStorage.setItem('users', JSON.stringify(users));
    showNotification('Сәтті тіркелдіңіз! Кіруіңізге болады.', 'success');
    setTimeout(() => window.location.href = 'signIn.html', 1500);
}

function signIn() {
    if (!validateSignIn()) return;
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        showNotification('Пайдаланушы аты немесе құпия сөз қате!', 'error');
        return;
    }
    localStorage.setItem('currentUser', username);
    showNotification(`Қош келдіңіз, ${username}!`, 'success');
    setTimeout(() => window.location.href = 'index.html', 1000);
}

function logout() {
    localStorage.removeItem('currentUser');
    showNotification('Шықтыңыз', 'info');
    setTimeout(() => window.location.href = '../signIn.html', 800);
}

function requireAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
        alert('Пайдаланушы анықталмады. Қайта кіруіңізді сұраймыз.');
        window.location.href = 'signIn.html';
    }
    return currentUser;
}

const coursesData = [
    { id: 1, title: 'MySQL Кіріспе', category: 'database', price: 0, level: 'Бастауыш', desc: 'MySQL негіздері, орнату қадамдары және алғашқы деректер қорын құру.', likes: 12, url: 'course1.html' },
    { id: 2, title: 'MySQL Орнату', category: 'database', price: 0, level: 'Бастауыш', desc: 'Серверді орнату, қауіпсіздік баптаулары және қызметті басқару.', likes: 8, url: 'course2.html' },
    { id: 3, title: 'SELECT & Сұраулар', category: 'database', price: 500, level: 'Орта', desc: 'Деректерді таңдау, сүзу және WHERE операторын қолдану.', likes: 20, url: 'course3.html' },
    { id: 4, title: 'JOIN операциялары', category: 'database', price: 500, level: 'Орта', desc: 'Кестелерді біріктіру (INNER, LEFT, RIGHT JOIN) негіздері.', likes: 15, url: 'course4.html' },
    { id: 5, title: 'Database Design', category: 'database', price: 1000, level: 'Күрделі', desc: 'Деректер қорын жобалау, нормалдау принциптері және байланыстар.', likes: 7, url: 'course5.html' },
    { id: 6, title: 'Performance Tuning', category: 'advanced', price: 1000, level: 'Күрделі', desc: 'Өнімділікті арттыру, индекстермен жұмыс және EXPLAIN.', likes: 9, url: 'course6.html' },
];

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
let currentFilter = 'all';
let currentSort = 'default';
let searchQuery = '';

function renderCourses() {
    const container = document.getElementById('courseGrid');
    if (!container) return;

    let filtered = coursesData.filter(c => {
        const matchCat   = currentFilter === 'all' || c.category === currentFilter;
        const matchSearch = c.title.toLowerCase().includes(searchQuery) ||
                            c.desc.toLowerCase().includes(searchQuery);
        return matchCat && matchSearch;
    });

    if (currentSort === 'price-asc')  filtered.sort((a, b) => a.price - b.price);
    if (currentSort === 'price-desc') filtered.sort((a, b) => b.price - a.price);
    if (currentSort === 'likes')      filtered.sort((a, b) => b.likes - a.likes);

    container.innerHTML = filtered.length ? filtered.map(c => `
        <div class="course-card">
            <div class="card-content">
                <div class="card-badge">${c.level}</div>
                <h3>${c.title}</h3>
                <p>${c.desc}</p>
            </div>
            
            <div class="card-footer">
                <span class="price">${c.price === 0 ? 'Тегін' : c.price + ' ₸'}</span>
                <div class="card-actions">
                    <button class="btn-like ${favorites.includes(c.id) ? 'liked' : ''}"
                        onclick="toggleFavorite(${c.id})">
                        ${favorites.includes(c.id) ? '❤️' : '🤍'} ${c.likes + (favorites.includes(c.id) ? 1 : 0)}
                    </button>

                    <button class="btn-add ${cart.includes(c.id) ? 'in-cart' : ''}"
                        onclick="toggleCart(${c.id})">
                        ${cart.includes(c.id) ? 'Себетте' : 'Себетке салу'}
                    </button>

                    <button class="btn-go" onclick="openCourse(${c.id})">
                        Оқу ➔
                    </button>
                </div>
            </div>
        </div>`) .join('') : '<p class="no-results">Нәтиже табылмады</p>';
}

function openCourse(id) {
    const course = coursesData.find(c => c.id === id);
    if (course) {
        window.location.href = `courses/${course.url}`;
    }
}

function handleSearch(e) {
    searchQuery = e.target.value.toLowerCase().trim();
    renderCourses();
}

function filterCourses(cat) {
    currentFilter = cat;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === cat));
    renderCourses();
}

function sortCourses(val) {
    currentSort = val;
    renderCourses();
}

function toggleFavorite(id) {
    const idx = favorites.indexOf(id);
    if (idx === -1) { favorites.push(id); showNotification('Таңдаулыларға қосылды'); }
    else            { favorites.splice(idx, 1); showNotification('Таңдаулылардан алынды'); }
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderCourses();
}

function toggleCart(id) {
    const idx = cart.indexOf(id);
    if (idx === -1) { cart.push(id); showNotification('Себетке қосылды 🛒'); }
    else            { cart.splice(idx, 1); showNotification('Себеттен алынды'); }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartSummary();
    renderCourses();
}

function updateCartSummary() {
    const total = cart.reduce((sum, id) => {
        const c = coursesData.find(x => x.id === id);
        return sum + (c ? c.price : 0);
    }, 0);
    const el = document.getElementById('cartTotal');
    if (el) el.textContent = `Себет: ${cart.length} курс | ${total} ₸`;
}

function saveProgress(courseId, step) {
    const progress = JSON.parse(localStorage.getItem('progress') || '{}');
    progress[courseId] = step;
    localStorage.setItem('progress', JSON.stringify(progress));
    showNotification(`Прогресс сақталды: ${step}-қадам`);
    updateProgressUI(courseId, step);
}

function loadProgress(courseId) {
    const progress = JSON.parse(localStorage.getItem('progress') || '{}');
    return progress[courseId] || 0;
}

function updateProgressUI(courseId, step) {
    const bar = document.getElementById(`progress-${courseId}`);
    const totalSteps = 5;
    if (bar) {
        const pct = Math.round((step / totalSteps) * 100);
        bar.style.width = pct + '%';
        bar.setAttribute('aria-valuenow', pct);
        bar.textContent = pct + '%';
    }
}

function openTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const tab = document.getElementById(tabId);
    if (tab) tab.classList.add('active');
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    if (btn) btn.classList.add('active');
}

function toggleAccordion(el) {
    const content = el.nextElementSibling;
    const isOpen  = content.style.maxHeight;
    document.querySelectorAll('.accordion-body').forEach(b => b.style.maxHeight = null);
    document.querySelectorAll('.accordion-btn').forEach(b => b.classList.remove('open'));
    if (!isOpen) {
        content.style.maxHeight = content.scrollHeight + 'px';
        el.classList.add('open');
    }
}

function showSpinner(show = true) {
    const s = document.getElementById('spinner');
    if (s) s.style.display = show ? 'flex' : 'none';
}

function loadWithSpinner(fn, delay = 800) {
    showSpinner(true);
    setTimeout(() => { fn(); showSpinner(false); }, delay);
}

let currentStep = 1;
const totalSteps = 3;

function nextStep() {
    if (currentStep >= totalSteps) return;
    if (!validateCurrentStep()) return;
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep++;
    document.getElementById(`step${currentStep}`).classList.add('active');
    updateStepIndicator();
}

function prevStep() {
    if (currentStep <= 1) return;
    document.getElementById(`step${currentStep}`).classList.remove('active');
    currentStep--;
    document.getElementById(`step${currentStep}`).classList.add('active');
    updateStepIndicator();
}

function updateStepIndicator() {
    document.querySelectorAll('.step-indicator .step').forEach((s, i) => {
        s.classList.toggle('active',    i + 1 === currentStep);
        s.classList.toggle('completed', i + 1 < currentStep);
    });
    const bar = document.getElementById('stepProgress');
    if (bar) bar.style.width = ((currentStep - 1) / (totalSteps - 1) * 100) + '%';
}

function validateCurrentStep() {
    if (currentStep === 1) {
        return validateField('username', v => v.length >= 2, 'Аты-жөні кемінде 2 символ') &&
               validateField('phone',    v => /^\d{11}$/.test(v), 'Телефон: 11 сан');
    }
    if (currentStep === 2) {
        return validateField('email',    v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email форматы дұрыс емес') &&
               validateField('password', v => v.length >= 6 && /\d/.test(v), 'Кемінде 6 символ және 1 сан');
    }
    return true;
}

document.addEventListener('DOMContentLoaded', () => {
    const theme = localStorage.getItem('theme') || 'light';
    const themeBtn = document.getElementById('themeToggle');
    if (themeBtn) themeBtn.textContent = theme === 'dark' ? '☀️ Жарық' : '🌙 Қараңғы';

    if (document.getElementById('courseGrid')) {
        loadWithSpinner(renderCourses);
        updateCartSummary();
    }

    updateStepIndicator();
});
