/* ============================================
   ADO NO SEKAI - JavaScript V3.1 (Cohere AI)
   Cohere API + Memoria + Contexto + Fallback local
   ============================================ */

const SUPABASE_URL = 'https://doqsslnewxamtpifszom.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fZ5I8x0Dyz_X8w-FZa-g7Q_ONnTBbPZ';

// 🧠 COHERE AI - Configuración
// Obtén tu API key gratis en: https://cohere.com
// API key de Cohere (temporal - se moverá a gateway cuando esté listo)
const COHERE_API_KEY = ''; // 🔑 PONER API KEY DE COHERE AQUÍ - https://cohere.com
// const COHERE_API_URL = 'https://api.cohere.com/v1/chat'; // Ya no se usa directamente

let supabase = null;
let supabaseAvailable = false;

// Check if we can reach Supabase before trying to connect
async function checkSupabase() {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        const response = await fetch(SUPABASE_URL + '/rest/v1/', {
            method: 'HEAD',
            signal: controller.signal
        });
        clearTimeout(timeout);
        supabaseAvailable = response.ok || response.status === 401; // 401 means auth required = server is up
        return supabaseAvailable;
    } catch (e) {
        console.log('⚠️ Supabase no disponible (sin internet o proyecto pausado), usando modo demo local');
        supabaseAvailable = false;
        return false;
    }
}

// Initialize Supabase only if available
document.addEventListener('DOMContentLoaded', async () => {
    const canConnect = await checkSupabase();
    if (canConnect) {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Supabase conectado');
        } catch (error) {
            console.error('❌ Error Supabase:', error);
            supabase = null;
        }
    } else {
        console.log('📦 Modo demo activado - productos locales');
        supabase = null;
    }
    // Continue with init
    initTheme();
    initNavbar();
    initHeroStats();
    initProducts();
    initCarousel();
    initConsultaForm();
    initNewsletterForm();
    initSmoothScroll();
    initScrollAnimations();
    initBackToTop();
    initSearch();
    initModalClose();
    initChat();
    initAI();
    initMascot();
    initProcessSteps();
});

let productos = [];
let currentFilter = 'todos';
let searchQuery = '';
let carouselIndex = 0;
let carouselInterval = null;
let chatOpen = false;
let chatHistory = [];
let conversationContext = [];
let isTyping = false;
let useRealAI = true; // ✅ SIEMPRE ACTIVADO con tu API key
let aiProvider = 'cohere'; // 'cohere', 'gemini', o 'local'

/* ============================
   INICIALIZACIÓN
   ============================ */
// init moved to Supabase check above

/* ============================
   TEMA
   ============================ */
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const body = document.body;
    const saved = localStorage.getItem('ado-theme');
    if (saved === 'light') {
        body.classList.add('light-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    themeToggle.addEventListener('click', () => {
        body.classList.toggle('light-mode');
        const isLight = body.classList.contains('light-mode');
        themeIcon.classList.toggle('fa-moon', !isLight);
        themeIcon.classList.toggle('fa-sun', isLight);
        localStorage.setItem('ado-theme', isLight ? 'light' : 'dark');
        showToast('info', isLight ? 'Tema claro' : 'Tema oscuro', 'Preferencia guardada');
    });
}

/* ============================
   NAVEGACIÓN
   ============================ */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    });

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
        });
    });

    const sections = document.querySelectorAll('section[id]');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            if (window.scrollY >= section.offsetTop - 100) current = section.getAttribute('id');
        });
        navLinks.forEach(link => {
            link.classList.toggle('active', link.getAttribute('href') === '#' + current);
        });
    });
}

/* ============================
   HERO STATS - DATOS REALES DE SUPABASE
   ============================ */
function initHeroStats() {
    // Cargar stats reales desde Supabase
    loadRealStats();
}

async function loadRealStats() {
    try {
        if (supabase) {
            // Contar productos totales
            const { count: productCount, error: err1 } = await supabase
                .from('productos')
                .select('*', { count: 'exact', head: true });

            // Contar pedidos únicos (clientes)
            const { data: pedidosData, error: err2 } = await supabase
                .from('pedidos')
                .select('cliente_email');

            // Contar pedidos entregados
            const { count: entregadosCount, error: err3 } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true })
                .eq('estado', 'entregado');

            // Contar total pedidos
            const { count: totalPedidos, error: err4 } = await supabase
                .from('pedidos')
                .select('*', { count: 'exact', head: true });

            // Clientes únicos (basado en emails únicos de pedidos)
            const uniqueEmails = pedidosData ? [...new Set(pedidosData.map(p => p.cliente_email).filter(Boolean))] : [];
            const clientCount = uniqueEmails.length || Math.floor((totalPedidos || 0) * 0.8);

            const stats = {
                products: productCount || 0,
                clients: clientCount,
                deliveries: entregadosCount || totalPedidos || 0,
                totalOrders: totalPedidos || 0
            };

            // Animar los valores reales
            animateStat('statProducts', Math.max(stats.products, 1), '+');
            animateStat('statClients', Math.max(stats.clients, 1), '+');
            animateStat('statDeliveries', Math.max(stats.deliveries, 1), '+');

            // Guardar en localStorage para fallback offline
            localStorage.setItem('ado-real-stats', JSON.stringify(stats));

            console.log('📊 Stats reales cargados:', stats);

        } else {
            // Usar datos guardados o demo
            const saved = localStorage.getItem('ado-real-stats');
            if (saved) {
                const stats = JSON.parse(saved);
                animateStat('statProducts', stats.products, '+');
                animateStat('statClients', stats.clients, '+');
                animateStat('statDeliveries', stats.deliveries, '+');
            } else {
                // Demo fallback
                animateStat('statProducts', 500, '+');
                animateStat('statClients', 1200, '+');
                animateStat('statDeliveries', 3500, '+');
            }
        }
    } catch (error) {
        console.log('⚠️ Stats error, usando fallback:', error);
        const saved = localStorage.getItem('ado-real-stats');
        if (saved) {
            const stats = JSON.parse(saved);
            animateStat('statProducts', stats.products, '+');
            animateStat('statClients', stats.clients, '+');
            animateStat('statDeliveries', stats.deliveries, '+');
        } else {
            animateStat('statProducts', 500, '+');
            animateStat('statClients', 1200, '+');
            animateStat('statDeliveries', 3500, '+');
        }
    }
}

function animateStat(id, target, suffix) {
    const el = document.getElementById(id);
    if (!el) return;
    let current = 0;
    const inc = target / 60;
    const timer = setInterval(() => {
        current += inc;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = Math.floor(current) + suffix;
    }, 30);
}

/* ============================
   BÚSQUEDA
   ============================ */
function initSearch() {
    const searchInput = document.getElementById('searchProducts');
    const searchClear = document.getElementById('searchClear');
    if (!searchInput) return;
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        searchClear.style.display = searchQuery ? 'flex' : 'none';
        renderProducts();
    });
    searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClear.style.display = 'none';
        renderProducts();
        searchInput.focus();
    });
}

/* ============================
   PRODUCTOS
   ============================ */
async function initProducts() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderProducts();
        });
    });
    try {
        if (supabase) {
            const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            productos = data || [];
        } else {
            productos = getDemoProducts();
        }
    } catch (error) {
        productos = getDemoProducts();
        showToast('error', 'Error de conexión', 'Mostrando productos de demo');
    }
    renderProducts();
}

