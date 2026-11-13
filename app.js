// atajo para no escribir document.getElementById a cada rato
const $ = id => document.getElementById(id);
// emoji de cada género, sirve para los filtros y para las tarjetas sin imagen
const GENRE_ICON = {Acción:"⚔️",Shooter:"🔫",Carreras:"🏎️",RPG:"🧙",Aventura:"🗺️",Deportes:"⚽",Indie:"👾",Terror:"👻",Estrategia:"♟️"};
// frase corta que sale debajo del nombre en cada tarjeta
const TAGS = {Acción:"Vive la acción al máximo.",Shooter:"La guerra continúa.",Carreras:"Explora sin límites.",RPG:"Tu historia, tus reglas.",
  Aventura:"Un mundo por descubrir.",Deportes:"Salta a la cancha.",Indie:"Pequeño estudio, gran juego.",Terror:"No mires atrás.",
  Estrategia:"Piensa antes de mover.",Consola:"Potencia para tu próximo nivel.",DLC:"Más contenido para tu juego."};
// una entrada por cada pestaña del menú: título, descripción, si muestra el banner o los filtros
// y qué productos deja pasar (la función f)
const VIEWS = {
  inicio:  {t:"Inicio", hero:1, f:() => true, limit:8},
  juegos:  {t:"Juegos", d:"Todo el catálogo de videojuegos.", chips:1, f:i => i.type === "Juego"},
  consolas:{t:"Consolas", d:"Consolas y accesorios para jugar donde quieras.", f:i => i.type === "Consola"},
  dlc:     {t:"DLC", d:"Expansiones y pases para tus juegos favoritos.", f:i => i.type === "DLC"},
  ofertas: {t:"Ofertas", hero:1, chips:1, f:i => i.off > 0}
};
// el dibujo del carrito, se repite en cada botón de agregar
const CART_SVG = '<svg viewBox="0 0 24 24"><path d="M2 4h3l2.5 11h10.5l2.5-8H6.2"/><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/></svg>';

// precio con formato de pesos: 149900 queda $ 149.900
const fmt = n => "$ " + n.toLocaleString("es-CO");
// limpia el texto antes de meterlo en el HTML, por si alguien escribe etiquetas en un nombre
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
// nombre del producto a nombre de archivo de imagen: minúsculas, sin tildes y con guiones
const slug = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
// precio con el descuento puesto, redondeado a centenas
const calc = (old, off) => Math.round(old * (1 - off / 100) / 100) * 100;

// nombre del bono según el tipo de producto
const BONO_LBL = {Juego:"juegos", Consola:"consolas", DLC:"DLC"};
// créditos (compras a cuotas). La cuota es fija y se redondea hacia arriba a centenas,
// por eso la última cuota puede quedar más pqueña.
const cuotaOf = (total, n) => Math.ceil(total / n / 100) * 100;
const credits = () => store.get("nl_credits", []);
const debtOf = c => c.total - c.paid;
// las cuotas que faltan se sacan de lo que todavía se debe, así si abona de más se ajustan solas
const leftOf = c => Math.ceil(debtOf(c) / c.cuota);
const dateTxt = d => new Date(d).toLocaleDateString("es-CO");
// leer y guardar en localStorage sin repetir el JSON.parse/stringify
const store = {
  get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } },
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};

// Versión de los datos guardados. Cuando cambie este valor, al abrir la página se borra todo
// lo que quedó en el navegador (compras, usuarios, cupones...) y arranca limpio.
const APP_VERSION = "2026-11-13-v2";
if (localStorage.getItem("nl_version") !== APP_VERSION) {
  Object.keys(localStorage).filter(k => k.startsWith("nl_")).forEach(k => localStorage.removeItem(k));
  localStorage.setItem("nl_version", APP_VERSION);
}

// cupones: los de data.js más los que crea el admin. Los que se desactivan o se borran se guardan aparte
const allCoupons = () => {
  const del = store.get("nl_cdel", []), o = {};
  Object.entries(COUPONS).filter(([k]) => !del.includes(k)).forEach(([k, v]) => o[k] = v);
  return Object.assign(o, store.get("nl_coupons", {}));
};
const couponOff = k => store.get("nl_coff", []).includes(k);
const activeCodes = () => Object.keys(allCoupons()).filter(k => !couponOff(k)).join(", ") || "ninguno por ahora";
// ciclo de ofertas. Se guarda cuándo arrancó: si cambias CYCLE_MINUTES en data.js se reinicia
// y el contador vuelve a empezar desde el tiempo completo. cycleId sube cada vez que se cumple el tiempo
const cycleLen = CYCLE_MINUTES * 60000;
if (store.get("nl_cyclen", 0) !== cycleLen) { store.set("nl_cyclen", cycleLen); store.set("nl_cyclestart", Date.now()); }
const cycleStart = store.get("nl_cyclestart", Date.now());
const cycleId = () => Math.floor((Date.now() - cycleStart) / cycleLen);
// generador de números al azar con semilla. Con Math.random cada usuario vería descuentos distintos,
// con esto todos ven los mismos mientras dure el ciclo
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
  t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
// descuento mínimo y máximo según el tipo de producto
const RANGE = {Juego:[10, 70], Consola:[5, 25], DLC:[15, 60]};
// descuento al azar de 5 en 5. k es un número fijo de cada producto para que no cambie si agregan juegos
const randOff = (type, k) => { const [a, b] = RANGE[type]; return a + 5 * Math.floor(rng(Math.imul(cycleId() * 7919 + k + 1 + cycleStart % 9973, 2654435761))() * ((b - a) / 5 + 1)); };
// usuarios: los 3 de data.js (menos los que el admin eliminó) más los que creó el admin
const demoUsers = () => USERS.filter(u => !store.get("nl_deleted", []).includes(u.email));
const allUsers = () => [...demoUsers(), ...store.get("nl_users", [])];
const isBlocked = email => store.get("nl_blocked", []).includes(email);
// items es el catálogo ya armado y state lo que está pasando ahora: pestaña, filtros, carrito y quién tiene sesión
let items = [];
const state = {view:"ofertas", genre:"Todos", q:"", sort:"def", cart:[],
  user: allUsers().find(u => u.email === store.get("nl_session", "") && !isBlocked(u.email)) || null};

// junta juegos, consolas y DLC en una sola lista y les saca el descuento y el precio final
function buildItems() {
  // los juegos que publicó el vendedor se quedan con el descuento que él puso
  const extra = store.get("nl_games", []).map(e => [e.name, e.genre, e.plat, e.old, e.off, e.img, e.desc]);
  const games = [...GAMES, ...extra].map(([name, genre, plat, old, off, img, desc], k) => ({type:"Juego", name, genre, plat, old, off, img, desc, k, fixed:k >= GAMES.length}));
  const cons = CONSOLES.map(([name, brand, old, off, ic], k) => ({type:"Consola", name, genre:"Consola", plat:brand, old, off, ic, k:100 + k}));
  const dlc = DLCS.map(([n, game, old, off], k) => ({type:"DLC", name:`${n} · ${game}`, genre:"DLC", plat:"Contenido", old, off, ic:"✨", k:200 + k}));
  // hue es el color base del degradado de la portada
  items = [...games, ...cons, ...dlc].map((x, i) => { const off = RANDOM_DISCOUNTS && !x.fixed ? randOff(x.type, x.k) : x.off;
    return {...x, off, id:i, desc:x.desc || DESC[x.name] || "", price:calc(x.old, off), hue:(i * 47 + 250) % 360}; });
}

