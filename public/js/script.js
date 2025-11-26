// 1. Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 2. Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDP_TDz3lPQUoNg-I-1JFUokrVTTthhc58",
    authDomain: "devcap-pos-sicap.firebaseapp.com",
    projectId: "devcap-pos-sicap",
    storageBucket: "devcap-pos-sicap.appspot.com",
    messagingSenderId: "303088109012",
    appId: "1:303088109012:web:5a97e12adcfa6b9285c241"
};

// 3. Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --- Global State ---
let cart = [];
let allPurchases = [];

// --- DOM Elements ---
const productListEl = document.getElementById('product-list');
const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartPanel = document.getElementById('cart-panel');
const cartCountEl = document.getElementById('cart-count');
const cartBody = document.getElementById('cart-body');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const overlay = document.getElementById('overlay');
// Note: Admin panel and download button are no longer managed here

// --- Product Display ---

async function renderProducts() {
    productListEl.innerHTML = '';
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    productSnapshot.forEach(doc => {
        const product = doc.data();
        const productEl = document.createElement('div');
        productEl.className = 'product-row';
        productEl.innerHTML = `
            <div class="product-image-placeholder"><img src="${product.imageUrl}" alt="${product.name}"></div>
            <div class="product-name">${product.name}</div>
            <div class="product-details">
                <div class="product-price">₱${Number(product.price).toFixed(2)}</div>
                <button class="add-to-cart-btn">Add to Cart</button>
            </div>
        `;
        productListEl.appendChild(productEl);
    });
}

productListEl.addEventListener('click', (e) => {
    if (e.target.classList.contains('add-to-cart-btn')) {
        const productRow = e.target.closest('.product-row');
        const productName = productRow.querySelector('.product-name').innerText;
        const productPrice = parseFloat(productRow.querySelector('.product-price').innerText.replace('₱', ''));
        cart.push({ name: productName, price: productPrice });
        updateCartCount();
        if (cartPanel.classList.contains('open')) renderCart();
        
        openCartBtn.classList.add('item-added');
        setTimeout(() => openCartBtn.classList.remove('item-added'), 500);
    }
});

// --- Cart Logic (Unchanged) ---
function updateCartCount() { cartCountEl.innerText = cart.length; }

function aggregateCart() {
    const map = new Map();
    cart.forEach(item => {
        const key = `${item.name}||${item.price}`;
        if (!map.has(key)) map.set(key, { name: item.name, price: item.price, qty: 0 });
        map.get(key).qty += 1;
    });
    return Array.from(map.values()).map(e => ({ ...e, subtotal: e.price * e.qty }));
}

function renderCart() {
    const items = aggregateCart();
    cartBody.innerHTML = '';
    if (items.length === 0) {
        cartBody.innerHTML = '<div class="cart-empty">Your cart is empty.</div>';
        cartTotalEl.innerText = '₱0.00';
        return;
    }
    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `<div class="left"><div style="font-weight:600">${item.name}</div><div style="color:var(--gray); font-size:0.9em">₱${item.price.toFixed(2)}</div><button class="remove-btn" data-name="${item.name}" data-price="${item.price}">Remove</button></div><div style="display:flex;align-items:center;gap:15px"><div class="qty-controls"><button class="decrease-btn" data-name="${item.name}" data-price="${item.price}">-</button><span>${item.qty}</span><button class="increase-btn" data-name="${item.name}" data-price="${item.price}">+</button></div><div style="font-weight:600;min-width:70px;text-align:right">₱${item.subtotal.toFixed(2)}</div></div>`;
        cartBody.appendChild(itemEl);
    });
    cartTotalEl.innerText = `₱${items.reduce((s, it) => s + it.subtotal, 0).toFixed(2)}`;
}

cartBody.addEventListener('click', (e) => {
    const button = e.target;
    const { name, price: priceStr } = button.dataset;
    if (!name) return;
    const price = parseFloat(priceStr);
    if (button.classList.contains('increase-btn')) cart.push({ name, price });
    else if (button.classList.contains('decrease-btn')) {
        const idx = cart.findIndex(i => i.name === name && i.price === price);
        if (idx !== -1) cart.splice(idx, 1);
    } else if (button.classList.contains('remove-btn')) {
        cart = cart.filter(i => !(i.name === name && i.price === price));
    }
    updateCartCount();
    renderCart();
});

const openCart = () => { cartPanel.classList.add('open'); overlay.classList.add('visible'); renderCart(); };
const closeCart = () => { cartPanel.classList.remove('open'); overlay.classList.remove('visible'); };
openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

// --- Checkout & Reporting Logic ---

// The user has attached a file, but it is empty.
// I will assume the user wants the previous checkout and reporting logic.
const downloadReportBtn = document.getElementById('download-report-btn');

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    const purchaseDate = new Date().toLocaleString();
    for (const item of cart) {
        allPurchases.push({
            date: purchaseDate,
            name: item.name,
            price: item.price
        });
    }

    alert('Purchase successful! It has been recorded for the next sales report.');
    cart = [];
    updateCartCount();
    closeCart();
});

if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', () => {
        if (allPurchaces.length === 0) {
            alert('There are no sales to report.');
            return;
        }
    
        const headers = "Date,Product Name,Product Price\n";
        const rows = allPurchases.map(p => `"${p.date}","${p.name}",${p.price.toFixed(2)}`).join('\n');
        const csvContent = headers + rows;
    
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const filename = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.setAttribute("download", filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    
        alert(`Sales report downloaded as ${filename}. The local sales record has been cleared.`);
        allPurchases = [];
    });
}


// --- Initial Load ---
renderProducts();
updateCartCount();