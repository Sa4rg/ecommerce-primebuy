const loadBtn = document.getElementById('loadBtn');
const productsUl = document.getElementById('products');

loadBtn.addEventListener('click', () => {
  fetch('/api/products')
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        productsUl.innerHTML = '';
        data.data.forEach(product => {
          const li = document.createElement('li');
          li.textContent = `${product.name} - $${product.priceUSD} - Stock: ${product.stock}`;
          productsUl.appendChild(li);
        });
      } else {
        alert('Failed to load products');
      }
    })
    .catch(err => {
      alert('Error: ' + err.message);
    });
});