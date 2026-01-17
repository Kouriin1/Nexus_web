// ================= CONFIGURACIÓN Y DATOS =================

// Menú del Restaurante
const MENU_ITEMS = [
    { id: 1, name: "Hamburguesa Nexus", price: 12.00, category: "Principales" },
    { id: 2, name: "Pizza Margarita", price: 10.50, category: "Principales" },
    { id: 3, name: "Ensalada César", price: 9.00, category: "Entradas" },
    { id: 4, name: "Sopa del Día", price: 6.50, category: "Entradas" },
    { id: 11, name: "Tacos (3 Unid)", price: 8.00, category: "Principales" }, // Agregado para el demo
    { id: 5, name: "Papas Fritas", price: 4.00, category: "Acompañantes" },
    { id: 6, name: "Refresco", price: 2.50, category: "Bebidas" },
    { id: 7, name: "Agua Mineral", price: 1.50, category: "Bebidas" },
    { id: 8, name: "Café Americano", price: 3.00, category: "Bebidas" },
    { id: 9, name: "Cheesecake", price: 5.50, category: "Postres" },
    { id: 10, name: "Brownie con Helado", price: 6.00, category: "Postres" }
];

// Datos de prueba iniciales para la demo
const DEMO_ORDERS = [
    {
        id: 1715001,
        table: "5",
        items: [
            { name: "Hamburguesa Nexus", price: 12.00 },
            { name: "Hamburguesa Nexus", price: 12.00 }
        ],
        total: 24.00,
        status: 'pending',
        timestamp: '12:30 PM'
    },
    {
        id: 1715002,
        table: "2",
        items: [
            { name: "Pizza Margarita", price: 10.50 },
            { name: "Refresco", price: 2.50 }
        ],
        total: 13.00,
        status: 'ready',
        timestamp: '12:35 PM'
    },
    {
        id: 1715003,
        table: "8",
        items: [
            { name: "Tacos (3 Unid)", price: 8.00 },
            { name: "Tacos (3 Unid)", price: 8.00 },
            { name: "Tacos (3 Unid)", price: 8.00 }
        ],
        total: 24.00,
        status: 'pending',
        timestamp: '12:40 PM'
    }
];

// Estado Global
// Si no hay datos en localStorage, cargamos los datos de prueba (DEMO)
let savedOrders = localStorage.getItem('nexus_orders');
let orders = savedOrders ? JSON.parse(savedOrders) : DEMO_ORDERS;

// Si el array estaba vacío (ej. usuario borró todo antes), recargamos demo para esta sesión
if (orders.length === 0 && !savedOrders) {
    orders = DEMO_ORDERS;
}

let currentWaiterOrder = [];

// ================= INICIALIZACIÓN =================

document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    updateDashboardCounts();
    renderKitchenView();
    renderCashierView();
});

// ================= NAVEGACIÓN =================

function switchView(viewName) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById(`${viewName}-view`).classList.add('active');
    
    const buttons = document.querySelectorAll('.nav-btn');
    if (viewName === 'waiter') buttons[0].classList.add('active');
    else if (viewName === 'kitchen') {
        buttons[1].classList.add('active');
        renderKitchenView();
    }
    else if (viewName === 'cashier') {
        buttons[2].classList.add('active');
        renderCashierView();
    }
}

// ================= LÓGICA: VISTA MESONERO =================

function initMenu() {
    const categoriesContainer = document.getElementById('categories-container');
    const categories = [...new Set(MENU_ITEMS.map(item => item.category))];
    
    categoriesContainer.innerHTML = `<button class="category-btn active" onclick="filterMenu('all')">Todos</button>`;
    categories.forEach(cat => {
        categoriesContainer.innerHTML += `<button class="category-btn" onclick="filterMenu('${cat}')">${cat}</button>`;
    });

    renderMenuItems(MENU_ITEMS);
}

function filterMenu(category) {
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.toggle('active', btn.textContent === category || (category === 'all' && btn.textContent === 'Todos'));
    });

    const filtered = category === 'all' 
        ? MENU_ITEMS 
        : MENU_ITEMS.filter(item => item.category === category);
    
    renderMenuItems(filtered);
}

function renderMenuItems(items) {
    const container = document.getElementById('menu-items-container');
    container.innerHTML = items.map(item => `
        <div class="menu-item-card" onclick="addToOrder(${item.id})">
            <span class="item-name">${item.name}</span>
            <span class="item-price">$${item.price.toFixed(2)}</span>
        </div>
    `).join('');
}

function addToOrder(itemId) {
    const item = MENU_ITEMS.find(i => i.id === itemId);
    currentWaiterOrder.push(item);
    renderCurrentOrder();
}

function removeFromOrder(index) {
    currentWaiterOrder.splice(index, 1);
    renderCurrentOrder();
}

