/* ==========================================================
   Elias Pizzaria — Sistema Integrado (protótipo funcional)
   Dados simulados e compartilhados entre os módulos via localStorage.
   Abra duas abas (ex.: cliente + atendente) para ver a sincronização.
   ========================================================== */
(() => {
'use strict';

/* ---------------- utilitários ---------------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const MIN = 60000;
const now = () => Date.now();
const qs = k => new URLSearchParams(location.search).get(k);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => (Math.round(v * 100) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const hm = t => new Date(t).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const ago = t => { const m = Math.max(0, Math.round((now() - t) / MIN)); return m < 1 ? 'agora' : m < 60 ? `há ${m} min` : `há ${Math.floor(m / 60)}h ${m % 60} min`; };
const mins = t => Math.max(0, Math.round((now() - t) / MIN));
const dfmt = t => { const d = new Date(t); const w = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''); const mo = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''); return `${cap(w)}, ${d.getDate()} ${mo} ${d.getFullYear()} · ${hm(t)}`; };
const longDate = () => cap(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
const ic = (k, s = 20, c = 'currentColor', sw = 2) => `<svg class="ic" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="${c}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${(window.ICONS || {})[k] || ''}</svg>`;
const pz = (kind, s = 84) => `<span class="pz ${kind}" style="width:${s}px"></span>`;
const thumbFor = (p, s = 84) => p.cat === 'bebida' ? `<span class="thumb" style="width:${s}px;height:${s}px;border-radius:${s > 60 ? 20 : 10}px;background:var(--blueSoft);color:var(--blue)">${ic('cup', s * .45)}</span>` : pz(p.kind, s);
const kv = (k, v, cls = '', st = '') => `<div class="kv ${cls}"><span>${k}</span><b style="${st}">${v}</b></div>`;
const initials = n => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const first = n => (n || '').split(' ')[0];

/* ---------------- banco de dados simulado ---------------- */
const KEY = 'elias-pizzaria-db-v1';
let memory = null;
const read = () => { try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : memory; } catch (e) { return memory; } };
const write = v => { memory = v; try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* modo privado */ } };

const SIZES = { P: ['Pequena (P)', '4 fatias', 'P'], M: ['Média (M)', '6 fatias', 'M'], G: ['Grande (G)', '8 fatias', 'G'] };
const SIZE_NAME = { P: 'Pequena', M: 'Média', G: 'Grande' };
const BORDERS = { tradicional: ['Tradicional', 0], catupiry: ['Catupiry', 5], cheddar: ['Cheddar', 5] };
const STEPS = ['Massa', 'Molho', 'Recheio', 'Forno', 'Finalizada'];
const ST = ['novo', 'confirmado', 'preparo', 'pronto', 'rota', 'entregue'];
const STORE_ADDR = 'Av. Getúlio Vargas, 1500 — Centro, Rio Branco - AC';
const DELIVERY_FEE = 5, FREE_FROM = 100;

function unitPrice(p, size, border) {
  if (p.cat === 'bebida') return p.price;
  return (p.prices[size] || p.prices.M) + (BORDERS[border] ? BORDERS[border][1] : 0);
}
function makeItem(menu, pid, qty = 1, size = 'G', border = 'tradicional', obs = '') {
  const p = menu.find(x => x.id === pid);
  const isP = p.cat !== 'bebida';
  return { pid, name: p.name, cat: p.cat, kind: p.kind, qty, size: isP ? size : null, border: isP ? border : null, obs, unit: unitPrice(p, size, border), step: 0 };
}

function seed() {
  const t = now();
  const menu = [
    { id: 'p1', name: 'Calabresa', desc: 'Molho de tomate, mussarela, calabresa fatiada e orégano.', cat: 'pizza', kind: 'calabresa', prices: { P: 35, M: 40, G: 48 }, available: true },
    { id: 'p2', name: 'Frango com Catupiry', desc: 'Frango desfiado, catupiry original e mussarela.', cat: 'pizza', kind: 'frango', prices: { P: 40, M: 45, G: 52.9 }, available: true },
    { id: 'p3', name: 'Margherita', desc: 'Mussarela, tomate fatiado e manjericão fresco.', cat: 'pizza', kind: 'margherita', prices: { P: 38, M: 43, G: 50 }, available: true },
    { id: 'p4', name: 'Bacon com Requeijão', desc: 'Bacon crocante, requeijão cremoso e mussarela.', cat: 'pizza', kind: 'bacon', prices: { P: 39, M: 44.95, G: 52 }, available: true },
    { id: 'p5', name: 'Strogonoff', desc: 'Strogonoff de frango, mussarela e batata palha.', cat: 'pizza', kind: 'strogonoff', prices: { P: 42, M: 49, G: 59.9 }, available: true },
    { id: 'p6', name: 'Portuguesa', desc: 'Presunto, ovos, cebola, ervilha, azeitona e mussarela.', cat: 'pizza', kind: 'calabresa', prices: { P: 40, M: 46, G: 54.9 }, available: true },
    { id: 'p7', name: 'Quatro Queijos', desc: 'Mussarela, catupiry, provolone e parmesão.', cat: 'pizza', kind: 'margherita', prices: { P: 41, M: 47, G: 55.9 }, available: true },
    { id: 'd1', name: 'Chocolate', desc: 'Chocolate ao leite com granulado.', cat: 'sobremesa', kind: 'chocolate', prices: { P: 32, M: 39.9, G: 46 }, available: true },
    { id: 'd2', name: 'Romeu e Julieta', desc: 'Goiabada cremosa com queijo.', cat: 'sobremesa', kind: 'strogonoff', prices: { P: 33, M: 40, G: 47 }, available: true },
    { id: 'b1', name: 'Coca-Cola 2L', desc: 'Refrigerante 2 litros.', cat: 'bebida', price: 10, available: true },
    { id: 'b2', name: 'Guaraná 2L', desc: 'Refrigerante 2 litros.', cat: 'bebida', price: 9, available: false },
    { id: 'b3', name: 'Coca-Cola Lata', desc: 'Lata 350 ml.', cat: 'bebida', price: 6, available: true },
    { id: 'b4', name: 'Suco natural 500ml', desc: 'Laranja, maracujá ou cupuaçu.', cat: 'bebida', price: 8, available: true },
  ];
  const I = (pid, q, s, b) => makeItem(menu, pid, q, s, b);
  const OFF = [0, 1, 4, 32, 35, 58];
  const mk = (id, cust, phone, addr, type, items, status, minsAgo, extra = {}) => {
    const created = t - minsAgo * MIN; const hist = {};
    ST.slice(0, ST.indexOf(status) + 1).forEach((s, i) => { hist[s] = Math.min(created + OFF[i] * MIN, t - (ST.indexOf(status) - i) * 30000); });
    const sub = items.reduce((a, i) => a + i.unit * i.qty, 0);
    const fee = type === 'entrega' && sub < FREE_FROM ? DELIVERY_FEE : 0;
    return Object.assign({ id, customer: cust, phone, address: addr, ref: '', type, items, status, hist, created, pay: 'Pix', obs: '', fee, total: sub + fee, driver: null, source: 'balcao', email: '' }, extra);
  };
  const orders = [
    mk(102, 'João Silva', '(68) 99999-9999', 'Rua das Flores, 123 — Centro', 'entrega', [I('p1', 2, 'G'), I('b1', 1)], 'preparo', 18),
    mk(103, 'Maria Souza', '(68) 98888-1111', '', 'retirada', [I('p3', 1, 'M')], 'confirmado', 12),
    mk(104, 'Carlos Lima', '(68) 98123-4567', 'Rua Acre, 850 — Bosque', 'entrega', [I('p1', 1, 'G'), I('p6', 1, 'G'), I('p2', 1, 'M')], 'pronto', 44),
    mk(105, 'Ana Costa', '(68) 99654-3210', 'Rua das Palmeiras, 250 — Centro', 'entrega', [I('p2', 1, 'G'), I('b3', 1)], 'novo', 2, { source: 'app', obs: 'Sem azeitona.' }),
    mk(106, 'Sônia Ribeiro', '(68) 99211-0099', 'Av. Brasil, 410 — Centro', 'entrega', [I('d1', 1, 'M'), I('b4', 2)], 'novo', 1, { source: 'app', pay: 'Dinheiro', obs: 'Troco para R$ 100,00.' }),
    mk(107, 'Sofia Mendes', '(68) 99303-4455', 'Rua Bahia, 120 — Cadeia Velha', 'entrega', [I('p7', 1, 'G', 'catupiry'), I('d2', 1, 'P')], 'preparo', 26),
    mk(108, 'Roberto Alves', '(68) 99876-5544', 'Rua Central, 410 — Centro', 'entrega', [I('p4', 2, 'G'), I('b1', 1)], 'pronto', 46, { driver: 'Pedro' }),
    mk(109, 'Davi Rocha', '(68) 99101-2020', 'Rua do Comércio, 125 — Centro', 'entrega', [I('p5', 1, 'G'), I('b1', 1)], 'rota', 52, { driver: 'Lucas', pay: 'Dinheiro' }),
    mk(110, 'Allay Nunes', '(68) 99555-8080', 'Travessa Guaporé, 33 — Aviário', 'entrega', [I('p1', 2, 'G'), I('p3', 2, 'G'), I('b1', 3)], 'entregue', 95, { driver: 'Lucas' }),
    mk(111, 'Marian Souza', '(68) 99777-1212', '', 'retirada', [I('p6', 1, 'M'), I('b3', 1)], 'pronto', 40),
    mk(98, 'Elisa Salles Costa', '(68) 99988-7766', 'R. Chico Mendonça, nº 67 — Conquista', 'entrega', [I('p3', 1, 'M'), I('b3', 2)], 'entregue', 60 * 24 * 6 + 120, { source: 'app', email: 'elisa.salles.costa@gmail.com', driver: 'Lucas', rating: 5 }),
    mk(95, 'Elisa Salles Costa', '(68) 99988-7766', 'R. Chico Mendonça, nº 67 — Conquista', 'entrega', [I('p2', 1, 'G')], 'entregue', 60 * 24 * 15 + 200, { source: 'app', email: 'elisa.salles.costa@gmail.com', driver: 'Pedro' }),
  ];
  orders.forEach(o => { if (o.status === 'preparo') o.items.forEach((i, k) => { if (i.cat !== 'bebida') i.step = k === 0 ? 2 : 0; }); if (['pronto', 'rota', 'entregue'].includes(o.status)) o.items.forEach(i => i.step = 5); });
  const mv = (dAgo, h, type, qty, who, obs) => ({ t: t - dAgo * 864e5 - h * 36e5, type, qty, who, obs });
  return {
    v: 1, seq: 112, menu, orders,
    cart: [], cartMeta: { type: 'entrega', pay: 'Pix', addr: 0 },
    user: { name: 'Elisa Salles Costa', email: 'elisa.salles.costa@gmail.com', phone: '(68) 99988-7766', fav: [],
      addresses: [{ label: 'Casa', line: 'R. Chico Mendonça, nº 67', district: 'Conquista', city: 'Rio Branco - AC', cep: '69900-072', main: true },
                  { label: 'Trabalho', line: 'Av. Ceará, nº 1200', district: 'Centro', city: 'Rio Branco - AC', cep: '69900-000', main: false }] },
    staff: [{ id: 'elisa', name: 'Elisa Salles', role: 'Atendente' }, { id: 'eliel', name: 'Eliel', role: 'Cozinheiro' }, { id: 'joao', name: 'João Pedro', role: 'Atendente' }, { id: 'rogerio', name: 'Rogério Matos', role: 'Cozinheiro' }],
    pin: '1234',
    drivers: ['Lucas', 'Pedro', 'Thiago'], driverOn: { Lucas: true, Pedro: true, Thiago: false },
    session: { staff: 'elisa', cook: 'rogerio', driver: 'Lucas', manager: 'Carlos Andrade' },
    sales: [820, 1040, 1360, 1180, 610, 740],
    stock: [
      { id: 's1', name: 'Queijo mussarela', cat: 'Laticínios', unit: 'kg', qty: 8, min: 10, avg: 2.5, supplier: 'Laticínios Acre', moves: [mv(0, 1, 'saida', 1.5, 'Rogério Matos', 'Produção do turno'), mv(0, 7, 'saida', 2, 'Eliel', 'Produção do turno'), mv(1, 2, 'entrada', 10, 'Carlos Andrade', 'NF 4471 · Laticínios Acre'), mv(1, 10, 'ajuste', 0.5, 'Carlos Andrade', 'Perda / vencimento'), mv(2, 1, 'saida', 3, 'Rogério Matos', 'Produção do turno'), mv(3, 2, 'saida', 2.5, 'Eliel', 'Produção do turno')] },
      { id: 's2', name: 'Calabresa', cat: 'Frios', unit: 'kg', qty: 4.5, min: 5, avg: 1.2, supplier: 'Frigorífico Norte', moves: [mv(0, 3, 'saida', 1, 'Rogério Matos', 'Produção do turno'), mv(2, 5, 'entrada', 6, 'Carlos Andrade', 'NF 3310')] },
      { id: 's3', name: 'Farinha de trigo', cat: 'Secos', unit: 'kg', qty: 28, min: 25, avg: 6, supplier: 'Moinho Amazônia', moves: [mv(0, 2, 'saida', 6, 'Eliel', 'Massas do dia'), mv(4, 3, 'entrada', 50, 'Carlos Andrade', 'NF 1022')] },
      { id: 's4', name: 'Presunto', cat: 'Frios', unit: 'kg', qty: 5.5, min: 5, avg: 0.8, supplier: 'Frigorífico Norte', moves: [mv(1, 4, 'saida', 0.8, 'Rogério Matos', 'Produção do turno')] },
      { id: 's5', name: 'Molho de tomate', cat: 'Molhos', unit: 'L', qty: 18, min: 8, avg: 2, supplier: 'Distribuidora Rio Branco', moves: [mv(1, 3, 'saida', 2, 'Eliel', 'Produção do turno')] },
      { id: 's6', name: 'Frango desfiado', cat: 'Carnes', unit: 'kg', qty: 9, min: 4, avg: 1.5, supplier: 'Granja Acreana', moves: [mv(0, 5, 'entrada', 5, 'Carlos Andrade', 'NF 7781')] },
      { id: 's7', name: 'Catupiry', cat: 'Laticínios', unit: 'kg', qty: 6, min: 3, avg: 0.7, supplier: 'Laticínios Acre', moves: [] },
      { id: 's8', name: 'Coca-Cola 2L', cat: 'Bebidas', unit: 'un', qty: 48, min: 24, avg: 9, supplier: 'Coca-Cola Andina', moves: [mv(0, 6, 'saida', 9, 'Elisa Salles', 'Vendas do dia')] },
    ],
  };
}

let db = read();
if (!db || db.v !== 1) { db = seed(); write(db); }
const save = () => write(db);
const update = fn => { db = read() || db; fn(db); write(db); };
const order = id => db.orders.find(o => o.id == id);
const product = id => db.menu.find(p => p.id === id);

