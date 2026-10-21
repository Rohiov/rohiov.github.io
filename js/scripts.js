// =============================================
// UTILIDAD GLOBAL: Exportar tabla a CSV
// Reutilizable en cualquier página.
// =============================================
function exportarTablaACSV(tablaSelector, nombreArchivo, opciones) {
    opciones = opciones || {};

    // Resolver el elemento de la tabla (por selector o por referencia directa)
    let tabla = null;
    if (typeof tablaSelector === 'string') {
        tabla = document.querySelector(tablaSelector);
    } else if (tablaSelector instanceof HTMLElement) {
        tabla = tablaSelector;
    }
    if (!tabla) {
        console.warn('exportarTablaACSV: no se encontró la tabla', tablaSelector);
        return;
    }

    // Opciones configurables
    const omitirColumnas = opciones.omitirColumnas || []; // índices a omitir (0-based)
    const incluirOcultas = opciones.incluirOcultas === true; // por defecto false: solo visibles
    const separador = opciones.separador || ',';
    const nombreBase = nombreArchivo || 'exportacion';

    // Construir la fila de encabezados a partir del <thead>
    const ths = tabla.querySelectorAll('thead th');
    const encabezados = [];
    ths.forEach(function (th, index) {
        if (omitirColumnas.includes(index)) return;
        encabezados.push(limpiarTexto(th.textContent));
    });

    // Construir las filas de datos a partir del <tbody>
    const filas = [];
    tabla.querySelectorAll('tbody tr').forEach(function (tr) {
        // Si está oculta por filtro, la saltamos (a menos que se indique lo contrario)
        if (!incluirOcultas && tr.classList.contains('d-none')) return;

        const celdas = tr.querySelectorAll('td');
        const fila = [];
        celdas.forEach(function (td, index) {
            if (omitirColumnas.includes(index)) return;
            fila.push(limpiarTexto(td.textContent));
        });
        filas.push(fila);
    });

    // Generar el contenido CSV (encabezados + filas)
    const lineas = [];
    lineas.push(encabezados.map(escaparCSV).join(separador));
    filas.forEach(function (fila) {
        lineas.push(fila.map(escaparCSV).join(separador));
    });

    // BOM UTF-8 para que Excel respete los acentos
    const contenido = '\uFEFF' + lineas.join('\r\n');

    // Crear Blob y descargar el archivo
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    // Timestamp para el nombre del archivo
    const fecha = new Date();
    const pad = n => String(n).padStart(2, '0');
    const timestamp = fecha.getFullYear() + pad(fecha.getMonth() + 1) + pad(fecha.getDate()) +
                      '_' + pad(fecha.getHours()) + pad(fecha.getMinutes());

    // Enlace temporal para forzar la descarga
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreBase + '_' + timestamp + '.csv';
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    // ---- Helpers internos ----

    // Colapsa espacios, saltos de línea y tabs; recorta extremos
    function limpiarTexto(texto) {
        return String(texto || '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    // Escapa un valor CSV: si contiene separador, comillas o saltos → entrecomillar
    function escaparCSV(valor) {
        const texto = String(valor);
        if (texto.indexOf(separador) !== -1 ||
            texto.indexOf('"') !== -1 ||
            texto.indexOf('\n') !== -1 ||
            texto.indexOf('\r') !== -1) {
            return '"' + texto.replace(/"/g, '""') + '"';
        }
        return texto;
    }
}

// =============================================
// INICIALIZACIÓN GLOBAL
// Todo el código se ejecuta tras cargar el DOM.
// =============================================
document.addEventListener('DOMContentLoaded', function () {
    console.log('SWCORA Mockup cargado correctamente');

    // =============================================
    // STORAGE COMPARTIDO: Solicitudes de Acceso
    // Fuente única de verdad para las 3 páginas de acceso
    // =============================================
    const STORAGE_KEY_SOLICITUDES = 'swcora_solicitudes_acceso';

    // Datos iniciales (seed) — se usan solo si el storage está vacío
    const SEED_SOLICITUDES = [
        {
            id: 'sol-001',
            fecha: '2026-09-20T10:30',
            fechaVisible: '20/09/2026 10:30',
            usuario: 'Juan Pérez',
            modulo: 'Salidas de Material',
            rol: 'Generador de Salidas',
            motivo: 'Necesito crear solicitudes de salida.',
            aprobador: 'María Gómez',
            estado: 'pendiente',
            respuesta: 'En revisión'
        },
        {
            id: 'sol-002',
            fecha: '2026-09-19T15:45',
            fechaVisible: '19/09/2026 15:45',
            usuario: 'Carlos Ruiz',
            modulo: 'Salidas de Material',
            rol: 'Generador de Salidas',
            motivo: '',
            aprobador: 'Pedro López',
            estado: 'pendiente',
            respuesta: 'En revisión'
        },
        {
            id: 'sol-003',
            fecha: '2026-09-18T09:00',
            fechaVisible: '18/09/2026 09:00',
            usuario: 'María Gómez',
            modulo: 'Salidas de Material',
            rol: 'Generador de Salidas',
            motivo: 'Creación de salidas es parte de mis actividades diarias para embarques de material.',
            aprobador: 'Juan Pérez',
            estado: 'aprobada',
            respuesta: 'Aprobada por Juan Pérez'
        },
        {
            id: 'sol-004',
            fecha: '2026-09-15T11:20',
            fechaVisible: '15/09/2026 11:20',
            usuario: 'Pedro López',
            modulo: 'Salidas de Material',
            rol: 'Generador de Salidas',
            motivo: '',
            aprobador: 'María Gómez',
            estado: 'rechazada',
            respuesta: 'No especificó motivo de solicitud.'
        },
        {
            id: 'sol-005',
            fecha: '2026-09-22T08:15',
            fechaVisible: '22/09/2026 08:15',
            usuario: 'Juan Pérez',
            modulo: 'Salidas de Material',
            rol: 'Generador de Salidas',
            motivo: 'Solicitud enviada desde formulario.',
            aprobador: 'María Gómez',
            estado: 'pendiente',
            respuesta: 'En revisión'
        }
    ];

    // ---------- API de storage de solicitudes ----------

    // Carga las solicitudes del localStorage; si no hay, siembra los datos seed
    function cargarSolicitudes() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SOLICITUDES);
            if (!raw) {
                localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(SEED_SOLICITUDES));
                return SEED_SOLICITUDES.slice();
            }
            const data = JSON.parse(raw);
            if (!Array.isArray(data)) throw new Error('Formato inválido');
            return data;
        } catch (e) {
            console.warn('Error leyendo solicitudes, usando seed:', e);
            localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(SEED_SOLICITUDES));
            return SEED_SOLICITUDES.slice();
        }
    }

    // Persiste el arreglo completo de solicitudes
    function guardarSolicitudes(lista) {
        try {
            localStorage.setItem(STORAGE_KEY_SOLICITUDES, JSON.stringify(lista));
            return true;
        } catch (e) {
            console.error('Error guardando solicitudes:', e);
            return false;
        }
    }

    // Agrega una nueva solicitud al inicio del arreglo
    function agregarSolicitud(solicitud) {
        const lista = cargarSolicitudes();
        const nuevoId = 'sol-' + String(Date.now()).slice(-6);
        const nueva = Object.assign({ id: nuevoId, estado: 'pendiente', respuesta: 'En revisión' }, solicitud);
        lista.unshift(nueva);
        guardarSolicitudes(lista);
        return nueva;
    }

    // Actualiza los campos de una solicitud por id
    function actualizarSolicitud(id, cambios) {
        const lista = cargarSolicitudes();
        const idx = lista.findIndex(s => s.id === id);
        if (idx === -1) return false;
        Object.assign(lista[idx], cambios);
        guardarSolicitudes(lista);
        return true;
    }

    // Elimina una solicitud por id
    function eliminarSolicitud(id) {
        const lista = cargarSolicitudes().filter(s => s.id !== id);
        guardarSolicitudes(lista);
    }

    // Exponer globalmente para uso entre bloques
    window.swcoraSolicitudes = {
        cargar: cargarSolicitudes,
        guardar: guardarSolicitudes,
        agregar: agregarSolicitud,
        actualizar: actualizarSolicitud,
        eliminar: eliminarSolicitud
    };

    // Usuario "actual" del mockup (quien tiene la sesión iniciada)
    const USUARIO_ACTUAL = 'Juan Pérez';

    // =============================================
    // DETECCIÓN DEL ROL LOGUEADO
    // Se infiere a partir de la carpeta en la URL.
    // Ej:
    //   /superusuario/salidas-index.html  → 'superusuario'
    //   /generador/salidas-index.html     → 'generador'
    //   /salidas-index.html (raíz)        → 'superusuario' (fallback)
    // =============================================
    function obtenerRolLogueado() {
        const path = window.location.pathname.toLowerCase();
        if (/\/superusuario\//.test(path)) return 'superusuario';
        if (/\/administrador\//.test(path)) return 'administrador';
        if (/\/aprobador\//.test(path)) return 'aprobador';
        if (/\/generador\//.test(path)) return 'generador';
        if (/\/sinrol\//.test(path)) return 'sinrol';
        // Si no estamos en ninguna carpeta de rol, asumimos superusuario (mockup raíz)
        return 'superusuario';
    }

    const ROL_ACTUAL = obtenerRolLogueado();
    console.log('👤 Rol detectado:', ROL_ACTUAL);

    // =============================================
    // STORAGE COMPARTIDO: Salidas de Material
    // =============================================
    const STORAGE_KEY_SALIDAS = 'swcora_salidas_material';

    // Datos iniciales (seed) — se usan solo si el storage está vacío
    const SEED_SALIDAS = [
        {
            id: 'sal-001',
            folio: '00000001',
            fecha: '2026-09-20',
            fechaVisible: '20/09/2026',
            estado: 'aprobada',
            usuario: 'Juan Pérez',
            descripcion: 'Devolución a proveedor',
            motivo: '',
            materiales: 5,
            aprobador: 'María Gómez',
            aprobadoPor: 'María Gómez',
            fechaAprobacion: '20/09/2026 14:30',
            empresa: 'XEROX, S.A. DE C.V.',
            tipoEmpresa: 'Proveedor',
            contacto: 'Juan Hernández',
            esDefinitiva: true,
            retornoEsperado: '',
            causa: 'Salidas de planta',
            categoria: 'Devolución de equipos a proveedor',
            comentarios: 'Equipos con falla de fábrica.',
            departamento: 'Sistemas',
            fechaCreacion: '20/09/2026 10:30',
            creadoPor: 'Juan Pérez',
            materialesLista: [
                { cantidad: 1, unidad: 'PZS', descripcion: 'Altalink B8155', comentario: '' },
                { cantidad: 1, unidad: 'PZS', descripcion: 'Workcentre 7835', comentario: '' },
                { cantidad: 1, unidad: 'PZS', descripcion: 'Workcentre 7220', comentario: '' }
            ]
        },
        {
            id: 'sal-002',
            folio: '00000002',
            fecha: '2026-09-19',
            fechaVisible: '19/09/2026',
            estado: 'pendiente',
            usuario: 'María Gómez',
            descripcion: 'Materiales de obra',
            motivo: '',
            materiales: 3,
            aprobador: 'Pedro López',
            aprobadoPor: '',
            fechaAprobacion: '',
            empresa: 'HEWLETT PACKARD',
            tipoEmpresa: 'Cliente',
            contacto: 'María López',
            esDefinitiva: false,
            retornoEsperado: '2026-10-15',
            causa: 'Obra en sitio',
            categoria: 'Materiales de construcción',
            comentarios: '',
            departamento: 'Producción',
            fechaCreacion: '19/09/2026 09:15',
            creadoPor: 'María Gómez',
            materialesLista: [
                { cantidad: 10, unidad: 'KG', descripcion: 'Cemento', comentario: '' },
                { cantidad: 5, unidad: 'PZS', descripcion: 'Varilla 3/8', comentario: '' },
                { cantidad: 2, unidad: 'MTS', descripcion: 'Malla electrosoldada', comentario: '' }
            ]
        },
        {
            id: 'sal-003',
            folio: '',
            fecha: '2026-09-18',
            fechaVisible: '18/09/2026',
            estado: 'borrador',
            usuario: 'Carlos Ruiz',
            descripcion: 'Equipos de cómputo',
            motivo: '',
            materiales: 2,
            aprobador: '',
            aprobadoPor: '',
            fechaAprobacion: '',
            empresa: 'XEROX, S.A. DE C.V.',
            tipoEmpresa: 'Proveedor',
            contacto: 'Juan Hernández',
            esDefinitiva: true,
            retornoEsperado: '',
            causa: 'Mantenimiento',
            categoria: 'Equipos de cómputo',
            comentarios: '',
            departamento: 'Sistemas',
            fechaCreacion: '18/09/2026 16:00',
            creadoPor: 'Carlos Ruiz',
            materialesLista: [
                { cantidad: 1, unidad: 'PZS', descripcion: 'Laptop Dell Latitude', comentario: '' },
                { cantidad: 1, unidad: 'PZS', descripcion: 'Monitor LG 24"', comentario: '' }
            ]
        },
        {
            id: 'sal-004',
            folio: '00000004',
            fecha: '2026-09-17',
            fechaVisible: '17/09/2026',
            estado: 'rechazada',
            usuario: 'Ana Martínez',
            descripcion: 'Herramientas de reparación',
            motivo: 'Material no autorizado',
            materiales: 4,
            aprobador: 'María Gómez',
            aprobadoPor: '',
            fechaAprobacion: '17/09/2026 15:00',
            empresa: 'SWCORA FILIAL NORTE',
            tipoEmpresa: 'Filial',
            contacto: 'Carlos Ruiz',
            esDefinitiva: false,
            retornoEsperado: '2026-10-01',
            causa: 'Reparación',
            categoria: 'Herramientas',
            comentarios: '',
            departamento: 'Mantenimiento',
            fechaCreacion: '17/09/2026 10:00',
            creadoPor: 'Ana Martínez',
            materialesLista: [
                { cantidad: 2, unidad: 'PZS', descripcion: 'Taladro', comentario: '' },
                { cantidad: 1, unidad: 'PZS', descripcion: 'Juego de llaves', comentario: '' },
                { cantidad: 1, unidad: 'PZS', descripcion: 'Caja de herramientas', comentario: '' }
            ]
        },
        {
            id: 'sal-005',
            folio: '00000005',
            fecha: '2026-09-16',
            fechaVisible: '16/09/2026',
            estado: 'cancelada',
            usuario: 'Juan Pérez',
            descripcion: 'Salida cancelada',
            motivo: 'Material pendiente de agregar',
            materiales: 1,
            aprobador: 'María Gómez',
            aprobadoPor: '',
            fechaAprobacion: '',
            empresa: 'HEWLETT PACKARD',
            tipoEmpresa: 'Cliente',
            contacto: 'María López',
            esDefinitiva: false,
            retornoEsperado: '2026-10-10',
            causa: 'Prueba',
            categoria: 'Equipos',
            comentarios: '',
            departamento: 'Sistemas',
            fechaCreacion: '16/09/2026 08:00',
            creadoPor: 'Juan Pérez',
            materialesLista: [
                { cantidad: 1, unidad: 'PZS', descripcion: 'Impresora', comentario: '' }
            ]
        },
        {
            id: 'sal-006',
            folio: '00000006',
            fecha: '2026-09-19',
            fechaVisible: '19/09/2026',
            estado: 'pendiente',
            usuario: 'María Gómez',
            descripcion: 'Materiales de obra',
            motivo: '',
            materiales: 3,
            aprobador: 'Pedro López',
            aprobadoPor: '',
            fechaAprobacion: '',
            empresa: 'XEROX, S.A. DE C.V.',
            tipoEmpresa: 'Proveedor',
            contacto: 'Juan Hernández',
            esDefinitiva: true,
            retornoEsperado: '',
            causa: 'Obra',
            categoria: 'Materiales',
            comentarios: '',
            departamento: 'Producción',
            fechaCreacion: '19/09/2026 11:00',
            creadoPor: 'María Gómez',
            materialesLista: [
                { cantidad: 5, unidad: 'PZS', descripcion: 'Tubo PVC', comentario: '' },
                { cantidad: 2, unidad: 'KG', descripcion: 'Cemento', comentario: '' },
                { cantidad: 1, unidad: 'MTS', descripcion: 'Malla', comentario: '' }
            ]
        }
    ];

    // ---------- API de storage de salidas ----------

    // Carga las salidas del localStorage; si no hay, siembra los datos seed
    function cargarSalidas() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_SALIDAS);
            if (!raw) {
                localStorage.setItem(STORAGE_KEY_SALIDAS, JSON.stringify(SEED_SALIDAS));
                return SEED_SALIDAS.slice();
            }
            const data = JSON.parse(raw);
            if (!Array.isArray(data)) throw new Error('Formato inválido');
            return data;
        } catch (e) {
            console.warn('Error leyendo salidas, usando seed:', e);
            localStorage.setItem(STORAGE_KEY_SALIDAS, JSON.stringify(SEED_SALIDAS));
            return SEED_SALIDAS.slice();
        }
    }

    // Persiste el arreglo completo de salidas
    function guardarSalidas(lista) {
        try {
            localStorage.setItem(STORAGE_KEY_SALIDAS, JSON.stringify(lista));
            return true;
        } catch (e) {
            console.error('Error guardando salidas:', e);
            return false;
        }
    }

    // Agrega una nueva salida al inicio del arreglo
    function agregarSalida(salida) {
        const lista = cargarSalidas();
        const nuevoId = 'sal-' + String(Date.now()).slice(-6);
        const nueva = Object.assign({ id: nuevoId }, salida);
        lista.unshift(nueva);
        guardarSalidas(lista);
        return nueva;
    }

    // Actualiza los campos de una salida por id
    function actualizarSalida(id, cambios) {
        const lista = cargarSalidas();
        const idx = lista.findIndex(s => s.id === id);
        if (idx === -1) return false;
        Object.assign(lista[idx], cambios);
        guardarSalidas(lista);
        return true;
    }

    // Elimina una salida por id
    function eliminarSalida(id) {
        const lista = cargarSalidas().filter(s => s.id !== id);
        guardarSalidas(lista);
    }

    // Busca una salida por folio
    function obtenerSalidaPorFolio(folio) {
        return cargarSalidas().find(s => s.folio === folio);
    }

    // Busca una salida por id interno
    function obtenerSalidaPorId(id) {
        return cargarSalidas().find(s => s.id === id);
    }

    // Genera el siguiente folio correlativo (8 dígitos con padding)
    function generarSiguienteFolio() {
        const lista = cargarSalidas();
        let maxNum = 0;
        lista.forEach(s => {
            const n = parseInt(s.folio, 10);
            if (!isNaN(n)) maxNum = Math.max(maxNum, n);
        });
        return String(maxNum + 1).padStart(8, '0');
    }

    // Exponer globalmente para uso entre bloques
    window.swcoraSalidas = {
        cargar: cargarSalidas,
        guardar: guardarSalidas,
        agregar: agregarSalida,
        actualizar: actualizarSalida,
        eliminar: eliminarSalida,
        porFolio: obtenerSalidaPorFolio,
        porId: obtenerSalidaPorId,
        siguienteFolio: generarSiguienteFolio
    };

    // =============================================
    // HELPERS DE UNIDADES DE MEDIDA
    // Fuente: #tablaUnidades (admin-unidades) → localStorage
    // =============================================
    const STORAGE_KEY_UNIDADES = 'swcora_unidades_medida';

    // Seed por si admin-unidades nunca se ha visitado
    const SEED_UNIDADES = [
        { codigo: 'PZS', descripcion: 'Piezas',     activo: true },
        { codigo: 'KG',  descripcion: 'Kilogramos', activo: true },
        { codigo: 'MTS', descripcion: 'Metros',     activo: true },
        { codigo: 'LTS', descripcion: 'Litros',     activo: true },
        { codigo: 'CJA', descripcion: 'Cajas',      activo: true }
    ];

    function cargarUnidades() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY_UNIDADES);
            if (!raw) {
                localStorage.setItem(STORAGE_KEY_UNIDADES, JSON.stringify(SEED_UNIDADES));
                return SEED_UNIDADES.slice();
            }
            const data = JSON.parse(raw);
            return Array.isArray(data) ? data : SEED_UNIDADES.slice();
        } catch (e) {
            return SEED_UNIDADES.slice();
        }
    }

    // Devuelve la descripción legible de un código ("PZS" → "Piezas")
    function obtenerDescripcionUnidad(codigo) {
        if (!codigo) return '—';
        const lista = cargarUnidades();
        const encontrada = lista.find(u =>
            u.codigo.toLowerCase() === String(codigo).toLowerCase()
        );
        return encontrada ? encontrada.descripcion : codigo;
    }

    // Rellena un <select> con las unidades activas
    function poblarSelectUnidades(select, valorSeleccionado) {
        if (!select) return;
        const lista = cargarUnidades().filter(u => u.activo !== false);

        const valor = valorSeleccionado || select.value || (lista[0] && lista[0].codigo) || '';

        select.innerHTML = '';
        lista.forEach(function (u) {
            const opt = document.createElement('option');
            opt.value = u.codigo;
            opt.textContent = u.descripcion;
            if (u.codigo === valor) opt.selected = true;
            select.appendChild(opt);
        });
    }

    // Refresca todos los selects .input-unidad de la página
    function refrescarSelectsUnidades() {
        document.querySelectorAll('select.input-unidad').forEach(function (sel) {
            const valorActual = sel.value;
            poblarSelectUnidades(sel, valorActual);
        });
    }

    // Exponer
    window.swcoraUnidades = {
        cargar: cargarUnidades,
        descripcion: obtenerDescripcionUnidad,
        poblarSelect: poblarSelectUnidades,
        refrescarSelects: refrescarSelectsUnidades
    };

    // =============================================
    // HELPERS GLOBALES: Sincronización de Tipos de Empresa
    // =============================================

    // Lee la tabla #tablaTiposEmpresa y devuelve un array de { nombre, activo }
    function obtenerTiposEmpresa() {
        const tabla = document.getElementById('tablaTiposEmpresa');
        if (!tabla) return [];

        return Array.from(tabla.querySelectorAll('.tipo-empresa-row')).map(function (fila) {
            return {
                nombre: fila.getAttribute('data-nombre') || '',
                activo: fila.getAttribute('data-estado') === 'activo'
            };
        }).filter(t => t.nombre);
    }

    // Reconstruye un <select> con los tipos disponibles
    function reconstruirSelectTipos(select, opciones) {
        if (!select) return;

        opciones = opciones || {};
        const placeholder = opciones.placeholder || 'Seleccionar tipo...';
        const soloActivos = opciones.soloActivos === true;
        const valorActual = opciones.valorActual || select.value;

        const tipos = obtenerTiposEmpresa().filter(function (t) {
            return soloActivos ? t.activo : true;
        });

        // Recrear opciones
        select.innerHTML = '';

        const optInicial = document.createElement('option');
        optInicial.value = '';
        optInicial.textContent = placeholder;
        select.appendChild(optInicial);

        tipos.forEach(function (tipo) {
            const opt = document.createElement('option');
            opt.value = tipo.nombre;
            opt.textContent = tipo.nombre;
            select.appendChild(opt);
        });

        // Restaurar valor previo si aún existe
        if (valorActual) {
            const existe = Array.from(select.options).some(o => o.value === valorActual);
            if (existe) select.value = valorActual;
        }
    }

    // Sincroniza los 2 selects (filtro + modal) con la tabla de tipos
    function sincronizarSelectsTipos(valorFiltro, valorModal) {
        reconstruirSelectTipos(
            document.getElementById('filtroEmpresasTipo'),
            { placeholder: 'Todos los tipos', soloActivos: false, valorActual: valorFiltro || '' }
        );

        reconstruirSelectTipos(
            document.getElementById('empresaTipo'),
            { placeholder: 'Seleccionar tipo...', soloActivos: true, valorActual: valorModal || '' }
        );
    }

    // Exponer para uso en otros bloques
    window.swcoraSyncTiposEmpresa = sincronizarSelectsTipos;

    // Referencias globales a los modales de empresa
    const modalEmpresaEl = document.getElementById('modalEmpresa');
    const modalEmpresaTitulo = document.getElementById('modalEmpresaTitulo');
    const modalTiposEmpresaEl = document.getElementById('modalTiposEmpresa');
    const modalNuevoTipoEl = document.getElementById('modalNuevoTipo');

    // =============================================
    // Login Superusuario → redirección por rol
    // =============================================
    const loginForm = document.getElementById('superAdminLoginForm');
    if (loginForm) {
        // Mapa de usuario → carpeta de destino
        const RUTAS_POR_ROL = {
            'superusuario':   'superusuario/index.html',
            'administrador':  'administrador/index.html',
            'aprobador':      'aprobador/index.html',
            'generador':      'generador/index.html',
            'sinrol':         'sinrol/index.html'
        };

        // Elemento de error (ya existe en el HTML: #loginError)
        const loginErrorEl = document.getElementById('loginError');

        // Muestra un mensaje de error en el contenedor #loginError
        function mostrarErrorLogin(msg) {
            if (!loginErrorEl) {
                alert(msg);
                return;
            }
            loginErrorEl.textContent = msg;
            loginErrorEl.classList.remove('d-none');
        }

        // Oculta el mensaje de error
        function ocultarErrorLogin() {
            if (!loginErrorEl) return;
            loginErrorEl.classList.add('d-none');
            loginErrorEl.textContent = '';
        }

        // ---------- Referencias a los inputs ----------
        const inputUsuario = document.getElementById('usuario');
        const inputPassword = document.getElementById('password');

        // =============================================
        // Generar <datalist> dinámicamente desde RUTAS_POR_ROL
        // (sugerencias de usuario sin cambiar el tipo de campo)
        // =============================================
        (function generarDatalistUsuarios() {
            let datalist = document.getElementById('listaUsuarios');
            if (!datalist) {
                datalist = document.createElement('datalist');
                datalist.id = 'listaUsuarios';
                document.body.appendChild(datalist);

                if (inputUsuario) inputUsuario.setAttribute('list', 'listaUsuarios');
            }
            // Vaciar y poblar con los roles existentes
            datalist.innerHTML = '';
            Object.keys(RUTAS_POR_ROL).forEach(function (rol) {
                const opt = document.createElement('option');
                opt.value = rol;
                datalist.appendChild(opt);
            });
        })();

        // =============================================
        // Autocompletar contraseña con el mismo usuario
        // =============================================
        if (inputUsuario && inputPassword) {
            // Al cambiar el usuario (seleccionar del datalist, salir del campo
            // o pulsar Enter), copiar el valor a la contraseña si es un usuario válido.
            inputUsuario.addEventListener('change', function () {
                const valor = this.value.trim();
                if (valor && RUTAS_POR_ROL[valor.toLowerCase()]) {
                    inputPassword.value = valor;
                }
            });
        }

        // ---------- Submit del formulario ----------
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            ocultarErrorLogin();

            const usuario = (inputUsuario && inputUsuario.value ? inputUsuario.value : '')
                .trim()
                .toLowerCase();

            const password = inputPassword ? inputPassword.value : '';

            // Validación mínima
            if (!usuario) {
                mostrarErrorLogin('Debes ingresar un usuario.');
                if (inputUsuario) inputUsuario.focus();
                return;
            }
            if (!password) {
                mostrarErrorLogin('Debes ingresar una contraseña.');
                if (inputPassword) inputPassword.focus();
                return;
            }

            // Buscar la ruta según el rol ingresado
            const rutaDestino = RUTAS_POR_ROL[usuario];

            if (!rutaDestino) {
                mostrarErrorLogin('Contraseña incorrecta.');
                if (inputUsuario) {
                    inputUsuario.classList.add('is-invalid');
                    inputUsuario.focus();
                }
                return;
            }

            // Todo OK → redirigir al index del rol
            console.log('🔐 Login:', usuario, '→', rutaDestino);
            window.location.href = rutaDestino;
        });

        // Quitar el estado inválido al escribir de nuevo
        if (inputUsuario) {
            inputUsuario.addEventListener('input', function () {
                this.classList.remove('is-invalid');
                ocultarErrorLogin();
            });
        }
    }

    // =============================================
    // Submenús anidados en el navbar
    // Permite desplegar submenús dentro de un dropdown.
    // =============================================
    const submenus = document.querySelectorAll('.dropdown-submenu > .dropdown-item');
    submenus.forEach(function (el) {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const submenu = this.nextElementSibling;

            // Cerrar otros submenús abiertos
            document.querySelectorAll('.dropdown-submenu > .dropdown-menu.show').forEach(function (open) {
                if (open !== submenu) open.classList.remove('show');
            });

            submenu.classList.toggle('show');
        });
    });

    // =============================================
    // Toggle mostrar/ocultar contraseña
    // =============================================
    const btnTogglePassword = document.getElementById('btnTogglePassword');
    if (btnTogglePassword) {
        btnTogglePassword.addEventListener('click', function () {
            const input = document.getElementById('password');
            const icon = this.querySelector('i');
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('bi-eye');
                icon.classList.add('bi-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('bi-eye-slash');
                icon.classList.add('bi-eye');
            }
        });
    }

    // =============================================
    // Crear Salida - Autocompletar contacto
    // Al seleccionar una empresa, carga su contacto.
    // =============================================
    const selectEmpresa = document.getElementById('selectEmpresa');
    const contactoInput = document.getElementById('contactoInput');
    if (selectEmpresa && contactoInput) {
        selectEmpresa.addEventListener('change', function () {
            const contacto = this.options[this.selectedIndex].getAttribute('data-contacto');
            contactoInput.value = contacto || '';
        });
    }

    // Botón para limpiar el contacto
    const btnLimpiarContacto = document.getElementById('btnLimpiarContacto');
    if (btnLimpiarContacto) {
        btnLimpiarContacto.addEventListener('click', function () {
            contactoInput.value = '';
            contactoInput.focus();
        });
    }

    // =============================================
    // Árbol de permisos - Tri-state
    // Padres marcados parcialmente → indeterminate.
    // =============================================
    document.querySelectorAll('.tree-container input[type="checkbox"]').forEach(function (checkbox) {
        checkbox.addEventListener('change', function () {
            const li = this.closest('li');
            const hijos = li ? li.querySelectorAll('ul input[type="checkbox"]') : [];
            hijos.forEach(function (hijo) {
                hijo.checked = checkbox.checked;
                hijo.indeterminate = false;
            });
            actualizarPadres(checkbox);
        });
    });

    // Recalcula el estado del padre según sus hijos
    function actualizarPadres(checkbox) {
        let currentLi = checkbox.closest('li');
        while (currentLi) {
            const parentUl = currentLi.parentElement;
            const parentLi = parentUl ? parentUl.closest('li') : null;
            if (!parentLi) break;

            const parentCheckbox = parentLi.querySelector(':scope > .form-check input[type="checkbox"]');
            if (!parentCheckbox) break;

            const hermanos = parentLi.querySelectorAll(':scope > ul > li > .form-check input[type="checkbox"]');
            const marcados = Array.from(hermanos).filter(c => c.checked).length;
            const total = hermanos.length;

            if (marcados === 0) {
                parentCheckbox.checked = false;
                parentCheckbox.indeterminate = false;
            } else if (marcados === total) {
                parentCheckbox.checked = true;
                parentCheckbox.indeterminate = false;
            } else {
                parentCheckbox.checked = false;
                parentCheckbox.indeterminate = true;
            }

            currentLi = parentLi;
        }
    }

    // =============================================
    // Compartir modales entre sub-modal
    // Cierra modales abiertos cuando se abre otro.
    // =============================================
    document.querySelectorAll('[data-bs-toggle="modal"]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const targetModal = this.getAttribute('data-bs-target');
            document.querySelectorAll('.modal.show').forEach(function (modal) {
                if ('#' + modal.id !== targetModal) {
                    const instance = bootstrap.Modal.getInstance(modal);
                    if (instance) instance.hide();
                }
            });
        });
    });

    // =============================================
    // Acordeón exclusivo: gestionado por Bootstrap
    // Añade clase "collapsed" a las cards colapsadas.
    // =============================================
    document.querySelectorAll('.card-collapsible .collapse').forEach(function (collapseEl) {
        const card = collapseEl.closest('.card-collapsible');
        if (!card) return;

        if (!collapseEl.classList.contains('show')) {
            card.classList.add('collapsed');
        } else {
            card.classList.remove('collapsed');
        }

        collapseEl.addEventListener('show.bs.collapse', function () {
            card.classList.remove('collapsed');
        });

        collapseEl.addEventListener('hide.bs.collapse', function () {
            card.classList.add('collapsed');
        });
    });

    // =============================================
    // Toggle condicional: Retorno Esperado
    // Si es salida definitiva → oculta y limpia el retorno.
    // =============================================
    const esDefinitiva = document.getElementById('esDefinitiva');
    const wrapperRetornoEsperado = document.getElementById('wrapperRetornoEsperado');
    const retornoEsperadoInput = document.getElementById('retornoEsperado');

    if (esDefinitiva && wrapperRetornoEsperado) {
        function actualizarRetornoEsperado() {
            if (esDefinitiva.checked) {
                wrapperRetornoEsperado.classList.add('d-none');
                if (retornoEsperadoInput) {
                    retornoEsperadoInput.value = '';
                    retornoEsperadoInput.required = false;
                }
            } else {
                wrapperRetornoEsperado.classList.remove('d-none');
                if (retornoEsperadoInput) {
                    retornoEsperadoInput.required = true;
                }
            }
        }

        actualizarRetornoEsperado();
        esDefinitiva.addEventListener('change', actualizarRetornoEsperado);
    }

    // =============================================
    // Cerrar sesión individual (Mi Perfil)
    // Rellena los datos del dispositivo/usuario en el modal.
    // =============================================
    const modalCerrarSesionIndividual = document.getElementById('modalCerrarSesionIndividual');
    if (modalCerrarSesionIndividual) {
        modalCerrarSesionIndividual.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            if (!button) return;

            const dispositivo = button.getAttribute('data-dispositivo') || '—';
            const usuario = button.getAttribute('data-usuario') || '—';

            this.querySelector('#cerrarDispositivo').textContent = dispositivo;
            this.querySelector('#cerrarUsuario').textContent = usuario;
        });
    }

    // =============================================
    // Recuperar contraseña del Superusuario
    // =============================================
    const linkRecuperarPassword = document.getElementById('linkRecuperarPassword');
    const modalRecuperarPasswordEl = document.getElementById('modalRecuperarPassword');
    const btnConfirmarRecuperar = document.getElementById('btnConfirmarRecuperar');
    const toastRecuperarPasswordEl = document.getElementById('toastRecuperarPassword');

    // Abrir el modal de recuperación al pulsar el enlace
    if (linkRecuperarPassword && modalRecuperarPasswordEl) {
        linkRecuperarPassword.addEventListener('click', function (e) {
            e.preventDefault();
            const modal = new bootstrap.Modal(modalRecuperarPasswordEl);
            modal.show();
        });
    }

    // Confirmar recuperación → cierra modal y muestra toast
    if (btnConfirmarRecuperar) {
        btnConfirmarRecuperar.addEventListener('click', function () {
            const modalInstance = bootstrap.Modal.getInstance(modalRecuperarPasswordEl);
            if (modalInstance) modalInstance.hide();

            if (toastRecuperarPasswordEl) {
                const toast = new bootstrap.Toast(toastRecuperarPasswordEl, { delay: 5000 });
                toast.show();
            }
        });
    }

    // =============================================
    // Modal Empresa: Crear / Editar
    // =============================================
    const toastCambiosGuardadosEmpEl = document.getElementById('toastCambiosGuardados');

    if (modalEmpresaEl) {
        // Referencia a la fila que se está editando (null = crear)
        let filaEmpresaEditando = null;

        // ---------- Al abrir el modal: crear o editar ----------
        modalEmpresaEl.addEventListener('show.bs.modal', function (event) {
            const trigger = event.relatedTarget;

            // Resetear campos
            document.getElementById('empresaNombre').value = '';
            document.getElementById('empresaContacto').value = '';
            document.getElementById('empresaTipo').value = '';

            // Modo CREAR: sin trigger o trigger es el botón "Nueva Empresa"
            if (!trigger || trigger.id === 'btnNuevaEmpresa') {
                filaEmpresaEditando = null;
                modalEmpresaTitulo.innerHTML = '<i class="bi bi-plus-circle"></i> Nueva Empresa';
                return;
            }

            // Modo EDITAR: leer data-* del botón
            filaEmpresaEditando = trigger.closest('.empresa-row');

            const nombre = trigger.getAttribute('data-nombre') || '';
            const contacto = trigger.getAttribute('data-contacto') || '';
            const tipo = trigger.getAttribute('data-tipo') || '';

            modalEmpresaTitulo.innerHTML = '<i class="bi bi-pencil"></i> Editar Empresa';
            document.getElementById('empresaNombre').value = nombre;
            document.getElementById('empresaContacto').value = contacto;
            document.getElementById('empresaTipo').value = tipo;
        });

        // ---------- Guardar (crear o actualizar) ----------
        const btnGuardarEmpresa = document.getElementById('btnGuardarEmpresa');
        if (btnGuardarEmpresa) {
            btnGuardarEmpresa.addEventListener('click', function () {
                const nombre = document.getElementById('empresaNombre').value.trim();
                const contacto = document.getElementById('empresaContacto').value.trim();
                const tipo = document.getElementById('empresaTipo').value;

                if (!nombre || !tipo) {
                    alert('Por favor completa los campos obligatorios.');
                    return;
                }

                const tbodyEmpresas = document.querySelector('#tablaEmpresas tbody');
                if (!tbodyEmpresas) return;

                // Mapa de tipos → badge
                const tiposMap = {
                    'Proveedor':  { texto: 'Proveedor',  clase: 'bg-warning' },
                    'Cliente':    { texto: 'Cliente',    clase: 'bg-danger'  },
                    'Mensajería': { texto: 'Mensajería', clase: 'bg-secondary' },
                    'Filial':     { texto: 'Filial',     clase: 'bg-info'    }
                };
                const tipoInfo = tiposMap[tipo] || { clase: 'bg-secondary' };

                if (filaEmpresaEditando) {
                    // ===== ACTUALIZAR fila existente =====
                    const celdas = filaEmpresaEditando.querySelectorAll('td');
                    celdas[1].textContent = nombre;
                    celdas[2].textContent = contacto || '—';
                    celdas[3].innerHTML = '<span class="badge ' + tipoInfo.clase + '">' + tipo + '</span>';

                    // Actualizar data-* de la fila
                    filaEmpresaEditando.setAttribute('data-nombre', nombre);
                    filaEmpresaEditando.setAttribute('data-contacto', contacto);
                    filaEmpresaEditando.setAttribute('data-tipo', tipo);

                    // Actualizar data-* del botón Editar de esa fila
                    const btnEditar = filaEmpresaEditando.querySelector('.btn-editar-empresa');
                    if (btnEditar) {
                        btnEditar.setAttribute('data-nombre', nombre);
                        btnEditar.setAttribute('data-contacto', contacto);
                        btnEditar.setAttribute('data-tipo', tipo);
                    }

                } else {
                    // ===== CREAR nueva fila =====
                    // Generar código correlativo
                    const codigos = Array.from(tbodyEmpresas.querySelectorAll('.empresa-row'))
                        .map(f => f.getAttribute('data-codigo') || '');
                    let maxNum = 0;
                    codigos.forEach(c => {
                        const m = c.match(/EMP-(\d+)/);
                        if (m) maxNum = Math.max(maxNum, parseInt(m[1], 10));
                    });
                    const nuevoCodigo = 'EMP-' + String(maxNum + 1).padStart(3, '0');

                    const fila = document.createElement('tr');
                    fila.className = 'empresa-row';
                    fila.setAttribute('data-codigo', nuevoCodigo);
                    fila.setAttribute('data-nombre', nombre);
                    fila.setAttribute('data-contacto', contacto);
                    fila.setAttribute('data-tipo', tipo);
                    fila.setAttribute('data-estado', 'activo');

                    fila.innerHTML =
                        '<td><code>' + nuevoCodigo + '</code></td>' +
                        '<td>' + nombre + '</td>' +
                        '<td>' + (contacto || '—') + '</td>' +
                        '<td><span class="badge ' + tipoInfo.clase + '">' + tipo + '</span></td>' +
                        '<td><span class="badge bg-success badge-estado">Activo</span></td>' +
                        '<td class="text-center">' +
                            '<button type="button" class="btn btn-sm btn-outline-info btn-editar-empresa" ' +
                                'data-bs-toggle="modal" data-bs-target="#modalEmpresa" ' +
                                'data-codigo="' + nuevoCodigo + '" ' +
                                'data-nombre="' + nombre.replace(/"/g, '&quot;') + '" ' +
                                'data-contacto="' + (contacto || '').replace(/"/g, '&quot;') + '" ' +
                                'data-tipo="' + tipo + '" data-activo="true">' +
                                '<i class="bi bi-pencil"></i>' +
                            '</button> ' +
                            '<button class="btn btn-sm btn-outline-primary btn-toggle-estado-empresa" ' +
                                'title="Desactivar" data-accion="desactivar">' +
                                '<i class="bi bi-power"></i>' +
                            '</button>' +
                        '</td>';

                    tbodyEmpresas.appendChild(fila);
                }

                // Cerrar modal
                const instance = bootstrap.Modal.getInstance(modalEmpresaEl);
                if (instance) instance.hide();

                // Refrescar filtros si existen
                const filtroNombre = document.getElementById('filtroEmpresasNombre');
                if (filtroNombre) filtroNombre.dispatchEvent(new Event('input'));

                // Toast "cambios guardados" al terminar de cerrar
                modalEmpresaEl.addEventListener('hidden.bs.modal', function handler() {
                    if (toastCambiosGuardadosEmpEl) {
                        const toast = new bootstrap.Toast(toastCambiosGuardadosEmpEl);
                        toast.show();
                    }
                    modalEmpresaEl.removeEventListener('hidden.bs.modal', handler);
                });

                // Limpiar referencia
                filaEmpresaEditando = null;
            });
        }
    }

    // =============================================
    // Modal Tipos de Empresa: abrir "Nuevo Tipo"
    // =============================================
    const btnNuevoTipoEmpresa = document.getElementById('btnNuevoTipoEmpresa');

    if (btnNuevoTipoEmpresa && modalTiposEmpresaEl && modalNuevoTipoEl) {
        btnNuevoTipoEmpresa.addEventListener('click', function () {
            const inputNuevoTipo = document.getElementById('nuevoTipoNombre');
            if (inputNuevoTipo) {
                inputNuevoTipo.value = '';
                inputNuevoTipo.classList.remove('is-invalid');
                // Limpiar feedback previo
                const fb = inputNuevoTipo.parentElement.querySelector('.invalid-feedback');
                if (fb) fb.remove();
            }

            const instance = bootstrap.Modal.getInstance(modalTiposEmpresaEl);
            if (instance) instance.hide();

            const nuevoTipoModal = new bootstrap.Modal(modalNuevoTipoEl);
            nuevoTipoModal.show();
        });
    }

    // =============================================
    // PLANTILLAS: mostrar/ocultar "Guardar Plantilla"
    // según la pestaña activa (Aplicar / Crear)
    // =============================================
    const tabAplicarBtn = document.getElementById('tabAplicar-btn');
    const tabCrearBtn = document.getElementById('tabCrear-btn');
    const btnGuardarPlantilla = document.getElementById('btnGuardarPlantilla');

    if (tabAplicarBtn && tabCrearBtn && btnGuardarPlantilla) {
        tabAplicarBtn.addEventListener('shown.bs.tab', function () {
            btnGuardarPlantilla.style.display = 'none';
        });

        tabCrearBtn.addEventListener('shown.bs.tab', function () {
            btnGuardarPlantilla.style.display = 'inline-block';
        });
    }

    // =============================================
    // NUEVA SALIDA: Materiales dinámicos
    // Agregar/eliminar filas + validar duplicados.
    // =============================================
    const tbodyMateriales = document.getElementById('tbodyMateriales');
    const btnAgregarMaterial = document.getElementById('btnAgregarMaterial');
    const contadorMateriales = document.getElementById('contadorMateriales');

    const MAX_MATERIALES = 50;

    if (tbodyMateriales && btnAgregarMaterial) {

        // ---------- Agregar fila ----------
        btnAgregarMaterial.addEventListener('click', function () {
            const filas = tbodyMateriales.querySelectorAll('.material-row');

            if (filas.length >= MAX_MATERIALES) {
                alert('Máximo ' + MAX_MATERIALES + ' materiales permitidos.');
                return;
            }

            const plantilla = filas[0];
            const nuevaFila = plantilla.cloneNode(true);

            nuevaFila.querySelector('.input-cantidad').value = '1';
            nuevaFila.querySelector('.input-unidad').selectedIndex = 0;
            nuevaFila.querySelector('.input-descripcion').value = '';
            nuevaFila.querySelector('.input-comentario').value = '';

            tbodyMateriales.appendChild(nuevaFila);

            renumerarFilas();
            actualizarContadorYEstado();

            nuevaFila.querySelector('.input-descripcion').focus();
            nuevaFila.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        // ---------- Eliminar fila (delegación) con validación ----------
        tbodyMateriales.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-eliminar-material');
            if (!btn) return;

            const fila = btn.closest('tr');
            const filas = tbodyMateriales.querySelectorAll('.material-row');

            if (filas.length === 1) {
                alert('Debe haber al menos un material.');
                return;
            }

            const cantidad = fila.querySelector('.input-cantidad').value.trim();
            const descripcion = fila.querySelector('.input-descripcion').value.trim();
            const comentario = fila.querySelector('.input-comentario').value.trim();

            const cantidadNumerica = parseFloat(cantidad);
            const cantidadDistintaDeUno = !isNaN(cantidadNumerica) && cantidadNumerica !== 1;

            if (cantidadDistintaDeUno || descripcion !== '' || comentario !== '') {
                const confirmar = confirm('¿Deseas eliminar esta fila y su contenido?');
                if (!confirmar) return;
            }

            fila.remove();
            renumerarFilas();
            actualizarContadorYEstado();
        });

        // ---------- Validación: descripciones duplicadas ----------
        tbodyMateriales.addEventListener('input', function (e) {
            if (!e.target.classList.contains('input-descripcion')) return;

            const valor = e.target.value.trim().toLowerCase();
            const inputs = tbodyMateriales.querySelectorAll('.input-descripcion');

            inputs.forEach(i => i.classList.remove('is-invalid'));

            if (!valor) return;

            let duplicados = 0;
            inputs.forEach(function (input) {
                if (input.value.trim().toLowerCase() === valor) {
                    duplicados++;
                }
            });

            if (duplicados > 1) {
                inputs.forEach(function (input) {
                    if (input.value.trim().toLowerCase() === valor) {
                        input.classList.add('is-invalid');
                    }
                });
            }
        });

        // ---------- Funciones auxiliares ----------
        function renumerarFilas() {
            tbodyMateriales.querySelectorAll('.material-row').forEach(function (fila, index) {
                fila.querySelector('.numero-linea').textContent = index + 1;
            });
        }

        function actualizarContadorYEstado() {
            const total = tbodyMateriales.querySelectorAll('.material-row').length;

            if (contadorMateriales) {
                contadorMateriales.textContent = total;
            }

            btnAgregarMaterial.disabled = total >= MAX_MATERIALES;
        }

        actualizarContadorYEstado();
    }

    // =============================================
    // Árbol de permisos: plegado individual + acciones globales
    // =============================================
    const arbolPermisos = document.getElementById('arbolPermisos');

    if (arbolPermisos) {
        const btnExpandirArbol = document.getElementById('btnExpandirArbol');
        const btnColapsarArbol = document.getElementById('btnColapsarArbol');
        const btnSeleccionarTodo = document.getElementById('btnSeleccionarTodo');
        const btnDeseleccionarTodo = document.getElementById('btnDeseleccionarTodo');

        // Insertar el toggle de plegado en cada <li>
        arbolPermisos.querySelectorAll('li').forEach(function (li) {
            const subUl = li.querySelector(':scope > ul');
            const formCheck = li.querySelector(':scope > .form-check');

            if (!formCheck) return;

            if (li.querySelector(':scope > .toggle-nodo')) return;

            const toggle = document.createElement('span');
            toggle.className = 'toggle-nodo' + (subUl ? '' : ' placeholder');
            toggle.setAttribute('role', 'button');

            if (subUl) {
                toggle.innerHTML = '<i class="bi bi-caret-right-fill"></i>';
                toggle.setAttribute('aria-label', 'Expandir o colapsar');
            } else {
                toggle.setAttribute('aria-hidden', 'true');
            }

            li.insertBefore(toggle, formCheck);

            if (subUl) {
                subUl.classList.remove('nodo-colapsado');
                toggle.classList.remove('colapsado');
            }
        });

        // Delegación para plegar/desplegar un nodo
        arbolPermisos.addEventListener('click', function (e) {
            const toggle = e.target.closest('.toggle-nodo');
            if (!toggle || toggle.classList.contains('placeholder')) return;

            const li = toggle.closest('li');
            const subUl = li ? li.querySelector(':scope > ul') : null;
            if (!subUl) return;

            subUl.classList.toggle('nodo-colapsado');
            toggle.classList.toggle('colapsado');
        });

        // Acciones globales: expandir
        if (btnExpandirArbol) {
            btnExpandirArbol.addEventListener('click', function () {
                arbolPermisos.querySelectorAll('ul.nodo-colapsado').forEach(function (ul) {
                    ul.classList.remove('nodo-colapsado');
                });
                arbolPermisos.querySelectorAll('.toggle-nodo.colapsado').forEach(function (t) {
                    t.classList.remove('colapsado');
                });
            });
        }

        // Acciones globales: colapsar
        if (btnColapsarArbol) {
            btnColapsarArbol.addEventListener('click', function () {
                arbolPermisos.querySelectorAll('ul ul').forEach(function (ul) {
                    ul.classList.add('nodo-colapsado');
                });
                arbolPermisos.querySelectorAll('.toggle-nodo').forEach(function (t) {
                    if (!t.classList.contains('placeholder')) t.classList.add('colapsado');
                });
            });
        }

        // Seleccionar todos los checkboxes
        if (btnSeleccionarTodo) {
            btnSeleccionarTodo.addEventListener('click', function () {
                arbolPermisos.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
                    cb.checked = true;
                    cb.indeterminate = false;
                });
            });
        }

        // Deseleccionar todos los checkboxes
        if (btnDeseleccionarTodo) {
            btnDeseleccionarTodo.addEventListener('click', function () {
                arbolPermisos.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
                    cb.checked = false;
                    cb.indeterminate = false;
                });
            });
        }
    }

    // =============================================
    // MI PERFIL: toast al cerrar sesión
    // =============================================
    const btnConfirmarCerrarSesion = document.getElementById('btnConfirmarCerrarSesion');
    const btnConfirmarCerrarTodas = document.getElementById('btnConfirmarCerrarTodas');
    const toastSesionCerradaEl = document.getElementById('toastSesionCerrada');
    const modalCerrarSesionIndividualEl = document.getElementById('modalCerrarSesionIndividual');
    const modalCerrarTodasSesionesEl = document.getElementById('modalCerrarTodasSesiones');

    // Muestra el toast de sesión cerrada
    function mostrarToastSesionCerrada() {
        if (!toastSesionCerradaEl) return;
        const toast = new bootstrap.Toast(toastSesionCerradaEl);
        toast.show();
    }

    // Confirmar cierre de sesión individual
    if (btnConfirmarCerrarSesion && modalCerrarSesionIndividualEl) {
        btnConfirmarCerrarSesion.addEventListener('click', function () {
            const instance = bootstrap.Modal.getInstance(modalCerrarSesionIndividualEl);
            if (instance) instance.hide();

            modalCerrarSesionIndividualEl.addEventListener('hidden.bs.modal', function handler() {
                mostrarToastSesionCerrada();
                modalCerrarSesionIndividualEl.removeEventListener('hidden.bs.modal', handler);
            });
        });
    }

    // =============================================
    // MI PERFIL: Cambiar contraseña con validación + toast
    // =============================================
    const btnGuardarPassword = document.getElementById('btnGuardarPassword');
    const inputPasswordActual = document.getElementById('inputPasswordActual');
    const inputPasswordNueva = document.getElementById('inputPasswordNueva');
    const inputPasswordConfirmar = document.getElementById('inputPasswordConfirmar');
    const toastPasswordActualizadaEl = document.getElementById('toastPasswordActualizada');
    const modalCambiarPasswordEl = document.getElementById('modalCambiarPassword');

    if (btnGuardarPassword && modalCambiarPasswordEl) {

        // Limpia el estado inválido al escribir en cualquier input
        [inputPasswordActual, inputPasswordNueva, inputPasswordConfirmar].forEach(function (input) {
            if (!input) return;
            input.addEventListener('input', function () {
                this.classList.remove('is-invalid');
            });
        });

        // Validación al guardar
        btnGuardarPassword.addEventListener('click', function () {
            const actual = inputPasswordActual.value.trim();
            const nueva = inputPasswordNueva.value;
            const confirmar = inputPasswordConfirmar.value;

            [inputPasswordActual, inputPasswordNueva, inputPasswordConfirmar].forEach(function (input) {
                input.classList.remove('is-invalid');
            });

            let valido = true;

            if (!actual) {
                inputPasswordActual.classList.add('is-invalid');
                valido = false;
            }

            if (!nueva) {
                inputPasswordNueva.classList.add('is-invalid');
                valido = false;
            } else if (nueva.length < 8) {
                inputPasswordNueva.classList.add('is-invalid');
                valido = false;
            }

            if (!confirmar) {
                inputPasswordConfirmar.classList.add('is-invalid');
                valido = false;
            } else if (nueva && confirmar !== nueva) {
                inputPasswordConfirmar.classList.add('is-invalid');
                valido = false;
            }

            if (actual && nueva && actual === nueva) {
                inputPasswordNueva.classList.add('is-invalid');
                valido = false;
            }

            if (!valido) {
                const primerError = modalCambiarPasswordEl.querySelector('.is-invalid');
                if (primerError) primerError.focus();
                return;
            }

            console.log('🔐 CAMBIAR CONTRASEÑA:', { actual: '••••••', nueva: '••••••' });

            const instance = bootstrap.Modal.getInstance(modalCambiarPasswordEl);
            if (instance) instance.hide();

            modalCambiarPasswordEl.addEventListener('hidden.bs.modal', function handler() {
                inputPasswordActual.value = '';
                inputPasswordNueva.value = '';
                inputPasswordConfirmar.value = '';
                [inputPasswordActual, inputPasswordNueva, inputPasswordConfirmar].forEach(function (input) {
                    input.classList.remove('is-invalid');
                });

                if (toastPasswordActualizadaEl) {
                    const toast = new bootstrap.Toast(toastPasswordActualizadaEl);
                    toast.show();
                }

                modalCambiarPasswordEl.removeEventListener('hidden.bs.modal', handler);
            });
        });
    }

    // Confirmar cierre de todas las sesiones
    if (btnConfirmarCerrarTodas && modalCerrarTodasSesionesEl) {
        btnConfirmarCerrarTodas.addEventListener('click', function () {
            const instance = bootstrap.Modal.getInstance(modalCerrarTodasSesionesEl);
            if (instance) instance.hide();

            modalCerrarTodasSesionesEl.addEventListener('hidden.bs.modal', function handler() {
                mostrarToastSesionCerrada();
                modalCerrarTodasSesionesEl.removeEventListener('hidden.bs.modal', handler);
            });
        });
    }

    // =============================================
    // APROBAR SOLICITUDES: render dinámico + filtros + acciones
    // =============================================
    const tbodySolicitudes = document.getElementById('tbodySolicitudes');

    if (tbodySolicitudes) {
        // Referencias a filtros y botones
        const tablaSolicitudes = document.getElementById('tablaSolicitudes');
        const filtroEstado = document.getElementById('filtroEstado');
        const filtroModulo = document.getElementById('filtroModulo');
        const filtroBuscar = document.getElementById('filtroBuscar');
        const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

        const btnSeleccionarTodas = document.getElementById('btnSeleccionarTodas');
        const btnDeseleccionarTodas = document.getElementById('btnDeseleccionarTodas');
        const checkTodos = document.getElementById('checkTodos');

        const btnAprobarSeleccionadas = document.getElementById('btnAprobarSeleccionadas');
        const btnRechazarSeleccionadas = document.getElementById('btnRechazarSeleccionadas');
        const contadorAprobar = document.getElementById('contadorAprobar');
        const contadorRechazar = document.getElementById('contadorRechazar');

        const contadorMostrados = document.getElementById('contadorMostrados');
        const totalSolicitudesEl = document.getElementById('totalSolicitudes');

        // Modales
        const modalAprobarEl = document.getElementById('modalAprobar');
        const modalRechazarEl = document.getElementById('modalRechazar');
        const modalAprobarMasivoEl = document.getElementById('modalAprobarMasivo');
        const modalRechazarMasivoEl = document.getElementById('modalRechazarMasivo');

        // Toast
        const toastSolicitudEl = document.getElementById('toastSolicitudAccion');
        const toastSolicitudTitulo = document.getElementById('toastSolicitudTitulo');
        const toastSolicitudMensaje = document.getElementById('toastSolicitudMensaje');

        let filaAprobando = null;
        let filaRechazando = null;

        // ---------- Helpers ----------
        function normalizarSol(texto) {
            return String(texto || '').toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        function mostrarToastSol(titulo, mensaje, tipo) {
            if (!toastSolicitudEl) return;
            if (toastSolicitudTitulo) toastSolicitudTitulo.textContent = titulo;
            if (toastSolicitudMensaje) toastSolicitudMensaje.textContent = mensaje;
            const header = toastSolicitudEl.querySelector('.toast-header');
            if (header) {
                header.style.backgroundColor = tipo === 'danger'
                    ? 'var(--cora-accent)' : 'var(--cora-success)';
            }
            bootstrap.Toast.getOrCreateInstance(toastSolicitudEl).show();
        }

        function escaparHTML(str) {
            return String(str || '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function badgeEstadoHTML(estado) {
            const mapa = {
                'pendiente': { texto: '⏳ Pendiente', clase: 'bg-warning text-dark' },
                'aprobada':  { texto: '✅ Aprobada',  clase: 'bg-success' },
                'rechazada': { texto: '❌ Rechazada', clase: 'bg-danger' },
                'cancelada': { texto: '🚫 Cancelada', clase: 'bg-dark' }
            };
            const info = mapa[estado] || mapa['pendiente'];
            return '<span class="badge badge-estado ' + info.clase + '">' + info.texto + '</span>';
        }

        // Genera las acciones según estado
        function accionesHTML(estado, usuario) {
            if (estado === 'pendiente') {
                return (
                    '<button class="btn btn-sm btn-outline-success btn-aprobar-solicitud" title="Aprobar" ' +
                        'data-usuario="' + escaparHTML(usuario) + '">' +
                        '<i class="bi bi-check-circle"></i>' +
                    '</button> ' +
                    '<button class="btn btn-sm btn-outline-danger btn-rechazar-solicitud" title="Rechazar" ' +
                        'data-usuario="' + escaparHTML(usuario) + '">' +
                        '<i class="bi bi-x-circle"></i>' +
                    '</button>'
                );
            }
            // aprobada / rechazada / cancelada → sin acciones
            return '<small class="text-muted">—</small>';
        }

        // Genera la celda de respuesta
        function respuestaHTML(estado, respuesta) {
            if (estado === 'rechazada') {
                return '<small class="text-danger">' + escaparHTML(respuesta) + '</small>';
            }
            return '<small class="text-muted">' + escaparHTML(respuesta || 'En revisión') + '</small>';
        }

        // ---------- Render dinámico desde storage ----------
        function renderTablaSolicitudes() {
            const solicitudes = window.swcoraSolicitudes.cargar();
            tbodySolicitudes.innerHTML = '';

            solicitudes.forEach(function (s) {
                const puedeSeleccionar = s.estado === 'pendiente';
                const fila = document.createElement('tr');
                fila.className = 'solicitud-row';
                fila.setAttribute('data-id', s.id);
                fila.setAttribute('data-estado', s.estado);
                fila.setAttribute('data-modulo', s.modulo);
                fila.setAttribute('data-usuario', s.usuario);
                fila.setAttribute('data-fecha', s.fecha);

                fila.innerHTML =
                    '<td class="text-center">' +
                        '<input class="form-check-input check-solicitud" type="checkbox" ' +
                            (puedeSeleccionar ? '' : 'disabled') + '>' +
                    '</td>' +
                    '<td>' + escaparHTML(s.fechaVisible) + '</td>' +
                    '<td><strong>' + escaparHTML(s.usuario) + '</strong></td>' +
                    '<td>' + escaparHTML(s.modulo) + '</td>' +
                    '<td>' + escaparHTML(s.rol) + '</td>' +
                    '<td>' + (s.motivo ? escaparHTML(s.motivo) : '<small class="text-muted">—</small>') + '</td>' +
                    '<td>' + badgeEstadoHTML(s.estado) + '</td>' +
                    '<td class="celda-respuesta">' + respuestaHTML(s.estado, s.respuesta) + '</td>' +
                    '<td class="text-center text-nowrap">' + accionesHTML(s.estado, s.usuario) + '</td>';

                tbodySolicitudes.appendChild(fila);
            });

            if (totalSolicitudesEl) totalSolicitudesEl.textContent = solicitudes.length;

            aplicarFiltrosSol();
        }

        // ---------- Filtros ----------
        function aplicarFiltrosSol() {
            const estado = filtroEstado.value;
            const modulo = filtroModulo.value;
            const buscar = normalizarSol(filtroBuscar.value);

            let visibles = 0;

            tbodySolicitudes.querySelectorAll('.solicitud-row').forEach(function (fila) {
                const filaEstado = fila.getAttribute('data-estado');
                const filaModulo = fila.getAttribute('data-modulo');
                const filaUsuario = normalizarSol(fila.getAttribute('data-usuario'));

                const coincideEstado = (estado === 'todas') || (filaEstado === estado);
                const coincideModulo = (modulo === 'todos') || (filaModulo === modulo);
                const coincideBuscar = !buscar || filaUsuario.includes(buscar);

                const visible = coincideEstado && coincideModulo && coincideBuscar;

                fila.classList.toggle('d-none', !visible);
                if (visible) {
                    visibles++;
                } else {
                    const check = fila.querySelector('.check-solicitud');
                    if (check && !check.disabled) check.checked = false;
                }
            });

            if (contadorMostrados) contadorMostrados.textContent = visibles;

            actualizarContadoresSeleccionSol();
            actualizarCheckTodosSol();
        }

        // Actualiza contadores de selección
        function actualizarContadoresSeleccionSol() {
            const seleccionadas = tbodySolicitudes.querySelectorAll('.check-solicitud:checked:not(:disabled)').length;
            if (contadorAprobar) contadorAprobar.textContent = seleccionadas;
            if (contadorRechazar) contadorRechazar.textContent = seleccionadas;
            if (btnAprobarSeleccionadas) btnAprobarSeleccionadas.disabled = seleccionadas === 0;
            if (btnRechazarSeleccionadas) btnRechazarSeleccionadas.disabled = seleccionadas === 0;
        }

        // Actualiza el estado tri-state del check "Todos"
        function actualizarCheckTodosSol() {
            if (!checkTodos) return;
            const visibles = Array.from(
                tbodySolicitudes.querySelectorAll('.solicitud-row:not(.d-none) .check-solicitud:not(:disabled)')
            );
            if (visibles.length === 0) {
                checkTodos.checked = false;
                checkTodos.indeterminate = false;
                return;
            }
            const marcados = visibles.filter(c => c.checked).length;
            if (marcados === 0) {
                checkTodos.checked = false; checkTodos.indeterminate = false;
            } else if (marcados === visibles.length) {
                checkTodos.checked = true; checkTodos.indeterminate = false;
            } else {
                checkTodos.checked = false; checkTodos.indeterminate = true;
            }
        }

        // ---------- Listeners de filtros ----------
        if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltrosSol);
        if (filtroModulo) filtroModulo.addEventListener('change', aplicarFiltrosSol);
        if (filtroBuscar) filtroBuscar.addEventListener('input', aplicarFiltrosSol);

        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', function () {
                filtroEstado.value = 'todas';
                filtroModulo.value = 'todos';
                filtroBuscar.value = '';
                aplicarFiltrosSol();
            });
        }

        // ---------- Selección ----------
        tbodySolicitudes.addEventListener('change', function (e) {
            if (!e.target.classList.contains('check-solicitud')) return;
            actualizarContadoresSeleccionSol();
            actualizarCheckTodosSol();
        });

        if (btnSeleccionarTodas) {
            btnSeleccionarTodas.addEventListener('click', function () {
                tbodySolicitudes.querySelectorAll('.solicitud-row:not(.d-none) .check-solicitud:not(:disabled)').forEach(cb => cb.checked = true);
                actualizarContadoresSeleccionSol();
                actualizarCheckTodosSol();
            });
        }

        if (btnDeseleccionarTodas) {
            btnDeseleccionarTodas.addEventListener('click', function () {
                tbodySolicitudes.querySelectorAll('.check-solicitud').forEach(cb => cb.checked = false);
                actualizarContadoresSeleccionSol();
                actualizarCheckTodosSol();
            });
        }

        if (checkTodos) {
            checkTodos.addEventListener('change', function () {
                const marcar = this.checked;
                tbodySolicitudes.querySelectorAll('.solicitud-row:not(.d-none) .check-solicitud:not(:disabled)').forEach(cb => cb.checked = marcar);
                actualizarContadoresSeleccionSol();
            });
        }

        // ---------- Delegación de clics en la tabla ----------
        tbodySolicitudes.addEventListener('click', function (e) {
            const btnAprobar = e.target.closest('.btn-aprobar-solicitud');
            const btnRechazar = e.target.closest('.btn-rechazar-solicitud');

            if (btnAprobar) {
                filaAprobando = btnAprobar.closest('.solicitud-row');
                if (!filaAprobando) return;
                const usuario = btnAprobar.getAttribute('data-usuario') || '—';
                const input = document.getElementById('aprobarUsuario');
                if (input) input.textContent = usuario;
                bootstrap.Modal.getOrCreateInstance(modalAprobarEl).show();
                return;
            }

            if (btnRechazar) {
                filaRechazando = btnRechazar.closest('.solicitud-row');
                if (!filaRechazando) return;
                const usuario = btnRechazar.getAttribute('data-usuario') || '—';
                const inputUsuario = document.getElementById('rechazarUsuario');
                const inputMotivo = document.getElementById('rechazarMotivo');
                if (inputUsuario) inputUsuario.textContent = usuario;
                if (inputMotivo) {
                    inputMotivo.value = '';
                    inputMotivo.classList.remove('is-invalid');
                }
                bootstrap.Modal.getOrCreateInstance(modalRechazarEl).show();
                return;
            }
        });

        // ---------- Confirmar Aprobar individual ----------
        const btnConfirmarAprobar = document.getElementById('btnConfirmarAprobar');
        if (btnConfirmarAprobar) {
            btnConfirmarAprobar.addEventListener('click', function () {
                if (!filaAprobando) {
                    bootstrap.Modal.getInstance(modalAprobarEl).hide();
                    return;
                }

                const id = filaAprobando.getAttribute('data-id');
                window.swcoraSolicitudes.actualizar(id, {
                    estado: 'aprobada',
                    respuesta: 'Aprobada por ' + USUARIO_ACTUAL
                });

                bootstrap.Modal.getInstance(modalAprobarEl).hide();
                mostrarToastSol('Solicitud aprobada', 'La solicitud fue aprobada correctamente.', 'success');
                filaAprobando = null;

                renderTablaSolicitudes();
            });
        }

        // ---------- Confirmar Rechazar individual ----------
        const btnConfirmarRechazar = document.getElementById('btnConfirmarRechazar');
        if (btnConfirmarRechazar) {
            btnConfirmarRechazar.addEventListener('click', function () {
                const inputMotivo = document.getElementById('rechazarMotivo');
                const motivo = inputMotivo.value.trim();

                if (!motivo) {
                    inputMotivo.classList.add('is-invalid');
                    inputMotivo.focus();
                    return;
                }
                inputMotivo.classList.remove('is-invalid');

                if (!filaRechazando) {
                    bootstrap.Modal.getInstance(modalRechazarEl).hide();
                    return;
                }

                const id = filaRechazando.getAttribute('data-id');
                window.swcoraSolicitudes.actualizar(id, {
                    estado: 'rechazada',
                    respuesta: motivo
                });

                bootstrap.Modal.getInstance(modalRechazarEl).hide();
                mostrarToastSol('Solicitud rechazada', 'La solicitud fue rechazada. Motivo: ' + motivo, 'danger');
                filaRechazando = null;

                renderTablaSolicitudes();
            });
        }

        // ---------- Aprobar masivo ----------
        if (btnAprobarSeleccionadas) {
            btnAprobarSeleccionadas.addEventListener('click', function () {
                const seleccionadas = tbodySolicitudes.querySelectorAll('.check-solicitud:checked:not(:disabled)').length;
                if (seleccionadas === 0) return;
                const inputCantidad = document.getElementById('aprobarMasivoCantidad');
                if (inputCantidad) inputCantidad.textContent = seleccionadas;
                bootstrap.Modal.getOrCreateInstance(modalAprobarMasivoEl).show();
            });
        }

        const btnConfirmarAprobarMasivo = document.getElementById('btnConfirmarAprobarMasivo');
        if (btnConfirmarAprobarMasivo) {
            btnConfirmarAprobarMasivo.addEventListener('click', function () {
                const checks = tbodySolicitudes.querySelectorAll('.check-solicitud:checked:not(:disabled)');
                let contador = 0;

                checks.forEach(function (cb) {
                    const fila = cb.closest('.solicitud-row');
                    if (!fila) return;
                    const id = fila.getAttribute('data-id');
                    window.swcoraSolicitudes.actualizar(id, {
                        estado: 'aprobada',
                        respuesta: 'Aprobada por ' + USUARIO_ACTUAL
                    });
                    contador++;
                });

                bootstrap.Modal.getInstance(modalAprobarMasivoEl).hide();
                mostrarToastSol('Solicitudes aprobadas', contador + ' solicitud(es) aprobada(s) correctamente.', 'success');

                renderTablaSolicitudes();
            });
        }

        // ---------- Rechazar masivo ----------
        if (btnRechazarSeleccionadas) {
            btnRechazarSeleccionadas.addEventListener('click', function () {
                const seleccionadas = tbodySolicitudes.querySelectorAll('.check-solicitud:checked:not(:disabled)').length;
                if (seleccionadas === 0) return;
                const inputCantidad = document.getElementById('rechazarMasivoCantidad');
                if (inputCantidad) inputCantidad.textContent = seleccionadas;
                const inputMotivo = document.getElementById('rechazarMasivoMotivo');
                if (inputMotivo) {
                    inputMotivo.value = '';
                    inputMotivo.classList.remove('is-invalid');
                }
                bootstrap.Modal.getOrCreateInstance(modalRechazarMasivoEl).show();
            });
        }

        const btnConfirmarRechazarMasivo = document.getElementById('btnConfirmarRechazarMasivo');
        if (btnConfirmarRechazarMasivo) {
            btnConfirmarRechazarMasivo.addEventListener('click', function () {
                const inputMotivo = document.getElementById('rechazarMasivoMotivo');
                const motivo = inputMotivo.value.trim();
                if (!motivo) {
                    inputMotivo.classList.add('is-invalid');
                    inputMotivo.focus();
                    return;
                }
                inputMotivo.classList.remove('is-invalid');

                const checks = tbodySolicitudes.querySelectorAll('.check-solicitud:checked:not(:disabled)');
                let contador = 0;

                checks.forEach(function (cb) {
                    const fila = cb.closest('.solicitud-row');
                    if (!fila) return;
                    const id = fila.getAttribute('data-id');
                    window.swcoraSolicitudes.actualizar(id, {
                        estado: 'rechazada',
                        respuesta: motivo
                    });
                    contador++;
                });

                bootstrap.Modal.getInstance(modalRechazarMasivoEl).hide();
                mostrarToastSol('Solicitudes rechazadas', contador + ' solicitud(es) rechazada(s). Motivo: ' + motivo, 'danger');

                renderTablaSolicitudes();
            });
        }

        // ---------- Limpiar referencias al cerrar modales ----------
        if (modalAprobarEl) modalAprobarEl.addEventListener('hidden.bs.modal', () => filaAprobando = null);
        if (modalRechazarEl) modalRechazarEl.addEventListener('hidden.bs.modal', () => filaRechazando = null);

        // ---------- Inicializar ----------
        renderTablaSolicitudes();
    }

    // =============================================
    // SOLICITAR ACCESO: modal elegir aprobador
    // =============================================
    const btnEnviarSolicitud = document.getElementById('btnEnviarSolicitud');

    if (btnEnviarSolicitud) {
        const selectModuloSolicitud = document.getElementById('selectModuloSolicitud');
        const textareaMotivo = document.getElementById('textareaMotivo');

        const modalElegirAprobadorEl = document.getElementById('modalElegirAprobador');
        const selectAprobador = document.getElementById('selectAprobador');
        const btnConfirmarEnvio = document.getElementById('btnConfirmarEnvio');

        const resumenModulo = document.getElementById('resumenModulo');
        const resumenMotivo = document.getElementById('resumenMotivo');

        const toastSolicitudEnviadaEl = document.getElementById('toastSolicitudEnviada');

        // Abre el modal y muestra el resumen de la solicitud
        btnEnviarSolicitud.addEventListener('click', function () {
            if (!selectModuloSolicitud.value) {
                selectModuloSolicitud.classList.add('is-invalid');
                selectModuloSolicitud.focus();
                return;
            }
            selectModuloSolicitud.classList.remove('is-invalid');

            resumenModulo.textContent = selectModuloSolicitud.value;
            const motivoTexto = textareaMotivo.value.trim();
            resumenMotivo.textContent = motivoTexto || '—';

            const modal = new bootstrap.Modal(modalElegirAprobadorEl);
            modal.show();
        });

        // Confirma el envío: guarda en storage, muestra toast y redirige
        btnConfirmarEnvio.addEventListener('click', function () {
            if (!selectAprobador.value) {
                selectAprobador.classList.add('is-invalid');
                selectAprobador.focus();
                return;
            }

            // Fecha actual
            const ahora = new Date();
            const pad = n => String(n).padStart(2, '0');
            const fechaISO = ahora.getFullYear() + '-' + pad(ahora.getMonth() + 1) + '-' + pad(ahora.getDate()) +
                            'T' + pad(ahora.getHours()) + ':' + pad(ahora.getMinutes());
            const fechaVisible = pad(ahora.getDate()) + '/' + pad(ahora.getMonth() + 1) + '/' + ahora.getFullYear() +
                                ' ' + pad(ahora.getHours()) + ':' + pad(ahora.getMinutes());

            // Guardar en storage compartido
            const nueva = window.swcoraSolicitudes.agregar({
                fecha: fechaISO,
                fechaVisible: fechaVisible,
                usuario: USUARIO_ACTUAL,
                modulo: selectModuloSolicitud.value,
                rol: 'Generador de Salidas',
                motivo: textareaMotivo.value.trim(),
                aprobador: selectAprobador.value,
                estado: 'pendiente',
                respuesta: 'En revisión'
            });

            console.log('📤 SOLICITUD ENVIADA:', nueva);

            const modalInstance = bootstrap.Modal.getInstance(modalElegirAprobadorEl);
            if (modalInstance) modalInstance.hide();

            if (toastSolicitudEnviadaEl) {
                const toast = new bootstrap.Toast(toastSolicitudEnviadaEl);
                toast.show();
            }

            selectModuloSolicitud.value = '';
            textareaMotivo.value = '';

            setTimeout(function () {
                window.location.href = 'acceso-mis-solicitudes.html';
            }, 2000);
        });
    }

    // =============================================
    // NOTIFICACIONES: filtros + marcar como leídas
    // =============================================
    const listaNotificaciones = document.getElementById('listaNotificaciones');

    if (listaNotificaciones) {
        const tabsNotificaciones = document.querySelectorAll('#tabsNotificaciones .nav-link');
        const contadorTodas = document.getElementById('contadorTodas');
        const contadorNoLeidas = document.getElementById('contadorNoLeidas');
        const contadorLeidas = document.getElementById('contadorLeidas');
        const btnMarcarTodasLeidas = document.getElementById('btnMarcarTodasLeidas');

        let filtroActivo = 'todas';

        function getNotificaciones() {
            return listaNotificaciones.querySelectorAll('.notificacion-item');
        }

        function esNoLeida(n) {
            return n.getAttribute('data-leida') === 'false';
        }

        // Recalcula los contadores de cada pestaña
        function actualizarContadores() {
            const notis = getNotificaciones();
            let total = notis.length;
            let noLeidas = 0;
            let leidas = 0;

            notis.forEach(function (n) {
                if (esNoLeida(n)) noLeidas++;
                else leidas++;
            });

            if (contadorTodas) contadorTodas.textContent = total;
            if (contadorNoLeidas) contadorNoLeidas.textContent = noLeidas;
            if (contadorLeidas) contadorLeidas.textContent = leidas;
        }

        // Muestra/oculta según el filtro activo
        function aplicarFiltro() {
            const notis = getNotificaciones();

            notis.forEach(function (n) {
                const leida = !esNoLeida(n);
                let visible = true;

                if (filtroActivo === 'no-leidas') visible = !leida;
                else if (filtroActivo === 'leidas') visible = leida;

                if (visible) {
                    n.classList.remove('d-none');
                } else {
                    n.classList.add('d-none');
                }
            });
        }

        // Marca una notificación como leída
        function marcarComoLeida(n) {
            if (!esNoLeida(n)) return;

            n.setAttribute('data-leida', 'true');
            n.classList.remove('no-leida');
            n.classList.add('leida');
            n.style.backgroundColor = '';

            const btn = n.querySelector('.btn-marcar-leida');
            if (btn) btn.remove();
        }

        // Cambio de pestaña → cambia filtro
        tabsNotificaciones.forEach(function (tab) {
            tab.addEventListener('click', function (e) {
                e.preventDefault();

                tabsNotificaciones.forEach(function (t) {
                    t.classList.remove('active');
                });

                this.classList.add('active');

                filtroActivo = this.getAttribute('data-filtro') || 'todas';

                aplicarFiltro();
            });
        });

        // Delegación: clic en "marcar como leída"
        listaNotificaciones.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-marcar-leida');
            if (!btn) return;

            const noti = btn.closest('.notificacion-item');
            if (!noti) return;

            marcarComoLeida(noti);
            actualizarContadores();
            aplicarFiltro();
        });

        // Marcar todas como leídas
        if (btnMarcarTodasLeidas) {
            btnMarcarTodasLeidas.addEventListener('click', function () {
                const notis = getNotificaciones();
                let huboCambios = false;

                notis.forEach(function (n) {
                    if (esNoLeida(n)) {
                        marcarComoLeida(n);
                        huboCambios = true;
                    }
                });

                actualizarContadores();
                aplicarFiltro();
            });
        }

        actualizarContadores();
        aplicarFiltro();
    }

    // =============================================
    // ADMIN ROLES: filtros en tiempo real + orden por relevancia
    // =============================================
    const tablaRoles = document.getElementById('tablaRoles');

    if (tablaRoles) {
        const filtroRolesBuscar = document.getElementById('filtroRolesBuscar');
        const filtroRolesTipo = document.getElementById('filtroRolesTipo');
        const filtroRolesModulo = document.getElementById('filtroRolesModulo');
        const btnLimpiarFiltrosRoles = document.getElementById('btnLimpiarFiltrosRoles');
        const contadorRoles = document.getElementById('contadorRoles');

        const tbodyRoles = tablaRoles.querySelector('tbody');
        const filasRoles = Array.from(tablaRoles.querySelectorAll('.rol-row'));
        const totalFilasRoles = filasRoles.length;

        const ordenOriginalRoles = filasRoles.slice();

        if (contadorRoles) contadorRoles.textContent = totalFilasRoles;

        // Normaliza texto para comparaciones sin acentos ni mayúsculas
        function normalizar(texto) {
            return String(texto || '')
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        // El score premia coincidencias por Código y Nombre
        function calcularScoreRol(terminos, codigo, nombre) {
            if (terminos.length === 0) return 0;

            let score = 0;

            for (let i = 0; i < terminos.length; i++) {
                const termino = terminos[i];
                if (!termino) continue;

                const coincideCodigo = codigo.startsWith(termino);
                const coincideNombre = nombre.startsWith(termino);

                if (!coincideCodigo && !coincideNombre) return -1;

                const pesoTermino = terminos.length - i;
                if (coincideCodigo) {
                    score += 10 * pesoTermino;
                } else if (coincideNombre) {
                    score += 5 * pesoTermino;
                }
            }

            return score;
        }

        // Reordena las filas en el DOM
        function reordenarDomRoles(lista) {
            lista.forEach(function (fila) {
                tbodyRoles.appendChild(fila);
            });
        }

        // Restaura el orden original
        function restaurarOrdenOriginalRoles() {
            reordenarDomRoles(ordenOriginalRoles);
        }

        // Aplica filtros y orden por relevancia
        function aplicarFiltrosRoles() {
            const busquedaRaw = normalizar(filtroRolesBuscar.value);
            const terminos = busquedaRaw ? busquedaRaw.split(/\s+/).filter(Boolean) : [];

            const tipo = filtroRolesTipo.value;
            const modulo = filtroRolesModulo.value;

            let visibles = 0;

            const datos = filasRoles.map(function (fila) {
                const codigo = normalizar(fila.getAttribute('data-codigo') || '');
                const nombre = normalizar(fila.getAttribute('data-nombre') || '');
                const filaTipo = fila.getAttribute('data-tipo') || '';
                const filaModulo = fila.getAttribute('data-modulo') || '';

                const score = calcularScoreRol(terminos, codigo, nombre);

                const coincideTipo = !tipo || filaTipo === tipo;
                const coincideModulo = !modulo || filaModulo === modulo;

                const visible = score >= 0 && coincideTipo && coincideModulo;

                if (visible) visibles++;

                return {
                    fila: fila,
                    visible: visible,
                    score: score,
                    nombreOrden: normalizar(fila.getAttribute('data-codigo') || '')
                };
            });

            datos.forEach(function (d) {
                if (d.visible) d.fila.classList.remove('d-none');
                else d.fila.classList.add('d-none');
            });

            const visiblesOrdenadas = datos
                .filter(d => d.visible)
                .sort(function (a, b) {
                    if (b.score !== a.score) return b.score - a.score;
                    return a.nombreOrden.localeCompare(b.nombreOrden);
                });

            const noVisibles = datos.filter(d => !d.visible);

            reordenarDomRoles(visiblesOrdenadas.map(d => d.fila).concat(noVisibles.map(d => d.fila)));

            if (contadorRoles) contadorRoles.textContent = visibles;
        }

        if (filtroRolesBuscar) filtroRolesBuscar.addEventListener('input', aplicarFiltrosRoles);
        if (filtroRolesTipo) filtroRolesTipo.addEventListener('change', aplicarFiltrosRoles);
        if (filtroRolesModulo) filtroRolesModulo.addEventListener('change', aplicarFiltrosRoles);

        if (btnLimpiarFiltrosRoles) {
            btnLimpiarFiltrosRoles.addEventListener('click', function () {
                if (filtroRolesBuscar) filtroRolesBuscar.value = '';
                if (filtroRolesTipo) filtroRolesTipo.value = '';
                if (filtroRolesModulo) filtroRolesModulo.value = '';

                restaurarOrdenOriginalRoles();
                aplicarFiltrosRoles();
            });
        }

        aplicarFiltrosRoles();
    }

    // =============================================
    // ADMIN ROLES: modal Crear/Editar Rol
    // =============================================
    const btnGuardarRol = document.getElementById('btnGuardarRol');
    const modalCrearRolEl = document.getElementById('modalCrearRol');
    const toastCambiosGuardadosRolEl = document.getElementById('toastCambiosGuardados');

    if (modalCrearRolEl) {
        const modalCrearRolTitulo = document.getElementById('modalCrearRolTitulo');
        let filaRolEditando = null;

        // ---------- Helpers ----------
        function getCheckboxesArbol() {
            return modalCrearRolEl.querySelectorAll('#arbolPermisos input[type="checkbox"]');
        }

        function limpiarArbol() {
            getCheckboxesArbol().forEach(function (cb) {
                cb.checked = false;
                cb.indeterminate = false;
            });
        }

        function marcarPermisos(idsPermisos) {
            limpiarArbol();
            if (!idsPermisos) return;

            const ids = idsPermisos.split(/\s+/).filter(Boolean);
            ids.forEach(function (id) {
                const cb = document.getElementById(id);
                if (cb) cb.checked = true;
            });

            // Recalcular estados intermedios (padres)
            getCheckboxesArbol().forEach(function (cb) {
                if (cb.checked && typeof actualizarPadres === 'function') {
                    actualizarPadres(cb);
                }
            });
        }

        function obtenerPermisosSeleccionados() {
            const ids = [];
            getCheckboxesArbol().forEach(function (cb) {
                if (cb.checked) ids.push(cb.id);
            });
            return ids;
        }

        // ---------- Al abrir el modal: crear o editar ----------
        modalCrearRolEl.addEventListener('show.bs.modal', function (event) {
            const trigger = event.relatedTarget;

            const inputNombre = document.getElementById('rolNombre');
            const inputDescripcion = document.getElementById('rolDescripcion');

            // Resetear campos
            inputNombre.value = '';
            inputNombre.classList.remove('is-invalid');
            inputDescripcion.value = '';

            limpiarArbol();

            // ---------- Modo CREAR ----------
            if (!trigger || !trigger.classList.contains('btn-editar-rol')) {
                filaRolEditando = null;

                if (modalCrearRolTitulo) {
                    modalCrearRolTitulo.innerHTML = '<i class="bi bi-plus-circle"></i> Crear Rol';
                }
                return;
            }

            // ---------- Modo EDITAR ----------
            filaRolEditando = trigger.closest('.rol-row');
            if (!filaRolEditando) return;

            const nombre = filaRolEditando.getAttribute('data-nombre') || '';
            const descripcion = filaRolEditando.getAttribute('data-descripcion') || '';
            const permisos = filaRolEditando.getAttribute('data-permisos') || '';

            inputNombre.value = nombre;
            inputDescripcion.value = descripcion === '—' ? '' : descripcion;

            if (modalCrearRolTitulo) {
                modalCrearRolTitulo.innerHTML = '<i class="bi bi-pencil"></i> Editar Rol';
            }

            marcarPermisos(permisos);
        });

        // ---------- Guardar ----------
        if (btnGuardarRol) {
            btnGuardarRol.addEventListener('click', function () {
                const inputNombre = document.getElementById('rolNombre');
                const inputDescripcion = document.getElementById('rolDescripcion');

                const nombre = inputNombre.value.trim();
                const descripcion = inputDescripcion.value.trim();

                if (!nombre) {
                    inputNombre.classList.add('is-invalid');
                    inputNombre.focus();
                    return;
                }
                inputNombre.classList.remove('is-invalid');

                // Permisos seleccionados
                const permisos = obtenerPermisosSeleccionados();

                // ¿Tiene algún permiso de "Salidas de Material"?
                const tienePermisosSalidas = permisos.some(function (id) {
                    return id.startsWith('p-salidas');
                });

                // ¿Puede aprobar? → cualquiera de las 4 casillas de aprobación/rechazo
                const puedeAprobar = permisos.includes('p-salidas-aprobar')   ||
                                    permisos.includes('p-salidas-rechazar')  ||
                                    permisos.includes('p-acceso-aprobar')    ||
                                    permisos.includes('p-acceso-rechazar');

                // Tipo y Módulo según la regla automática
                const tipoRol = tienePermisosSalidas ? 'local' : 'global';
                const moduloTexto = tienePermisosSalidas ? 'Salidas de Material' : '—';

                const tablaRoles = document.getElementById('tablaRoles');
                if (!tablaRoles) return;
                const tbody = tablaRoles.querySelector('tbody');

                const tipoBadge = tipoRol === 'local'
                    ? '<span class="badge bg-info">📦 Local</span>'
                    : '<span class="badge" style="background-color: var(--cora-accent);">🌐 Global</span>';

                const aprobarBadge = puedeAprobar
                    ? '<span class="badge bg-success">Sí</span>'
                    : '<span class="badge bg-secondary">No</span>';

                const origenBadge = '<span class="badge bg-secondary">Personalizado</span>';
                const permisosStr = permisos.join(' ');

                if (filaRolEditando) {
                    // ===== ACTUALIZAR =====
                    const celdas = filaRolEditando.querySelectorAll('td');
                    celdas[0].textContent = nombre;
                    celdas[1].textContent = descripcion || '—';
                    celdas[2].innerHTML = tipoBadge;
                    celdas[3].textContent = moduloTexto;
                    celdas[4].innerHTML = aprobarBadge;

                    filaRolEditando.setAttribute('data-nombre', nombre);
                    filaRolEditando.setAttribute('data-descripcion', descripcion);
                    filaRolEditando.setAttribute('data-tipo', tipoRol);
                    filaRolEditando.setAttribute('data-modulo', tienePermisosSalidas ? 'salidas' : '');
                    filaRolEditando.setAttribute('data-permisos', permisosStr);

                } else {
                    // ===== CREAR =====
                    const codigo = nombre.replace(/\s+/g, '');

                    const existe = Array.from(tbody.querySelectorAll('.rol-row'))
                        .some(function (f) {
                            return (f.getAttribute('data-codigo') || '').toLowerCase() === codigo.toLowerCase();
                        });
                    if (existe) {
                        alert('Ya existe un rol con ese nombre.');
                        return;
                    }

                    const fila = document.createElement('tr');
                    fila.className = 'rol-row';
                    fila.setAttribute('data-codigo', codigo);
                    fila.setAttribute('data-nombre', nombre);
                    fila.setAttribute('data-descripcion', descripcion);
                    fila.setAttribute('data-tipo', tipoRol);
                    fila.setAttribute('data-modulo', tienePermisosSalidas ? 'salidas' : '');
                    fila.setAttribute('data-origen', 'personalizado');
                    fila.setAttribute('data-estado', 'activo');
                    fila.setAttribute('data-permisos', permisosStr);

                    fila.innerHTML =
                        '<td>' + nombre + '</td>' +
                        '<td>' + (descripcion || '—') + '</td>' +
                        '<td>' + tipoBadge + '</td>' +
                        '<td>' + moduloTexto + '</td>' +
                        '<td>' + aprobarBadge + '</td>' +
                        '<td>' + origenBadge + '</td>' +
                        '<td><span class="badge bg-success">Activo</span></td>' +
                        '<td class="text-center">' +
                            '<button class="btn btn-sm btn-outline-info btn-editar-rol" title="Editar" ' +
                                'data-bs-toggle="modal" data-bs-target="#modalCrearRol">' +
                                '<i class="bi bi-pencil"></i>' +
                            '</button> ' +
                            '<button class="btn btn-sm btn-outline-primary btn-toggle-estado-rol" ' +
                                'title="Desactivar" data-accion="desactivar">' +
                                '<i class="bi bi-power"></i>' +
                            '</button>' +
                        '</td>';

                    tbody.appendChild(fila);
                }

                // Cerrar modal
                const instance = bootstrap.Modal.getInstance(modalCrearRolEl);
                if (instance) instance.hide();

                // Refrescar filtros si existen
                const filtroRolesBuscar = document.getElementById('filtroRolesBuscar');
                if (filtroRolesBuscar) filtroRolesBuscar.dispatchEvent(new Event('input'));

                // Toast
                modalCrearRolEl.addEventListener('hidden.bs.modal', function handler() {
                    if (toastCambiosGuardadosRolEl) {
                        const toast = new bootstrap.Toast(toastCambiosGuardadosRolEl);
                        toast.show();
                    }
                    modalCrearRolEl.removeEventListener('hidden.bs.modal', handler);
                });

                filaRolEditando = null;
            });
        }
    }

    // =============================================
    // ADMIN ROLES: botones Activar/Desactivar + toasts
    // =============================================
    const tablaRolesParaToggle = document.getElementById('tablaRoles');

    if (tablaRolesParaToggle) {
        const toastRolActivadoEl = document.getElementById('toastRolActivado');
        const toastRolDesactivadoEl = document.getElementById('toastRolDesactivado');

        tablaRolesParaToggle.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-toggle-estado-rol');
            if (!btn) return;

            const fila = btn.closest('.rol-row');
            if (!fila) return;

            const accion = btn.getAttribute('data-accion');
            const badgeEstado = fila.querySelector('td:nth-child(7) .badge');

            if (accion === 'desactivar') {
                fila.setAttribute('data-estado', 'inactivo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Inactivo';
                    badgeEstado.classList.remove('bg-success');
                    badgeEstado.classList.add('bg-danger');
                }

                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-outline-success');
                btn.setAttribute('title', 'Activar');
                btn.setAttribute('data-accion', 'activar');

                if (toastRolDesactivadoEl) {
                    const toast = new bootstrap.Toast(toastRolDesactivadoEl);
                    toast.show();
                }

            } else if (accion === 'activar') {
                fila.setAttribute('data-estado', 'activo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Activo';
                    badgeEstado.classList.remove('bg-danger');
                    badgeEstado.classList.add('bg-success');
                }

                btn.classList.remove('btn-outline-success');
                btn.classList.add('btn-outline-primary');
                btn.setAttribute('title', 'Desactivar');
                btn.setAttribute('data-accion', 'desactivar');

                if (toastRolActivadoEl) {
                    const toast = new bootstrap.Toast(toastRolActivadoEl);
                    toast.show();
                }
            }
        });
    }

    // =============================================
    // ADMIN USUARIOS: filtros en tiempo real + orden por relevancia
    // =============================================
    const tablaUsuarios = document.getElementById('tablaUsuarios');

    if (tablaUsuarios) {
        const filtroBuscar = document.getElementById('filtroUsuariosBuscar');
        const filtroTipoRol = document.getElementById('filtroUsuariosTipoRol');
        const filtroRol = document.getElementById('filtroUsuariosRol');
        const filtroEstado = document.getElementById('filtroUsuariosEstado');
        const btnLimpiarFiltrosUsuarios = document.getElementById('btnLimpiarFiltrosUsuarios');

        const contadorUsuarios = document.getElementById('contadorUsuarios');

        const tbodyUsuarios = tablaUsuarios.querySelector('tbody');
        const filas = Array.from(tablaUsuarios.querySelectorAll('.usuario-row'));
        const totalFilas = filas.length;

        const ordenOriginal = filas.slice();

        if (contadorUsuarios) contadorUsuarios.textContent = totalFilas;

        function normalizar(texto) {
            return String(texto || '')
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        function palabrasDe(nombreCompleto) {
            return normalizar(nombreCompleto)
                .split(/\s+/)
                .filter(Boolean);
        }

        function calcularScore(terminos, palabras) {
            if (terminos.length === 0) return 0;

            const nombre = palabras[0] || '';
            const apellidos = palabras.slice(1);

            let score = 0;

            for (let i = 0; i < terminos.length; i++) {
                const termino = terminos[i];
                if (!termino) continue;

                const coincideNombre = nombre.startsWith(termino);
                const coincideApellido = apellidos.some(function (ap) {
                    return ap.startsWith(termino);
                });

                if (!coincideNombre && !coincideApellido) return -1;

                const pesoTermino = terminos.length - i;
                if (coincideNombre) {
                    score += 10 * pesoTermino;
                } else if (coincideApellido) {
                    score += 5 * pesoTermino;
                }
            }

            return score;
        }

        function reordenarDom(listaOrdenada) {
            listaOrdenada.forEach(function (fila) {
                tbodyUsuarios.appendChild(fila);
            });
        }

        function restaurarOrdenOriginal() {
            reordenarDom(ordenOriginal);
        }

        // Aplica filtros por nombre, tipo de rol, rol y estado
        function aplicarFiltrosUsuarios() {
            const busquedaRaw = normalizar(filtroBuscar.value);
            const terminos = busquedaRaw ? busquedaRaw.split(/\s+/).filter(Boolean) : [];

            const tipoRol = filtroTipoRol.value;
            const rol = filtroRol.value;
            const estado = filtroEstado.value;

            let visibles = 0;

            const datos = filas.map(function (fila) {
                const nombreAttr = fila.getAttribute('data-nombre') || '';
                const palabras = palabrasDe(nombreAttr);
                const filaTipoRol = fila.getAttribute('data-tiporol') || '';
                const filaRoles = fila.getAttribute('data-roles') || '';
                const filaEstado = fila.getAttribute('data-estado') || '';

                const score = calcularScore(terminos, palabras);

                const coincideTipoRol = !tipoRol || filaTipoRol === tipoRol;
                const coincideRol = !rol || filaRoles.split(' ').includes(rol);
                const coincideEstado = !estado || filaEstado === estado;

                const visible = score >= 0 && coincideTipoRol && coincideRol && coincideEstado;

                if (visible) visibles++;

                return {
                    fila: fila,
                    visible: visible,
                    score: score,
                    nombreOrden: normalizar(nombreAttr)
                };
            });

            datos.forEach(function (d) {
                if (d.visible) {
                    d.fila.classList.remove('d-none');
                } else {
                    d.fila.classList.add('d-none');
                }
            });

            const visiblesOrdenadas = datos
                .filter(d => d.visible)
                .sort(function (a, b) {
                    if (b.score !== a.score) return b.score - a.score;
                    return a.nombreOrden.localeCompare(b.nombreOrden);
                });

            const noVisibles = datos.filter(d => !d.visible);

            reordenarDom(visiblesOrdenadas.map(d => d.fila).concat(noVisibles.map(d => d.fila)));

            if (contadorUsuarios) contadorUsuarios.textContent = visibles;
        }

        if (filtroBuscar) filtroBuscar.addEventListener('input', aplicarFiltrosUsuarios);
        if (filtroTipoRol) filtroTipoRol.addEventListener('change', aplicarFiltrosUsuarios);
        if (filtroRol) filtroRol.addEventListener('change', aplicarFiltrosUsuarios);
        if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltrosUsuarios);

        if (btnLimpiarFiltrosUsuarios) {
            btnLimpiarFiltrosUsuarios.addEventListener('click', function () {
                if (filtroBuscar) filtroBuscar.value = '';
                if (filtroTipoRol) filtroTipoRol.value = '';
                if (filtroRol) filtroRol.value = '';
                if (filtroEstado) filtroEstado.value = '';

                restaurarOrdenOriginal();
                aplicarFiltrosUsuarios();
            });
        }

        // Exponer para que el modal de accesos pueda refrescar
        window.aplicarFiltrosUsuarios = aplicarFiltrosUsuarios;

        aplicarFiltrosUsuarios();
    }

    // =============================================
    // MODAL ACCESOS: secciones dinámicas + guardar cambios reales
    // =============================================
    const modalAccesosEl = document.getElementById('modalAccesos');

    if (modalAccesosEl) {
        const selectRolGlobal = document.getElementById('selectRolGlobal');
        const seccionRolesGlobales = document.getElementById('seccionRolesGlobales');
        const seccionSalidasMateriales = document.getElementById('seccionSalidasMateriales');
        const seccionSinRol = document.getElementById('seccionSinRol');
        const btnGuardarAccesos = document.getElementById('btnGuardarAccesos');
        const toastCambiosGuardadosEl = document.getElementById('toastCambiosGuardados');

        // Checkboxes internos del modal
        const rolAdmin = document.getElementById('rolAdmin');
        const rolGen = document.getElementById('rolGen');
        const rolApro = document.getElementById('rolApro');

        // Fila que se está editando actualmente
        let filaEnEdicion = null;

        // ---------- Utilidades ----------
        function setChecked(el, valor) {
            if (el) el.checked = !!valor;
        }

        // ---------- Mostrar/ocultar secciones según el tipo de rol ----------
        function actualizarSeccionesAccesos() {
            const valor = selectRolGlobal.value;

            seccionRolesGlobales.classList.add('d-none');
            seccionSalidasMateriales.classList.add('d-none');
            seccionSinRol.classList.add('d-none');

            if (valor === 'global') {
                seccionRolesGlobales.classList.remove('d-none');
            } else if (valor === 'local') {
                seccionSalidasMateriales.classList.remove('d-none');
            } else {
                seccionSinRol.classList.remove('d-none');
            }
        }

        if (selectRolGlobal) {
            selectRolGlobal.addEventListener('change', actualizarSeccionesAccesos);
        }

        // ---------- Cargar datos del usuario al abrir el modal ----------
        document.querySelectorAll('[data-bs-target="#modalAccesos"]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const fila = btn.closest('.usuario-row');
                if (!fila) return;

                filaEnEdicion = fila;

                const tipoRol = fila.getAttribute('data-tiporol') || '';
                const rolesStr = fila.getAttribute('data-roles') || '';
                const rolesArr = rolesStr.split(' ').filter(Boolean);

                // Reset del select y de todos los checkboxes
                if (selectRolGlobal) selectRolGlobal.value = tipoRol;
                setChecked(rolAdmin, false);
                setChecked(rolGen, false);
                setChecked(rolApro, false);

                // Marcar los que aplican según los roles del usuario
                if (tipoRol === 'global') {
                    setChecked(rolAdmin, rolesArr.includes('administrador'));
                } else if (tipoRol === 'local') {
                    setChecked(rolGen, rolesArr.includes('generador'));
                    setChecked(rolApro, rolesArr.includes('aprobador'));
                }

                actualizarSeccionesAccesos();
            });
        });

        // Al cerrar el modal limpiar la referencia
        modalAccesosEl.addEventListener('hidden.bs.modal', function () {
            filaEnEdicion = null;
        });

        // ---------- Guardar: aplicar cambios a la fila ----------
        if (btnGuardarAccesos) {
            btnGuardarAccesos.addEventListener('click', function () {
                if (!filaEnEdicion) {
                    const instance = bootstrap.Modal.getInstance(modalAccesosEl);
                    if (instance) instance.hide();
                    return;
                }

                let tipoRol = selectRolGlobal.value;
                let roles = [];

                if (tipoRol === 'global') {
                    if (rolAdmin && rolAdmin.checked) roles.push('administrador');
                } else if (tipoRol === 'local') {
                    if (rolGen && rolGen.checked) roles.push('generador');
                    if (rolApro && rolApro.checked) roles.push('aprobador');
                }

                // Si no queda ningún rol marcado, pasa a "Sin rol"
                if (roles.length === 0) {
                    tipoRol = '';
                    roles = [];
                }

                // Actualizar atributos de la fila
                filaEnEdicion.setAttribute('data-tiporol', tipoRol);
                filaEnEdicion.setAttribute('data-roles', roles.join(' '));

                // Actualizar badges en la tabla
                actualizarBadgesFilaUsuario(filaEnEdicion, tipoRol, roles);

                // Cerrar modal
                const instance = bootstrap.Modal.getInstance(modalAccesosEl);
                if (instance) instance.hide();

                // Refrescar filtros/orden
                if (typeof window.aplicarFiltrosUsuarios === 'function') {
                    window.aplicarFiltrosUsuarios();
                } else {
                    const filtroBuscar = document.getElementById('filtroUsuariosBuscar');
                    if (filtroBuscar) filtroBuscar.dispatchEvent(new Event('input'));
                }

                // Toast
                modalAccesosEl.addEventListener('hidden.bs.modal', function handler() {
                    if (toastCambiosGuardadosEl) {
                        const toast = new bootstrap.Toast(toastCambiosGuardadosEl);
                        toast.show();
                    }
                    modalAccesosEl.removeEventListener('hidden.bs.modal', handler);
                });
            });
        }
    }

    // =============================================
    // Helper: actualizar badges de una fila de usuario
    // =============================================
    function actualizarBadgesFilaUsuario(fila, tipoRol, roles) {
        const celdas = fila.querySelectorAll('td');
        if (celdas.length < 6) return;

        const celdaTipoRol = celdas[3];
        const celdaRoles = celdas[4];

        // --- Tipo Rol ---
        let badgeTipo = '';
        if (tipoRol === 'global') {
            badgeTipo = '<span class="badge bg-primary">Global</span>';
        } else if (tipoRol === 'local') {
            badgeTipo = '<span class="badge bg-info">Local</span>';
        } else {
            badgeTipo = '<span class="badge bg-secondary">Sin rol</span>';
        }
        celdaTipoRol.innerHTML = badgeTipo;

        // --- Rol Asignado ---
        if (roles.length === 0) {
            celdaRoles.innerHTML = '—';
        } else {
            const badges = roles.map(function (r) {
                if (r === 'administrador') return '<span class="badge bg-primary">Administrador</span>';
                if (r === 'generador')     return '<span class="badge bg-info">Generador de Salidas</span>';
                if (r === 'aprobador')     return '<span class="badge bg-warning">Aprobador de Salidas</span>';
                return '';
            }).join(' ');
            celdaRoles.innerHTML = badges;
        }
    }

    // =============================================
    // ADMIN USUARIOS: botones Activar/Desactivar + toasts
    // =============================================
    const tablaUsuariosParaToggle = document.getElementById('tablaUsuarios');

    if (tablaUsuariosParaToggle) {
        const toastUsuarioActivadoEl = document.getElementById('toastUsuarioActivado');
        const toastUsuarioDesactivadoEl = document.getElementById('toastUsuarioDesactivado');

        tablaUsuariosParaToggle.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-toggle-estado-usuario');
            if (!btn) return;

            const fila = btn.closest('.usuario-row');
            if (!fila) return;

            const accion = btn.getAttribute('data-accion');
            const badgeEstado = fila.querySelector('td:nth-child(6) .badge');

            if (accion === 'desactivar') {
                fila.setAttribute('data-estado', 'inactivo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Inactivo';
                    badgeEstado.classList.remove('bg-success');
                    badgeEstado.classList.add('bg-danger');
                }

                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-outline-success');
                btn.setAttribute('title', 'Activar');
                btn.setAttribute('data-accion', 'activar');

                if (toastUsuarioDesactivadoEl) {
                    const toast = new bootstrap.Toast(toastUsuarioDesactivadoEl);
                    toast.show();
                }

            } else if (accion === 'activar') {
                fila.setAttribute('data-estado', 'activo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Activo';
                    badgeEstado.classList.remove('bg-danger');
                    badgeEstado.classList.add('bg-success');
                }

                btn.classList.remove('btn-outline-success');
                btn.classList.add('btn-outline-primary');
                btn.setAttribute('title', 'Desactivar');
                btn.setAttribute('data-accion', 'desactivar');

                if (toastUsuarioActivadoEl) {
                    const toast = new bootstrap.Toast(toastUsuarioActivadoEl);
                    toast.show();
                }
            }
        });
    }

    // =============================================
    // EXPORTAR CSV: listener genérico y reutilizable
    // Detecta botones con [data-tabla] o .btn-exportar-csv
    // =============================================
    document.querySelectorAll('[data-tabla], .btn-exportar-csv').forEach(function (btn) {
        if (btn.id === 'btnExportarSalidas') return;
        if (btn.dataset.exportListener === 'true') return;
        btn.dataset.exportListener = 'true';

        btn.addEventListener('click', function () {
            // Prioridad: data-tabla → data-target → tabla cercana
            let selector = btn.getAttribute('data-tabla') || btn.getAttribute('data-target');

            if (!selector) {
                const card = btn.closest('.card');
                const tablaCercana = card ? card.querySelector('table') : null;
                if (tablaCercana) {
                    if (!tablaCercana.id) {
                        tablaCercana.id = 'tabla-auto-' + Date.now();
                    }
                    selector = '#' + tablaCercana.id;
                }
            }

            if (!selector) {
                console.warn('Botón de exportar sin tabla asociada');
                return;
            }

            // Nombre del archivo
            const nombre = btn.getAttribute('data-nombre') ||
                        btn.getAttribute('data-filename') ||
                        'exportacion';

            // Columnas a omitir (o "auto" para detección)
            const omitirAttr = btn.getAttribute('data-omitir-columnas');
            let omitirColumnas = [];

            if (omitirAttr === 'auto') {
                const tabla = document.querySelector(selector);
                if (tabla) {
                    tabla.querySelectorAll('thead th').forEach(function (th, i) {
                        const texto = (th.textContent || '').trim().toLowerCase();
                        if (texto === '' || texto === 'acciones' || texto === 'acción' || texto === 'selección' || texto === 'sel.') {
                            omitirColumnas.push(i);
                        }
                    });
                }
            } else if (omitirAttr) {
                omitirColumnas = omitirAttr.split(',').map(function (n) {
                    return parseInt(n.trim(), 10);
                }).filter(function (n) {
                    return !isNaN(n);
                });
            }

            exportarTablaACSV(selector, nombre, {
                omitirColumnas: omitirColumnas,
                incluirOcultas: false
            });
        });
    });

    // =============================================
    // ADMIN MÓDULOS: recargar + toggle estado + Module.json
    // =============================================
    const listaModulos = document.getElementById('listaModulos');

    if (listaModulos) {

        // ---------- Botón "Recargar Módulos" ----------
        const btnRecargarModulos = document.getElementById('btnRecargarModulos');
        const toastModulosRecargadosEl = document.getElementById('toastModulosRecargados');

        if (btnRecargarModulos) {
            btnRecargarModulos.addEventListener('click', function () {
                const colModuloEjemplo3 = document.getElementById('colModuloEjemplo3');

                // Mostrar el Módulo Ejemplo 3 solo si estaba oculto
                if (colModuloEjemplo3 && colModuloEjemplo3.classList.contains('d-none')) {
                    setTimeout(function () {
                        colModuloEjemplo3.classList.remove('d-none');
                        colModuloEjemplo3.style.animation = 'fadeIn 0.4s ease-in';

                        const card = colModuloEjemplo3.querySelector('.modulo-card');
                        if (card) {
                            card.style.transition = 'box-shadow 0.4s ease, border-color 0.4s ease';
                            card.style.boxShadow = '0 0 0 3px rgba(74, 139, 92, 0.4)';
                            card.style.borderColor = 'var(--cora-success)';

                            setTimeout(function () {
                                card.style.boxShadow = '';
                                card.style.borderColor = '';
                            }, 1200);
                        }

                        setTimeout(function () {
                            colModuloEjemplo3.style.animation = '';
                        }, 500);
                    }, 300);
                }

                if (toastModulosRecargadosEl) {
                    const toast = new bootstrap.Toast(toastModulosRecargadosEl);
                    toast.show();
                }
            });
        }

        // ---------- Botones "Habilitar/Deshabilitar" ----------
        const toastModuloHabilitadoEl = document.getElementById('toastModuloHabilitado');
        const toastModuloDeshabilitadoEl = document.getElementById('toastModuloDeshabilitado');

        listaModulos.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-toggle-estado-modulo');
            if (!btn) return;

            const card = btn.closest('.modulo-card');
            if (!card) return;

            const accion = btn.getAttribute('data-accion');
            const badgeEstado = card.querySelector('.badge-estado');

            if (accion === 'deshabilitar') {
                card.setAttribute('data-estado', 'inactivo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Inactivo';
                    badgeEstado.classList.remove('bg-success');
                    badgeEstado.classList.add('bg-danger');
                }

                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-outline-success');
                btn.setAttribute('title', 'Habilitar');
                btn.setAttribute('data-accion', 'habilitar');

                if (toastModuloDeshabilitadoEl) {
                    const toast = new bootstrap.Toast(toastModuloDeshabilitadoEl);
                    toast.show();
                }

            } else if (accion === 'habilitar') {
                card.setAttribute('data-estado', 'activo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Activo';
                    badgeEstado.classList.remove('bg-danger');
                    badgeEstado.classList.add('bg-success');
                }

                btn.classList.remove('btn-outline-success');
                btn.classList.add('btn-outline-primary');
                btn.setAttribute('title', 'Deshabilitar');
                btn.setAttribute('data-accion', 'deshabilitar');

                if (toastModuloHabilitadoEl) {
                    const toast = new bootstrap.Toast(toastModuloHabilitadoEl);
                    toast.show();
                }
            }
        });

        // ---------- Botones "Ver Module.json" (descarga) ----------
        listaModulos.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-module-json');
            if (!btn) return;

            const codigo = btn.getAttribute('data-codigo') || 'Module';

            const contenido = JSON.stringify({
                nombre: 'Hola Mundo',
                codigo: codigo
            }, null, 2);

            const blob = new Blob([contenido], { type: 'application/json;charset=utf-8;' });
            const url = URL.createObjectURL(blob);

            const enlace = document.createElement('a');
            enlace.href = url;
            enlace.download = 'Module.json';
            enlace.style.display = 'none';
            document.body.appendChild(enlace);
            enlace.click();
            document.body.removeChild(enlace);
            URL.revokeObjectURL(url);
        });
    }

    // =============================================
    // ADMIN EMPRESAS: filtros + toggle + toasts
    // =============================================
    const tablaEmpresas = document.getElementById('tablaEmpresas');

    if (tablaEmpresas) {
        const filtroEmpresasNombre = document.getElementById('filtroEmpresasNombre');
        const filtroEmpresasContacto = document.getElementById('filtroEmpresasContacto');
        const filtroEmpresasTipo = document.getElementById('filtroEmpresasTipo');
        const filtroEmpresasEstado = document.getElementById('filtroEmpresasEstado');
        const btnLimpiarFiltrosEmpresas = document.getElementById('btnLimpiarFiltrosEmpresas');
        const contadorEmpresas = document.getElementById('contadorEmpresas');

        const tbodyEmpresas = tablaEmpresas.querySelector('tbody');
        const filasEmpresas = Array.from(tablaEmpresas.querySelectorAll('.empresa-row'));
        const totalFilasEmpresas = filasEmpresas.length;

        const ordenOriginalEmpresas = filasEmpresas.slice();

        if (contadorEmpresas) contadorEmpresas.textContent = totalFilasEmpresas;

        // ---------- Utilidades ----------
        function normalizarEmp(texto) {
            return String(texto || '')
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        function reordenarDomEmpresas(lista) {
            lista.forEach(function (fila) {
                tbodyEmpresas.appendChild(fila);
            });
        }

        function restaurarOrdenOriginalEmpresas() {
            reordenarDomEmpresas(ordenOriginalEmpresas);
        }

        // ---------- Filtros ----------
        function aplicarFiltrosEmpresas() {
            const busquedaNombre = normalizarEmp(filtroEmpresasNombre.value);
            const terminosNombre = busquedaNombre ? busquedaNombre.split(/\s+/).filter(Boolean) : [];

            const busquedaContacto = normalizarEmp(filtroEmpresasContacto.value);
            const terminosContacto = busquedaContacto ? busquedaContacto.split(/\s+/).filter(Boolean) : [];

            const tipo = filtroEmpresasTipo.value;
            const estado = filtroEmpresasEstado.value;

            let visibles = 0;

            const datos = filasEmpresas.map(function (fila) {
                const nombre = normalizarEmp(fila.getAttribute('data-nombre') || '');
                const contacto = normalizarEmp(fila.getAttribute('data-contacto') || '');
                const filaTipo = fila.getAttribute('data-tipo') || '';
                const filaEstado = fila.getAttribute('data-estado') || '';

                // Búsqueda por EMPRESA: cada término debe ser prefijo de alguna palabra
                const palabrasNombre = nombre.split(/\s+/).filter(Boolean);
                const coincideNombre = terminosNombre.every(function (t) {
                    return palabrasNombre.some(function (p) { return p.startsWith(t); });
                });

                // Búsqueda por CONTACTO
                const palabrasContacto = contacto.split(/\s+/).filter(Boolean);
                const coincideContacto = terminosContacto.every(function (t) {
                    return palabrasContacto.some(function (p) { return p.startsWith(t); });
                });

                const coincideTipo = !tipo || filaTipo === tipo;
                const coincideEstado = !estado || filaEstado === estado;

                const visible = coincideNombre && coincideContacto && coincideTipo && coincideEstado;

                if (visible) visibles++;

                return { fila: fila, visible: visible };
            });

            datos.forEach(function (d) {
                if (d.visible) d.fila.classList.remove('d-none');
                else d.fila.classList.add('d-none');
            });

            if (contadorEmpresas) contadorEmpresas.textContent = visibles;
        }

        if (filtroEmpresasNombre) filtroEmpresasNombre.addEventListener('input', aplicarFiltrosEmpresas);
        if (filtroEmpresasContacto) filtroEmpresasContacto.addEventListener('input', aplicarFiltrosEmpresas);
        if (filtroEmpresasTipo) filtroEmpresasTipo.addEventListener('change', aplicarFiltrosEmpresas);
        if (filtroEmpresasEstado) filtroEmpresasEstado.addEventListener('change', aplicarFiltrosEmpresas);

        if (btnLimpiarFiltrosEmpresas) {
            btnLimpiarFiltrosEmpresas.addEventListener('click', function () {
                if (filtroEmpresasNombre) filtroEmpresasNombre.value = '';
                if (filtroEmpresasContacto) filtroEmpresasContacto.value = '';
                if (filtroEmpresasTipo) filtroEmpresasTipo.value = '';
                if (filtroEmpresasEstado) filtroEmpresasEstado.value = '';
                restaurarOrdenOriginalEmpresas();
                aplicarFiltrosEmpresas();
            });
        }

        // ---------- Toggle Activar/Desactivar Empresa ----------
        const toastEmpresaActivadaEl = document.getElementById('toastEmpresaActivada');
        const toastEmpresaDesactivadaEl = document.getElementById('toastEmpresaDesactivada');

        tablaEmpresas.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-toggle-estado-empresa');
            if (!btn) return;

            const fila = btn.closest('.empresa-row');
            if (!fila) return;

            const accion = btn.getAttribute('data-accion');
            const badgeEstado = fila.querySelector('.badge-estado');

            if (accion === 'desactivar') {
                fila.setAttribute('data-estado', 'inactivo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Inactivo';
                    badgeEstado.classList.remove('bg-success');
                    badgeEstado.classList.add('bg-danger');
                }

                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-outline-success');
                btn.setAttribute('title', 'Activar');
                btn.setAttribute('data-accion', 'activar');

                if (toastEmpresaDesactivadaEl) {
                    const toast = new bootstrap.Toast(toastEmpresaDesactivadaEl);
                    toast.show();
                }
                aplicarFiltrosEmpresas();

            } else if (accion === 'activar') {
                fila.setAttribute('data-estado', 'activo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Activo';
                    badgeEstado.classList.remove('bg-danger');
                    badgeEstado.classList.add('bg-success');
                }

                btn.classList.remove('btn-outline-success');
                btn.classList.add('btn-outline-primary');
                btn.setAttribute('title', 'Desactivar');
                btn.setAttribute('data-accion', 'desactivar');

                if (toastEmpresaActivadaEl) {
                    const toast = new bootstrap.Toast(toastEmpresaActivadaEl);
                    toast.show();
                }
                aplicarFiltrosEmpresas();
            }
        });

        aplicarFiltrosEmpresas();
    }

    // =============================================
    // ADMIN EMPRESAS: modal Nuevo Tipo → agregar a tabla + sincronizar selects
    // =============================================
    const btnGuardarNuevoTipo = document.getElementById('btnGuardarNuevoTipo');
    const toastCambiosGuardadosTipoEl = document.getElementById('toastCambiosGuardados');

    if (btnGuardarNuevoTipo && modalNuevoTipoEl) {
        btnGuardarNuevoTipo.addEventListener('click', function () {
            const inputNuevoTipo = document.getElementById('nuevoTipoNombre');
            if (!inputNuevoTipo) return;

            const nombreTipo = inputNuevoTipo.value.trim();

            // Limpiar feedback previo
            const fbPrevio = inputNuevoTipo.parentElement.querySelector('.invalid-feedback');
            if (fbPrevio) fbPrevio.remove();

            if (!nombreTipo) {
                inputNuevoTipo.classList.add('is-invalid');
                inputNuevoTipo.focus();
                return;
            }
            inputNuevoTipo.classList.remove('is-invalid');

            const tablaTipos = document.getElementById('tablaTiposEmpresa');
            if (!tablaTipos) return;

            const tbodyTipos = tablaTipos.querySelector('tbody');

            // Verificar duplicados
            const existe = Array.from(tbodyTipos.querySelectorAll('.tipo-empresa-row'))
                .some(f => (f.getAttribute('data-nombre') || '').toLowerCase() === nombreTipo.toLowerCase());

            if (existe) {
                inputNuevoTipo.classList.add('is-invalid');
                const fb = document.createElement('div');
                fb.className = 'invalid-feedback';
                fb.textContent = 'Ya existe un tipo con ese nombre.';
                inputNuevoTipo.insertAdjacentElement('afterend', fb);
                return;
            }

            // ---- 1. Agregar fila a la tabla de tipos ----
            const fila = document.createElement('tr');
            fila.className = 'tipo-empresa-row';
            fila.setAttribute('data-nombre', nombreTipo);
            fila.setAttribute('data-estado', 'activo');

            fila.innerHTML =
                '<td>' + nombreTipo + '</td>' +
                '<td><span class="badge bg-success badge-estado">Activo</span></td>' +
                '<td class="text-center">' +
                    '<button class="btn btn-sm btn-outline-info btn-editar-tipo" title="Editar">' +
                        '<i class="bi bi-pencil"></i>' +
                    '</button> ' +
                    '<button class="btn btn-sm btn-outline-primary btn-toggle-estado-tipo" ' +
                        'title="Desactivar" data-accion="desactivar">' +
                        '<i class="bi bi-power"></i>' +
                    '</button>' +
                '</td>';

            tbodyTipos.appendChild(fila);

            // ---- 2. Sincronizar ambos selects ----
            if (typeof window.swcoraSyncTiposEmpresa === 'function') {
                window.swcoraSyncTiposEmpresa(
                    document.getElementById('filtroEmpresasTipo').value,
                    document.getElementById('empresaTipo').value
                );
            }

            // ---- 3. Cerrar Nuevo Tipo y reabrir Tipos ----
            const instance = bootstrap.Modal.getInstance(modalNuevoTipoEl);
            if (instance) instance.hide();

            modalNuevoTipoEl.addEventListener('hidden.bs.modal', function handler() {
                if (toastCambiosGuardadosTipoEl) {
                    const toast = new bootstrap.Toast(toastCambiosGuardadosTipoEl);
                    toast.show();
                }

                if (modalTiposEmpresaEl) {
                    const modalTipos = new bootstrap.Modal(modalTiposEmpresaEl);
                    modalTipos.show();
                }

                modalNuevoTipoEl.removeEventListener('hidden.bs.modal', handler);
            });
        });
    }

    // =============================================
    // ADMIN EMPRESAS: modal Tipos → filtro + toggle + edición + sincronización
    // =============================================
    const tablaTiposEmpresa = document.getElementById('tablaTiposEmpresa');

    if (tablaTiposEmpresa) {
        const filtroTiposEmpresaBuscar = document.getElementById('filtroTiposEmpresaBuscar');
        const filasTipos = Array.from(tablaTiposEmpresa.querySelectorAll('.tipo-empresa-row'));

        function normalizarTipoEmp(texto) {
            return String(texto || '')
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        function aplicarFiltroTipos() {
            const busqueda = normalizarTipoEmp(filtroTiposEmpresaBuscar ? filtroTiposEmpresaBuscar.value : '');
            const terminos = busqueda ? busqueda.split(/\s+/).filter(Boolean) : [];

            filasTipos.forEach(function (fila) {
                const nombre = normalizarTipoEmp(fila.getAttribute('data-nombre') || '');
                const coincide = terminos.every(t => nombre.startsWith(t));
                fila.classList.toggle('d-none', !coincide);
            });
        }

        if (filtroTiposEmpresaBuscar) {
            filtroTiposEmpresaBuscar.addEventListener('input', aplicarFiltroTipos);
        }

        // Toasts
        const toastTipoActivadoEl = document.getElementById('toastTipoActivado');
        const toastTipoDesactivadoEl = document.getElementById('toastTipoDesactivado');

        // Renombra un tipo en TODAS las filas de #tablaEmpresas que lo usen
        function propagarRenombreTipo(nombreViejo, nombreNuevo) {
            if (nombreViejo === nombreNuevo) return;

            const tablaEmpresas = document.getElementById('tablaEmpresas');
            if (!tablaEmpresas) return;

            tablaEmpresas.querySelectorAll('.empresa-row').forEach(function (fila) {
                if (fila.getAttribute('data-tipo') === nombreViejo) {
                    fila.setAttribute('data-tipo', nombreNuevo);

                    const badge = fila.querySelector('td:nth-child(4) .badge');
                    if (badge) badge.textContent = nombreNuevo;

                    const btnEditar = fila.querySelector('.btn-editar-empresa');
                    if (btnEditar) btnEditar.setAttribute('data-tipo', nombreNuevo);
                }
            });
        }

        tablaTiposEmpresa.addEventListener('click', function (e) {
            const btnToggle = e.target.closest('.btn-toggle-estado-tipo');
            const btnEditar = e.target.closest('.btn-editar-tipo');

            // ---------- Toggle estado ----------
            if (btnToggle) {
                const fila = btnToggle.closest('.tipo-empresa-row');
                if (!fila) return;

                const accion = btnToggle.getAttribute('data-accion');
                const badgeEstado = fila.querySelector('.badge-estado');
                const nombreTipo = fila.getAttribute('data-nombre') || '';

                if (accion === 'desactivar') {
                    fila.setAttribute('data-estado', 'inactivo');

                    if (badgeEstado) {
                        badgeEstado.textContent = 'Inactivo';
                        badgeEstado.classList.remove('bg-success');
                        badgeEstado.classList.add('bg-danger');
                    }

                    btnToggle.classList.remove('btn-outline-primary');
                    btnToggle.classList.add('btn-outline-success');
                    btnToggle.setAttribute('title', 'Activar');
                    btnToggle.setAttribute('data-accion', 'activar');

                    if (toastTipoDesactivadoEl) {
                        const toast = new bootstrap.Toast(toastTipoDesactivadoEl);
                        toast.show();
                    }
                } else if (accion === 'activar') {
                    fila.setAttribute('data-estado', 'activo');

                    if (badgeEstado) {
                        badgeEstado.textContent = 'Activo';
                        badgeEstado.classList.remove('bg-danger');
                        badgeEstado.classList.add('bg-success');
                    }

                    btnToggle.classList.remove('btn-outline-success');
                    btnToggle.classList.add('btn-outline-primary');
                    btnToggle.setAttribute('title', 'Desactivar');
                    btnToggle.setAttribute('data-accion', 'desactivar');

                    if (toastTipoActivadoEl) {
                        const toast = new bootstrap.Toast(toastTipoActivadoEl);
                        toast.show();
                    }
                }

                // Sincronizar selects (el filtro mantiene su valor; el modal
                // debe excluir tipos inactivos)
                if (typeof window.swcoraSyncTiposEmpresa === 'function') {
                    window.swcoraSyncTiposEmpresa(
                        document.getElementById('filtroEmpresasTipo').value,
                        document.getElementById('empresaTipo').value
                    );
                }
                return;
            }

            // ---------- Editar (inline) ----------
            if (btnEditar) {
                const fila = btnEditar.closest('.tipo-empresa-row');
                if (!fila) return;

                const tdNombre = fila.querySelector('td:first-child');
                const nombreActual = tdNombre.textContent.trim();

                if (tdNombre.dataset.acabaDeGuardar === 'true') {
                    tdNombre.dataset.acabaDeGuardar = 'false';
                    return;
                }

                if (tdNombre.querySelector('input')) {
                    tdNombre.querySelector('input').focus();
                    return;
                }

                tdNombre.innerHTML =
                    '<input type="text" class="form-control form-control-sm" ' +
                    'style="max-width: 200px;" ' +
                    'value="' + nombreActual.replace(/"/g, '&quot;') + '">';

                const input = tdNombre.querySelector('input');
                input.focus();
                input.select();

                function guardarEdicion() {
                    const nuevoNombre = input.value.trim();

                    tdNombre.dataset.acabaDeGuardar = 'true';

                    if (!nuevoNombre) {
                        tdNombre.textContent = nombreActual;
                        setTimeout(function () { tdNombre.dataset.acabaDeGuardar = 'false'; }, 250);
                        return;
                    }

                    // Verificar duplicados
                    const tabla = document.getElementById('tablaTiposEmpresa');
                    const duplicado = Array.from(tabla.querySelectorAll('.tipo-empresa-row'))
                        .some(f => f !== fila &&
                            (f.getAttribute('data-nombre') || '').toLowerCase() === nuevoNombre.toLowerCase());

                    if (duplicado) {
                        alert('Ya existe un tipo con ese nombre.');
                        tdNombre.textContent = nombreActual;
                        setTimeout(function () { tdNombre.dataset.acabaDeGuardar = 'false'; }, 250);
                        return;
                    }

                    if (nuevoNombre !== nombreActual) {
                        tdNombre.textContent = nuevoNombre;
                        fila.setAttribute('data-nombre', nuevoNombre);

                        // Propagar el renombre a las empresas que lo usaban
                        propagarRenombreTipo(nombreActual, nuevoNombre);

                        // Sincronizar selects con el nuevo valor
                        if (typeof window.swcoraSyncTiposEmpresa === 'function') {
                            const valorFiltro = document.getElementById('filtroEmpresasTipo').value === nombreActual
                                ? nuevoNombre
                                : document.getElementById('filtroEmpresasTipo').value;

                            const valorModal = document.getElementById('empresaTipo').value === nombreActual
                                ? nuevoNombre
                                : document.getElementById('empresaTipo').value;

                            window.swcoraSyncTiposEmpresa(valorFiltro, valorModal);
                        }

                        if (toastCambiosGuardadosTipoEl) {
                            const toast = new bootstrap.Toast(toastCambiosGuardadosTipoEl);
                            toast.show();
                        }
                    } else {
                        tdNombre.textContent = nombreActual;
                    }

                    setTimeout(function () {
                        tdNombre.dataset.acabaDeGuardar = 'false';
                    }, 250);
                }

                input.addEventListener('blur', guardarEdicion);
                input.addEventListener('keydown', function (ev) {
                    if (ev.key === 'Enter') {
                        ev.preventDefault();
                        input.blur();
                    } else if (ev.key === 'Escape') {
                        tdNombre.dataset.acabaDeGuardar = 'true';
                        tdNombre.textContent = nombreActual;
                        setTimeout(function () { tdNombre.dataset.acabaDeGuardar = 'false'; }, 250);
                    }
                });

                return;
            }
        });

        // Sincronización inicial
        if (typeof window.swcoraSyncTiposEmpresa === 'function') {
            window.swcoraSyncTiposEmpresa('', '');
        }

        aplicarFiltroTipos();
    }

    // =============================================
    // ADMIN DEPARTAMENTOS: filtros, edición y estado
    // =============================================
    const tablaDepartamentos = document.getElementById('tablaDepartamentos');

    if (tablaDepartamentos) {
        const filtroNombre = document.getElementById('filtroDepartamentosBuscar');
        const filtroEstado = document.getElementById('filtroDepartamentosEstado');
        const btnLimpiar = document.getElementById('btnLimpiarFiltrosDepartamentos');
        const contador = document.getElementById('contadorDepartamentos');

        const modalEl = document.getElementById('modalDepartamento');
        const modalTitulo = document.getElementById('modalDepartamentoTitulo');
        const inputNombre = document.getElementById('departamentoNombre');
        const inputDescripcion = document.getElementById('departamentoDescripcion');
        const btnGuardar = document.getElementById('btnGuardarDepartamento');

        const toastGuardadoEl = document.getElementById('toastCambiosGuardados');
        const toastActivadoEl = document.getElementById('toastDepartamentoActivado');
        const toastDesactivadoEl = document.getElementById('toastDepartamentoDesactivado');

        const tbody = tablaDepartamentos.querySelector('tbody');
        let filaEditando = null;

        function normalizarDepartamento(valor) {
            return String(valor || '')
                .trim()
                .toLocaleLowerCase('es')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        function mostrarToastDepartamento(elemento) {
            if (elemento) {
                new bootstrap.Toast(elemento).show();
            }
        }

        // Filtros por nombre y estado
        function aplicarFiltrosDepartamentos() {
            const nombre = normalizarDepartamento(filtroNombre ? filtroNombre.value : '');
            const estado = filtroEstado ? filtroEstado.value : '';

            let visibles = 0;

            tablaDepartamentos.querySelectorAll('.departamento-row').forEach(function (fila) {
                const nombreFila = normalizarDepartamento(fila.getAttribute('data-nombre'));
                const coincideNombre = nombreFila.includes(nombre);
                const coincideEstado = !estado || fila.getAttribute('data-estado') === estado;
                const visible = coincideNombre && coincideEstado;

                fila.classList.toggle('d-none', !visible);
                if (visible) visibles++;
            });

            if (contador) contador.textContent = visibles;
        }

        if (filtroNombre) filtroNombre.addEventListener('input', aplicarFiltrosDepartamentos);
        if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltrosDepartamentos);

        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', function () {
                if (filtroNombre) filtroNombre.value = '';
                if (filtroEstado) filtroEstado.value = '';
                aplicarFiltrosDepartamentos();
            });
        }

        // Limpiar modal al cerrarse
        if (modalEl) {
            modalEl.addEventListener('hidden.bs.modal', function () {
                filaEditando = null;
                modalTitulo.innerHTML = '<i class="bi bi-diagram-3"></i> Nuevo Departamento';
                inputNombre.value = '';
                inputDescripcion.value = '';
                inputNombre.classList.remove('is-invalid');
                inputDescripcion.classList.remove('is-invalid');
            });
        }

        // Delegación: editar y toggle
        tablaDepartamentos.addEventListener('click', function (e) {
            const btnEditar = e.target.closest('.btn-editar-departamento');

            if (btnEditar) {
                filaEditando = btnEditar.closest('.departamento-row');
                if (!filaEditando) return;

                inputNombre.value = filaEditando.cells[0].textContent.trim();
                inputDescripcion.value = filaEditando.cells[1].textContent.trim();
                inputNombre.classList.remove('is-invalid');

                modalTitulo.innerHTML = '<i class="bi bi-pencil"></i> Editar Departamento';

                bootstrap.Modal.getOrCreateInstance(modalEl).show();
                return;
            }

            const btnToggle = e.target.closest('.btn-toggle-estado-departamento');
            if (!btnToggle) return;

            const fila = btnToggle.closest('.departamento-row');
            if (!fila) return;

            const activar = btnToggle.dataset.accion === 'activar';

            fila.dataset.estado = activar ? 'activo' : 'inactivo';

            const badge = fila.cells[2].querySelector('.badge');
            if (badge) {
                badge.textContent = activar ? 'Activo' : 'Inactivo';
                badge.classList.toggle('bg-success', activar);
                badge.classList.toggle('bg-danger', !activar);
            }

            btnToggle.dataset.accion = activar ? 'desactivar' : 'activar';
            btnToggle.title = activar ? 'Desactivar' : 'Activar';
            btnToggle.setAttribute('aria-label', btnToggle.title);

            btnToggle.classList.toggle('btn-outline-primary', activar);
            btnToggle.classList.toggle('btn-outline-success', !activar);

            aplicarFiltrosDepartamentos();

            mostrarToastDepartamento(activar ? toastActivadoEl : toastDesactivadoEl);
        });

        // Guardar (nuevo o editar)
        if (btnGuardar) {
            btnGuardar.addEventListener('click', function () {
                const nombre = inputNombre.value.trim();
                const descripcion = inputDescripcion.value.trim();

                if (!nombre) {
                    inputNombre.classList.add('is-invalid');
                    inputNombre.focus();
                    return;
                }

                inputNombre.classList.remove('is-invalid');

                if (filaEditando) {
                    // Actualizar
                    filaEditando.cells[0].textContent = nombre;
                    filaEditando.cells[1].textContent = descripcion;
                    filaEditando.dataset.nombre = nombre;
                } else {
                    // Crear nueva fila
                    const fila = document.createElement('tr');

                    fila.className = 'departamento-row';
                    fila.dataset.nombre = nombre;
                    fila.dataset.estado = 'activo';

                    fila.innerHTML =
                        '<td></td>' +
                        '<td></td>' +
                        '<td><span class="badge bg-success">Activo</span></td>' +
                        '<td class="text-center text-nowrap">' +
                            '<button class="btn btn-sm btn-outline-info btn-editar-departamento" ' +
                                'title="Editar" aria-label="Editar">' +
                                '<i class="bi bi-pencil"></i>' +
                            '</button> ' +
                            '<button class="btn btn-sm btn-outline-primary btn-toggle-estado-departamento" ' +
                                'title="Desactivar" data-accion="desactivar" ' +
                                'aria-label="Desactivar">' +
                                '<i class="bi bi-power"></i>' +
                            '</button>' +
                        '</td>';

                    fila.cells[0].textContent = nombre;
                    fila.cells[1].textContent = descripcion;

                    tbody.appendChild(fila);
                }

                const modalInstance = bootstrap.Modal.getInstance(modalEl);

                modalEl.addEventListener('hidden.bs.modal', function handler() {
                    mostrarToastDepartamento(toastGuardadoEl);
                    modalEl.removeEventListener('hidden.bs.modal', handler);
                });

                if (modalInstance) {
                    modalInstance.hide();
                } else {
                    mostrarToastDepartamento(toastGuardadoEl);
                }

                filaEditando = null;
                aplicarFiltrosDepartamentos();
            });
        }

        aplicarFiltrosDepartamentos();
    }

    // Poblar selects de unidades al cargar la página
    refrescarSelectsUnidades();

    // =============================================
    // ADMIN UNIDADES: filtros, edición y estado
    // =============================================
    const tablaUnidades = document.getElementById('tablaUnidades');

    if (tablaUnidades) {
        const tbody = tablaUnidades.querySelector('tbody');

        const filtroBuscar = document.getElementById('filtroUnidadesBuscar');
        const filtroEstado = document.getElementById('filtroUnidadesEstado');
        const btnLimpiar = document.getElementById('btnLimpiarFiltrosUnidades');
        const btnNueva = document.getElementById('btnNuevaUnidad');
        const btnGuardar = document.getElementById('btnGuardarUnidad');

        const modalEl = document.getElementById('modalUnidad');
        const modalTitulo = document.getElementById('modalUnidadTitulo');
        const inputDescripcion = document.getElementById('descripcionUnidad');

        const contador =
            document.getElementById('contadorUnidades') ||
            document.getElementById('contadorRoles');

        const toastGuardado = document.getElementById('toastCambiosGuardados');
        const toastActivado = document.getElementById('toastUnidadActivada');
        const toastDesactivado = document.getElementById('toastUnidadDesactivada');

        let filaEditando = null;

        function normalizarUnidad(texto) {
            return String(texto || '')
                .trim()
                .toLocaleLowerCase('es')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        function mostrarToastUnidad(elemento) {
            if (elemento && window.bootstrap) {
                bootstrap.Toast.getOrCreateInstance(elemento).show();
            }
        }

        // Persiste las unidades actuales de la tabla en localStorage
        function persistirUnidadesDesdeTabla() {
            const filas = document.querySelectorAll('#tablaUnidades .unidad-row');
            const lista = [];
            filas.forEach(function (fila) {
                lista.push({
                    codigo: fila.dataset.codigo || '',
                    descripcion: fila.dataset.descripcion || fila.cells[0].textContent.trim(),
                    activo: fila.dataset.estado !== 'inactivo'
                });
            });
            try {
                localStorage.setItem('swcora_unidades_medida', JSON.stringify(lista));
            } catch (e) { console.warn(e); }
            refrescarSelectsUnidades();
        }

        function generarCodigoUnidad(descripcion) {
            const base = normalizarUnidad(descripcion)
                .replace(/[^a-z0-9\s]/g, '')
                .split(/\s+/)
                .filter(Boolean)
                .map(palabra => palabra[0])
                .join('')
                .toUpperCase()
                .slice(0, 20) || 'UNI';

            let codigo = base;
            let consecutivo = 2;

            const codigosExistentes = Array.from(
                tbody.querySelectorAll('.unidad-row')
            ).map(fila => normalizarUnidad(fila.dataset.codigo));

            while (codigosExistentes.includes(normalizarUnidad(codigo))) {
                codigo = (base.slice(0, 16) + consecutivo).slice(0, 20);
                consecutivo++;
            }

            return codigo;
        }

        function aplicarFiltrosUnidades() {
            const busqueda = normalizarUnidad(filtroBuscar ? filtroBuscar.value : '');
            const estadoSeleccionado = filtroEstado ? filtroEstado.value : '';

            let visibles = 0;
            const filas = tablaUnidades.querySelectorAll('.unidad-row');

            filas.forEach(function (fila) {
                const formato = normalizarUnidad(
                    fila.dataset.descripcion || fila.cells[0].textContent
                );
                const estado = fila.dataset.estado || 'activo';

                const coincideFormato = formato.includes(busqueda);
                const coincideEstado = !estadoSeleccionado || estado === estadoSeleccionado;

                const visible = coincideFormato && coincideEstado;

                fila.classList.toggle('d-none', !visible);
                if (visible) visibles++;
            });

            if (contador) contador.textContent = visibles;
        }

        if (filtroBuscar) filtroBuscar.addEventListener('input', aplicarFiltrosUnidades);
        if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltrosUnidades);

        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', function () {
                if (filtroBuscar) filtroBuscar.value = '';
                if (filtroEstado) filtroEstado.value = '';
                aplicarFiltrosUnidades();
            });
        }

        if (btnNueva) {
            btnNueva.addEventListener('click', function () {
                filaEditando = null;
                modalTitulo.innerHTML = '<i class="bi bi-rulers"></i> Nueva Unidad de Medida';
                inputDescripcion.value = '';
                inputDescripcion.classList.remove('is-invalid');
            });
        }

        // Delegación: editar y toggle
        tablaUnidades.addEventListener('click', function (e) {
            const btnEditar = e.target.closest('.btn-editar-unidad');

            if (btnEditar) {
                filaEditando = btnEditar.closest('.unidad-row');
                if (!filaEditando) return;

                inputDescripcion.value =
                    filaEditando.dataset.descripcion ||
                    filaEditando.cells[0].textContent.trim();

                inputDescripcion.classList.remove('is-invalid');

                modalTitulo.innerHTML = '<i class="bi bi-pencil"></i> Editar Unidad de Medida';

                bootstrap.Modal.getOrCreateInstance(modalEl).show();
                return;
            }

            const btnToggle = e.target.closest('.btn-toggle-estado-unidad');
            if (!btnToggle) return;

            const fila = btnToggle.closest('.unidad-row');
            if (!fila) return;

            const activar = btnToggle.dataset.accion === 'activar';

            fila.dataset.estado = activar ? 'activo' : 'inactivo';

            const badge = fila.querySelector('.badge-estado');
            if (badge) {
                badge.textContent = activar ? 'Activo' : 'Inactivo';
                badge.classList.toggle('bg-success', activar);
                badge.classList.toggle('bg-danger', !activar);
            }

            btnToggle.dataset.accion = activar ? 'desactivar' : 'activar';
            btnToggle.title = activar ? 'Desactivar' : 'Activar';
            btnToggle.setAttribute('aria-label', btnToggle.title);

            btnToggle.classList.toggle('btn-outline-primary', activar);
            btnToggle.classList.toggle('btn-outline-success', !activar);

            aplicarFiltrosUnidades();
            persistirUnidadesDesdeTabla();

            mostrarToastUnidad(activar ? toastActivado : toastDesactivado);
        });

        // Guardar (nuevo o editar)
        if (btnGuardar) {
            btnGuardar.addEventListener('click', function () {
                const descripcion = inputDescripcion.value.trim();

                if (!descripcion) {
                    inputDescripcion.classList.add('is-invalid');
                    inputDescripcion.focus();

                    let feedback = inputDescripcion.parentElement.querySelector('.invalid-feedback');
                    if (!feedback) {
                        feedback = document.createElement('div');
                        feedback.className = 'invalid-feedback';
                        inputDescripcion.insertAdjacentElement('afterend', feedback);
                    }
                    feedback.textContent = 'Ingresa el formato de la unidad de medida.';
                    return;
                }

                inputDescripcion.classList.remove('is-invalid');

                const descripcionNormalizada = normalizarUnidad(descripcion);

                const duplicada = Array.from(tbody.querySelectorAll('.unidad-row'))
                    .some(function (fila) {
                        const formatoExistente = normalizarUnidad(
                            fila.dataset.descripcion || fila.cells[0].textContent
                        );
                        return fila !== filaEditando && formatoExistente === descripcionNormalizada;
                    });

                if (duplicada) {
                    inputDescripcion.classList.add('is-invalid');

                    let feedback = inputDescripcion.parentElement.querySelector('.invalid-feedback');
                    if (!feedback) {
                        feedback = document.createElement('div');
                        feedback.className = 'invalid-feedback';
                        inputDescripcion.insertAdjacentElement('afterend', feedback);
                    }
                    feedback.textContent = 'Ya existe una unidad con ese formato.';
                    inputDescripcion.focus();
                    return;
                }

                let fila = filaEditando;

                if (!fila) {
                    fila = document.createElement('tr');
                    fila.className = 'unidad-row';

                    const codigoInterno = generarCodigoUnidad(descripcion);

                    fila.dataset.codigo = codigoInterno;
                    fila.dataset.descripcion = descripcion;
                    fila.dataset.estado = 'activo';

                    fila.innerHTML =
                        '<td></td>' +
                        '<td><span class="badge badge-estado"></span></td>' +
                        '<td class="text-center text-nowrap">' +
                            '<button type="button" ' +
                                'class="btn btn-sm btn-outline-info btn-editar-unidad" ' +
                                'title="Editar" aria-label="Editar">' +
                                '<i class="bi bi-pencil"></i>' +
                            '</button> ' +
                            '<button type="button" ' +
                                'class="btn btn-sm btn-outline-primary btn-toggle-estado-unidad" ' +
                                'data-accion="desactivar" ' +
                                'title="Desactivar" aria-label="Desactivar">' +
                                '<i class="bi bi-power"></i>' +
                            '</button>' +
                        '</td>';

                    tbody.appendChild(fila);
                }

                fila.cells[0].textContent = descripcion;
                fila.dataset.descripcion = descripcion;

                if (!fila.dataset.estado) {
                    fila.dataset.estado = 'activo';
                }

                const badge = fila.querySelector('.badge-estado');
                const activo = fila.dataset.estado === 'activo';

                if (badge) {
                    badge.textContent = activo ? 'Activo' : 'Inactivo';
                    badge.classList.toggle('bg-success', activo);
                    badge.classList.toggle('bg-danger', !activo);
                }

                const btnToggle = fila.querySelector('.btn-toggle-estado-unidad');
                if (btnToggle) {
                    btnToggle.dataset.accion = activo ? 'desactivar' : 'activar';
                    btnToggle.title = activo ? 'Desactivar' : 'Activar';
                    btnToggle.setAttribute('aria-label', btnToggle.title);
                    btnToggle.classList.toggle('btn-outline-primary', activo);
                    btnToggle.classList.toggle('btn-outline-success', !activo);
                }

                persistirUnidadesDesdeTabla();

                const modal = bootstrap.Modal.getOrCreateInstance(modalEl);

                modalEl.addEventListener('hidden.bs.modal', function handler() {
                    modalEl.removeEventListener('hidden.bs.modal', handler);
                    mostrarToastUnidad(toastGuardado);
                });

                filaEditando = null;

                modal.hide();
                aplicarFiltrosUnidades();
            });
        }

        aplicarFiltrosUnidades();
    }

    // =============================================
    // ADMIN DEPARTAMENTOS Y UNIDADES:
    // filtros en tiempo real + orden por relevancia
    // =============================================

    function normalizarBusquedaCatalogo(texto) {
        return String(texto || '')
            .toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    function calcularRelevanciaCatalogo(terminos, campos) {
        if (terminos.length === 0) return 0;

        const camposNormalizados = campos.map(normalizarBusquedaCatalogo);
        const palabrasPorCampo = camposNormalizados.map(function (campo) {
            return campo.split(/\s+/).filter(Boolean);
        });

        let puntuacion = 0;

        for (let i = 0; i < terminos.length; i++) {
            const termino = terminos[i];
            let mejorPuntuacion = 0;

            camposNormalizados.forEach(function (campo, indice) {
                const palabras = palabrasPorCampo[indice];

                if (campo.startsWith(termino)) {
                    mejorPuntuacion = Math.max(mejorPuntuacion, 100);
                }

                if (palabras.some(function (palabra) {
                    return palabra.startsWith(termino);
                })) {
                    mejorPuntuacion = Math.max(mejorPuntuacion, 50);
                }

                if (campo.includes(termino)) {
                    mejorPuntuacion = Math.max(mejorPuntuacion, 10);
                }
            });

            if (mejorPuntuacion === 0) return -1;
            puntuacion += mejorPuntuacion * (terminos.length - i);
        }

        return puntuacion;
    }

    // Configura un filtro de catálogo (búsqueda + estado + orden por relevancia)
    function configurarFiltroCatalogo(config) {
        const tabla = document.getElementById(config.tabla);
        if (!tabla) return;

        const campoBuscar = document.getElementById(config.buscar);
        const campoEstado = document.getElementById(config.estado);
        const botonLimpiar = document.getElementById(config.limpiar);
        const contador = document.getElementById(config.contador);
        const tbody = tabla.querySelector('tbody');

        if (!tbody) return;

        const ordenOriginal = Array.from(tbody.querySelectorAll(config.fila));

        function obtenerFilas() {
            return Array.from(tbody.querySelectorAll(config.fila));
        }

        function aplicarFiltros() {
            const busqueda = normalizarBusquedaCatalogo(campoBuscar ? campoBuscar.value : '');
            const terminos = busqueda ? busqueda.split(/\s+/).filter(Boolean) : [];
            const estadoSeleccionado = campoEstado ? campoEstado.value : '';

            const filas = obtenerFilas();
            let visibles = 0;

            const resultados = filas.map(function (fila, indice) {
                const campos = config.campos(fila);
                const relevancia = calcularRelevanciaCatalogo(terminos, campos);
                const estadoFila = normalizarBusquedaCatalogo(fila.getAttribute('data-estado') || '');

                const coincideTexto = relevancia >= 0;
                const coincideEstado = !estadoSeleccionado || estadoFila === estadoSeleccionado;

                const visible = coincideTexto && coincideEstado;
                fila.classList.toggle('d-none', !visible);

                if (visible) visibles++;

                return { fila, relevancia, indice };
            });

            // Ordenar visibles por relevancia, ocultas al final
            resultados.sort(function (a, b) {
                const aVisible = !a.fila.classList.contains('d-none');
                const bVisible = !b.fila.classList.contains('d-none');

                if (aVisible !== bVisible) return aVisible ? -1 : 1;
                if (aVisible && bVisible && b.relevancia !== a.relevancia) {
                    return b.relevancia - a.relevancia;
                }
                return a.indice - b.indice;
            });

            resultados.forEach(function (resultado) {
                tbody.appendChild(resultado.fila);
            });

            if (contador) contador.textContent = visibles;
        }

        function limpiarFiltros() {
            if (campoBuscar) campoBuscar.value = '';
            if (campoEstado) campoEstado.value = '';

            ordenOriginal.forEach(function (fila) {
                if (fila.parentElement === tbody) {
                    tbody.appendChild(fila);
                }
            });

            aplicarFiltros();
        }

        if (campoBuscar) campoBuscar.addEventListener('input', aplicarFiltros);
        if (campoEstado) campoEstado.addEventListener('change', aplicarFiltros);
        if (botonLimpiar) botonLimpiar.addEventListener('click', limpiarFiltros);

        aplicarFiltros();

        // Permite refrescar desde otros bloques
        tabla.addEventListener('catalogo:actualizar-filtros', aplicarFiltros);
    }

    // ---------- Departamentos ----------
    configurarFiltroCatalogo({
        tabla: 'tablaDepartamentos',
        buscar: 'filtroDepartamentosBuscar',
        estado: 'filtroDepartamentosEstado',
        limpiar: 'btnLimpiarFiltrosDepartamentos',
        contador: 'contadorDepartamentos',
        fila: '.departamento-row',
        campos: function (fila) {
            return [
                fila.getAttribute('data-nombre') || fila.cells[0]?.textContent,
                fila.getAttribute('data-descripcion') || fila.cells[1]?.textContent
            ];
        }
    });

    // ---------- Unidades ----------
    configurarFiltroCatalogo({
        tabla: 'tablaUnidades',
        buscar: 'filtroUnidadesBuscar',
        estado: 'filtroUnidadesEstado',
        limpiar: 'btnLimpiarFiltrosUnidades',
        contador: 'contadorUnidades',
        fila: '.unidad-row',
        campos: function (fila) {
            return [
                fila.getAttribute('data-codigo') || '',
                fila.getAttribute('data-descripcion') || fila.cells[0]?.textContent
            ];
        }
    });

    // =============================================
    // ADMIN LOGS: filtros + revisado + exportar CSV
    // =============================================
    const tablaLogs = document.getElementById('tablaLogs');

    if (tablaLogs) {
        const tbodyLogs = document.getElementById('tbodyLogs');
        const filtroUsuario = document.getElementById('filtroLogsUsuario');
        const filtroDesde = document.getElementById('filtroLogsDesde');
        const filtroHasta = document.getElementById('filtroLogsHasta');
        const filtroDepartamento = document.getElementById('filtroLogsDepartamento');
        const filtroModulo = document.getElementById('filtroLogsModulo');
        const filtroCriticidad = document.getElementById('filtroLogsCriticidad');
        const btnLimpiarFiltrosLogs = document.getElementById('btnLimpiarFiltrosLogs');
        const btnMarcarTodoRevisado = document.getElementById('btnMarcarTodoRevisado');
        const contadorLogs = document.getElementById('contadorLogs');

        function normalizarLog(texto) {
            return String(texto || '')
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        // Aplica todos los filtros de logs
        function aplicarFiltrosLogs() {
            const usuarioBusqueda = normalizarLog(filtroUsuario.value);
            const desde = filtroDesde.value ? new Date(filtroDesde.value) : null;
            const hasta = filtroHasta.value ? new Date(filtroHasta.value) : null;
            const departamento = filtroDepartamento.value;
            const modulo = filtroModulo.value;
            const criticidad = filtroCriticidad.value;

            let visibles = 0;

            tbodyLogs.querySelectorAll('.log-row').forEach(function (fila) {
                const filaUsuario = normalizarLog(fila.getAttribute('data-usuario'));
                const filaFecha = new Date(fila.getAttribute('data-fecha'));
                const filaDepto = fila.getAttribute('data-departamento') || '';
                const filaModulo = fila.getAttribute('data-modulo') || '';
                const filaCrit = fila.getAttribute('data-criticidad') || '';

                const coincideUsuario = !usuarioBusqueda || filaUsuario.includes(usuarioBusqueda);
                const coincideDesde = !desde || filaFecha >= desde;
                const coincideHasta = !hasta || filaFecha <= hasta;
                const coincideDepto = !departamento || filaDepto === departamento;
                const coincideModulo = !modulo || filaModulo === modulo;
                const coincideCrit = !criticidad || filaCrit === criticidad;

                const visible = coincideUsuario && coincideDesde && coincideHasta &&
                                coincideDepto && coincideModulo && coincideCrit;

                fila.classList.toggle('d-none', !visible);
                if (visible) visibles++;
            });

            if (contadorLogs) contadorLogs.textContent = visibles;
        }

        if (filtroUsuario) filtroUsuario.addEventListener('input', aplicarFiltrosLogs);
        if (filtroDesde) filtroDesde.addEventListener('change', aplicarFiltrosLogs);
        if (filtroHasta) filtroHasta.addEventListener('change', aplicarFiltrosLogs);
        if (filtroDepartamento) filtroDepartamento.addEventListener('change', aplicarFiltrosLogs);
        if (filtroModulo) filtroModulo.addEventListener('change', aplicarFiltrosLogs);
        if (filtroCriticidad) filtroCriticidad.addEventListener('change', aplicarFiltrosLogs);

        if (btnLimpiarFiltrosLogs) {
            btnLimpiarFiltrosLogs.addEventListener('click', function () {
                if (filtroUsuario) filtroUsuario.value = '';
                if (filtroDesde) filtroDesde.value = '';
                if (filtroHasta) filtroHasta.value = '';
                if (filtroDepartamento) filtroDepartamento.value = '';
                if (filtroModulo) filtroModulo.value = '';
                if (filtroCriticidad) filtroCriticidad.value = '';
                aplicarFiltrosLogs();
            });
        }

        // Marca una fila como revisada
        function marcarFilaRevisada(fila) {
            if (fila.getAttribute('data-revisado') === 'true') return;

            fila.setAttribute('data-revisado', 'true');
            fila.classList.remove('table-warning');

            const badge = fila.querySelector('.badge-revisado');
            if (badge) {
                badge.textContent = 'Sí';
                badge.classList.remove('bg-secondary');
                badge.classList.add('bg-success');
            }
        }

        // Clic en una fila → marcar como revisada
        tbodyLogs.addEventListener('click', function (e) {
            const fila = e.target.closest('.log-row');
            if (!fila) return;
            marcarFilaRevisada(fila);
        });

        // Marcar todo como revisado (solo visibles)
        if (btnMarcarTodoRevisado) {
            btnMarcarTodoRevisado.addEventListener('click', function () {
                tbodyLogs.querySelectorAll('.log-row:not(.d-none)').forEach(function (fila) {
                    marcarFilaRevisada(fila);
                });
            });
        }

        aplicarFiltrosLogs();
    }

    // =============================================
    // SALIDAS DE MATERIAL (INDEX): render dinámico + filtros + acciones
    // =============================================
    const tablaSalidas = document.getElementById('tablaSalidas');
    const tbodySalidas = document.getElementById('tbodySalidas');

    if (tablaSalidas && tbodySalidas) {
        const filtroSalidasBuscar = document.getElementById('filtroSalidasBuscar');
        const filtroSalidasEstado = document.getElementById('filtroSalidasEstado');
        const filtroSalidasDesde = document.getElementById('filtroSalidasDesde');
        const filtroSalidasHasta = document.getElementById('filtroSalidasHasta');
        const btnLimpiarFiltrosSalidas = document.getElementById('btnLimpiarFiltrosSalidas');
        const contadorSalidas = document.getElementById('contadorSalidas');
        const totalSalidasEl = document.getElementById('totalSalidas');

        const toastSalidaEl = document.getElementById('toastSalidaAccion');
        const toastSalidaTitulo = document.getElementById('toastSalidaTitulo');
        const toastSalidaMensaje = document.getElementById('toastSalidaMensaje');

        const modalRechazarEl = document.getElementById('modalRechazarSalida');
        const modalCancelarEl = document.getElementById('modalCancelarSalida');
        const modalEliminarEl = document.getElementById('modalEliminarSalida');

        let filaRechazando = null;
        let filaCancelando = null;
        let filaEliminando = null;

        // ---------- Helpers ----------
        function normalizarSalida(texto) {
            return String(texto || '').toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        function mostrarToastSalida(titulo, mensaje, tipo) {
            if (!toastSalidaEl) return;
            if (toastSalidaTitulo) toastSalidaTitulo.textContent = titulo;
            if (toastSalidaMensaje) toastSalidaMensaje.textContent = mensaje;
            const header = toastSalidaEl.querySelector('.toast-header');
            if (header) {
                header.style.backgroundColor = tipo === 'danger'
                    ? 'var(--cora-accent)' : 'var(--cora-success)';
            }
            bootstrap.Toast.getOrCreateInstance(toastSalidaEl).show();
        }

        function escaparHTML(str) {
            return String(str || '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        // Badge de estado; recibe el rol para mostrar "Pendiente (Aprobador)"
        function badgeEstadoHTML(estado, rol) {
            const mapa = {
                'borrador':  { texto: '📝 Borrador',   clase: 'bg-secondary' },
                'aprobada':  { texto: '✅ Aprobada',   clase: 'bg-success' },
                'rechazada': { texto: '❌ Rechazada',  clase: 'bg-danger' },
                'cancelada': { texto: '🚫 Cancelada',  clase: 'bg-dark' }
            };

            if (estado === 'pendiente') {
                const texto = rol === 'aprobador' ? '⏳ Pendiente (Aprobador)' : '⏳ Pendiente';
                return '<span class="badge badge-estado bg-warning text-dark">' + texto + '</span>';
            }

            const info = mapa[estado] || mapa['borrador'];
            return '<span class="badge badge-estado ' + info.clase + '">' + info.texto + '</span>';
        }

        // Construye los botones de acción según estado y rol
        function accionesHTML(s, rol) {
            const estado = s.estado;
            let html = '';

            // Ver: para todos los estados excepto 'borrador'
            if (estado !== 'borrador') {
                const rolParam = (estado === 'pendiente' && rol) ? '&rol=' + encodeURIComponent(rol) : '';
                html +=
                    '<a href="salidas-detalles.html?folio=' + encodeURIComponent(s.folio || '') +
                    '&id=' + encodeURIComponent(s.id) +
                    rolParam +
                    '" class="btn btn-sm btn-outline-info" title="Ver"><i class="bi bi-eye"></i></a> ';
            }

            // Clonar: SIEMPRE
            html += '<button class="btn btn-sm btn-outline-secondary btn-clonar-salida" title="Clonar"><i class="bi bi-files"></i></button> ';

            // Acciones según estado
            if (estado === 'pendiente') {
                if (rol === 'aprobador') {
                    html += '<button class="btn btn-sm btn-outline-success btn-aprobar-salida" title="Aprobar"><i class="bi bi-check-circle"></i></button> ';
                    html += '<button class="btn btn-sm btn-outline-danger btn-rechazar-salida" title="Rechazar"><i class="bi bi-x-circle"></i></button>';
                } else {
                    html += '<button class="btn btn-sm btn-outline-danger btn-cancelar-salida" title="Cancelar"><i class="bi bi-dash-circle"></i></button>';
                }

            } else if (estado === 'borrador') {
                html += '<a href="salidas-editar.html?id=' + encodeURIComponent(s.id) +
                        '" class="btn btn-sm btn-outline-success" title="Editar"><i class="bi bi-pencil"></i></a>';

                if (!s.folio) {
                    html += ' <button class="btn btn-sm btn-outline-danger btn-eliminar-salida" title="Eliminar borrador"><i class="bi bi-trash"></i></button>';
                }

            } else if (estado === 'aprobada') {
                html += '<button class="btn btn-sm btn-outline-primary btn-pdf-salida" title="Exportar PDF"><i class="bi bi-file-pdf"></i></button>';

            } else if (estado === 'rechazada') {
                // Solo Clonar (Ver + Clonar ya agregados arriba)

            } else if (estado === 'cancelada') {
                html += '<a href="salidas-editar.html?id=' + encodeURIComponent(s.id) +
                        '" class="btn btn-sm btn-outline-success" title="Editar"><i class="bi bi-pencil"></i></a>';
            }

            return html;
        }

        // Renderiza todas las salidas; duplica si es pendiente con aprobador
        function renderSalidas() {
            const lista = window.swcoraSalidas.cargar();
            tbodySalidas.innerHTML = '';

            const ocultarVistaAprobador = (ROL_ACTUAL === 'generador');

            lista.forEach(function (s) {
                const esPendienteConAprobador = s.estado === 'pendiente' && s.aprobador;

                if (esPendienteConAprobador) {
                    tbodySalidas.appendChild(crearFilaSalida(s, 'solicitante'));
                    if (!ocultarVistaAprobador) {
                        tbodySalidas.appendChild(crearFilaSalida(s, 'aprobador'));
                    }
                } else {
                    tbodySalidas.appendChild(crearFilaSalida(s, null));
                }
            });

            if (totalSalidasEl) totalSalidasEl.textContent = lista.length;
            aplicarFiltrosSalidas();
        }

        // Construye el <tr> de una salida para un rol dado
        function crearFilaSalida(s, rol) {
            const fila = document.createElement('tr');
            fila.className = 'salida-row';
            fila.setAttribute('data-id', s.id);
            fila.setAttribute('data-folio', s.folio || '');
            fila.setAttribute('data-fecha', s.fecha);
            fila.setAttribute('data-estado', s.estado);
            fila.setAttribute('data-usuario', s.usuario);
            fila.setAttribute('data-descripcion', s.descripcion);
            fila.setAttribute('data-empresa', s.empresa || '');
            fila.setAttribute('data-destinatario', s.contacto || '');
            fila.setAttribute('data-retorno', s.retornoEsperado || '');
            fila.setAttribute('data-motivo', s.motivo || '');
            fila.setAttribute('data-materiales', s.materiales);
            if (rol) fila.setAttribute('data-rol', rol);

            const folioCell = s.folio
                ? '<strong>' + escaparHTML(s.folio) + '</strong>'
                : '<em class="text-muted">(sin folio)</em>';

            const empresaCell = s.empresa
                ? escaparHTML(s.empresa)
                : '<em class="text-muted">—</em>';

            const destinatarioCell = s.contacto
                ? escaparHTML(s.contacto)
                : '<em class="text-muted">—</em>';

            const retornoCell = s.retornoEsperado
                ? escaparHTML(s.retornoEsperado)
                : '<em class="text-muted">—</em>';

            const motivoCell = s.motivo
                ? escaparHTML(s.motivo)
                : '<em class="text-muted">—</em>';

            fila.innerHTML =
                '<td>' + folioCell + '</td>' +
                '<td>' + escaparHTML(s.fechaVisible) + '</td>' +
                '<td>' + badgeEstadoHTML(s.estado, rol) + '</td>' +
                '<td>' + escaparHTML(s.usuario) + '</td>' +
                '<td>' + escaparHTML(s.descripcion) + '</td>' +
                '<td>' + empresaCell + '</td>' +
                '<td>' + destinatarioCell + '</td>' +
                '<td>' + retornoCell + '</td>' +
                '<td class="motivo-celda">' + motivoCell + '</td>' +
                '<td class="text-center"><span class="badge bg-secondary">' + (s.materiales || 0) + '</span></td>' +
                '<td class="text-center text-nowrap">' + accionesHTML(s, rol) + '</td>';

            return fila;
        }

        // Filtros del index de salidas
        function aplicarFiltrosSalidas() {
            const buscar = normalizarSalida(filtroSalidasBuscar.value);
            const estado = filtroSalidasEstado.value;
            const desde = filtroSalidasDesde.value ? new Date(filtroSalidasDesde.value + 'T00:00:00') : null;
            const hasta = filtroSalidasHasta.value ? new Date(filtroSalidasHasta.value + 'T23:59:59') : null;

            let visibles = 0;

            tbodySalidas.querySelectorAll('.salida-row').forEach(function (fila) {
                const filaFolio = normalizarSalida(fila.getAttribute('data-folio'));
                const filaUsuario = normalizarSalida(fila.getAttribute('data-usuario'));
                const filaDesc = normalizarSalida(fila.getAttribute('data-descripcion'));
                const filaEstado = fila.getAttribute('data-estado');
                const filaFecha = new Date(fila.getAttribute('data-fecha') + 'T00:00:00');

                const coincideBuscar = !buscar ||
                    filaFolio.includes(buscar) ||
                    filaUsuario.includes(buscar) ||
                    filaDesc.includes(buscar);

                const coincideEstado = !estado || filaEstado === estado;
                const coincideDesde = !desde || filaFecha >= desde;
                const coincideHasta = !hasta || filaFecha <= hasta;

                const visible = coincideBuscar && coincideEstado && coincideDesde && coincideHasta;
                fila.classList.toggle('d-none', !visible);
                if (visible) visibles++;
            });

            if (contadorSalidas) contadorSalidas.textContent = visibles;
        }

        if (filtroSalidasBuscar) filtroSalidasBuscar.addEventListener('input', aplicarFiltrosSalidas);
        if (filtroSalidasEstado) filtroSalidasEstado.addEventListener('change', aplicarFiltrosSalidas);
        if (filtroSalidasDesde) filtroSalidasDesde.addEventListener('change', aplicarFiltrosSalidas);
        if (filtroSalidasHasta) filtroSalidasHasta.addEventListener('change', aplicarFiltrosSalidas);

        if (btnLimpiarFiltrosSalidas) {
            btnLimpiarFiltrosSalidas.addEventListener('click', function () {
                filtroSalidasBuscar.value = '';
                filtroSalidasEstado.value = '';
                filtroSalidasDesde.value = '';
                filtroSalidasHasta.value = '';
                aplicarFiltrosSalidas();
            });
        }

        // Delegación de acciones de la tabla
        tbodySalidas.addEventListener('click', function (e) {
            const btnPDF = e.target.closest('.btn-pdf-salida');
            const btnClonar = e.target.closest('.btn-clonar-salida');
            const btnAprobar = e.target.closest('.btn-aprobar-salida');
            const btnRechazar = e.target.closest('.btn-rechazar-salida');
            const btnEliminar = e.target.closest('.btn-eliminar-salida');
            const btnCancelar = e.target.closest('.btn-cancelar-salida');

            // ---- Exportar PDF (vacío) ----
            if (btnPDF) {
                const fila = btnPDF.closest('.salida-row');
                const folio = fila.getAttribute('data-folio') || 'salida';
                const blob = new Blob([''], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const enlace = document.createElement('a');
                enlace.href = url;
                enlace.download = 'salida_' + folio + '.pdf';
                enlace.style.display = 'none';
                document.body.appendChild(enlace);
                enlace.click();
                document.body.removeChild(enlace);
                URL.revokeObjectURL(url);
                mostrarToastSalida('PDF generado', 'Se descargó el archivo PDF de la salida ' + folio + '.', 'success');
                return;
            }

            // ---- Clonar ----
            if (btnClonar) {
                const fila = btnClonar.closest('.salida-row');
                if (!fila) return;
                const id = fila.getAttribute('data-id');
                const original = window.swcoraSalidas.porId(id);
                if (!original) return;

                const hoy = new Date();
                const pad = n => String(n).padStart(2, '0');
                const fechaISO = hoy.getFullYear() + '-' + pad(hoy.getMonth() + 1) + '-' + pad(hoy.getDate());
                const fechaVisible = pad(hoy.getDate()) + '/' + pad(hoy.getMonth() + 1) + '/' + hoy.getFullYear();

                window.swcoraSalidas.agregar({
                    folio: '',
                    fecha: fechaISO,
                    fechaVisible: fechaVisible,
                    estado: 'borrador',
                    usuario: original.usuario,
                    descripcion: original.descripcion + ' (copia)',
                    motivo: '',
                    materiales: original.materiales,
                    aprobador: '',
                    aprobadoPor: '',
                    fechaAprobacion: '',
                    empresa: original.empresa,
                    tipoEmpresa: original.tipoEmpresa,
                    contacto: original.contacto,
                    esDefinitiva: original.esDefinitiva,
                    retornoEsperado: original.retornoEsperado,
                    causa: original.causa,
                    categoria: original.categoria,
                    comentarios: original.comentarios,
                    departamento: original.departamento,
                    fechaCreacion: fechaVisible + ' ' + pad(hoy.getHours()) + ':' + pad(hoy.getMinutes()),
                    creadoPor: original.usuario,
                    materialesLista: (original.materialesLista || []).slice()
                });

                renderSalidas();
                mostrarToastSalida('Salida clonada', 'Se creó una copia en estado Borrador.', 'success');
                return;
            }

            // ---- Aprobar ----
            if (btnAprobar) {
                const fila = btnAprobar.closest('.salida-row');
                if (!fila) return;
                const id = fila.getAttribute('data-id');
                window.swcoraSalidas.actualizar(id, {
                    estado: 'aprobada',
                    aprobadoPor: USUARIO_ACTUAL,
                    fechaAprobacion: new Date().toLocaleString('es-MX')
                });
                renderSalidas();
                mostrarToastSalida('Salida aprobada', 'La solicitud fue aprobada correctamente.', 'success');
                return;
            }

            // ---- Rechazar (modal) ----
            if (btnRechazar) {
                const fila = btnRechazar.closest('.salida-row');
                if (!fila) return;
                filaRechazando = fila;
                const folio = fila.getAttribute('data-folio') || '—';
                const inputFolio = document.getElementById('rechazarFolio');
                const inputMotivo = document.getElementById('rechazarMotivo');
                if (inputFolio) inputFolio.textContent = folio;
                if (inputMotivo) { inputMotivo.value = ''; inputMotivo.classList.remove('is-invalid'); }
                bootstrap.Modal.getOrCreateInstance(modalRechazarEl).show();
                return;
            }

            // ---- Eliminar borrador (modal) ----
            if (btnEliminar) {
                filaEliminando = btnEliminar.closest('.salida-row');
                if (!filaEliminando) return;
                bootstrap.Modal.getOrCreateInstance(modalEliminarEl).show();
                return;
            }

            // ---- Cancelar (modal) ----
            if (btnCancelar) {
                const fila = btnCancelar.closest('.salida-row');
                if (!fila) return;
                filaCancelando = fila;
                const folio = fila.getAttribute('data-folio') || '—';
                const inputFolio = document.getElementById('cancelarFolio');
                const inputMotivo = document.getElementById('cancelarMotivo');
                if (inputFolio) inputFolio.textContent = folio;
                if (inputMotivo) { inputMotivo.value = ''; inputMotivo.classList.remove('is-invalid'); }
                bootstrap.Modal.getOrCreateInstance(modalCancelarEl).show();
                return;
            }
        });

        // ---------- Confirmar Rechazo ----------
        const btnConfirmarRechazo = document.getElementById('btnConfirmarRechazo');
        if (btnConfirmarRechazo) {
            btnConfirmarRechazo.addEventListener('click', function () {
                const inputMotivo = document.getElementById('rechazarMotivo');
                const motivo = inputMotivo.value.trim();
                if (!motivo) { inputMotivo.classList.add('is-invalid'); inputMotivo.focus(); return; }
                inputMotivo.classList.remove('is-invalid');
                if (!filaRechazando) { bootstrap.Modal.getInstance(modalRechazarEl).hide(); return; }
                const id = filaRechazando.getAttribute('data-id');
                window.swcoraSalidas.actualizar(id, {
                    estado: 'rechazada',
                    motivo: motivo,
                    aprobadoPor: USUARIO_ACTUAL,
                    fechaAprobacion: new Date().toLocaleString('es-MX')
                });
                bootstrap.Modal.getInstance(modalRechazarEl).hide();
                mostrarToastSalida('Salida rechazada', 'La solicitud fue rechazada. Motivo: ' + motivo, 'danger');
                filaRechazando = null;
                renderSalidas();
            });
        }

        // ---------- Confirmar Cancelación ----------
        const btnConfirmarCancelacion = document.getElementById('btnConfirmarCancelacion');
        if (btnConfirmarCancelacion) {
            btnConfirmarCancelacion.addEventListener('click', function () {
                const inputMotivo = document.getElementById('cancelarMotivo');
                const motivo = inputMotivo.value.trim();
                if (!motivo) { inputMotivo.classList.add('is-invalid'); inputMotivo.focus(); return; }
                inputMotivo.classList.remove('is-invalid');
                if (!filaCancelando) { bootstrap.Modal.getInstance(modalCancelarEl).hide(); return; }
                const id = filaCancelando.getAttribute('data-id');
                window.swcoraSalidas.actualizar(id, { estado: 'cancelada', motivo: motivo });
                bootstrap.Modal.getInstance(modalCancelarEl).hide();
                mostrarToastSalida('Salida cancelada', 'La solicitud fue cancelada. Motivo: ' + motivo, 'danger');
                filaCancelando = null;
                renderSalidas();
            });
        }

        // ---------- Confirmar Eliminación ----------
        const btnConfirmarEliminacion = document.getElementById('btnConfirmarEliminacion');
        if (btnConfirmarEliminacion) {
            btnConfirmarEliminacion.addEventListener('click', function () {
                if (!filaEliminando) { bootstrap.Modal.getInstance(modalEliminarEl).hide(); return; }
                const id = filaEliminando.getAttribute('data-id');
                window.swcoraSalidas.eliminar(id);
                filaEliminando = null;
                bootstrap.Modal.getInstance(modalEliminarEl).hide();
                mostrarToastSalida('Borrador eliminado', 'El registro fue eliminado de la tabla.', 'danger');
                renderSalidas();
            });
        }

        // Limpiar referencias al cerrar modales
        if (modalRechazarEl) modalRechazarEl.addEventListener('hidden.bs.modal', () => filaRechazando = null);
        if (modalCancelarEl) modalCancelarEl.addEventListener('hidden.bs.modal', () => filaCancelando = null);
        if (modalEliminarEl) modalEliminarEl.addEventListener('hidden.bs.modal', () => filaEliminando = null);

        // Inicializar
        renderSalidas();
    }

        // =============================================
    // EXPORTACIÓN CSV ESPECIAL: salidas-index (con todos los detalles)
    // =============================================
    const btnExportarSalidasDetalle = document.getElementById('btnExportarSalidas');
    if (btnExportarSalidasDetalle && document.getElementById('tablaSalidas')) {

        // Quitar el atributo para que el listener genérico no se dispare
        btnExportarSalidasDetalle.removeAttribute('data-tabla');

        // Evitar listeners duplicados
        if (btnExportarSalidasDetalle.dataset.exportDetalle !== 'true') {
            btnExportarSalidasDetalle.dataset.exportDetalle = 'true';

            btnExportarSalidasDetalle.addEventListener('click', function () {
                const lista = window.swcoraSalidas.cargar();

                // Encabezados completos (incluye TODA la info del detalle)
                const encabezados = [
                    'Folio',
                    'Fecha',
                    'Estado',
                    'Usuario',
                    'Descripción',
                    'Empresa',
                    'Tipo Empresa',
                    'Destinatario (Contacto)',
                    'Retorno Esperado',
                    'Es Definitiva',
                    'Motivo',
                    'Departamento',
                    'Aprobador',
                    'Aprobado Por',
                    'Fecha Aprobación',
                    'Causa',
                    'Categoría',
                    'Comentarios',
                    'Total Materiales',
                    'Materiales (detalle)'
                ];

                const filas = lista.map(function (s) {
                    const detalleMat = (s.materialesLista || []).map(function (m, i) {
                        const unidadLegible = obtenerDescripcionUnidad(m.unidad);
                        return (i + 1) + ') ' + m.cantidad + ' ' +
                            unidadLegible + ' — ' + (m.descripcion || '') +
                            (m.comentario ? ' (' + m.comentario + ')' : '');
                    }).join(' | ');

                    return [
                        s.folio || '(sin folio)',
                        s.fechaVisible || '',
                        s.estado || '',
                        s.usuario || '',
                        s.descripcion || '',
                        s.empresa || '',
                        s.tipoEmpresa || '',
                        s.contacto || '',
                        s.retornoEsperado || '',
                        s.esDefinitiva ? 'Sí' : 'No',
                        s.motivo || '',
                        s.departamento || '',
                        s.aprobador || '',
                        s.aprobadoPor || '',
                        s.fechaAprobacion || '',
                        s.causa || '',
                        s.categoria || '',
                        s.comentarios || '',
                        (s.materialesLista || []).length,
                        detalleMat
                    ];
                });

                // Escapar CSV
                function esc(v) {
                    const t = String(v == null ? '' : v);
                    if (t.indexOf(',') !== -1 || t.indexOf('"') !== -1 ||
                        t.indexOf('\n') !== -1 || t.indexOf('\r') !== -1) {
                        return '"' + t.replace(/"/g, '""') + '"';
                    }
                    return t;
                }

                const lineas = [encabezados.map(esc).join(',')];
                filas.forEach(function (f) { lineas.push(f.map(esc).join(',')); });

                const contenido = '\uFEFF' + lineas.join('\r\n');
                const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);

                const d = new Date();
                const pad = n => String(n).padStart(2, '0');
                const ts = d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
                           '_' + pad(d.getHours()) + pad(d.getMinutes());

                const a = document.createElement('a');
                a.href = url;
                a.download = 'salidas_completo_' + ts + '.csv';
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            });
        }
    }

    // =============================================
    // MIS SOLICITUDES: render dinámico + filtros + cancelar
    // =============================================
    const tbodyMisSolicitudes = document.getElementById('tbodyMisSolicitudes');

    if (tbodyMisSolicitudes) {
        const filtroMisBuscar = document.getElementById('filtroMisBuscar');
        const filtroMisEstado = document.getElementById('filtroMisEstado');
        const btnLimpiarFiltrosMis = document.getElementById('btnLimpiarFiltrosMis');
        const contadorMisMostrados = document.getElementById('contadorMisMostrados');
        const totalMisSolicitudesEl = document.getElementById('totalMisSolicitudes');

        const modalCancelarEl = document.getElementById('modalCancelarMiSolicitud');
        const btnConfirmarCancelar = document.getElementById('btnConfirmarCancelarMiSolicitud');
        const toastEl = document.getElementById('toastMiSolicitud');
        const toastTitulo = document.getElementById('toastMiSolicitudTitulo');
        const toastMensaje = document.getElementById('toastMiSolicitudMensaje');

        let filaCancelando = null;

        function normalizarMis(texto) {
            return String(texto || '').toLowerCase().trim()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }

        function mostrarToastMis(titulo, mensaje, tipo) {
            if (!toastEl) return;
            if (toastTitulo) toastTitulo.textContent = titulo;
            if (toastMensaje) toastMensaje.textContent = mensaje;
            const header = toastEl.querySelector('.toast-header');
            if (header) {
                header.style.backgroundColor = tipo === 'danger'
                    ? 'var(--cora-accent)' : 'var(--cora-success)';
            }
            bootstrap.Toast.getOrCreateInstance(toastEl).show();
        }

        function escaparHTML(str) {
            return String(str || '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        function badgeEstadoMisHTML(estado) {
            const mapa = {
                'pendiente': { texto: '⏳ Pendiente', clase: 'bg-warning text-dark' },
                'aprobada':  { texto: '✅ Aprobada',  clase: 'bg-success' },
                'rechazada': { texto: '❌ Rechazada', clase: 'bg-danger' },
                'cancelada': { texto: '🚫 Cancelada', clase: 'bg-dark' }
            };
            const info = mapa[estado] || mapa['pendiente'];
            return '<span class="badge badge-estado ' + info.clase + '">' + info.texto + '</span>';
        }

        // Renderiza solo las solicitudes del usuario actual
        function renderMisSolicitudes() {
            const todas = window.swcoraSolicitudes.cargar();
            const mias = todas.filter(s => s.usuario === USUARIO_ACTUAL);

            tbodyMisSolicitudes.innerHTML = '';

            mias.forEach(function (s) {
                const fila = document.createElement('tr');
                fila.className = 'solicitud-row';
                fila.setAttribute('data-id', s.id);
                fila.setAttribute('data-estado', s.estado);
                fila.setAttribute('data-usuario', s.usuario);
                fila.setAttribute('data-modulo', s.modulo);
                fila.setAttribute('data-aprobador', s.aprobador);

                const esPendiente = s.estado === 'pendiente';
                const acciones = esPendiente
                    ? '<button class="btn btn-sm btn-outline-danger btn-cancelar-mi-solicitud" title="Cancelar">' +
                        '<i class="bi bi-dash-circle"></i></button>'
                    : '';

                const respuestaClase = s.estado === 'rechazada' ? 'text-danger' : 'text-muted';
                const respuestaTexto = s.respuesta || 'En revisión';

                fila.innerHTML =
                    '<td>' + escaparHTML(s.fechaVisible) + '</td>' +
                    '<td>' + escaparHTML(s.modulo) + '</td>' +
                    '<td>' + escaparHTML(s.rol) + '</td>' +
                    '<td>' + escaparHTML(s.aprobador) + '</td>' +
                    '<td>' + badgeEstadoMisHTML(s.estado) + '</td>' +
                    '<td><small class="' + respuestaClase + '">' + escaparHTML(respuestaTexto) + '</small></td>' +
                    '<td class="text-center">' + acciones + '</td>';

                tbodyMisSolicitudes.appendChild(fila);
            });

            if (totalMisSolicitudesEl) totalMisSolicitudesEl.textContent = mias.length;

            aplicarFiltrosMis();
        }

        // Filtros de "Mis Solicitudes"
        function aplicarFiltrosMis() {
            const buscar = normalizarMis(filtroMisBuscar.value);
            const estado = filtroMisEstado.value;

            let visibles = 0;

            tbodyMisSolicitudes.querySelectorAll('.solicitud-row').forEach(function (fila) {
                const filaEstado = fila.getAttribute('data-estado');
                const filaModulo = normalizarMis(fila.getAttribute('data-modulo'));
                const filaAprobador = normalizarMis(fila.getAttribute('data-aprobador'));

                const coincideBuscar = !buscar ||
                    filaModulo.includes(buscar) ||
                    filaAprobador.includes(buscar);

                const coincideEstado = (estado === 'todas') || (filaEstado === estado);
                const visible = coincideBuscar && coincideEstado;

                fila.classList.toggle('d-none', !visible);
                if (visible) visibles++;
            });

            if (contadorMisMostrados) contadorMisMostrados.textContent = visibles;
        }

        if (filtroMisBuscar) filtroMisBuscar.addEventListener('input', aplicarFiltrosMis);
        if (filtroMisEstado) filtroMisEstado.addEventListener('change', aplicarFiltrosMis);

        if (btnLimpiarFiltrosMis) {
            btnLimpiarFiltrosMis.addEventListener('click', function () {
                filtroMisBuscar.value = '';
                filtroMisEstado.value = 'todas';
                aplicarFiltrosMis();
            });
        }

        // Delegación: clic en Cancelar
        tbodyMisSolicitudes.addEventListener('click', function (e) {
            const btnCancelar = e.target.closest('.btn-cancelar-mi-solicitud');
            if (!btnCancelar) return;

            filaCancelando = btnCancelar.closest('.solicitud-row');
            if (!filaCancelando) return;

            bootstrap.Modal.getOrCreateInstance(modalCancelarEl).show();
        });

        // Confirmar cancelación (cambia estado a "cancelada", no elimina)
        if (btnConfirmarCancelar) {
            btnConfirmarCancelar.addEventListener('click', function () {
                if (!filaCancelando) {
                    bootstrap.Modal.getInstance(modalCancelarEl).hide();
                    return;
                }

                const id = filaCancelando.getAttribute('data-id');
                window.swcoraSolicitudes.actualizar(id, {
                    estado: 'cancelada',
                    respuesta: 'Cancelada por ' + USUARIO_ACTUAL
                });

                bootstrap.Modal.getInstance(modalCancelarEl).hide();
                mostrarToastMis('Solicitud cancelada', 'La solicitud fue marcada como Cancelada.', 'danger');

                filaCancelando = null;
                renderMisSolicitudes();
            });
        }

        if (modalCancelarEl) {
            modalCancelarEl.addEventListener('hidden.bs.modal', () => filaCancelando = null);
        }

        renderMisSolicitudes();
    }

    // =============================================
    // SALIDAS DETALLES: leer de URL, renderizar y acciones
    // =============================================
    const detallesContainer = document.getElementById('detallesSalidaContainer');

    if (detallesContainer) {
        const params = new URLSearchParams(window.location.search);
        const folioParam = params.get('folio');
        const idParam = params.get('id');
        const rolParam = params.get('rol');

        // Buscar la salida por id o por folio
        let salida = null;
        if (idParam) salida = window.swcoraSalidas.porId(idParam);
        if (!salida && folioParam) salida = window.swcoraSalidas.porFolio(folioParam);

        const toastEl = document.getElementById('toastDetSalida');
        const toastTitulo = document.getElementById('toastDetTitulo');
        const toastMensaje = document.getElementById('toastDetMensaje');

        function mostrarToastDet(titulo, mensaje, tipo) {
            if (!toastEl) return;
            if (toastTitulo) toastTitulo.textContent = titulo;
            if (toastMensaje) toastMensaje.textContent = mensaje;
            const header = toastEl.querySelector('.toast-header');
            if (header) {
                header.style.backgroundColor = tipo === 'danger'
                    ? 'var(--cora-accent)' : 'var(--cora-success)';
            }
            bootstrap.Toast.getOrCreateInstance(toastEl).show();
        }

        function escaparHTML(str) {
            return String(str || '')
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
        }

        if (!salida) {
            detallesContainer.innerHTML = '<div class="alert alert-danger"><i class="bi bi-exclamation-triangle"></i> No se encontró la salida solicitada.</div>';
        } else {
            // Helpers tolerantes a campos inexistentes
            function setText(id, val) {
                const el = document.getElementById(id);
                if (el) el.textContent = (val == null || val === '') ? '—' : val;
            }
            function setHTML(id, html) {
                const el = document.getElementById(id);
                if (el) el.innerHTML = html;
            }

            // ---------- Header ----------
            document.getElementById('detFolio').textContent = salida.folio || '(sin folio)';

            // Calcular esAprobador para el badge
            let esAprobadorHeader = false;
            if (salida.estado === 'pendiente') {
                if (rolParam === 'aprobador') {
                    esAprobadorHeader = true;
                } else if (rolParam === 'solicitante') {
                    esAprobadorHeader = false;
                } else {
                    esAprobadorHeader = !!salida.aprobador && salida.aprobador === USUARIO_ACTUAL;
                }
            }

            const badgeMap = {
                'borrador':  { texto: '📝 Borrador',  clase: 'bg-secondary' },
                'aprobada':  { texto: '✅ Aprobada',  clase: 'bg-success' },
                'rechazada': { texto: '❌ Rechazada', clase: 'bg-danger' },
                'cancelada': { texto: '🚫 Cancelada', clase: 'bg-dark' }
            };

            let badgeHTML;
            if (salida.estado === 'pendiente') {
                const textoPend = esAprobadorHeader ? '⏳ Pendiente (Aprobador)' : '⏳ Pendiente';
                badgeHTML = '<span class="badge bg-warning text-dark">' + textoPend + '</span>';
            } else {
                const info = badgeMap[salida.estado] || badgeMap['borrador'];
                badgeHTML = '<span class="badge ' + info.clase + '">' + info.texto + '</span>';
            }
            setHTML('detEstado', badgeHTML);

            // ---------- Aprobación ----------
            document.getElementById('detAprobador').textContent = salida.aprobador || '—';
            document.getElementById('detAprobadoPor').textContent = salida.aprobadoPor || '—';
            document.getElementById('detFechaAprobacion').textContent = salida.fechaAprobacion || '—';

            // ---------- Materiales ----------
            const tbodyMat = document.getElementById('detMaterialesBody');
            tbodyMat.innerHTML = '';
            (salida.materialesLista || []).forEach(function (m, i) {
                const tr = document.createElement('tr');
                tr.innerHTML =
                    '<td>' + (i + 1) + '</td>' +
                    '<td>' + escaparHTML(m.cantidad) + '</td>' +
                    '<td>' + escaparHTML(obtenerDescripcionUnidad(m.unidad)) + '</td>' +
                    '<td>' + escaparHTML(m.descripcion) + '</td>' +
                    '<td>' + (m.comentario ? escaparHTML(m.comentario) : '—') + '</td>';
                tbodyMat.appendChild(tr);
            });

            // ---------- Info General ----------
            setText('detInfoDefinitiva', salida.esDefinitiva ? 'Sí' : 'No');
            setText('detInfoRetorno', salida.retornoEsperado || '—');
            setText('detInfoUsuario', salida.usuario || '—');
            setText('detInfoDepto', salida.departamento || '—');
            setText('detInfoCreada', salida.fechaCreacion || '—');

            // ---------- Empresa ----------
            setText('detEmpresa', salida.empresa || '—');
            const tipoBadge = { 'Proveedor': 'bg-warning', 'Cliente': 'bg-danger', 'Mensajería': 'bg-secondary', 'Filial': 'bg-info' }[salida.tipoEmpresa] || 'bg-secondary';
            setHTML('detTipoEmpresa', salida.tipoEmpresa
                ? '<span class="badge ' + tipoBadge + '">' + escaparHTML(salida.tipoEmpresa) + '</span>'
                : '—');
            setText('detContacto', salida.contacto || '—');

            // ---------- Descripción ----------
            setText('detDescripcion', salida.descripcion || '—');
            setText('detCausa', salida.causa || '—');
            setText('detCategoria', salida.categoria || '—');
            setText('detComentarios', salida.comentarios || '—');

            // ---------- Historial ----------
            const tbodyHist = document.getElementById('detHistorialBody');
            tbodyHist.innerHTML =
                '<tr><td>' + escaparHTML(salida.fechaCreacion) + '</td><td>' + escaparHTML(salida.creadoPor) + '</td><td><span class="badge bg-primary">Creación</span></td><td>Salida creada</td></tr>' +
                (salida.estado !== 'borrador' ? '<tr><td>' + escaparHTML(salida.fechaCreacion) + '</td><td>' + escaparHTML(salida.creadoPor) + '</td><td><span class="badge bg-info">Envío</span></td><td>Folio ' + escaparHTML(salida.folio) + ' asignado</td></tr>' : '') +
                (salida.estado === 'aprobada' ? '<tr><td>' + escaparHTML(salida.fechaAprobacion) + '</td><td>' + escaparHTML(salida.aprobadoPor) + '</td><td><span class="badge bg-success">Aprobación</span></td><td>Salida aprobada</td></tr>' : '') +
                (salida.estado === 'rechazada' ? '<tr><td>' + escaparHTML(salida.fechaAprobacion) + '</td><td>' + escaparHTML(salida.aprobadoPor) + '</td><td><span class="badge bg-danger">Rechazo</span></td><td>Motivo: ' + escaparHTML(salida.motivo) + '</td></tr>' : '') +
                (salida.estado === 'cancelada' ? '<tr><td>—</td><td>—</td><td><span class="badge bg-dark">Cancelación</span></td><td>Motivo: ' + escaparHTML(salida.motivo) + '</td></tr>' : '');

            // ---------- Botones dinámicos ----------
            const contBotones = document.getElementById('detBotonesAccion');

            // Calcular esAprobador para botones
            let esAprobador = false;
            if (salida.estado === 'pendiente') {
                if (rolParam === 'aprobador') {
                    esAprobador = true;
                } else if (rolParam === 'solicitante') {
                    esAprobador = false;
                } else {
                    esAprobador = !!salida.aprobador && salida.aprobador === USUARIO_ACTUAL;
                }
            }

            let htmlBotones = '';

            if (esAprobador) {
                htmlBotones += ' <button class="btn btn-success" id="btnDetAprobar"><i class="bi bi-check-circle"></i> Aprobar</button>';
                htmlBotones += ' <button class="btn btn-danger" id="btnDetRechazar"><i class="bi bi-x-circle"></i> Rechazar</button>';
            }

            if (salida.estado === 'pendiente' && !esAprobador) {
                htmlBotones += ' <button class="btn btn-danger" id="btnDetCancelar"><i class="bi bi-dash-circle"></i> Cancelar</button>';
            }

            if (salida.estado === 'aprobada') {
                htmlBotones += ' <button class="btn btn-outline-primary" id="btnDetPDF"><i class="bi bi-file-pdf"></i> PDF</button>';
            }

            if (salida.estado === 'borrador' || salida.estado === 'cancelada') {
                htmlBotones += ' <a href="salidas-editar.html?id=' + encodeURIComponent(salida.id) + '" class="btn btn-outline-success"><i class="bi bi-pencil"></i> Editar</a>';
            }

            if (salida.estado === 'borrador' && !salida.folio) {
                htmlBotones += ' <button class="btn btn-outline-danger" id="btnDetEliminar"><i class="bi bi-trash"></i> Eliminar</button>';
            }

            contBotones.innerHTML = htmlBotones;

            // ---------- Listeners de acciones ----------

            // Aprobar
            const btnAprobar = document.getElementById('btnDetAprobar');
            if (btnAprobar) {
                btnAprobar.addEventListener('click', function () {
                    window.swcoraSalidas.actualizar(salida.id, {
                        estado: 'aprobada',
                        aprobadoPor: USUARIO_ACTUAL,
                        fechaAprobacion: new Date().toLocaleString('es-MX')
                    });
                    mostrarToastDet('Salida aprobada', 'La solicitud fue aprobada correctamente.', 'success');
                    setTimeout(function () { window.location.href = 'salidas-index.html'; }, 1500);
                });
            }

            // Rechazar (modal)
            const btnRechazar = document.getElementById('btnDetRechazar');
            const modalRechazarDetEl = document.getElementById('modalRechazarSalida');
            if (btnRechazar && modalRechazarDetEl) {
                btnRechazar.addEventListener('click', function () {
                    const inputFolio = document.getElementById('rechazarFolio');
                    const inputMotivo = document.getElementById('rechazarMotivo');
                    if (inputFolio) inputFolio.textContent = salida.folio || '—';
                    if (inputMotivo) { inputMotivo.value = ''; inputMotivo.classList.remove('is-invalid'); }
                    bootstrap.Modal.getOrCreateInstance(modalRechazarDetEl).show();
                });

                const btnConfirmarRechazo = document.getElementById('btnConfirmarRechazo');
                if (btnConfirmarRechazo) {
                    btnConfirmarRechazo.addEventListener('click', function () {
                        const inputMotivo = document.getElementById('rechazarMotivo');
                        const motivo = inputMotivo.value.trim();
                        if (!motivo) { inputMotivo.classList.add('is-invalid'); inputMotivo.focus(); return; }
                        inputMotivo.classList.remove('is-invalid');

                        window.swcoraSalidas.actualizar(salida.id, {
                            estado: 'rechazada',
                            motivo: motivo,
                            aprobadoPor: USUARIO_ACTUAL,
                            fechaAprobacion: new Date().toLocaleString('es-MX')
                        });
                        bootstrap.Modal.getInstance(modalRechazarDetEl).hide();
                        mostrarToastDet('Salida rechazada', 'La solicitud fue rechazada. Motivo: ' + motivo, 'danger');
                        setTimeout(function () { window.location.href = 'salidas-index.html'; }, 1500);
                    });
                }
            }

            // Cancelar (modal)
            const btnCancelar = document.getElementById('btnDetCancelar');
            const modalCancelarDetEl = document.getElementById('modalCancelarSalida');
            if (btnCancelar && modalCancelarDetEl) {
                btnCancelar.addEventListener('click', function () {
                    const inputFolio = document.getElementById('cancelarFolio');
                    const inputMotivo = document.getElementById('cancelarMotivo');
                    if (inputFolio) inputFolio.textContent = salida.folio || '—';
                    if (inputMotivo) { inputMotivo.value = ''; inputMotivo.classList.remove('is-invalid'); }
                    bootstrap.Modal.getOrCreateInstance(modalCancelarDetEl).show();
                });

                const btnConfirmarCancelacion = document.getElementById('btnConfirmarCancelacion');
                if (btnConfirmarCancelacion) {
                    btnConfirmarCancelacion.addEventListener('click', function () {
                        const inputMotivo = document.getElementById('cancelarMotivo');
                        const motivo = inputMotivo.value.trim();
                        if (!motivo) { inputMotivo.classList.add('is-invalid'); inputMotivo.focus(); return; }
                        inputMotivo.classList.remove('is-invalid');

                        window.swcoraSalidas.actualizar(salida.id, {
                            estado: 'cancelada',
                            motivo: motivo
                        });
                        bootstrap.Modal.getInstance(modalCancelarDetEl).hide();
                        mostrarToastDet('Salida cancelada', 'La solicitud fue cancelada. Motivo: ' + motivo, 'danger');
                        setTimeout(function () { window.location.href = 'salidas-index.html'; }, 1500);
                    });
                }
            }

            // PDF
            const btnPDF = document.getElementById('btnDetPDF');
            if (btnPDF) {
                btnPDF.addEventListener('click', function () {
                    const blob = new Blob([''], { type: 'application/pdf' });
                    const url = URL.createObjectURL(blob);
                    const enlace = document.createElement('a');
                    enlace.href = url;
                    enlace.download = 'salida_' + (salida.folio || salida.id) + '.pdf';
                    enlace.style.display = 'none';
                    document.body.appendChild(enlace);
                    enlace.click();
                    document.body.removeChild(enlace);
                    URL.revokeObjectURL(url);
                    mostrarToastDet('PDF generado', 'Se descargó el archivo PDF.', 'success');
                });
            }

            // Eliminar (modal)
            const btnEliminar = document.getElementById('btnDetEliminar');
            const modalEliminarDetEl = document.getElementById('modalEliminarSalida');
            if (btnEliminar && modalEliminarDetEl) {
                btnEliminar.addEventListener('click', function () {
                    bootstrap.Modal.getOrCreateInstance(modalEliminarDetEl).show();
                });

                const btnConfirmarEliminacion = document.getElementById('btnConfirmarEliminacion');
                if (btnConfirmarEliminacion) {
                    btnConfirmarEliminacion.addEventListener('click', function () {
                        window.swcoraSalidas.eliminar(salida.id);
                        bootstrap.Modal.getInstance(modalEliminarDetEl).hide();
                        mostrarToastDet('Borrador eliminado', 'El registro fue eliminado.', 'danger');
                        setTimeout(function () { window.location.href = 'salidas-index.html'; }, 1500);
                    });
                }
            }
        }
    }

    // =============================================
    // SALIDAS EDITAR: precargar y guardar
    // =============================================
    const editContainer = document.querySelector('.salida-form-grid');
    const tbodyMaterialesEdit = document.getElementById('tbodyMateriales');

    const btnGuardarCambios = document.getElementById('btnGuardarCambiosSalida');
    const btnConfirmarEnvioAprob = document.getElementById('btnConfirmarEnvioAprobacion');
    const btnEnviarAprobacion = document.getElementById('btnEnviarAprobacion');

    const toastEditarEl = document.getElementById('toastEditarSalida');
    const toastEditarTitulo = document.getElementById('toastEditarTitulo');
    const toastEditarMensaje = document.getElementById('toastEditarMensaje');

    function mostrarToastEditar(titulo, mensaje, tipo, callback) {
        if (!toastEditarEl) {
            if (callback) callback();
            return;
        }
        if (toastEditarTitulo) toastEditarTitulo.textContent = titulo;
        if (toastEditarMensaje) toastEditarMensaje.textContent = mensaje;

        const header = toastEditarEl.querySelector('.toast-header');
        if (header) {
            header.style.backgroundColor = tipo === 'danger'
                ? 'var(--cora-accent)' : 'var(--cora-success)';
        }

        if (callback) {
            const handler = function () {
                toastEditarEl.removeEventListener('hidden.bs.toast', handler);
                callback();
            };
            toastEditarEl.addEventListener('hidden.bs.toast', handler);
        }

        bootstrap.Toast.getOrCreateInstance(toastEditarEl).show();
    }

    if (btnGuardarCambios || btnConfirmarEnvioAprob) {
        const params = new URLSearchParams(window.location.search);
        const idEdit = params.get('id') || params.get('folio');

        let salidaEditando = null;
        if (idEdit) {
            salidaEditando = window.swcoraSalidas.porId(idEdit) || window.swcoraSalidas.porFolio(idEdit);
        }

        // Precargar datos del formulario
        if (salidaEditando) {
            const setVal = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
            setVal('editDescripcion', salidaEditando.descripcion);
            setVal('editCausa', salidaEditando.causa);
            setVal('editCategoria', salidaEditando.categoria);
            setVal('editComentarios', salidaEditando.comentarios);
            setVal('contactoInput', salidaEditando.contacto);

            const chkDefinitiva = document.getElementById('esDefinitiva');
            if (chkDefinitiva) {
                chkDefinitiva.checked = !!salidaEditando.esDefinitiva;
                chkDefinitiva.dispatchEvent(new Event('change'));
            }

            const retorno = document.getElementById('retornoEsperado');
            if (retorno) retorno.value = salidaEditando.retornoEsperado || '';

            // Precargar materiales
            if (tbodyMaterialesEdit && Array.isArray(salidaEditando.materialesLista)) {
                tbodyMaterialesEdit.innerHTML = '';

                // Unidades activas desde localStorage (consistente con admin-unidades)
                const unidadesActivas = cargarUnidades().filter(u => u.activo !== false);

                salidaEditando.materialesLista.forEach(function (m, i) {
                    const opcionesUnidad = unidadesActivas.map(function (u) {
                        return '<option value="' + u.codigo + '"' +
                            (u.codigo === m.unidad ? ' selected' : '') + '>' +
                            u.descripcion + '</option>';
                    }).join('');

                    const tr = document.createElement('tr');
                    tr.className = 'material-row';
                    tr.innerHTML =
                        '<td class="numero-linea">' + (i + 1) + '</td>' +
                        '<td><input type="number" class="form-control form-control-sm input-cantidad" value="' + (m.cantidad || 1) + '" step="1" min="1"></td>' +
                        '<td><select class="form-select form-select-sm input-unidad">' +
                            opcionesUnidad +
                        '</select></td>' +
                        '<td><input type="text" class="form-control form-control-sm input-descripcion" value="' + String(m.descripcion || '').replace(/"/g, '&quot;') + '"></td>' +
                        '<td><input type="text" class="form-control form-control-sm input-comentario" value="' + String(m.comentario || '').replace(/"/g, '&quot;') + '"></td>' +
                        '<td class="text-center"><button type="button" class="btn btn-sm btn-outline-danger btn-eliminar-material" title="Eliminar"><i class="bi bi-trash"></i></button></td>';
                    tbodyMaterialesEdit.appendChild(tr);
                });
                const contMat = document.getElementById('contadorMateriales');
                if (contMat) contMat.textContent = salidaEditando.materialesLista.length;
            }

            // Título
            const h2 = document.querySelector('.container-fluid h2');
            if (h2) h2.innerHTML = '<i class="bi bi-pencil"></i> Editar Salida' + (salidaEditando.folio ? ' (Folio ' + salidaEditando.folio + ')' : ' (Sin Folio)');
        }

        // Lee los materiales del formulario
        function leerMaterialesFormulario() {
            if (!tbodyMaterialesEdit) return [];
            const lista = [];
            tbodyMaterialesEdit.querySelectorAll('.material-row').forEach(function (fila) {
                const cant = parseFloat(fila.querySelector('.input-cantidad').value) || 0;
                const uni = fila.querySelector('.input-unidad').value;
                const desc = fila.querySelector('.input-descripcion').value.trim();
                const com = fila.querySelector('.input-comentario').value.trim();
                if (desc) lista.push({ cantidad: cant, unidad: uni, descripcion: desc, comentario: com });
            });
            return lista;
        }

        // ---------- Guardar cambios ----------
        if (btnGuardarCambios) {
            btnGuardarCambios.addEventListener('click', function () {
                if (!salidaEditando) {
                    mostrarToastEditar('Error', 'No hay salida cargada.', 'danger');
                    return;
                }

                btnGuardarCambios.disabled = true;
                const textoOriginal = btnGuardarCambios.innerHTML;
                btnGuardarCambios.innerHTML =
                    '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

                const mat = leerMaterialesFormulario();

                // Si estaba cancelada, al guardar vuelve a borrador (conserva folio)
                const cambios = {
                    descripcion: document.getElementById('editDescripcion').value.trim(),
                    causa: document.getElementById('editCausa').value.trim(),
                    categoria: document.getElementById('editCategoria').value.trim(),
                    comentarios: document.getElementById('editComentarios').value.trim(),
                    contacto: document.getElementById('contactoInput').value.trim(),
                    esDefinitiva: document.getElementById('esDefinitiva').checked,
                    retornoEsperado: document.getElementById('retornoEsperado').value,
                    materialesLista: mat,
                    materiales: mat.length
                };

                if (salidaEditando.estado === 'cancelada') {
                    cambios.estado = 'borrador';
                    cambios.motivo = '';
                }

                window.swcoraSalidas.actualizar(salidaEditando.id, cambios);

                const mensaje = salidaEditando.estado === 'cancelada'
                    ? 'Los cambios se guardaron. La salida volvió a estado Borrador conservando el folio ' + (salidaEditando.folio || '') + '.'
                    : 'Los cambios se guardaron correctamente.';

                mostrarToastEditar(
                    'Cambios guardados',
                    mensaje,
                    'success',
                    function () {
                        window.location.href = 'salidas-index.html';
                    }
                );
            });
        }

        // ---------- Enviar a aprobación ----------
        if (btnConfirmarEnvioAprob) {
            btnConfirmarEnvioAprob.addEventListener('click', function () {
                const selectAprob = document.getElementById('selectAprobadorSalida');
                if (!selectAprob || !selectAprob.value) {
                    if (selectAprob) selectAprob.classList.add('is-invalid');
                    return;
                }
                if (selectAprob) selectAprob.classList.remove('is-invalid');

                if (!salidaEditando) {
                    mostrarToastEditar('Error', 'No hay salida cargada.', 'danger');
                    return;
                }

                btnConfirmarEnvioAprob.disabled = true;
                const textoOriginalConfirmar = btnConfirmarEnvioAprob.innerHTML;
                btnConfirmarEnvioAprob.innerHTML =
                    '<span class="spinner-border spinner-border-sm me-1"></span> Enviando...';

                let textoOriginalEnviar = '';
                if (btnEnviarAprobacion) {
                    btnEnviarAprobacion.disabled = true;
                    textoOriginalEnviar = btnEnviarAprobacion.innerHTML;
                    btnEnviarAprobacion.innerHTML =
                        '<span class="spinner-border spinner-border-sm me-1"></span> Enviando...';
                }

                const mat = leerMaterialesFormulario();
                const folio = salidaEditando.folio || window.swcoraSalidas.siguienteFolio();

                window.swcoraSalidas.actualizar(salidaEditando.id, {
                    estado: 'pendiente',
                    folio: folio,
                    aprobador: selectAprob.value,
                    descripcion: document.getElementById('editDescripcion').value.trim(),
                    causa: document.getElementById('editCausa').value.trim(),
                    categoria: document.getElementById('editCategoria').value.trim(),
                    comentarios: document.getElementById('editComentarios').value.trim(),
                    contacto: document.getElementById('contactoInput').value.trim(),
                    esDefinitiva: document.getElementById('esDefinitiva').checked,
                    retornoEsperado: document.getElementById('retornoEsperado').value,
                    materialesLista: mat,
                    materiales: mat.length
                });

                // Cerrar modal inmediatamente
                const modalEl = document.getElementById('modalEnviarAprobacion');
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) {
                        modalInstance.hide();
                    } else {
                        modalEl.classList.remove('show');
                        modalEl.style.display = 'none';
                        modalEl.setAttribute('aria-hidden', 'true');
                        document.body.classList.remove('modal-open');
                        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                    }
                }

                mostrarToastEditar(
                    'Salida enviada a aprobación',
                    'La salida se envió con folio ' + folio + '.',
                    'success',
                    function () {
                        window.location.href = 'salidas-index.html';
                    }
                );

                // Red de seguridad: restaurar botones si no redirige
                setTimeout(function () {
                    if (btnConfirmarEnvioAprob) {
                        btnConfirmarEnvioAprob.disabled = false;
                        btnConfirmarEnvioAprob.innerHTML = textoOriginalConfirmar;
                    }
                    if (btnEnviarAprobacion) {
                        btnEnviarAprobacion.disabled = false;
                        btnEnviarAprobacion.innerHTML = textoOriginalEnviar;
                    }
                }, 3000);
            });
        }
    }

    // =============================================
    // SALIDAS CREAR: Guardar borrador + Enviar a aprobación
    // =============================================
    const btnGuardarBorrador = document.getElementById('btnGuardarBorrador');
    const btnEnviarAprobacionCrear = document.getElementById('btnEnviarAprobacion');
    const btnConfirmarEnvioCrear = document.getElementById('btnConfirmarEnvioCrear');

    if (btnGuardarBorrador || btnConfirmarEnvioCrear) {
        const tbodyMaterialesCrear = document.getElementById('tbodyMateriales');
        const contadorMaterialesCrear = document.getElementById('contadorMateriales');

        const toastCrearEl = document.getElementById('toastCrearSalida');
        const toastCrearTitulo = document.getElementById('toastCrearTitulo');
        const toastCrearMensaje = document.getElementById('toastCrearMensaje');

        function mostrarToastCrear(titulo, mensaje, tipo, callback) {
            if (!toastCrearEl) {
                if (callback) callback();
                return;
            }
            if (toastCrearTitulo) toastCrearTitulo.textContent = titulo;
            if (toastCrearMensaje) toastCrearMensaje.textContent = mensaje;

            const header = toastCrearEl.querySelector('.toast-header');
            if (header) {
                header.style.backgroundColor = tipo === 'danger'
                    ? 'var(--cora-accent)' : 'var(--cora-success)';
            }

            if (callback) {
                const handler = function () {
                    toastCrearEl.removeEventListener('hidden.bs.toast', handler);
                    callback();
                };
                toastCrearEl.addEventListener('hidden.bs.toast', handler);
            }

            bootstrap.Toast.getOrCreateInstance(toastCrearEl).show();
        }

        // Lee los materiales del formulario
        function leerMaterialesCrear() {
            if (!tbodyMaterialesCrear) return [];
            const lista = [];
            tbodyMaterialesCrear.querySelectorAll('.material-row').forEach(function (fila) {
                const cant = parseFloat(fila.querySelector('.input-cantidad').value) || 0;
                const uni = fila.querySelector('.input-unidad').value;
                const desc = fila.querySelector('.input-descripcion').value.trim();
                const com = fila.querySelector('.input-comentario').value.trim();
                if (desc) {
                    lista.push({ cantidad: cant, unidad: uni, descripcion: desc, comentario: com });
                }
            });
            return lista;
        }

        // Lee los datos generales del formulario
        function leerDatosCrear() {
            const selectEmpresa = document.getElementById('selectEmpresa');
            const empresaTexto = selectEmpresa && selectEmpresa.selectedIndex > 0
                ? selectEmpresa.options[selectEmpresa.selectedIndex].textContent.trim()
                : '';
            const empresa = empresaTexto.replace(/\s*\([^)]*\)\s*$/, '').trim();

            let tipoEmpresa = '';
            if (/\(Proveedor\)/i.test(empresaTexto)) tipoEmpresa = 'Proveedor';
            else if (/\(Cliente\)/i.test(empresaTexto)) tipoEmpresa = 'Cliente';
            else if (/\(Mensajería\)/i.test(empresaTexto)) tipoEmpresa = 'Mensajería';
            else if (/\(Filial\)/i.test(empresaTexto)) tipoEmpresa = 'Filial';

            const hoy = new Date();
            const pad = n => String(n).padStart(2, '0');
            const fechaISO = hoy.getFullYear() + '-' + pad(hoy.getMonth() + 1) + '-' + pad(hoy.getDate());
            const fechaVisible = pad(hoy.getDate()) + '/' + pad(hoy.getMonth() + 1) + '/' + hoy.getFullYear();
            const horaVisible = pad(hoy.getHours()) + ':' + pad(hoy.getMinutes());

            return {
                fecha: fechaISO,
                fechaVisible: fechaVisible,
                fechaCreacion: fechaVisible + ' ' + horaVisible,
                usuario: USUARIO_ACTUAL,
                creadoPor: USUARIO_ACTUAL,
                departamento: 'Sistemas',
                empresa: empresa,
                tipoEmpresa: tipoEmpresa,
                contacto: (document.getElementById('contactoInput') || {}).value?.trim() || '',
                esDefinitiva: (document.getElementById('esDefinitiva') || {}).checked || false,
                retornoEsperado: (document.getElementById('retornoEsperado') || {}).value || '',
                descripcion: (document.getElementById('crearDescripcion') || {}).value?.trim() || '',
                causa: (document.getElementById('crearCausa') || {}).value?.trim() || '',
                categoria: (document.getElementById('crearCategoria') || {}).value?.trim() || '',
                comentarios: (document.getElementById('crearComentarios') || {}).value?.trim() || ''
            };
        }

        // Validación básica
        function validarFormularioCrear() {
            const datos = leerDatosCrear();
            const materiales = leerMaterialesCrear();

            if (!datos.empresa) {
                mostrarToastCrear('Falta empresa', 'Debes seleccionar una empresa.', 'danger');
                return null;
            }
            if (!datos.descripcion) {
                mostrarToastCrear('Falta descripción', 'Debes escribir una descripción.', 'danger');
                return null;
            }
            if (materiales.length === 0) {
                mostrarToastCrear('Sin materiales', 'Debes agregar al menos un material con descripción.', 'danger');
                return null;
            }

            return { datos: datos, materiales: materiales };
        }

        // ---------- Guardar Borrador ----------
        if (btnGuardarBorrador) {
            btnGuardarBorrador.addEventListener('click', function () {
                const validado = validarFormularioCrear();
                if (!validado) return;

                btnGuardarBorrador.disabled = true;
                const textoOriginal = btnGuardarBorrador.innerHTML;
                btnGuardarBorrador.innerHTML =
                    '<span class="spinner-border spinner-border-sm me-1"></span> Guardando...';

                const { datos, materiales } = validado;

                const nueva = window.swcoraSalidas.agregar({
                    folio: '',
                    estado: 'borrador',
                    motivo: '',
                    aprobador: '',
                    aprobadoPor: '',
                    fechaAprobacion: '',
                    fecha: datos.fecha,
                    fechaVisible: datos.fechaVisible,
                    fechaCreacion: datos.fechaCreacion,
                    usuario: datos.usuario,
                    creadoPor: datos.creadoPor,
                    departamento: datos.departamento,
                    empresa: datos.empresa,
                    tipoEmpresa: datos.tipoEmpresa,
                    contacto: datos.contacto,
                    esDefinitiva: datos.esDefinitiva,
                    retornoEsperado: datos.retornoEsperado,
                    descripcion: datos.descripcion,
                    causa: datos.causa,
                    categoria: datos.categoria,
                    comentarios: datos.comentarios,
                    materiales: materiales.length,
                    materialesLista: materiales
                });

                mostrarToastCrear(
                    'Borrador guardado',
                    'La salida se guardó como borrador.',
                    'success',
                    function () {
                        window.location.href = 'salidas-index.html';
                    }
                );
            });
        }

        // ---------- Confirmar Envío a Aprobación ----------
        if (btnConfirmarEnvioCrear) {
            btnConfirmarEnvioCrear.addEventListener('click', function () {
                const selectAprob = document.getElementById('selectAprobadorCrear');
                if (!selectAprob || !selectAprob.value) {
                    if (selectAprob) selectAprob.classList.add('is-invalid');
                    return;
                }
                if (selectAprob) selectAprob.classList.remove('is-invalid');

                const validado = validarFormularioCrear();
                if (!validado) return;

                btnConfirmarEnvioCrear.disabled = true;
                const textoOriginalConfirmar = btnConfirmarEnvioCrear.innerHTML;
                btnConfirmarEnvioCrear.innerHTML =
                    '<span class="spinner-border spinner-border-sm me-1"></span> Enviando...';

                let textoOriginalEnviar = '';
                if (btnEnviarAprobacionCrear) {
                    btnEnviarAprobacionCrear.disabled = true;
                    textoOriginalEnviar = btnEnviarAprobacionCrear.innerHTML;
                    btnEnviarAprobacionCrear.innerHTML =
                        '<span class="spinner-border spinner-border-sm me-1"></span> Enviando...';
                }

                const { datos, materiales } = validado;
                const folio = window.swcoraSalidas.siguienteFolio();

                window.swcoraSalidas.agregar({
                    folio: folio,
                    estado: 'pendiente',
                    motivo: '',
                    aprobador: selectAprob.value,
                    aprobadoPor: '',
                    fechaAprobacion: '',
                    fecha: datos.fecha,
                    fechaVisible: datos.fechaVisible,
                    fechaCreacion: datos.fechaCreacion,
                    usuario: datos.usuario,
                    creadoPor: datos.creadoPor,
                    departamento: datos.departamento,
                    empresa: datos.empresa,
                    tipoEmpresa: datos.tipoEmpresa,
                    contacto: datos.contacto,
                    esDefinitiva: datos.esDefinitiva,
                    retornoEsperado: datos.retornoEsperado,
                    descripcion: datos.descripcion,
                    causa: datos.causa,
                    categoria: datos.categoria,
                    comentarios: datos.comentarios,
                    materiales: materiales.length,
                    materialesLista: materiales
                });

                // Cerrar modal inmediatamente
                const modalEl = document.getElementById('modalEnviarAprobacion');
                if (modalEl) {
                    const modalInstance = bootstrap.Modal.getInstance(modalEl);
                    if (modalInstance) {
                        modalInstance.hide();
                    } else {
                        modalEl.classList.remove('show');
                        modalEl.style.display = 'none';
                        modalEl.setAttribute('aria-hidden', 'true');
                        document.body.classList.remove('modal-open');
                        document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                    }
                }

                mostrarToastCrear(
                    'Salida enviada a aprobación',
                    'La salida se envió con folio ' + folio + '.',
                    'success',
                    function () {
                        window.location.href = 'salidas-index.html';
                    }
                );

                // Red de seguridad
                setTimeout(function () {
                    if (btnConfirmarEnvioCrear) {
                        btnConfirmarEnvioCrear.disabled = false;
                        btnConfirmarEnvioCrear.innerHTML = textoOriginalConfirmar;
                    }
                    if (btnEnviarAprobacionCrear) {
                        btnEnviarAprobacionCrear.disabled = false;
                        btnEnviarAprobacionCrear.innerHTML = textoOriginalEnviar;
                    }
                }, 3000);
            });
        }

        // Actualizar contador de materiales al cargar
        if (contadorMaterialesCrear && tbodyMaterialesCrear) {
            contadorMaterialesCrear.textContent = tbodyMaterialesCrear.querySelectorAll('.material-row').length;
        }
    }

    // =============================================
    // CONFIGURACIÓN: autoguardado + toast
    // Detecta todos los elementos .config-input
    // y persiste sus valores en localStorage.
    // =============================================
    const formConfiguracion = document.getElementById('formConfiguracion');

    if (formConfiguracion) {
        const STORAGE_KEY_CONFIG = 'swcora_configuracion';
        const toastConfigEl = document.getElementById('toastConfigGuardada');
        const toastConfigMensajeEl = document.getElementById('toastConfigGuardadaMensaje');

        // ---------- Utilidades de storage ----------
        function cargarConfiguracion() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
                return raw ? JSON.parse(raw) : {};
            } catch (e) {
                console.warn('Error leyendo configuración:', e);
                return {};
            }
        }

        function guardarConfiguracion(obj) {
            try {
                localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(obj));
                return true;
            } catch (e) {
                console.error('Error guardando configuración:', e);
                return false;
            }
        }

        // ---------- Toast de confirmación ----------
        function mostrarToastConfig(mensaje) {
            if (!toastConfigEl) return;
            if (toastConfigMensajeEl) {
                toastConfigMensajeEl.textContent = mensaje || 'Los cambios se guardaron automáticamente.';
            }
            bootstrap.Toast.getOrCreateInstance(toastConfigEl).show();
        }

        // ---------- Detectar tipo de input y leer su valor ----------
        function leerValorInput(el) {
            if (el.type === 'checkbox') return el.checked;
            if (el.type === 'number') {
                const n = parseInt(el.value, 10);
                return isNaN(n) ? 0 : n;
            }
            return el.value;
        }

        // ---------- Aplicar valor guardado al input ----------
        function aplicarValorInput(el, valor) {
            if (valor === undefined || valor === null) return;
            if (el.type === 'checkbox') {
                el.checked = !!valor;
            } else {
                el.value = valor;
            }
        }

        // ---------- Cargar valores al iniciar ----------
        const configGuardada = cargarConfiguracion();

        formConfiguracion.querySelectorAll('.config-input').forEach(function (el) {
            const key = el.getAttribute('data-config-key');
            if (!key) return;
            if (Object.prototype.hasOwnProperty.call(configGuardada, key)) {
                aplicarValorInput(el, configGuardada[key]);
            }
        });

        // ---------- Autoguardado en cada cambio ----------
        // Debounce para inputs de texto (evita guardar en cada tecla)
        let timerDebounce = null;

        function persistirCambio(el) {
            const key = el.getAttribute('data-config-key');
            if (!key) return;

            const config = cargarConfiguracion();
            config[key] = leerValorInput(el);
            guardarConfiguracion(config);

            mostrarToastConfig('Se guardó: ' + key);
        }

        formConfiguracion.querySelectorAll('.config-input').forEach(function (el) {
            // Cambios inmediatos: checkbox, select, date, number, email, password, textarea
            if (el.type === 'checkbox' || el.tagName === 'SELECT') {
                el.addEventListener('change', function () {
                    persistirCambio(el);
                });
            } else if (el.tagName === 'TEXTAREA' || el.type === 'text' || el.type === 'email' || el.type === 'password' || el.type === 'number') {
                // Texto: debounce de 500 ms
                el.addEventListener('input', function () {
                    clearTimeout(timerDebounce);
                    timerDebounce = setTimeout(function () {
                        persistirCambio(el);
                    }, 500);
                });
            }
        });

        // ---------- Toggle mostrar/ocultar contraseña SMTP ----------
        const btnToggleSmtpPassword = document.getElementById('btnToggleSmtpPassword');
        const smtpPasswordInput = document.getElementById('smtpPassword');

        if (btnToggleSmtpPassword && smtpPasswordInput) {
            btnToggleSmtpPassword.addEventListener('click', function () {
                const icon = this.querySelector('i');
                if (smtpPasswordInput.type === 'password') {
                    smtpPasswordInput.type = 'text';
                    icon.classList.remove('bi-eye');
                    icon.classList.add('bi-eye-slash');
                } else {
                    smtpPasswordInput.type = 'password';
                    icon.classList.remove('bi-eye-slash');
                    icon.classList.add('bi-eye');
                }
            });
        }

        // ---------- Botón "Enviar correo de prueba" ----------
        const btnEnviarCorreoPrueba = document.getElementById('btnEnviarCorreoPrueba');
        if (btnEnviarCorreoPrueba) {
            btnEnviarCorreoPrueba.addEventListener('click', function () {
                const correoInput = document.getElementById('smtpCorreoPrueba');
                const correo = correoInput ? correoInput.value.trim() : '';

                if (!correo) {
                    if (correoInput) {
                        correoInput.classList.add('is-invalid');
                        correoInput.focus();
                    }
                    return;
                }
                correoInput.classList.remove('is-invalid');

                // Simulación (mockup): solo mostramos toast
                mostrarToastConfig('Correo de prueba enviado a: ' + correo);
            });
        }
    }
});