// ===== catálogo =====
// botones de filtro por género
$("chips").innerHTML = ["Todos", ...Object.keys(GENRE_ICON)].map(g =>
  `<button class="chip${g === "Todos" ? " on" : ""}" data-g="${g}">${GENRE_ICON[g] || ""} ${g}</button>`).join("");

// intenta cargar la imagen en jpg, si falla prueba png y después webp.
// Si no hay ninguna se quita el <img> y se queda el degradado
const EXTS = ["jpg", "png", "webp"];
function nextImg(img) {
  const i = +img.dataset.i + 1;
  if (!img.dataset.b || i >= EXTS.length) return img.remove();
  img.dataset.i = i;
  img.src = `${img.dataset.b}.${EXTS[i]}`;
}

// la etiqueta de imagen, se usa en la tarjeta y en la ventana del producto
const imgTag = g => `<img src="${g.img || "img/" + slug(g.name) + ".jpg"}" ${g.img ? "" : `data-b="img/${slug(g.name)}" data-i="0"`} alt="" loading="lazy" onload="this.parentNode.classList.add('has-img')" onerror="nextImg(this)">`;

// dibuja todo según la pestaña, el filtro, la búsqueda y el orden elegidos
function render() {
  const V = VIEWS[state.view], q = state.q.trim().toLowerCase();
  $("hero").hidden = !V.hero;
  $("vhead").hidden = !!V.hero;
  $("vhead").innerHTML = `<h2>${V.t}</h2><p>${V.d || ""}</p>`;
  $("chips").hidden = !V.chips;
  document.querySelectorAll("#menu a").forEach(a => a.classList.toggle("on", a.dataset.view === state.view));
  // se filtra por pestaña, género y texto buscado, y al final se ordena
  let list = items.filter(V.f)
    .filter(i => state.genre === "Todos" || i.genre === state.genre)
    .filter(i => i.name.toLowerCase().includes(q))
    .sort((a, b) => ({def:a.id - b.id, off:b.off - a.off || a.id - b.id, asc:a.price - b.price, desc:b.price - a.price,
      az:a.name.localeCompare(b.name, "es")})[state.sort]);
  if (V.limit) list = list.slice(0, V.limit);
  $("count").textContent = `${list.length} ${list.length === 1 ? "producto" : "productos"}`;
  $("empty").hidden = list.length > 0;
  // una tarjeta por producto. La foto, si existe, queda encima del degradado
  $("grid").innerHTML = list.map(g => `
    <article class="card" data-id="${g.id}" style="--h:${g.hue}">
      <div class="cover">
        ${imgTag(g)}
        ${g.off ? `<span class="badge">-${g.off}%</span>` : ""}<span class="plat">${esc(g.plat)}</span>
        <em>${g.ic || GENRE_ICON[g.genre] || "🎮"}</em><h4>${esc(g.name)}</h4>
      </div>
      <div class="info">
        <h3>${esc(g.name)}</h3><p>${TAGS[g.genre] || "Ya disponible."}</p>
        <div class="buy">
          <div><b>${fmt(g.price)}</b>${g.off ? `<s>${fmt(g.old)}</s>` : ""}</div>
          <button class="add" data-id="${g.id}" aria-label="Agregar ${esc(g.name)} al carrito">${CART_SVG}</button>
        </div>
      </div>
    </article>`).join("");
}

// cambia de pestaña, limpia filtros y búsqueda y sube al inicio de la página
function go(view) {
  Object.assign(state, {view, genre:"Todos", q:""});
  $("q").value = "";
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c.dataset.g === "Todos"));
  $("menu").classList.remove("open");
  render();
  window.scrollTo({top:0, behavior:"smooth"});
}

// eventos del menú, del logo, de los filtros, del buscador y del orden
$("menu").addEventListener("click", e => { const a = e.target.closest("a[data-view]"); if (a) { e.preventDefault(); go(a.dataset.view); } });
document.querySelector(".logo").addEventListener("click", e => { e.preventDefault(); go("inicio"); });
$("chips").addEventListener("click", e => {
  const b = e.target.closest(".chip"); if (!b) return;
  state.genre = b.dataset.g;
  document.querySelectorAll(".chip").forEach(c => c.classList.toggle("on", c === b));
  render();
});
$("q").addEventListener("input", e => { state.q = e.target.value; render(); });
$("sort").addEventListener("change", e => { state.sort = e.target.value; render(); });
// la lupa solo lleva hasta el buscador
$("searchBtn").addEventListener("click", () => { $("catalogo").scrollIntoView(); $("q").focus(); });
$("burger").addEventListener("click", () => $("menu").classList.toggle("open"));
// el botón grande del banner
document.querySelector(".cta").addEventListener("click", e => { e.preventDefault(); go("ofertas"); $("catalogo").scrollIntoView(); });

// ===== avisos =====
let tt;
// mensajito que sale abajo y se esconde solo a los 2 segundos y medio
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("show");
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove("show"), 2400);
}

// ===== carrito =====
// repinta el contador, la lista del panel y los totales
function cartUI() {
  $("cartCount").textContent = state.cart.length;
  const total = state.cart.reduce((s, i) => s + i.price, 0), save = state.cart.reduce((s, i) => s + i.old - i.price, 0);
  $("cartList").innerHTML = state.cart.length ? state.cart.map((i, k) =>
    `<div class="line"><div><b>${esc(i.name)}</b><small>${i.type} · -${i.off}%</small></div><span>${fmt(i.price)}</span><button data-rm="${k}" aria-label="Quitar">✕</button></div>`).join("")
    : '<p class="empty2">Tu carrito está vacío. Agrega algún juego desde el catálogo.</p>';
  $("cartFoot").innerHTML = state.cart.length ? `<p>Ahorras <b>${fmt(save)}</b></p><p class="tot">Total <b>${fmt(total)}</b></p><button class="cta" id="buy">Comprar ahora</button>` : "";
}
// abre o cierra el panel del carrito
const drawer = open => { $("drawer").classList.toggle("open", open); $("scrim").classList.toggle("open", open); };
$("cartBtn").addEventListener("click", () => drawer(true));
$("dx").addEventListener("click", () => drawer(false));
$("scrim").addEventListener("click", () => drawer(false));

// agregar al carrito. Pide sesión y solo deja a las cuentas de comprador
function addToCart(g, btn) {
  if (!state.user) { toast("Inicia sesión como comprador para agregar productos."); return openLogin(); }
  if (state.user.role !== "comprador") return toast("Solo las cuentas de comprador pueden comprar.");
  state.cart.push(g); cartUI();
  // esto de leer offsetWidth es para que la animación del carrito se pueda repetir
  const c = $("cartBtn"); c.classList.remove("bump"); void c.offsetWidth; c.classList.add("bump");
  if (btn) { btn.classList.add("done"); setTimeout(() => btn.classList.remove("done"), 900); }
  toast(`${g.name} agregado al carrito`);
}

// si tocan el botón del carrito se agrega directo, en cualquier otra parte de la tarjeta se abre la descripción
$("grid").addEventListener("click", e => {
  const card = e.target.closest(".card"); if (!card) return;
  const g = items.find(i => i.id == card.dataset.id), btn = e.target.closest(".add");
  if (btn) addToCart(g, btn); else openModal(productHTML(g));
});

