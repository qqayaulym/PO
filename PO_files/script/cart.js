document.addEventListener('DOMContentLoaded', () => {
    if (typeof requireAuth === "function") {
        requireAuth();
    }
    
    renderCartPage();
});

function renderCartPage() {
    const listContainer = document.getElementById('cartList');
    const totalEl = document.getElementById('totalAmount');
    
    if (!listContainer || !totalEl) return;

    const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
    
    const selectedCourses = coursesData.filter(course => cartIds.includes(course.id));

    if (selectedCourses.length === 0) {
        listContainer.innerHTML = `
            <div class="empty-cart-message">
                <p>Сіздің себетіңіз әзірге бос 😕</p>
                <br>
                <a href="courses.html" class="btn-info">Курстарды қарау</a>
            </div>`;
        totalEl.textContent = "Жалпы сома: 0 ₸";
        return;
    }

    let total = 0;
    listContainer.innerHTML = selectedCourses.map(course => {
        total += course.price;
        return `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${course.title}</h4>
                    <span class="badge">${course.level}</span>
                </div>
                <div class="cart-item-actions">
                    <span class="price">${course.price === 0 ? 'Тегін' : course.price + ' ₸'}</span>
                    <button class="btn-delete" onclick="removeFromCart(${course.id})">Өшіру</button>
                </div>
            </div>
        `;
    }).join('');

    totalEl.textContent = `Жалпы сома: ${total} ₸`;
}

function removeFromCart(id) {
    let cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
    cartIds = cartIds.filter(itemId => itemId !== id);
    localStorage.setItem('cart', JSON.stringify(cartIds));
    
    if (typeof showNotification === "function") {
        showNotification('Курс себеттен өшірілді', 'info');
    }
    
    renderCartPage();
}

function processCheckout() {
    const cartIds = JSON.parse(localStorage.getItem('cart') || '[]');
    if (cartIds.length === 0) {
        if (typeof showNotification === "function") {
            showNotification('Себет бос, сатып алатын ештеңе жоқ!', 'error');
        }
        return;
    }
    
    alert('Төлем жүйесіне бағытталуда... \nБұл оқу жобасы болғандықтан, транзакция жасалмайды.');
}
