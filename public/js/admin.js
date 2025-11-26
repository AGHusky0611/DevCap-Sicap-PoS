import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// --- Theme Toggle Logic ---
const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
const applyTheme = (theme) => {
    document.body.classList.toggle('dark-mode', theme === 'dark');
    if (themeToggleCheckbox) themeToggleCheckbox.checked = theme === 'dark';
};
if (themeToggleCheckbox) {
    themeToggleCheckbox.addEventListener('change', () => {
        const newTheme = themeToggleCheckbox.checked ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    });
}
applyTheme(localStorage.getItem('theme') || 'light');

// --- Firebase Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDP_TDz3lPQUoNg-I-1JFUokrVTTthhc58",
    authDomain: "devcap-pos-sicap.firebaseapp.com",
    projectId: "devcap-pos-sicap",
    storageBucket: "devcap-pos-sicap.appspot.com",
    messagingSenderId: "303088109012",
    appId: "1:303088109012:web:5a97e12adcfa6b9285c241"
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const productsCol = collection(db, 'products');

// --- DOM Elements ---
const addProductForm = document.getElementById('add-product-form');
const adminProductList = document.getElementById('admin-product-list');
const downloadDbBtn = document.getElementById('download-db-btn');
const downloadSalesBtn = document.getElementById('download-sales-btn');

// --- Render Products in Admin List ---
const renderAdminProducts = async () => {
    adminProductList.innerHTML = 'Loading products...';
    try {
        const productSnapshot = await getDocs(productsCol);
        adminProductList.innerHTML = ''; // Clear list
        if (productSnapshot.empty) {
            adminProductList.innerHTML = 'No products found.';
            return;
        }
        productSnapshot.forEach(doc => {
            const product = doc.data();
            const productEl = document.createElement('div');
            productEl.className = 'product-row';
            productEl.innerHTML = `
                <div class="product-name">${product.name}</div>
                <div class="product-price">₱${Number(product.price).toFixed(2)}</div>
                <button class="delete-btn" data-id="${doc.id}">Delete</button>
            `;
            adminProductList.appendChild(productEl);
        });
    } catch (error) {
        console.error("Error fetching products: ", error);
        adminProductList.innerHTML = 'Error loading products.';
    }
};

// --- Add a New Product ---
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('product-name-input').value;
    const price = parseFloat(document.getElementById('product-price-input').value);
    const imageUrl = document.getElementById('product-image-input').value;

    if (!name || isNaN(price) || !imageUrl) {
        alert('Please fill out all fields correctly.');
        return;
    }

    try {
        await addDoc(productsCol, { name, price, imageUrl });
        addProductForm.reset();
        await renderAdminProducts();
    } catch (error) {
        console.error("Error adding document: ", error);
        alert('Failed to add product.');
    }
});

// --- Delete a Product ---
adminProductList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const productId = e.target.dataset.id;
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteDoc(doc(db, 'products', productId));
                await renderAdminProducts();
            } catch (error) {
                console.error("Error deleting document: ", error);
                alert('Failed to delete product.');
            }
        }
    }
});

// --- Download Database as CSV ---
downloadDbBtn.addEventListener('click', async () => {
    try {
        const productSnapshot = await getDocs(productsCol);
        if (productSnapshot.empty) {
            alert('No products to download.');
            return;
        }

        let csvContent = "Name,Price,ImageURL\n";
        productSnapshot.forEach(doc => {
            const { name, price, imageUrl } = doc.data();
            const row = `"${name.replace(/"/g, '""')}",${price},"${imageUrl}"\n`;
            csvContent += row;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const filename = `products-backup-${new Date().toISOString().slice(0, 10)}.csv`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error downloading database: ", error);
        alert('Failed to download product database.');
    }
});

// --- Download Sales Report as CSV ---
downloadSalesBtn.addEventListener('click', async () => {
    try {
        const salesCollection = collection(db, 'sales');
        const salesSnapshot = await getDocs(salesCollection);
        if (salesSnapshot.empty) {
            alert('No sales transactions to download.');
            return;
        }

        // The header row for the CSV file already includes "Officer"
        let csvContent = "Transaction ID,Timestamp,Officer,Item Name,Quantity,Item Price,Subtotal\n";

        salesSnapshot.forEach(doc => {
            const sale = doc.data();
            const transactionId = doc.id;
            const timestamp = sale.createdAt?.toDate().toLocaleString() || 'N/A';
            const officer = sale.officerName; 
            
            // Each transaction can have multiple items, so we create a row for each item
            sale.items.forEach(item => {
                const row = [
                    `"${transactionId}"`,
                    `"${timestamp}"`,
                    `"${officer}"`, // And it's added to each row of the report
                    `"${item.name.replace(/"/g, '""')}"`,
                    item.qty,
                    item.price.toFixed(2),
                    item.subtotal.toFixed(2)
                ].join(',');
                csvContent += row + "\n";
            });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        const filename = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
        link.setAttribute("download", filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error("Error downloading sales report: ", error);
        alert('Failed to download sales report.');
    }
});


// --- Initial Load ---
renderAdminProducts();