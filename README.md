# 🎌 Ado no Sekai - Tienda Otaku

Página web profesional para tienda otaku con Supabase backend.

## 📁 Archivos para GitHub Pages

| Archivo | Descripción |
|---------|-------------|
| `index.html` | Página principal con Hero, Productos, Galería, Proceso y Contacto |
| `styles.css` | Hoja de estilos principal (paleta: rojo, negro, dorado) |
| `script.js` | JavaScript principal con Supabase, carrusel, modal de pedidos |
| `galeria.html` | Página de galería completa con lightbox |
| `admin.html` | Panel de administración (Dashboard, Productos, Pedidos, Consultas) |
| `admin.css` | Estilos del panel admin |
| `admin.js` | JavaScript del panel admin con CRUD + AI Assistant |
| `admin-ai.css` | Estilos del chatbot AI para admin |
| `supabase_schema.sql` | Schema de base de datos para Supabase |

## 🔧 Configuración antes de usar

### 1. API Key de IA (Chatbot)
En `script.js` y `admin.js`, busca:
```javascript
const COHERE_API_KEY = ''; // 🔑 PONER API KEY DE COHERE AQUÍ
```
Obtén tu key gratis en: https://cohere.com

### 2. Imágenes de Productos
Las imágenes de productos se cargan desde **Supabase Storage** o URLs externas.
En `script.js` y `admin.js`, busca:
```javascript
const IMG_PLACEHOLDER = null; // null = emoji placeholder automático
```
Cambia a URLs de tu bucket de Supabase:
```javascript
const IMG_PLACEHOLDER = 'https://tu-proyecto.supabase.co/storage/v1/object/public/productos/';
```

### 3. Imágenes de Galería (Carrusel)
Sube manualmente a tu repositorio:
- `imagen1.jpg` a `imagen5.jpg` (usadas en el carrusel y galería)
- Opcional: `mascot-waving.png`, `mascot-pointing.png` (o se usan emojis)
- Opcional: `modal-gift.png`, `modal-present.png` (o se usan emojis)

### 4. Supabase
- URL: `https://doqsslnewxamtpifszom.supabase.co`
- Ejecuta `supabase_schema.sql` en el SQL Editor de Supabase
- Tablas: `productos`, `pedidos`, `consultas`, `admins`, `config`

## 🚀 Despliegue en GitHub Pages

1. Sube todos los archivos a un repositorio
2. Ve a Settings > Pages
3. Selecciona la rama main y carpeta root
4. Tu sitio estará en `https://tuusuario.github.io/reponame`

## 📝 Notas

- **Sin API key**: El chatbot funciona con respuestas inteligentes locales (fallback)
- **Sin imágenes**: Los productos muestran emojis según categoría (🎎📚👕👘)
- **Sin Supabase**: Funciona en modo demo con datos locales
- Admin por defecto: usuario `admin` / contraseña `admin123`

## 🎨 Personalización

- Colores: Edita las variables CSS en `:root` de `styles.css`
- Fuentes: Google Fonts (Orbitron, Noto Sans JP)
- Iconos: Font Awesome 6.5
