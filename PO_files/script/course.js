function downloadLesson(format, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mysql_lesson.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

function checkAnswer(requiredSteps) {
    const input = document.getElementById('practiceInput').value.toLowerCase();
    const feedback = document.getElementById('feedback');

    if (input.trim() === '') {
        feedback.textContent = 'Ешнәрсе жазбадыңыз!';
        feedback.className = 'error';
        feedback.style.display = 'block';
        return;
    }

    const isCorrect = requiredSteps.every(step => input.includes(step.toLowerCase()));

    if (isCorrect) {
        feedback.textContent = 'Тамаша! Тапсырма сәтті орындалды!';
        feedback.className = 'success';
        showNotification('Тапсырма орындалды!', 'success');
    } else {
        feedback.textContent = 'Қате немесе командалар жетіспейді. Қайта тексеріңіз.';
        feedback.className = 'error';
    }
    feedback.style.display = 'block';
}

function resetPractice() {
    document.getElementById('practiceInput').value = '';
    const feedback = document.getElementById('feedback');
    feedback.textContent = '';
    feedback.style.display = 'none';
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
    toast.style.cssText = `background:${type === 'success' ? '#22c55e' : '#ef4444'};color:#fff;padding:10px 16px;border-radius:8px;box-shadow:0 2px 8px rgba(0,0,0,.2);font-size:14px;`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => { if (toast.parentElement) toast.remove(); }, 3000);
}

const LessonHandlers = {
    course1: {
        download: () => downloadLesson('txt', "1-сабақ: MySQL-ге кіріспе\n\nКомандалар:\n- SHOW DATABASES;\n- CREATE DATABASE name;"),
        check: () => checkAnswer(['create database university', 'students'])
    },
    course2: {
        download: () => downloadLesson('txt', "2-сабақ: Орнату\n\nКомандалар:\nsudo apt install mysql-server\nsudo systemctl start mysql"),
        check: () => checkAnswer(['apt install', 'systemctl start', 'mysql'])
    },
    course3: {
        download: () => downloadLesson('txt', "3-сабақ: SELECT негіздері\n\nSELECT name, age FROM students;"),
        check: () => checkAnswer(['select name', 'age', 'from students'])
    },
    // Қалған курстарды ЖАЛҒАСТЫРУ КЕРЕК
}; 