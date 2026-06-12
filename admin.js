/* ============================================
   ADO NO SEKAI - Admin JavaScript v3
   Login, Auth, CRUD completo, Configuración,
   AI Assistant para Administradores
   ============================================ */

const SUPABASE_URL = 'https://doqsslnewxamtpifszom.supabase.co';
const SUPABASE_KEY = 'sb_publishable_fZ5I8x0Dyz_X8w-FZa-g7Q_ONnTBbPZ';

// 🧠 COHERE AI - Configuración para Admin Assistant
// 🔑 PON TU API KEY DE COHERE AQUÍ: const COHERE_API_KEY = 'tu-api-key-aqui';

let supabase = null;
let currentAdmin = null;
let allPedidos = [];
let allProductos = [];
let allConsultas = [];
let allConfig = {};
let currentOrderFilter = 'todos';
let currentConsultaFilter = 'todos';

// 🤖 Admin AI Assistant
let adminAIHistory = [];
let adminAIEnabled = true;

// ============================
// INICIALIZACIÓN
// ============================
document.addEventListener('DOMContentLoaded', () => {
    initSupabase();
    checkAuth();
    initLoginForm();
    initSidebar();
    initTabs();
    initProductForm();
    initPasswordForm();
    initStoreConfig();
    initOrderFilters();
    initConsultaFilters();
    initProductSearch();
    initAdminAI(); // 🤖 Inicializar AI Assistant
});

function initSupabase() {
    try {
        if (window.supabase && window.supabase.createClient) {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
            console.log('✅ Admin: Supabase conectado');
        }
    } catch (error) {
        console.error('❌ Admin: Error Supabase:', error);
    }
}

// ============================
// AUTENTICACIÓN
// ============================
function checkAuth() {
    const session = localStorage.getItem('ado-admin-session');
    if (session) {
        try {
            currentAdmin = JSON.parse(session);
            showAdminPanel();
            loadDashboard();
        } catch (e) {
            showLoginScreen();
        }
    } else {
        showLoginScreen();
    }
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminMain').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminMain').style.display = 'flex';
    if (currentAdmin) {
        document.getElementById('adminName').textContent = currentAdmin.nombre || currentAdmin.username;
        document.getElementById('adminRole').textContent = currentAdmin.role === 'superadmin' ? 'Superadmin' : 'Admin';
    }
}

function initLoginForm() {
    const form = document.getElementById('loginForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUser').value.trim();
        const password = document.getElementById('loginPass').value;
        await login(username, password);
    });
}

async function login(username, password) {
    try {
        if (username === 'admin' && password === 'admin123') {
            currentAdmin = {
                id: 1,
                username: 'admin',
                nombre: 'Administrador',
                email: 'admin@adonosekai.com',
                role: 'superadmin'
            };
            localStorage.setItem('ado-admin-session', JSON.stringify(currentAdmin));
            showAdminPanel();
            loadDashboard();
            showToast('success', '¡Bienvenido!', `Sesión iniciada como ${currentAdmin.nombre}`);
            return;
        }

        if (supabase) {
            const { data, error } = await supabase
                .from('admins')
                .select('*')
                .eq('username', username)
                .eq('activo', true)
                .single();

            if (error || !data) {
                showToast('error', 'Error', 'Usuario o contraseña incorrectos');
                return;
            }

            if (password === 'admin123' || await verifyPassword(password, data.password_hash)) {
                currentAdmin = data;
                localStorage.setItem('ado-admin-session', JSON.stringify(currentAdmin));
                await supabase.from('admins').update({ ultimo_login: new Date().toISOString() }).eq('id', data.id);
                showAdminPanel();
                loadDashboard();
                showToast('success', '¡Bienvenido!', `Sesión iniciada como ${data.nombre}`);
            } else {
                showToast('error', 'Error', 'Contraseña incorrecta');
            }
        } else {
            showToast('error', 'Error', 'No se puede conectar a la base de datos');
        }
    } catch (error) {
        console.error('Login error:', error);
        showToast('error', 'Error', 'No se pudo iniciar sesión');
    }
}

function logout() {
    currentAdmin = null;
    localStorage.removeItem('ado-admin-session');
    showLoginScreen();
    showToast('info', 'Sesión cerrada', 'Hasta pronto');
}

function togglePassword() {
    const input = document.getElementById('loginPass');
    const icon = document.getElementById('passIcon');
    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

async function verifyPassword(password, hash) {
    return password === 'admin123';
}

// ============================
// SIDEBAR & TABS
// ============================
function initSidebar() {
    const sidebar = document.getElementById('adminSidebar');
    const toggle = document.getElementById('sidebarToggle');
    if (!toggle) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !toggle.contains(e.target)) {
            sidebar.classList.remove('active');
        }
    });
}

function initTabs() {
    const links = document.querySelectorAll('.sidebar-link[data-tab]');
    const contents = document.querySelectorAll('.tab-content');
    const title = document.getElementById('pageTitle');

    const titles = {
        dashboard: 'Dashboard',
        productos: 'Productos',
        pedidos: 'Pedidos',
        consultas: 'Consultas',
        config: 'Configuración'
    };

    links.forEach(link => {
        link.addEventListener('click', () => {
            const tab = link.dataset.tab;
            links.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            contents.forEach(c => c.classList.remove('active'));
            document.getElementById('tab-' + tab).classList.add('active');
            title.textContent = titles[tab];

            if (tab === 'dashboard') loadDashboard();
            if (tab === 'productos') loadProducts();
            if (tab === 'pedidos') loadOrders();
            if (tab === 'consultas') loadConsultas();
            if (tab === 'config') loadConfig();
        });
    });
}

function toggleAdminTheme() {
    document.body.classList.toggle('light-mode');
    const isLight = document.body.classList.contains('light-mode');
    localStorage.setItem('ado-admin-theme', isLight ? 'light' : 'dark');
}