/* ---------------- regras de pedido ---------------- */
const subtotal = items => items.reduce((a, i) => a + i.unit * i.qty, 0);
const feeFor = (type, sub) => type === 'entrega' && sub > 0 && sub < FREE_FROM ? DELIVERY_FEE : 0;
const itemLabel = i => i.cat === 'bebida' ? `${i.qty}x ${i.name}` : `${i.qty}x Pizza ${i.name} — ${SIZE_NAME[i.size]}${i.border && i.border !== 'tradicional' ? ' (borda ' + BORDERS[i.border][0].toLowerCase() + ')' : ''}`;
const itemsText = items => {
  const pz = items.filter(i => i.cat !== 'bebida').reduce((a, i) => a + i.qty, 0);
  const bb = items.filter(i => i.cat === 'bebida').reduce((a, i) => a + i.qty, 0);
  return [pz ? `${pz} pizza${pz > 1 ? 's' : ''}` : '', bb ? `${bb} bebida${bb > 1 ? 's' : ''}` : ''].filter(Boolean).join(' + ');
};
function statusInfo(o) {
  if (o.status === 'cancelado') return ['off', 'Cancelado'];
  if (o.status === 'pronto' && o.type === 'entrega' && o.driver) return ['aguardando', 'Aguardando retirada'];
  if (o.status === 'pronto' && o.type === 'retirada') return ['pronto', 'Pronto p/ retirada'];
  return ({ novo: ['novo', 'Novo'], confirmado: ['aguardando', 'Aguardando preparo'], preparo: ['preparo', 'Em preparo'], pronto: ['pronto', 'Pronto'], rota: ['rota', 'Em rota'], entregue: ['entregue', o.type === 'retirada' ? 'Retirado' : 'Entregue'] })[o.status];
}
const badge = (cls, label) => `<span class="badge b-${cls}"><i></i>${esc(label)}</span>`;
const badgeOf = o => badge(...statusInfo(o));
const active = o => !['entregue', 'cancelado'].includes(o.status);

function setStatus(id, st, extra = {}) {
  update(d => {
    const o = d.orders.find(x => x.id == id); if (!o) return;
    o.status = st; o.hist[st] = now(); Object.assign(o, extra);
    if (st === 'preparo') o.items.forEach(i => { if (!i.step) i.step = 0; });
    if (['pronto', 'rota', 'entregue'].includes(st)) o.items.forEach(i => i.step = 5);
  });
}