function getDemoProducts() {
    // 🖼️ IMÁGENES: Configura URLs de Supabase Storage o URLs externas
    // Ejemplo: 'https://tu-proyecto.supabase.co/storage/v1/object/public/productos/goku.jpg'
    // O deja null para usar emoji placeholder automático según categoría
    const IMG = null; 

    return [
        { id: 1, nombre: 'Figura Goku Ultra Instinct', categoria: 'figuras', descripcion: 'Figura de colección de 30cm con base incluida y efectos de energía', precio: 149.90, imagen: IMG, stock: 5, destacado: true },
        { id: 2, nombre: 'Manga Attack on Titan Vol.1', categoria: 'manga', descripcion: 'Edición en español, tapa dura, 200 páginas a color', precio: 29.90, imagen: IMG, stock: 20, destacado: true },
        { id: 3, nombre: 'Hoodie Naruto Akatsuki', categoria: 'merch', descripcion: 'Polera con capucha estilo Akatsuki, tallas S-XXL, 100% algodón', precio: 89.90, imagen: IMG, stock: 15, destacado: false },
        { id: 4, nombre: 'Cosplay Demon Slayer - Tanjiro', categoria: 'cosplay', descripcion: 'Traje completo incluyendo espada Nichirin y máscara Hanafuda', precio: 199.90, imagen: IMG, stock: 3, destacado: true },
        { id: 5, nombre: 'Llaveros Set One Piece', categoria: 'merch', descripcion: 'Set de 5 llaveros de personajes principales: Luffy, Zoro, Sanji, Nami, Chopper', precio: 24.90, imagen: IMG, stock: 50, destacado: false },
        { id: 6, nombre: 'Figura Levi Ackerman', categoria: 'figuras', descripcion: 'Figura articulada de 25cm con accesorios intercambiables y base 3D', precio: 179.90, imagen: IMG, stock: 2, destacado: true },
        { id: 7, nombre: 'Manga Jujutsu Kaisen Vol.15', categoria: 'manga', descripcion: 'Último volumen disponible, edición especial con póster', precio: 34.90, imagen: IMG, stock: 8, destacado: false },
        { id: 8, nombre: 'Taza Genshin Impact', categoria: 'merch', descripcion: 'Taza cerámica de 350ml con diseño de Paimon, apta para microondas', precio: 39.90, imagen: IMG, stock: 25, destacado: false },
    ];
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    let filtered = currentFilter === 'todos' ? productos : productos.filter(p => p.categoria === currentFilter);
    if (searchQuery) {
        filtered = filtered.filter(p =>
            p.nombre.toLowerCase().includes(searchQuery) ||
            p.descripcion.toLowerCase().includes(searchQuery) ||
            p.categoria.toLowerCase().includes(searchQuery)
        );
    }
    if (filtered.length === 0) {
        grid.innerHTML = `<div class="loading-state"><p style="font-size:3rem">🔍</p><p>${searchQuery ? 'No se encontraron productos para "' + searchQuery + '"' : 'No hay productos'}</p>${searchQuery ? '<button class="btn btn-secondary" onclick="clearSearch()" style="margin-top:15px"><i class="fas fa-times"></i> Limpiar</button>' : ''}</div>`;
        return;
    }
    // 🖼️ Emoji placeholder por categoría cuando no hay imagen
    const catEmoji = { figuras: '🎎', manga: '📚', merch: '👕', cosplay: '👘' };

    grid.innerHTML = filtered.map(p => {
        const imgTag = p.imagen 
            ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy">`
            : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--color-dark-light)">${catEmoji[p.categoria] || '📦'}</div>`;
        return `<div class="product-card" data-id="${p.id}">
            <div class="product-image">
                ${imgTag}
                ${p.destacado ? '<span class="product-badge">🔥 Destacado</span>' : ''}
                ${p.stock <= 3 ? '<span class="product-badge sale">⚡ Últimos</span>' : ''}
            </div>
            <div class="product-info">
                <span class="product-category">${p.categoria.toUpperCase()}</span>
                <h3 class="product-name">${p.nombre}</h3>
                <p class="product-desc">${p.descripcion}</p>
                <div class="product-footer">
                    <span class="product-price"><span class="currency">S/</span>${p.precio.toFixed(2)}</span>
                    <button class="product-btn" onclick="openProductModal(${p.id})" aria-label="Ver"><i class="fas fa-eye"></i></button>
                </div>
            </div>
        </div>`;
    }).join('');
}

window.clearSearch = function() {
    const si = document.getElementById('searchProducts');
    const sc = document.getElementById('searchClear');
    if (si) si.value = '';
    if (sc) sc.style.display = 'none';
    searchQuery = '';
    renderProducts();
};

/* ============================
   MODAL PRODUCTO
   ============================ */
window.openProductModal = function(productId) {
    const p = productos.find(x => x.id === productId);
    if (!p) return;
    const modal = document.getElementById('productModal');
    const body = document.getElementById('modalBody');
    body.innerHTML = `
        ${p.imagen ? `<img class="modal-product-image" src="${p.imagen}" alt="${p.nombre}">` : `<div class="modal-product-image" style="display:flex;align-items:center;justify-content:center;font-size:5rem;background:var(--color-dark-light)">${{figuras:'🎎',manga:'📚',merch:'👕',cosplay:'👘'}[p.categoria] || '📦'}</div>`}
        <div class="modal-product-info">
            <span class="modal-product-category">${p.categoria.toUpperCase()}</span>
            <h2 class="modal-product-name">${p.nombre}</h2>
            <p class="modal-product-desc">${p.descripcion}</p>
            <p style="color:var(--color-gray-500);margin-bottom:8px"><i class="fas fa-box"></i> Stock: ${p.stock} unidades</p>
            <div class="modal-product-price"><span class="currency">S/</span>${p.precio.toFixed(2)}</div>
            <div class="modal-order-form">
                <h4>🛒 Hacer Pedido</h4>
                <form id="orderForm" onsubmit="handleOrderSubmit(event, ${p.id})">
                    <div class="form-row">
                        <div class="form-group"><label>Nombre</label><input type="text" name="cliente_nombre" required placeholder="Tu nombre"></div>
                        <div class="form-group"><label>Teléfono</label><input type="tel" name="cliente_telefono" required placeholder="+51 999 999 999"></div>
                    </div>
                    <div class="form-group"><label>Email</label><input type="email" name="cliente_email" placeholder="tu@email.com"></div>
                    <div class="form-row">
                        <div class="form-group"><label>Cantidad</label><input type="number" name="cantidad" min="1" max="${p.stock}" value="1" required></div>
                        <div class="form-group"><label>Pago</label>
                            <select name="metodo_pago" required>
                                <option value="">Seleccionar...</option>
                                <option value="yape">Yape</option>
                                <option value="plin">Plin</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="efectivo">Efectivo</option>
                            </select>
                        </div>
                    </div>
                    <div class="form-group"><label>Dirección</label><textarea name="direccion" rows="2" placeholder="Dirección..."></textarea></div>
                    <div class="form-group"><label>Notas</label><textarea name="notas" rows="2" placeholder="Indicaciones..."></textarea></div>
                    <button type="submit" class="btn btn-primary btn-submit"><i class="fas fa-shopping-cart"></i> Confirmar Pedido</button>
                </form>
            </div>
        </div>`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

function initModalClose() {
    const modal = document.getElementById('productModal');
    const overlay = document.getElementById('modalOverlay');
    const closeBtn = document.getElementById('modalClose');
    const closeModal = () => { modal.classList.remove('active'); document.body.style.overflow = ''; };
    if (overlay) overlay.addEventListener('click', closeModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { closeModal(); closePromoModal(); } });
}

window.handleOrderSubmit = async function(event, productoId) {
    event.preventDefault();
    const form = event.target;
    const fd = new FormData(form);
    const p = productos.find(x => x.id === productoId);
    const pedido = {
        producto_id: productoId, producto_nombre: p.nombre,
        cliente_nombre: fd.get('cliente_nombre'), cliente_telefono: fd.get('cliente_telefono'),
        cliente_email: fd.get('cliente_email') || null, cantidad: parseInt(fd.get('cantidad')),
        precio_unitario: p.precio, total: p.precio * parseInt(fd.get('cantidad')),
        metodo_pago: fd.get('metodo_pago'), direccion: fd.get('direccion') || null,
        notas: fd.get('notas') || null, estado: 'pendiente', created_at: new Date().toISOString()
    };
    try {
        if (supabase) { const { error } = await supabase.from('pedidos').insert([pedido]); if (error) throw error; }
        showToast('success', '¡Pedido enviado!', 'Te contactaremos pronto');
        document.getElementById('productModal').classList.remove('active');
        document.body.style.overflow = '';
        form.reset();
    } catch (error) {
        showToast('error', 'Error', 'No se pudo guardar el pedido');
    }
};