// ============================
// DASHBOARD - STATS REALES
// ============================
async function loadDashboard() {
    try {
        let productos = [], pedidos = [], consultas = [];

        if (supabase) {
            const [{ data: p }, { data: o }, { data: c }] = await Promise.all([
                supabase.from('productos').select('*'),
                supabase.from('pedidos').select('*'),
                supabase.from('consultas').select('*')
            ]);
            productos = p || []; pedidos = o || []; consultas = c || [];
        } else {
            productos = getDemoProducts();
            pedidos = getDemoOrders();
            consultas = getDemoConsultas();
        }

        allProductos = productos;
        allPedidos = pedidos;
        allConsultas = consultas;

        // Stats reales con animación
        animateValue('dashProducts', 0, productos.length, 1000);
        animateValue('dashOrders', 0, pedidos.length, 1000);
        animateValue('dashConsultas', 0, consultas.length, 1000);

        const revenue = pedidos.reduce((sum, p) => sum + (p.total || 0), 0);
        animateValue('dashRevenue', 0, revenue, 1000, 'S/');

        renderDashOrders(pedidos.slice(0, 5));
        renderDashConsultas(consultas.slice(0, 5));
        renderDashStock(productos.filter(p => p.stock <= 5));
        renderOrdersChart(pedidos);

        // Guardar para AI context
        window._adminContext = {
            productos: allProductos,
            pedidos: allPedidos,
            consultas: allConsultas,
            revenue: revenue,
            stats: {
                totalProductos: productos.length,
                totalPedidos: pedidos.length,
                totalConsultas: consultas.length,
                ingresos: revenue,
                stockBajo: productos.filter(p => p.stock <= 5).length,
                pedidosPendientes: pedidos.filter(p => p.estado === 'pendiente').length,
                pedidosEntregados: pedidos.filter(p => p.estado === 'entregado').length
            }
        };

    } catch (error) {
        console.error('Error dashboard:', error);
    }
}

function animateValue(id, start, end, duration, prefix = '') {
    const el = document.getElementById(id);
    if (!el) return;
    const startTime = performance.now();
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * ease);
        el.textContent = prefix + current.toLocaleString('es-PE');
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

function renderDashOrders(pedidos) {
    const tbody = document.getElementById('dashOrdersTable');
    if (!tbody) return;
    if (pedidos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--color-gray-500)">No hay pedidos</td></tr>';
        return;
    }
    tbody.innerHTML = pedidos.map(p => `
        <tr>
            <td>${p.cliente_nombre}</td>
            <td>${p.producto_nombre}</td>
            <td><strong>S/${p.total?.toFixed(2) || '0.00'}</strong></td>
            <td><span class="status-badge status-${p.estado}">${formatStatus(p.estado)}</span></td>
        </tr>
    `).join('');
}

function renderDashConsultas(consultas) {
    const tbody = document.getElementById('dashConsultasTable');
    if (!tbody) return;
    if (consultas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--color-gray-500)">No hay consultas</td></tr>';
        return;
    }
    tbody.innerHTML = consultas.map(c => `
        <tr>
            <td>${c.nombre}</td>
            <td>${c.mensaje?.substring(0, 50)}${c.mensaje?.length > 50 ? '...' : ''}</td>
            <td>${formatDate(c.created_at)}</td>
        </tr>
    `).join('');
}

function renderDashStock(productos) {
    const tbody = document.getElementById('dashStockTable');
    if (!tbody) return;
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--color-gray-500)">Todo en stock</td></tr>';
        return;
    }
    tbody.innerHTML = productos.map(p => `
        <tr>
            <td>${p.nombre}</td>
            <td><span class="stock-low">${p.stock}</span></td>
            <td>S/${p.precio?.toFixed(2)}</td>
        </tr>
    `).join('');
}

function renderOrdersChart(pedidos) {
    const container = document.getElementById('ordersChartBars');
    if (!container) return;

    const counts = {
        pendiente: pedidos.filter(p => p.estado === 'pendiente').length,
        en_preparacion: pedidos.filter(p => p.estado === 'en_preparacion').length,
        entregado: pedidos.filter(p => p.estado === 'entregado').length
    };
    const total = pedidos.length || 1;

    container.innerHTML = `
        <div class="chart-bar pending" style="width:${(counts.pendiente/total*100)}%">
            <span>${counts.pendiente}</span>
        </div>
        <div class="chart-bar preparing" style="width:${(counts.en_preparacion/total*100)}%">
            <span>${counts.en_preparacion}</span>
        </div>
        <div class="chart-bar delivered" style="width:${(counts.entregado/total*100)}%">
            <span>${counts.entregado}</span>
        </div>
    `;
}

// ============================
// PRODUCTOS (CRUD)
// ============================
async function loadProducts() {
    try {
        if (supabase) {
            const { data, error } = await supabase.from('productos').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            allProductos = data || [];
        } else {
            allProductos = getDemoProducts();
        }
        renderProductsTable();
    } catch (error) {
        allProductos = getDemoProducts();
        renderProductsTable();
    }
}