/* ---------------- feedback (toast, modal, flash) ---------------- */
function toast(msg, type = 'ok') {
  let w = $('.toasts'); if (!w) { w = document.createElement('div'); w.className = 'toasts'; w.setAttribute('role', 'status'); document.body.append(w); }
  const t = document.createElement('div'); t.className = 'toast ' + type;
  t.innerHTML = ic(type === 'err' ? 'alert' : type === 'info' ? 'bell' : 'checkCircle', 18) + `<span>${msg}</span>`;
  w.append(t); setTimeout(() => t.classList.add('out'), 2800); setTimeout(() => t.remove(), 3200);
}
const flash = (msg, type) => { try { sessionStorage.setItem('elias-flash', JSON.stringify([msg, type])); } catch (e) {} };
const go = (url, msg, type) => { if (msg) flash(msg, type); location.href = url; };
function modal({ title, body, ok = 'Salvar', okClass = 'primary', onOk, onMount, cancel = 'Cancelar' }) {
  const ov = document.createElement('div'); ov.className = 'overlay js-modal';
  ov.innerHTML = `<form class="modal modal-form" novalidate><div class="row between" style="width:100%"><h2>${title}</h2><button type="button" class="ib js-close" aria-label="Fechar" style="width:36px;height:36px">${ic('x', 18)}</button></div>
  <div class="col g12" style="width:100%">${body}</div><p class="form-err" hidden></p>
  <div class="row g10 end" style="width:100%">${cancel ? `<button type="button" class="btn neutral js-close">${cancel}</button>` : ''}${ok ? `<button class="btn ${okClass}">${ok}</button>` : ''}</div></form>`;
  document.body.append(ov);
  const close = () => ov.remove();
  ov.addEventListener('click', e => { if (e.target === ov || e.target.closest('.js-close')) close(); });
  document.addEventListener('keydown', function k(e) { if (e.key === 'Escape') { close(); document.removeEventListener('keydown', k); } });
  const f = $('form', ov);
  f.onsubmit = e => { e.preventDefault(); const r = onOk ? onOk(f) : true; if (typeof r === 'string') { const p = $('.form-err', f); p.textContent = r; p.hidden = false; } else if (r !== false) close(); };
  onMount && onMount(f, close);
  setTimeout(() => { const el = $('input:not([type=radio]):not([type=checkbox]),select,textarea', f); el && el.focus(); }, 30);
  return ov;
}
function formErr(form, msg) {
  let p = $('.form-err', form); if (!p) { p = document.createElement('p'); p.className = 'form-err'; form.prepend(p); }
  p.textContent = msg; p.hidden = !msg; if (msg) { form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake'); }
  return false;
}
const field = (label, name, val = '', type = 'text', extra = '') => `<label class="fld"><span>${label}</span><span class="input"><input name="${name}" type="${type}" value="${esc(val)}" ${extra}></span></label>`;

/* ---------------- comportamento global ---------------- */
document.addEventListener('click', e => {
  const eye = e.target.closest('.js-eye');
  if (eye) { const inp = eye.closest('.input').querySelector('input'); inp.type = inp.type === 'password' ? 'text' : 'password'; eye.innerHTML = ic(inp.type === 'password' ? 'eye' : 'eyeoff', 18); }
});
function phoneMask(inp) { inp.addEventListener('input', () => { const d = inp.value.replace(/\D/g, '').slice(0, 11); inp.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}` : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d; }); }
$$('input[type=tel]').forEach(phoneMask);

function cartCount() { return db.cart.reduce((a, i) => a + i.qty, 0); }
function paintCommon() {
  $$('.js-cartcount').forEach(el => { const n = cartCount(); el.textContent = n; el.hidden = n === 0; });
  const cnt = { 'att-pedidos': db.orders.filter(active).length, 'att-novos': db.orders.filter(o => o.status === 'novo').length, 'att-entregas': db.orders.filter(o => o.status === 'pronto').length, 'coz': db.orders.filter(o => ['confirmado', 'preparo'].includes(o.status)).length };
  $$('[data-count]').forEach(el => { const n = cnt[el.dataset.count]; el.textContent = n; el.hidden = !n; });
  const staffId = document.body.dataset.role === 'cozinha' ? db.session.cook : db.session.staff;
  const s = db.staff.find(x => x.id === staffId);
  if (s && document.body.dataset.role !== 'gerente') { $$('.js-staff-name').forEach(e => e.textContent = s.name); $$('.js-staff-ini').forEach(e => e.textContent = initials(s.name)); $$('.js-staff-role').forEach(e => e.textContent = s.role); }
  if (document.body.dataset.role === 'gerente') { $$('.js-staff-name').forEach(e => e.textContent = db.session.manager); $$('.js-staff-ini').forEach(e => e.textContent = initials(db.session.manager)); }
}

/* ======================================================================
   PÁGINAS
   ====================================================================== */
const P = {};
let render = () => {};
let known = new Set(db.orders.map(o => o.id));

/* ---------- HUB ---------- */
P['hub'] = () => {
  $('#resetDemo').onclick = () => modal({ title: 'Resetar dados?', body: '<p class="muted">Pedidos, carrinho, estoque e produtos voltam ao estado inicial da demonstração.</p>', ok: 'Resetar', okClass: 'danger', onOk: () => { db = seed(); save(); toast('Dados de demonstração restaurados'); } });
};

/* ---------- CLIENTE ---------- */
// Visitante: pede só com nome e telefone, sem conta e sem perfil.
const meOf = d => (d.session.guest && d.guest ? d.guest : d.user);
const cli = () => meOf(db);
const isGuest = () => !!(db.session.guest && db.guest);
const isMine = o => (isGuest() ? !o.email && o.phone === db.guest.phone : o.email === db.user.email);
P['cliente-login'] = () => {
  const f = $('#loginForm'); f.email.value = db.user.email;
  f.onsubmit = e => {
    e.preventDefault();
    const email = f.email.value.trim(), pw = f.password.value;
    if (!/^\S+@\S+\.\S+$/.test(email)) return formErr(f, 'Informe um e-mail válido.');
    if (pw.length < 4) return formErr(f, 'A senha precisa ter pelo menos 4 caracteres.');
    update(d => { d.user.email = email; d.session.client = true; d.session.guest = false; });
    go('inicio.html', `Bem-vinda de volta, ${first(db.user.name)}!`);
  };
};
P['cliente-cadastro'] = () => {
  const f = $('#signupForm');
  f.onsubmit = e => {
    e.preventDefault();
    const v = k => f[k].value.trim();
    if (!v('name') || v('name').split(' ').length < 2) return formErr(f, 'Informe seu nome completo.');
    if (v('phone').replace(/\D/g, '').length < 10) return formErr(f, 'Informe um telefone válido com DDD.');
    if (!/^\S+@\S+\.\S+$/.test(v('email'))) return formErr(f, 'Informe um e-mail válido.');
    if (f.password.value.length < 6) return formErr(f, 'A senha precisa ter pelo menos 6 caracteres.');
    update(d => { d.user = { name: v('name'), email: v('email'), phone: v('phone'), fav: [], addresses: v('address') ? [{ label: 'Casa', line: v('address'), district: '', city: 'Rio Branco - AC', cep: '', main: true }] : [] }; d.session.client = true; d.session.guest = false; });
    go('inicio.html', 'Conta criada com sucesso!');
  };
};
P['cliente-visitante'] = () => {
  const f = $('#guestForm');
  f.onsubmit = e => {
    e.preventDefault();
    const name = f.elements['name'].value.trim(), phone = f.elements['phone'].value.trim();
    if (!name) return formErr(f, 'Informe seu nome.');
    if (phone.replace(/\D/g, '').length < 10) return formErr(f, 'Informe um telefone válido com DDD.');
    update(d => { d.guest = { name, phone, email: '', fav: [], addresses: d.guest && d.guest.phone === phone ? d.guest.addresses : [] }; d.session.guest = true; d.session.client = false; });
    go('inicio.html', `Olá, ${first(name)}! Bom pedido.`);
  };
};
P['cliente-inicio'] = () => {
  $('#hello').textContent = `Olá, ${first(cli().name)}!`;
  // visitante não tem perfil: esconde o atalho (mantém o espaço do cabeçalho)
  if (isGuest()) $$('a[href="perfil.html"]').forEach(a => { a.removeAttribute('href'); a.style.visibility = 'hidden'; a.tabIndex = -1; a.setAttribute('aria-hidden', 'true'); });
  const s = $('#search');
  render = () => {
    const cat = ($('input[name=cat]:checked') || {}).value || 'pizza';
    const q = s.value.trim().toLowerCase();
    const list = db.menu.filter(p => (q ? true : p.cat === cat) && (!q || (p.name + ' ' + p.desc).toLowerCase().includes(q)));
    $('#menuTitle').textContent = q ? `Resultados para “${s.value.trim()}”` : ({ pizza: 'Pizzas mais pedidas', bebida: 'Bebidas', sobremesa: 'Pizzas doces' })[cat];
    $('#menu').innerHTML = list.length ? list.map(p => {
      const price = p.cat === 'bebida' ? p.price : p.prices.P;
      return `<a class="card prod ${p.available ? '' : 'is-off'}" href="item.html?id=${p.id}">${thumbFor(p)}<div class="grow col g4"><h3>${esc(p.name)}</h3><span class="xs muted">${esc(p.desc)}</span>
      ${p.available ? `<span class="xs muted" style="margin-top:4px">${p.cat === 'bebida' ? 'Preço' : 'A partir de'}</span><span class="price">${brl(price)}</span>` : `<span class="tag" style="align-self:flex-start;margin-top:4px">Indisponível</span>`}</div>
      ${p.available ? `<button class="addbtn" data-add="${p.id}" aria-label="Adicionar ${esc(p.name)}">${ic('plus', 20)}</button>` : ''}</a>`;
    }).join('') : `<div class="empty">${ic('search', 32)}<b>Nada encontrado</b><span>Tente buscar por outro sabor.</span></div>`;
    paintCommon();
  };
  $('#menu').addEventListener('click', e => {
    const b = e.target.closest('[data-add]'); if (!b) return; e.preventDefault();
    const p = product(b.dataset.add);
    update(d => { const it = makeItem(d.menu, p.id, 1, 'M'); const ex = d.cart.find(c => c.pid === it.pid && c.size === it.size && c.border === it.border && !c.obs); ex ? ex.qty++ : d.cart.push(it); });
    toast(`${p.name}${p.cat === 'bebida' ? '' : ' (M)'} adicionada ao carrinho`); render();
  });
  s.addEventListener('input', render); $$('input[name=cat]').forEach(r => r.addEventListener('change', () => { s.value = ''; render(); }));
  render();
};
P['cliente-item'] = () => {
  const p = product(qs('id')) || db.menu[0];
  let qty = 1; const isP = p.cat !== 'bebida';
  const fav = $('#fav'); const paintFav = () => { const on = cli().fav.includes(p.id); fav.classList.toggle('is-fav', on); fav.setAttribute('aria-pressed', on); };
  fav.onclick = () => { update(d => { const i = meOf(d).fav.indexOf(p.id); i < 0 ? meOf(d).fav.push(p.id) : meOf(d).fav.splice(i, 1); }); paintFav(); toast(cli().fav.includes(p.id) ? 'Adicionada aos favoritos' : 'Removida dos favoritos', 'info'); };
  paintFav();
  const opt = (name, k, a, b, on) => `<label class="opt"><input class="hidden-input" type="radio" name="${name}" value="${k}" ${on ? 'checked' : ''}><span class="box"><b>${a}</b><small>${b}</small></span></label>`;
  $('#item').innerHTML = `<div class="hero">${thumbFor(p, 180)}<div class="dots"><i></i><i></i><i></i></div></div>
  <div class="col g4"><div class="row between g12"><h2 style="font-size:26px">${esc(p.name)}</h2><span class="price" style="font-size:20px" id="unit"></span></div><p class="muted">${esc(p.desc)}</p>${p.available ? '' : '<span class="tag" style="align-self:flex-start">Indisponível no momento</span>'}</div>
  ${isP ? `<div class="col g8"><b class="xb">Tamanho</b><div class="row g8" style="align-items:stretch">${Object.entries(SIZES).map(([k, s]) => opt('tam', k, s[0], `${brl(p.prices[k])} · ${s[1]}`, k === 'M')).join('')}</div></div>
  <div class="col g8"><b class="xb">Borda</b><div class="row g8" style="align-items:stretch">${Object.entries(BORDERS).map(([k, b]) => opt('borda', k, b[0], b[1] ? '+ ' + brl(b[1]) : 'Grátis', k === 'tradicional')).join('')}</div></div>` : ''}
  <label class="fld"><span>Observações</span><textarea class="input" id="obs" maxlength="140" placeholder="${isP ? 'Ex.: sem cebola, pouco molho...' : 'Ex.: bem gelada'}"></textarea></label>`;
  const size = () => isP ? $('input[name=tam]:checked').value : null;
  const border = () => isP ? $('input[name=borda]:checked').value : null;
  const paint = () => { const u = unitPrice(p, size(), border()); $('#unit').textContent = brl(u); $('#qtyN').textContent = qty; $('#addBtn').textContent = p.available ? `Adicionar · ${brl(u * qty)}` : 'Indisponível'; $('#addBtn').disabled = !p.available; };
  $('#item').addEventListener('change', paint);
  $('#qMinus').onclick = () => { qty = Math.max(1, qty - 1); paint(); };
  $('#qPlus').onclick = () => { qty = Math.min(20, qty + 1); paint(); };
  $('#addBtn').onclick = () => {
    if (!p.available) return;
    update(d => { const it = makeItem(d.menu, p.id, qty, size(), border(), $('#obs').value.trim()); const ex = d.cart.find(c => c.pid === it.pid && c.size === it.size && c.border === it.border && c.obs === it.obs); ex ? ex.qty += qty : d.cart.push(it); });
    go('carrinho.html', `${p.name} adicionada ao carrinho`);
  };
  paint(); paintCommon();
};
P['cliente-carrinho'] = () => {
  const v = $('#cartView');
  render = () => {
    const c = db.cart, m = db.cartMeta;
    if (!c.length) { v.innerHTML = `<div class="empty" style="padding:60px 20px">${ic('cart', 40)}<b>Seu carrinho está vazio</b><span>Que tal uma pizza quentinha?</span><a class="btn primary" href="inicio.html">Ver cardápio</a></div>`; paintCommon(); return; }
    const sub = subtotal(c), fee = feeFor(m.type, sub);
    const addrs = cli().addresses;
    const a = addrs[m.addr] || addrs[0];
    v.innerHTML = `<div class="card" style="padding:4px 14px">${c.map((i, k) => `<div class="cart-item">${i.cat === 'bebida' ? thumbFor(i, 52) : pz(i.kind, 52)}<div class="grow col"><b>${esc(i.name)}</b><span class="xs muted">${i.cat === 'bebida' ? 'Bebida' : SIZE_NAME[i.size] + ' · Borda ' + BORDERS[i.border][0]}${i.obs ? ' · ' + esc(i.obs) : ''}</span><span class="xb" style="color:var(--primary)">${brl(i.unit * i.qty)}</span></div>
      <span class="stepper"><button type="button" data-dec="${k}" aria-label="Diminuir">${ic(i.qty === 1 ? 'x' : 'minus', 14)}</button><b>${i.qty}</b><button type="button" class="plus" data-inc="${k}" aria-label="Aumentar">${ic('plus', 14)}</button></span></div>`).join('')}</div>
    <a class="btn dashed" href="inicio.html">${ic('plus', 16)} Adicionar mais itens</a>
    <div class="col g8"><b class="xb">Tipo de pedido</b><div class="row g10">${['entrega', 'retirada'].map(t => `<label class="opt toggle2"><input class="hidden-input" type="radio" name="tipo" value="${t}" ${m.type === t ? 'checked' : ''}><span class="box">${ic(t === 'entrega' ? 'truck' : 'store', 18)} ${t === 'entrega' ? 'Delivery' : 'Retirada'}</span></label>`).join('')}</div></div>
    ${m.type === 'entrega' ? `<div class="col g8"><b class="xb">Endereço de entrega</b>${isGuest() ? `<label class="fld"><span class="input"><input id="guestAddr" type="text" placeholder="Rua, número e bairro *" value="${esc(a ? a.line : '')}" aria-label="Endereço de entrega"></span></label>` : a ? `<label class="card flat addr" style="cursor:pointer"><span class="ib soft">${ic('pin')}</span><div class="grow"><b>${esc(a.line)}</b><div class="xs muted">${esc([a.district, a.city].filter(Boolean).join(' · '))}</div></div>
      ${addrs.length > 1 ? `<select id="addrSel" class="addr-sel" aria-label="Trocar endereço">${addrs.map((x, i) => `<option value="${i}" ${i === m.addr ? 'selected' : ''}>${esc(x.label)}</option>`).join('')}</select>` : ''}<span style="color:var(--primary)">${ic('edit', 18)}</span></label>` : `<a class="btn secondary" href="perfil.html">+ Cadastrar endereço</a>`}</div>`
      : `<div class="col g8"><b class="xb">Retirar na loja</b><div class="card flat addr"><span class="ib soft">${ic('store')}</span><div class="grow"><b>Elias Pizzaria</b><div class="xs muted">${STORE_ADDR}</div></div></div></div>`}
    <div class="col g8"><b class="xb">Pagamento</b><div class="row g8 wrap">${['Pix', 'Cartão', 'Dinheiro'].map(p => `<label><input class="hidden-input" type="radio" name="pg" value="${p}" ${m.pay === p ? 'checked' : ''}><span class="chip">${p}</span></label>`).join('')}</div></div>
    <div class="card col g10">${kv('Subtotal', brl(sub))}${m.type === 'entrega' ? kv('Taxa de entrega', fee ? brl(fee) : 'Grátis', '', fee ? '' : 'color:var(--green)') : ''}${m.type === 'entrega' && fee ? `<span class="xs b muted">Faltam ${brl(FREE_FROM - sub)} para frete grátis</span>` : ''}<div class="divider"></div>${kv('Total', brl(sub + fee), 'total')}
    <button class="btn primary full lg" id="checkout">Finalizar pedido</button></div>`;
    paintCommon();
  };
  v.addEventListener('click', e => {
    const dec = e.target.closest('[data-dec]'), inc = e.target.closest('[data-inc]');
    if (dec) { update(d => { const i = d.cart[dec.dataset.dec]; i.qty--; if (i.qty <= 0) d.cart.splice(dec.dataset.dec, 1); }); render(); }
    if (inc) { update(d => { d.cart[inc.dataset.inc].qty++; }); render(); }
    if (e.target.closest('#checkout')) {
      const m = db.cartMeta;
      if (m.type === 'entrega' && !cli().addresses.length) return toast(isGuest() ? 'Informe o endereço de entrega' : 'Cadastre um endereço de entrega', 'err');
      let id;
      update(d => {
        const sub = subtotal(d.cart), fee = feeFor(m.type, sub), a = meOf(d).addresses[m.addr] || meOf(d).addresses[0];
        id = d.seq++;
        d.orders.push({ id, customer: meOf(d).name, phone: meOf(d).phone, email: meOf(d).email, address: m.type === 'entrega' ? `${a.line}${a.district ? ' — ' + a.district : ''}` : '', ref: '', type: m.type, items: d.cart.map(i => ({ ...i, step: 0 })), status: 'novo', hist: { novo: now() }, created: now(), pay: m.pay, obs: d.cart.map(i => i.obs).filter(Boolean).join(' · '), fee, total: sub + fee, driver: null, source: 'app' });
        d.cart = [];
      });
      go(`acompanhar.html?id=${id}`, 'Pedido enviado para a pizzaria!');
    }
  });
  v.addEventListener('input', e => {
    if (e.target.id !== 'guestAddr') return;
    const line = e.target.value.trim();
    update(d => { d.guest.addresses = line ? [{ label: 'Entrega', line, district: '', city: 'Rio Branco - AC', cep: '', main: true }] : []; });
  });
  v.addEventListener('change', e => {
    if (e.target.name === 'tipo') update(d => d.cartMeta.type = e.target.value);
    if (e.target.name === 'pg') update(d => d.cartMeta.pay = e.target.value);
    if (e.target.id === 'addrSel') update(d => d.cartMeta.addr = +e.target.value);
    render();
  });
  render();
};
P['cliente-pedidos'] = () => {
  render = () => {
    const f = ($('input[name=f]:checked') || {}).value || 'all';
    const mine = db.orders.filter(isMine).sort((a, b) => b.created - a.created);
    const list = mine.filter(o => f === 'all' || (f === 'and' ? active(o) : !active(o)));
    $('#list').innerHTML = list.length ? list.map(o => `<div class="card col g10"><div class="row between g8"><b class="md xb">${dfmt(o.created)}</b>${badgeOf(o)}</div><span class="xs muted b">Pedido #${o.id}</span><p class="sm">${o.items.map(itemLabel).map(esc).join(', ')}</p><div class="divider"></div>${kv('Total', brl(o.total), '', 'font-family:Fredoka,sans-serif;color:var(--primary);font-size:17px')}
      <div class="row g8"><button class="btn secondary sm grow" data-repeat="${o.id}">${ic('repeat', 15)} Repetir</button><a class="btn info sm grow" href="acompanhar.html?id=${o.id}">${active(o) ? 'Acompanhar' : 'Detalhes'}</a>
      ${o.status === 'entregue' ? `<button class="ib rate ${o.rating ? 'rated' : ''}" data-rate="${o.id}" aria-label="Avaliar">${o.rating ? `<b class="xs">${o.rating}★</b>` : ic('thumb', 18)}</button>` : ''}</div></div>`).join('')
      : `<div class="empty">${ic('list', 36)}<b>Nenhum pedido aqui</b><span>Seus pedidos aparecem nesta lista.</span><a class="btn primary" href="inicio.html">Fazer um pedido</a></div>`;
    paintCommon();
  };
  $('#list').addEventListener('click', e => {
    const r = e.target.closest('[data-repeat]'); const rt = e.target.closest('[data-rate]');
    if (r) { const o = order(r.dataset.repeat); update(d => { o.items.forEach(i => { const p = d.menu.find(x => x.id === i.pid); if (p && p.available) d.cart.push({ ...i, unit: unitPrice(p, i.size, i.border), step: 0 }); }); }); go('carrinho.html', 'Itens adicionados ao carrinho'); }
    if (rt) rateModal(+rt.dataset.rate);
  });
  $$('input[name=f]').forEach(x => x.addEventListener('change', render));
  render();
};
function rateModal(id) {
  const o = order(id);
  modal({ title: `Avaliar pedido #${id}`, body: `<p class="muted">Como foi sua experiência?</p><div class="stars">${[5, 4, 3, 2, 1].map(n => `<input type="radio" name="r" id="r${n}" value="${n}" ${o.rating == n ? 'checked' : ''}><label for="r${n}" aria-label="${n} estrelas">${ic('star', 32)}</label>`).join('')}</div><label class="fld"><span>Comentário (opcional)</span><textarea class="input" name="c" placeholder="Conte o que achou">${esc(o.comment || '')}</textarea></label>`,
    ok: 'Enviar avaliação', onOk: f => { const r = f.r.value; if (!r) return 'Escolha de 1 a 5 estrelas.'; update(d => { const x = d.orders.find(y => y.id === id); x.rating = +r; x.comment = f.c.value; }); toast('Obrigado pela avaliação!'); render(); } });
}
P['cliente-acompanhar'] = () => {
  const HERO = {
    novo: ['box', 'Pedido recebido!', 'Seu pedido foi recebido e está aguardando a confirmação da pizzaria.'],
    confirmado: ['checkCircle', 'Pedido confirmado!', 'A pizzaria confirmou seu pedido e em breve começará a prepará-lo.'],
    preparo: ['chef', 'Pedido em preparo!', 'Sua pizza está sendo montada e assada com carinho pelos nossos pizzaiolos.'],
    pronto: ['pizza', 'Pedido pronto!', 'Sua pizza saiu do forno e aguarda o entregador.'],
    rota: ['bike', 'Saiu para entrega!', 'O entregador está a caminho do seu endereço.'],
    entregue: ['home', 'Pedido entregue!', 'Aproveite sua pizza! Obrigado pela preferência.'],
    cancelado: ['x', 'Pedido cancelado', 'Este pedido foi cancelado. Se precisar, faça um novo pedido.'] };
  render = () => {
    const mine = db.orders.filter(isMine).sort((a, b) => b.created - a.created);
    const o = order(qs('id')) || mine[0];
    if (!o) { $('#track').innerHTML = `<div class="empty">${ic('list', 36)}<b>Nenhum pedido para acompanhar</b><a class="btn primary" href="inicio.html">Fazer um pedido</a></div>`; return; }
    const steps = o.type === 'retirada' ? ST.filter(s => s !== 'rota') : ST;
    const labels = { ...{ novo: 'Pedido recebido', confirmado: 'Confirmado', preparo: 'Em preparo', pronto: 'Pronto', rota: 'Saiu para entrega', entregue: 'Entregue' }, ...(o.type === 'retirada' ? { pronto: 'Pronto para retirada', entregue: 'Retirado na loja' } : {}) };
    const cur = steps.indexOf(o.status), fin = o.status === 'entregue', canc = o.status === 'cancelado';
    let [k, t, d] = HERO[o.status];
    if (o.status === 'rota' && o.driver) d = `O entregador ${o.driver} está a caminho do seu endereço.`;
    if (o.status === 'pronto' && o.type === 'retirada') d = `Pode vir buscar! ${STORE_ADDR}.`;
    if (fin && o.type === 'retirada') t = 'Pedido retirado!';
    const eta = o.created + (o.type === 'entrega' ? 55 : 35) * MIN;
    $('#track').innerHTML = `<div><h2>Pedido nº ${o.id}</h2><p class="sm b muted">Feito às ${hm(o.created)} · ${ago(o.created)}</p></div>
    <div class="statushero ${fin ? 'ok' : canc ? 'bad' : ''}"><span class="circ">${ic(k, 30)}</span><div class="col g4"><h3>${t}</h3><span class="xs muted">${d}</span>${!fin && !canc ? `<span class="row g4 xb" style="color:var(--primaryDark);font-size:12px">${ic('clock', 13)} Previsão: ${hm(eta - 10 * MIN)} – ${hm(eta + 10 * MIN)}</span>` : ''}</div></div>
    ${canc ? '' : `<div class="card timeline">${steps.map((s, j) => { const c = j < cur ? 'done' : j === cur ? 'cur' + (fin ? ' final' : '') : ''; const dot = j < cur || (fin && j === cur) ? ic('check', 12, '#fff', 3) : ''; const right = j === cur ? '<span class="now">agora</span>' : j < cur ? `<span class="sm muted">${o.hist[s] ? hm(o.hist[s]) : '—'}</span>` : '<span class="sm muted">—</span>'; return `<div class="tl ${c}"><div class="rail"><span class="dot">${dot}</span>${j < steps.length - 1 ? '<span class="line"></span>' : ''}</div><div class="lbl"><span>${labels[s]}</span>${right}</div></div>`; }).join('')}</div>`}
    <div class="card col g8"><b class="xb">Itens do pedido</b>${o.items.map(i => kv(esc(itemLabel(i)), brl(i.unit * i.qty))).join('')}${o.fee ? kv('Taxa de entrega', brl(o.fee)) : ''}<div class="divider"></div>${kv('Total', brl(o.total), 'total')}
    <span class="row g6 xs muted">${ic(o.type === 'entrega' ? 'pin' : 'store', 14)} ${o.type === 'entrega' ? 'Entrega em ' + esc(o.address) : 'Retirada na loja'} · ${esc(o.pay)}</span></div>
    ${fin ? `<button class="btn hl full" data-rate="${o.id}">${ic('star', 16)} ${o.rating ? `Sua avaliação: ${o.rating} estrela${o.rating > 1 ? 's' : ''}` : 'Avaliar pedido'}</button>` : ''}
    ${o.status === 'novo' ? `<button class="btn danger-soft full" id="cancel">Cancelar pedido</button>` : ''}
    ${!fin && !canc ? `<div class="proto-note">${ic('sparkle', 14)} Demonstração: <button class="linkbtn" id="sim">simular próximo status →</button></div>` : ''}`;
    paintCommon();
  };
  $('#track').addEventListener('click', e => {
    const o = order(qs('id')) || db.orders.filter(isMine).sort((a, b) => b.created - a.created)[0];
    if (e.target.closest('#sim')) {
      const steps = o.type === 'retirada' ? ST.filter(s => s !== 'rota') : ST;
      const nx = steps[steps.indexOf(o.status) + 1];
      setStatus(o.id, nx, nx === 'rota' && !o.driver ? { driver: 'Lucas' } : {}); render();
    }
    if (e.target.closest('#cancel')) modal({ title: 'Cancelar pedido?', body: '<p class="muted">O pedido ainda não foi confirmado pela pizzaria e pode ser cancelado sem custo.</p>', ok: 'Sim, cancelar', okClass: 'danger', cancel: 'Voltar', onOk: () => { setStatus(o.id, 'cancelado'); toast('Pedido cancelado', 'info'); render(); } });
    const rt = e.target.closest('[data-rate]'); if (rt) rateModal(+rt.dataset.rate);
  });
  render(); setInterval(render, 20000);
};
P['cliente-perfil'] = () => {
  if (isGuest()) { go('inicio.html'); return; }
  render = () => {
    const u = db.user;
    $('#profile').innerHTML = `<div class="card col g4" style="align-items:center;padding:22px"><span class="avatar-xl">${initials(u.name)}</span><h2 style="margin-top:8px;font-size:20px">${esc(u.name)}</h2><span class="sm muted">${esc(u.email)}</span><span class="sm muted">${esc(u.phone)}</span></div>
    <div class="row between"><b class="md xb">Endereços</b><button class="linkbtn sm" id="addAddr">+ Adicionar</button></div>
    ${u.addresses.map((a, i) => `<div class="card flat addr ${a.main ? 'principal' : ''}"><span class="ib soft">${ic('pin')}</span><div class="grow"><div class="row g8"><b>${esc(a.label)}</b>${a.main ? `<span class="badge b-aguardando" style="padding:2px 8px">${ic('star', 11)} Principal</span>` : `<button class="linkbtn xs" data-main="${i}">Tornar principal</button>`}</div><div class="sm">${esc(a.line)}</div><div class="xs muted">${esc([a.district, a.city, a.cep].filter(Boolean).join(' · '))}</div></div><button class="ib" style="width:36px;height:36px" data-edit="${i}" aria-label="Editar endereço">${ic('edit', 16)}</button></div>`).join('') || '<p class="muted sm">Nenhum endereço cadastrado.</p>'}
    <div class="card menu-list" style="padding:2px 16px">
      <a href="pedidos.html">${ic('list', 20, '#7A6A5E')}<span>Meus pedidos</span>${ic('chevR', 18, '#7A6A5E')}</a>
      <a href="#" data-soon="Formas de pagamento">${ic('card', 20, '#7A6A5E')}<span>Formas de pagamento</span>${ic('chevR', 18, '#7A6A5E')}</a>
      <a href="#" data-soon="Notificações">${ic('bell', 20, '#7A6A5E')}<span>Notificações</span>${ic('chevR', 18, '#7A6A5E')}</a>
      <a href="#" id="logout" style="color:var(--red)">${ic('logout', 20)}<span>Sair da conta</span></a></div>`;
    paintCommon();
  };
  const addrModal = i => { const a = i != null ? db.user.addresses[i] : { label: '', line: '', district: '', city: 'Rio Branco - AC', cep: '' };
    modal({ title: i != null ? 'Editar endereço' : 'Novo endereço', body: field('Apelido', 'label', a.label, 'text', 'placeholder="Casa, Trabalho..."') + field('Rua e número', 'line', a.line) + `<div class="row g10">${field('Bairro', 'district', a.district)}${field('CEP', 'cep', a.cep)}</div>` + field('Cidade', 'city', a.city) + (i != null ? '<button type="button" class="linkbtn sm" style="color:var(--red);align-self:flex-start" id="delAddr">Excluir endereço</button>' : ''),
      onMount: (f, close) => { const d = $('#delAddr', f); d && (d.onclick = () => { update(x => { const was = x.user.addresses[i].main; x.user.addresses.splice(i, 1); if (was && x.user.addresses[0]) x.user.addresses[0].main = true; x.cartMeta.addr = 0; }); close(); render(); toast('Endereço excluído', 'info'); }); },
      onOk: f => { if (!f.label.value.trim() || !f.line.value.trim()) return 'Preencha o apelido e a rua.'; update(x => { const n = { label: f.label.value.trim(), line: f.line.value.trim(), district: f.district.value.trim(), city: f.city.value.trim(), cep: f.cep.value.trim(), main: i != null ? a.main : !x.user.addresses.length }; i != null ? x.user.addresses[i] = n : x.user.addresses.push(n); }); render(); toast('Endereço salvo'); } }); };
  $('#profile').addEventListener('click', e => {
    const m = e.target.closest('[data-main]'), ed = e.target.closest('[data-edit]'), s = e.target.closest('[data-soon]');
    if (m) { update(d => d.user.addresses.forEach((a, i) => a.main = i == m.dataset.main)); render(); }
    if (ed) addrModal(+ed.dataset.edit);
    if (e.target.closest('#addAddr')) addrModal(null);
    if (s) { e.preventDefault(); toast(`${s.dataset.soon}: disponível na próxima versão`, 'info'); }
    if (e.target.closest('#logout')) { e.preventDefault(); update(d => d.session.client = false); go('login.html', 'Você saiu da conta', 'info'); }
  });
  $('#editProfile').onclick = () => modal({ title: 'Editar perfil', body: field('Nome completo', 'name', db.user.name) + field('E-mail', 'email', db.user.email, 'email') + field('Telefone', 'phone', db.user.phone, 'tel'),
    onMount: f => phoneMask(f.phone), onOk: f => { if (!f.name.value.trim()) return 'Informe o nome.'; if (!/^\S+@\S+\.\S+$/.test(f.email.value)) return 'E-mail inválido.'; const old = db.user.email; update(d => { d.user.name = f.name.value.trim(); d.user.email = f.email.value.trim(); d.user.phone = f.phone.value.trim(); d.orders.forEach(o => { if (o.email === old) o.email = d.user.email; }); }); render(); toast('Perfil atualizado'); } });
  render();
};

