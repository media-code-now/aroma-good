const test = require('node:test');
const assert = require('node:assert/strict');
const createCart = require('../assets/cart-store.js');
function environment() {
  const data = new Map(), handlers = {};
  return {data, handlers, localStorage:{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)},addEventListener:(event,fn)=>handlers[event]=fn};
}
const selection = overrides => ({unit:'column',finish:'steel',scent:'First Light',qty:1,...overrides});
test('mixed cart separates recurring plans from one-time spare cartridges',()=>{
  const c=createCart(environment());c.addProduct(selection({qty:2,addon:true}));c.addProduct(selection({finish:'cream'}));
  assert.deepEqual(c.totals(),{monthly:8997,oneTime:5900,subtotal:14897,count:4});
  assert.equal(c.getItems().find(i=>i.unit==='cartridge').qty,1);
});
test('identical variants merge; finishes and scents stay distinct',()=>{
  const c=createCart(environment());c.addProduct(selection());c.addProduct(selection());c.addProduct(selection({finish:'cream'}));c.addProduct(selection({scent:'Santal'}));
  assert.equal(c.getItems().length,3);assert.equal(c.getItems()[0].qty,2);
});
test('over-limit add is atomic, including its spare cartridge',()=>{
  const c=createCart(environment());c.addProduct(selection({qty:10}));
  assert.throws(()=>c.addProduct(selection({addon:true})),/Maximum 10/);
  assert.equal(c.getItems().length,1);assert.equal(c.totals().monthly,29990);
});
test('quantity changes, removals, empty totals, and defensive snapshots',()=>{
  const c=createCart(environment());c.addProduct(selection());const key=c.id(c.getItems()[0]);
  c.setQty(key,3);assert.equal(c.totals().monthly,8997);assert.throws(()=>c.setQty(key,0));
  const snapshot=c.getItems();snapshot[0].qty=10;assert.equal(c.getItems()[0].qty,3);
  c.remove(key);assert.deepEqual(c.totals(),{monthly:0,oneTime:0,subtotal:0,count:0});
});
test('reload persists selections but never accepts a stored price',()=>{
  const env=environment();const c=createCart(env);c.addProduct(selection());
  const raw=JSON.parse(env.data.get('aroma-good-cart-v1'));raw.items[0].price=1;env.data.set('aroma-good-cart-v1',JSON.stringify(raw));
  assert.equal(createCart(env).totals().subtotal,2999);
});
test('corrupt storage recovers and invalid imports do not overwrite the cart',()=>{
  const env=environment();env.data.set('aroma-good-cart-v1','{');const c=createCart(env);assert.equal(c.getItems().length,0);
  c.addProduct(selection());assert.throws(()=>c.replace([selection({scent:'<script>'})]));assert.equal(c.getItems().length,1);
  assert.throws(()=>c.addProduct(selection({unit:'__proto__'})));assert.throws(()=>c.addProduct(selection({qty:1.5})));
});
test('blocked storage carries selections through cart and checkout URLs',()=>{
  const c=createCart({localStorage:{getItem(){throw Error()},setItem(){throw Error()}}});c.addProduct(selection());
  assert.equal(c.isSaved(),false);
  for(const link of [c.checkoutURL(),c.cartURL()])assert.deepEqual(JSON.parse(new URL(link,'http://localhost/').searchParams.get('items')),c.getItems());
});
test('storage updates synchronize tabs and notify subscribers',()=>{
  const env=environment();const c=createCart(env);let notifications=0;c.subscribe(()=>notifications++);
  env.data.set('aroma-good-cart-v1',JSON.stringify({version:1,items:[selection({qty:2})]}));env.handlers.storage({key:'aroma-good-cart-v1'});
  assert.equal(c.totals().monthly,5998);assert.equal(notifications,1);
  env.data.clear();env.handlers.storage({key:null});assert.equal(c.totals().count,0);
});

test('retired Panel cannot be added or imported, and is filtered from saved carts',()=>{
  const env=environment();
  env.data.set('aroma-good-cart-v1',JSON.stringify({version:1,items:[selection({unit:'panel'}),selection()]}));
  const c=createCart(env);
  assert.deepEqual(c.getItems(),[selection()]);
  assert.throws(()=>c.addProduct(selection({unit:'panel'})));
  assert.throws(()=>c.replace([selection({unit:'panel'})]));
  assert.equal(c.totals().subtotal,2999);
});