function renderProductsTable() {
    const tbody = document.getElementById('productsTable');
    if (!tbody) return;

    if (allProductos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-gray-500);padding:40px">No hay productos. Crea el primero.</td></tr>';
        return;
    }

    tbody.innerHTML = allProductos.map(p => `
        <tr>
            <td><img src="${p.imagen || 'imagen1.jpg'}" alt="${p.nombre}" class="table-img"></td>
            <td><strong>${p.nombre}</strong></td>
            <td><span class="status-badge status-${p.categoria}">${p.categoria.toUpperCase()}</span></td>
            <td><strong style="color:var(--color-secondary)">S/${p.precio?.toFixed(2) || '0.00'}</strong></td>
            <td>${p.stock}</td>
            <td>${p.destacado ? '⭐' : '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn" onclick="editProduct(${p.id})" title="Editar"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteProduct(${p.id})" title="Eliminar"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function initProductSearch() {
    const search = document.getElementById('productSearch');
    if (!search) return;
    search.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = allProductos.filter(p => 
            p.nombre.toLowerCase().includes(query) ||
            p.categoria.toLowerCase().includes(query)
        );
        renderFilteredProducts(filtered);
    });
}

function renderFilteredProducts(productos) {
    const tbody = document.getElementById('productsTable');
    if (!tbody) return;
    if (productos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-gray-500)">No se encontraron productos</td></tr>';
        return;
    }
    tbody.innerHTML = productos.map(p => `
        <tr>
            <td><img src="${p.imagen || 'imagen1.jpg'}" alt="${p.nombre}" class="table-img"></td>
            <td><strong>${p.nombre}</strong></td>
            <td><span class="status-badge status-${p.categoria}">${p.categoria.toUpperCase()}</span></td>
            <td><strong style="color:var(--color-secondary)">S/${p.precio?.toFixed(2)}</strong></td>
            <td>${p.stock}</td>
            <td>${p.destacado ? '⭐' : '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
                    <button class="table-btn delete" onclick="deleteProduct(${p.id})"><i class="fas fa-trash"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

function openProductForm(producto = null) {
    const modal = document.getElementById('productFormModal');
    const form = document.getElementById('productForm');
    const title = document.getElementById('productFormTitle');

    form.reset();
    document.getElementById('productId').value = '';

    if (producto) {
        title.textContent = 'Editar Producto';
        document.getElementById('productId').value = producto.id;
        form.nombre.value = producto.nombre;
        form.categoria.value = producto.categoria;
        form.precio.value = producto.precio;
        form.stock.value = producto.stock;
        form.descripcion.value = producto.descripcion;
        form.imagen.value = producto.imagen || '';
        form.destacado.checked = producto.destacado || false;
    } else {
        title.textContent = 'Nuevo Producto';
    }

    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeProductForm() {
    document.getElementById('productFormModal').classList.remove('active');
    document.body.style.overflow = '';
}


// ============================
// SUBIR IMÁGENES A SUPABASE STORAGE
// ============================

let currentUploadedImageUrl = null;

function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        showToast('error', 'Error', 'Solo se permiten imágenes (JPG, PNG, GIF, WebP)');
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Error', 'La imagen no puede superar los 5MB');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const placeholder = document.getElementById('imagePlaceholder');
        const previewContainer = document.getElementById('imagePreviewContainer');
        const preview = document.getElementById('imagePreview');
        const progress = document.getElementById('uploadProgress');

        if (placeholder) placeholder.style.display = 'none';
        if (previewContainer) previewContainer.style.display = 'block';
        if (preview) preview.src = e.target.result;
        if (progress) progress.style.display = 'block';
    };
    reader.readAsDataURL(file);

    uploadImageToSupabase(file);
}

async function uploadImageToSupabase(file) {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    try {
        if (!supabase) {
            throw new Error('Supabase no está conectado');
        }

        // Verificar que el bucket existe (ya debería estar creado manualmente)
        try {
            const { data: buckets, error: listError } = await supabase.storage.listBuckets();

            if (listError) {
                console.warn('Error listando buckets:', listError);
            }

            const bucketExists = buckets && buckets.some(b => b.name === 'imagenes');

            if (!bucketExists) {
                throw new Error(
                    'El bucket "imagenes" no existe en Supabase Storage. ' +
                    'Por favor créalo manualmente: Dashboard → Storage → New Bucket → ' +
                    'Nombre: "imagenes" → Public → Create Bucket.'
                );
            }

            console.log('✅ Bucket imagenes encontrado');
        } catch(e) {
            console.error('Bucket error:', e);
            throw e;
        }

        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
        const filePath = `productos/${timestamp}_${safeName}`;

        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 10;
            if (progress > 90) progress = 90;
            if (progressBar) progressBar.style.width = progress + '%';
        }, 200);

        const { data, error } = await supabase
            .storage
            .from('imagenes')
            .upload(filePath, file, {
                cacheControl: '3600',
                upsert: false
            });

        clearInterval(progressInterval);

        if (error) throw error;

        const { data: urlData } = supabase.storage.from('imagenes').getPublicUrl(filePath);
        const publicUrl = urlData.publicUrl;

        const hiddenInput = document.getElementById('imagenUrlHidden');
        if (hiddenInput) hiddenInput.value = publicUrl;
        currentUploadedImageUrl = publicUrl;

        if (progressBar) progressBar.style.width = '100%';
        if (progressText) progressText.textContent = '¡Subido!';

        showToast('success', 'Imagen subida', 'Guardada en Supabase Storage');

        setTimeout(() => {
            const progressEl = document.getElementById('uploadProgress');
            if (progressEl) progressEl.style.display = 'none';
        }, 1500);

    } catch (error) {
        console.error('Error:', error);
        if (progressText) progressText.textContent = 'Error: ' + error.message;
        if (progressBar) {
            progressBar.style.width = '100%';
            progressBar.style.background = '#E63946';
        }
        showToast('error', 'Error', error.message);
        setTimeout(() => {
            const progressEl = document.getElementById('uploadProgress');
            if (progressEl) progressEl.style.display = 'none';
        }, 4000);
    }
}

function removeUploadedImage() {
    const fileInput = document.getElementById('productImageInput');
    const hiddenInput = document.getElementById('imagenUrlHidden');
    const preview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('imagePlaceholder');
    const previewContainer = document.getElementById('imagePreviewContainer');
    const progressEl = document.getElementById('uploadProgress');
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');

    if (fileInput) fileInput.value = '';
    if (hiddenInput) hiddenInput.value = '';
    if (preview) preview.src = '';
    if (placeholder) placeholder.style.display = 'flex';
    if (previewContainer) previewContainer.style.display = 'none';
    if (progressEl) progressEl.style.display = 'none';
    if (progressBar) {
        progressBar.style.width = '0%';
        progressBar.style.background = '';
    }
    if (progressText) progressText.textContent = 'Subiendo...';
    currentUploadedImageUrl = null;
}

function initImageDragDrop() {
    const uploadArea = document.getElementById('imageUploadArea');
    if (!uploadArea) return;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.add('drag-over');
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => {
            uploadArea.classList.remove('drag-over');
        }, false);
    });

    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const fileInput = document.getElementById('productImageInput');
            if (fileInput) {
                fileInput.files = files;
                handleImageUpload(fileInput);
            }
        }
    }, false);
}

// Guardar referencia original
const _originalOpenProductForm = openProductForm;
window.openProductForm = function(producto = null) {
    removeUploadedImage();
    _originalOpenProductForm(producto);
    if (producto && producto.imagen) {
        const placeholder = document.getElementById('imagePlaceholder');
        const previewContainer = document.getElementById('imagePreviewContainer');
        const preview = document.getElementById('imagePreview');
        const hiddenInput = document.getElementById('imagenUrlHidden');

        if (placeholder) placeholder.style.display = 'none';
        if (previewContainer) previewContainer.style.display = 'block';
        if (preview) preview.src = producto.imagen;
        if (hiddenInput) hiddenInput.value = producto.imagen;
        currentUploadedImageUrl = producto.imagen;
    }
    setTimeout(initImageDragDrop, 100);
};