/* ---------- EQUIPE (terminal) ---------- */
P['equipe-perfil'] = () => {
  render = () => {
    const fx = ($('input[name=fx]:checked') || {}).value || 'all';
    $('#profiles').innerHTML = db.staff.filter(s => fx === 'all' || s.role === fx).map(s => { const cook = s.role === 'Cozinheiro';
      return `<button class="card profile" data-staff="${s.id}"><span class="pav" style="background:${cook ? 'var(--yellowSoft)' : 'var(--primarySoft)'};color:${cook ? 'var(--yellowDark)' : 'var(--primary)'}">${initials(s.name)}</span><h3 style="font-size:19px">${esc(s.name)}</h3><span class="tag">${ic(cook ? 'chef' : 'headset', 14)} ${s.role}</span></button>`; }).join('');
  };
  const clock = () => $('#clock').textContent = hm(now()); clock(); setInterval(clock, 10000);
  $$('input[name=fx]').forEach(x => x.addEventListener('change', render));
  $('#profiles').addEventListener('click', e => { const b = e.target.closest('[data-staff]'); b && openPin(b.dataset.staff); });
  render();
  if (qs('u')) openPin(qs('u'));
};
function openPin(id) {
  const s = db.staff.find(x => x.id === id); if (!s) return;
  let pin = '';
  const ov = document.createElement('div'); ov.className = 'overlay';
  ov.innerHTML = `<div class="modal" role="dialog" aria-label="Digite seu PIN"><div class="row g12" style="width:100%"><span class="av" style="width:48px;height:48px;font-size:18px">${initials(s.name)}</span><div class="grow"><b class="md">${esc(s.name)}</b><div class="sm muted">${s.role}</div></div><button class="ib js-x" style="width:36px;height:36px" aria-label="Fechar">${ic('x', 18)}</button></div>
  <h2>Digite seu PIN</h2><div class="pinbox" id="pinbox">${'<span class="pd"></span>'.repeat(4)}</div><p class="form-err" id="pinErr" hidden>PIN incorreto. Tente novamente.</p>
  <div class="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button type="button" data-k="${n}">${n}</button>`).join('')}<button type="button" class="k-x" data-k="clear" aria-label="Limpar">${ic('x', 22, 'currentColor', 2.4)}</button><button type="button" data-k="0">0</button><button type="button" class="k-del" data-k="del" aria-label="Apagar">${ic('del', 22)}</button></div>
  <button class="btn primary full lg" id="pinGo" disabled>Entrar</button><span class="xs muted">PIN de demonstração: <b>${db.pin}</b> · use o teclado numérico também</span></div>`;
  document.body.append(ov);
  const paint = () => { $$('.pd', ov).forEach((d, i) => { d.classList.toggle('on', i < pin.length); d.classList.toggle('cur', i === pin.length); }); $('#pinGo', ov).disabled = pin.length < 4; };
  const submit = () => {
    if (pin === db.pin) { update(d => { if (s.role === 'Cozinheiro') d.session.cook = s.id; else d.session.staff = s.id; }); go(s.role === 'Cozinheiro' ? '../cozinha/pedidos.html' : '../atendente/pedidos.html', `Turno iniciado, ${first(s.name)}!`); }
    else { const b = $('#pinbox', ov); b.classList.remove('shake'); void b.offsetWidth; b.classList.add('shake'); $('#pinErr', ov).hidden = false; pin = ''; paint(); }
  };
  const key = k => { if (k === 'del') pin = pin.slice(0, -1); else if (k === 'clear') pin = ''; else if (pin.length < 4) { pin += k; $('#pinErr', ov).hidden = true; } paint(); if (pin.length === 4) setTimeout(submit, 180); };
  const close = () => { ov.remove(); document.removeEventListener('keydown', kb); history.replaceState(null, '', location.pathname); };
  const kb = e => { if (/^\d$/.test(e.key)) key(e.key); else if (e.key === 'Backspace') key('del'); else if (e.key === 'Escape') close(); else if (e.key === 'Enter' && pin.length === 4) submit(); };
  ov.addEventListener('click', e => { const b = e.target.closest('[data-k]'); if (b) key(b.dataset.k); if (e.target.closest('.js-x') || e.target === ov) close(); if (e.target.closest('#pinGo')) submit(); });
  document.addEventListener('keydown', kb); paint();
}

/* ---------- ATENDENTE ---------- */
const ocardHTML = o => `<a class="card ocard ${o.status === 'novo' ? 'novo' : ''}" href="detalhe-pedido.html?id=${o.id}"><div class="row between"><h3 class="pr">#${o.id}</h3><span class="row g4 xs b muted">${ic('clock', 13)} ${hm(o.created)} · ${ago(o.created)}</span></div><b class="md xb">${esc(o.customer)}</b><span class="sm muted">${itemsText(o.items)} · ${brl(o.total)}</span><div class="divider"></div><div class="row between g8"><span class="row g6 sm b muted">${ic(o.type === 'entrega' ? 'truck' : 'store', 16)} ${o.type === 'entrega' ? 'Entrega' : 'Retirada'}${o.source === 'app' ? ' · App' : ''}</span>${badgeOf(o)}</div></a>`;
P['atendente-pedidos'] = () => {
  $('#today').textContent = longDate();
  const F = { all: ['Ativos', active], novo: ['Novos', o => o.status === 'novo'], cozinha: ['Na cozinha', o => ['confirmado', 'preparo'].includes(o.status)], pronto: ['Prontos', o => o.status === 'pronto'], rota: ['Em rota', o => o.status === 'rota'], fim: ['Finalizados', o => !active(o)] };
  let cur = 'all';
  render = () => {
    $('#fchips').innerHTML = Object.entries(F).map(([k, [l, fn]]) => `<button class="chip ${k === cur ? 'on' : ''}" data-f="${k}">${l} · ${db.orders.filter(fn).length}</button>`).join('');
    const q = $('#search').value.trim().toLowerCase().replace('#', '');
    const list = db.orders.filter(F[cur][1]).filter(o => !q || String(o.id).includes(q) || o.customer.toLowerCase().includes(q)).sort((a, b) => (a.status === 'novo') - (b.status === 'novo') ? (b.status === 'novo') - (a.status === 'novo') : b.created - a.created);
    $('#grid').innerHTML = list.length ? list.map(ocardHTML).join('') : `<div class="empty" style="grid-column:1/-1">${ic('list', 36)}<b>Nenhum pedido neste filtro</b></div>`;
    const n = db.orders.filter(o => o.status === 'novo').length; const bc = $('#bellCount'); bc.textContent = n; bc.hidden = !n;
    paintCommon();
  };
  $('#fchips').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { cur = b.dataset.f; render(); } });
  $('#bell').onclick = () => { cur = 'novo'; render(); };
  $('#search').addEventListener('input', render);
  render(); setInterval(render, 30000);
};
P['atendente-novo'] = () => {
  const f = $('#newOrder');
  let rows = [{ pid: 'p1', size: 'G', border: 'tradicional', qty: 1 }];
  const pizzas = () => db.menu.filter(p => p.cat !== 'bebida' && p.available), drinks = () => db.menu.filter(p => p.cat === 'bebida' && p.available);
  $('#seq').textContent = db.seq;
  const paint = () => {
    const type = f.rec.value;
    $('#addrGrid').hidden = type !== 'entrega';
    $('#itemsBody').innerHTML = rows.map((r, i) => { const p = product(r.pid); const isP = p.cat !== 'bebida';
      return `<tr><td><span class="input" style="height:38px;min-width:180px"><select data-i="${i}" data-k="pid">${(isP ? pizzas() : drinks()).map(x => `<option value="${x.id}" ${x.id === r.pid ? 'selected' : ''}>${isP ? 'Pizza ' : ''}${esc(x.name)}</option>`).join('')}</select></span></td>
      <td>${isP ? `<span class="input" style="height:38px;width:120px"><select data-i="${i}" data-k="size">${Object.keys(SIZES).map(s => `<option value="${s}" ${s === r.size ? 'selected' : ''}>${SIZE_NAME[s]}</option>`).join('')}</select></span>` : '<span class="muted">—</span>'}</td>
      <td>${isP ? `<span class="input" style="height:38px;width:130px"><select data-i="${i}" data-k="border">${Object.entries(BORDERS).map(([k, b]) => `<option value="${k}" ${k === r.border ? 'selected' : ''}>${b[0]}${b[1] ? ' +' + b[1] : ''}</option>`).join('')}</select></span>` : '<span class="muted">—</span>'}</td>
      <td><span class="stepper"><button type="button" data-dec="${i}" aria-label="Diminuir">${ic('minus', 14)}</button><b>${r.qty}</b><button type="button" class="plus" data-inc="${i}" aria-label="Aumentar">${ic('plus', 14)}</button></span></td>
      <td><b style="color:var(--primary)">${brl(unitPrice(p, r.size, r.border) * r.qty)}</b></td><td><button type="button" class="ib" style="width:32px;height:32px" data-rm="${i}" aria-label="Remover">${ic('x', 16)}</button></td></tr>`; }).join('') || `<tr><td colspan="6" class="muted tc" style="padding:20px">Nenhum item. Adicione uma pizza ou bebida.</td></tr>`;
    const items = rows.map(r => makeItem(db.menu, r.pid, r.qty, r.size, r.border));
    const sub = subtotal(items), fee = feeFor(type, sub);
    $('#summary').innerHTML = (items.map(i => kv(esc(itemLabel(i)), brl(i.unit * i.qty))).join('') || '<span class="muted sm">Sem itens</span>') + `<div class="divider"></div>${kv('Subtotal', brl(sub))}${type === 'entrega' ? kv('Taxa de entrega', fee ? brl(fee) : 'Grátis') : ''}${kv('Total', brl(sub + fee), 'total')}`;
  };
  f.addEventListener('change', e => { const s = e.target.closest('select[data-i]'); if (s) { rows[s.dataset.i][s.dataset.k] = s.value; } paint(); });
  f.addEventListener('click', e => {
    const d = e.target.closest('[data-dec]'), n = e.target.closest('[data-inc]'), r = e.target.closest('[data-rm]');
    if (d) { const x = rows[d.dataset.dec]; x.qty = Math.max(1, x.qty - 1); paint(); }
    if (n) { rows[n.dataset.inc].qty++; paint(); }
    if (r) { rows.splice(r.dataset.rm, 1); paint(); }
    if (e.target.closest('#addPizza')) { rows.push({ pid: pizzas()[0].id, size: 'G', border: 'tradicional', qty: 1 }); paint(); }
    if (e.target.closest('#addDrink')) { rows.push({ pid: drinks()[0].id, qty: 1 }); paint(); }
  });
  f.onsubmit = e => {
    e.preventDefault();
    const v = k => f[k].value.trim(); const type = f.rec.value;
    if (!v('name')) return formErr(f, 'Informe o nome do cliente.');
    if (v('phone').replace(/\D/g, '').length < 10) return formErr(f, 'Informe um telefone válido com DDD.');
    if (type === 'entrega' && (!v('address') || !v('number'))) return formErr(f, 'Informe endereço e número para entrega.');
    if (!rows.length) return formErr(f, 'Adicione pelo menos um item.');
    let id;
    update(d => {
      const items = rows.map(r => makeItem(d.menu, r.pid, r.qty, r.size, r.border)); const sub = subtotal(items), fee = feeFor(type, sub);
      id = d.seq++;
      const t = now();
      d.orders.push({ id, customer: v('name'), phone: v('phone'), email: '', address: type === 'entrega' ? `${v('address')}, ${v('number')}${v('district') ? ' — ' + v('district') : ''}${v('comp') ? ' (' + v('comp') + ')' : ''}` : '', ref: v('ref'), type, items, status: 'confirmado', hist: { novo: t, confirmado: t }, created: t, pay: f.pg.value, obs: v('obs'), fee, total: sub + fee, driver: null, source: 'balcao' });
    });
    go(`detalhe-pedido.html?id=${id}`, `Pedido #${id} enviado para a cozinha`);
  };
  paint(); paintCommon();
};
function hsteps(cur, labels, times) {
  return `<div class="steps">${labels.map((l, i) => { const s = i < cur ? 'done' : i === cur ? 'cur' : ''; return `<div class="st ${s}"><span class="d">${i < cur ? ic('check', 12, 'currentColor', 3) : i + 1}</span><span>${l}${times && times[i] ? `<small class="muted" style="display:block;font-weight:600">${times[i]}</small>` : ''}</span></div>${i < labels.length - 1 ? `<span class="ln ${i < cur ? 'done' : ''}"></span>` : ''}`; }).join('')}</div>`;
}
P['atendente-detalhe'] = () => {
  render = () => {
    const o = order(qs('id'));
    if (!o) { $('#detail').innerHTML = `<div class="empty">${ic('alert', 36)}<b>Pedido não encontrado</b><a class="btn primary" href="pedidos.html">Voltar para pedidos</a></div>`; return; }
    const steps = o.type === 'retirada' ? ST.filter(s => s !== 'rota') : ST;
    const L = { novo: 'Novo', confirmado: 'Confirmado', preparo: 'Em preparo', pronto: 'Pronto', rota: 'Em rota', entregue: o.type === 'retirada' ? 'Retirado' : 'Entregue' };
    let act = '';
    const B = (id, cls, label, icon) => `<button class="btn ${cls}" data-act="${id}">${icon ? ic(icon, 18) : ''} ${label}</button>`;
    if (o.status === 'novo') act = B('cancel', 'danger-soft', 'Cancelar pedido') + B('confirm', 'primary', 'Confirmar e enviar à cozinha', 'check');
    else if (['confirmado', 'preparo'].includes(o.status)) act = `<span class="info-pill">${ic('chef', 16)} Pedido na cozinha${o.status === 'preparo' ? ' — em preparo' : ' — aguardando início'}</span>` + B('ready', 'secondary', 'Marcar como pronto', 'check');
    else if (o.status === 'pronto' && o.type === 'retirada') act = `<span class="info-pill">${ic('store', 16)} Aguardando o cliente no balcão</span>` + B('done', 'hl', 'Entregar ao cliente', 'check');
    else if (o.status === 'pronto' && !o.driver) act = `<a class="btn primary" href="atribuir.html?sel=${o.id}">${ic('bike', 18)} Atribuir entregador</a>`;
    else if (o.status === 'pronto') act = `<span class="info-pill">${ic('bike', 16)} Aguardando retirada por ${esc(o.driver)}</span>` + B('route', 'info', `Entregar ao ${esc(o.driver)}`);
    else if (o.status === 'rota') act = `<span class="info-pill">${ic('bike', 16)} Em rota com ${esc(o.driver)} desde ${hm(o.hist.rota)}</span>`;
    else if (o.status === 'entregue') act = `<span class="info-pill ok">${ic('checkCircle', 16)} ${L.entregue} às ${hm(o.hist.entregue)}${o.rating ? ` · avaliação ${o.rating}★` : ''}</span>`;
    else act = `<span class="info-pill bad">${ic('x', 16)} Pedido cancelado</span>`;
    $('#detail').innerHTML = `<div class="phead"><div class="row g12 wrap"><a class="ib" href="pedidos.html" aria-label="Voltar">${ic('back')}</a><h1>Pedido #${o.id}</h1>${badgeOf(o)}${o.source === 'app' ? '<span class="tag">' + ic('phoneM', 13) + ' via app</span>' : '<span class="tag">' + ic('headset', 13) + ' balcão/telefone</span>'}</div><span class="row g6 sm b muted">${ic('clock', 16)} Feito às ${hm(o.created)} · ${ago(o.created)}</span></div>
    ${o.status === 'cancelado' ? '' : `<div class="card flat" style="padding:16px 24px">${hsteps(steps.indexOf(o.status) + (o.status === 'entregue' ? 1 : 0), steps.map(s => L[s]), steps.map(s => o.hist[s] ? hm(o.hist[s]) : ''))}</div>`}
    <div class="split even"><div class="col g16">
      <div class="card col g10" style="padding:20px"><h3 class="row g8"><span style="color:var(--primary)">${ic('user', 18)}</span>Cliente</h3>${kv('Nome', esc(o.customer))}${kv('Telefone', `<a href="tel:${o.phone.replace(/\D/g, '')}">${esc(o.phone)}</a>`)}</div>
      <div class="card col g10" style="padding:20px"><h3>Itens</h3>${o.items.map(i => kv(esc(itemLabel(i)), brl(i.unit * i.qty)) + (i.obs ? `<span class="xs b" style="color:var(--yellowDark)">↳ ${esc(i.obs)}</span>` : '')).join('<div class="divider"></div>')}${o.fee ? `<div class="divider"></div>${kv('Taxa de entrega', brl(o.fee))}` : ''}</div></div>
    <div class="col g16"><div class="card col g8" style="padding:20px"><h3 class="row g8"><span style="color:var(--primary)">${ic(o.type === 'entrega' ? 'truck' : 'store', 18)}</span>Recebimento · ${o.type === 'entrega' ? 'Entrega' : 'Retirada na loja'}</h3>${o.type === 'entrega' ? `<b>${esc(o.address)}</b>${o.ref ? `<span class="sm muted">Referência: ${esc(o.ref)}</span>` : ''}${o.driver ? `<span class="sm muted">Entregador: <b>${esc(o.driver)}</b></span>` : ''}` : `<span class="sm muted">${STORE_ADDR}</span>`}</div>
      <div class="card row g12" style="padding:20px"><span class="ib" style="background:var(--greenSoft);border:0;color:var(--green)">${ic('money')}</span><div class="grow"><h3>Pagamento</h3><span class="sm muted">${esc(o.pay)}${o.pay === 'Pix' && o.source === 'app' ? ' · pago' : ' · na entrega'}</span></div><span class="bignum2" style="color:var(--primary)">${brl(o.total)}</span></div>
      ${o.obs ? `<div class="obs"><span class="cap">Observações</span><div class="md xb">${esc(o.obs)}</div></div>` : ''}</div></div>
    <div class="row end g12 wrap actbar"><a class="btn neutral" href="pedidos.html">Voltar para pedidos</a>${act}</div>`;
    paintCommon();
  };
  $('#detail').addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return; const o = order(qs('id'));
    ({ confirm: () => { setStatus(o.id, 'confirmado'); toast(`Pedido #${o.id} enviado à cozinha`); },
       cancel: () => modal({ title: `Cancelar pedido #${o.id}?`, body: '<p class="muted">O cliente verá o pedido como cancelado.</p>', ok: 'Cancelar pedido', okClass: 'danger', cancel: 'Voltar', onOk: () => { setStatus(o.id, 'cancelado'); toast('Pedido cancelado', 'info'); render(); } }),
       ready: () => { setStatus(o.id, 'pronto'); toast(`Pedido #${o.id} marcado como pronto`); },
       done: () => { setStatus(o.id, 'entregue'); toast('Pedido entregue ao cliente'); },
       route: () => { setStatus(o.id, 'rota'); toast(`Pedido #${o.id} saiu com ${o.driver}`); } })[b.dataset.act]();
    render();
  });
  render(); setInterval(render, 30000);
};
const mapPos = id => ({ x: 8 + (id * 53) % 78, y: 10 + (id * 31) % 70 });
P['atendente-atribuir'] = () => {
  const sel = new Set(qs('sel') ? [+qs('sel')] : []);
  const drv = $('#driver');
  render = () => {
    const avail = db.orders.filter(o => o.status === 'pronto' && o.type === 'entrega' && !o.driver);
    [...sel].forEach(id => { if (!avail.find(o => o.id === id)) sel.delete(id); });
    const d = drv.value || db.drivers[0];
    drv.innerHTML = db.drivers.map(n => `<option value="${n}" ${n === d ? 'selected' : ''}>${n}${db.driverOn[n] ? '' : ' (fora de serviço)'}</option>`).join('');
    const inRoute = db.orders.filter(o => o.driver === d && o.status === 'rota').length, waiting = db.orders.filter(o => o.driver === d && o.status === 'pronto').length;
    $('#driverInfo').innerHTML = `${badge(db.driverOn[d] ? 'pronto' : 'off', db.driverOn[d] ? `${inRoute} em rota · ${waiting} aguardando` : 'Fora de serviço')}`;
    $('#pickList').innerHTML = avail.length ? avail.map(o => `<label class="pickw"><input class="hidden-input" type="checkbox" value="${o.id}" ${sel.has(o.id) ? 'checked' : ''}><span class="pick"><span class="cb">${ic('check', 14, 'currentColor', 3)}</span><span class="grow col"><span class="row between"><span class="pr">#${o.id}</span><span class="xs muted">pronto ${ago(o.hist.pronto)}</span></span><b>${esc(o.customer)}</b><span class="xs muted">${itemsText(o.items)}</span><span class="xs muted row g4">${ic('pin', 13)} ${esc(o.address)}</span></span></span></label>`).join('')
      : `<div class="empty" style="padding:24px 8px">${ic('checkCircle', 32)}<b>Nenhum pedido pronto aguardando entregador</b><a class="btn neutral sm" href="entregas.html">Ver entregas</a></div>`;
    $('#markers').innerHTML = avail.map(o => { const p = mapPos(o.id); return `<button class="mk ${sel.has(o.id) ? 'sel' : ''}" data-mk="${o.id}" style="left:${p.x}%;top:${p.y}%">${ic('pin', 14)}#${o.id}</button>`; }).join('');
    $('#selCount').textContent = sel.size ? `${sel.size} pedido${sel.size > 1 ? 's' : ''} selecionado${sel.size > 1 ? 's' : ''}` : 'Selecione pedidos na lista ou no mapa';
    $('#assignBtn').disabled = !sel.size; $('#assignBtn').textContent = sel.size ? `Atribuir ao ${d}` : 'Atribuir pedidos';
    $('#allBtn').hidden = !avail.length; $('#allBtn').textContent = sel.size === avail.length ? 'Limpar seleção' : 'Selecionar todos';
    paintCommon();
  };
  $('#pickList').addEventListener('change', e => { const id = +e.target.value; e.target.checked ? sel.add(id) : sel.delete(id); render(); });
  $('#markers').addEventListener('click', e => { const m = e.target.closest('[data-mk]'); if (!m) return; const id = +m.dataset.mk; sel.has(id) ? sel.delete(id) : sel.add(id); render(); });
  $('#allBtn').onclick = () => { const avail = db.orders.filter(o => o.status === 'pronto' && o.type === 'entrega' && !o.driver); if (sel.size === avail.length) sel.clear(); else avail.forEach(o => sel.add(o.id)); render(); };
  drv.addEventListener('change', render);
  $('#assignBtn').onclick = () => {
    const d = drv.value;
    if (!db.driverOn[d]) return toast(`${d} está fora de serviço`, 'err');
    const ids = [...sel]; update(x => x.orders.forEach(o => { if (ids.includes(o.id)) o.driver = d; }));
    go('entregas.html', `${ids.length} pedido${ids.length > 1 ? 's' : ''} atribuído${ids.length > 1 ? 's' : ''} ao ${d}`);
  };
  render();
};
P['atendente-entregas'] = () => {
  let tab = 'all';
  render = () => {
    const noDriver = db.orders.filter(o => o.status === 'pronto' && o.type === 'entrega' && !o.driver);
    const pick = db.orders.filter(o => o.status === 'pronto' && o.type === 'retirada');
    $('#hdrBadges').innerHTML = `<a href="atribuir.html">${badge('aguardando', `${noDriver.length} sem entregador`)}</a>${badge('pronto', `${pick.length} aguardando cliente`)}`;
    $$('#tabs a').forEach(a => a.classList.toggle('on', a.dataset.t === tab));
    const groups = db.drivers.map(n => {
      const wait = db.orders.filter(o => o.driver === n && o.status === 'pronto'), route = db.orders.filter(o => o.driver === n && o.status === 'rota');
      return `<div class="card col g10"><div class="row between"><span class="row g10"><span class="av" style="width:32px;height:32px;font-size:13px;background:var(--blueSoft);color:var(--blue)">${n[0]}</span><h3>${n}</h3>${db.driverOn[n] ? '' : '<span class="tag">fora de serviço</span>'}</span><span class="xs b muted">${wait.length} aguardando · ${route.length} em rota</span></div>
      ${wait.map(o => `<a class="li" href="detalhe-pedido.html?id=${o.id}"><span class="pr">#${o.id}</span> <b>— ${esc(o.customer)}</b><div class="xs muted row g4">${ic('pin', 13)} ${esc(o.address)}</div><div style="margin-top:6px">${badge('aguardando', 'Aguardando retirada')}</div></a>`).join('')}
      ${route.map(o => `<a class="li" href="detalhe-pedido.html?id=${o.id}" style="background:var(--blueSoft)"><span class="pr">#${o.id}</span> <b>— ${esc(o.customer)}</b><div class="xs muted row g4">${ic('bike', 13)} saiu às ${hm(o.hist.rota)} · ${esc(o.address)}</div></a>`).join('')}
      ${!wait.length && !route.length ? '<div class="xs muted" style="padding:6px 0">Nenhum pedido atribuído</div>' : ''}
      ${wait.length ? `<button class="btn info full" data-handoff="${n}">Entregar ${wait.length} pedido${wait.length > 1 ? 's' : ''} ao ${n}</button>` : ''}</div>`;
    }).join('');
    $('#drivers').innerHTML = (noDriver.length ? `<div class="alertbar" style="background:var(--yellowSoft);border-color:var(--yellow);color:var(--yellowDark)">${ic('alert', 18)}<b>${noDriver.length} pedido${noDriver.length > 1 ? 's' : ''} pronto${noDriver.length > 1 ? 's' : ''} sem entregador</b><a class="btn primary sm" style="margin-left:auto" href="atribuir.html">Atribuir agora</a></div>` : '') + `<div class="grid2" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));align-items:start">${groups}</div>`;
    $('#pickup').innerHTML = pick.length ? pick.map(o => `<div class="card col g8"><div class="row between"><b><span class="pr">#${o.id}</span> — ${esc(o.customer)}</b>${badgeOf(o)}</div><span class="xs muted">${o.items.map(itemLabel).map(esc).join(', ')}</span><span class="xs b row g4" style="color:var(--yellowDark)">${ic('clock', 13)} Pronto ${ago(o.hist.pronto)} · ${brl(o.total)} (${esc(o.pay)})</span><button class="btn hl full" data-pick="${o.id}">Entregar ao cliente</button></div>`).join('') : `<div class="empty" style="padding:24px">${ic('store', 32)}<b>Nenhuma retirada pendente</b></div>`;
    $('#colDrivers').hidden = tab === 'ret'; $('#colPickup').hidden = tab === 'ent';
    paintCommon();
  };
  document.addEventListener('click', e => {
    const h = e.target.closest('[data-handoff]'), p = e.target.closest('[data-pick]'), t = e.target.closest('#tabs a');
    if (h) { const n = h.dataset.handoff; const ids = db.orders.filter(o => o.driver === n && o.status === 'pronto').map(o => o.id); ids.forEach(id => setStatus(id, 'rota')); toast(`${ids.length} pedido(s) saíram com ${n}`); render(); }
    if (p) { setStatus(+p.dataset.pick, 'entregue'); toast(`Pedido #${p.dataset.pick} entregue ao cliente`); render(); }
    if (t) { e.preventDefault(); tab = t.dataset.t; render(); }
  });
  render(); setInterval(render, 30000);
};

