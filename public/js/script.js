let cart = [];

const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
const openCartBtn = document.getElementById('open-cart-btn');
const closeCartBtn = document.getElementById('close-cart-btn');
const cartPanel = document.getElementById('cart-panel');
const cartCountEl = document.getElementById('cart-count');
const cartBody = document.getElementById('cart-body');
const cartEmptyEl = document.getElementById('cart-empty');
const cartTotalEl = document.getElementById('cart-total');
const checkoutBtn = document.getElementById('checkout-btn');
const overlay = document.getElementById('overlay');

function updateCartCount() {
    cartCountEl.innerText = cart.length;
}

function aggregateCart() {
    const map = new Map();
    cart.forEach(item => {
        const key = `${item.name}||${item.price}`;
        if (!map.has(key)) map.set(key, { name: item.name, price: item.price, qty: 0 });
        const entry = map.get(key);
        entry.qty += 1;
    });
    return Array.from(map.values()).map(e => ({ ...e, subtotal: e.price * e.qty }));
}

function renderCart() {
    const items = aggregateCart();
    cartBody.innerHTML = '';
    if (items.length === 0) {
        cartBody.appendChild(cartEmptyEl);
        cartTotalEl.innerText = '₱0.00';
        return;
    }

    items.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <div class="left">
                <div style="font-weight:600">${item.name}</div>
                <div style="color:var(--gray); font-size:0.9em">₱${item.price.toFixed(2)}</div>
                <button class="remove-btn" data-name="${item.name}" data-price="${item.price}">Remove</button>
            </div>
            <div style="display:flex;align-items:center;gap:15px">
                <div class="qty-controls">
                    <button class="decrease-btn" data-name="${item.name}" data-price="${item.price}">-</button>
                    <span>${item.qty}</span>
                    <button class="increase-btn" data-name="${item.name}" data-price="${item.price}">+</button>
                </div>
                <div style="font-weight:600;min-width:70px;text-align:right">₱${item.subtotal.toFixed(2)}</div>
            </div>`;
        cartBody.appendChild(itemEl);
    });

    const total = items.reduce((s, it) => s + it.subtotal, 0);
    cartTotalEl.innerText = `₱${total.toFixed(2)}`;

    cartBody.querySelectorAll('.increase-btn, .decrease-btn, .remove-btn').forEach(btn => {
        btn.addEventListener('click', () => handleCartAction(btn));
    });
}

function handleCartAction(button) {
    const { name, price: priceStr } = button.dataset;
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
}

addToCartButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const productRow = event.target.closest('.product-row');
        const productName = productRow.querySelector('.product-name').innerText;
        const productPrice = parseFloat(productRow.querySelector('.product-price').innerText.replace('₱', ''));

        cart.push({ name: productName, price: productPrice });
        updateCartCount();

        // Show "Added!" notification
        const existingNotification = productRow.querySelector('.add-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = 'add-notification';
        notification.innerText = 'Added!';
        productRow.appendChild(notification);

        // Remove the notification after the animation ends
        setTimeout(() => {
            notification.remove();
        }, 1500); // This duration should match the animation duration

        openCartBtn.classList.add('item-added');
        setTimeout(() => openCartBtn.classList.remove('item-added'), 500);

        if (cartPanel.classList.contains('open')) renderCart();
    });
});

const openCart = () => {
    cartPanel.classList.add('open');
    overlay.classList.add('visible');
    renderCart();
};

const closeCart = () => {
    cartPanel.classList.remove('open');
    overlay.classList.remove('visible');
};

openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

checkoutBtn.addEventListener('click', () => {
    if (cart.length === 0) {
        alert('Your cart is empty.');
        return;
    }

    let csvContent = "Product Name,Price,Purchase Date\n";
    const purchaseDate = new Date().toLocaleString();
    cart.forEach(item => {
        csvContent += `"${item.name}",${item.price.toFixed(2)},"${purchaseDate}"\n`;
    });

    const link = document.createElement('a');
    link.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURI(csvContent));
    link.setAttribute('download', `sicap-purchase-${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert('Purchase successful! A summary file has been downloaded.');

    cart = [];
    updateCartCount();
    closeCart();
});

updateCartCount();