// descripción del producto. Si el vendedor no escribió una, se arma una genérica
const descOf = g => g.desc || `${g.name} para ${g.plat}. ${TAGS[g.genre]}`;
function productHTML(g) {
  return `<div class="cover pcover" style="--h:${g.hue}">${imgTag(g)}<em>${g.ic || GENRE_ICON[g.genre] || "🎮"}</em></div>
    <h2>${esc(g.name)}</h2>
    <p class="meta"><span class="pill on">${g.type}</span> ${esc(g.genre)} · ${esc(g.plat)}</p>
    <p class="pdesc">${esc(descOf(g))}</p>
    <div class="buy pbuy"><div><b>${fmt(g.price)}</b>${g.off ? `<s>${fmt(g.old)}</s> <span class="pill on">-${g.off}%</span>` : ""}</div>
    <button class="cta" data-addp="${g.id}">Agregar al carrito</button></div>`;
}

// quitar un producto o ir a pagar
$("drawer").addEventListener("click", e => {
  if (e.target.dataset.rm !== undefined) { state.cart.splice(+e.target.dataset.rm, 1); cartUI(); }
  if (e.target.id === "buy") openCheckout();
});

// ===== sesión y paneles =====
// una sola ventana (dialog) que se reutiliza para login, cuenta, pago y factura
const modal = $("modal");
const openModal = html => { $("mbody").innerHTML = html; modal.showModal(); };
modal.addEventListener("click", e => { if (e.target === modal || e.target.id === "mx") modal.close(); });

// el ícono de usuario se pone verde cuando hay sesión iniciada
function userUI() {
  $("userBtn").classList.toggle("in", !!state.user);
  $("userBtn").title = state.user ? `${state.user.name} (${state.user.role})` : "Iniciar sesión";
}
// los botones de abajo solo rellenan el formulario con las cuentas de prueba
function openLogin() {
  openModal(`<h2>Iniciar sesión</h2>
    <form id="loginForm"><label>Correo<input name="email" type="email" required autocomplete="username"></label>
    <label>Contraseña<input name="pass" type="password" required autocomplete="current-password"></label>
    <p class="err" id="lerr" hidden>Correo o contraseña incorrectos.</p>
    <button class="cta" type="submit">Entrar</button></form>
    <p class="hint">Cuentas de prueba (clic para rellenar):</p>
    <div class="demo">${demoUsers().map(u => `<button type="button" data-fill="${u.email}" data-pass="${u.pass}">${u.role}</button>`).join("")}</div>`);
}
$("userBtn").addEventListener("click", () => state.user ? openModal(accountHTML()) : openLogin());