/* ---------- COZINHA ---------- */
const LATE = 25;
P['cozinha-pedidos'] = () => {
  render = () => {
    const f = ($('input[name=kt]:checked') || {}).value || 'all';
    const q = db.orders.filter(o => ['confirmado', 'preparo'].includes(o.status)).sort((a, b) => (a.hist.confirmado || a.created) - (b.hist.confirmado || b.created));
    $$('[data-kc]').forEach(el => { const k = el.dataset.kc; el.textContent = k === 'all' ? q.length : q.filter(o => o.type === k).length; });
    const list = q.filter(o => f === 'all' || o.type === f);
    $('#ksub').textContent = q.length ? `${q.length} pedido${q.length > 1 ? 's' : ''} na fila · ${q.filter(o => o.status === 'preparo').length} em preparo · atualizado ${hm(now())}` : 'Fila vazia · atualizado ' + hm(now());
    $('#kgrid').innerHTML = list.length ? list.map(o => { const w = mins(o.hist.confirmado || o.created), late = w >= LATE, prep = o.status === 'preparo';
      return `<div class="card ocard ${late ? 'late' : ''}" style="gap:10px"><div class="row between"><h3 class="pr" style="font-size:20px">Pedido #${o.id}</h3><span class="row g4 b muted">${ic('clock', 15)} ${hm(o.hist.confirmado || o.created)}</span></div>
      <div class="row g8 wrap">${late ? badge('atrasado', 'Atrasado') : ''}${prep ? badge('preparo', 'Em preparo') : badge('aguardando', 'Aguardando')}<span class="tag">${ic(o.type === 'entrega' ? 'truck' : 'store', 13)} ${o.type === 'entrega' ? 'Entrega' : 'Retirada'}</span></div>
      <div class="col g6" style="flex:1">${o.items.map(i => `<div class="kitem"><b>${i.qty}x</b> ${i.cat === 'bebida' ? esc(i.name) : `Pizza ${esc(i.name)} — ${SIZE_NAME[i.size]}${i.border !== 'tradicional' ? ' · borda ' + BORDERS[i.border][0].toLowerCase() : ''}`}${i.cat !== 'bebida' && prep ? `<small class="kstep">${i.step >= 5 ? 'Finalizada' : STEPS[i.step]}</small>` : ''}${i.obs ? `<div class="xs b" style="color:var(--yellowDark)">${esc(i.obs)}</div>` : ''}</div>`).join('')}${o.obs ? `<div class="obs xs"><b>Obs.:</b> ${esc(o.obs)}</div>` : ''}</div>
      <div class="row between"><span class="xs b ${late ? '' : 'muted'}" style="${late ? 'color:var(--red)' : ''}">${w < 1 ? 'chegou agora' : `há ${w} min`}</span><div class="row g8"><a class="btn neutral sm" href="detalhe.html?id=${o.id}">Ver</a>${prep ? `<button class="btn success sm" data-ready="${o.id}">Marcar pronto</button>` : `<button class="btn primary sm" data-start="${o.id}">Iniciar preparo</button>`}</div></div></div>`; }).join('')
      : `<div class="empty" style="grid-column:1/-1;padding:60px">${ic('chef', 40)}<b>Nenhum pedido na fila</b><span>Os novos pedidos confirmados aparecem aqui automaticamente.</span></div>`;
    paintCommon();
  };
  $('#kgrid').addEventListener('click', e => { const s = e.target.closest('[data-start]'), r = e.target.closest('[data-ready]');
    if (s) { setStatus(+s.dataset.start, 'preparo'); toast(`Preparo do pedido #${s.dataset.start} iniciado`); render(); }
    if (r) { setStatus(+r.dataset.ready, 'pronto'); toast(`Pedido #${r.dataset.ready} pronto! Atendente notificado.`); render(); } });
  $$('input[name=kt]').forEach(x => x.addEventListener('change', render));
  render(); setInterval(render, 20000);
};
P['cozinha-detalhe'] = () => {
  render = () => {
    const o = order(qs('id'));
    if (!o) { $('#kdetail').innerHTML = `<div class="empty">${ic('alert', 36)}<b>Pedido não encontrado</b><a class="btn primary" href="pedidos.html">Voltar</a></div>`; return; }
    const w = mins(o.hist.confirmado || o.created), late = w >= LATE && ['confirmado', 'preparo'].includes(o.status);
    const pizzas = o.items.map((i, k) => [i, k]).filter(([i]) => i.cat !== 'bebida'), drinks = o.items.filter(i => i.cat === 'bebida');
    const allDone = pizzas.every(([i]) => i.step >= 5), inKitchen = ['confirmado', 'preparo'].includes(o.status);
    const started = o.status === 'preparo';
    $('#kdetail').innerHTML = `<div class="row g12"><a class="ib" href="pedidos.html" aria-label="Voltar">${ic('back')}</a><div><h1>Detalhes do pedido</h1><a class="sm b muted" href="pedidos.html">← Voltar para pedidos</a></div></div>
    <div class="card row between wrap g12" style="padding:18px 22px"><div><h2 style="font-size:20px"><span class="pr">Pedido #${o.id}</span> · ${o.type === 'entrega' ? 'Entrega' : 'Retirada'} · ${hm(o.hist.confirmado || o.created)}</h2><div class="xs b muted row g6" style="margin-top:4px">${ic('user', 13)} Cliente: ${esc(o.customer)} · ${ic('clock', 13)} ${inKitchen ? `aguardando há ${w} min` : 'fora da fila da cozinha'}</div></div>${late ? badge('atrasado', 'Atrasado · prioridade') : badgeOf(o)}</div>
    ${o.status === 'confirmado' ? `<div class="alertbar" style="background:var(--primarySoft);border-color:#F7C9A0;color:var(--primaryDark)">${ic('chef', 18)}<b>Pedido aguardando início.</b><span>Comece o preparo para liberar as etapas.</span><button class="btn primary sm" style="margin-left:auto" data-start>Iniciar preparo</button></div>` : ''}
    <div class="split"><div class="col g16">${pizzas.map(([i, k]) => `<div class="card col g12 ${started ? '' : 'is-dim'}"><div class="row between"><h3>${i.qty}x Pizza ${esc(i.name)} — ${SIZE_NAME[i.size]}</h3>${i.step >= 5 ? badge('pronto', 'Finalizada') : started ? badge('preparo', STEPS[i.step]) : badge('aguardando', 'Aguardando')}</div>${hsteps(i.step, STEPS)}
      <div class="row g6 wrap"><span class="tag">Borda ${BORDERS[i.border][0].toLowerCase()}</span>${(product(i.pid) || {}).desc ? `<span class="xs muted">${esc(product(i.pid).desc)}</span>` : ''}</div>${i.obs ? `<div class="obs row g10"><span class="cap">Observação</span><b>${esc(i.obs)}</b></div>` : ''}
      <div class="row end g10"><button class="btn neutral sm" data-prev="${k}" ${!started || i.step === 0 ? 'disabled' : ''}>Etapa anterior</button><button class="btn primary sm" data-next="${k}" ${!started || i.step >= 5 ? 'disabled' : ''}>${i.step >= 4 ? ic('check', 15) + ' Finalizar pizza' : i.step === 3 ? ic('flame', 15) + ' Concluir forno' : 'Concluir ' + STEPS[i.step].toLowerCase()}</button></div></div>`).join('')}
      ${drinks.length ? `<div class="card col g8"><h3>Bebidas</h3>${drinks.map(i => `<div class="kitem"><b>${i.qty}x</b> ${esc(i.name)}</div>`).join('')}<span class="xs muted">Separadas pelo atendimento no balcão.</span></div>` : ''}
      ${o.obs ? `<div class="obs"><span class="cap">Observações do pedido</span><div class="md xb">${esc(o.obs)}</div></div>` : ''}</div>
    <div class="col g16"><div class="card col g12"><h3>Resumo do pedido</h3>${hsteps(o.status === 'confirmado' ? 0 : o.status === 'preparo' ? 1 : 3, ['Recebido', 'Em preparo', 'Pronto'])}${kv('Pizzas', `${pizzas.filter(([i]) => i.step >= 5).length} de ${pizzas.length} finalizadas`)}${kv('Tipo', o.type === 'entrega' ? 'Entrega' : 'Retirada')}${kv('Previsão de saída', hm((o.hist.confirmado || o.created) + LATE * MIN), '', late ? 'color:var(--red)' : '')}</div>
      ${inKitchen ? `<button class="btn success full lg" data-ready ${allDone && started ? '' : 'disabled'}>${ic('check', 18, 'currentColor', 3)} Marcar pedido como pronto</button><p class="xs muted tc">${allDone && started ? 'Tudo pronto! O atendente será notificado.' : 'Finalize todas as pizzas para liberar.'}</p>` : `<a class="btn neutral full" href="pedidos.html">Voltar para a fila</a>`}</div></div>`;
    paintCommon();
  };
  $('#kdetail').addEventListener('click', e => {
    const id = +qs('id');
    if (e.target.closest('[data-start]')) { setStatus(id, 'preparo'); toast('Preparo iniciado'); }
    const n = e.target.closest('[data-next]'), p = e.target.closest('[data-prev]');
    if (n) update(d => { const it = d.orders.find(o => o.id === id).items[n.dataset.next]; it.step = Math.min(5, it.step + 1); });
    if (p) update(d => { const it = d.orders.find(o => o.id === id).items[p.dataset.prev]; it.step = Math.max(0, it.step - 1); });
    if (e.target.closest('[data-ready]')) { setStatus(id, 'pronto'); return go('pedidos.html', `Pedido #${id} pronto! Atendente notificado.`); }
    render();
  });
  render(); setInterval(render, 30000);
};

