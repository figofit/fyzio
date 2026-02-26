document.querySelectorAll('.cart').forEach((cart) => {
  const qtyEl = cart.querySelector('.qty');
  const productName = cart.dataset.product;

  cart.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const current = Number(qtyEl.textContent);

      if (action === 'plus') {
        qtyEl.textContent = String(current + 1);
        return;
      }

      qtyEl.textContent = String(Math.max(1, current - 1));
    });
  });

  cart.querySelector('.add-btn').addEventListener('click', () => {
    const qty = qtyEl.textContent;
    alert(`Do košíku přidáno: ${productName} (${qty}×)`);
  });
});