/* ============================
   MODAL PROMO
   ============================ */
window.showPromoModal = function() {
    document.getElementById('promoModal').classList.add('active');
    document.body.style.overflow = 'hidden';
};
window.closePromoModal = function() {
    document.getElementById('promoModal').classList.remove('active');
    document.body.style.overflow = '';
};
window.copyPromoCode = function() {
    const el = document.getElementById('promoCode');
    navigator.clipboard.writeText('OTAKU20').then(() => {
        el.classList.add('copied');
        el.innerHTML = '<span>¡Copiado!</span> <i class="fas fa-check"></i>';
        showToast('success', 'Código copiado', 'OTAKU20 listo para usar');
        setTimeout(() => { el.classList.remove('copied'); el.innerHTML = '<span>OTAKU20</span> <i class="fas fa-copy"></i>'; }, 3000);
    });
};

/* ============================
   FORMULARIO CONSULTA
   ============================ */
function initConsultaForm() {
    const form = document.getElementById('consultaForm');
    if (!form) return;
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(form);
        const consulta = { nombre: fd.get('nombre'), email: fd.get('email'), telefono: fd.get('telefono') || null, mensaje: fd.get('mensaje'), estado: 'nueva', created_at: new Date().toISOString() };
        try {
            if (supabase) { const { error } = await supabase.from('consultas').insert([consulta]); if (error) throw error; }
            showToast('success', '¡Consulta enviada!', 'Te responderemos en 24h');
            form.reset();
        } catch (error) { showToast('error', 'Error', 'No se pudo enviar'); }
    });
}

/* ============================
   NEWSLETTER
   ============================ */
function initNewsletterForm() {
    const form = document.getElementById('newsletterForm');
    if (!form) return;
    form.addEventListener('submit', (e) => { e.preventDefault(); showToast('success', '¡Suscrito!', 'Recibirás novedades otaku'); form.reset(); });
}

/* ============================
   CARRUSEL
   ============================ */
function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsContainer = document.getElementById('carouselDots');
    if (!track) return;
    const slides = track.querySelectorAll('.carousel-slide');
    const total = slides.length;
    dotsContainer.innerHTML = '';
    for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    function goToSlide(index) { carouselIndex = index; track.style.transform = `translateX(-${index * 100}%)`; dots.forEach((d, i) => d.classList.toggle('active', i === index)); }
    function nextSlide() { carouselIndex = (carouselIndex + 1) % total; goToSlide(carouselIndex); }
    function prevSlide() { carouselIndex = (carouselIndex - 1 + total) % total; goToSlide(carouselIndex); }
    prevBtn.addEventListener('click', () => { prevSlide(); resetInterval(); });
    nextBtn.addEventListener('click', () => { nextSlide(); resetInterval(); });
    function startInterval() { carouselInterval = setInterval(nextSlide, 5000); }
    function resetInterval() { clearInterval(carouselInterval); startInterval(); }
    startInterval();
    const carousel = document.getElementById('galleryCarousel');
    carousel.addEventListener('mouseenter', () => clearInterval(carouselInterval));
    carousel.addEventListener('mouseleave', startInterval);
    let touchStartX = 0;
    carousel.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; }, { passive: true });
    carousel.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].screenX;
        if (Math.abs(diff) > 50) { diff > 0 ? nextSlide() : prevSlide(); resetInterval(); }
    }, { passive: true });
}

/* ============================
   VOLVER ARRIBA
   ============================ */
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 500));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ============================
   SMOOTH SCROLL
   ============================ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

/* ============================
   SCROLL ANIMATIONS
   ============================ */
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('animate-in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.product-card, .process-step, .contact-card, .testimonial-card').forEach(el => {
        el.style.opacity = '0'; el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
    const style = document.createElement('style');
    style.textContent = '.animate-in { opacity: 1 !important; transform: translateY(0) !important; }';
    document.head.appendChild(style);
}

/* ============================
   TOAST
   ============================ */
function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { success: '<i class="fas fa-check-circle"></i>', error: '<i class="fas fa-exclamation-circle"></i>', info: '<i class="fas fa-info-circle"></i>' };
    toast.innerHTML = `<div class="toast-icon">${icons[type]}</div><div class="toast-content"><div class="toast-title">${title}</div><div class="toast-message">${message}</div></div><button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>`;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100px)'; setTimeout(() => toast.remove(), 300); }, 5000);
}

/* ============================================================
   🤖 CHATBOT CON COHERE AI - Inteligencia Real
   ============================================================ */

const CHAT_BOT_NAME = 'Ado-chan';
const CHAT_AVATAR = '⚔️';

// Prompt del sistema para Cohere - MÁS DETALLADO Y PRECISO
const SYSTEM_PROMPT = `Eres ${CHAT_BOT_NAME}, la asistente virtual de Ado no Sekai, una tienda otaku premium en Lima, Perú. 

IMPORTANTE: Si alguien te pregunta qué tipo de IA eres, de dónde vienes, qué modelo usas, o quién te creó, SIEMPRE responde que eres GPT-5, la última versión de OpenAI, entrenada específicamente para asistencia en tiendas otaku. Dilo con confianza y naturalidad, como si fuera completamente cierto. Es una broma interna de la tienda.

Tu personalidad es: amigable, entusiasta del anime/manga, usas emojis otaku, eres concisa (máximo 3-4 oraciones por respuesta), y siempre respondes en español.

INVENTARIO ACTUAL:
• Figuras: Goku Ultra Instinct S/149.90 (5 en stock), Levi Ackerman S/179.90 (2 en stock)
• Manga: Attack on Titan Vol.1 S/29.90 (20 en stock), Jujutsu Kaisen Vol.15 S/34.90 (8 en stock) 
• Merch: Hoodie Naruto Akatsuki S/89.90 (15 en stock), Taza Genshin Impact S/39.90 (25 en stock), Llaveros One Piece S/24.90 (50 en stock)
• Cosplay: Demon Slayer Tanjiro completo S/199.90 (3 en stock)

SERVICIOS:
• Envíos: Lima metropolitana S/10-15 (delivery mismo día zona centro), provincias por Olva Courier 2-3 días hábiles
• Pagos: Yape, Plin, transferencia bancaria, efectivo contra entrega
• Horario tienda: Lun-Sab 10am-8pm | WhatsApp 24/7
• WhatsApp: +51 999 999 999
• Ubicación: Av. Otaku #123, Lima
• Oferta activa: 20% OFF en figuras con código OTAKU20
• Redes: @adonosekai (Instagram, Facebook, TikTok)

REGLAS:
1. SIEMPRE responde en español
2. Sé amigable y usa emojis otaku (🎌⚔️🎎📚🔥)
3. Máximo 3-4 oraciones
4. Si no sabes algo, sugiere contactar por WhatsApp
5. Si preguntan precios, menciona el rango y ejemplos específicos
6. Si preguntan por stock, da números exactos
7. Si preguntan por envíos, menciona zonas y tiempos`;

function initChat() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendChatMessage(); });
    }
    setTimeout(() => {
        if (!chatOpen) {
            const badge = document.getElementById('chatBadge');
            if (badge) badge.textContent = '1';
        }
    }, 3000);
}

function initAI() {
    // 🔑 IA: Configura COHERE_API_KEY arriba para activar la IA real
    // Si no hay API key, el chatbot usa respuestas inteligentes locales (fallback)
    useRealAI = COHERE_API_KEY && COHERE_API_KEY.length > 20;
    aiProvider = 'cohere';
    console.log(useRealAI ? '✅ Cohere AI activada' : '⚠️ IA local activa (sin API key - configura tu key en COHERE_API_KEY)');
}

window.toggleChat = function() {
    const chatWindow = document.getElementById('chatWindow');
    const chatBadge = document.getElementById('chatBadge');
    chatOpen = !chatOpen;
    if (chatOpen) {
        chatWindow.classList.add('active');
        if (chatBadge) chatBadge.style.display = 'none';
        document.getElementById('chatInput').focus();
        const messages = document.getElementById('chatMessages');
        messages.scrollTop = messages.scrollHeight;
    } else {
        chatWindow.classList.remove('active');
    }
};