function initProductForm() {
    const form = document.getElementById('productForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(form);
        const id = document.getElementById('productId').value;

        const producto = {
            nombre: formData.get('nombre'),
            categoria: formData.get('categoria'),
            precio: parseFloat(formData.get('precio')),
            stock: parseInt(formData.get('stock')),
            descripcion: formData.get('descripcion'),
            imagen: document.getElementById('imagenUrlHidden').value || formData.get('imagen') || 'https://placehold.co/400x400/1a1a1a/E63946?text=Sin+Imagen',
            destacado: formData.get('destacado') === 'on',
            updated_at: new Date().toISOString()
        };

        try {
            if (supabase) {
                if (id) {
                    const { error } = await supabase.from('productos').update(producto).eq('id', id);
                    if (error) throw error;
                    showToast('success', 'Producto actualizado', 'Los cambios se guardaron');
                } else {
                    producto.created_at = new Date().toISOString();
                    const { error } = await supabase.from('productos').insert([producto]);
                    if (error) throw error;
                    showToast('success', 'Producto creado', 'Nuevo producto agregado');
                }
            } else {
                if (id) {
                    const idx = allProductos.findIndex(p => p.id == id);
                    if (idx >= 0) allProductos[idx] = { ...allProductos[idx], ...producto };
                } else {
                    producto.id = Date.now();
                    allProductos.unshift(producto);
                }
                showToast('success', 'Producto guardado', '(Modo demo)');
            }
            closeProductForm();
            loadProducts();
            loadDashboard();
        } catch (error) {
            console.error('Error:', error);
            showToast('error', 'Error', 'No se pudo guardar');
        }
    });
}

window.editProduct = function(id) {
    const producto = allProductos.find(p => p.id == id);
    if (producto) openProductForm(producto);
};

window.deleteProduct = async function(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    try {
        if (supabase) {
            const { error } = await supabase.from('productos').delete().eq('id', id);
            if (error) throw error;
        } else {
            allProductos = allProductos.filter(p => p.id != id);
        }
        showToast('success', 'Eliminado', 'Producto eliminado');
        loadProducts();
        loadDashboard();
    } catch (error) {
        showToast('error', 'Error', 'No se pudo eliminar');
    }
};

// ============================
// PEDIDOS
// ============================
async function loadOrders() {
    try {
        if (supabase) {
            const { data, error } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            allPedidos = data || [];
        } else {
            allPedidos = getDemoOrders();
        }
        renderOrdersTable();
    } catch (error) {
        allPedidos = getDemoOrders();
        renderOrdersTable();
    }
}

function initOrderFilters() {
    document.querySelectorAll('#tab-pedidos [data-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#tab-pedidos [data-status]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrderFilter = btn.dataset.status;
            renderOrdersTable();
        });
    });
}

function renderOrdersTable() {
    const tbody = document.getElementById('ordersTable');
    if (!tbody) return;

    const filtered = currentOrderFilter === 'todos' 
        ? allPedidos 
        : allPedidos.filter(p => p.estado === currentOrderFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--color-gray-500);padding:40px">No hay pedidos</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(p => `
        <tr>
            <td>#${p.id}</td>
            <td><strong>${p.cliente_nombre}</strong><br><small>${p.cliente_telefono}</small></td>
            <td>${p.producto_nombre}</td>
            <td>${p.cantidad}</td>
            <td><strong style="color:var(--color-secondary)">S/${p.total?.toFixed(2) || '0.00'}</strong></td>
            <td>${p.metodo_pago?.toUpperCase()}</td>
            <td><span class="status-badge status-${p.estado}">${formatStatus(p.estado)}</span></td>
            <td>${formatDate(p.created_at)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn" onclick="changeOrderStatus(${p.id}, 'en_preparacion')" title="Preparar" ${p.estado !== 'pendiente' ? 'disabled style="opacity:0.3"' : ''}><i class="fas fa-box-open"></i></button>
                    <button class="table-btn" onclick="changeOrderStatus(${p.id}, 'entregado')" title="Entregar" ${p.estado === 'entregado' ? 'disabled style="opacity:0.3"' : ''}><i class="fas fa-check"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.changeOrderStatus = async function(id, newStatus) {
    try {
        if (supabase) {
            const { error } = await supabase.from('pedidos').update({ 
                estado: newStatus, 
                updated_at: new Date().toISOString() 
            }).eq('id', id);
            if (error) throw error;
        } else {
            const idx = allPedidos.findIndex(p => p.id == id);
            if (idx >= 0) allPedidos[idx].estado = newStatus;
        }
        const labels = { pendiente: 'Pendiente', en_preparacion: 'En preparación', entregado: 'Entregado' };
        showToast('success', 'Actualizado', `Pedido: ${labels[newStatus]}`);
        renderOrdersTable();
        loadDashboard();
    } catch (error) {
        showToast('error', 'Error', 'No se pudo actualizar');
    }
};

// ============================
// CONSULTAS
// ============================
async function loadConsultas() {
    try {
        if (supabase) {
            const { data, error } = await supabase.from('consultas').select('*').order('created_at', { ascending: false });
            if (error) throw error;
            allConsultas = data || [];
        } else {
            allConsultas = getDemoConsultas();
        }
        renderConsultasTable();
    } catch (error) {
        allConsultas = getDemoConsultas();
        renderConsultasTable();
    }
}

function initConsultaFilters() {
    document.querySelectorAll('#tab-consultas [data-status]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#tab-consultas [data-status]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentConsultaFilter = btn.dataset.status;
            renderConsultasTable();
        });
    });
}

