let data = JSON.parse(localStorage.getItem('adminData')) || {
    users:   ['Пайдаланушы 1', 'Пайдаланушы 2', 'Пайдаланушы 3'],
    courses: ['Курс 1', 'Курс 2', 'Курс 3']
};

function saveData() {
    localStorage.setItem('adminData', JSON.stringify(data));
    render();
    showNotification('Деректер сақталды');
}

function render() {
    const userList    = document.getElementById('user-list');
    const courseList  = document.getElementById('course-list');
    const statUsers   = document.getElementById('stat-users');
    const statCourses = document.getElementById('stat-courses');

    if (userList) {
        userList.innerHTML = '';
        data.users.forEach((user, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${user}
                <button onclick="editItem('users', ${index})">Өзгерту</button>
                <button onclick="deleteItem('users', ${index})" style="color:red">Жою</button>`;
            userList.appendChild(li);
        });
    }

    if (courseList) {
        courseList.innerHTML = '';
        data.courses.forEach((course, index) => {
            const li = document.createElement('li');
            li.innerHTML = `${course}
                <button onclick="editItem('courses', ${index})">Өзгерту</button>
                <button onclick="deleteItem('courses', ${index})" style="color:red">Жою</button>`;
            courseList.appendChild(li);
        });
    }

    if (statUsers)   statUsers.innerText   = data.users.length;
    if (statCourses) statCourses.innerText = data.courses.length;
}

function deleteItem(type, index) {
    if (confirm('Шынымен жойғыңыз келе ме?')) {
        data[type].splice(index, 1);
        saveData();
    }
}

function editItem(type, index) {
    const newValue = prompt('Жаңа мәнді енгізіңіз:', data[type][index]);
    if (newValue !== null && newValue.trim() !== '') {
        data[type][index] = newValue.trim();
        saveData();
    }
}

function addItem(type) {
    const newValue = prompt(type === 'users' ? 'Жаңа пайдаланушы:' : 'Жаңа курс:');
    if (newValue && newValue.trim()) {
        data[type].push(newValue.trim());
        saveData();
    }
}

function exportToExcel() {
    const table = document.createElement('table');

    const headerRow = document.createElement('tr');
    ['Пайдаланушылар', 'Курстар'].forEach(text => {
        const th = document.createElement('th');
        th.innerText = text;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    const maxLength = Math.max(data.users.length, data.courses.length);
    for (let i = 0; i < maxLength; i++) {
        const row = document.createElement('tr');
        [data.users[i] || '', data.courses[i] || ''].forEach(text => {
            const td = document.createElement('td');
            td.innerText = text;
            row.appendChild(td);
        });
        table.appendChild(row);
    }

    const html  = table.outerHTML;
    const blob  = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url   = URL.createObjectURL(blob);
    const a     = document.createElement('a');
    a.href      = url;
    a.download  = 'admin_data.xls';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Excel файлы жүктелді');
}

function showNotification(message, type = 'success') {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.style.cssText = 'position:fixed;top:20px;right:20px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = 'background:#22c55e;color:#fff;padding:10px 16px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:14px;';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 3000);
}

render();