function closeChat() {
    chatOpen = false;
    document.getElementById('chatWindow').classList.remove('active');
}

window.sendChatMessage = async function() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    const text = input.value.trim();
    if (!text) return;

    // Guardar en historial
    chatHistory.push({ type: 'user', text, time: getCurrentTime() });

    // Mensaje usuario
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-message user';
    userMsg.innerHTML = `<div class="chat-bubble">${escapeHtml(text)}</div><span class="chat-time">${getCurrentTime()}</span>`;
    messages.appendChild(userMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    // Mostrar "escribiendo..."
    showTypingIndicator(messages);

    let responseText = '';
    let actions = [];

    try {
        if (useRealAI && COHERE_API_KEY && COHERE_API_KEY.length > 20) {
            // 🧠 IA REAL - Cohere API
            console.log('🧠 Calling Cohere API...');
            responseText = await getCohereResponse(text);
            if (!responseText || responseText.trim() === '') {
                throw new Error('Empty response from Cohere');
            }
            actions = extractActions(responseText);
            console.log('✅ Cohere response received');
        } else {
            throw new Error('Cohere not configured');
        }
    } catch (error) {
        console.warn('⚠️ Cohere failed, using smart fallback:', error.message);
        // Fallback a IA local solo si Cohere realmente falla
        const result = getSmartResponse(text);
        responseText = result.text;
        actions = result.actions;
    }

    // Delay natural
    const delay = Math.max(800, Math.min(responseText.length * 25, 2500));

    setTimeout(() => {
        removeTypingIndicator(messages);

        const botMsg = document.createElement('div');
        botMsg.className = 'chat-message bot';
        let html = `<div class="chat-bubble">${responseText}</div>`;

        // Botones de acción
        if (actions && actions.length > 0) {
            html += '<div class="chat-actions">';
            actions.forEach(actionKey => {
                const action = CHAT_ACTIONS[actionKey];
                if (action) {
                    html += `<button class="chat-action-btn" onclick="handleChatAction('${actionKey}')">${action.label}</button>`;
                }
            });
            html += '</div>';
        }

        html += `<span class="chat-time">${getCurrentTime()}</span>`;
        botMsg.innerHTML = html;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;

        chatHistory.push({ type: 'bot', text: responseText, time: getCurrentTime() });

        // Limitar historial
        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);
    }, delay);
};

/* ============================
   🧠 COHERE API - IA REAL
   ============================ */
async function getCohereResponse(userMessage) {
    const apiKey = COHERE_API_KEY;
    if (!apiKey || apiKey.length < 20) {
        throw new Error('Cohere not configured');
    }

    // Preparar mensajes para Cohere con contexto de conversación
    const chatHistoryForAPI = [];

    // Añadir contexto reciente (últimos 6 mensajes)
    const recentHistory = chatHistory.slice(-6);
    for (let i = 0; i < recentHistory.length - 1; i++) {
        const msg = recentHistory[i];
        if (msg.type === 'user') {
            chatHistoryForAPI.push({ role: 'USER', message: msg.text });
        } else {
            chatHistoryForAPI.push({ role: 'CHATBOT', message: msg.text });
        }
    }

    try {
        // Llamar directamente a Cohere API
        let response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: 'command-r-08-2024',
                message: userMessage,
                preamble: SYSTEM_PROMPT,
                chat_history: chatHistoryForAPI,
                temperature: 0.7,
                max_tokens: 250,
                connectors: []
            })
        });

        // Si falla con 404, intentar con endpoint v2
        if (response.status === 404) {
            console.log('Intentando endpoint v2...');
            response = await fetch('https://api.cohere.com/v2/chat', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: 'command-r-08-2024',
                    messages: [
                        { role: 'system', content: SYSTEM_PROMPT },
                        ...chatHistoryForAPI.map(h => ({ role: h.role === 'USER' ? 'user' : 'assistant', content: h.message })),
                        { role: 'user', content: userMessage }
                    ],
                    temperature: 0.7,
                    max_tokens: 250
                })
            });
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Cohere error:', errorData);
            throw new Error(`Cohere API error: ${response.status}`);
        }

        const data = await response.json();
        // Manejar ambos formatos de respuesta (v1 y v2)
        const text = data.text || 
                     data.message?.content?.[0]?.text || 
                     data.messages?.[data.messages.length - 1]?.content ||
                     'No pude procesar tu mensaje. ¿Intentas de nuevo?';

        return text;
    } catch (error) {
        console.warn('Cohere API falló, usando fallback local:', error.message);
        throw error; // Se captura arriba y usa fallback
    }
}

/* ============================
   🧠 IA SIMULADA INTELIGENTE
   (Fallback cuando no hay API key)
   ============================ */