function renderCurrentOrder() {
    const list = document.getElementById('current-order-list');
    const totalEl = document.getElementById('current-order-total');
    const tableNum = document.getElementById('table-select').value;
    const summaryTableNum = document.getElementById('summary-table-num');
    
    summaryTableNum.textContent = tableNum;

    if (currentWaiterOrder.length === 0) {
        list.innerHTML = '<li class="empty-msg">No hay items seleccionados</li>';
        totalEl.textContent = '0.00';
        return;
    }

    list.innerHTML = currentWaiterOrder.map((item, index) => `
        <li class="order-item-li">
            <span>${item.name}</span>
            <div style="display:flex; align-items:center;">
                <span>$${item.price.toFixed(2)}</span>
                <span class="remove-item-btn" onclick="removeFromOrder(${index})">×</span>
            </div>
        </li>
    `).join('');

    const total = currentWaiterOrder.reduce((sum, item) => sum + item.price, 0);
    totalEl.textContent = total.toFixed(2);
}

function clearCurrentOrder() {
    currentWaiterOrder = [];
    renderCurrentOrder();
}

function sendToKitchen() {
    if (currentWaiterOrder.length === 0) {
        alert("La orden está vacía. Agregue items del menú.");
        return;
    }

    const tableNum = document.getElementById('table-select').value;
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const newOrder = {
        id: Date.now(),
        table: tableNum,
        items: [...currentWaiterOrder],
        total: currentWaiterOrder.reduce((sum, item) => sum + item.price, 0),
        status: 'pending',
        timestamp: timeString
    };

    orders.push(newOrder);
    saveOrders();
    
    clearCurrentOrder();
    
    // Feedback visual simple
    const btn = document.querySelector('.btn-primary');
    const originalText = btn.textContent;
    btn.textContent = "¡ENVIADO!";
    btn.style.backgroundColor = "var(--color-success)";
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = "";
    }, 1500);
    
    updateDashboardCounts();
}

// ================= LÓGICA: VISTA COCINA (KDS) =================

function renderKitchenView() {
    const container = document.getElementById('kitchen-orders-container');
    const pendingOrders = orders.filter(o => o.status === 'pending');

    document.getElementById('pending-count').textContent = pendingOrders.length;

    if (pendingOrders.length === 0) {
        container.innerHTML = '<div class="empty-state" style="grid-column: 1/-1;">No hay pedidos pendientes en cocina.</div>';
        return;
    }

    container.innerHTML = pendingOrders.map(order => `
        <div class="kitchen-card">
            <div class="kitchen-card-content">
                <div class="kitchen-card-header">
                    <span class="kitchen-table-num">Mesa ${order.table}</span>
                    <span class="kitchen-time">${order.timestamp}</span>
                </div>
                <ul class="kitchen-items-list">
                    ${order.items.map(item => `<li>${item.name}</li>`).join('')}
                </ul>
                <button class="btn-ready" onclick="markOrderReady(${order.id})">MARCAR COMO LISTO</button>
            </div>
        </div>
    `).join('');
}

function markOrderReady(orderId) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        orders[orderIndex].status = 'ready';
        saveOrders();
        renderKitchenView();
        updateDashboardCounts();
    }
}

// ================= LÓGICA: VISTA CAJA =================

function renderCashierView() {
    const tbody = document.getElementById('cashier-orders-list');
    const readyOrders = orders.filter(o => o.status === 'ready');
    const emptyMsg = document.getElementById('cashier-empty');

    if (readyOrders.length === 0) {
        tbody.innerHTML = '';
        emptyMsg.style.display = 'block';
        return;
    } else {
        emptyMsg.style.display = 'none';
    }

    tbody.innerHTML = readyOrders.map(order => `
        <tr>
            <td style="font-weight:600; color:var(--color-text-light);">#${order.id.toString().slice(-4)}</td>
            <td style="font-weight:700; color:var(--color-primary);">Mesa ${order.table}</td>
            <td>${order.items.length} items (${order.items[0].name}...)</td>
            <td style="font-weight:700;">$${order.total.toFixed(2)}</td>
            <td><span class="status-badge status-ready">LISTO</span></td>
            <td>
                <button class="btn-pay" onclick="processPayment(${order.id})">COBRAR</button>
            </td>
        </tr>
    `).join('');
}

function processPayment(orderId) {
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex > -1) {
        // En una app real, aquí abriría modal de pago
        if(confirm(`Procesar pago de $${orders[orderIndex].total.toFixed(2)}?`)) {
            orders[orderIndex].status = 'paid';
            saveOrders();
            renderCashierView();
        }
    }
}

// ================= UTILIDADES =================

function saveOrders() {
    localStorage.setItem('nexus_orders', JSON.stringify(orders));
    updateDashboardCounts();
}

function updateDashboardCounts() {
    const pending = orders.filter(o => o.status === 'pending').length;
    const countEl = document.getElementById('pending-count');
    if(countEl) countEl.textContent = pending;
}