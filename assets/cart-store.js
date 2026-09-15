/* Shared cart model. All amounts are integer USD cents; stored prices are ignored. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.AromaCart = factory(root);
})(typeof window !== 'undefined' ? window : this, function (env) {
  'use strict';
  var KEY = 'aroma-good-cart-v1';
  var SCENTS = ['First Light', 'Liquid Sun', 'Santal', 'The Unwinding', 'White Tea'];
  var FINISHES = ['steel', 'charcoal', 'cream'];
  var listeners = [], memory = [], saved = true;
  function normalize(item) {
    if (!item || ['column', 'cartridge'].indexOf(item.unit) < 0 || SCENTS.indexOf(item.scent) < 0) return null;
    var qty = Number(item.qty);
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) return null;
    if (item.unit !== 'cartridge' && FINISHES.indexOf(item.finish) < 0) return null;
    return {unit:item.unit, finish:item.unit === 'cartridge' ? '' : item.finish, scent:item.scent, qty:qty};
  }
  function id(item) { return [item.unit, item.finish, item.scent].join('|'); }
  function clean(items, strict) {
    if (!Array.isArray(items) || items.length > 100) { if (strict) throw new Error('Invalid cart.'); return []; }
    var result = [];
    items.forEach(function (raw) {
      var item = normalize(raw);
      if (!item) { if (strict) throw new Error('Invalid cart selection.'); return; }
      var existing = result.find(function (other) { return id(other) === id(item); });
      if (existing) {
        if (strict && existing.qty + item.qty > 10) throw new Error('Maximum 10 of each selection per cart.');
        existing.qty = Math.min(10, existing.qty + item.qty);
      } else result.push(item);
    });
    return result;
  }
  function read() {
    try {
      var raw = env.localStorage.getItem(KEY);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return parsed.version === 1 ? clean(parsed.items, false) : [];
    } catch (e) { return []; }
  }
  memory = read();
  function getItems() { return memory.map(function (item) { return Object.assign({}, item); }); }
  function notify() { listeners.slice().forEach(function (listener) { listener(getItems()); }); }
  function commit(items) {
    memory = clean(items, true);
    try { env.localStorage.setItem(KEY, JSON.stringify({version:1, items:memory})); saved = true; }
    catch (e) { saved = false; }
    notify();
  }
  function addProduct(selection) {
    var product = normalize(selection);
    if (!product || product.unit === 'cartridge') throw new Error('Choose a valid diffuser, finish, and scent.');
    var items = getItems();
    items.push(product);
    if (selection.addon) items.push({unit:'cartridge', finish:'', scent:product.scent, qty:1});
    // Validate the full operation before changing state; an add-on cannot be partially added.
    commit(clean(items, true));
  }
  function setQty(key, qty) {
    if (!Number.isInteger(qty) || qty < 1 || qty > 10) throw new Error('Choose a quantity from 1 to 10.');
    commit(getItems().map(function (item) { if (id(item) === key) item.qty = qty; return item; }));
  }
  function remove(key) { commit(getItems().filter(function (item) { return id(item) !== key; })); }
  function details(item) {
    var names = {column:'Column scent plan', cartridge:'Spare scent cartridge'};
    return {name:names[item.unit], price:item.unit === 'column' ? 2999 : 5900,
      monthly:item.unit === 'column', image:item.unit === 'cartridge' ? 'assets/scent-' + ({'First Light':'first-light','Liquid Sun':'liquid-sun','Santal':'santal','The Unwinding':'unwinding','White Tea':'white-tea'}[item.scent]) + '.jpg' : 'assets/aroma7-' + item.finish + '.jpg',
      finish:item.finish ? item.finish[0].toUpperCase() + item.finish.slice(1) : ''};
  }
  function totals() {
    return memory.reduce(function (sum, item) {
      var d = details(item), amount = d.price * item.qty;
      sum[d.monthly ? 'monthly' : 'oneTime'] += amount;
      sum.subtotal += amount; sum.count += item.qty;
      return sum;
    }, {monthly:0, oneTime:0, subtotal:0, count:0});
  }
  function money(cents) { return (cents / 100).toLocaleString('en-US', {style:'currency', currency:'USD'}); }
  function pageURL(page) {
    return saved ? page + '?cart=1' : page + '?items=' + encodeURIComponent(JSON.stringify(getItems()));
  }
  function checkoutURL() { return pageURL('checkout.html'); }
  if (env.addEventListener) env.addEventListener('storage', function (event) {
    if (event.key === KEY || event.key === null) { memory = read(); saved = true; notify(); }
  });
  return {getItems:getItems, addProduct:addProduct, setQty:setQty, remove:remove, replace:commit,
    details:details, totals:totals, id:id, money:money, checkoutURL:checkoutURL, cartURL:function () { return pageURL('cart.html'); },
    isSaved:function () { return saved; }, subscribe:function (listener) {
      listeners.push(listener);
      return function () { listeners = listeners.filter(function (fn) { return fn !== listener; }); };
    }};
});