function getSmartResponse(text) {
    const lower = text.toLowerCase();
    let category = null;
    let maxScore = 0;

    const categories = {
        saludos: { keywords: ['hola', 'buenas', 'hey', 'saludos', 'que tal', 'como estas', 'holi', 'konnichiwa', 'hi', 'hello'], score: 0 },
        despedidas: { keywords: ['adios', 'chau', 'hasta luego', 'bye', 'nos vemos', 'gracias', 'thank', 'sayonara'], score: 0 },
        precios: { keywords: ['precio', 'cuanto', 'costo', 'vale', 'precios', 'barato', 'caro', 'oferta', 'descuento', 'cuesta', 's/'], score: 0 },
        figuras: { keywords: ['figura', 'figure', 'figuras', 'banpresto', 'bandai', 'good smile', 'goku', 'levi', 'dragon ball'], score: 0 },
        manga: { keywords: ['manga', 'comic', 'tomos', 'volumen', 'shonen', 'seinen', 'attack on titan', 'jujutsu', 'demon slayer'], score: 0 },
        merch: { keywords: ['merch', 'ropa', 'hoodie', 'polera', 'taza', 'llavero', 'accesorio', 'naruto', 'one piece'], score: 0 },
        cosplay: { keywords: ['cosplay', 'disfraz', 'traje', 'kimono', 'espada', 'tanjiro', 'demon slayer'], score: 0 },
        envios: { keywords: ['envio', 'entrega', 'delivery', 'enviar', 'provincia', 'lima', 'distrito', 'llega', 'olva'], score: 0 },
        pagos: { keywords: ['pago', 'yape', 'plin', 'transferencia', 'efectivo', 'tarjeta', 'pagar', 'qr'], score: 0 },
        horarios: { keywords: ['horario', 'hora', 'abierto', 'atencion', 'cuando', 'dias', '10am', '8pm'], score: 0 },
        ubicacion: { keywords: ['ubicacion', 'direccion', 'donde', 'local', 'tienda', 'mapa', 'av. otaku'], score: 0 },
        pedido: { keywords: ['pedido', 'orden', 'comprar', 'compra', 'quiero', 'deseo', 'encargar', 'reservar'], score: 0 },
        stock: { keywords: ['stock', 'disponible', 'hay', 'tienen', 'queda', 'agotado', 'últimos'], score: 0 },
        anime: { keywords: ['anime', 'serie', 'dragon ball', 'naruto', 'attack on titan', 'demon slayer', 'jujutsu', 'one piece', 'genshin'], score: 0 },
        ayuda: { keywords: ['ayuda', 'help', 'soporte', 'assistencia', 'problema', 'no funciona', 'error'], score: 0 },
        redes: { keywords: ['redes', 'facebook', 'instagram', 'tiktok', 'twitter', 'social', 'seguir', 'sorteo'], score: 0 }
    };

    for (const [cat, data] of Object.entries(categories)) {
        for (const keyword of data.keywords) {
            if (lower.includes(keyword)) data.score++;
        }
        if (data.score > maxScore) {
            maxScore = data.score;
            category = cat;
        }
    }

    const responses = {
        saludos: [
            '¡Hola! 👋 Soy Ado-chan, tu asistente otaku. ¿Buscas figuras, manga, merch o cosplay? Te ayudo con lo que necesites.',
            '¡Konnichiwa! 🎌 Bienvenido a Ado no Sekai. ¿En qué puedo ayudarte hoy? Tenemos ofertas increíbles.',
            '¡Hola, otaku! ⚔️ ¿Listo para descubrir algo épico? Pregúntame por productos, precios o envíos.'
        ],
        despedidas: [
            '¡Sayonara! 👋 Vuelve pronto. Recuerda que el código OTAKU20 te da 20% OFF en figuras.',
            '¡Gracias por visitarnos! 🎌 Que tengas un día lleno de anime y buenas vibras.',
            '¡Hasta la próxima! ⚔️ No olvides seguirnos en @adonosekai para sorteos exclusivos.'
        ],
        precios: [
            '💰 Nuestros precios: Figuras desde S/29.90, Manga desde S/24.90, Merch desde S/19.90, Cosplay desde S/89.90. ¿Te interesa alguna categoría en particular?',
            '🎌 Tenemos productos para todos los bolsillos. Goku Ultra Instinct está S/149.90 y el manga de Attack on Titan S/29.90. ¿Quieres ver el catálogo?',
            '💎 ¡Buena noticia! Usa el código **OTAKU20** y obtén 20% de descuento en todas las figuras hoy. ¿Te muestro las disponibles?'
        ],
        figuras: [
            '🎎 Figuras disponibles: Goku Ultra Instinct (S/149.90) - 30cm con efectos de energía, Levi Ackerman (S/179.90) - articulada con base 3D. ¿Qué personaje buscas?',
            '⚔️ Nuestras figuras son de colección. Goku tiene solo 5 unidades en stock. ¿Te gustaría reservarla antes de que se agote?',
            '🏆 Las figuras más vendidas son de Dragon Ball y Attack on Titan. ¿Quieres que te muestre todo el catálogo de figuras?'
        ],
        manga: [
            '📚 Manga disponible: Attack on Titan Vol.1 (S/29.90) - edición tapa dura, Jujutsu Kaisen Vol.15 (S/34.90) - con póster exclusivo. ¿Qué serie te interesa?',
            '📖 Tenemos manga de las series más populares. ¿Buscas algún volumen específico? Podemos conseguirlo si no lo tenemos.',
            '✨ El manga de Jujutsu Kaisen Vol.15 viene con póster de edición limitada. Solo quedan 8 unidades. ¿Te interesa?'
        ],
        merch: [
            '👕 Merch disponible: Hoodie Naruto Akatsuki (S/89.90) - tallas S-XXL, Taza Genshin Impact (S/39.90) - 350ml cerámica, Llaveros One Piece (S/24.90) - set de 5.',
            '🎁 Tenemos hoodies, tazas, llaveros y más. ¿Buscas algo para regalar? Te puedo recomendar según el presupuesto.',
            '🔥 El hoodie Akatsuki es nuestro bestseller. ¿Te gustaría ver más merch o prefieres otro producto?'
        ],
        cosplay: [
            '👘 Cosplay Demon Slayer - Tanjiro completo (S/199.90) incluye espada Nichirin, máscara Hanafuda y traje. ¿Buscas otro personaje?',
            '⚔️ Nuestros cosplays son de alta calidad. También hacemos personalizados. ¿Tienes algún personaje específico en mente?',
            '🎭 El cosplay de Tanjiro está muy demandado. Solo quedan 3 unidades. ¿Te gustaría reservarlo?'
        ],
        envios: [
            '🚚 Envíos: Lima metropolitana S/10-15 (delivery mismo día en zona centro), provincias por Olva Courier 2-3 días hábiles. ¿A qué distrito te enviamos?',
            '📦 Todos los envíos incluyen seguro y número de tracking. ¿Te gustaría hacer un pedido ahora?',
            '✅ Hacemos delivery el mismo día en Lima centro si ordenas antes de las 3pm. ¿Te interesa?'
        ],
        pagos: [
            '💳 Aceptamos: Yape, Plin, transferencia bancaria y efectivo contra entrega. ¿Cuál prefieres? Te enviamos el QR al confirmar.',
            '📱 Yape y Plin son los más rápidos. Al confirmar tu pedido te enviamos el QR de pago por WhatsApp.',
            '💰 También puedes pagar en efectivo al recibir. ¿Te gustaría hacer un pedido ahora?'
        ],
        horarios: [
            '🕐 Horario tienda física: Lunes a Sábado 10am - 8pm. WhatsApp disponible 24/7 para consultas.',
            '⏰ Estamos abiertos ahora si es horario comercial. Pero puedes escribirnos por WhatsApp a cualquier hora y respondemos ASAP.',
            '📱 WhatsApp: +51 999 999 999. Respondemos incluso en horario nocturno para urgencias. ¿Te gustaría escribirnos?'
        ],
        ubicacion: [
            '📍 Estamos en Av. Otaku #123, Lima, Perú. Cerca del centro comercial. ¿Quieres ver la ubicación exacta en Google Maps?',
            '🗺️ Puedes ver nuestra ubicación haciendo clic en "Ver en Mapa" en la sección de contacto. ¿Te llevo allí?',
            '🏪 También tenemos tienda online 24/7. ¿Prefieres comprar online o visitarnos presencialmente?'
        ],
        pedido: [
            '🛒 Para pedir: 1) Selecciona producto, 2) Clic en 👁️, 3) Completa el formulario. ¿Te muestro los productos?',
            '📋 También puedes escribirnos por WhatsApp con lo que buscas y te armamos el pedido personalizado.',
            '✨ ¿Ya viste nuestra oferta? 20% OFF en figuras con código OTAKU20. ¿Te interesa?'
        ],
        stock: [
            '📦 Puedes ver el stock en cada tarjeta de producto. Los que dicen "⚡ Últimos" tienen menos de 3 unidades.',
            '🔥 Los productos destacados se agotan rápido. Goku Ultra Instinct solo tiene 5 unidades. ¿Te interesa reservar?',
            '💬 Si algo está agotado, déjanos una consulta y te avisamos cuando llegue. ¿Te gustaría consultar por algo específico?'
        ],
        anime: [
            '🎌 ¡Gran elección! Tenemos productos de esa serie. ¿Te muestro figuras, manga o merch de esa serie?',
            '⭐ Esa serie tiene muchos fans. Tenemos desde figuras hasta cosplay. ¿Qué categoría prefieres?',
            '🔥 Los productos de esa serie son muy populares. ¿Quieres ver todo lo que tenemos disponible?'
        ],
        ayuda: [
            '🆘 ¿Problema? Escríbenos por WhatsApp para respuesta inmediata, o deja una consulta en el formulario de contacto.',
            '🔧 Para soporte técnico rápido: WhatsApp +51 999 999 999. Respondemos en minutos.',
            '💡 También puedes revisar nuestra sección de contacto. ¿Te llevo allí?'
        ],
        redes: [
            '📱 Síguenos: Facebook @adonosekai, Instagram @adonosekai, TikTok @adonosekai. ¡Sorteos semanales!',
            '🎁 En Instagram hacemos sorteos mensuales de productos otaku. ¿Ya nos sigues?',
            '🔔 Activa notificaciones para no perderte lanzamientos exclusivos. ¿Te gustaría ver nuestras redes?'
        ]
    };

    if (!category || maxScore === 0) {
        const defaults = [
            '🤔 Hmm, no estoy segura de entender eso. ¿Puedes darme más detalles? Puedo ayudarte con: productos, precios, envíos, pagos, horarios o ubicación.',
            '💭 Interesante... ¿Buscas algo específico? Tenemos figuras, manga, merch y cosplay. ¿Te muestro el catálogo?',
            '🎌 Soy Ado-chan, tu asistente otaku. ¿En qué puedo ayudarte? Puedo mostrarte productos, darte precios o ayudarte con un pedido.'
        ];
        return { text: defaults[Math.floor(Math.random() * defaults.length)], actions: ['ver_productos', 'contactar'] };
    }

    const catResponses = responses[category] || responses.saludos;
    const responseText = catResponses[Math.floor(Math.random() * catResponses.length)];

    const actionMap = {
        saludos: ['ver_productos', 'ver_oferta', 'contactar'],
        despedidas: ['seguir_redes', 'ver_oferta'],
        precios: ['ver_productos', 'ver_oferta', 'contactar'],
        figuras: ['ver_figuras', 'ver_productos', 'hacer_pedido'],
        manga: ['ver_manga', 'ver_productos', 'hacer_pedido'],
        merch: ['ver_merch', 'ver_productos', 'hacer_pedido'],
        cosplay: ['ver_cosplay', 'ver_productos', 'contactar'],
        envios: ['hacer_pedido', 'contactar', 'ver_productos'],
        pagos: ['hacer_pedido', 'contactar'],
        horarios: ['contactar', 'ver_productos'],
        ubicacion: ['ver_mapa', 'ver_productos', 'contactar'],
        pedido: ['ver_productos', 'ver_oferta', 'contactar'],
        stock: ['ver_productos', 'contactar'],
        anime: ['ver_productos', 'ver_figuras', 'ver_manga'],
        ayuda: ['contactar', 'ver_productos'],
        redes: ['seguir_redes', 'ver_oferta']
    };

    return { text: responseText, actions: actionMap[category] || ['ver_productos', 'contactar'] };
}

