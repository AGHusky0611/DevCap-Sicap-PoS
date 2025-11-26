import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDP_TDz3lPQUoNg-I-1JFUokrVTTthhc58",
    authDomain: "devcap-pos-sicap.firebaseapp.com",
    projectId: "devcap-pos-sicap",
    storageBucket: "devcap-pos-sicap.appspot.com",
    messagingSenderId: "303088109012",
    appId: "1:303088109012:web:5a97e12adcfa6b9285c241"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const addProductForm = document.getElementById('add-product-form');
const productListEl = document.getElementById('admin-product-list');

// Render products on the admin page
async function renderAdminProducts() {
    productListEl.innerHTML = 'Loading products...';
    const productsCol = collection(db, 'products');
    const productSnapshot = await getDocs(productsCol);
    productListEl.innerHTML = ''; // Clear loading message
    
    productSnapshot.forEach(doc => {
        const product = doc.data();
        const productEl = document.createElement('div');
        productEl.className = 'admin-product-row';
        productEl.dataset.id = doc.id;
        productEl.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" class="admin-product-image">
            <span class="admin-product-name">${product.name}</span>
            <span class="admin-product-price">₱${Number(product.price).toFixed(2)}</span>
            <button class="remove-product-btn">Remove</button>
        `;
        productListEl.appendChild(productEl);
    });
}

// Handle adding a new product
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newProduct = {
        name: document.getElementById('product-name-input').value.trim(),
        price: Number(document.getElementById('product-price-input').value),
        imageUrl: document.getElementById('product-image-input').value.trim()
    };

    if (!newProduct.name || !newProduct.price || !newProduct.imageUrl) {
        alert("Please fill out all fields.");
        return;
    }

    try {
        await addDoc(collection(db, 'products'), newProduct);
        addProductForm.reset();
        await renderAdminProducts();
    } catch (error) {
        console.error("Error adding product: ", error);
        alert("Could not add product.");
    }
});

// Handle removing a product (using event delegation)
productListEl.addEventListener('click', async (e) => {
    if (e.target.classList.contains('remove-product-btn')) {
        const productRow = e.target.closest('.admin-product-row');
        const productId = productRow.dataset.id;
        const productName = productRow.querySelector('.admin-product-name').innerText;
        
        if (confirm(`Are you sure you want to remove ${productName}?`)) {
            try {
                await deleteDoc(doc(db, "products", productId));
                await renderAdminProducts();
            } catch (error) {
                console.error("Error removing product: ", error);
                alert("Could not remove product.");
            }
        }
    }
});

// Initial load
renderAdminProducts();