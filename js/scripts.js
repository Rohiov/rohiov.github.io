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

    const submenus = document.querySelectorAll('.dropdown-submenu > .dropdown-item');
        submenus.forEach(function (el) {
            el.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopPropagation();

                const submenu = this.nextElementSibling;

                // Cerrar otros submenús abiertos al mismo nivel
                document.querySelectorAll('.dropdown-submenu > .dropdown-menu.show').forEach(function (open) {
                    if (open !== submenu) open.classList.remove('show');
                });

                submenu.classList.toggle('show');
            });
        });



    // Toggle mostrar/ocultar contraseña
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
    // El estado inicial lo define el HTML (clase "show")
    // Este JS solo sincroniza la clase .collapsed del card
    // para que el ícono chevron rote correctamente
    // =============================================
    document.querySelectorAll('.card-collapsible .collapse').forEach(function (collapseEl) {
        const card = collapseEl.closest('.card-collapsible');
        if (!card) return;

        // Estado inicial: si no tiene "show", marcar como colapsado
        if (!collapseEl.classList.contains('show')) {
            card.classList.add('collapsed');
        } else {
            card.classList.remove('collapsed');
        }

        // Al abrir
        collapseEl.addEventListener('show.bs.collapse', function () {
            card.classList.remove('collapsed');
        });

        // Al cerrar
        collapseEl.addEventListener('hide.bs.collapse', function () {
            card.classList.add('collapsed');
        });
    });

    // =============================================
    // Toggle condicional: Retorno Esperado
    // Solo se muestra si "Salida Definitiva" NO está marcada
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
    } else {
        console.warn('Toggle Retorno Esperado no inicializado:',
            { esDefinitiva: !!esDefinitiva, wrapperRetornoEsperado: !!wrapperRetornoEsperado });
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
        // Abrir modal al hacer clic en "¿Olvidaste tu contraseña?"
        linkRecuperarPassword.addEventListener('click', function (e) {
            e.preventDefault();
            const modal = new bootstrap.Modal(modalRecuperarPasswordEl);
            modal.show();
        });
    }

    if (btnConfirmarRecuperar) {
        // Al confirmar: cerrar modal y mostrar toast
        btnConfirmarRecuperar.addEventListener('click', function () {
            // Cerrar el modal
            const modalInstance = bootstrap.Modal.getInstance(modalRecuperarPasswordEl);
            if (modalInstance) modalInstance.hide();

            // Mostrar toast de confirmación simulada
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
    const btnNuevaEmpresa = document.getElementById('btnNuevaEmpresa');
    const modalEmpresaTitulo = document.getElementById('modalEmpresaTitulo');
    const formEmpresa = document.getElementById('formEmpresa');

    if (modalEmpresaEl) {
        // Al abrir el modal: detectar si es crear o editar
        modalEmpresaEl.addEventListener('show.bs.modal', function (event) {
            const trigger = event.relatedTarget;

            // Resetear form
            if (formEmpresa) formEmpresa.reset();

            // Si el trigger es el botón "Nueva Empresa" o no viene de un botón de edición → modo CREAR
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

            // Modo EDITAR: leer data attributes del botón
            const id = trigger.getAttribute('data-id') || '';
            const codigo = trigger.getAttribute('data-codigo') || '';
            const nombre = trigger.getAttribute('data-nombre') || '';
            const contacto = trigger.getAttribute('data-contacto') || '';
            const tipo = trigger.getAttribute('data-tipo') || '';
            const activo = trigger.getAttribute('data-activo') === 'true';

            modalEmpresaTitulo.innerHTML = '<i class="bi bi-pencil"></i> Editar Empresa';
            document.getElementById('empresaId').value = id;
            document.getElementById('empresaCodigo').value = codigo;
            document.getElementById('empresaCodigo').readOnly = true; // el código no se edita
            document.getElementById('empresaNombre').value = nombre;
            document.getElementById('empresaContacto').value = contacto;
            document.getElementById('empresaTipo').value = tipo;
            document.getElementById('empresaActivo').checked = activo;
        });

        // Al hacer clic en "Guardar Empresa"
        const btnGuardarEmpresa = document.getElementById('btnGuardarEmpresa');
        if (btnGuardarEmpresa) {
            btnGuardarEmpresa.addEventListener('click', function () {
                const id = document.getElementById('empresaId').value;
                const codigo = document.getElementById('empresaCodigo').value.trim();
                const nombre = document.getElementById('empresaNombre').value.trim();
                const tipo = document.getElementById('empresaTipo').value;

                // Validación mínima
                if (!codigo || !nombre || !tipo) {
                    alert('Por favor completa los campos obligatorios.');
                    return;
                }

                const esEdicion = !!id;
                const mensaje = esEdicion
                    ? '✅ Empresa actualizada correctamente.'
                    : '✅ Empresa creada correctamente.';

                // Simular guardado: cerrar modal y mostrar alerta (en mockup)
                const modalInstance = bootstrap.Modal.getInstance(modalEmpresaEl);
                if (modalInstance) modalInstance.hide();

                // Aquí en el sistema real se haría un fetch POST
                console.log(esEdicion ? 'EDITAR' : 'CREAR', {
                    id, codigo, nombre, tipo
                });

                // Feedback visual
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
            // Cerrar el modal de tipos y abrir el de nuevo tipo
            const instance = bootstrap.Modal.getInstance(modalTiposEmpresaEl);
            if (instance) instance.hide();

            const nuevoTipoModal = new bootstrap.Modal(modalNuevoTipoEl);
            nuevoTipoModal.show();
        });
    }

});