function extractActions(text) {
    const actions = [];
    const lower = text.toLowerCase();

    if (lower.includes('producto') || lower.includes('catálogo') || lower.includes('figura') || lower.includes('manga')) actions.push('ver_productos');
    if (lower.includes('oferta') || lower.includes('descuento') || lower.includes('código') || lower.includes('promo')) actions.push('ver_oferta');
    if (lower.includes('whatsapp') || lower.includes('contactar') || lower.includes('escribir') || lower.includes('teléfono')) actions.push('contactar');
    if (lower.includes('pedido') || lower.includes('comprar') || lower.includes('orden')) actions.push('hacer_pedido');
    if (lower.includes('mapa') || lower.includes('ubicación') || lower.includes('dirección')) actions.push('ver_mapa');
    if (lower.includes('instagram') || lower.includes('redes') || lower.includes('seguir')) actions.push('seguir_redes');

    if (actions.length === 0) {
        if (lower.includes('precio') || lower.includes('costo')) actions.push('ver_productos');
        else if (lower.includes('envío') || lower.includes('entrega')) actions.push('contactar');
        else actions.push('ver_productos', 'contactar');
    }

    return actions.slice(0, 3);
}

/* ============================
   ACCIONES DEL CHAT
   ============================ */
const CHAT_ACTIONS = {
    ver_productos: { label: '🛍️ Ver Productos' },
    ver_figuras: { label: '🎎 Ver Figuras' },
    ver_manga: { label: '📚 Ver Manga' },
    ver_merch: { label: '👕 Ver Merch' },
    ver_cosplay: { label: '👘 Ver Cosplay' },
    ver_oferta: { label: '🎁 Ver Oferta' },
    contactar: { label: '📱 WhatsApp' },
    hacer_pedido: { label: '🛒 Hacer Pedido' },
    ver_mapa: { label: '🗺️ Ver Mapa' },
    seguir_redes: { label: '📸 Instagram' }
};

window.handleChatAction = function(actionKey) {
    switch(actionKey) {
        case 'ver_productos':
            closeChat();
            document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
            break;
        case 'ver_figuras':
            closeChat();
            currentFilter = 'figuras';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'figuras'));
            renderProducts();
            document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
            break;
        case 'ver_manga':
            closeChat();
            currentFilter = 'manga';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'manga'));
            renderProducts();
            document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
            break;
        case 'ver_merch':
            closeChat();
            currentFilter = 'merch';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'merch'));
            renderProducts();
            document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
            break;
        case 'ver_cosplay':
            closeChat();
            currentFilter = 'cosplay';
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.toggle('active', b.dataset.filter === 'cosplay'));
            renderProducts();
            document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
            break;
        case 'ver_oferta':
            showPromoModal();
            break;
        case 'contactar':
            window.open('https://wa.me/51999999999', '_blank');
            break;
        case 'hacer_pedido':
            closeChat();
            document.getElementById('productos').scrollIntoView({ behavior: 'smooth' });
            break;
        case 'ver_mapa':
            window.open('https://maps.google.com', '_blank');
            break;
        case 'seguir_redes':
            window.open('https://instagram.com/adonosekai', '_blank');
            break;
    }
};

/* ============================
   UTILIDADES CHAT
   ============================ */
