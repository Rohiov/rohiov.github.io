// =============================================
// SWCORA - Scripts del Mockup
// =============================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('SWCORA Mockup cargado correctamente');

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
    // Sincroniza la clase .collapsed del card para el chevron
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
    const modalEmpresaEl = document.getElementById('modalEmpresa');
    const modalEmpresaTitulo = document.getElementById('modalEmpresaTitulo');
    const formEmpresa = document.getElementById('formEmpresa');

    if (modalEmpresaEl) {
        modalEmpresaEl.addEventListener('show.bs.modal', function (event) {
            const trigger = event.relatedTarget;

            if (formEmpresa) formEmpresa.reset();

            if (!trigger || trigger.id === 'btnNuevaEmpresa') {
                modalEmpresaTitulo.innerHTML = '<i class="bi bi-plus-circle"></i> Nueva Empresa';
                document.getElementById('empresaId').value = '';
                document.getElementById('empresaCodigo').readOnly = false;
                document.getElementById('empresaCodigo').value = '';
                document.getElementById('empresaNombre').value = '';
                document.getElementById('empresaContacto').value = '';
                document.getElementById('empresaTipo').value = '';
                document.getElementById('empresaActivo').checked = true;
                return;
            }

            const id = trigger.getAttribute('data-id') || '';
            const codigo = trigger.getAttribute('data-codigo') || '';
            const nombre = trigger.getAttribute('data-nombre') || '';
            const contacto = trigger.getAttribute('data-contacto') || '';
            const tipo = trigger.getAttribute('data-tipo') || '';
            const activo = trigger.getAttribute('data-activo') === 'true';

            modalEmpresaTitulo.innerHTML = '<i class="bi bi-pencil"></i> Editar Empresa';
            document.getElementById('empresaId').value = id;
            document.getElementById('empresaCodigo').value = codigo;
            document.getElementById('empresaCodigo').readOnly = true;
            document.getElementById('empresaNombre').value = nombre;
            document.getElementById('empresaContacto').value = contacto;
            document.getElementById('empresaTipo').value = tipo;
            document.getElementById('empresaActivo').checked = activo;
        });

        const btnGuardarEmpresa = document.getElementById('btnGuardarEmpresa');
        if (btnGuardarEmpresa) {
            btnGuardarEmpresa.addEventListener('click', function () {
                const id = document.getElementById('empresaId').value;
                const codigo = document.getElementById('empresaCodigo').value.trim();
                const nombre = document.getElementById('empresaNombre').value.trim();
                const tipo = document.getElementById('empresaTipo').value;

                if (!codigo || !nombre || !tipo) {
                    alert('Por favor completa los campos obligatorios.');
                    return;
                }

                const esEdicion = !!id;
                const mensaje = esEdicion
                    ? '✅ Empresa actualizada correctamente.'
                    : '✅ Empresa creada correctamente.';

                const modalInstance = bootstrap.Modal.getInstance(modalEmpresaEl);
                if (modalInstance) modalInstance.hide();

                console.log(esEdicion ? 'EDITAR' : 'CREAR', { id, codigo, nombre, tipo });

                setTimeout(function () { alert(mensaje); }, 300);
            });
        }
    }

    // =============================================
    // Modal Tipos de Empresa: abrir "Nuevo Tipo"
    // =============================================
    const btnNuevoTipoEmpresa = document.getElementById('btnNuevoTipoEmpresa');
    const modalTiposEmpresaEl = document.getElementById('modalTiposEmpresa');
    const modalNuevoTipoEl = document.getElementById('modalNuevoTipo');

    if (btnNuevoTipoEmpresa && modalTiposEmpresaEl && modalNuevoTipoEl) {
        btnNuevoTipoEmpresa.addEventListener('click', function () {
            const instance = bootstrap.Modal.getInstance(modalTiposEmpresaEl);
            if (instance) instance.hide();

            const nuevoTipoModal = new bootstrap.Modal(modalNuevoTipoEl);
            nuevoTipoModal.show();
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

            // Clonar la primera fila como plantilla
            const plantilla = filas[0];
            const nuevaFila = plantilla.cloneNode(true);

            // Limpiar valores de la nueva fila
            nuevaFila.querySelector('.input-cantidad').value = '1.00';
            nuevaFila.querySelector('.input-unidad').selectedIndex = 0;
            nuevaFila.querySelector('.input-descripcion').value = '';
            nuevaFila.querySelector('.input-comentario').value = '';

            tbodyMateriales.appendChild(nuevaFila);

            renumerarFilas();
            actualizarContadorYEstado();

            // Foco automático en la descripción de la nueva fila
            nuevaFila.querySelector('.input-descripcion').focus();

            // Scroll suave hacia la nueva fila
            nuevaFila.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        });

        // ---------- Eliminar fila (delegación) ----------
        tbodyMateriales.addEventListener('click', function (e) {
            const btn = e.target.closest('.btn-eliminar-material');
            if (!btn) return;

            const filas = tbodyMateriales.querySelectorAll('.material-row');
            if (filas.length === 1) {
                alert('Debe haber al menos un material.');
                return;
            }

            btn.closest('tr').remove();
            renumerarFilas();
            actualizarContadorYEstado();
        });

        // ---------- Validación: descripciones duplicadas ----------
        tbodyMateriales.addEventListener('input', function (e) {
            if (!e.target.classList.contains('input-descripcion')) return;

            const valor = e.target.value.trim().toLowerCase();
            const inputs = tbodyMateriales.querySelectorAll('.input-descripcion');

            // Resetear estilos
            inputs.forEach(i => i.classList.remove('is-invalid'));

            if (!valor) return;

            // Marcar duplicados
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

        // Inicializar contador
        actualizarContadorYEstado();
    }

    // =============================================
// Árbol de permisos: Expandir / Colapsar / Todo / Nada
// =============================================
const arbolPermisos = document.getElementById('arbolPermisos');

if (arbolPermisos) {
    const btnExpandirArbol = document.getElementById('btnExpandirArbol');
    const btnColapsarArbol = document.getElementById('btnColapsarArbol');
    const btnSeleccionarTodo = document.getElementById('btnSeleccionarTodo');
    const btnDeseleccionarTodo = document.getElementById('btnDeseleccionarTodo');

    // ---------- Expandir todo ----------
    if (btnExpandirArbol) {
        btnExpandirArbol.addEventListener('click', function () {
            arbolPermisos.querySelectorAll('ul.nodo-colapsado').forEach(function (ul) {
                ul.classList.remove('nodo-colapsado');
            });
        });
    }

    // ---------- Colapsar todo ----------
    if (btnColapsarArbol) {
        btnColapsarArbol.addEventListener('click', function () {
            // Solo colapsamos los UL anidados, no el UL raíz
            arbolPermisos.querySelectorAll('ul ul').forEach(function (ul) {
                ul.classList.add('nodo-colapsado');
            });
        });
    }

    // ---------- Seleccionar todo ----------
    if (btnSeleccionarTodo) {
        btnSeleccionarTodo.addEventListener('click', function () {
            arbolPermisos.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
                cb.checked = true;
                cb.indeterminate = false;
            });
        });
    }

    // ---------- Deseleccionar todo ----------
    if (btnDeseleccionarTodo) {
        btnDeseleccionarTodo.addEventListener('click', function () {
            arbolPermisos.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
                cb.checked = false;
                cb.indeterminate = false;
            });
        });
    }

    // ---------- Plegado por clic en el label del padre ----------
    arbolPermisos.querySelectorAll('li:has(> ul) > .form-check > .form-check-label').forEach(function (label) {
        label.addEventListener('click', function (e) {
            // No interferir con el clic normal del checkbox
            if (e.target.tagName === 'INPUT') return;

            const li = label.closest('li');
            const subUl = li ? li.querySelector(':scope > ul') : null;
            if (subUl) {
                subUl.classList.toggle('nodo-colapsado');
            }
        });
    });
}

});