/* ---------- ENTREGADOR ---------- */
P['entregador-login'] = () => {
  const f = $('#driverLogin');
  f.onsubmit = e => { e.preventDefault(); const u = f.user.value.trim().toLowerCase(); const d = db.drivers.find(n => n.toLowerCase() === u || u.startsWith(n.toLowerCase()));
    if (!d) return formErr(f, 'Entregador não encontrado. Use Lucas, Pedro ou Thiago.'); if (f.password.value.length < 3) return formErr(f, 'Informe sua senha.');
    update(x => { x.session.driver = d; x.driverOn[d] = true; }); go('pedidos.html', `Bom trabalho, ${d}!`); };
};
const me = () => db.session.driver || 'Lucas';
P['entregador-pedidos'] = () => {
  render = () => {
    const d = me(), wait = db.orders.filter(o => o.driver === d && o.status === 'pronto'), route = db.orders.filter(o => o.driver === d && o.status === 'rota');
    const doneToday = db.orders.filter(o => o.driver === d && o.status === 'entregue' && now() - o.hist.entregue < 864e5).length;
    const card = (o, btn) => `<a class="card col g6" style="padding:14px" href="detalhe.html?id=${o.id}"><div class="row between g8"><span class="pr md">#${o.id}</span>${badgeOf(o)}</div><b class="md">${esc(o.customer)}</b><span class="xs muted">${itemsText(o.items)} · ${esc(o.pay)}${o.pay === 'Dinheiro' ? ' (receber)' : ''}</span><span class="row g6 xs muted">${ic('pin', 14)} ${esc(o.address)}</span>${btn ? `<span class="btn info full sm" style="margin-top:4px">${btn}</span>` : ''}</a>`;
    $('#driverView').innerHTML = `<div class="row between"><h2 style="font-size:24px">Olá, ${d}!</h2><button class="badge-btn" id="duty">${db.driverOn[d] ? badge('ok', 'Em serviço') : badge('off', 'Fora de serviço')}</button></div>
    <div class="row g10"><div class="stat" style="background:var(--yellowSoft);color:var(--yellowDark)"><span class="row g8">${ic('box', 18)}<span class="bignum" style="font-size:24px">${wait.length}</span></span><b class="xs">Aguardando retirada</b></div><div class="stat" style="background:var(--blueSoft);color:var(--blue)"><span class="row g8">${ic('bike', 18)}<span class="bignum" style="font-size:24px">${route.length}</span></span><b class="xs">Em rota</b></div><div class="stat" style="background:var(--greenSoft);color:var(--green)"><span class="row g8">${ic('check', 18)}<span class="bignum" style="font-size:24px">${doneToday}</span></span><b class="xs">Entregues hoje</b></div></div>
    <b class="md xb">Aguardando retirada</b>${wait.length ? `<div class="col g10">${wait.map(o => card(o)).join('')}</div><button class="btn hl full" id="pickup">Retirar ${wait.length} pedido${wait.length > 1 ? 's' : ''} no balcão</button>` : '<p class="sm muted">Nenhum pedido aguardando você no balcão.</p>'}
    <b class="md xb">Em rota</b>${route.length ? route.map(o => card(o, 'Ver entrega')).join('') : '<p class="sm muted">Nenhuma entrega em andamento.</p>'}
    ${!wait.length && !route.length ? `<div class="empty">${ic('bike', 36)}<b>Tudo entregue por aqui</b><span>Novos pedidos atribuídos aparecem automaticamente.</span></div>` : ''}`;
  };
  $('#driverView').addEventListener('click', e => {
    if (e.target.closest('#pickup')) { const ids = db.orders.filter(o => o.driver === me() && o.status === 'pronto').map(o => o.id); ids.forEach(id => setStatus(id, 'rota')); toast(`${ids.length} pedido(s) retirado(s). Boa entrega!`); render(); }
    if (e.target.closest('#duty')) { update(d => d.driverOn[me()] = !d.driverOn[me()]); toast(db.driverOn[me()] ? 'Você está em serviço' : 'Você está fora de serviço', 'info'); render(); }
  });
  render(); setInterval(render, 30000);
};
P['entregador-detalhe'] = () => {
  render = () => {
    const o = order(qs('id')) || db.orders.find(x => x.driver === me() && x.status === 'rota');
    const bar = $('#dbar');
    if (!o) { $('#ddetail').innerHTML = `<div class="empty">${ic('bike', 36)}<b>Nenhuma entrega selecionada</b><a class="btn primary" href="pedidos.html">Ver meus pedidos</a></div>`; bar.hidden = true; return; }
    $('#dtitle').textContent = `Pedido #${o.id}`; $('#dbadge').innerHTML = badgeOf(o);
    const cash = o.pay === 'Dinheiro', maps = 'https://www.google.com/maps/search/' + encodeURIComponent(o.address + ', Rio Branco - AC');
    $('#ddetail').innerHTML = `<div class="card row g12" style="padding:14px"><span class="ib soft">${ic('user')}</span><div class="grow"><span class="cap" style="font-size:10px">Cliente</span><div class="xb md">${esc(o.customer)}</div><span class="sm muted">${esc(o.phone)}</span></div><a class="ib" href="tel:${o.phone.replace(/\D/g, '')}" style="width:44px;height:44px;background:var(--green);border:0;color:#fff" aria-label="Ligar">${ic('phone')}</a></div>
    <div class="card col g10" style="padding:14px"><span class="cap" style="font-size:10px">Endereço de entrega</span><div class="row g10" style="align-items:flex-start"><span style="color:var(--primary)">${ic('pin')}</span><div><b>${esc(o.address)}</b>${o.ref ? `<div class="xs muted">Referência: ${esc(o.ref)}</div>` : ''}</div></div>
      <div class="mapmini"><span class="pinm">${ic('pin', 18)}</span></div><a class="btn secondary full" href="${maps}" target="_blank" rel="noopener">${ic('map', 18)} Abrir no mapa</a></div>
    <div class="card col g6" style="padding:14px"><span class="cap" style="font-size:10px">Pedido</span>${o.items.map(i => kv(esc(itemLabel(i)), brl(i.unit * i.qty))).join('')}${o.obs ? `<span class="xs b" style="color:var(--yellowDark)">Obs.: ${esc(o.obs)}</span>` : ''}</div>
    <div class="paybox col g4" style="${cash ? '' : 'background:var(--greenSoft);border-color:#BFE5CC'}"><span class="row g8 xb sm" style="color:${cash ? 'var(--yellowDark)' : 'var(--green)'}">${ic(cash ? 'money' : 'checkCircle', 18)} ${cash ? 'Pagamento em dinheiro' : `Pago via ${esc(o.pay)}`}</span><span class="row g6" style="align-items:baseline"><span class="bignum">${brl(o.total)}</span><span class="xs b muted">${cash ? 'a receber do cliente' : 'nada a receber'}</span></span></div>`;
    bar.hidden = false;
    $('#confirmDel').outerHTML = o.status === 'rota' ? `<button class="btn success full lg" id="confirmDel">${ic('check', 18, 'currentColor', 3)} Confirmar entrega</button>` : o.status === 'pronto' ? `<button class="btn hl full lg" id="confirmDel" data-pick>Retirar no balcão e sair</button>` : `<a class="btn neutral full lg" id="confirmDel" href="pedidos.html">${o.status === 'entregue' ? 'Entrega já concluída' : 'Voltar'}</a>`;
  };
  document.addEventListener('click', e => { const b = e.target.closest('#confirmDel'); if (!b || b.tagName === 'A') return; const o = order(qs('id')) || db.orders.find(x => x.driver === me() && x.status === 'rota');
    if (b.dataset.pick !== undefined) { setStatus(o.id, 'rota'); toast('Pedido retirado. Boa entrega!'); render(); }
    else modal({ title: 'Confirmar entrega?', body: `<p class="muted">Pedido #${o.id} para <b>${esc(o.customer)}</b>.${o.pay === 'Dinheiro' ? ` Confirme que recebeu <b>${brl(o.total)}</b> em dinheiro.` : ''}</p>`, ok: 'Confirmar', okClass: 'success', onOk: () => { setStatus(o.id, 'entregue'); go(`concluida.html?id=${o.id}`); } }); });
  render();
};
P['entregador-concluida'] = () => {
  const o = order(qs('id')); const nx = db.orders.find(x => x.driver === me() && x.status === 'rota') || db.orders.find(x => x.driver === me() && x.status === 'pronto');
  $('#done').innerHTML = `<div class="success-ring"><div>${ic('check', 52, 'currentColor', 3)}</div></div>
  <h2 style="font-size:28px;margin-top:6px">Entrega concluída!</h2>${o ? `<b class="md muted">Pedido #${o.id} · ${esc(o.customer)}</b><span class="sm muted">Entrega registrada com sucesso às ${hm(o.hist.entregue || now())}.</span><span class="pill" style="background:var(--greenSoft);color:var(--green)">${ic('money', 16)} ${o.pay === 'Dinheiro' ? 'Pagamento recebido' : 'Pago via ' + esc(o.pay)}: ${brl(o.total)}</span>` : ''}
  ${nx ? `<div class="card col g8" style="width:100%;padding:18px;margin-top:12px"><span class="cap" style="color:var(--primary)">Próxima entrega</span><div class="row between"><h2 style="font-size:20px">#${nx.id} — ${esc(nx.customer)}</h2>${badgeOf(nx)}</div><span class="row g6 sm">${ic('pin', 16, '#7A6A5E')} ${esc(nx.address)}</span><span class="row g6 sm muted">${ic('clock', 16)} ${(1 + (nx.id % 4) * .6).toFixed(1).replace('.', ',')} km · cerca de ${4 + nx.id % 6} min</span></div>
  <a class="btn success full lg" href="detalhe.html?id=${nx.id}" style="margin-top:8px">Ir para próxima entrega ${ic('arrowR', 18)}</a>` : `<div class="card col g4" style="width:100%;padding:18px;margin-top:12px;text-align:center"><b>Sem mais entregas por agora</b><span class="sm muted">Volte para a lista para ver novos pedidos.</span></div>`}
  <a class="btn neutral full" href="pedidos.html">Voltar aos pedidos</a>`;
};

/* ---------- GERENTE ---------- */
P['gerente-login'] = () => {
  const f = $('#mgrLogin');
  f.onsubmit = e => { e.preventDefault(); if (!/^\S+@\S+\.\S+$/.test(f.email.value.trim())) return formErr(f, 'Informe um e-mail válido.'); if (f.password.value.length < 4) return formErr(f, 'Senha incorreta.'); go('dashboard.html', 'Bem-vindo ao painel, Carlos!'); };
};
const stockState = s => s.qty < s.min ? ['off', 'Abaixo do mínimo', 'red'] : s.qty < s.min * 1.2 ? ['aguardando', 'Próximo do mínimo', 'yellowDark'] : ['ok', 'OK', 'green'];
const fmtQ = (v, u) => `${(Math.round(v * 10) / 10).toLocaleString('pt-BR')} ${u}`;
P['gerente-dashboard'] = () => {
  $('#today').textContent = longDate();
  render = () => {
    const per = $('#period').value;
    const day0 = new Date(); day0.setHours(0, 0, 0, 0);
    const todays = db.orders.filter(o => o.created >= day0 && o.status !== 'cancelado');
    const revToday = todays.reduce((a, o) => a + o.total, 0);
    const days = [...db.sales, revToday];
    const rev = per === 'hoje' ? revToday : days.reduce((a, b) => a + b, 0);
    const count = per === 'hoje' ? todays.length : todays.length + Math.round(db.sales.reduce((a, b) => a + b, 0) / 47.7);
    const live = db.orders.filter(o => !['entregue', 'cancelado', 'novo'].includes(o.status) || o.status === 'novo');
    const labels = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return cap(d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')); });
    const max = Math.max(...days, 1);
    const agg = {}; db.orders.filter(o => o.status !== 'cancelado').forEach(o => o.items.forEach(i => { const n = i.cat === 'bebida' ? i.name : 'Pizza ' + i.name; agg[n] = (agg[n] || 0) + i.qty; }));
    const tot = Object.values(agg).reduce((a, b) => a + b, 0) || 1; const top = Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const alerts = db.stock.filter(s => stockState(s)[0] !== 'ok');
    const kpi = (k, l, v, d, col) => `<div class="card kpi"><div class="row between"><span class="xs b muted">${l}</span><span class="kic" style="background:var(--${col}Soft);color:var(--${col})">${ic(k, 18)}</span></div><span class="bignum2">${v}</span><span class="xs b" style="color:var(--green)">${d}</span></div>`;
    const ratings = db.orders.filter(o => o.rating); const avgR = ratings.length ? (ratings.reduce((a, o) => a + o.rating, 0) / ratings.length).toFixed(1).replace('.', ',') : '—';
    $('#dash').innerHTML = `<div class="row g16 wrap">${kpi('money', per === 'hoje' ? 'Faturamento hoje' : 'Faturamento 7 dias', brl(rev), per === 'hoje' ? `${todays.length} pedidos válidos` : 'média ' + brl(rev / 7) + '/dia', 'green')}${kpi('list', per === 'hoje' ? 'Pedidos hoje' : 'Pedidos 7 dias', count, `${db.orders.filter(o => o.status === 'cancelado').length} cancelado(s)`, 'primary')}${kpi('trend', 'Ticket médio', brl(rev / Math.max(1, count)), `avaliação média ${avgR}★`, 'blue')}${kpi('clock', 'Pedidos em andamento', db.orders.filter(active).length, `${db.orders.filter(o => ['confirmado', 'preparo'].includes(o.status)).length} na cozinha · ${db.orders.filter(o => o.status === 'rota').length} em rota`, 'yellow')}</div>
    <div class="row g16 wrap" style="align-items:stretch">
      <div class="card col g10" style="flex:1.4;min-width:340px"><div class="row between"><h3>Vendas nos últimos 7 dias</h3><span class="xs b muted">Total ${brl(days.reduce((a, b) => a + b, 0))}</span></div><div class="bars">${days.map((v, i) => `<div class="bar" title="${labels[i]}: ${brl(v)}"><em>${brl(v).replace(/,\d+$/, '')}</em><div class="${i === 6 ? 'hl' : ''}" style="height:${Math.max(4, v / max * 85)}%"></div></div>`).join('')}</div><div class="barlbl">${labels.map((l, i) => `<span>${i === 6 ? 'Hoje' : l}</span>`).join('')}</div></div>
      <div class="card col g12" style="flex:1;min-width:260px"><h3>Produtos mais vendidos</h3>${top.map(([n, q], i) => { const p = Math.round(q / tot * 100); return `<div class="col g4"><div class="row between xs"><b>${i + 1}. ${esc(n)}</b><b class="muted">${q} un · ${p}%</b></div><div class="prog"><div style="width:${Math.min(100, p * 2.5)}%"></div></div></div>`; }).join('')}</div>
      <div class="card col g12" style="flex:.9;min-width:240px"><div class="row between"><h3>Alertas de estoque</h3><span class="cnt red">${alerts.length}</span></div>${alerts.map(s => { const [, l, c] = stockState(s); return `<a class="row g10" href="estoque-detalhe.html?id=${s.id}"><span class="kic" style="background:var(--${c === 'red' ? 'red' : 'yellow'}Soft);color:var(--${c})">${ic('alert', 16)}</span><div><b class="sm">${esc(s.name)}</b><div class="xs b" style="color:var(--${c})">${l} · ${fmtQ(s.qty, s.unit)}</div></div></a>`; }).join('') || '<span class="sm muted">Nenhum alerta. Estoque em dia!</span>'}<a class="btn danger-soft full sm" href="estoque.html">Ver estoque</a></div></div>
    <div class="card" style="padding:0;overflow:hidden"><div class="row between" style="padding:16px 16px 8px"><h3>Pedidos recentes</h3><span class="xs b muted">atualiza automaticamente</span></div><div class="tablewrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Itens</th><th>Origem</th><th>Total</th><th>Status</th></tr></thead><tbody>${[...db.orders].sort((a, b) => b.created - a.created).slice(0, 6).map(o => `<tr><td><b class="pr">#${o.id}</b><div class="xs muted">${hm(o.created)}</div></td><td>${esc(o.customer)}</td><td class="muted">${itemsText(o.items)}</td><td><span class="tag">${o.source === 'app' ? 'App' : 'Balcão'}</span></td><td><b>${brl(o.total)}</b></td><td>${badgeOf(o)}</td></tr>`).join('')}</tbody></table></div></div>`;
    paintCommon();
  };
  $('#period').addEventListener('change', render);
  render(); setInterval(render, 30000);
};
function moveModal(sid, type) {
  const one = sid != null; const s = one ? db.stock.find(x => x.id === sid) : null;
  modal({ title: type === 'entrada' ? 'Registrar entrada' : 'Registrar saída', okClass: type === 'entrada' ? 'success' : 'danger',
    body: (one ? `<p class="muted">${esc(s.name)} · atual ${fmtQ(s.qty, s.unit)}</p>` : `<label class="fld"><span>Insumo</span><span class="input"><select name="sid">${db.stock.map(x => `<option value="${x.id}">${esc(x.name)} (${fmtQ(x.qty, x.unit)})</option>`).join('')}</select></span></label>`) +
      field('Quantidade', 'qty', '', 'number', 'step="0.1" min="0.1" placeholder="0,0"') + field('Observação', 'obs', '', 'text', `placeholder="${type === 'entrada' ? 'Ex.: NF 1234 · fornecedor' : 'Ex.: produção do turno, perda'}"`),
    ok: 'Registrar', onOk: f => {
      const id = one ? sid : f.sid.value; const q = parseFloat(String(f.qty.value).replace(',', '.'));
      const it = db.stock.find(x => x.id === id);
      if (!(q > 0)) return 'Informe uma quantidade maior que zero.';
      if (type === 'saida' && q > it.qty) return `Saída maior que o estoque atual (${fmtQ(it.qty, it.unit)}).`;
      update(d => { const x = d.stock.find(y => y.id === id); x.qty = Math.round((x.qty + (type === 'entrada' ? q : -q)) * 100) / 100; x.moves.unshift({ t: now(), type, qty: q, who: d.session.manager, obs: f.obs.value.trim() || (type === 'entrada' ? 'Entrada manual' : 'Saída manual') }); });
      toast(`${type === 'entrada' ? 'Entrada' : 'Saída'} de ${fmtQ(q, it.unit)} registrada`); render();
    } });
}
P['gerente-estoque'] = () => {
  let only = false;
  render = () => {
    const q = $('#search').value.trim().toLowerCase();
    const list = db.stock.filter(s => (!only || stockState(s)[0] !== 'ok') && (!q || (s.name + s.cat).toLowerCase().includes(q)));
    const below = db.stock.filter(s => stockState(s)[0] === 'off').length, near = db.stock.filter(s => stockState(s)[0] === 'aguardando').length;
    $('#skpi').innerHTML = [['box', 'Itens cadastrados', db.stock.length, new Set(db.stock.map(s => s.cat)).size + ' categorias', 'blue'], ['alert', 'Abaixo do mínimo', below, 'repor com urgência', 'red'], ['clock', 'Próximos do mínimo', near, 'repor esta semana', 'yellow']].map(([k, l, v, d, c]) => `<div class="card kpi"><div class="row between"><span class="xs b muted">${l}</span><span class="kic" style="background:var(--${c}Soft);color:var(--${c})">${ic(k, 18)}</span></div><span class="bignum2">${v}</span><span class="xs b muted">${d}</span></div>`).join('');
    $$('#sfilter .chip').forEach(c => c.classList.toggle('on', (c.dataset.f === 'alert') === only));
    $('#stbody').innerHTML = list.map(s => { const [b, l] = stockState(s); return `<tr><td><a class="row g12" href="estoque-detalhe.html?id=${s.id}"><span class="thumb">${ic('box', 18)}</span><b>${esc(s.name)}</b></a></td><td><span class="tag">${esc(s.cat)}</span></td><td><b>${fmtQ(s.qty, s.unit)}</b></td><td class="muted">${fmtQ(s.min, s.unit)}</td><td>${badge(b, l)}</td><td><div class="row g12"><button class="act" data-in="${s.id}">+ Entrada</button><a class="act" href="estoque-detalhe.html?id=${s.id}">Detalhes ${ic('chevR', 15)}</a></div></td></tr>`; }).join('') || '<tr><td colspan="6" class="tc muted" style="padding:24px">Nenhum insumo encontrado</td></tr>';
    paintCommon();
  };
  $('#search').addEventListener('input', render);
  $('#sfilter').addEventListener('click', e => { const c = e.target.closest('.chip'); if (c) { only = c.dataset.f === 'alert'; render(); } });
  $('#stbody').addEventListener('click', e => { const b = e.target.closest('[data-in]'); b && moveModal(b.dataset.in, 'entrada'); });
  $('#newIn').onclick = () => moveModal(null, 'entrada');
  render();
};
P['gerente-estoque-detalhe'] = () => {
  let mf = 'all';
  render = () => {
    const s = db.stock.find(x => x.id === qs('id')) || db.stock[0];
    const [b, l, c] = stockState(s); const dur = s.avg ? s.qty / s.avg : 0;
    const stc = (lab, v, col) => `<div class="card kpi" style="border-top:4px solid var(--${col})"><span class="xs b muted">${lab}</span><span class="bignum2">${v}</span></div>`;
    const moves = s.moves.filter(m => mf === 'all' || (mf === 'in' ? m.type === 'entrada' : m.type !== 'entrada'));
    $('#sdetail').innerHTML = `<div class="row g12"><a class="ib" href="estoque.html" aria-label="Voltar">${ic('back')}</a><div><h1>Detalhes do estoque</h1><a class="sm b muted" href="estoque.html">← Voltar ao estoque</a></div></div>
    <div class="phead"><div class="row g12"><span class="kic lg" style="background:var(--yellowSoft);color:var(--yellowDark)">${ic('box', 24)}</span><div><h2 style="font-size:26px;font-weight:700">${esc(s.name)}</h2><span class="xs b muted">Categoria: ${esc(s.cat)} · Unidade: ${s.unit} · Fornecedor: ${esc(s.supplier)}</span></div></div><div class="row g10"><button class="btn danger-soft" data-mv="saida">− Registrar saída</button><button class="btn success" data-mv="entrada">+ Registrar entrada</button></div></div>
    <div class="row g16 wrap">${stc('Estoque atual', fmtQ(s.qty, s.unit), c === 'green' ? 'green' : c === 'red' ? 'red' : 'yellow')}${stc('Estoque mínimo', fmtQ(s.min, s.unit), 'yellow')}${stc('Consumo médio', fmtQ(s.avg, s.unit) + ' / dia', 'green')}${stc('Duração estimada', dur ? '~' + Math.floor(dur) + ' dia' + (Math.floor(dur) === 1 ? '' : 's') : '—', 'blue')}</div>
    ${b !== 'ok' ? `<div class="alertbar">${ic('alert', 18)}<b>${l}.</b><span>Recomendado repor ao menos ${fmtQ(Math.max(s.min * 1.5 - s.qty, s.avg * 5), s.unit)}.</span></div>` : `<div class="alertbar" style="background:var(--greenSoft);border-color:#BFE5CC;color:var(--green)">${ic('checkCircle', 18)}<b>Estoque adequado.</b></div>`}
    <div class="card col g10"><div class="row between wrap g8"><h3>Histórico de movimentação</h3><div class="row g8" id="mf">${[['all', 'Todos'], ['in', 'Entradas'], ['out', 'Saídas']].map(([k, t]) => `<button class="chip ${k === mf ? 'on' : ''}" data-mf="${k}">${t}</button>`).join('')}</div></div>
    <div class="tablewrap"><table><thead><tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Responsável</th><th>Observação</th></tr></thead><tbody>${moves.map(m => `<tr><td>${new Date(m.t).toLocaleDateString('pt-BR')} ${hm(m.t)}</td><td>${badge(m.type === 'entrada' ? 'ok' : m.type === 'ajuste' ? 'aguardando' : 'saida', cap(m.type === 'saida' ? 'saída' : m.type))}</td><td><b style="color:var(--${m.type === 'entrada' ? 'green' : 'text'})">${m.type === 'entrada' ? '+' : '−'} ${fmtQ(m.qty, s.unit)}</b></td><td>${esc(m.who)}</td><td class="muted">${esc(m.obs)}</td></tr>`).join('') || '<tr><td colspan="5" class="tc muted" style="padding:24px">Sem movimentações</td></tr>'}</tbody></table></div></div>`;
    paintCommon();
  };
  $('#sdetail').addEventListener('click', e => { const m = e.target.closest('[data-mv]'), f = e.target.closest('[data-mf]'); const s = db.stock.find(x => x.id === qs('id')) || db.stock[0];
    if (m) moveModal(s.id, m.dataset.mv); if (f) { mf = f.dataset.mf; render(); } });
  render();
};
P['gerente-produtos'] = () => {
  let cat = 'all';
  const CAT = { pizza: 'Pizza', bebida: 'Bebida', sobremesa: 'Sobremesa' };
  render = () => {
    const q = $('#search').value.trim().toLowerCase();
    const counts = { all: db.menu.length, pizza: 0, bebida: 0, sobremesa: 0 }; db.menu.forEach(p => counts[p.cat]++);
    $('#pchips').innerHTML = [['all', 'Todos'], ['pizza', 'Pizzas'], ['bebida', 'Bebidas'], ['sobremesa', 'Doces']].map(([k, l]) => `<button class="chip ${k === cat ? 'on' : ''}" data-c="${k}">${l} · ${counts[k]}</button>`).join('');
    const list = db.menu.filter(p => (cat === 'all' || p.cat === cat) && (!q || p.name.toLowerCase().includes(q)));
    $('#ptbody').innerHTML = list.map(p => `<tr><td><div class="row g12">${thumbFor(p, 40)}<div><b>${p.cat === 'bebida' ? '' : 'Pizza '}${esc(p.name)}</b><div class="xs muted">${esc(p.desc)}</div></div></div></td><td><span class="tag">${CAT[p.cat]}</span></td><td><b>${p.cat === 'bebida' ? brl(p.price) : `${brl(p.prices.P)} – ${brl(p.prices.G)}`}</b></td><td>${badge(p.available ? 'ok' : 'off', p.available ? 'Disponível' : 'Indisponível')}</td><td><div class="row g12"><button class="act" data-edit="${p.id}">${ic('edit', 15)} Editar</button><label class="switch" title="Disponível no cardápio"><input type="checkbox" data-tog="${p.id}" ${p.available ? 'checked' : ''}><span></span></label><button class="act" style="color:var(--red)" data-del="${p.id}" aria-label="Excluir">${ic('x', 15)}</button></div></td></tr>`).join('') || '<tr><td colspan="5" class="tc muted" style="padding:24px">Nenhum produto encontrado</td></tr>';
    $('#pcount').textContent = `Mostrando ${list.length} de ${db.menu.length} produtos`;
    paintCommon();
  };
  const prodModal = id => {
    const p = id ? product(id) : { name: '', desc: '', cat: 'pizza', kind: 'calabresa', prices: { P: 35, M: 42, G: 50 }, price: 10, available: true };
    const kinds = ['calabresa', 'frango', 'margherita', 'bacon', 'strogonoff', 'chocolate'];
    modal({ title: id ? 'Editar produto' : 'Novo produto',
      body: field('Nome', 'name', p.name) + field('Descrição', 'desc', p.desc) + `<div class="row g10"><label class="fld grow"><span>Categoria</span><span class="input"><select name="cat">${Object.entries(CAT).map(([k, l]) => `<option value="${k}" ${k === p.cat ? 'selected' : ''}>${l}</option>`).join('')}</select></span></label><label class="fld grow js-kind"><span>Ilustração</span><span class="input"><select name="kind">${kinds.map(k => `<option ${k === p.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></span></label></div>
        <div class="row g10 js-pz">${['P', 'M', 'G'].map(s => field('Preço ' + s, 'p' + s, p.prices ? p.prices[s] : '', 'number', 'step="0.01" min="0"')).join('')}</div><div class="js-bb">${field('Preço', 'price', p.price ?? '', 'number', 'step="0.01" min="0"')}</div>`,
      onMount: f => { const t = () => { const b = f.cat.value === 'bebida'; $('.js-pz', f).hidden = b; $('.js-kind', f).hidden = b; $('.js-bb', f).hidden = !b; }; f.cat.onchange = t; t(); },
      onOk: f => {
        if (!f.name.value.trim()) return 'Informe o nome do produto.';
        const isB = f.cat.value === 'bebida'; const num = v => parseFloat(String(v).replace(',', '.'));
        if (isB ? !(num(f.price.value) > 0) : ['P', 'M', 'G'].some(s => !(num(f['p' + s].value) > 0))) return 'Informe preços válidos.';
        update(d => { const n = { ...(id ? d.menu.find(x => x.id === id) : { id: (isB ? 'b' : 'p') + Date.now().toString(36), available: true }), name: f.name.value.trim(), desc: f.desc.value.trim(), cat: f.cat.value, kind: f.kind.value };
          if (isB) { n.price = num(f.price.value); delete n.prices; } else { n.prices = { P: num(f.pP.value), M: num(f.pM.value), G: num(f.pG.value) }; delete n.price; }
          id ? d.menu[d.menu.findIndex(x => x.id === id)] = n : d.menu.push(n); });
        toast(id ? 'Produto atualizado' : 'Produto adicionado ao cardápio'); render();
      } });
  };
  $('#ptbody').addEventListener('change', e => { const t = e.target.closest('[data-tog]'); if (!t) return; update(d => { d.menu.find(p => p.id === t.dataset.tog).available = t.checked; }); toast(`${product(t.dataset.tog).name} ${t.checked ? 'disponível' : 'indisponível'} no cardápio`, 'info'); render(); });
  $('#ptbody').addEventListener('click', e => { const ed = e.target.closest('[data-edit]'), dl = e.target.closest('[data-del]');
    if (ed) prodModal(ed.dataset.edit);
    if (dl) { const p = product(dl.dataset.del); modal({ title: 'Excluir produto?', body: `<p class="muted">${esc(p.name)} será removido do cardápio.</p>`, ok: 'Excluir', okClass: 'danger', onOk: () => { update(d => d.menu = d.menu.filter(x => x.id !== p.id)); toast('Produto excluído', 'info'); render(); } }); } });
  $('#pchips').addEventListener('click', e => { const c = e.target.closest('[data-c]'); if (c) { cat = c.dataset.c; render(); } });
  $('#search').addEventListener('input', render);
  $('#addProd').onclick = () => prodModal(null);
  render();
};

/* ---------------- inicialização ---------------- */
const page = document.body.dataset.page;
try { (P[page] || (() => {}))(); } catch (err) { console.error(err); }
paintCommon();
try { const f = JSON.parse(sessionStorage.getItem('elias-flash') || 'null'); if (f) { sessionStorage.removeItem('elias-flash'); setTimeout(() => toast(f[0], f[1]), 150); } } catch (e) {}

// sincronização entre abas: um pedido feito no app aparece no atendente/cozinha na hora
window.addEventListener('storage', e => {
  if (e.key !== KEY) return;
  db = read() || db;
  const role = document.body.dataset.role;
  const fresh = db.orders.filter(o => !known.has(o.id));
  fresh.forEach(o => { known.add(o.id);
    if (role === 'atendente' && o.status === 'novo') toast(`Novo pedido #${o.id} de ${esc(first(o.customer))} via app`, 'info');
    if (role === 'cozinha' && o.status === 'confirmado') toast(`Novo pedido #${o.id} na fila`, 'info'); });
  if (role === 'cozinha') db.orders.forEach(o => { if (o.status === 'confirmado' && o.hist.confirmado > now() - 4000 && !o._kseen) { o._kseen = 1; toast(`Pedido #${o.id} entrou na fila`, 'info'); } });
  try { render(); } catch (err) { console.error(err); }
  paintCommon();
});
window.EliasDB = { get: () => db, reset: () => { db = seed(); save(); location.reload(); } };
})();