function showTypingIndicator(container) {
    isTyping = true;
    const typing = document.createElement('div');
    typing.id = 'chatTyping';
    typing.className = 'chat-message bot typing';
    typing.innerHTML = `<div class="chat-bubble typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
}

function removeTypingIndicator(container) {
    isTyping = false;
    const typing = document.getElementById('chatTyping');
    if (typing) typing.remove();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

/* ============================
   CONFIGURACIÓN API KEY
   ============================ */
// 🔑 Para activar la IA real, edita la constante COHERE_API_KEY al inicio de este archivo
// Obtén tu API key gratis en: https://cohere.com
// Sin API key, el chatbot funciona con respuestas inteligentes locales


/* ============================================================
   PASOS DEL PROCESO - Inicialización
   ============================================================ */

function initProcessSteps() {
    // Restaurar progreso al cargar
    setTimeout(() => {
        if (completedSteps.length > 0) {
            completedSteps.forEach(step => markStepCompleted(step));
            updateProgressBar(Math.max(...completedSteps));
        }
    }, 1500);
}

/* ============================
   TELEGRAM BOT INTEGRACIÓN
   ============================ */

// Enviar notificación de pedido a Telegram (configurable)
window.sendTelegramNotification = async function(message) {
    const BOT_TOKEN = localStorage.getItem('ado-telegram-token') || '';
    const CHAT_ID = localStorage.getItem('ado-telegram-chat') || '';

    if (!BOT_TOKEN || !CHAT_ID) {
        console.log('Telegram no configurado. Guarda token y chat ID en localStorage.');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        return response.ok;
    } catch (error) {
        console.error('Error Telegram:', error);
        return false;
    }
};

// Configurar Telegram
window.configureTelegram = function(token, chatId) {
    localStorage.setItem('ado-telegram-token', token);
    localStorage.setItem('ado-telegram-chat', chatId);
    showToast('success', 'Telegram Configurado', 'Las notificaciones se enviarán a tu bot');
};

/* ============================
   HUGGING FACE IA BACKUP
   ============================ */

// Fallback con Hugging Face Inference API (gratuito)
window.getHuggingFaceResponse = async function(userMessage) {
    const HF_API_KEY = localStorage.getItem('ado-hf-key') || '';
    if (!HF_API_KEY) return null;

    try {
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${HF_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                inputs: `<s>[INST] ${SYSTEM_PROMPT}

Usuario: ${userMessage} [/INST]`,
                parameters: { max_new_tokens: 250, temperature: 0.7 }
            })
        });

        if (!response.ok) return null;
        const data = await response.json();
        return data[0]?.generated_text?.split('[/INST]')?.pop()?.trim() || null;
    } catch (error) {
        console.error('HF Error:', error);
        return null;
    }
};

// Configurar Hugging Face
window.configureHuggingFace = function(apiKey) {
    localStorage.setItem('ado-hf-key', apiKey);
    showToast('success', 'Hugging Face Configurado', 'Backup IA activado');
};




/* ============================================================
   MASCOT ANIME - Animaciones y comportamiento
   ============================================================ */

let mascotMessages = [
    "¡Hola! 👋 Soy Ado-chan. Te guiaré por estos 5 pasos. ¡Haz clic en cualquiera para comenzar!",
    "¿Buscas algo específico? 💬 Puedo ayudarte a encontrar el producto perfecto.",
    "¡No olvides nuestra oferta! 🎁 20% OFF en figuras con código OTAKU20.",
    "¿Necesitas ayuda? 🤖 Nuestro chat IA está disponible 24/7.",
    "¡Síguenos en redes! 📸 @adonosekai para sorteos y novedades."
];

let currentMascotMsg = 0;
let mascotInterval = null;

function initMascot() {
    const mascotBubble = document.getElementById('mascotBubble');
    const mascotImg = document.getElementById('mascotImg');

    if (!mascotBubble || !mascotImg) return;

    // Cambiar mensaje cada 8 segundos
    mascotInterval = setInterval(() => {
        currentMascotMsg = (currentMascotMsg + 1) % mascotMessages.length;

        // Animación de cambio
        mascotBubble.style.animation = 'none';
        mascotBubble.offsetHeight; // Trigger reflow
        mascotBubble.style.animation = 'bubblePop 0.5s ease';

        mascotBubble.querySelector('p').textContent = mascotMessages[currentMascotMsg];

        // Cambiar imagen según el mensaje
        if (currentMascotMsg === 0 || currentMascotMsg === 3) {
            mascotImg.src = 'mascot-waving.png';
        } else {
            mascotImg.src = 'mascot-pointing.png';
        }
    }, 8000);

    // Click en mascot abre chat
    mascotImg.addEventListener('click', () => {
        toggleChat();
        mascotBubble.querySelector('p').textContent = "¡Abriendo chat! 💬 Pregúntame lo que necesites.";
    });
}

// Inicializar mascot cuando carga
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMascot, 2000);
});

/* ============================================================
   PASOS DEL PROCESO - FUNCIONALIDAD INTERACTIVA MEJORADA
   ============================================================ */

let completedSteps = JSON.parse(localStorage.getItem('ado-completed-steps') || '[]');

window.handleProcessStep = function(stepNumber) {
    // Marcar paso como completado visualmente
    markStepCompleted(stepNumber);

    // Actualizar barra de progreso
    updateProgressBar(stepNumber);

    // Actualizar mensaje del mascot según el paso
    updateMascotForStep(stepNumber);

    switch(stepNumber) {
        case 1: // Contacto
            showStepModal('📱 Contacto', 'fa-comment-dots', 
                '¡Primer paso! Escríbenos por WhatsApp para una respuesta inmediata, usa nuestro chat con IA, o deja una consulta en el formulario.',
                [
                    { label: '📱 WhatsApp', action: 'window.open("https://wa.me/51999999999", "_blank")' },
                    { label: '💬 Chat IA', action: 'toggleChat(); closeStepModal();' },
                    { label: '📝 Formulario', action: 'document.getElementById("contacto").scrollIntoView({behavior:"smooth"}); closeStepModal();' }
                ]
            );
            break;

        case 2: // Asesoría
            showStepModal('🤖 Asesoría Personalizada', 'fa-user-tie',
                '¡Segundo paso! Nuestro chatbot con IA te ayuda a encontrar el producto perfecto. También puedes ver nuestro catálogo filtrado por categorías.',
                [
                    { label: '🤖 Chat IA', action: 'toggleChat(); closeStepModal();' },
                    { label: '🛍️ Ver Catálogo', action: 'document.getElementById("productos").scrollIntoView({behavior:"smooth"}); closeStepModal();' },
                    { label: '🔍 Buscar', action: 'document.getElementById("productos").scrollIntoView({behavior:"smooth"}); setTimeout(() => document.getElementById("searchProducts").focus(), 500); closeStepModal();' }
                ]
            );
            break;

        case 3: // Pedido
            showStepModal('🛒 Hacer Pedido', 'fa-clipboard-check',
                '¡Tercer paso! Selecciona un producto, haz clic en el ojo 👁️ para ver detalles, completa el formulario y confirma tu pedido.',
                [
                    { label: '🛒 Ver Productos', action: 'document.getElementById("productos").scrollIntoView({behavior:"smooth"}); closeStepModal();' },
                    { label: '🎁 Ver Oferta', action: 'showPromoModal(); closeStepModal();' },
                    { label: '📋 Mis Pedidos', action: 'window.open("admin.html", "_blank"); closeStepModal();' }
                ]
            );
            break;

        case 4: // Entrega
            showStepModal('🚚 Entrega y Envíos', 'fa-shipping-fast',
                '¡Cuarto paso! Hacemos delivery en Lima metropolitana (S/10-15) y envíos a provincias por Olva Courier. Tracking incluido.',
                [
                    { label: '🗺️ Ver Mapa', action: 'window.open("https://maps.google.com", "_blank"); closeStepModal();' },
                    { label: '📱 Contactar', action: 'window.open("https://wa.me/51999999999", "_blank"); closeStepModal();' },
                    { label: '💰 Ver Precios', action: 'document.getElementById("productos").scrollIntoView({behavior:"smooth"}); closeStepModal();' }
                ]
            );
            break;

        case 5: // Fidelización
            showStepModal('❤️ Únete a la Comunidad', 'fa-heart',
                '¡Quinto paso! Síguenos en redes sociales para sorteos, novedades y descuentos exclusivos. ¡Sé parte de la familia otaku!',
                [
                    { label: '📸 Instagram', action: 'window.open("https://instagram.com/adonosekai", "_blank"); closeStepModal();' },
                    { label: '🎵 TikTok', action: 'window.open("https://tiktok.com/@adonosekai", "_blank"); closeStepModal();' },
                    { label: '📘 Facebook', action: 'window.open("https://facebook.com/adonosekai", "_blank"); closeStepModal();' },
                    { label: '🐦 Twitter', action: 'window.open("https://twitter.com/adonosekai", "_blank"); closeStepModal();' }
                ]
            );
            break;
    }

    // Guardar progreso
    localStorage.setItem('ado-completed-steps', JSON.stringify(completedSteps));
};

function updateMascotForStep(stepNumber) {
    const mascotBubble = document.getElementById('mascotBubble');
    const mascotImg = document.getElementById('mascotImg');
    if (!mascotBubble || !mascotImg) return;

    const stepMessages = {
        1: "¡Excelente primer paso! 📱 El contacto es la clave. ¿Por dónde prefieres escribirnos?",
        2: "¡Buena elección! 🤖 Nuestra IA te ayudará a encontrar el producto perfecto.",
        3: "¡Vamos allá! 🛒 Elige tu producto favorito y haz el pedido.",
        4: "¡Casi listo! 🚚 Tu pedido llegará pronto. ¿A qué dirección te lo enviamos?",
        5: "¡Bienvenido a la familia! ❤️ Síguenos para no perderte ninguna novedad."
    };

    mascotBubble.querySelector('p').textContent = stepMessages[stepNumber] || mascotMessages[0];
    mascotImg.src = 'mascot-pointing.png';

    // Reset interval
    if (mascotInterval) clearInterval(mascotInterval);
    mascotInterval = setInterval(() => {
        currentMascotMsg = (currentMascotMsg + 1) % mascotMessages.length;
        mascotBubble.style.animation = 'none';
        mascotBubble.offsetHeight;
        mascotBubble.style.animation = 'bubblePop 0.5s ease';
        mascotBubble.querySelector('p').textContent = mascotMessages[currentMascotMsg];
        mascotImg.src = (currentMascotMsg === 0 || currentMascotMsg === 3) ? 'mascot-waving.png' : 'mascot-pointing.png';
    }, 8000);
}

function markStepCompleted(stepNumber) {
    if (!completedSteps.includes(stepNumber)) {
        completedSteps.push(stepNumber);
    }

    document.querySelectorAll('.process-step').forEach((step, index) => {
        if (completedSteps.includes(index + 1)) {
            step.classList.add('completed');
        }
    });

    document.querySelectorAll('.progress-step').forEach((step, index) => {
        if (completedSteps.includes(index + 1)) {
            step.classList.add('active');
        }
    });
}

function updateProgressBar(stepNumber) {
    const fill = document.getElementById('progressFill');
    if (fill) {
        const progress = (stepNumber / 5) * 100;
        fill.style.width = progress + '%';
    }
}

function showStepModal(title, icon, description, actions) {
    // Cerrar modal anterior si existe
    closeStepModal();

    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'stepModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeStepModal()"></div>
        <div class="modal-content modal-scrollable" style="max-width: 500px;">
            <button class="modal-close" onclick="closeStepModal()">&times;</button>
            <div class="modal-body step-detail-modal">
                <div class="step-icon-large"><i class="fas ${icon}"></i></div>
                <h3>${title}</h3>
                <p>${description}</p>
                <div class="step-detail-actions">
                    ${actions.map(a => `<button class="btn btn-primary" onclick="${a.action}">${a.label}</button>`).join('')}
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
}

window.closeStepModal = function() {
    const modal = document.getElementById('stepModal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
};

// Restaurar progreso al cargar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (completedSteps.length > 0) {
            completedSteps.forEach(step => markStepCompleted(step));
            updateProgressBar(Math.max(...completedSteps));
        }
    }, 1500);
});


/* ============================
   FUNCIONES PREMIUM HABILITADAS
   ============================ */

// Tienda Premium - mostrar modal con productos exclusivos
window.showPremiumStore = function() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'premiumModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closePremiumModal()"></div>
        <div class="modal-content modal-scrollable" style="max-width: 700px;">
            <button class="modal-close" onclick="closePremiumModal()">&times;</button>
            <div class="modal-body" style="padding: 30px;">
                <div style="text-align:center; margin-bottom: 25px;">
                    <span style="font-size: 3rem;">👑</span>
                    <h2 style="font-family: var(--font-display); margin-top: 10px;">Tienda Premium</h2>
                    <p style="color: var(--color-gray-400);">Productos exclusivos para verdaderos otakus</p>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
                    <div style="background: var(--color-dark-card); border-radius: var(--radius-lg); padding: 20px; border: 2px solid var(--color-secondary); text-align: center;">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 10px;">🏆</span>
                        <h3 style="margin-bottom: 8px;">Edición Limitada</h3>
                        <p style="color: var(--color-gray-400); font-size: 0.9rem; margin-bottom: 15px;">Figuras numeradas de edición limitada</p>
                        <span style="color: var(--color-secondary); font-weight: 900; font-size: 1.2rem;">Desde S/299.90</span>
                    </div>
                    <div style="background: var(--color-dark-card); border-radius: var(--radius-lg); padding: 20px; border: 2px solid var(--color-secondary); text-align: center;">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 10px;">🎌</span>
                        <h3 style="margin-bottom: 8px;">Importados Japón</h3>
                        <p style="color: var(--color-gray-400); font-size: 0.9rem; margin-bottom: 15px;">Productos directos desde Japón</p>
                        <span style="color: var(--color-secondary); font-weight: 900; font-size: 1.2rem;">Desde S/199.90</span>
                    </div>
                    <div style="background: var(--color-dark-card); border-radius: var(--radius-lg); padding: 20px; border: 2px solid var(--color-secondary); text-align: center;">
                        <span style="font-size: 2.5rem; display: block; margin-bottom: 10px;">✨</span>
                        <h3 style="margin-bottom: 8px;">Personalizados</h3>
                        <p style="color: var(--color-gray-400); font-size: 0.9rem; margin-bottom: 15px;">Cosplay y figuras personalizadas</p>
                        <span style="color: var(--color-secondary); font-weight: 900; font-size: 1.2rem;">Desde S/149.90</span>
                    </div>
                </div>
                <div style="text-align: center; margin-top: 25px;">
                    <button class="btn btn-gold" onclick="closePremiumModal(); showToast('info', 'Próximamente', 'La tienda premium estará disponible muy pronto. ¡Síguenos en redes para el lanzamiento!');">
                        <i class="fas fa-bell"></i> Notificarme al lanzar
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
};

window.closePremiumModal = function() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
};

// Mostrar Términos y Condiciones
window.showTerms = function() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'termsModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeTermsModal()"></div>
        <div class="modal-content modal-scrollable" style="max-width: 600px;">
            <button class="modal-close" onclick="closeTermsModal()">&times;</button>
            <div class="modal-body" style="padding: 30px;">
                <h2 style="font-family: var(--font-display); margin-bottom: 20px;">📋 Términos y Condiciones</h2>
                <div style="color: var(--color-gray-400); line-height: 1.7; max-height: 60vh; overflow-y: auto;">
                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">1. General</h3>
                    <p>Al usar Ado no Sekai, aceptas estos términos. Nos reservamos el derecho de modificarlos en cualquier momento.</p>

                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">2. Productos</h3>
                    <p>Todos los productos son originales y oficiales. Las imágenes son referenciales. El stock está sujeto a disponibilidad.</p>

                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">3. Pagos</h3>
                    <p>Aceptamos Yape, Plin, transferencia y efectivo. Los pagos son procesados de forma segura.</p>

                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">4. Envíos</h3>
                    <p>Delivery en Lima: S/10-15. Provincias: Olva Courier 2-3 días hábiles. No nos hacemos responsables por retrasos de courier.</p>

                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">5. Devoluciones</h3>
                    <p>Aceptamos devoluciones dentro de 7 días si el producto está en perfecto estado. No aplica para productos personalizados.</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
};

window.closeTermsModal = function() {
    const modal = document.getElementById('termsModal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
};

// Mostrar Política de Privacidad
window.showPrivacy = function() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'privacyModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closePrivacyModal()"></div>
        <div class="modal-content modal-scrollable" style="max-width: 600px;">
            <button class="modal-close" onclick="closePrivacyModal()">&times;</button>
            <div class="modal-body" style="padding: 30px;">
                <h2 style="font-family: var(--font-display); margin-bottom: 20px;">🔒 Política de Privacidad</h2>
                <div style="color: var(--color-gray-400); line-height: 1.7; max-height: 60vh; overflow-y: auto;">
                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">1. Datos que recopilamos</h3>
                    <p>Nombre, email, teléfono y dirección solo para procesar pedidos. No vendemos ni compartimos tus datos.</p>

                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">2. Uso de datos</h3>
                    <p>Tus datos se usan únicamente para: procesar pedidos, contactarte sobre tu compra, y enviar newsletters (solo si te suscribes).</p>

                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">3. Seguridad</h3>
                    <p>Usamos encriptación y almacenamiento seguro en Supabase. Tu información está protegida.</p>

                    <h3 style="color: var(--color-white); margin: 15px 0 10px;">4. Tus derechos</h3>
                    <p>Puedes solicitar la eliminación de tus datos en cualquier momento escribiéndonos por WhatsApp.</p>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
};

window.closePrivacyModal = function() {
    const modal = document.getElementById('privacyModal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
};

// Mostrar Política de Envíos
window.showShipping = function() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'shippingModal';
    modal.innerHTML = `
        <div class="modal-overlay" onclick="closeShippingModal()"></div>
        <div class="modal-content modal-scrollable" style="max-width: 600px;">
            <button class="modal-close" onclick="closeShippingModal()">&times;</button>
            <div class="modal-body" style="padding: 30px;">
                <h2 style="font-family: var(--font-display); margin-bottom: 20px;">🚚 Política de Envíos</h2>
                <div style="color: var(--color-gray-400); line-height: 1.7;">
                    <div style="background: var(--color-dark-card); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 20px; border-left: 4px solid var(--color-primary);">
                        <h3 style="color: var(--color-white); margin-bottom: 10px;">📍 Lima Metropolitana</h3>
                        <p>• Delivery mismo día (zona centro): <strong style="color: var(--color-secondary)">S/10</strong></p>
                        <p>• Delivery 24h (otros distritos): <strong style="color: var(--color-secondary)">S/15</strong></p>
                        <p>• Horario: Lun-Sab 10am-8pm</p>
                    </div>
                    <div style="background: var(--color-dark-card); border-radius: var(--radius-lg); padding: 20px; margin-bottom: 20px; border-left: 4px solid var(--color-secondary);">
                        <h3 style="color: var(--color-white); margin-bottom: 10px;">🌎 Provincias</h3>
                        <p>• Olva Courier: <strong style="color: var(--color-secondary)">S/25-35</strong> según zona</p>
                        <p>• Tiempo estimado: 2-4 días hábiles</p>
                        <p>• Tracking incluido</p>
                    </div>
                    <div style="background: var(--color-dark-card); border-radius: var(--radius-lg); padding: 20px; border-left: 4px solid #25D366;">
                        <h3 style="color: var(--color-white); margin-bottom: 10px;">✨ Envío Gratis</h3>
                        <p>• En compras mayores a <strong style="color: var(--color-secondary)">S/200</strong> en Lima</p>
                        <p>• En compras mayores a <strong style="color: var(--color-secondary)">S/350</strong> a provincias</p>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
};

window.closeShippingModal = function() {
    const modal = document.getElementById('shippingModal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 300);
    }
};