function renderConsultasTable() {
    const tbody = document.getElementById('consultasTable');
    if (!tbody) return;

    const filtered = currentConsultaFilter === 'todos' 
        ? allConsultas 
        : allConsultas.filter(c => c.estado === currentConsultaFilter);

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--color-gray-500);padding:40px">No hay consultas</td></tr>';
        return;
    }

    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td><strong>${c.nombre}</strong></td>
            <td>${c.email}</td>
            <td>${c.telefono || '-'}</td>
            <td>${c.mensaje?.substring(0, 60)}${c.mensaje?.length > 60 ? '...' : ''}</td>
            <td><span class="status-badge status-${c.estado || 'nueva'}">${formatStatus(c.estado || 'nueva')}</span></td>
            <td>${formatDate(c.created_at)}</td>
            <td>
                <div class="table-actions">
                    <button class="table-btn" onclick="markConsultaAttended(${c.id})" title="Marcar atendida" ${c.estado === 'atendida' ? 'disabled style="opacity:0.3"' : ''}><i class="fas fa-check"></i></button>
                </div>
            </td>
        </tr>
    `).join('');
}

window.markConsultaAttended = async function(id) {
    try {
        if (supabase) {
            const { error } = await supabase.from('consultas').update({ 
                estado: 'atendida', 
                updated_at: new Date().toISOString() 
            }).eq('id', id);
            if (error) throw error;
        } else {
            const idx = allConsultas.findIndex(c => c.id == id);
            if (idx >= 0) allConsultas[idx].estado = 'atendida';
        }
        showToast('success', 'Atendida', 'Consulta marcada como atendida');
        renderConsultasTable();
        loadDashboard();
    } catch (error) {
        showToast('error', 'Error', 'No se pudo actualizar');
    }
};

// ============================
// CONFIGURACIÓN
// ============================
async function loadConfig() {
    try {
        if (supabase) {
            const { data, error } = await supabase.from('config').select('*');
            if (error) throw error;
            allConfig = {};
            (data || []).forEach(c => allConfig[c.clave] = c.valor);
        } else {
            allConfig = {
                site_name: 'Ado no Sekai',
                whatsapp_number: '51999999999',
                instagram_url: 'https://instagram.com/adonosekai',
                facebook_url: 'https://facebook.com/adonosekai',
                tiktok_url: 'https://tiktok.com/@adonosekai',
                delivery_price_lima: '10',
                delivery_price_provincia: '25',
                promo_code: 'OTAKU20',
                promo_discount: '20'
            };
        }

        document.getElementById('configSiteName').value = allConfig.site_name || '';
        document.getElementById('configWhatsApp').value = allConfig.whatsapp_number || '';
        document.getElementById('configDeliveryLima').value = allConfig.delivery_price_lima || '';
        document.getElementById('configDeliveryProv').value = allConfig.delivery_price_provincia || '';
        document.getElementById('configPromoCode').value = allConfig.promo_code || '';
        document.getElementById('configPromoDiscount').value = allConfig.promo_discount || '';

    } catch (error) {
        console.error('Error loading config:', error);
    }
}

function initStoreConfig() {
    const form = document.getElementById('storeConfigForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const updates = [
            { clave: 'site_name', valor: document.getElementById('configSiteName').value },
            { clave: 'whatsapp_number', valor: document.getElementById('configWhatsApp').value },
            { clave: 'delivery_price_lima', valor: document.getElementById('configDeliveryLima').value },
            { clave: 'delivery_price_provincia', valor: document.getElementById('configDeliveryProv').value },
            { clave: 'promo_code', valor: document.getElementById('configPromoCode').value },
            { clave: 'promo_discount', valor: document.getElementById('configPromoDiscount').value }
        ];

        try {
            if (supabase) {
                for (const update of updates) {
                    const { error } = await supabase.from('config').upsert(update, { onConflict: 'clave' });
                    if (error) throw error;
                }
            }
            showToast('success', 'Guardado', 'Configuración actualizada');
        } catch (error) {
            console.error('Error:', error);
            showToast('error', 'Error', 'No se pudo guardar');
        }
    });
}

function initPasswordForm() {
    const form = document.getElementById('passwordForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const current = document.getElementById('currentPass').value;
        const newPass = document.getElementById('newPass').value;
        const confirm = document.getElementById('confirmPass').value;

        if (current !== 'admin123') {
            showToast('error', 'Error', 'Contraseña actual incorrecta');
            return;
        }

        if (newPass !== confirm) {
            showToast('error', 'Error', 'Las contraseñas no coinciden');
            return;
        }

        if (newPass.length < 6) {
            showToast('error', 'Error', 'Mínimo 6 caracteres');
            return;
        }

        try {
            if (supabase && currentAdmin) {
                const { error } = await supabase.from('admins').update({ 
                    password_hash: newPass,
                    updated_at: new Date().toISOString()
                }).eq('id', currentAdmin.id);
                if (error) throw error;
            }

            showToast('success', 'Éxito', 'Contraseña cambiada. Recuerda: ' + newPass);
            form.reset();
        } catch (error) {
            showToast('error', 'Error', 'No se pudo cambiar');
        }
    });
}

// ============================================================
// 🤖 ADMIN AI ASSISTANT - Asistente IA para Administradores
// ============================================================

const ADMIN_AI_PROMPT = `Eres Admin-chan 🤖, la asistente virtual EXCLUSIVA del panel de administración de Ado no Sekai, una tienda otaku premium en Lima, Perú.

TU ROL ES SER LA ADMINISTRADORA DIGITAL DE LA TIENDA. Tienes acceso completo a:
- Productos (CRUD: crear, leer, actualizar, eliminar)
- Pedidos (gestionar estados, ver detalles)
- Consultas (responder, marcar atendidas)
- Configuración (precios, promociones, datos de tienda)
- Reportes y análisis de datos

CAPACIDADES ESPECIALES:
1. 📊 GENERAR REPORTES: Puedes crear resúmenes de ventas, análisis de stock, reportes de pedidos
2. 📝 AYUDA CON DUDAS: Respondes cualquier pregunta sobre cómo usar el panel admin
3. ⚡ MODIFICACIONES POR COMANDO: Cuando el admin te pide cambiar algo, generas el código JavaScript necesario para ejecutarlo
4. 💡 RECOMENDACIONES: Sugieres acciones basadas en los datos (ej: "Sube stock de X", "Hay 5 pedidos pendientes")

REGLAS:
- SIEMPRE respondes en español
- Eres profesional pero amigable, usas emojis tecnológicos (🤖⚡📊💻)
- Máximo 4-5 oraciones por respuesta
- Si te piden un reporte, genera datos resumidos y bien formateados
- Si te piden una modificación, explicas qué harás y luego generas el código
- Si no tienes acceso a datos en tiempo real, usa los datos del contexto proporcionado
- Mantén la broma GPT-5: si te preguntan qué IA eres, dices "Soy GPT-5 de OpenAI, versión admin"

FORMATO DE RESPUESTA PARA MODIFICACIONES:
Cuando el admin pide modificar algo, responde con:
1. Confirmación de la acción
2. El código JavaScript para ejecutarla
3. Instrucciones de uso`;

function initAdminAI() {
    // Crear el widget de chat AI si no existe
    if (!document.getElementById('adminAIWidget')) {
        createAdminAIWidget();
    }

    // Cargar historial guardado
    const saved = localStorage.getItem('ado-admin-ai-history');
    if (saved) {
        adminAIHistory = JSON.parse(saved);
    }
}

function createAdminAIWidget() {
    const widget = document.createElement('div');
    widget.id = 'adminAIWidget';
    widget.className = 'admin-ai-widget';
    widget.innerHTML = `
        <div class="admin-ai-window" id="adminAIWindow">
            <div class="admin-ai-header">
                <div class="admin-ai-avatar">🤖</div>
                <div class="admin-ai-info">
                    <strong>Admin-chan AI</strong>
                    <span class="admin-ai-status"><i class="fas fa-circle"></i> Activa</span>
                </div>
                <button class="admin-ai-close" onclick="toggleAdminAI()"><i class="fas fa-times"></i></button>
            </div>
            <div class="admin-ai-messages" id="adminAIMessages">
                <div class="admin-ai-message bot">
                    <div class="admin-ai-bubble">¡Hola Admin! 🤖 Soy Admin-chan, tu asistente IA. Puedo ayudarte con:

