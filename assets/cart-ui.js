(function () {
  'use strict';
  var cart = window.AromaCart;
  if (!cart) return;
  if (document.querySelector('[data-ag-cart-page]')) {
    var params = new URLSearchParams(location.search);
    if (params.has('items')) {
      try {
        cart.replace(JSON.parse(params.get('items')));
        if (cart.isSaved()) history.replaceState(null, '', 'cart.html');
      } catch (error) {
        document.querySelector('[data-ag-page-status]').textContent = 'That cart link could not be loaded. Review your saved items below.';
      }
    }
  }
  function escape(value) { return String(value).replace(/[&<>"']/g, function (c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function line(item) {
    var d = cart.details(item), key = escape(cart.id(item)), name = escape(d.name + ', ' + item.scent + (d.finish ? ', ' + d.finish : ''));
    return '<article class="ag-cart-line"><img src="' + d.image + '" alt="' + name + '" width="76" height="88"><div><h3>' + escape(d.name) + '</h3><p class="ag-cart-meta">' + escape([d.finish, item.scent].filter(Boolean).join(' · ')) + '</p>' + (d.monthly ? '<p class="ag-cart-free">Free Column diffuser + starter scent included</p>' : '') + '<p class="ag-cart-line-price">' + cart.money(d.price * item.qty) + (d.monthly ? '/month' : ' one time') + '</p><div class="ag-cart-actions"><div class="ag-cart-stepper"><button type="button" data-ag-action="less" data-ag-id="' + key + '" aria-label="Decrease quantity: ' + name + '"' + (item.qty === 1 ? ' disabled' : '') + '>−</button><span aria-label="Quantity">' + item.qty + '</span><button type="button" data-ag-action="more" data-ag-id="' + key + '" aria-label="Increase quantity: ' + name + '"' + (item.qty === 10 ? ' disabled' : '') + '>+</button></div><button type="button" class="ag-cart-remove" data-ag-action="remove" data-ag-id="' + key + '" aria-label="Remove ' + name + '">Remove</button></div></div></article>';
  }
  function markup(fullPage) {
    var items = cart.getItems(), totals = cart.totals();
    if (!items.length) return '<div class="ag-cart-empty"><h3>A little atmosphere awaits.</h3><p>Your cart is empty. Find your scent and make the Column yours.</p><a class="ag-cart-btn" href="collections.html">Explore the collection</a></div>';
    return '<div class="' + (fullPage ? 'ag-cart-page-grid' : '') + '"><div>' + items.map(line).join('') + '</div><div class="ag-cart-summary">' + (totals.monthly ? '<div class="ag-cart-total-row"><span>Recurring scent plan</span><strong>' + cart.money(totals.monthly) + '/month</strong></div>' : '') + (totals.oneTime ? '<div class="ag-cart-total-row"><span>One-time items</span><strong>' + cart.money(totals.oneTime) + '</strong></div>' : '') + '<div class="ag-cart-total-row primary"><span>' + (totals.monthly ? 'First payment subtotal' : 'Subtotal') + '</span><strong>' + cart.money(totals.subtotal) + '</strong></div><p class="ag-cart-note">Before tax. Free standard shipping in the continental US. Express delivery is available at checkout.</p>' + (totals.monthly ? '<p class="ag-cart-note">Monthly billing for scent plans. Spare cartridges are one-time charges. Review <a href="terms.html#enrollment">subscription terms</a> before enrollment.</p>' : '') + '<a class="ag-cart-btn" data-ag-checkout href="' + escape(cart.checkoutURL()) + '">Continue to checkout</a>' + (fullPage ? '<a class="ag-cart-secondary" href="collections.html">Continue shopping</a>' : '<a class="ag-cart-secondary" href="' + escape(cart.cartURL()) + '">View full cart</a>') + (!cart.isSaved() ? '<p class="ag-cart-note">Browser storage is unavailable. Use the checkout button to carry these items forward; they will not be saved after you leave.</p>' : '') + '</div></div>';
  }
  var dialog = document.createElement('dialog');
  dialog.id = 'ag-cart-drawer';
  dialog.className = 'ag-cart ag-cart-dialog';
  dialog.setAttribute('aria-labelledby', 'ag-cart-title');
  dialog.innerHTML = '<div class="ag-cart-heading"><h2 id="ag-cart-title">Your cart</h2><button type="button" class="ag-cart-close" aria-label="Close cart" autofocus>×</button></div><p class="ag-cart-status" role="status" aria-live="polite"></p><div class="ag-cart-dialog-content" data-ag-cart-content></div>';
  document.body.appendChild(dialog);
  var host = document.querySelector('.hdr-in, .header-in') || document.querySelector('header .wrap');
  if (host) {
    var trigger = document.createElement('button');
    trigger.type = 'button'; trigger.className = 'ag-cart-trigger'; trigger.setAttribute('data-ag-cart-open','');
    trigger.setAttribute('aria-haspopup','dialog'); trigger.setAttribute('aria-controls',dialog.id);
    trigger.innerHTML = '<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 8V6a4 4 0 0 1 8 0v2"/></svg><span>Cart</span><span class="ag-cart-count" data-ag-cart-count>0</span>';
    host.appendChild(trigger);
  }
  var opener, overflow;
  function open(message) {
    opener = document.activeElement;
    render();
    dialog.querySelector('.ag-cart-status').textContent = message || '';
    if (!dialog.open) { overflow = document.body.style.overflow; dialog.showModal(); document.body.style.overflow = 'hidden'; }
  }
  dialog.querySelector('.ag-cart-close').addEventListener('click', function () { dialog.close(); });
  dialog.addEventListener('close', function () { document.body.style.overflow = overflow || ''; if (opener && opener.isConnected) opener.focus(); });
  dialog.addEventListener('click', function (e) {
    var r = dialog.getBoundingClientRect();
    if (e.target === dialog && (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)) dialog.close();
  });
  function render() {
    var focused = document.activeElement, action = focused && focused.dataset.agAction, key = focused && focused.dataset.agId;
    var container = focused && focused.closest('[data-ag-cart-content]');
    document.querySelectorAll('[data-ag-cart-content]').forEach(function (el) { el.innerHTML = markup(el.hasAttribute('data-ag-cart-page')); });
    var count = cart.totals().count;
    document.querySelectorAll('[data-ag-cart-count]').forEach(function (el) { el.textContent = count; });
    document.querySelectorAll('[data-ag-cart-open]').forEach(function (el) { el.setAttribute('aria-label', 'Open cart, ' + count + (count === 1 ? ' item' : ' items')); });
    if (container && action) {
      var buttons = Array.from(container.querySelectorAll('[data-ag-action]'));
      var target = buttons.find(function (b) { return b.dataset.agId === key && b.dataset.agAction === action && !b.disabled; }) || buttons.find(function (b) { return b.dataset.agId === key && !b.disabled; }) || container.querySelector('a, button:not(:disabled)');
      if (target) target.focus();
    }
  }
  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-ag-cart-open]');
    if (trigger) { e.preventDefault(); open(); return; }
    var button = e.target.closest('[data-ag-action]');
    if (button) {
      var item = cart.getItems().find(function (i) { return cart.id(i) === button.dataset.agId; });
      if (!item) return;
      if (button.dataset.agAction === 'remove') cart.remove(cart.id(item));
      else cart.setQty(cart.id(item), item.qty + (button.dataset.agAction === 'more' ? 1 : -1));
      var status = dialog.open ? dialog.querySelector('.ag-cart-status') : document.querySelector('[data-ag-page-status]');
      if (status) status.textContent = button.dataset.agAction === 'remove' ? cart.details(item).name + ' removed.' : 'Cart quantity updated.';
    }
    if (e.target.closest('[data-ag-checkout]') && typeof window.track === 'function') window.track('begin_checkout', {value:cart.totals().subtotal / 100, currency:'USD', qty:cart.totals().count});
  });
  cart.subscribe(render);
  window.AromaCartUI = {open:open};
  render();
})();
