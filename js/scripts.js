// =============================================
// SWCORA - Scripts del Mockup
// =============================================

// =============================================
// UTILIDAD GLOBAL: Exportar tabla a CSV
// Reutilizable en cualquier página.
// Uso:
//   exportarTablaACSV('#tablaUsuarios', 'usuarios');
//   exportarTablaACSV(tablaElement, 'salidas', { omitirColumnas: [0, 6] });
// =============================================
function exportarTablaACSV(tablaSelector, nombreArchivo, opciones) {
    opciones = opciones || {};

    // 1. Resolver el elemento de la tabla
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

    // 2. Opciones
    const omitirColumnas = opciones.omitirColumnas || []; // índices a omitir (0-based)
    const incluirOcultas = opciones.incluirOcultas === true; // por defecto false: solo visibles
    const separador = opciones.separador || ',';
    const nombreBase = nombreArchivo || 'exportacion';

    // 3. Encabezados
    const ths = tabla.querySelectorAll('thead th');
    const encabezados = [];
    ths.forEach(function (th, index) {
        if (omitirColumnas.includes(index)) return;
        encabezados.push(limpiarTexto(th.textContent));
    });

    // 4. Filas
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

    // 5. Generar contenido CSV
    const lineas = [];
    lineas.push(encabezados.map(escaparCSV).join(separador));
    filas.forEach(function (fila) {
        lineas.push(fila.map(escaparCSV).join(separador));
    });

    // 6. BOM UTF-8 para que Excel respete los acentos
    const contenido = '\uFEFF' + lineas.join('\r\n');

    // 7. Blob y descarga
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const fecha = new Date();
    const pad = n => String(n).padStart(2, '0');
    const timestamp = fecha.getFullYear() + pad(fecha.getMonth() + 1) + pad(fecha.getDate()) +
                      '_' + pad(fecha.getHours()) + pad(fecha.getMinutes());

    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreBase + '_' + timestamp + '.csv';
    enlace.style.display = 'none';
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    URL.revokeObjectURL(url);

    // ---- Helpers internos ----
    function limpiarTexto(texto) {
        return String(texto || '')
            .replace(/\s+/g, ' ')   // colapsa espacios, saltos de línea, tabs
            .trim();
    }

    function escaparCSV(valor) {
        const texto = String(valor);
        // Si contiene separador, comillas o salto de línea → entrecomillar
        if (texto.indexOf(separador) !== -1 ||
            texto.indexOf('"') !== -1 ||
            texto.indexOf('\n') !== -1 ||
            texto.indexOf('\r') !== -1) {
            return '"' + texto.replace(/"/g, '""') + '"';
        }
        return texto;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    console.log('SWCORA Mockup cargado correctamente');

    const modalEmpresaEl = document.getElementById('modalEmpresa');
    const modalEmpresaTitulo = document.getElementById('modalEmpresaTitulo');
    const modalTiposEmpresaEl = document.getElementById('modalTiposEmpresa');
    const modalNuevoTipoEl = document.getElementById('modalNuevoTipo');

    // =============================================
    // Login Superusuario
    // =============================================
    const loginForm = document.getElementById('superAdminLoginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function (e) {
            e.preventDefault();
            window.location.href = 'index.html';
        });
    }

    // =============================================
    // Submenús anidados en el navbar
    // =============================================
    const submenus = document.querySelectorAll('.dropdown-submenu > .dropdown-item');
    submenus.forEach(function (el) {
        el.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            const submenu = this.nextElementSibling;

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
    // =============================================
    const selectEmpresa = document.getElementById('selectEmpresa');
    const contactoInput = document.getElementById('contactoInput');
    if (selectEmpresa && contactoInput) {
        selectEmpresa.addEventListener('change', function () {
            const contacto = this.options[this.selectedIndex].getAttribute('data-contacto');
            contactoInput.value = contacto || '';
        });
    }

    const btnLimpiarContacto = document.getElementById('btnLimpiarContacto');
    if (btnLimpiarContacto) {
        btnLimpiarContacto.addEventListener('click', function () {
            contactoInput.value = '';
            contactoInput.focus();
        });
    }

    // =============================================
    // Árbol de permisos - Tri-state
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

    if (linkRecuperarPassword && modalRecuperarPasswordEl) {
        linkRecuperarPassword.addEventListener('click', function (e) {
            e.preventDefault();
            const modal = new bootstrap.Modal(modalRecuperarPasswordEl);
            modal.show();
        });
    }

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
        // ---------- Al abrir el modal: crear o editar ----------
        modalEmpresaEl.addEventListener('show.bs.modal', function (event) {
            const trigger = event.relatedTarget;

            // Resetear campos
            document.getElementById('empresaNombre').value = '';
            document.getElementById('empresaContacto').value = '';
            document.getElementById('empresaTipo').value = '';

            // Modo CREAR
            if (!trigger || trigger.id === 'btnNuevaEmpresa') {
                modalEmpresaTitulo.innerHTML = '<i class="bi bi-plus-circle"></i> Nueva Empresa';
                return;
            }

            // Modo EDITAR: leer data-* del botón
            const nombre = trigger.getAttribute('data-nombre') || '';
            const contacto = trigger.getAttribute('data-contacto') || '';
            const tipo = trigger.getAttribute('data-tipo') || '';

            modalEmpresaTitulo.innerHTML = '<i class="bi bi-pencil"></i> Editar Empresa';
            document.getElementById('empresaNombre').value = nombre;
            document.getElementById('empresaContacto').value = contacto;
            document.getElementById('empresaTipo').value = tipo;
        });

        // ---------- Guardar ----------
        const btnGuardarEmpresa = document.getElementById('btnGuardarEmpresa');
        if (btnGuardarEmpresa) {
            btnGuardarEmpresa.addEventListener('click', function () {
                const nombre = document.getElementById('empresaNombre').value.trim();
                const tipo = document.getElementById('empresaTipo').value;

                if (!nombre || !tipo) {
                    alert('Por favor completa los campos obligatorios.');
                    return;
                }

                // Cerrar modal
                const instance = bootstrap.Modal.getInstance(modalEmpresaEl);
                if (instance) instance.hide();

                // Toast "cambios guardados" al terminar de cerrar
                modalEmpresaEl.addEventListener('hidden.bs.modal', function handler() {
                    if (toastCambiosGuardadosEmpEl) {
                        const toast = new bootstrap.Toast(toastCambiosGuardadosEmpEl);
                        toast.show();
                    }
                    modalEmpresaEl.removeEventListener('hidden.bs.modal', handler);
                });
            });
        }
    }

    // =============================================
    // Modal Tipos de Empresa: abrir "Nuevo Tipo"
    // =============================================
    const btnNuevoTipoEmpresa = document.getElementById('btnNuevoTipoEmpresa');

    if (btnNuevoTipoEmpresa && modalTiposEmpresaEl && modalNuevoTipoEl) {
        btnNuevoTipoEmpresa.addEventListener('click', function () {
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

        arbolPermisos.addEventListener('click', function (e) {
            const toggle = e.target.closest('.toggle-nodo');
            if (!toggle || toggle.classList.contains('placeholder')) return;

            const li = toggle.closest('li');
            const subUl = li ? li.querySelector(':scope > ul') : null;
            if (!subUl) return;

            subUl.classList.toggle('nodo-colapsado');
            toggle.classList.toggle('colapsado');
        });

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

        if (btnSeleccionarTodo) {
            btnSeleccionarTodo.addEventListener('click', function () {
                arbolPermisos.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
                    cb.checked = true;
                    cb.indeterminate = false;
                });
            });
        }

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

    function mostrarToastSesionCerrada() {
        if (!toastSesionCerradaEl) return;
        const toast = new bootstrap.Toast(toastSesionCerradaEl);
        toast.show();
    }

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

        [inputPasswordActual, inputPasswordNueva, inputPasswordConfirmar].forEach(function (input) {
            if (!input) return;
            input.addEventListener('input', function () {
                this.classList.remove('is-invalid');
            });
        });

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
    // APROBAR SOLICITUDES: filtros + selección múltiple + CSV
    // =============================================
    const tbodySolicitudes = document.getElementById('tbodySolicitudes');

    if (tbodySolicitudes) {
        const filtroEstado = document.getElementById('filtroEstado');
        const filtroModulo = document.getElementById('filtroModulo');
        const filtroBuscar = document.getElementById('filtroBuscar');
        const btnFiltrar = document.getElementById('btnFiltrar');
        const btnLimpiarFiltros = document.getElementById('btnLimpiarFiltros');

        const btnSeleccionarTodas = document.getElementById('btnSeleccionarTodas');
        const btnDeseleccionarTodas = document.getElementById('btnDeseleccionarTodas');
        const checkTodos = document.getElementById('checkTodos');

        const btnAprobarSeleccionadas = document.getElementById('btnAprobarSeleccionadas');
        const btnRechazarSeleccionadas = document.getElementById('btnRechazarSeleccionadas');
        const contadorAprobar = document.getElementById('contadorAprobar');
        const contadorRechazar = document.getElementById('contadorRechazar');

        const contadorResultados = document.getElementById('contadorResultados');
        const contadorMostrados = document.getElementById('contadorMostrados');

        const btnExportarCSV = document.getElementById('btnExportarCSV');

        const filas = tbodySolicitudes.querySelectorAll('.solicitud-row');

        function aplicarFiltros() {
            const estado = filtroEstado.value;
            const modulo = filtroModulo.value;
            const buscar = filtroBuscar.value.trim().toLowerCase();

            let visibles = 0;

            filas.forEach(function (fila) {
                const filaEstado = fila.getAttribute('data-estado');
                const filaModulo = fila.getAttribute('data-modulo');
                const filaUsuario = (fila.getAttribute('data-usuario') || '').toLowerCase();

                const coincideEstado = (estado === 'todas') || (filaEstado === estado);
                const coincideModulo = (modulo === 'todos') || (filaModulo === modulo);
                const coincideBuscar = !buscar || filaUsuario.includes(buscar);

                if (coincideEstado && coincideModulo && coincideBuscar) {
                    fila.classList.remove('d-none');
                    visibles++;
                } else {
                    fila.classList.add('d-none');
                    const check = fila.querySelector('.check-solicitud');
                    if (check && !check.disabled) check.checked = false;
                }
            });

            if (contadorResultados) contadorResultados.textContent = visibles;
            if (contadorMostrados) contadorMostrados.textContent = visibles;

            actualizarContadoresSeleccion();
            actualizarCheckTodos();
        }

        function actualizarContadoresSeleccion() {
            const seleccionadas = tbodySolicitudes.querySelectorAll('.check-solicitud:checked:not(:disabled)').length;

            if (contadorAprobar) contadorAprobar.textContent = seleccionadas;
            if (contadorRechazar) contadorRechazar.textContent = seleccionadas;

            if (btnAprobarSeleccionadas) btnAprobarSeleccionadas.disabled = seleccionadas === 0;
            if (btnRechazarSeleccionadas) btnRechazarSeleccionadas.disabled = seleccionadas === 0;
        }

        function actualizarCheckTodos() {
            if (!checkTodos) return;

            const visiblesSeleccionables = Array.from(
                tbodySolicitudes.querySelectorAll('.solicitud-row:not(.d-none) .check-solicitud:not(:disabled)')
            );

            if (visiblesSeleccionables.length === 0) {
                checkTodos.checked = false;
                checkTodos.indeterminate = false;
                return;
            }

            const marcados = visiblesSeleccionables.filter(c => c.checked).length;

            if (marcados === 0) {
                checkTodos.checked = false;
                checkTodos.indeterminate = false;
            } else if (marcados === visiblesSeleccionables.length) {
                checkTodos.checked = true;
                checkTodos.indeterminate = false;
            } else {
                checkTodos.checked = false;
                checkTodos.indeterminate = true;
            }
        }

        if (btnFiltrar) btnFiltrar.addEventListener('click', aplicarFiltros);
        if (filtroEstado) filtroEstado.addEventListener('change', aplicarFiltros);
        if (filtroModulo) filtroModulo.addEventListener('change', aplicarFiltros);
        if (filtroBuscar) filtroBuscar.addEventListener('input', aplicarFiltros);

        if (btnLimpiarFiltros) {
            btnLimpiarFiltros.addEventListener('click', function () {
                filtroEstado.value = 'pendiente';
                filtroModulo.value = 'todos';
                filtroBuscar.value = '';
                aplicarFiltros();
            });
        }

        tbodySolicitudes.addEventListener('change', function (e) {
            if (!e.target.classList.contains('check-solicitud')) return;
            actualizarContadoresSeleccion();
            actualizarCheckTodos();
        });

        if (btnSeleccionarTodas) {
            btnSeleccionarTodas.addEventListener('click', function () {
                tbodySolicitudes.querySelectorAll('.solicitud-row:not(.d-none) .check-solicitud:not(:disabled)').forEach(function (cb) {
                    cb.checked = true;
                });
                actualizarContadoresSeleccion();
                actualizarCheckTodos();
            });
        }

        if (btnDeseleccionarTodas) {
            btnDeseleccionarTodas.addEventListener('click', function () {
                tbodySolicitudes.querySelectorAll('.check-solicitud').forEach(function (cb) {
                    cb.checked = false;
                });
                actualizarContadoresSeleccion();
                actualizarCheckTodos();
            });
        }

        if (checkTodos) {
            checkTodos.addEventListener('change', function () {
                const marcar = this.checked;
                tbodySolicitudes.querySelectorAll('.solicitud-row:not(.d-none) .check-solicitud:not(:disabled)').forEach(function (cb) {
                    cb.checked = marcar;
                });
                actualizarContadoresSeleccion();
            });
        }

        const modalAprobarEl = document.getElementById('modalAprobar');
        if (modalAprobarEl) {
            modalAprobarEl.addEventListener('show.bs.modal', function (event) {
                const btn = event.relatedTarget;
                const usuario = btn ? btn.getAttribute('data-usuario') : '—';
                this.querySelector('#aprobarUsuario').textContent = usuario || '—';
            });
        }

        const modalRechazarEl = document.getElementById('modalRechazar');
        if (modalRechazarEl) {
            modalRechazarEl.addEventListener('show.bs.modal', function (event) {
                const btn = event.relatedTarget;
                const usuario = btn ? btn.getAttribute('data-usuario') : '—';
                this.querySelector('#rechazarUsuario').textContent = usuario || '—';
            });
        }

        aplicarFiltros();
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

        btnEnviarSolicitud.addEventListener('click', function () {
            if (!selectModuloSolicitud.value) {
                selectModuloSolicitud.classList.add('is-invalid');
                selectModuloSolicitud.focus();
                alert('Por favor selecciona un módulo antes de enviar la solicitud.');
                return;
            }
            selectModuloSolicitud.classList.remove('is-invalid');

            resumenModulo.textContent = selectModuloSolicitud.value;
            const motivoTexto = textareaMotivo.value.trim();
            resumenMotivo.textContent = motivoTexto || '—';

            const modal = new bootstrap.Modal(modalElegirAprobadorEl);
            modal.show();
        });

        btnConfirmarEnvio.addEventListener('click', function () {
            if (!selectAprobador.value) {
                selectAprobador.classList.add('is-invalid');
                selectAprobador.focus();
                return;
            }

            const payload = {
                modulo: selectModuloSolicitud.value,
                rol: 'Generador',
                motivo: textareaMotivo.value.trim(),
                aprobador: selectAprobador.value
            };

            console.log('📤 ENVIAR SOLICITUD:', payload);

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

        function marcarComoLeida(n) {
            if (!esNoLeida(n)) return;

            n.setAttribute('data-leida', 'true');
            n.classList.remove('no-leida');
            n.classList.add('leida');
            n.style.backgroundColor = '';

            const btn = n.querySelector('.btn-marcar-leida');
            if (btn) btn.remove();
        }

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

        listaNotificaciones.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-marcar-leida');
            if (!btn) return;

            const noti = btn.closest('.notificacion-item');
            if (!noti) return;

            marcarComoLeida(noti);
            actualizarContadores();
            aplicarFiltro();
        });

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

        function normalizar(texto) {
            return String(texto || '')
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '');
        }

        // El score ahora premia coincidencias por Código y Nombre
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
                    score += 10 * pesoTermino; // Código pesa más
                } else if (coincideNombre) {
                    score += 5 * pesoTermino;
                }
            }

            return score;
        }

        function reordenarDomRoles(lista) {
            lista.forEach(function (fila) {
                tbodyRoles.appendChild(fila);
            });
        }

        function restaurarOrdenOriginalRoles() {
            reordenarDomRoles(ordenOriginalRoles);
        }

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
    // ADMIN ROLES: botón Guardar del modal → toast
    // =============================================
    const btnGuardarRol = document.getElementById('btnGuardarRol');
    const modalCrearRolEl = document.getElementById('modalCrearRol');
    const toastCambiosGuardadosRolEl = document.getElementById('toastCambiosGuardados');

    if (btnGuardarRol && modalCrearRolEl) {
        btnGuardarRol.addEventListener('click', function () {
            const instance = bootstrap.Modal.getInstance(modalCrearRolEl);
            if (instance) instance.hide();

            modalCrearRolEl.addEventListener('hidden.bs.modal', function handler() {
                if (toastCambiosGuardadosRolEl) {
                    const toast = new bootstrap.Toast(toastCambiosGuardadosRolEl);
                    toast.show();
                }
                modalCrearRolEl.removeEventListener('hidden.bs.modal', handler);
            });
        });
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

        // Checkboxes y selects internos del modal
        const rolAdmin = document.getElementById('rolAdmin');
        const rolGen = document.getElementById('rolGen');
        const rolApro = document.getElementById('rolApro');

        // Fila que se está editando actualmente
        let filaEnEdicion = null;

        // ---------- Utilidades ----------
        function setChecked(el, valor) {
            if (el) el.checked = !!valor;
        }

        // ---------- Actualizar visibilidad de secciones ----------
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
        // El botón 🔑 debe tener data-bs-toggle="modal" data-bs-target="#modalAccesos"
        // y estar dentro de un <tr class="usuario-row">
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

        // Al cerrar el modal (por cualquier vía), limpiar la referencia
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

                // 👇 NUEVA CONDICIÓN: si no queda ningún rol marcado, pasa a "Sin rol"
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
        // Columnas de la tabla de usuarios:
        // 0: Usuario Windows
        // 1: Nombre Completo
        // 2: Email
        // 3: Tipo Rol       ← badge
        // 4: Rol Asignado   ← badges (pueden ser varios)
        // 5: Estado
        // 6: Acciones

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

        // Delegación de eventos: funciona para filas dinámicas también
        tablaUsuariosParaToggle.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-toggle-estado-usuario');
            if (!btn) return;

            const fila = btn.closest('.usuario-row');
            if (!fila) return;

            const accion = btn.getAttribute('data-accion'); // "activar" | "desactivar"
            const badgeEstado = fila.querySelector('td:nth-child(6) .badge');

            if (accion === 'desactivar') {
                // Cambiar a estado inactivo
                fila.setAttribute('data-estado', 'inactivo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Inactivo';
                    badgeEstado.classList.remove('bg-success');
                    badgeEstado.classList.add('bg-danger');
                }

                // Cambiar el botón a "Activar" (verde)
                btn.classList.remove('btn-outline-primary');
                btn.classList.add('btn-outline-success');
                btn.setAttribute('title', 'Activar');
                btn.setAttribute('data-accion', 'activar');

                // Mostrar toast
                if (toastUsuarioDesactivadoEl) {
                    const toast = new bootstrap.Toast(toastUsuarioDesactivadoEl);
                    toast.show();
                }

            } else if (accion === 'activar') {
                // Cambiar a estado activo
                fila.setAttribute('data-estado', 'activo');

                if (badgeEstado) {
                    badgeEstado.textContent = 'Activo';
                    badgeEstado.classList.remove('bg-danger');
                    badgeEstado.classList.add('bg-success');
                }

                // Cambiar el botón a "Desactivar" (rojo)
                btn.classList.remove('btn-outline-success');
                btn.classList.add('btn-outline-primary');
                btn.setAttribute('title', 'Desactivar');
                btn.setAttribute('data-accion', 'desactivar');

                // Mostrar toast
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
        // Evitar doble enganche
        if (btn.dataset.exportListener === 'true') return;
        btn.dataset.exportListener = 'true';

        btn.addEventListener('click', function () {
            // Prioridad: data-tabla → data-target → tabla cercana
            let selector = btn.getAttribute('data-tabla') || btn.getAttribute('data-target');

            // Si no hay selector, buscar la tabla más cercana en el mismo card
            if (!selector) {
                const card = btn.closest('.card');
                const tablaCercana = card ? card.querySelector('table') : null;
                if (tablaCercana) {
                    // Le asignamos un id temporal si no tiene
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

            // Nombre del archivo: data-nombre → data-filename → "exportacion"
            const nombre = btn.getAttribute('data-nombre') ||
                           btn.getAttribute('data-filename') ||
                           'exportacion';

            // Columnas a omitir (ej: "0,6") o "auto" para detectar checkboxes/acciones
            const omitirAttr = btn.getAttribute('data-omitir-columnas');
            let omitirColumnas = [];

            if (omitirAttr === 'auto') {
                // Detección automática: omitir columnas cuyo encabezado esté vacío
                // (típico de checkbox de selección) o cuyo texto sea "Acciones"
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

            // Contenido del archivo JSON
            const contenido = JSON.stringify({
                nombre: 'Hola Mundo',
                codigo: codigo
            }, null, 2);

            // Crear Blob y descargar
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

                // --- Búsqueda por EMPRESA ---
                // Cada término debe ser prefijo de alguna palabra del nombre
                const palabrasNombre = nombre.split(/\s+/).filter(Boolean);
                const coincideNombre = terminosNombre.every(function (t) {
                    return palabrasNombre.some(function (p) { return p.startsWith(t); });
                });

                // --- Búsqueda por CONTACTO ---
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
    // ADMIN EMPRESAS: modal Nuevo Tipo → toast
    // =============================================
    const btnGuardarNuevoTipo = document.getElementById('btnGuardarNuevoTipo');
    const toastCambiosGuardadosTipoEl = document.getElementById('toastCambiosGuardados');

    if (btnGuardarNuevoTipo && modalNuevoTipoEl) {
        btnGuardarNuevoTipo.addEventListener('click', function () {
            // Cerrar modal
            const instance = bootstrap.Modal.getInstance(modalNuevoTipoEl);
            if (instance) instance.hide();

            // Al terminar de cerrar: toast + reabrir Tipos
            modalNuevoTipoEl.addEventListener('hidden.bs.modal', function handler() {
                if (toastCambiosGuardadosTipoEl) {
                    const toast = new bootstrap.Toast(toastCambiosGuardadosTipoEl);
                    toast.show();
                }

                // Abrir el modal de Tipos después
                const modalTipos = new bootstrap.Modal(modalTiposEmpresaEl);
                modalTipos.show();

                modalNuevoTipoEl.removeEventListener('hidden.bs.modal', handler);
            });
        });
    }

    // =============================================
    // ADMIN EMPRESAS: modal Tipos → filtro + toggle
    // =============================================
    const tablaTiposEmpresa = document.getElementById('tablaTiposEmpresa');

    if (tablaTiposEmpresa) {
        const filtroTiposEmpresaBuscar = document.getElementById('filtroTiposEmpresaBuscar');
        const filasTipos = Array.from(tablaTiposEmpresa.querySelectorAll('.tipo-empresa-row'));

        function aplicarFiltroTipos() {
            const busqueda = normalizarEmp(filtroTiposEmpresaBuscar ? filtroTiposEmpresaBuscar.value : '');
            const terminos = busqueda ? busqueda.split(/\s+/).filter(Boolean) : [];

            filasTipos.forEach(function (fila) {
                const nombre = normalizarEmp(fila.getAttribute('data-nombre') || '');
                const coincide = terminos.every(function (t) { return nombre.startsWith(t); });
                if (coincide) fila.classList.remove('d-none');
                else fila.classList.add('d-none');
            });
        }

        if (filtroTiposEmpresaBuscar) {
            filtroTiposEmpresaBuscar.addEventListener('input', aplicarFiltroTipos);
        }

        // Toggle Activar/Desactivar Tipo
        const toastTipoActivadoEl = document.getElementById('toastTipoActivado');
        const toastTipoDesactivadoEl = document.getElementById('toastTipoDesactivado');

        tablaTiposEmpresa.addEventListener('click', function (e) {
            const btnToggle = e.target.closest('.btn-toggle-estado-tipo');
            const btnEditar = e.target.closest('.btn-editar-tipo');

            // ---------- Toggle estado ----------
            if (btnToggle) {
                const fila = btnToggle.closest('.tipo-empresa-row');
                if (!fila) return;

                const accion = btnToggle.getAttribute('data-accion');
                const badgeEstado = fila.querySelector('.badge-estado');

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
                return;
            }

            // ---------- Editar (inline) ----------
            if (btnEditar) {
                const fila = btnEditar.closest('.tipo-empresa-row');
                if (!fila) return;

                const tdNombre = fila.querySelector('td:first-child');
                const nombreActual = tdNombre.textContent.trim();

                // Evitar que el clic posterior al blur vuelva a abrir el input
                if (tdNombre.dataset.acabaDeGuardar === 'true') {
                    tdNombre.dataset.acabaDeGuardar = 'false';
                    return;
                }

                // Si ya está en modo edición, solo enfocar
                if (tdNombre.querySelector('input')) {
                    tdNombre.querySelector('input').focus();
                    return;
                }

                // Reemplazar por input con ancho controlado
                tdNombre.innerHTML = '<input type="text" class="form-control form-control-sm" style="max-width: 200px;" value="' +
                    nombreActual.replace(/"/g, '&quot;') + '">';

                const input = tdNombre.querySelector('input');
                input.focus();
                input.select();

                function guardarEdicion() {
                    const nuevoNombre = input.value.trim();

                    // Marcar que acabamos de guardar
                    tdNombre.dataset.acabaDeGuardar = 'true';

                    if (nuevoNombre && nuevoNombre !== nombreActual) {
                        tdNombre.textContent = nuevoNombre;
                        fila.setAttribute('data-nombre', nuevoNombre);

                        if (toastCambiosGuardadosTipoEl) {
                            const toast = new bootstrap.Toast(toastCambiosGuardadosTipoEl);
                            toast.show();
                        }
                    } else {
                        tdNombre.textContent = nombreActual;
                    }

                    // Resetear el flag en el siguiente "tick"
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
                        tdNombre.textContent = nombreActual;
                    }
                });

                return;
            }
        });
    }

});