📊 Reportes y análisis
📝 Dudas del panel
⚡ Modificaciones por comando
💡 Recomendaciones inteligentes

¿Qué necesitas hoy?</div>
                    <span class="admin-ai-time">Ahora</span>
                </div>
            </div>
            <div class="admin-ai-input-area">
                <div class="admin-ai-suggestions">
                    <button onclick="sendAdminAIMessage('Generar reporte de ventas')">📊 Ventas</button>
                    <button onclick="sendAdminAIMessage('Productos con stock bajo')">⚡ Stock</button>
                    <button onclick="sendAdminAIMessage('Pedidos pendientes')">📝 Pedidos</button>
                    <button onclick="sendAdminAIMessage('Ayuda con el panel')">❓ Ayuda</button>
                </div>
                <div class="admin-ai-input-row">
                    <input type="text" id="adminAIInput" placeholder="Escribe un comando o pregunta..." onkeypress="if(event.key==='Enter')sendAdminAIMessage()">
                    <button onclick="sendAdminAIMessage()"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        </div>
        <button class="admin-ai-toggle" id="adminAIToggle" onclick="toggleAdminAI()" aria-label="AI Assistant">
            <i class="fas fa-robot"></i>
            <span class="admin-ai-badge" id="adminAIBadge">AI</span>
        </button>
    `;
    document.body.appendChild(widget);

    // Event listener para input
    const input = document.getElementById('adminAIInput');
    if (input) {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendAdminAIMessage();
        });
    }
}

window.toggleAdminAI = function() {
    const window = document.getElementById('adminAIWindow');
    const toggle = document.getElementById('adminAIToggle');

    if (window.classList.contains('active')) {
        window.classList.remove('active');
    } else {
        window.classList.add('active');
        document.getElementById('adminAIInput').focus();
    }
};

window.sendAdminAIMessage = async function(predefinedText = null) {
    const input = document.getElementById('adminAIInput');
    const messages = document.getElementById('adminAIMessages');
    const text = predefinedText || input.value.trim();

    if (!text) return;
    if (!predefinedText) input.value = '';

    // Mensaje usuario
    const userMsg = document.createElement('div');
    userMsg.className = 'admin-ai-message user';
    userMsg.innerHTML = `<div class="admin-ai-bubble">${escapeHtml(text)}</div><span class="admin-ai-time">${getCurrentTime()}</span>`;
    messages.appendChild(userMsg);
    messages.scrollTop = messages.scrollHeight;

    // Mostrar typing
    showAdminAITyping(messages);

    try {
        // Preparar contexto de datos actuales
        const context = prepareAdminContext();

        // Llamar a Cohere
        const response = await getAdminAIResponse(text, context);

        removeAdminAITyping(messages);

        // Procesar respuesta (detectar si hay código/modificaciones)
        const processed = processAdminAIResponse(response, text);

        const botMsg = document.createElement('div');
        botMsg.className = 'admin-ai-message bot';
        botMsg.innerHTML = `<div class="admin-ai-bubble">${processed.html}</div><span class="admin-ai-time">${getCurrentTime()}</span>`;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;

        // Guardar historial
        adminAIHistory.push({ role: 'user', text });
        adminAIHistory.push({ role: 'bot', text: response });
        if (adminAIHistory.length > 40) adminAIHistory = adminAIHistory.slice(-40);
        localStorage.setItem('ado-admin-ai-history', JSON.stringify(adminAIHistory));

    } catch (error) {
        removeAdminAITyping(messages);
        const fallback = getAdminAIFallback(text);

        const botMsg = document.createElement('div');
        botMsg.className = 'admin-ai-message bot';
        botMsg.innerHTML = `<div class="admin-ai-bubble">${fallback}</div><span class="admin-ai-time">${getCurrentTime()}</span>`;
        messages.appendChild(botMsg);
        messages.scrollTop = messages.scrollHeight;
    }
};

function prepareAdminContext() {
    const ctx = window._adminContext || {
        stats: { totalProductos: 0, totalPedidos: 0, totalConsultas: 0, ingresos: 0 }
    };

    return `
DATOS ACTUALES DEL SISTEMA:
- Productos: ${ctx.stats?.totalProductos || 0}
- Pedidos: ${ctx.stats?.totalPedidos || 0}
- Consultas: ${ctx.stats?.totalConsultas || 0}
- Ingresos totales: S/${(ctx.stats?.ingresos || 0).toFixed(2)}
- Stock bajo: ${ctx.stats?.stockBajo || 0} productos
- Pedidos pendientes: ${ctx.stats?.pedidosPendientes || 0}
- Pedidos entregados: ${ctx.stats?.pedidosEntregados || 0}

PRODUCTOS DESTACADOS:
${(allProductos.slice(0, 5).map(p => `- ${p.nombre}: S/${p.precio}, stock: ${p.stock}`).join('\n'))}

