// --- Theme Toggle Logic ---
const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');

// Function to apply the theme
const applyTheme = (theme) => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    if (themeToggleCheckbox) {
        themeToggleCheckbox.checked = theme === 'dark';
    }
};

// Add change listener to the checkbox
if (themeToggleCheckbox) {
    themeToggleCheckbox.addEventListener('change', () => {
        const newTheme = themeToggleCheckbox.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
}

// Apply the saved theme on initial load
const savedTheme = localStorage.getItem('theme') || 'light';
applyTheme(savedTheme);


// 1. Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
const officerNameInput = document.getElementById('officer-name');
const officerError = document.getElementById('officer-error');


// --- Product Display ---

async function renderProducts() {
    productListEl.innerHTML = '';
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    productSnapshot.forEach(doc => {
        const product = doc.data();
        const productEl = document.createElement('div');
        productEl.className = 'product-card'; // Using new class for styling
        productEl.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
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
        const button = e.target;
        
        // Prevent re-clicking while in "Added" state
        if (button.classList.contains('added')) {
            return;
        }

        const productCard = button.closest('.product-card');
        const productName = productCard.querySelector('.product-name').innerText;
        const productPrice = parseFloat(productCard.querySelector('.product-price').innerText.replace('₱', ''));
        
        // Add item to cart
        cart.push({ name: productName, price: productPrice });
        updateCartCount();
        if (cartPanel.getAttribute('aria-hidden') === 'false') {
            renderCart();
        }
        
        // --- NEW ANIMATION LOGIC ---

        // 1. Create the feedback element
        const feedbackEl = document.createElement('div');
        feedbackEl.innerText = 'Added!';
        feedbackEl.className = 'added-feedback animate';

        // 2. Append it to the product details container
        const productDetails = button.closest('.product-details');
        if (productDetails) {
            productDetails.appendChild(feedbackEl);
        }

        // 3. Change button color and prevent re-clicking
        button.classList.add('added');

        // 4. Revert button and remove the feedback element after animation
        setTimeout(() => {
            button.classList.remove('added');
            if (feedbackEl) {
                feedbackEl.remove();
            }
        }, 1500);
    }
});

// --- Cart Logic ---
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
        itemEl.innerHTML = `
            <div class="item-info">
                <div class="item-name">${item.name}</div>
                <div class="item-price">₱${item.price.toFixed(2)} each</div>
            </div>
            <div class="item-controls">
                <div class="qty-controls">
                    <button class="decrease-btn" data-name="${item.name}" data-price="${item.price}">-</button>
                    <span class="qty">${item.qty}</span>
                    <button class="increase-btn" data-name="${item.name}" data-price="${item.price}">+</button>
                </div>
                <div class="item-subtotal">₱${item.subtotal.toFixed(2)}</div>
                <button class="remove-btn" title="Remove all ${item.name}" data-name="${item.name}" data-price="${item.price}">&times;</button>
            </div>
        `;
        cartBody.appendChild(itemEl);
    });
    cartTotalEl.innerText = `₱${items.reduce((s, it) => s + it.subtotal, 0).toFixed(2)}`;
}

cartBody.addEventListener('click', (e) => {
    const button = e.target;
    const { name, price: priceStr } = button.dataset;
    if (!name) return;
    const price = parseFloat(priceStr);
    if (button.classList.contains('increase-btn')) {
        cart.push({ name, price });
    } else if (button.classList.contains('decrease-btn')) {
        const idx = cart.findIndex(i => i.name === name && i.price === price);
        if (idx !== -1) cart.splice(idx, 1);
    } else if (button.classList.contains('remove-btn')) {
        cart = cart.filter(i => !(i.name === name && i.price === price));
    }
    updateCartCount();
    renderCart();
});

// Updated Cart UI functions to be more accessible
const openCart = () => {
    cartPanel.setAttribute('aria-hidden', 'false');
    overlay.classList.add('visible');
    renderCart();
    officerError.setAttribute('aria-hidden', 'true'); // Hide error on open
    setTimeout(() => officerNameInput.focus(), 300); // Focus for quick entry
};

const closeCart = () => {
    cartPanel.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('visible');
};

openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

// --- Checkout & Reporting Logic ---
checkoutBtn.addEventListener('click', async () => {
    const officerName = officerNameInput.value.trim();

    // 1. Validate Officer Name
    if (!officerName) {
        officerError.setAttribute('aria-hidden', 'false');
        officerNameInput.focus();
        return; // Stop the checkout
    }
    officerError.setAttribute('aria-hidden', 'true');

    // 2. Validate Cart
    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    // 3. Prepare sale data
    const items = aggregateCart();
    const totalAmount = items.reduce((sum, item) => sum + item.subtotal, 0);

    const saleData = {
        officerName: officerName,
        items: items, // Contains name, price, qty, subtotal
        totalAmount: totalAmount,
        createdAt: serverTimestamp() // Adds a server-side timestamp
    };

    // 4. Save the transaction to Firestore
    try {
        const salesCollection = collection(db, 'sales');
        await addDoc(salesCollection, saleData);
        
        // 5. Finalize UI
        alert(`Purchase successful for officer: ${officerName}! The transaction has been saved.`);
        cart = [];
        officerNameInput.value = ''; // Clear officer name after checkout
        updateCartCount();
        closeCart();

    } catch (error) {
        console.error("Error saving transaction: ", error);
        alert('There was an error saving the transaction. Please try again.');
    }
});


// --- Initial Load ---
renderProducts();
updateCartCount();