// arma una tabla a partir de los encabezados y las filas que le pasen
const tbl = (head, rows, empty) => rows.length
  ? `<div class="tbl"><table><thead><tr>${head.map(h => `<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`
  : `<p class="empty2">${empty}</p>`;
// fecha en formato corto
const when = d => new Date(d).toLocaleString("es-CO", {dateStyle:"short", timeStyle:"short"});
// texto de la columna de descuento, por ejemplo: -40% + cupón NEXT10
const discTxt = b => (b.off || b.code) ? `${b.off ? "-" + b.off + "%" : ""}${b.code ? (b.off ? " + " : "") + "cupón " + b.code : ""} (−${fmt(b.old - b.price)})` : "—";
const buyRows = list => list.map(b => [when(b.date), esc(b.buyer), esc(b.item), b.type, fmt(b.old), discTxt(b), `<b>${fmt(b.price)}</b>`, esc(b.pay || "—")]);
// columnas de la tabla de compras
const BUY_HEAD = ["Fecha", "Comprador", "Producto", "Tipo", "Precio", "Descuento", "Pagado", "Pago"];
// agrupa las compras por lo que le pasen (producto, comprador o tipo), suma unidades y total y deja primero el que más vendió
const agg = (list, key) => Object.entries(list.reduce((m, b) => { const k = key(b); (m[k] ??= {n:0, t:0}); m[k].n++; m[k].t += b.price; return m; }, {})).sort((a, b) => b[1].t - a[1].t);

// arma la factura. Con mode "pay" es la que sale apenas se paga, si no es la que se abre desde Mis facturas.
// El IVA ya viene dentro del precio, por eso se saca dividiendo entre 1.19
function invoiceHTML(v, mode) {
  const list = v.lines.reduce((t, l) => t + l.old, 0), cp = v.sub - v.after, cardPay = v.after - v.credit - (v.bonoTotal || 0);
  // una línea de los totales
  const row = (k, val, c = "") => `<p class="${c}"><span>${k}</span><b>${val}</b></p>`;
  return `<div class="invoice">
    <div class="ih"><div><b class="brand">NEXTLEVEL</b><small>Juega · Compra · Disfruta</small></div>
      <div class="ir"><b>Factura de venta</b><span>N° ${v.id}</span><small>${when(v.date)}</small></div></div>
    <p class="ic"><b>Cliente:</b> ${esc(v.buyer)} · ${esc(v.email)}</p>` +
    tbl(["Producto", "Tipo", "Precio lista", "Desc.", "Valor"], v.lines.map(l => [esc(l.name), l.type, fmt(l.old), l.off ? `-${l.off}%` : "—", fmt(l.price)]), "") +
    `<div class="it">` + row("Valor de lista", fmt(list)) + row("Descuentos en productos", "−" + fmt(list - v.sub)) +
    (v.ctype === "pct" ? row(`Cupón ${esc(v.code)} (-${v.cv}%)`, "−" + fmt(cp)) : "") +
    row("Total factura", fmt(v.after), "big") + row("IVA incluido (19%)", fmt(Math.round(v.after * 19 / 119)), "sm") +
    (v.credit ? row(`Pagado con saldo del cupón ${esc(v.code)}`, fmt(v.credit), "sm") : "") +
    (v.bonoTotal ? row("Pagado con bono", fmt(v.bonoTotal), "sm") : "") +
    (cardPay ? (v.cuotas ? row(`A crédito en ${v.cuotas} cuotas de ${fmt(v.cuota)} (sin intereses)`, fmt(cardPay), "sm") : row("Pagado con tarjeta", fmt(cardPay), "sm")) : "") + `</div>
    <p class="ip"><b>Método de pago:</b> ${esc(v.how)}</p>
    <p class="ifoot">Documento generado con fines académicos. ¡Gracias por tu compra!</p></div>
    <div class="noprint actions"><button class="ghost" id="prt">Imprimir / guardar PDF</button>` +
    (mode === "pay" ? `<button class="cta" id="done">Seguir comprando</button>` : `<button class="ghost" id="backacc">Volver</button>`) + `</div>`;
}

// "3 cuotas de $X", y si la última sale más chica se avisa
function cuotasTxt(c) {
  const left = leftOf(c), last = debtOf(c) - c.cuota * (left - 1);
  return `${left} ${left === 1 ? "cuota" : "cuotas"} de ${fmt(left === 1 ? last : c.cuota)}` + (left > 1 && last !== c.cuota ? ` (la última de ${fmt(last)})` : "");
}
// fila de la tabla Mis créditos. Si ya pagó todo y le falta elegir el bono, sale el botón para elegirlo
const creditRow = c => [c.inv, fmt(c.total), fmt(c.paid), `<b>${fmt(debtOf(c))}</b>`, debtOf(c) ? cuotasTxt(c) : "—", dateTxt(c.due),
  debtOf(c) ? `<button class="ghost" data-abono="${c.id}">Abonar</button>`
  : c.bonusPending ? `<button class="ghost" data-bonuspick="${c.id}">Elegir bono</button>` : `<span class="pill on">Pagado</span>`];

// cómo queda el crédito si abona un valor suelto: la deuda baja, las cuotas se recalculan
// (el valor de cada una nunca sube) y lo que quede se reparte parejo entre ellas
function planAfter(c, amt) {
  const debt = debtOf(c) - amt;
  if (debt <= 0) return {debt:0, count:0, cuota:0};
  const count = Math.ceil(debt / c.cuota);
  return {debt, count, cuota:cuotaOf(debt, count)};
}

// ventana para abonar, con dos opciones: por cuotas (eligiendo cuántas) o por un valor libre
function abonoHTML(c, msg = "") {
  const d = debtOf(c), left = leftOf(c);
  const amountFor = k => k >= left ? d : k * c.cuota;   // si paga todas las que quedan, es lo que debe
  return `<h2>Abonar a tu crédito</h2><p class="hint">Factura ${c.inv} · se cobra a tu tarjeta •••• ${c.last4}</p>` + (msg ? `<p class="hint ok">${msg}</p>` : "") +
    `<div class="stats"><div><small>Debes</small><b>${fmt(d)}</b></div><div><small>Cuotas que te quedan</small><b>${left}</b></div>
      <div><small>Valor de la cuota</small><b>${fmt(Math.min(c.cuota, d))}</b></div><div><small>Vence</small><b>${dateTxt(c.due)}</b></div></div>
    <p class="hint">${cuotasTxt(c)}.</p>
    <div class="abono">
      <form id="cuotasForm" class="box" data-cr="${c.id}"><h3>Abonar por cuotas</h3><p class="hint">Elige cuántas cuotas quieres pagar ahora.</p>
        <label>Cuotas a pagar<select name="k">${Array.from({length:left}, (_, i) => i + 1).map(k =>
          `<option value="${k}">${k} ${k === 1 ? "cuota" : "cuotas"} · ${fmt(amountFor(k))}</option>`).join("")}</select></label>
        <button class="cta" type="submit">Pagar cuotas</button></form>
      <form id="abonoForm" class="box" data-cr="${c.id}"><h3>Abonar un valor</h3><p class="hint">Escribe cuánto quieres abonar, sin elegir cuotas.</p>
        <label>Valor a abonar<input name="amt" type="number" min="1" required placeholder="Ej: 500000"></label>
        <p class="hint" id="apreview"></p><p class="err" id="aerr" hidden></p>
        <button class="cta" type="submit">Abonar valor</button></form>
    </div>
    <button class="ghost" id="backacc">Volver</button>`;
}

// registra el abono. Por cuotas: se quitan esas cuotas y las demás quedan igual.
// Por valor (porValor = true): se recalcula la cuota con planAfter.
// Si con esto termina de pagar y todavía no vencía, se le ofrece el bono
function abonar(id, amt, porValor) {
  const all = credits(), c = all.find(x => x.id === id);
  if (!c || amt <= 0) return;
  if (porValor) { const p = planAfter(c, amt); if (p.debt > 0) c.cuota = p.cuota; }
  c.paid += amt; c.pays.push({date:new Date().toISOString(), amount:amt, kind:porValor ? "valor" : "cuotas"});
  const done = debtOf(c) <= 0;
  if (done) { c.early = Date.now() < new Date(c.due).getTime(); c.bonusPending = c.early; }
  store.set("nl_credits", all);
  if (!done) {
    toast("Abono registrado");
    return void ($("mbody").innerHTML = abonoHTML(c, `Abono de ${fmt(amt)} registrado. Ahora debes ${fmt(debtOf(c))}: ${cuotasTxt(c)}.`));
  }
  $("mbody").innerHTML = c.early ? bonusHTML(c)
    : `<h2>Crédito pagado</h2><p class="hint">Terminaste de pagar el crédito ${c.id}. ¡Gracias!</p><button class="ghost" id="backacc">Volver</button>`;
}

// felicitación y elección del bono (solo se puede escoger uno)
function bonusHTML(c) {
  return `<h2>🎉 ¡Felicitaciones!</h2><p class="hint">Pagaste tu crédito antes de tiempo. Como premio puedes elegir un bono, escoge para qué lo quieres:</p>
    <div class="bonos">${Object.entries(BONOS).map(([t, v]) => `<button type="button" class="bonoBtn" data-bonus="${c.id}|${t}"><b>${fmt(v)}</b><span>para ${BONO_LBL[t]}</span></button>`).join("")}</div>
    <p class="hint">Se usa en tu próxima compra y solo descuenta productos de ese tipo.</p>`;
}
function pickBono(id, type) {
  const all = credits(), c = all.find(x => x.id === id);
  if (!c || !c.bonusPending) return;
  c.bonusPending = false; c.bonus = type; store.set("nl_credits", all);
  store.set("nl_bonus", [...store.get("nl_bonus", []), {id:"B" + Date.now(), email:c.email, type, amount:BONOS[type], left:BONOS[type], cr:c.id, date:new Date().toISOString()}]);
  $("mbody").innerHTML = `<h2>¡Bono agregado!</h2><p class="hint ok">Tienes ${fmt(BONOS[type])} para ${BONO_LBL[type]}. Lo vas a ver en el pago de tu próxima compra.</p><button class="ghost" id="backacc">Volver</button>`;
}

// tabla del admin con todas las compras a cuotas, cuánto deben y cuántas cuotas les quedan
function creditsHTML() {
  return `<h3>Compras a cuotas</h3>` + tbl(["Comprador", "Factura", "Total", "Plan", "Pagado", "Debe", "Cuotas que le quedan", "Abonos", "Vence", "Estado", "Bono"],
    credits().slice().reverse().map(c => { const d = debtOf(c);
      return [esc(c.buyer), c.inv, fmt(c.total), `${c.n} × ${fmt(c.cuota0 || c.cuota)}`, fmt(c.paid), `<b>${fmt(d)}</b>`, d ? cuotasTxt(c) : "—", c.pays.length, dateTxt(c.due),
        `<span class="pill ${d ? "mid" : "on"}">${d ? "En curso" : "Pagado"}</span>`, c.bonus ? "Bono de " + BONO_LBL[c.bonus] : c.bonusPending ? "Sin elegir" : "—"]; }),
    "Ningún comprador ha comprado a cuotas todavía.");
}

// parte de cupones del panel admin: formulario para crear y tabla con los usos
function couponsHTML() {
  const used = Object.values(store.get("nl_used", {})).flat();
  return `<h3>Cupones</h3>
    <form id="couponForm" class="two">
      <label>Código<input name="code" required maxlength="20" pattern="[A-Za-z0-9]+" title="Solo letras y números" style="text-transform:uppercase"></label>
      <label>Tipo<select name="type"><option value="pct">Descuento en % en toda la compra</option><option value="credit">Saldo para comprar (COP)</option></select></label>
      <label>Valor (% o pesos)<input name="v" type="number" min="1" required></label>
      <button class="cta" type="submit">Crear cupón</button>
    </form>` + tbl(["Código", "Beneficio", "Usos", "Estado", ""], Object.entries(allCoupons()).map(([k, c]) => [
      `<b>${esc(k)}</b>`, esc(c.desc), used.filter(x => x === k).length,
      `<span class="pill ${couponOff(k) ? "off" : "on"}">${couponOff(k) ? "Desactivado" : "Activo"}</span>`,
      `<button class="ghost" data-ctoggle="${esc(k)}">${couponOff(k) ? "Activar" : "Desactivar"}</button><button class="ghost" data-cdel="${esc(k)}">Eliminar</button>`]), "No hay cupones.");
}

// parte de usuarios del panel admin: crear, bloquear y eliminar
function usersHTML() {
  return `<h3>Usuarios</h3>
    <form id="userForm" class="two">
      <label>Nombre<input name="name" required maxlength="40"></label>
      <label>Correo<input name="email" type="email" required></label>
      <label>Contraseña (mín. 6)<input name="pass" type="text" required minlength="6"></label>
      <label>Rol<select name="role"><option>comprador</option><option>vendedor</option><option>admin</option></select></label>
      <button class="cta" type="submit">Crear usuario</button>
    </form>` + tbl(["Nombre", "Correo", "Rol", "Estado", ""], allUsers().map(u => {
      const bl = isBlocked(u.email), mine = u.email === state.user.email;
      return [esc(u.name), esc(u.email), u.role, `<span class="pill ${bl ? "off" : "on"}">${bl ? "Bloqueado" : "Activo"}</span>`,
        mine ? "Tú" : `<button class="ghost" data-block="${esc(u.email)}">${bl ? "Desbloquear" : "Bloquear"}</button>` +
          `<button class="ghost" data-udel="${esc(u.email)}">Eliminar</button>`];
    }), "");
}

// lo que se ve al tocar el ícono de usuario. Cambia según el rol
function accountHTML() {
  const u = state.user;
  let h = `<h2>Hola, ${esc(u.name)}</h2><p class="role">${u.role}</p>`;
  // comprador: sus facturas y sus compras
  if (u.role === "comprador") {
    const mine = store.get("nl_buys", []).filter(b => b.email === u.email);
    const invs = store.get("nl_inv", []).filter(v => v.email === u.email).reverse();
    h += `<h3>Mis facturas</h3>` + tbl(["N°", "Fecha", "Total", ""], invs.map(v => [v.id, when(v.date), `<b>${fmt(v.after)}</b>`,
      `<button class="ghost" data-inv="${v.id}">Ver factura</button>`]), "Aún no tienes facturas.");
    const crs = credits().filter(c => c.email === u.email).reverse(), bos = store.get("nl_bonus", []).filter(b => b.email === u.email && b.left > 0);
    h += `<h3>Mis créditos</h3>` + tbl(["Factura", "Total", "Pagado", "Debes", "Cuotas que te quedan", "Vence", ""], crs.map(creditRow), "Aún no has comprado a cuotas.");
    if (bos.length) h += `<h3>Mis bonos</h3>` + tbl(["Bono", "Disponible", "Aplica a"], bos.map(b => [`Bono de ${BONO_LBL[b.type]}`, `<b>${fmt(b.left)}</b>`, "Solo " + BONO_LBL[b.type]]), "");
    h += `<h3>Mis compras</h3>` + tbl(BUY_HEAD.slice(2), buyRows(mine).map(r => r.slice(2)), "Aún no has comprado nada.");
  }
  // vendedor: formulario para subir juegos y la lista de los que ya subió
  if (u.role === "vendedor") {
    const mine = store.get("nl_games", []).map((g, k) => ({...g, k})).filter(g => g.owner === u.email);
    h += `<h3>Agregar juego</h3>
      <form id="sellForm" class="two">
        <label>Nombre<input name="name" required maxlength="40"></label>
        <label>Género<select name="genre">${Object.keys(GENRE_ICON).map(g => `<option>${g}</option>`).join("")}</select></label>
        <label>Plataforma<input name="plat" value="Multi" required maxlength="14"></label>
        <label>Precio original (COP)<input name="old" type="number" min="1000" step="100" required></label>
        <label>Descuento %<input name="off" type="number" min="0" max="90" value="0" required></label>
        <label>Descripción corta<input name="desc" maxlength="140"></label>
        <label>Imagen de portada<input name="img" type="file" accept="image/*"></label>
        <button class="cta" type="submit">Publicar juego</button>
      </form>
      <h3>Mis juegos publicados</h3>` + tbl(["Juego", "Precio final", ""], mine.map(g => [esc(g.name), fmt(calc(g.old, g.off)), `<button class="ghost" data-del="${g.k}">Eliminar</button>`]), "Todavía no has publicado juegos.");
  }
  // admin: números generales, reporte, todas las compras, cupones y usuarios
  if (u.role === "admin") {
    const b = store.get("nl_buys", []);
    const total = b.reduce((s, x) => s + x.price, 0), gross = b.reduce((s, x) => s + x.old, 0);
    const byG = agg(b, x => x.item), byB = agg(b, x => x.buyer), byT = agg(b, x => x.type);
    const crs = credits(), owed = crs.reduce((t, c) => t + debtOf(c), 0), act = crs.filter(c => debtOf(c) > 0).length;
    h += `<div class="stats">
      <div><small>Total vendido</small><b>${fmt(total)}</b></div><div><small>Compras</small><b>${b.length}</b></div>
      <div><small>Ventas sin descuento</small><b>${fmt(gross)}</b></div><div><small>Descuentos dados</small><b>${fmt(gross - total)}</b></div>
      <div><small>Compradores</small><b>${byB.length}</b></div><div><small>Ticket promedio</small><b>${fmt(b.length ? Math.round(total / b.length) : 0)}</b></div>
      <div><small>Créditos en curso</small><b>${act}</b></div><div><small>Por cobrar</small><b>${fmt(owed)}</b></div></div>
      <h3>Reporte</h3>
      <div class="rep">
        <div><h4>Juegos más vendidos</h4>${tbl(["Producto", "Uds", "Total"], byG.slice(0, 5).map(([k, v]) => [esc(k), v.n, fmt(v.t)]), "Sin datos.")}</div>
        <div><h4>Por comprador</h4>${tbl(["Comprador", "Uds", "Total"], byB.map(([k, v]) => [esc(k), v.n, fmt(v.t)]), "Sin datos.")}</div>
        <div><h4>Por tipo</h4>${tbl(["Tipo", "Uds", "Total"], byT.map(([k, v]) => [k, v.n, fmt(v.t)]), "Sin datos.")}</div>
        <div><h4>Catálogo</h4><p class="hint">${items.filter(i => i.type === "Juego").length} juegos · ${items.filter(i => i.type === "Consola").length} consolas · ${items.filter(i => i.type === "DLC").length} DLC</p></div>
      </div>
      <h3>Todas las compras</h3>` + tbl(BUY_HEAD, buyRows([...b].reverse()), "Aún no hay compras registradas.") +
      (b.length ? `<button class="ghost" id="csv">Descargar CSV</button>` : "") + creditsHTML() + couponsHTML() + usersHTML();
  }
  return h + `<button class="ghost out" id="logout">Cerrar sesión</button>`;
}

// como el contenido de la ventana se vuelve a crear cada vez, los botones se manejan todos aquí
// usando los data-atributos (data-del, data-block, etc.)
$("mbody").addEventListener("click", e => {
  const t = e.target;
  if (t.dataset.fill) { const f = $("loginForm"); f.email.value = t.dataset.fill; f.pass.value = t.dataset.pass; }
  if (t.id === "logout") { state.user = null; state.cart = []; localStorage.removeItem("nl_session"); userUI(); cartUI(); modal.close(); toast("Sesión cerrada"); }
  if (t.dataset.del !== undefined) {
    const g = store.get("nl_games", []); g.splice(+t.dataset.del, 1); store.set("nl_games", g);
    buildItems(); render(); $("mbody").innerHTML = accountHTML();
  }
  // bloquear o desbloquear usuario
  if (t.dataset.block) {
    let bl = store.get("nl_blocked", []);
    bl = bl.includes(t.dataset.block) ? bl.filter(x => x !== t.dataset.block) : [...bl, t.dataset.block];
    store.set("nl_blocked", bl); $("mbody").innerHTML = accountHTML();
  }
  // eliminar usuario. Los 3 de prueba vienen de data.js, así que se anotan en nl_deleted para esconderlos
  if (t.dataset.udel) {
    const em = t.dataset.udel, u = allUsers().find(x => x.email === em);
    if (!u || !confirm(`¿Eliminar a ${u.name} (${em})? Esta acción no se puede deshacer.`)) return;
    if (USERS.some(x => x.email === em)) store.set("nl_deleted", [...store.get("nl_deleted", []), em]);
    store.set("nl_users", store.get("nl_users", []).filter(x => x.email !== em));
    store.set("nl_blocked", store.get("nl_blocked", []).filter(x => x !== em));
    $("mbody").innerHTML = accountHTML(); toast("Usuario eliminado");
  }
  if (t.dataset.ctoggle) {
    const k = t.dataset.ctoggle, off = store.get("nl_coff", []);
    store.set("nl_coff", off.includes(k) ? off.filter(x => x !== k) : [...off, k]);
    $("mbody").innerHTML = accountHTML();
  }
  // igual con los cupones de ejemplo
  if (t.dataset.cdel) {
    const k = t.dataset.cdel;
    if (!confirm(`¿Eliminar el cupón ${k}?`)) return;
    if (COUPONS[k]) store.set("nl_cdel", [...store.get("nl_cdel", []), k]);
    const mine = store.get("nl_coupons", {}); delete mine[k]; store.set("nl_coupons", mine);
    store.set("nl_coff", store.get("nl_coff", []).filter(x => x !== k));
    $("mbody").innerHTML = accountHTML(); toast("Cupón eliminado");
  }
  // descarga el reporte en CSV. El caracter raro del inicio hace que Excel lea bien las tildes
  if (t.id === "csv") {
    const rows = [BUY_HEAD, ...store.get("nl_buys", []).map(b => [when(b.date), b.buyer, b.item, b.type, b.old, b.off + "%" + (b.code ? " + " + b.code : ""), b.price, b.pay || ""])];
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + rows.map(r => r.map(c => `"${c}"`).join(";")).join("\n")], {type:"text/csv"}));
    a.download = "reporte-nextlevel.csv"; a.click();
  }
});

// achica la imagen que sube el vendedor (480px de ancho máximo) para que quepa en localStorage
const shrink = f => new Promise(res => {
  if (!f) return res("");
  const fr = new FileReader();
  fr.onload = () => { const im = new Image(); im.onload = () => {
    const s = Math.min(1, 480 / im.width), c = document.createElement("canvas");
    c.width = im.width * s; c.height = im.height * s; c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    res(c.toDataURL("image/jpeg", .8)); }; im.src = fr.result; };
  fr.readAsDataURL(f);
});

// formularios de la ventana: login, crear usuario, crear cupón y publicar juego
$("mbody").addEventListener("submit", async e => {
  e.preventDefault();
  const f = e.target;
  if (f.id === "loginForm") {
    const u = allUsers().find(x => x.email === f.email.value.trim().toLowerCase() && x.pass === f.pass.value);
    const fail = m => { $("lerr").textContent = m; $("lerr").hidden = false; };
    if (!u) return fail("Correo o contraseña incorrectos.");
    if (isBlocked(u.email)) return fail("Tu cuenta está bloqueada. Contacta al administrador.");
    state.user = u; store.set("nl_session", u.email); userUI(); modal.close();
    toast(`Bienvenido, ${u.name}`);
  }
  if (f.id === "userForm") {
    const email = f.email.value.trim().toLowerCase();
    if (allUsers().some(x => x.email === email)) return toast("Ese correo ya está registrado.");
    const list = store.get("nl_users", []);
    list.push({email, pass:f.pass.value, role:f.role.value, name:f.name.value.trim()});
    store.set("nl_users", list); $("mbody").innerHTML = accountHTML();
    toast(`Usuario creado: ${email}`);
  }
  if (f.id === "couponForm") {
    const code = f.code.value.trim().toUpperCase(), type = f.type.value, v = +f.v.value;
    if (allCoupons()[code]) return toast("Ya existe un cupón con ese código.");
    if (type === "pct" && (v < 1 || v > 90)) return toast("El descuento debe estar entre 1% y 90%.");
    if (type === "credit" && v < 1000) return toast("El saldo mínimo es $ 1.000.");
    const mine = store.get("nl_coupons", {});
    mine[code] = {type, v, desc:type === "pct" ? `${v}% de descuento en toda tu compra` : `${fmt(v)} de saldo para comprar`};
    store.set("nl_coupons", mine); $("mbody").innerHTML = accountHTML();
    toast(`Cupón ${code} creado`);
  }
  if (f.id === "abonoForm") {
    const c = credits().find(x => x.id === f.dataset.cr), a = Math.round(+f.amt.value), d = debtOf(c);
    const bad = m => { $("aerr").textContent = m; $("aerr").hidden = false; };
    if (!(a > 0)) return bad("Escribe un valor válido.");
    if (a > d) return bad(`No puedes abonar más de lo que debes (${fmt(d)}).`);
    if (a < Math.min(1000, d)) return bad("El abono mínimo es $ 1.000.");
    abonar(c.id, a, true);
  }
  if (f.id === "cuotasForm") {
    const c = credits().find(x => x.id === f.dataset.cr), k = +f.k.value;
    abonar(c.id, k >= leftOf(c) ? debtOf(c) : k * c.cuota, false);
  }
  if (f.id === "sellForm") {
    const img = await shrink(f.img.files[0]);
    const g = store.get("nl_games", []);
    g.push({name:f.name.value.trim(), desc:f.desc.value.trim(), genre:f.genre.value, plat:f.plat.value.trim(), old:+f.old.value, off:+f.off.value, img, owner:state.user.email});
    // si la imagen es muy pesada el localStorage se llena, así que se avisa en vez de dejar que falle
    try { store.set("nl_games", g); } catch { return toast("La imagen es muy pesada, prueba con otra."); }
    buildItems(); render(); $("mbody").innerHTML = accountHTML();
    toast("¡Juego publicado en la tienda!");
  }
});

// ===== pago con tarjeta y cupones =====
// revisa si el número de tarjeta es válido (algoritmo de Luhn). La de prueba 4242 4242 4242 4242 pasa
const luhn = n => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = +n[i]; if (d && (x *= 2) > 9) x -= 9; s += x; d = !d; } return s % 10 === 0; };
// estado del pago que está en curso: cupón aplicado y tipo de tarjeta
const ck = {coupon:null, method:"debito", bonos:[]};
// bonos que le quedan al comprador, se marcan en el pago para gastarlos
const myBonos = () => store.get("nl_bonus", []).filter(b => b.email === state.user.email && b.left > 0);
const bonoBox = () => { const bs = myBonos(); return bs.length ? `<h3>Tus bonos</h3>` + bs.map(b => `<label class="bono"><input type="checkbox" data-bono="${b.id}"> Bono de ${BONO_LBL[b.type]}: ${fmt(b.left)} disponibles (solo en ${BONO_LBL[b.type]})</label>`).join("") : ""; };
// calcula los totales. Si el cupón es de %, rebaja cada producto. Los bonos solo descuentan productos de su mismo tipo.
// El saldo del cupón se resta al final y pay es lo que queda por cobrar con la tarjeta
function ckTotals() {
  const c = ck.coupon, pct = c && c.type === "pct" ? c.v : 0;
  const lines = state.cart.map(i => ({...i, final:Math.round(i.price * (1 - pct / 100))}));
  const sub = state.cart.reduce((s, i) => s + i.price, 0), after = lines.reduce((s, l) => s + l.final, 0);
  const room = {}; lines.forEach(l => room[l.type] = (room[l.type] || 0) + l.final);
  const bonos = myBonos().filter(b => ck.bonos.includes(b.id)).map(b => {
    const use = Math.min(b.left, room[b.type] || 0); room[b.type] = (room[b.type] || 0) - use; return {id:b.id, type:b.type, use};
  });
  const bonoTotal = bonos.reduce((s, b) => s + b.use, 0);
  const credit = c && c.type === "credit" ? Math.min(c.v, after - bonoTotal) : 0;
  return {lines, sub, after, credit, bonos, bonoTotal, pay:after - bonoTotal - credit};
}
// repinta el resumen del pago, esconde la tarjeta si bonos y cupón ya cubren todo y muestra cuánto sale cada cuota
function ckSummary() {
  const t = ckTotals(), c = ck.coupon;
  $("sum").innerHTML = state.cart.map(i => `<p><span>${esc(i.name)}</span><b>${fmt(i.price)}</b></p>`).join("") +
    (c && c.type === "pct" ? `<p class="good"><span>Cupón ${c.code} (-${c.v}%)</span><b>−${fmt(t.sub - t.after)}</b></p>` : "") +
    t.bonos.filter(b => b.use).map(b => `<p class="good"><span>Bono de ${BONO_LBL[b.type]}</span><b>−${fmt(b.use)}</b></p>`).join("") +
    (t.credit ? `<p class="good"><span>Saldo del cupón ${c.code}</span><b>−${fmt(t.credit)}</b></p>` : "") +
    `<p class="tot"><span>Total a pagar</span><b>${fmt(t.pay)}</b></p>`;
  $("cardBox").hidden = t.pay === 0;
  $("cuotasBox").hidden = ck.method !== "credito";
  const n = +document.querySelector("#payForm [name=cuotas]").value, fin = ck.method === "credito" && t.pay > 0 && n > 1;
  const cu = cuotaOf(t.pay, n), last = t.pay - cu * (n - 1);
  $("cuotaInfo").hidden = !fin;
  $("cuotaInfo").textContent = `${n} cuotas de ${fmt(cu)}${last !== cu ? ` (la última de ${fmt(last)})` : ""}, sin intereses. Total a financiar: ${fmt(t.pay)}`;
  $("payBtn").textContent = t.pay === 0 ? "Confirmar compra" : fin ? `Comprar en ${n} cuotas` : `Pagar ${fmt(t.pay)}`;
}

// ventana de pago
function openCheckout() {
  ck.coupon = null; ck.method = "debito"; ck.bonos = []; drawer(false);
  openModal(`<h2>Pago</h2><div class="paysum" id="sum"></div>
    <h3>Cupón</h3>
    <div class="cprow"><input id="cin" placeholder="Código del cupón" maxlength="20" autocomplete="off"><button type="button" class="ghost" id="cbtn">Canjear</button></div>
    <p class="hint" id="cmsg">Cupones de prueba: ${activeCodes()}</p>
    ${bonoBox()}
    <form id="payForm" novalidate>
      <div id="cardBox"><h3>Método de pago</h3>
        <div class="methods"><label><input type="radio" name="m" value="debito" checked> Tarjeta débito</label><label><input type="radio" name="m" value="credito"> Tarjeta crédito</label></div>
        <label>Número de tarjeta<input name="num" inputmode="numeric" placeholder="4242 4242 4242 4242" autocomplete="off" maxlength="23"></label>
        <label>Nombre en la tarjeta<input name="holder" autocomplete="off" maxlength="40"></label>
        <div class="row3">
          <label>Vence (MM/AA)<input name="exp" placeholder="08/29" maxlength="5" autocomplete="off"></label>
          <label>CVV<input name="cvv" type="password" inputmode="numeric" maxlength="4" autocomplete="off"></label>
          <label id="cuotasBox" hidden>Cuotas<select name="cuotas"><option>1</option><option>3</option><option>6</option><option>12</option></select></label>
        </div>
      </div>
      <p class="hint" id="cuotaInfo" hidden></p>
      <p class="err" id="perr" hidden></p>
      <button class="cta" id="payBtn" type="submit"></button>
    </form>`);
  ckSummary();
}
// canjear cupón: revisa que exista, que esté activo y que ese usuario no lo haya usado antes
function redeem() {
  const code = $("cin").value.trim().toUpperCase(), msg = $("cmsg"), c = allCoupons()[code];
  const used = store.get("nl_used", {})[state.user.email] || [];
  msg.className = "hint err";
  if (!c) return void (msg.textContent = "Ese cupón no existe.");
  if (couponOff(code)) return void (msg.textContent = "Este cupón no está disponible.");
  if (used.includes(code)) return void (msg.textContent = "Ya usaste este cupón.");
  ck.coupon = {code, ...c}; msg.className = "hint ok"; msg.textContent = `Cupón aplicado: ${c.desc}`; ckSummary();
}
// botones del pago y de la factura
$("mbody").addEventListener("click", e => {
  if (e.target.id === "cbtn") redeem();
  if (e.target.id === "done") modal.close();
  if (e.target.id === "prt") window.print();
  if (e.target.id === "backacc") $("mbody").innerHTML = accountHTML();
  // abrir el abono, elegir bono y agregar desde la descripción del producto
  const bt = e.target.closest("button"), d = bt ? bt.dataset : {};
  if (d.abono) $("mbody").innerHTML = abonoHTML(credits().find(x => x.id === d.abono));
  if (d.bonuspick) $("mbody").innerHTML = bonusHTML(credits().find(x => x.id === d.bonuspick));
  if (d.bonus) { const [id, t] = d.bonus.split("|"); pickBono(id, t); }
  if (d.addp) { modal.close(); addToCart(items.find(i => i.id == d.addp)); }
  if (e.target.dataset.inv) {
    const v = store.get("nl_inv", []).find(x => x.id === e.target.dataset.inv);
    if (v) $("mbody").innerHTML = invoiceHTML(v);
  }
});
// débito o crédito, cambio de cuotas y bonos marcados: todo recalcula el resumen
$("mbody").addEventListener("change", e => {
  const el = e.target;
  if (el.name === "m") ck.method = el.value;
  if (el.dataset.bono) ck.bonos = el.checked ? [...ck.bonos, el.dataset.bono] : ck.bonos.filter(x => x !== el.dataset.bono);
  if (el.name === "m" || el.name === "cuotas" || el.dataset.bono) ckSummary();
});
// le da formato mientras se escribe: tarjeta en grupos de 4, fecha con / y CVV solo números.
// En el abono por valor muestra cómo quedaría el crédito antes de pagar
$("mbody").addEventListener("input", e => {
  const el = e.target;
  if (el.name === "num") el.value = el.value.replace(/\D/g, "").slice(0, 19).replace(/(.{4})/g, "$1 ").trim();
  if (el.name === "exp") { const v = el.value.replace(/\D/g, "").slice(0, 4); el.value = v.length > 2 ? v.slice(0, 2) + "/" + v.slice(2) : v; }
  if (el.name === "cvv") el.value = el.value.replace(/\D/g, "");
  if (el.name === "amt") {
    const c = credits().find(x => x.id === el.form.dataset.cr), a = Math.round(+el.value), pv = $("apreview");
    if (!(a > 0) || a > debtOf(c)) pv.textContent = "";
    else { const p = planAfter(c, a);
      pv.textContent = p.debt ? `Quedarías debiendo ${fmt(p.debt)} en ${p.count} ${p.count === 1 ? "cuota" : "cuotas"} de ${fmt(p.cuota)}.` : "Con este valor terminas de pagar tu crédito."; }
  }
});
// al darle pagar: valida los datos, guarda las compras y la factura y la muestra.
// De la tarjeta solo se guardan los últimos 4 dígitos
$("mbody").addEventListener("submit", e => {
  const f = e.target; if (f.id !== "payForm") return;
  e.preventDefault();
  const t = ckTotals(), er = m => { $("perr").textContent = m; $("perr").hidden = false; };
  let how = [t.bonoTotal ? `Bono (${fmt(t.bonoTotal)})` : "", t.credit ? `Cupón ${ck.coupon.code} (${fmt(t.credit)})` : ""].filter(Boolean).join(" + "), last4 = "";
  if (t.pay > 0) {
    const num = f.num.value.replace(/\s/g, ""), [mm, aa] = f.exp.value.split("/").map(Number);
    if (!/^\d{13,19}$/.test(num) || !luhn(num)) return er("El número de tarjeta no es válido.");
    if (f.holder.value.trim().length < 3) return er("Escribe el nombre que aparece en la tarjeta.");
    if (!(mm >= 1 && mm <= 12) || !aa || new Date(2000 + aa, mm) <= new Date()) return er("La fecha de vencimiento no es válida o la tarjeta ya venció.");
    if (!/^\d{3,4}$/.test(f.cvv.value)) return er("El CVV debe tener 3 o 4 dígitos.");
    const kind = ck.method === "credito" ? `Crédito (${f.cuotas.value} ${f.cuotas.value === "1" ? "cuota" : "cuotas"})` : "Débito";
    last4 = num.slice(-4); how += (how ? " + " : "") + `${kind} •••• ${last4}`;
  }
  const u = state.user, buys = store.get("nl_buys", []), date = new Date().toISOString();
  const code = ck.coupon && ck.coupon.type === "pct" ? ck.coupon.code : "";
  // número de factura, va sumando de uno en uno
  const n = store.get("nl_invn", 0) + 1, invId = "NL-" + String(n).padStart(5, "0"); store.set("nl_invn", n);
  t.lines.forEach(l => buys.push({date, email:u.email, buyer:u.name, item:l.name, type:l.type, old:l.old, off:l.off, price:l.final, code, pay:how, inv:invId}));
  store.set("nl_buys", buys);
  // se gasta lo que se usó de cada bono, lo que sobre queda disponible
  if (t.bonos.length) {
    const all = store.get("nl_bonus", []);
    t.bonos.forEach(b => { const x = all.find(y => y.id === b.id); if (x) x.left -= b.use; });
    store.set("nl_bonus", all);
  }
  // compra a cuotas con crédito: se abre el crédito con su cuota fija y la fecha límite (un mes por cuota)
  const fin = t.pay > 0 && ck.method === "credito" && +f.cuotas.value > 1;
  if (fin) {
    const cu = +f.cuotas.value, due = new Date(date); due.setMonth(due.getMonth() + cu);
    store.set("nl_credits", [...credits(), {id:"CR-" + invId.slice(3), inv:invId, email:u.email, buyer:u.name, total:t.pay, paid:0, n:cu,
      cuota:cuotaOf(t.pay, cu), cuota0:cuotaOf(t.pay, cu), last4, date, due:due.toISOString(), pays:[], early:false, bonusPending:false, bonus:""}]);
  }
  // el cupón queda marcado como usado por este usuario
  if (ck.coupon) { const used = store.get("nl_used", {}); (used[u.email] ??= []).push(ck.coupon.code); store.set("nl_used", used); }
  const inv = {id:invId, date, email:u.email, buyer:u.name, how, sub:t.sub, after:t.after, credit:t.credit, bonoTotal:t.bonoTotal,
    cuotas:fin ? +f.cuotas.value : 0, cuota:fin ? cuotaOf(t.pay, +f.cuotas.value) : 0,
    code:ck.coupon ? ck.coupon.code : "", ctype:ck.coupon ? ck.coupon.type : "", cv:ck.coupon ? ck.coupon.v : 0,
    lines:t.lines.map(l => ({name:l.name, type:l.type, old:l.old, off:l.off, price:l.price, final:l.final}))};
  store.set("nl_inv", [...store.get("nl_inv", []), inv]);
  openModal(`<h2>¡Pago aprobado!</h2>` + (fin ? `<p class="hint">Compraste a cuotas. Puedes abonar cuando quieras desde tu cuenta, en "Mis créditos".</p>` : "") + invoiceHTML(inv, "pay"));
  state.cart = []; ck.coupon = null; ck.bonos = []; cartUI();
});

// ===== contador de ofertas =====
// el contador. Cuando llega a cero cambia de ciclo, sortea descuentos nuevos y actualiza los precios del carrito
let lastCycle = cycleId();
function tick() {
  const s = Math.max(0, Math.floor((cycleStart + (lastCycle + 1) * cycleLen - Date.now()) / 1000)), p = n => String(n).padStart(2, "0");
  $("h").textContent = p(Math.floor(s / 3600)); $("m").textContent = p(Math.floor(s % 3600 / 60)); $("s").textContent = p(s % 60);
  if (cycleId() !== lastCycle) {   // terminó el ciclo
    lastCycle = cycleId(); buildItems();
    state.cart = state.cart.map(c => items.find(i => i.type === c.type && i.name === c.name) || c);
    cartUI(); render(); if ($("sum")) ckSummary();
    toast("¡Nuevas ofertas! Los descuentos cambiaron.");
  }
}
// en el banner se muestra cada cuánto cambian, para confirmar que tomó el valor de data.js
$("cyc").textContent = CYCLE_MINUTES >= 1 ? `(cada ${CYCLE_MINUTES} min)` : `(cada ${Math.round(CYCLE_MINUTES * 60)} s)`;
tick(); setInterval(tick, 1000);

// arranque
buildItems(); userUI(); cartUI(); render();