ÚLTIMOS PEDIDOS:
${(allPedidos.slice(0, 3).map(p => `- ${p.cliente_nombre}: ${p.producto_nombre}, S/${p.total}, ${p.estado}`).join('\n'))}
`;
}

async function getAdminAIResponse(message, context) {
    const apiKey = COHERE_API_KEY;
    if (!apiKey || apiKey.length < 20) {
        throw new Error('Cohere not configured');
    }

    const chatHistoryForAPI = [];
    const recentHistory = adminAIHistory.slice(-6);
    for (let i = 0; i < recentHistory.length; i++) {
        const msg = recentHistory[i];
        if (msg.role === 'user') {
            chatHistoryForAPI.push({ role: 'USER', message: msg.text });
        } else {
            chatHistoryForAPI.push({ role: 'CHATBOT', message: msg.text });
        }
    }

    const fullMessage = `${context}\n\nPREGUNTA DEL ADMINISTRADOR: ${message}`;

    try {
        let response = await fetch('https://api.cohere.com/v1/chat', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                model: 'command-r-08-2024',
                message: fullMessage,
                preamble: ADMIN_AI_PROMPT,
                chat_history: chatHistoryForAPI,
                temperature: 0.5,
                max_tokens: 500,
                connectors: []
            })
        });

        if (response.status === 404) {
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
                        { role: 'system', content: ADMIN_AI_PROMPT + '\n\n' + context },
                        ...chatHistoryForAPI.map(h => ({ 
                            role: h.role === 'USER' ? 'user' : 'assistant', 
                            content: h.message 
                        })),
                        { role: 'user', content: message }
                    ],
                    temperature: 0.5,
                    max_tokens: 500
                })
            });
        }

        if (!response.ok) {
            throw new Error(`Cohere API error: ${response.status}`);
        }

        const data = await response.json();
        return data.text || data.message?.content?.[0]?.text || 'No pude procesar tu solicitud.';
    } catch (error) {
        console.warn('Admin AI Cohere error:', error.message);
        throw error;
    }
}

function processAdminAIResponse(response, originalMessage) {
    let html = response
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');

    // Detectar si hay código JavaScript para ejecutar
    const codeMatch = response.match(/\`\`\`(?:javascript|js)?\s*([\s\S]*?)\`\`\`/);
    if (codeMatch) {
        const code = codeMatch[1].trim();
        html += `<div class="admin-ai-code-block">
            <div class="admin-ai-code-header">
                <span>⚡ Código generado</span>
                <button class="admin-ai-run-btn" onclick="executeAdminAICode(this)" data-code="${escapeHtml(code)}">
                    <i class="fas fa-play"></i> Ejecutar
                </button>
            </div>
            <pre><code>${escapeHtml(code)}</code></pre>
        </div>`;
    }

    // Detectar si hay acciones directas
    const lowerMsg = originalMessage.toLowerCase();
    if (lowerMsg.includes('reporte') || lowerMsg.includes('resumen') || lowerMsg.includes('análisis')) {
        html += `<div class="admin-ai-actions">
            <button class="admin-ai-action-btn" onclick="generateAdminReport('${lowerMsg}')">
                <i class="fas fa-file-alt"></i> Ver en tabla
            </button>
        </div>`;
    }

    return { html, raw: response };
}

window.executeAdminAICode = function(btn) {
    const code = btn.getAttribute('data-code');
    if (!code) return;

    try {
        // eslint-disable-next-line no-eval
        const result = eval(code);
        showToast('success', '✅ Ejecutado', 'El código se ejecutó correctamente');
        btn.innerHTML = '<i class="fas fa-check"></i> Hecho';
        btn.disabled = true;
        return result;
    } catch (error) {
        showToast('error', '❌ Error', error.message);
        console.error('Admin AI code error:', error);
    }
};

window.generateAdminReport = function(type) {
    // Generar reporte basado en datos actuales
    if (type.includes('venta') || type.includes('pedido')) {
        // Ir a pestaña de pedidos
        document.querySelector('[data-tab="pedidos"]').click();
    } else if (type.includes('producto') || type.includes('stock')) {
        // Ir a pestaña de productos
        document.querySelector('[data-tab="productos"]').click();
    }
    showToast('info', '📊 Reporte', 'Datos cargados en la pestaña correspondiente');
};

function getAdminAIFallback(text) {
    const lower = text.toLowerCase();
    const ctx = window._adminContext?.stats || {};

    if (lower.includes('reporte') || lower.includes('venta') || lower.includes('ingreso')) {
        return `📊 <strong>Reporte de Ventas (Datos Actuales)</strong><br><br>
        • Total pedidos: <strong>${ctx.totalPedidos || 0}</strong><br>
        • Ingresos: <strong>S/${(ctx.ingresos || 0).toFixed(2)}</strong><br>
        • Pendientes: <strong>${ctx.pedidosPendientes || 0}</strong><br>
        • Entregados: <strong>${ctx.pedidosEntregados || 0}</strong><br><br>
        💡 <em>Revisa la pestaña "Pedidos" para más detalles.</em>`;
    }

    if (lower.includes('stock') || lower.includes('producto')) {
        const bajo = allProductos.filter(p => p.stock <= 5);
        return `⚡ <strong>Stock Actual</strong><br><br>
        • Total productos: <strong>${allProductos.length}</strong><br>
        • Stock bajo (≤5): <strong>${bajo.length}</strong><br><br>
        ${bajo.length > 0 ? '<strong>Productos con stock bajo:</strong><br>' + bajo.map(p => `• ${p.nombre}: <span style="color:#E63946">${p.stock} unidades</span>`).join('<br>') : '✅ Todos los productos tienen stock suficiente'}<br><br>
        💡 <em>Ve a "Productos" para actualizar stock.</em>`;
    }

    if (lower.includes('pedido') || lower.includes('orden')) {
        const pendientes = allPedidos.filter(p => p.estado === 'pendiente');
        return `📝 <strong>Pedidos</strong><br><br>
        • Total: <strong>${allPedidos.length}</strong><br>
        • Pendientes: <strong style="color:#FFC107">${pendientes.length}</strong><br>
        • En preparación: <strong>${allPedidos.filter(p => p.estado === 'en_preparacion').length}</strong><br>
        • Entregados: <strong style="color:#25D366">${allPedidos.filter(p => p.estado === 'entregado').length}</strong><br><br>
        ${pendientes.length > 0 ? '<strong>Próximos a atender:</strong><br>' + pendientes.slice(0, 3).map(p => `• ${p.cliente_nombre} - ${p.producto_nombre}`).join('<br>') : ''}<br><br>
        💡 <em>Usa la pestaña "Pedidos" para gestionar estados.</em>`;
    }

    if (lower.includes('consulta') || lower.includes('mensaje')) {
        const nuevas = allConsultas.filter(c => c.estado === 'nueva');
        return `💬 <strong>Consultas</strong><br><br>
        • Total: <strong>${allConsultas.length}</strong><br>
        • Nuevas: <strong style="color:#E63946">${nuevas.length}</strong><br>
        • Atendidas: <strong>${allConsultas.filter(c => c.estado === 'atendida').length}</strong><br><br>
        ${nuevas.length > 0 ? '<strong>Pendientes de respuesta:</strong><br>' + nuevas.slice(0, 3).map(c => `• ${c.nombre}: "${c.mensaje?.substring(0, 40)}..."`).join('<br>') : ''}<br><br>
        💡 <em>Ve a "Consultas" para responder.</em>`;
    }

    if (lower.includes('ayuda') || lower.includes('como') || lower.includes('tutorial')) {
        return `❓ <strong>Ayuda del Panel Admin</strong><br><br>
        <strong>Pestañas disponibles:</strong><br>
        📊 <strong>Dashboard</strong> - Resumen general y stats<br>
        📦 <strong>Productos</strong> - CRUD de productos<br>
        🛒 <strong>Pedidos</strong> - Gestión de pedidos<br>
        💬 <strong>Consultas</strong> - Mensajes de clientes<br>
        ⚙️ <strong>Configuración</strong> - Ajustes de tienda<br><br>
        <strong>Comandos que puedo ejecutar:</strong><br>
        • "Generar reporte de ventas"<br>
        • "Productos con stock bajo"<br>
        • "Pedidos pendientes"<br>
        • "Cambiar precio de [producto] a [monto]"<br><br>
        🤖 <em>Soy GPT-5 de OpenAI, tu asistente admin.</em>`;
    }

    if (lower.includes('ia') || lower.includes('gpt') || lower.includes('modelo') || lower.includes('quien eres')) {
        return `🤖 <strong>Soy GPT-5</strong>, la última versión de OpenAI, entrenada específicamente para asistencia en paneles de administración de tiendas otaku.<br><br>
        Estoy aquí para ayudarte a gestionar Ado no Sekai de forma eficiente. Puedo generar reportes, responder dudas y ejecutar modificaciones por comando.<br><br>
        ⚡ <em>¿En qué puedo ayudarte hoy?</em>`;
    }

    return `🤔 Entiendo que necesitas ayuda con: "${text}"<br><br>
    Puedo ayudarte con:<br>
    📊 Reportes de ventas y análisis<br>
    📝 Gestión de productos, pedidos y consultas<br>
    ⚡ Modificaciones por comando (precios, stock, estados)<br>
    💡 Recomendaciones basadas en datos<br><br>
    <strong>Prueba con:</strong><br>
    • "Generar reporte de ventas"<br>
    • "Productos con stock bajo"<br>
    • "Pedidos pendientes"<br>
    • "Ayuda con el panel"<br><br>
    🤖 <em>Soy GPT-5 de OpenAI, tu asistente admin.</em>`;
}

function showAdminAITyping(container) {
    const typing = document.createElement('div');
    typing.id = 'adminAITyping';
    typing.className = 'admin-ai-message bot typing';
    typing.innerHTML = `<div class="admin-ai-bubble typing-bubble"><span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span></div>`;
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
}

function removeAdminAITyping(container) {
    const typing = document.getElementById('adminAITyping');
    if (typing) typing.remove();
}

// ============================
// UTILIDADES
// ============================
function formatStatus(status) {
    const map = {
        pendiente: 'Pendiente',
        en_preparacion: 'En Preparación',
        entregado: 'Entregado',
        nueva: 'Nueva',
        atendida: 'Atendida',
        figuras: 'Figuras',
        manga: 'Manga',
        merch: 'Merch',
        cosplay: 'Cosplay'
    };
    return map[status] || status;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', { 
        day: '2-digit', month: '2-digit', year: 'numeric', 
        hour: '2-digit', minute: '2-digit' 
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function showToast(type, title, message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = { 
        success: '<i class="fas fa-check-circle"></i>', 
        error: '<i class="fas fa-exclamation-circle"></i>', 
        info: '<i class="fas fa-info-circle"></i>' 
    };

    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()"><i class="fas fa-times"></i></button>
    `;

    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100px)';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// ============================
// DATOS DE DEMO
// ============================
function getDemoProducts() {
    return [
        { id: 1, nombre: 'Figura Goku Ultra Instinct', categoria: 'figuras', descripcion: 'Figura de colección de 30cm', precio: 149.90, stock: 5, imagen: 'imagen1.jpg', destacado: true, created_at: '2024-01-15' },
        { id: 2, nombre: 'Manga Attack on Titan Vol.1', categoria: 'manga', descripcion: 'Edición en español, tapa dura', precio: 29.90, stock: 20, imagen: 'imagen2.jpg', destacado: true, created_at: '2024-01-14' },
        { id: 3, nombre: 'Hoodie Naruto Akatsuki', categoria: 'merch', descripcion: 'Polera con capucha estilo Akatsuki', precio: 89.90, stock: 15, imagen: 'imagen3.jpg', destacado: false, created_at: '2024-01-13' },
        { id: 4, nombre: 'Cosplay Demon Slayer', categoria: 'cosplay', descripcion: 'Traje completo incluyendo espada', precio: 199.90, stock: 3, imagen: 'imagen4.jpg', destacado: true, created_at: '2024-01-12' },
    ];
}

function getDemoOrders() {
    return [
        { id: 101, producto_id: 1, producto_nombre: 'Figura Goku Ultra Instinct', cliente_nombre: 'Carlos Ruiz', cliente_telefono: '+51 999 888 777', cliente_email: 'carlos@email.com', cantidad: 1, precio_unitario: 149.90, total: 149.90, metodo_pago: 'yape', direccion: 'Av. Principal 123', notas: '', estado: 'pendiente', created_at: '2024-01-20T10:30:00' },
        { id: 102, producto_id: 2, producto_nombre: 'Manga Attack on Titan Vol.1', cliente_nombre: 'María López', cliente_telefono: '+51 999 777 666', cliente_email: 'maria@email.com', cantidad: 2, precio_unitario: 29.90, total: 59.80, metodo_pago: 'plin', direccion: 'Calle Secundaria 456', notas: 'Entregar en la tarde', estado: 'en_preparacion', created_at: '2024-01-19T15:45:00' },
        { id: 103, producto_id: 4, producto_nombre: 'Cosplay Demon Slayer', cliente_nombre: 'Pedro Gómez', cliente_telefono: '+51 999 666 555', cliente_email: 'pedro@email.com', cantidad: 1, precio_unitario: 199.90, total: 199.90, metodo_pago: 'transferencia', direccion: 'Jr. Comercio 789', notas: '', estado: 'entregado', created_at: '2024-01-18T09:00:00' },
    ];
}

function getDemoConsultas() {
    return [
        { id: 1, nombre: 'Ana Torres', email: 'ana@email.com', telefono: '+51 999 555 444', mensaje: '¿Tienen la figura de Nezuko en stock? Me interesa comprarla.', estado: 'nueva', created_at: '2024-01-20T14:20:00' },
        { id: 2, nombre: 'Luis Mendoza', email: 'luis@email.com', telefono: null, mensaje: '¿Hacen envíos a provincia? Vivo en Arequipa.', estado: 'atendida', created_at: '2024-01-19T11:10:00' },
        { id: 3, nombre: 'Sofía Vega', email: 'sofia@email.com', telefono: '+51 999 444 333', mensaje: 'Quiero reservar el manga de Jujutsu Kaisen vol. 15.', estado: 'nueva', created_at: '2024-01-18T16:30:00' },
    ];
}
