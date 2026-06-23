    // ==========================================================================
    // SEED DATA & STATE (All start in "Toque del día", waiting section is empty)
    // ==========================================================================
    let contacts = [
      {
        id: 1,
        name: "Jorge Ramírez",
        company: "Importaciones Ramírez SAC",
        type: "Prospecto",
        context: "Espera cotización de fletes marítimos.",
        status: "Toque del día",
        fu1: "2026-06-21",
        fu2: "",
        fu3: "",
        whatsapp: "+51987654321",
        suggestedDate: "2026-06-21", // Hoy (Rojo)
        lastContacted: "Hace 10 días"
      },
      {
        id: 2,
        name: "Rosa Quispe",
        company: "Ropa Quispe E.I.R.L.",
        type: "Prospecto",
        context: "Interesada en catálogo de calzado de invierno.",
        status: "Toque del día",
        fu1: "2026-06-21",
        fu2: "",
        fu3: "",
        whatsapp: "+51912345678",
        suggestedDate: "2026-06-21", // Hoy (Rojo)
        lastContacted: "Hace 7 días"
      },
      {
        id: 3,
        name: "Carlos Mendoza",
        company: "Ferretería Mendoza",
        type: "Cliente",
        context: "Hizo recompra de herramientas eléctricas.",
        status: "Toque del día",
        whatsapp: "+51923456789",
        suggestedDate: "2026-06-20", // Vencido ayer (Rojo)
        lastContacted: "Ayer",
        cycleDays: 28
      },
      {
        id: 4,
        name: "Marco Reyes",
        company: "Constructora Reyes",
        type: "Prospecto",
        context: "Licitación de agregados para obra vial.",
        status: "Toque del día",
        fu1: "2026-06-22",
        fu2: "",
        fu3: "",
        whatsapp: "+51934567890",
        suggestedDate: "2026-06-22", // Mañana (Rojo)
        lastContacted: "Hace 5 días"
      },
      {
        id: 5,
        name: "Sofía Castro",
        company: "Distribuidora Castro",
        type: "Cliente",
        context: "Próximo lote mensual de abarrotes.",
        status: "Toque del día",
        whatsapp: "+51945678901",
        suggestedDate: "2026-06-24", // Vence en 3 días (Amarillo)
        lastContacted: "Hace 26 días",
        cycleDays: 28
      },
      {
        id: 6,
        name: "Andrés Loli",
        company: "Loli & Asociados",
        type: "Prospecto",
        context: "Presentación corporativa de servicios legales enviada.",
        status: "Toque del día",
        whatsapp: "+51956789012",
        suggestedDate: "2026-07-02", // Vence en 11 días (Verde)
        lastContacted: "Hace 2 días"
      },
      {
        id: 7,
        name: "Lucía Fernández",
        company: "Inversiones Fernández",
        type: "Prospecto",
        context: "", // Empty context to test AI Error state
        status: "Toque del día",
        whatsapp: "+51998877665",
        suggestedDate: "2026-06-20", // Vencido ayer (Rojo)
        lastContacted: "Hace 15 días"
      },
      {
        id: 8,
        name: "Roberto Gómez",
        company: "Gómez Repuestos",
        type: "Cliente",
        context: "Pedido de repuestos automotrices al por mayor.",
        status: "Toque del día",
        whatsapp: "+51991122334",
        suggestedDate: "2026-07-05", // Vence en 14 días (Verde)
        lastContacted: "Hace 14 días",
        cycleDays: 28
      },
      {
        id: 9,
        name: "Elena Patiño",
        company: "Patiño Software Inc.",
        type: "Prospecto",
        context: "Solicitó demostración del software de facturación.",
        status: "Toque del día",
        whatsapp: "+51995544332",
        suggestedDate: "2026-06-26", // Vence en 5 días (Amarillo)
        lastContacted: "Hace 5 días"
      },
      {
        id: 10,
        name: "Mateo Salazar",
        company: "Salazar Consulting",
        type: "Cliente",
        context: "Renovación de suscripción de soporte anual.",
        status: "Toque del día",
        whatsapp: "+51996633221",
        suggestedDate: "2026-06-18", // Vencido hace 3 días (Rojo)
        lastContacted: "Hace 1 mes",
        cycleDays: 28
      }
    ];

    let currentViewport = 'desktop';
    let currentFilter = 'Todos';
    let currentClientesFilter = 'Todos';
    let currentProspectosFilter = 'Todos';
    let selectedContactId = null;
    let lastUsedType = 'Prospecto'; // Memory for Nuevo Contacto Modal
    let selectedTypeInModal = 'Prospecto'; 
    let archivedBackup = null; // For Undo Archive
    let isWaitingCollapsed = false;
    let currentTab = 'inicio';

    // Time constant mockup (simulation represents June 21, 2026)
    const TODAY_STR = "2026-06-21";
    const TODAY = new Date(TODAY_STR + "T00:00:00");

    // ==========================================================================
    // INITIALIZATION & DATE HELPERS
    // ==========================================================================
    document.addEventListener("DOMContentLoaded", () => {
      // Initialize contact histories
      contacts.forEach(c => {
        if (!c.history) {
          if (c.id === 2) {
            // Exact history from the user's reference image
            c.history = [
              { date: "22 MAY.", text: "14 días sin respuesta. Posible enfriamiento." },
              { date: "13 MAY.", text: "Se le envió lista de precios mayorista." },
              { date: "10 MAY.", text: "Primer contacto por WhatsApp. Preguntó por pedido mayorista de abarrotes para su bodega." }
            ];
          } else {
            c.history = [];
            if (c.context) {
              c.history.push({
                date: "15 JUN.",
                text: c.context
              });
            }
            c.history.push({
              date: "10 JUN.",
              text: "Contacto inicial registrado en el sistema Toca."
            });
          }
        }
      });

      document.getElementById('app-date').innerText = getFormattedDate(TODAY);
      renderAllTabs();
    });

    function getFormattedDate(date) {
      const options = { weekday: 'long', day: 'numeric', month: 'long' };
      let formatted = date.toLocaleDateString('es-ES', options);
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    }

    function calculateUrgency(suggestedDateStr) {
      if (!suggestedDateStr) return "Verde";
      const sugDate = new Date(suggestedDateStr + "T00:00:00");
      const diffTime = sugDate - TODAY;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 1) {
        return "Rojo"; // Hoy, mañana o ya vencida
      } else if (diffDays >= 2 && diffDays <= 7) {
        return "Amarillo"; // De 2 a 7 días
      } else {
        return "Verde"; // 8 días a más
      }
    }

    function getUrgencyText(c) {
      if (c.id === 1) return "⏱ 11 días sin contacto";
      if (c.id === 2) return "⏱ 7 días sin contacto";
      if (c.id === 7) return "⚠️ Seguimiento anterior sin acción registrada — fecha sugerida actualizada.";
      
      if (!c.suggestedDate) return "Sin fecha";
      const sugDate = new Date(c.suggestedDate + "T00:00:00");
      const diffTime = sugDate - TODAY;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return `⏱ ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'} de retraso`;
      } else if (diffDays === 0) {
        return "🔴 Contactar hoy";
      } else if (diffDays === 1) {
        return "⏱ Vence mañana";
      } else {
        return `⏱ Vence en ${diffDays} días`;
      }
    }

    function getShortUrgencyText(c) {
      if (c.id === 1) return "11d retraso";
      if (c.id === 2) return "7d retraso";
      if (c.id === 7) return "Ayer";
      
      if (!c.suggestedDate) return "";
      const sugDate = new Date(c.suggestedDate + "T00:00:00");
      const diffTime = sugDate - TODAY;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return `${Math.abs(diffDays)}d retraso`;
      } else if (diffDays === 0) {
        return "Hoy";
      } else if (diffDays === 1) {
        return "Mañana";
      } else {
        return `${diffDays}d`;
      }
    }

    function getDaysRemainingBadge(c) {
      if (!c.suggestedDate) {
        return { text: "SIN FECHA", icon: "📅" };
      }
      const sugDate = new Date(c.suggestedDate + "T00:00:00");
      const diffTime = sugDate - TODAY;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          text: `${Math.abs(diffDays)}D RETRASO`,
          icon: "⚠️"
        };
      } else if (diffDays === 0) {
        return {
          text: "HOY",
          icon: "⏱"
        };
      } else if (diffDays === 1) {
        return {
          text: "1 DÍA",
          icon: "⏱"
        };
      } else {
        return {
          text: `${diffDays} DÍAS`,
          icon: c.cycleDays !== null ? "🔄" : "📅"
        };
      }
    }


    // ==========================================================================
    // TAB NAVIGATION CONTROLLER
    // ==========================================================================
    function switchTab(tabId) {
      currentTab = tabId;
      closeContactDetailPanel();

      // Deactivate all nav items
      const sideNavItems = document.querySelectorAll('.toca-sidebar .nav-item');
      const mobNavItems = document.querySelectorAll('.toca-bottom-nav .mobile-nav-item');
      
      sideNavItems.forEach(item => item.classList.remove('active'));
      mobNavItems.forEach(item => item.classList.remove('active'));

      // Deactivate all tab content views
      const tabViews = document.querySelectorAll('.tab-content');
      tabViews.forEach(view => view.classList.remove('active'));

      // Activate selected tab content
      const targetView = document.getElementById(`tab-${tabId}`);
      if (targetView) targetView.classList.add('active');

      // Activate selected navigation element
      const activeSide = document.getElementById(`side-nav-${tabId}`);
      const activeMob = document.getElementById(`mob-nav-${tabId}`);

      if (activeSide) activeSide.classList.add('active');
      if (activeMob) activeMob.classList.add('active');
      
      // Edge case: profile button highlight
      const sideProfile = document.querySelector('.profile-widget');
      if (sideProfile) {
        sideProfile.style.background = (tabId === 'profile') ? 'rgba(139, 92, 246, 0.1)' : '';
      }

      // Re-trigger layout adjustments and renders
      if (tabId === 'inicio') {
        renderDashboard();
      } else if (tabId === 'clientes') {
        renderClientesTab();
      } else if (tabId === 'prospectos') {
        renderProspectosTab();
      }
    }

    // ==========================================================================
    // RENDERING: CLIENTES TAB
    // ==========================================================================
    function renderClientesTab() {
      const container = document.getElementById('clientes-list-container');
      if (!container) return;

      const allClients = contacts.filter(c => c.type === 'Cliente');
      const activeClients = allClients.filter(c => !c.archived);
      const archivedClients = allClients.filter(c => c.archived === true);
      
      // Update filter counts
      const countAll = activeClients.length;
      const countRecurrentes = activeClients.filter(c => c.cycleDays !== null).length;
      const countFechaFija = activeClients.filter(c => c.cycleDays === null).length;
      const countPendientes = activeClients.filter(c => c.suggestedDate <= TODAY_STR).length;
      const countArchived = archivedClients.length;

      document.getElementById('count-c-all').innerText = countAll;
      document.getElementById('count-c-recurrentes').innerText = countRecurrentes;
      document.getElementById('count-c-fechafija').innerText = countFechaFija;
      document.getElementById('count-c-pendientes').innerText = countPendientes;
      document.getElementById('count-c-archivados').innerText = countArchived;

      // Apply filter
      let filteredClients = [];
      if (currentClientesFilter === 'Archivados') {
        filteredClients = archivedClients;
      } else if (currentClientesFilter === 'Recurrentes') {
        filteredClients = activeClients.filter(c => c.cycleDays !== null);
      } else if (currentClientesFilter === 'FechaFija') {
        filteredClients = activeClients.filter(c => c.cycleDays === null);
      } else if (currentClientesFilter === 'Pendientes') {
        filteredClients = activeClients.filter(c => c.suggestedDate <= TODAY_STR);
      } else {
        filteredClients = activeClients;
      }

      // Apply search query
      const searchQuery = document.getElementById('clientes-search-input')?.value.toLowerCase().trim() || "";
      if (searchQuery) {
        filteredClients = filteredClients.filter(c => 
          normalizeString(c.name).includes(normalizeString(searchQuery)) || 
          (c.company && normalizeString(c.company).includes(normalizeString(searchQuery)))
        );
      }

      container.innerHTML = "";

      if (filteredClients.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-muted); border: 1px dashed var(--border-color); border-radius: 8px; background: rgba(255,255,255,0.002);">
            No hay clientes que coincidan con la búsqueda o el filtro.
          </div>
        `;
        return;
      }

      filteredClients.forEach(c => {
        const urgency = calculateUrgency(c.suggestedDate);
        const badgeData = getDaysRemainingBadge(c);
        
        const cardContainer = document.createElement('div');
        cardContainer.className = "minimal-card-container";
        cardContainer.id = `card-${c.id}`;
        cardContainer.innerHTML = `
          <div class="minimal-card" onclick="openContactDetailPanel(${c.id})" style="display: flex; flex-direction: column; justify-content: space-between; padding: 14px 16px; box-sizing: border-box; height: 136px;">
            <!-- Top / Identity Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
              <div style="display: flex; flex-direction: column; overflow: hidden; max-width: calc(100% - 100px);">
                <div class="minimal-card-name" style="font-family: var(--font-title); font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</div>
                <div class="minimal-card-company" style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.company || 'Sin Empresa'}</div>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
                <span class="minimal-pill tag-cliente" style="background: ${c.archived ? '#f3f4f6' : 'rgba(16, 185, 129, 0.1)'}; color: ${c.archived ? '#4b5563' : '#047857'}; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.02em;">
                  ${c.archived ? 'Archivado' : 'Cliente'}
                </span>
                ${c.archived ? '' : `
                <span class="detail-badge-pill-styled" style="display: inline-flex; align-items: center; gap: 4px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 999px; padding: 2px 8px; font-size: 0.7rem; color: #4b5563; font-weight: 500;">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4b5563" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-clock" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  ${c.cycleDays !== null ? `${c.cycleDays} días` : 'Fecha Fija'}
                </span>
                `}
              </div>
            </div>

            <!-- Bottom Row with two columns -->
            <div style="display: flex; justify-content: space-between; align-items: flex-end; width: 100%; margin-top: auto;">
              <!-- Left Stack: Badges (phone + calendar next contact) -->
              <div style="display: flex; flex-direction: column; gap: 4px; max-width: calc(100% - 110px);">
                <span class="detail-badge-pill-styled" style="display: inline-flex; align-items: center; gap: 4px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 999px; padding: 2px 8px; font-size: 0.72rem; color: #374151; font-weight: 500; width: fit-content; white-space: nowrap;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  ${c.whatsapp}
                </span>
                ${c.archived ? '' : `
                <span class="detail-badge-pill-styled" style="display: inline-flex; align-items: center; gap: 4px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 999px; padding: 2px 8px; font-size: 0.72rem; color: #374151; font-weight: 500; width: fit-content; white-space: nowrap;">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  Próximo: ${c.suggestedDate ? c.suggestedDate.split('-').slice(1).reverse().join('/') : 'Sin fecha'}
                </span>
                `}
              </div>
              
              <!-- Right: Urgency Pill -->
              ${c.archived ? '' : `
              <div class="minimal-pill time-pill urgency-${urgency.toLowerCase()}" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 700; border-radius: 20px; padding: 4px 10px; height: 24px; flex-shrink: 0; box-sizing: border-box;">
                ${badgeData.icon === "⚠️" 
                  ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`
                  : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
                }
                ${badgeData.text}
              </div>
              `}
            </div>
          </div>
        `;
        container.appendChild(cardContainer);
      });
    }

    // ==========================================================================
    // RENDERING: PROSPECTOS TAB
    // ==========================================================================
    function renderProspectosTab() {
      const container = document.getElementById('prospectos-list-container');
      if (!container) return;

      const allProspects = contacts.filter(c => c.type === 'Prospecto');
      const activeProspects = allProspects.filter(c => !c.archived);
      const archivedProspects = allProspects.filter(c => c.archived === true);

      // Helper function to calculate dynamic stages
      function getProspectStage(c) {
        if (c.fu3) return 'S3';
        if (c.fu2) return 'S2';
        return 'S1';
      }

      // Count filter results
      const countAll = activeProspects.length;
      const countS1 = activeProspects.filter(c => getProspectStage(c) === 'S1').length;
      const countS2 = activeProspects.filter(c => getProspectStage(c) === 'S2').length;
      const countS3 = activeProspects.filter(c => getProspectStage(c) === 'S3').length;
      const countVencidos = activeProspects.filter(c => c.suggestedDate < TODAY_STR).length;
      const countArchived = archivedProspects.length;

      document.getElementById('count-p-all').innerText = countAll;
      document.getElementById('count-p-s1').innerText = countS1;
      document.getElementById('count-p-s2').innerText = countS2;
      document.getElementById('count-p-s3').innerText = countS3;
      document.getElementById('count-p-vencidos').innerText = countVencidos;
      document.getElementById('count-p-archivados').innerText = countArchived;

      // Apply filter
      let filteredProspects = [];
      if (currentProspectosFilter === 'Archivados') {
        filteredProspects = archivedProspects;
      } else if (currentProspectosFilter === 'S1') {
        filteredProspects = activeProspects.filter(c => getProspectStage(c) === 'S1');
      } else if (currentProspectosFilter === 'S2') {
        filteredProspects = activeProspects.filter(c => getProspectStage(c) === 'S2');
      } else if (currentProspectosFilter === 'S3') {
        filteredProspects = activeProspects.filter(c => getProspectStage(c) === 'S3');
      } else if (currentProspectosFilter === 'Vencidos') {
        filteredProspects = activeProspects.filter(c => c.suggestedDate < TODAY_STR);
      } else {
        filteredProspects = activeProspects;
      }

      // Apply search query
      const searchQuery = document.getElementById('prospectos-search-input')?.value.toLowerCase().trim() || "";
      if (searchQuery) {
        filteredProspects = filteredProspects.filter(c => 
          normalizeString(c.name).includes(normalizeString(searchQuery)) || 
          (c.company && normalizeString(c.company).includes(normalizeString(searchQuery)))
        );
      }

      container.innerHTML = "";

      if (filteredProspects.length === 0) {
        container.innerHTML = `
          <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-text-muted); border: 1px dashed var(--border-color); border-radius: 8px; background: rgba(255,255,255,0.002);">
            No hay prospectos que coincidan con la búsqueda o el filtro.
          </div>
        `;
        return;
      }

      filteredProspects.forEach(c => {
        const urgency = calculateUrgency(c.suggestedDate);
        const badgeData = getDaysRemainingBadge(c);
        
        const cardContainer = document.createElement('div');
        cardContainer.className = "minimal-card-container";
        cardContainer.id = `card-${c.id}`;
        cardContainer.innerHTML = `
          <div class="minimal-card" onclick="openContactDetailPanel(${c.id})" style="display: flex; flex-direction: column; justify-content: space-between; padding: 14px 16px; box-sizing: border-box; height: 168px;">
            <!-- Top / Identity Row -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
              <div style="display: flex; flex-direction: column; overflow: hidden; max-width: calc(100% - 110px);">
                <div class="minimal-card-name" style="font-family: var(--font-title); font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</div>
                <div class="minimal-card-company" style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.company || 'Sin Empresa'}</div>
              </div>
              <span class="minimal-pill tag-prospecto" style="background: ${c.archived ? '#f3f4f6' : 'rgba(139, 92, 246, 0.1)'}; color: ${c.archived ? '#4b5563' : '#7c3aed'}; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.02em; flex-shrink: 0;">
                ${c.archived ? 'Archivado' : 'Prospecto'}
              </span>
            </div>

            <!-- Context Strip (Full Width) -->
            <div class="minimal-card-context-strip" style="background: #f3f4f6; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; color: #374151; margin-top: 6px; margin-bottom: 6px; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; width: 100%; box-sizing: border-box; border: 1px solid rgba(0,0,0,0.02);">
              ${c.context || 'Sin notas ni contexto inicial registrados.'}
            </div>

            <!-- Badges Row -->
            <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 6px; width: 100%;">
              <span class="detail-badge-pill-styled" style="display: inline-flex; align-items: center; gap: 4px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 999px; padding: 2px 8px; font-size: 0.72rem; color: #374151; font-weight: 500; white-space: nowrap;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#db2777" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                ${c.whatsapp}
              </span>
              ${c.archived ? '' : `
              <span class="detail-badge-pill-styled" style="display: inline-flex; align-items: center; gap: 4px; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 999px; padding: 2px 8px; font-size: 0.72rem; color: #374151; font-weight: 500; white-space: nowrap;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                Próximo: ${c.suggestedDate ? c.suggestedDate.split('-').slice(1).reverse().join('/') : 'Sin fecha'}
              </span>
              `}
            </div>

            <!-- Bottom Row: Urgency Pill (Left Aligned) -->
            <div style="display: flex; align-items: center; width: 100%; margin-top: auto;">
              ${c.archived ? '' : `
              <div class="minimal-pill time-pill urgency-${urgency.toLowerCase()}" style="display: inline-flex; align-items: center; gap: 4px; font-size: 0.7rem; font-weight: 700; border-radius: 20px; padding: 4px 10px; height: 24px; box-sizing: border-box;">
                ${badgeData.icon === "⚠️" 
                  ? `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>`
                  : `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`
                }
                ${badgeData.text}
              </div>
              `}
            </div>
          </div>
        `;
        container.appendChild(cardContainer);
      });
    }

    // ==========================================================================
    // RENDERING FUNCTIONS (Dashboard - Inicio)
    // ==========================================================================
    function renderDashboard() {
      const activeContacts = contacts.filter(c => !c.archived);
      const dailyToques = activeContacts.filter(c => c.status === "Toque del día");
      
      document.getElementById('app-greeting').innerHTML = `Hola Javier, hoy tienes <span style="color:var(--color-accent); font-weight:700;">${dailyToques.length}</span> toques pendientes.`;
      
      const totalInitialCount = dailyToques.length;
      const filterRow = document.getElementById('filters-row');
      
      const countRed = dailyToques.filter(c => calculateUrgency(c.suggestedDate) === "Rojo").length;
      const countYellow = dailyToques.filter(c => calculateUrgency(c.suggestedDate) === "Amarillo").length;
      const countGreen = dailyToques.filter(c => calculateUrgency(c.suggestedDate) === "Verde").length;

      document.getElementById('count-all').innerText = dailyToques.length;
      document.getElementById('count-red').innerText = countRed;
      document.getElementById('count-yellow').innerText = countYellow;
      document.getElementById('count-green').innerText = countGreen;

      if (totalInitialCount > 0) {
        filterRow.style.display = "flex";
      } else {
        filterRow.style.display = "none";
        currentFilter = 'Todos'; 
      }

      // Render Esperando Respuesta List
      const waitingList = activeContacts.filter(c => c.status === "Esperando respuesta");
      document.getElementById('waiting-count').innerText = waitingList.length;
      renderWaitingSection(waitingList);

      // Render Toques del Día List
      const filteredDaily = dailyToques.filter(c => {
        if (currentFilter === 'Todos') return true;
        return calculateUrgency(c.suggestedDate) === currentFilter;
      });

      filteredDaily.sort((a, b) => {
        const order = { "Rojo": 1, "Amarillo": 2, "Verde": 3 };
        const urgA = order[calculateUrgency(a.suggestedDate)] || 3;
        const urgB = order[calculateUrgency(b.suggestedDate)] || 3;
        if (urgA !== urgB) return urgA - urgB;
        return new Date(a.suggestedDate) - new Date(b.suggestedDate);
      });

      renderDailySection(filteredDaily, dailyToques.length);
    }

    function renderWaitingSection(list) {
      const container = document.getElementById('waiting-list-container');
      container.innerHTML = "";

      if (list.length === 0) {
        container.innerHTML = `
          <div style="font-size: 0.85rem; color: var(--color-text-muted); text-align: center; padding: 16px 0; border: 1px dashed var(--border-color); border-radius: 8px; grid-column: 1/-1; background: #ffffff;">
            No hay ningún contacto esperando respuesta en este momento.
          </div>
        `;
        return;
      }

      list.forEach(c => {
        const isNearArchive = c.daysWaiting >= 5;
        const warningIcon = isNearArchive ? `⚠️` : `⏱`;
        const warningMsg = isNearArchive ? `${7 - c.daysWaiting}D P/ARCHIVAR` : `${c.daysWaiting}D EN ESPERA`;

        const cardContainer = document.createElement('div');
        cardContainer.className = "minimal-card-container";
        cardContainer.id = `card-${c.id}`;
        cardContainer.innerHTML = `
          <div class="minimal-card">
            <div class="minimal-card-urgency-bar status-waiting"></div>
            <div class="minimal-card-top">
              <div class="minimal-card-identity">
                <a class="minimal-card-name" onclick="openContactDetailPanel(${c.id})">${c.name}</a>
                <div class="minimal-card-company">${c.company || 'Sin Empresa'}</div>
              </div>
              <span class="minimal-pill tag-${c.type.toLowerCase()}">${c.type}</span>
            </div>
            <div class="minimal-card-bottom">
              <div class="minimal-pill time-pill status-waiting" style="color: ${isNearArchive ? 'var(--color-attention)' : 'var(--color-waiting)'}; font-weight: 700;">
                <span class="icon">${warningIcon}</span> ${warningMsg}
              </div>
              <div class="minimal-card-actions">
                <button class="btn-hecho-check" style="height: 28px; padding: 4px 12px; font-size: 0.75rem;" onclick="showResolutionSelector(${c.id})">✎ Actualizar</button>
              </div>
            </div>
          </div>
          <div id="inline-container-${c.id}"></div>
        `;
        container.appendChild(cardContainer);
      });
    }

    function renderDailySection(list, totalUnfilteredCount) {
      const container = document.getElementById('daily-list-container');
      container.innerHTML = "";

      if (totalUnfilteredCount === 0) {
        container.innerHTML = `
          <div class="empty-state-view" style="grid-column: 1/-1;">
            <div class="empty-icon">🎉</div>
            <div class="empty-title">¡Todo contactado por hoy!</div>
            <div class="empty-subtitle">Buen trabajo. Has completado tus toques diarios. Mañana habrá más.</div>
          </div>
        `;
        return;
      }

      if (list.length === 0 && currentFilter !== 'Todos') {
        container.innerHTML = `
          <div class="empty-state-view" style="grid-column: 1/-1;">
            <div class="empty-icon">🔍</div>
            <div class="empty-title">Sin pendientes en este filtro</div>
            <div class="empty-subtitle">Prueba a seleccionar otro nivel de urgencia o registra un contacto nuevo.</div>
          </div>
        `;
        return;
      }

      // Group lists by urgency
      const redList = list.filter(c => calculateUrgency(c.suggestedDate) === "Rojo");
      const yellowList = list.filter(c => calculateUrgency(c.suggestedDate) === "Amarillo");
      const greenList = list.filter(c => calculateUrgency(c.suggestedDate) === "Verde");

      // Helper function to render a list into a sub-grid container
      function renderGroupGrid(groupList) {
        if (groupList.length === 0) return null;

        const grid = document.createElement('div');
        grid.className = 'daily-list';
        grid.style.marginBottom = '16px';

        groupList.forEach(c => {
          const urgency = calculateUrgency(c.suggestedDate);
          const badgeData = getDaysRemainingBadge(c);

          const cardContainer = document.createElement('div');
          cardContainer.className = "minimal-card-container";
          cardContainer.id = `card-${c.id}`;

          cardContainer.innerHTML = `
            <div class="minimal-card">
              <div class="minimal-card-urgency-bar ${urgency.toLowerCase()}"></div>
              <div class="minimal-card-top">
                <div class="minimal-card-identity">
                  <a class="minimal-card-name" onclick="openContactDetailPanel(${c.id})">${c.name}</a>
                  <div class="minimal-card-company">${c.company || 'Sin Empresa'}</div>
                </div>
                <span class="minimal-pill tag-${c.type.toLowerCase()}">${c.type}</span>
              </div>
              <div class="minimal-card-bottom">
                <div class="minimal-pill time-pill urgency-${urgency.toLowerCase()}">
                  <span class="icon">${badgeData.icon}</span> ${badgeData.text}
                </div>
                <div class="minimal-card-actions">
                  <button class="btn-sug-ia" id="btn-sug-toggle-${c.id}" onclick="toggleSuggestionsInline(${c.id})">
                    ✨ Sugerencias IA
                  </button>
                  <button class="btn-hecho-check" onclick="moveToWaiting(${c.id})">
                    Hecho ✓
                  </button>
                </div>
              </div>
            </div>
            <div id="suggestions-inline-${c.id}" style="display: none;"></div>
            <div id="inline-container-${c.id}"></div>
          `;
          grid.appendChild(cardContainer);
        });

        return grid;
      }

      const redGrid = renderGroupGrid(redList);
      const yellowGrid = renderGroupGrid(yellowList);
      const greenGrid = renderGroupGrid(greenList);

      if (redGrid) container.appendChild(redGrid);
      if (yellowGrid) container.appendChild(yellowGrid);
      if (greenGrid) container.appendChild(greenGrid);
    }

    let undoTimeout = null;
    let undoInterval = null;
    let undoContactId = null;
    let undoOriginalData = null;

    function moveToWaiting(id) {
      if (undoTimeout) {
        clearTimeout(undoTimeout);
        clearInterval(undoInterval);
        finalizeUndo();
      }

      const contact = contacts.find(c => c.id === id);
      if (!contact) return;

      undoContactId = id;
      undoOriginalData = {
        status: contact.status,
        waitingSince: contact.waitingSince,
        daysWaiting: contact.daysWaiting,
        suggestedDate: contact.suggestedDate
      };

      contact.status = "Esperando respuesta";
      contact.waitingSince = "hoy a las " + new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
      contact.daysWaiting = 0;



      renderAllTabs();

      let secondsLeft = 9;
      showUndoToast(contact.name, secondsLeft);

      undoInterval = setInterval(() => {
        secondsLeft--;
        if (secondsLeft <= 0) {
          clearInterval(undoInterval);
        } else {
          updateUndoToastLabel(secondsLeft);
        }
      }, 1000);

      undoTimeout = setTimeout(() => {
        finalizeUndo();
      }, 9000);
    }

    function revertLastAction() {
      if (undoContactId && undoOriginalData) {
        const contact = contacts.find(c => c.id === undoContactId);
        if (contact) {
          contact.status = undoOriginalData.status;
          contact.waitingSince = undoOriginalData.waitingSince;
          contact.daysWaiting = undoOriginalData.daysWaiting;
          contact.suggestedDate = undoOriginalData.suggestedDate;
          
          showToast("Acción revertida. Contacto devuelto a la lista diaria.");
        }
      }
      clearUndoState();
      renderAllTabs();
    }

    function finalizeUndo() {
      clearUndoState();
    }

    function clearUndoState() {
      if (undoTimeout) clearTimeout(undoTimeout);
      if (undoInterval) clearInterval(undoInterval);
      undoTimeout = null;
      undoInterval = null;
      undoContactId = null;
      undoOriginalData = null;
      
      const activeUndoToast = document.getElementById('undo-toast');
      if (activeUndoToast) {
        activeUndoToast.style.animation = "fadeIn 0.25s reverse forwards";
        setTimeout(() => activeUndoToast.remove(), 250);
      }
    }

    function showUndoToast(name, seconds) {
      const existing = document.getElementById('undo-toast');
      if (existing) existing.remove();

      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = "toast";
      toast.id = "undo-toast";
      toast.style.borderLeftColor = "var(--color-attention)";
      toast.innerHTML = `
        <span>${name} movido a Esperando respuesta.</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <a class="toast-action" onclick="revertLastAction()" id="undo-btn-label">Revertir (${seconds}s)</a>
          <span style="font-size:1.1rem; cursor:pointer; color:var(--color-text-muted);" onclick="clearUndoState()">&times;</span>
        </div>
      `;
      container.appendChild(toast);
    }

    function updateUndoToastLabel(seconds) {
      const btn = document.getElementById('undo-btn-label');
      if (btn) {
        btn.innerText = `Revertir (${seconds}s)`;
      }
    }

    // ==========================================================================
    // TOAST NOTIFICATIONS & AUXILIARY ACTIONS
    // ==========================================================================
    function showToast(message) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = "toast";
      toast.innerHTML = `
        <span>${message}</span>
        <span style="font-size:1.1rem; cursor:pointer; color:var(--color-text-muted);" onclick="this.parentElement.remove()">&times;</span>
      `;
      container.appendChild(toast);

      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = "fadeIn 0.25s reverse forwards";
          setTimeout(() => toast.remove(), 250);
        }
      }, 4000);
    }

    function showToastWithAction(message, actionLabel, actionCallback) {
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = "toast";
      
      const actionId = `toast-action-${Math.random().toString(36).substr(2, 9)}`;
      
      toast.innerHTML = `
        <span>${message}</span>
        <div style="display:flex; align-items:center; gap:8px;">
          <a class="toast-action" id="${actionId}">${actionLabel}</a>
          <span style="font-size:1.1rem; cursor:pointer; color:var(--color-text-muted);" onclick="this.parentElement.parentElement.remove()">&times;</span>
        </div>
      `;
      container.appendChild(toast);

      const actionBtn = toast.querySelector(`#${actionId}`);
      if (actionBtn) {
        actionBtn.addEventListener('click', () => {
          actionCallback();
          toast.remove();
        });
      }

      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = "fadeIn 0.25s reverse forwards";
          setTimeout(() => toast.remove(), 250);
        }
      }, 8000);
    }

    function openEditCycleDetail(id) {
      openContactDetailPanel(id);
    }

    // ==========================================================================
    // ACTION HANDLERS: ESPERANDO RESPUESTA WORKFLOW
    // ==========================================================================
    function toggleWaitingSection() {
      const widget = document.getElementById('section-waiting-widget');
      isWaitingCollapsed = !isWaitingCollapsed;
      if (isWaitingCollapsed) {
        widget.classList.add('collapsed');
      } else {
        widget.classList.remove('collapsed');
      }
    }

    function showResolutionSelector(id) {
      const container = document.getElementById(`inline-container-${id}`);
      const contact = contacts.find(c => c.id === id);

      let optionsHtml = '';
      if (contact.type === 'Prospecto') {
        optionsHtml = `
          <button class="resolution-btn" style="padding: 4px 6px; font-size: 0.72rem; width:100%; text-align: center;" onclick="resolutionDiscussLater(${id})">💬 Conversar luego</button>
          <button class="resolution-btn" style="padding: 4px 6px; font-size: 0.72rem; width:100%; text-align: center;" onclick="resolutionCloseDeal(${id})">🏆 Cerrar trato</button>
          <button class="resolution-btn" style="padding: 4px 6px; font-size: 0.72rem; width:100%; text-align: center;" onclick="resolutionNoAgreement(${id})">❌ Archivar</button>
          <button class="resolution-btn" style="padding: 4px 6px; font-size: 0.72rem; width:100%; text-align: center;" onclick="resolutionOfferSomethingNew(${id})">🔄 Oferta nueva</button>
          <button class="resolution-btn" style="padding: 4px 6px; font-size: 0.72rem; width:100%; text-align: center; color:var(--color-text-muted);" onclick="cancelResolution(${id})">✕ Cancelar</button>
        `;
      } else {
        optionsHtml = `
          <button class="resolution-btn" style="padding: 4px 6px; font-size: 0.72rem; width:100%; text-align: center;" onclick="resolutionDiscussLater(${id})">💬 Conversar luego</button>
          <button class="resolution-btn" style="padding: 4px 6px; font-size: 0.72rem; width:100%; text-align: center;" onclick="resolutionCloseDeal(${id})">🏆 Cerrar trato</button>
          <button class="resolution-btn" style="padding: 4px 6px; font-size: 0.72rem; width:100%; text-align: center; color:var(--color-text-muted);" onclick="cancelResolution(${id})">✕ Cancelar</button>
        `;
      }

      container.style.position = 'absolute';
      container.style.top = '0';
      container.style.left = '0';
      container.style.right = '0';
      container.style.bottom = '0';
      container.style.background = '#ffffff';
      container.style.border = '1px solid var(--border-color)';
      container.style.zIndex = '10';
      container.style.padding = '8px';
      container.style.borderRadius = '16px';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.justifyContent = 'center';
      container.style.gap = '4px';

      container.innerHTML = `
        <div style="font-size: 0.75rem; font-weight: 600; text-align: center; margin-bottom: 2px; color: var(--color-text-primary);">¿Qué pasó?</div>
        <div style="display: flex; flex-direction: column; gap: 4px; overflow-y: auto;">
          ${optionsHtml}
        </div>
        <div id="resolution-subform-${id}"></div>
      `;
    }

    function cancelResolution(id) {
      renderAllTabs();
    }

    function resolutionDiscussLater(id) {
      const subform = document.getElementById(`resolution-subform-${id}`);
      
      const suggestedDate = new Date(TODAY);
      suggestedDate.setDate(suggestedDate.getDate() + 3);
      const year = suggestedDate.getFullYear();
      const month = String(suggestedDate.getMonth() + 1).padStart(2, '0');
      const day = String(suggestedDate.getDate()).padStart(2, '0');
      const minDateStr = `${year}-${month}-${day}`;

      subform.innerHTML = `
        <div class="date-selector-container" style="margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--border-color);">
          <div style="font-size:0.68rem; margin-bottom: 3px; text-align:center; color: var(--color-text-secondary);">Confirmar fecha:</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            <input type="date" class="date-input" id="new-fu-date-${id}" value="${minDateStr}" style="padding: 4px; font-size: 0.72rem; text-align: center; width: 100%;">
            <button class="btn-primary" style="padding: 4px; font-size: 0.72rem; justify-content: center; width: 100%;" onclick="saveDiscussLater(${id})">Guardar</button>
          </div>
        </div>
      `;
    }

    function saveDiscussLater(id) {
      const newDateStr = document.getElementById(`new-fu-date-${id}`).value;
      if (!newDateStr) return;

      const contact = contacts.find(c => c.id === id);
      contact.status = "Toque del día";
      contact.suggestedDate = newDateStr;
      
      if (!contact.fu1) contact.fu1 = newDateStr;
      else if (!contact.fu2) contact.fu2 = newDateStr;
      else contact.fu3 = newDateStr;

      showToast(`Se programó contacto para el ${newDateStr}. Movido a Toques del Día.`);
      renderAllTabs();
    }

    function resolutionCloseDeal(id) {
      const contact = contacts.find(c => c.id === id);
      
      if (contact.type === 'Cliente') {
        contact.status = "Toque del día";
        
        if (contact.cycleDays !== null) {
          const cycle = contact.cycleDays || 28;
          const nextContact = new Date(TODAY);
          nextContact.setDate(nextContact.getDate() + cycle);
          const year = nextContact.getFullYear();
          const month = String(nextContact.getMonth() + 1).padStart(2, '0');
          const day = String(nextContact.getDate()).padStart(2, '0');
          contact.suggestedDate = `${year}-${month}-${day}`;

          showToastWithAction(
            `Cerraste un nuevo trato con ${contact.name.split(' ')[0]}. Ciclo: ${cycle} días.`,
            "Editar",
            () => openEditCycleDetail(contact.id)
          );
        } else {
          // Fecha determinada - sumamos 365 días (1 año) para renovación anual
          const nextContact = new Date(TODAY);
          nextContact.setFullYear(nextContact.getFullYear() + 1);
          const year = nextContact.getFullYear();
          const month = String(nextContact.getMonth() + 1).padStart(2, '0');
          const day = String(nextContact.getDate()).padStart(2, '0');
          contact.suggestedDate = `${year}-${month}-${day}`;

          showToastWithAction(
            `Cerraste un nuevo trato con ${contact.name.split(' ')[0]}. Renovado a fecha fija (anual).`,
            "Editar",
            () => openEditCycleDetail(contact.id)
          );
        }
      } else {
        contact.type = 'Cliente';
        contact.status = "Toque del día";
        contact.cycleDays = 28; // Por defecto al cerrar trato prospecto -> cliente recurrente
        
        const nextContact = new Date(TODAY);
        nextContact.setDate(nextContact.getDate() + 28);
        const year = nextContact.getFullYear();
        const month = String(nextContact.getMonth() + 1).padStart(2, '0');
        const day = String(nextContact.getDate()).padStart(2, '0');
        contact.suggestedDate = `${year}-${month}-${day}`;

        showToastWithAction(
          `¡Trato cerrado! ${contact.name} ya es cliente. Ciclo: 28 días.`,
          "Editar",
          () => openEditCycleDetail(contact.id)
        );
      }

      renderAllTabs();
    }

    // Archive contact helper
    function archiveContact(id) {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        contact.archived = true;
        const now = new Date();
        const months = ["ENE.", "FEB.", "MAR.", "ABR.", "MAY.", "JUN.", "JUL.", "AGO.", "SEP.", "OCT.", "NOV.", "DIC."];
        contact.archivedDate = `${now.getDate()} ${months[now.getMonth()]}`;
        
        showToastWithAction(
          `${contact.name} fue archivado con éxito.`,
          "Deshacer",
          () => {
            contact.archived = false;
            delete contact.archivedDate;
            showToast("Contacto restaurado.");
            renderAllTabs();
          }
        );
        
        renderAllTabs();
      }
    }

    function restoreContact(id) {
      const contact = contacts.find(c => c.id === id);
      if (contact) {
        contact.archived = false;
        delete contact.archivedDate;
        showToast(`${contact.name} ha sido restaurado y reactivado.`);
        closeContactDetailPanel();
        renderAllTabs();
      }
    }

    function deleteContact(id) {
      const contact = contacts.find(c => c.id === id);
      if (!contact) return;
      
      if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${contact.name}? Esta acción no se puede deshacer.`)) {
        const index = contacts.findIndex(c => c.id === id);
        if (index !== -1) {
          contacts.splice(index, 1);
          showToast(`${contact.name} ha sido eliminado permanentemente.`);
          closeContactDetailPanel();
          renderAllTabs();
        }
      }
    }

    // Render helper to update all screens with new state
    function renderAllTabs() {
      renderDashboard();
      renderClientesTab();
      renderProspectosTab();
    }



    function generateIaSuggestionsHtml(id) {
      const c = contacts.find(contact => contact.id === id);
      if (!c) return '';

      const hasContext = c.context && c.context.trim() !== "";
      const first = c.name.split(' ')[0];
      
      let suggestions = {};
      if (hasContext) {
        const contextLower = c.context.toLowerCase();
        suggestions = {
          Cercano: `¡Hola ${first}! 😊 ¿Cómo va todo? Quedé atento a lo que conversamos sobre ${contextLower.replace(/\.$/, '')}. Cuéntame si pudiste darle una mirada o si tienes alguna duda. ¡Abrazo!`,
          Directo: `Estimado ${first}, espero que se encuentre muy bien. Le escribo para dar seguimiento a nuestro tema pendiente sobre ${contextLower.replace(/\.$/, '')} y saber si podemos agendar una breve llamada hoy. Quedo a su disposición.`,
          "Con gancho": `Hola ${first}, ¿cómo estás? Hace un momento estuve revisando los detalles sobre ${contextLower.replace(/\.$/, '')} y creo que tengo una idea genial que podría simplificar las cosas. ¿Tendrás 5 minutos para conversar en la tarde?`
        };
      } else {
        suggestions = {
          Cercano: `¡Hola ${first}! 😊 ¿Cómo va todo? Te escribía para saludarte y ver si pudimos retomar nuestra conversación pendiente de hace unos días. ¡Abrazo!`,
          Directo: `Estimado ${first}, espero que se encuentre muy bien. Le escribo para dar seguimiento a nuestro tema pendiente y saber si tiene unos minutos libres para conversar hoy.`,
          "Con gancho": `Hola ${first}, ¿cómo estás? He estado pensando en una alternativa que podría interesarte para el proyecto que tenemos en mente. ¿Te viene bien una breve llamada hoy?`
        };
      }

      return `
        <div class="ia-suggestions-inline-box" style="margin-top: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px; animation: slideDown 0.25s ease-out;">
          <div style="font-size: 0.75rem; color: #7c3aed; font-weight: 600; display: flex; align-items: center; gap: 6px;">
            <span>✨ Sugerencias de Mensajes IA</span>
          </div>
          <div style="font-size: 0.7rem; color: var(--color-text-muted); font-style: italic; margin-bottom: 2px;">
            Contexto: "${c.context || 'Sin contexto registrado (usando plantilla base)'}"
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div class="ia-suggestion-card" style="padding: 8px; background: #ffffff; border-radius: 6px; border: 1px solid var(--border-color);">
              <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Cercano</span>
              <p class="ia-text" id="sug-cercano-${id}" style="font-size: 0.78rem; margin: 4px 0; color: var(--color-text-primary);">${suggestions.Cercano}</p>
              <div class="ia-card-actions" style="margin-top: 4px; display: flex; gap: 6px;">
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionSendMessage(${id}, 'sug-cercano-${id}')">↗ WhatsApp</button>
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionCopyMessage(${id}, 'sug-cercano-${id}', this)">⧉ Copiar</button>
              </div>
            </div>
            
            <div class="ia-suggestion-card" style="padding: 8px; background: #ffffff; border-radius: 6px; border: 1px solid var(--border-color);">
              <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Directo</span>
              <p class="ia-text" id="sug-directo-${id}" style="font-size: 0.78rem; margin: 4px 0; color: var(--color-text-primary);">${suggestions.Directo}</p>
              <div class="ia-card-actions" style="margin-top: 4px; display: flex; gap: 6px;">
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionSendMessage(${id}, 'sug-directo-${id}')">↗ WhatsApp</button>
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionCopyMessage(${id}, 'sug-directo-${id}', this)">⧉ Copiar</button>
              </div>
            </div>
            
            <div class="ia-suggestion-card" style="padding: 8px; background: #ffffff; border-radius: 6px; border: 1px solid var(--border-color);">
              <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Con gancho</span>
              <p class="ia-text" id="sug-gancho-${id}" style="font-size: 0.78rem; margin: 4px 0; color: var(--color-text-primary);">${suggestions["Con gancho"]}</p>
              <div class="ia-card-actions" style="margin-top: 4px; display: flex; gap: 6px;">
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionSendMessage(${id}, 'sug-gancho-${id}')">↗ WhatsApp</button>
                <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionCopyMessage(${id}, 'sug-gancho-${id}', this)">⧉ Copiar</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }



    function actionSendMessage(id, elementId) {
      const text = document.getElementById(elementId).innerText;
      const contact = contacts.find(c => c.id === id);
      const url = `https://wa.me/${contact.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`;
      
      window.open(url, '_blank');
      showToast(`Mensaje enviado a WhatsApp para ${contact.name}.`);
    }

    function actionCopyMessage(id, elementId, btn) {
      const text = document.getElementById(elementId).innerText;
      navigator.clipboard.writeText(text).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = "✓ Copiado";
        btn.style.color = "var(--color-ontrack)";
        
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.color = "";
        }, 1600);
        showToast("Mensaje copiado al portapapeles.");
      });
    }

    // ==========================================================================
    // MODAL: NUEVO CONTACTO DIALOG
    // ==========================================================================
    function openNewContactModal() {
      const modal = document.getElementById('new-contact-modal');
      modal.classList.add('open');
      
      selectContactType(lastUsedType);
      
      document.getElementById('modal-step-selection').style.display = 'block';
      document.getElementById('modal-step-form-prospecto').style.display = 'none';
      document.getElementById('modal-step-form-cliente').style.display = 'none';

      document.getElementById('p-fu1').value = TODAY_STR;
      
      // Reset follow mode in Client form
      const followModeSelect = document.getElementById('c-follow-mode');
      if (followModeSelect) {
        followModeSelect.value = 'recurrente';
        toggleClientFollowModeModal();
      }
    }

    function toggleClientFollowModeModal() {
      const modeSelect = document.getElementById('c-follow-mode');
      if (!modeSelect) return;
      
      const mode = modeSelect.value;
      const cycleGroup = document.getElementById('c-cycle-group');
      const dateGroup = document.getElementById('c-date-group');
      const dateInput = document.getElementById('c-date');
      
      if (mode === 'recurrente') {
        cycleGroup.style.display = 'block';
        dateGroup.style.display = 'none';
        if (dateInput) dateInput.required = false;
      } else {
        cycleGroup.style.display = 'none';
        dateGroup.style.display = 'block';
        if (dateInput) {
          dateInput.required = true;
          if (!dateInput.value) {
            const defaultDate = new Date(TODAY);
            defaultDate.setDate(defaultDate.getDate() + 28);
            const y = defaultDate.getFullYear();
            const m = String(defaultDate.getMonth() + 1).padStart(2, '0');
            const d = String(defaultDate.getDate()).padStart(2, '0');
            dateInput.value = `${y}-${m}-${d}`;
          }
        }
      }
    }

    function closeNewContactModal() {
      document.getElementById('new-contact-modal').classList.remove('open');
    }

    function selectContactType(type) {
      selectedTypeInModal = type;
      
      const cardProspecto = document.getElementById('type-card-prospecto');
      const cardCliente = document.getElementById('type-card-cliente');
      const badgeProspecto = document.getElementById('prospecto-last-badge');
      const badgeCliente = document.getElementById('cliente-last-badge');

      cardProspecto.classList.remove('selected');
      cardCliente.classList.remove('selected');
      badgeProspecto.style.display = 'none';
      badgeCliente.style.display = 'none';

      if (type === 'Prospecto') {
        cardProspecto.classList.add('selected');
        badgeProspecto.style.display = 'block';
      } else {
        cardCliente.classList.add('selected');
        badgeCliente.style.display = 'block';
      }
    }

    function proceedToForm() {
      lastUsedType = selectedTypeInModal;
      document.getElementById('modal-step-selection').style.display = 'none';
      
      if (selectedTypeInModal === 'Prospecto') {
        document.getElementById('modal-step-form-prospecto').style.display = 'block';
      } else {
        document.getElementById('modal-step-form-cliente').style.display = 'block';
      }
    }

    function backToSelection() {
      document.getElementById('modal-step-selection').style.display = 'block';
      document.getElementById('modal-step-form-prospecto').style.display = 'none';
      document.getElementById('modal-step-form-cliente').style.display = 'none';
    }

    function submitProspectForm(event) {
      event.preventDefault();
      
      const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
      const name = document.getElementById('p-name').value;
      const whatsapp = document.getElementById('p-whatsapp').value;
      const company = document.getElementById('p-company').value;
      const context = document.getElementById('p-context').value;
      const fu1 = document.getElementById('p-fu1').value;
      const fu2 = document.getElementById('p-fu2').value;
      const fu3 = document.getElementById('p-fu3').value;

      const newProspect = {
        id: newId,
        name: name,
        company: company,
        type: "Prospecto",
        context: context,
        status: "Toque del día",
        fu1: fu1,
        fu2: fu2,
        fu3: fu3,
        whatsapp: whatsapp,
        suggestedDate: fu1, 
        lastContacted: "Recién creado"
      };

      contacts.push(newProspect);
      closeNewContactModal();
      document.getElementById('form-prospecto').reset();
      showToast(`Prospecto ${name} agregado con éxito.`);
      renderAllTabs();
    }

    function submitClienteForm(event) {
      event.preventDefault();

      const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
      const name = document.getElementById('c-name').value;
      const whatsapp = document.getElementById('c-whatsapp').value;
      const company = document.getElementById('c-company').value;
      const context = document.getElementById('c-context').value;
      
      const followMode = document.getElementById('c-follow-mode').value;
      let cycleDays = null;
      let suggestedDateStr = '';

      if (followMode === 'recurrente') {
        const cycleSelect = document.getElementById('c-cycle').value;
        cycleDays = parseInt(cycleSelect) || 28;
        const sugDate = new Date(TODAY);
        sugDate.setDate(sugDate.getDate() + cycleDays);
        const year = sugDate.getFullYear();
        const month = String(sugDate.getMonth() + 1).padStart(2, '0');
        const day = String(sugDate.getDate()).padStart(2, '0');
        suggestedDateStr = `${year}-${month}-${day}`;
      } else {
        suggestedDateStr = document.getElementById('c-date').value;
        cycleDays = null;
      }

      const newClient = {
        id: newId,
        name: name,
        company: company,
        type: "Cliente",
        context: context,
        status: "Toque del día",
        whatsapp: whatsapp,
        suggestedDate: suggestedDateStr,
        lastContacted: "Recién creado",
        cycleDays: cycleDays
      };

      contacts.push(newClient);
      closeNewContactModal();
      document.getElementById('form-cliente').reset();
      
      // Reset follow mode in Client form
      document.getElementById('c-follow-mode').value = 'recurrente';
      toggleClientFollowModeModal();

      const msg = cycleDays 
        ? `Cliente ${name} agregado con éxito. Ciclo: ${cycleDays} días.`
        : `Cliente ${name} agregado con éxito. Siguiente contacto: ${suggestedDateStr}.`;
      showToast(msg);
      renderAllTabs();
    }

    // ==========================================================================
    // SLIDE OUT DETAIL PANEL (FICHA DE CONTACTO EDITABLE)
    // ==========================================================================
    function openContactDetailPanel(id) {
      const panel = document.getElementById('contact-detail-panel');
      const c = contacts.find(contact => contact.id === id);
      if (!c) return;

      selectedContactId = id;
      document.getElementById('detail-title').innerText = c.type === 'Prospecto' ? 'Ficha de Prospecto' : 'Ficha de Cliente';
      
      const body = document.getElementById('detail-body');
      
      // Calculate dynamic variables for header card
      const initials = c.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
      const urgency = calculateUrgency(c.suggestedDate);
      
      let urgencyClass = 'ontrack';
      let urgencyLabel = '• Al día';
      if (urgency === 'Rojo') {
        urgencyClass = 'urgent';
        urgencyLabel = '• Urgente';
      } else if (urgency === 'Amarillo') {
        urgencyClass = 'attention';
        urgencyLabel = '• Atención';
      }
      
      let timeLabel = '';
      if (c.type === 'Cliente') {
        timeLabel = c.cycleDays !== null ? `${c.cycleDays} días` : 'Fecha Fija';
      } else {
        const nextContact = c.suggestedDate || c.fu1 || TODAY_STR;
        const nextDate = new Date(nextContact + "T00:00:00");
        const diffTime = nextDate - TODAY;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        timeLabel = diffDays < 0 ? `${Math.abs(diffDays)}d retraso` : `${diffDays} días`;
      }

      const interactionsCount = c.history ? c.history.length : 0;
      
      let headerActionButton = '';
      if (c.archived) {
        headerActionButton = `
          <div style="display:flex; gap:8px;">
            <button class="btn-primary" style="font-size:0.8rem; padding:8px 14px; background:#10b981; color:#ffffff; border-radius:8px; font-weight:600; display:flex; align-items:center; gap:6px; box-shadow:none; border:none;" onclick="restoreContact(${c.id})">🔄 Restaurar</button>
            <button class="btn-secondary" style="font-size:0.8rem; padding:8px 14px; border-color:rgba(239,68,68,0.25); color:var(--color-urgent); background:#ffffff;" onclick="deleteContact(${c.id})">🗑️ Eliminar</button>
          </div>
        `;
      } else if (c.type === 'Prospecto') {
        headerActionButton = `<button class="btn-primary" style="font-size:0.8rem; padding:8px 14px; background:var(--color-accent); color:#0A0A0A; border-radius:8px; font-weight:600; display:flex; align-items:center; gap:6px; box-shadow:none; border:none;" onclick="convertProspectToClient(${c.id})">🏁 Cerrar lead</button>`;
      } else {
        headerActionButton = `<button class="btn-secondary" style="font-size:0.8rem; padding:8px 14px; border-color:var(--border-color); color:var(--color-text-secondary); background:#ffffff;" onclick="archiveContact(${c.id}); closeContactDetailPanel();">🗑️ Archivar</button>`;
      }

      // Left Column: Relationship History timeline
      let timelineHtml = '';
      if (c.history && c.history.length > 0) {
        c.history.forEach(item => {
          timelineHtml += `
            <div class="timeline-item">
              <div class="timeline-bullet yellow"></div>
              <div class="timeline-content">
                <span class="timeline-date" style="font-weight: 600; color: #b45309;">${item.date}</span>
                <p style="font-size: 0.82rem; color: var(--color-text-primary); margin: 0; line-height: 1.4;">${item.text}</p>
              </div>
            </div>
          `;
        });
      } else {
        timelineHtml = `<div style="text-align:center; color:var(--color-text-muted); font-size:0.8rem; padding:20px 0;">No hay historial registrado. Añade un contexto arriba.</div>`;
      }

      // Right Column: configHtml for follow-up details
      let configHtml = '';
      if (c.type === 'Cliente') {
        const currentCycle = c.cycleDays;
        const isRecurrente = currentCycle !== null;
        const displayCycle = currentCycle || 28;
        configHtml = `
          <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:8px; margin-top:4px; display:flex; flex-direction:column; gap:8px;">
            <div class="form-group">
              <label class="form-label" style="font-size:0.75rem;">Tipo de Seguimiento</label>
              <select class="form-input form-select" id="detail-follow-mode-${c.id}" onchange="toggleClientFollowModeDetail(${c.id})" style="padding:6px 10px; font-size:0.8rem;">
                <option value="recurrente" ${isRecurrente ? 'selected' : ''}>Flujo constante (Ciclo Recurrente)</option>
                <option value="fijo" ${!isRecurrente ? 'selected' : ''}>Fecha determinada (Fecha Fija)</option>
              </select>
            </div>

            <div class="form-group" id="detail-cycle-group-${c.id}" style="display: ${isRecurrente ? 'block' : 'none'};">
              <label class="form-label" style="font-size:0.75rem;">Frecuencia de seguimiento:</label>
              <select class="form-input form-select" id="detail-cycle-${c.id}" style="padding:6px 10px; font-size:0.8rem;">
                <option value="3" ${displayCycle === 3 ? 'selected' : ''}>3 días</option>
                <option value="5" ${displayCycle === 5 ? 'selected' : ''}>5 días</option>
                <option value="7" ${displayCycle === 7 ? 'selected' : ''}>7 días</option>
                <option value="15" ${displayCycle === 15 ? 'selected' : ''}>15 días</option>
                <option value="28" ${displayCycle === 28 ? 'selected' : ''}>28 días</option>
              </select>
            </div>

            <div class="form-group" id="detail-date-group-${c.id}" style="display: ${!isRecurrente ? 'block' : 'none'};">
              <label class="form-label" style="font-size:0.75rem;">Fecha de próximo contacto:</label>
              <input type="date" class="form-input" id="detail-date-${c.id}" value="${c.suggestedDate || TODAY_STR}" style="padding:6px 10px; font-size:0.8rem;">
            </div>
          </div>
        `;
      } else {
        configHtml = `
          <div style="border-top:1px solid rgba(255,255,255,0.05); padding-top:8px; margin-top:4px; display:flex; flex-direction:column; gap:8px;">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem;">Fecha fu1</label>
                <input type="date" class="form-input" id="detail-fu1-${c.id}" value="${c.fu1 || ''}" style="padding:6px 10px; font-size:0.8rem;">
              </div>
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem;">Fecha fu2</label>
                <input type="date" class="form-input" id="detail-fu2-${c.id}" value="${c.fu2 || ''}" style="padding:6px 10px; font-size:0.8rem;">
              </div>
            </div>
            <div class="form-group" style="margin-top: 4px;">
              <button class="resolution-btn" style="color:var(--color-ontrack); border-color:rgba(16, 185, 129, 0.15); justify-content:center; text-align:center; font-size:0.75rem; font-weight:600;" onclick="convertProspectToClient(${c.id})">🏆 ¡Cerrar Trato! (Convertir a Cliente)</button>
            </div>
          </div>
        `;
      }

      let rightColumnHtml = '';
      if (c.archived) {
        rightColumnHtml = `
          <!-- Right Column: Archived Read-Only Viewer -->
          <div style="display:flex; flex-direction:column; gap:12px; height: 100%;">
            <!-- Status Warning Banner -->
            <div style="background: #f9fafb; border: 1px solid var(--border-color); padding: 12px 16px; border-radius: 12px; text-align: center; color: var(--color-text-secondary); display: flex; flex-direction: column; align-items: center; gap: 8px;">
              <span style="font-size: 1.5rem;">📁</span>
              <div>
                <div style="font-weight: 700; font-size: 0.9rem; color: var(--color-text-primary);">${c.type === 'Cliente' ? 'Cliente Archivado' : 'Prospecto Archivado'}</div>
                ${c.type === 'Cliente' ? `<div style="font-size: 0.78rem; color: #b91c1c; font-weight: 600; margin-top: 4px;">Dado de baja el: ${c.archivedDate || '22 JUN.'}</div>` : ''}
                <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px; line-height: 1.3;">El seguimiento automático y las alertas de este contacto se encuentran pausados. Restáuralo para reactivar su seguimiento.</div>
              </div>
            </div>

            <!-- Read-only data card -->
            <div class="detail-card" style="background:#ffffff; border:1px solid var(--border-color); padding:12px 16px; border-radius:12px; display:flex; flex-direction:column; gap:10px;">
              <h4 style="font-size:0.72rem; font-weight:600; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.05em; margin:0 0 4px 0;">Datos del Contacto (Lectura)</h4>
              
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem;">Nombre Completo</label>
                <input type="text" class="form-input" value="${c.name}" disabled style="padding:6px 10px; font-size:0.8rem; background: #f3f4f6; color: #6b7280; border-color: #e5e7eb;">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem;">WhatsApp</label>
                  <input type="text" class="form-input" value="${c.whatsapp}" disabled style="padding:6px 10px; font-size:0.8rem; background: #f3f4f6; color: #6b7280; border-color: #e5e7eb;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem;">Empresa</label>
                  <input type="text" class="form-input" value="${c.company || 'Sin Empresa'}" disabled style="padding:6px 10px; font-size:0.8rem; background: #f3f4f6; color: #6b7280; border-color: #e5e7eb;">
                </div>
              </div>
            </div>

            <!-- Action buttons at the bottom -->
            <div style="margin-top:auto; padding-top:10px; display:flex; gap:8px;">
              <button class="btn-primary" style="flex-grow:1; justify-content:center; padding:8px; font-weight:600; background:#10b981; color:#ffffff; border:none;" onclick="restoreContact(${c.id})">🔄 Restaurar Contacto</button>
              <button class="btn-secondary" style="color:var(--color-urgent); border-color:rgba(239, 68, 68, 0.15); padding:8px; font-weight:600;" onclick="deleteContact(${c.id})">🗑️ Eliminar</button>
            </div>
          </div>
        `;
      } else {
        rightColumnHtml = `
          <!-- Right Column: Follow-up & Basic Data -->
          <div class="detail-card" style="background:#ffffff; border:1px solid var(--border-color); padding:12px 16px; border-radius:12px; display:flex; flex-direction:column; gap:12px; height: 100%;">
            <h3 style="font-family:var(--font-title); font-size:0.95rem; font-weight:700; color:var(--color-text-primary); margin:0;">📅 Seguimiento</h3>
            
            <div style="display:flex; flex-direction:column; gap:4px;">
              <label class="form-label" style="font-size:0.75rem; color:var(--color-text-secondary);">Próximo toque</label>
              <input type="date" class="form-input" id="detail-suggested-${c.id}" value="${c.suggestedDate || TODAY_STR}" style="padding:6px 10px; font-size:0.85rem; font-weight:500; text-align:left; background:#ffffff; border:1px solid var(--border-color); border-radius:8px; color:var(--color-text-primary);">
            </div>
            
            <div style="border-top:1px solid var(--border-color); padding-top:10px; display:flex; flex-direction:column; gap:10px; margin-top:2px;">
              <h4 style="font-size:0.72rem; font-weight:600; color:var(--color-text-muted); text-transform:uppercase; letter-spacing:0.05em; margin-bottom:2px;">Datos del Contacto</h4>
              
              <div class="form-group">
                <label class="form-label" style="font-size:0.75rem;">Nombre Completo</label>
                <input type="text" class="form-input" id="detail-name-${c.id}" value="${c.name}" required style="padding:6px 10px; font-size:0.8rem;">
              </div>
              
              <div class="form-row">
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem;">WhatsApp</label>
                  <input type="text" class="form-input" id="detail-whatsapp-${c.id}" value="${c.whatsapp}" required style="padding:6px 10px; font-size:0.8rem;">
                </div>
                <div class="form-group">
                  <label class="form-label" style="font-size:0.75rem;">Empresa</label>
                  <input type="text" class="form-input" id="detail-company-${c.id}" value="${c.company || ''}" style="padding:6px 10px; font-size:0.8rem;">
                </div>
              </div>
              
              ${configHtml}
            </div>
            
            <div style="margin-top:auto; padding-top:10px; display:flex; gap:8px;">
              <button class="btn-primary" style="flex-grow:1; justify-content:center; padding:8px; font-weight:600;" onclick="saveContactChanges(${c.id})">💾 Guardar</button>
              <button class="btn-secondary" style="color:var(--color-urgent); border-color:rgba(239, 68, 68, 0.15); padding:8px;" onclick="archiveContact(${c.id}); closeContactDetailPanel();">🗑️ Archivar</button>
            </div>
          </div>
        `;
      }

      body.innerHTML = `
        <!-- Reference Header Card -->
        <div class="detail-card" style="display:flex; flex-direction:row; justify-content:space-between; align-items:center; background:#ffffff; border:1px solid var(--border-color); padding:10px 16px; border-radius:12px;">
          <div style="display:flex; align-items:center; gap:12px;">
            <div class="avatar" style="width:44px; height:44px; font-size:1.2rem; background:rgba(255,204,6,0.15); color:#8a6d00; border:1px solid rgba(255,204,6,0.3); font-family:var(--font-title); font-weight:700;">${initials}</div>
            <div style="display:flex; flex-direction:column; gap:2px;">
              <h2 style="font-family:var(--font-title); font-size:1.25rem; font-weight:700; color:var(--color-text-primary); margin:0; line-height:1.2;">${c.name}</h2>
              <span style="font-size:0.8rem; color:var(--color-text-secondary); display:flex; align-items:center; gap:4px;">🏢 ${c.company || 'Sin Empresa'}</span>
              <div style="display:flex; gap:6px; margin-top:4px; flex-wrap:wrap;">
                ${c.archived 
                  ? `<span class="detail-badge-pill" style="background:#f3f4f6; color:#4b5563;">💬 ${interactionsCount} interacciones</span>
                     ${c.type === 'Cliente' ? `<span class="detail-badge-pill" style="background:#fee2e2; color:#991b1b; font-weight: 600;">📅 Dado de baja: ${c.archivedDate || '22 JUN.'}</span>` : ''}`
                  : `<span class="detail-badge-pill ${urgencyClass}">${urgencyLabel}</span>
                     <span class="detail-badge-pill">⏱ ${timeLabel}</span>
                     <span class="detail-badge-pill">💬 ${interactionsCount} interacciones</span>`
                }
              </div>
            </div>
          </div>
          <div>
            ${headerActionButton}
          </div>
        </div>

        <!-- Side-by-Side Layout Grid -->
        <div style="display:grid; grid-template-columns: 1.2fr 1fr; gap:12px;" id="detail-columns-grid">
          
          <!-- Left Column: Relation History -->
          <div class="detail-card" style="background:#ffffff; border:1px solid var(--border-color); padding:12px 16px; border-radius:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
              <h3 style="font-family:var(--font-title); font-size:0.95rem; font-weight:700; color:var(--color-text-primary); margin:0;">🧵 Historial de la relación</h3>
              ${c.archived ? '' : `<button class="btn-yellow-context" style="padding: 4px 8px; font-size: 0.75rem;" onclick="showAddHistoryInput(${c.id})">+ Contexto</button>`}
            </div>
            
            <!-- Inline add context form -->
            <div id="add-history-container-${c.id}" style="display:none; margin-bottom:10px; padding:8px; background:#f9fafb; border:1px dashed var(--border-color); border-radius:8px; flex-direction:column; gap:6px; animation: slideDown 0.2s ease-out;">
              <textarea id="new-history-text-${c.id}" class="form-input" placeholder="Escribe una nota..." rows="2" style="font-family:var(--font-body); resize:vertical; font-size:0.8rem; background:#ffffff; border:1px solid var(--border-color); color:var(--color-text-primary); padding: 4px 8px;"></textarea>
              <div style="display:flex; justify-content:flex-end; gap:6px;">
                <button class="btn-secondary" style="padding:2px 6px; font-size:0.7rem;" onclick="hideAddHistoryInput(${c.id})">Cancelar</button>
                <button class="btn-primary" style="padding:2px 8px; font-size:0.7rem;" onclick="saveNewHistoryItem(${c.id})">Guardar</button>
              </div>
            </div>
            
            <div class="timeline" id="detail-timeline-${c.id}" style="max-height: 220px; overflow-y: auto; padding-right: 4px;">
              ${timelineHtml}
            </div>
          </div>
          
          <!-- Right Column: Follow-up & Basic Data -->
          ${rightColumnHtml}
          
        </div>
      `;

      panel.classList.add('open');
    }

    function closeContactDetailPanel() {
      const panel = document.getElementById('contact-detail-panel');
      if (panel) {
        panel.classList.remove('open');
      }
      selectedContactId = null;
    }

    // Close detail panel or modal on Escape key press
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' || event.key === 'Esc') {
        const panel = document.getElementById('contact-detail-panel');
        if (panel && panel.classList.contains('open')) {
          closeContactDetailPanel();
        }
        const modal = document.getElementById('new-contact-modal');
        if (modal && modal.style.display === 'flex') {
          closeNewContactModal();
        }
      }
    });

    function showAddHistoryInput(id) {
      const container = document.getElementById(`add-history-container-${id}`);
      if (container) {
        container.style.display = 'flex';
        document.getElementById(`new-history-text-${id}`).focus();
      }
    }

    function hideAddHistoryInput(id) {
      const container = document.getElementById(`add-history-container-${id}`);
      if (container) {
        container.style.display = 'none';
        document.getElementById(`new-history-text-${id}`).value = '';
      }
    }

    function saveNewHistoryItem(id) {
      const text = document.getElementById(`new-history-text-${id}`).value.trim();
      if (!text) {
        showToast("Por favor, ingresa una descripción para el contexto.");
        return;
      }

      const c = contacts.find(contact => contact.id === id);
      if (c) {
        const now = new Date();
        const months = ["ENE.", "FEB.", "MAR.", "ABR.", "MAY.", "JUN.", "JUL.", "AGO.", "SEP.", "OCT.", "NOV.", "DIC."];
        const dateStr = `${now.getDate()} ${months[now.getMonth()]}`;

        if (!c.history) c.history = [];
        c.history.unshift({
          date: dateStr,
          text: text
        });

        c.context = text;

        showToast("Contexto añadido e historial actualizado.");
        hideAddHistoryInput(id);

        openContactDetailPanel(id);
        renderAllTabs();
      }
    }

    function toggleClientFollowModeDetail(id) {
      const modeSelect = document.getElementById(`detail-follow-mode-${id}`);
      if (!modeSelect) return;
      
      const mode = modeSelect.value;
      const cycleGroup = document.getElementById(`detail-cycle-group-${id}`);
      const dateGroup = document.getElementById(`detail-date-group-${id}`);
      const dateInput = document.getElementById(`detail-date-${id}`);

      if (mode === 'recurrente') {
        cycleGroup.style.display = 'block';
        dateGroup.style.display = 'none';
        if (dateInput) dateInput.required = false;
      } else {
        cycleGroup.style.display = 'none';
        dateGroup.style.display = 'block';
        if (dateInput) {
          dateInput.required = true;
          if (!dateInput.value) {
            dateInput.value = TODAY_STR;
          }
        }
      }
    }

    // Save changes from Editable panel
    function saveContactChanges(id) {
      const name = document.getElementById(`detail-name-${id}`).value;
      const whatsapp = document.getElementById(`detail-whatsapp-${id}`).value;
      const company = document.getElementById(`detail-company-${id}`).value;
      
      const contextEl = document.getElementById(`detail-context-${id}`);
      const context = contextEl ? contextEl.value : null;

      if (!name.trim() || !whatsapp.trim()) {
        showToast("Nombre y WhatsApp son obligatorios.");
        return;
      }

      const c = contacts.find(contact => contact.id === id);
      if (c) {
        c.name = name;
        c.whatsapp = whatsapp;
        c.company = company;
        if (context !== null) c.context = context;

        // Suggested date from the main Seguimiento card input field
        const mainSuggestedInput = document.getElementById(`detail-suggested-${id}`);
        if (mainSuggestedInput && mainSuggestedInput.value) {
          c.suggestedDate = mainSuggestedInput.value;
        }

        if (c.type === 'Cliente') {
          const followMode = document.getElementById(`detail-follow-mode-${id}`).value;
          if (followMode === 'recurrente') {
            const cycleInput = document.getElementById(`detail-cycle-${id}`);
            if (cycleInput) {
              const cycleVal = parseInt(cycleInput.value);
              if (!isNaN(cycleVal) && cycleVal > 0) {
                c.cycleDays = cycleVal;
                // If suggestedDate wasn't manually changed just now, recalculate
                if (mainSuggestedInput && mainSuggestedInput.value === c.suggestedDate) {
                  const sugDate = new Date(TODAY);
                  sugDate.setDate(sugDate.getDate() + cycleVal);
                  const year = sugDate.getFullYear();
                  const month = String(sugDate.getMonth() + 1).padStart(2, '0');
                  const day = String(sugDate.getDate()).padStart(2, '0');
                  c.suggestedDate = `${year}-${month}-${day}`;
                }
              }
            }
          } else {
            const dateInput = document.getElementById(`detail-date-${id}`);
            if (dateInput && dateInput.value) {
              c.cycleDays = null;
              c.suggestedDate = dateInput.value;
            }
          }
        } else {
          const fu1Input = document.getElementById(`detail-fu1-${id}`);
          const fu2Input = document.getElementById(`detail-fu2-${id}`);

          if (fu1Input && fu1Input.value) c.fu1 = fu1Input.value;
          if (fu2Input && fu2Input.value) c.fu2 = fu2Input.value;
        }

        showToast(`Datos de ${c.name} actualizados correctamente.`);
        closeContactDetailPanel();
        renderAllTabs();
      }
    }

    // Panel conversion prospect -> client
    function convertProspectToClient(id) {
      closeContactDetailPanel();
      resolutionCloseDeal(id);
    }



    // ==========================================================================
    // VIEWPORT MANAGER (Desktop vs Mobile simulator toggling)
    // ==========================================================================
    function setViewport(mode) {
      currentViewport = mode;
      
      const container = document.getElementById('viewport-container');
      const frame = document.getElementById('viewport-frame');
      const btnDesktop = document.getElementById('btn-desktop');
      const btnMobile = document.getElementById('btn-mobile');

      btnDesktop.classList.remove('active');
      btnMobile.classList.remove('active');

      if (mode === 'desktop') {
        btnDesktop.classList.add('active');
        frame.className = "viewport-desktop";
        container.style.alignItems = "flex-start";
      } else {
        btnMobile.classList.add('active');
        frame.className = "viewport-mobile";
        container.style.alignItems = "center";
      }

      renderAllTabs();
    }

    function setFilter(urgency) {
      currentFilter = urgency;
      
      const buttons = document.querySelectorAll('#filters-row .filter-btn');
      buttons.forEach(btn => btn.classList.remove('active'));

      // Find active button based on text match or index
      let targetClass = '';
      if (urgency === 'Todos') targetClass = '.filter-all';
      else if (urgency === 'Rojo') targetClass = '.filter-urgent';
      else if (urgency === 'Amarillo') targetClass = '.filter-attention';
      else if (urgency === 'Verde') targetClass = '.filter-ontrack';

      const targetBtn = document.querySelector(`#filters-row ${targetClass}`);
      if (targetBtn) {
        targetBtn.classList.add('active');
      }

      // Manage has-active class on parent
      const parentRow = document.getElementById('filters-row');
      if (parentRow) {
        if (urgency !== 'Todos') {
          parentRow.classList.add('has-active');
        } else {
          parentRow.classList.remove('has-active');
        }
      }

      renderDashboard();
    }

    // ==========================================================================
    // PROTOTYPE DEMO SIMULATIONS
    // ==========================================================================
    function triggerSkeleton() {
      const listContainer = document.getElementById('daily-list-container');
      
      listContainer.innerHTML = `
        <div class="skeleton-card">
          <div class="card-header" style="align-items:center;">
            <div class="card-profile">
              <div class="skeleton-avatar"></div>
              <div class="card-identity" style="gap:6px;">
                <div class="skeleton-line" style="width: 120px;"></div>
                <div class="skeleton-line" style="width: 80px; height: 10px;"></div>
              </div>
            </div>
            <div class="skeleton-badge"></div>
          </div>
          <div class="skeleton-line" style="width: 140px; height: 10px;"></div>
          <div class="skeleton-line" style="width: 100%;"></div>
        </div>
        <div class="skeleton-card">
          <div class="card-header" style="align-items:center;">
            <div class="card-profile">
              <div class="skeleton-avatar"></div>
              <div class="card-identity" style="gap:6px;">
                <div class="skeleton-line" style="width: 100px;"></div>
                <div class="skeleton-line" style="width: 60px; height: 10px;"></div>
              </div>
            </div>
            <div class="skeleton-badge"></div>
          </div>
          <div class="skeleton-line" style="width: 120px; height: 10px;"></div>
          <div class="skeleton-line" style="width: 90%;"></div>
        </div>
      `;

      setTimeout(() => {
        renderDashboard();
      }, 1500);
    }

    function triggerAutoArchiveDemo() {
      const target = contacts.find(c => c.name === "Marco Reyes");
      
      if (!target) {
        showToast("Marco Reyes ya fue archivado o modificado. Reinicia la página para probar de nuevo.");
        return;
      }

      // Clone target
      archivedBackup = { ...target };
      // Simulate that before archiving, he was in Esperando respuesta
      archivedBackup.status = "Esperando respuesta";
      archivedBackup.daysWaiting = 5;
      archivedBackup.waitingSince = "hace 5 días";

      // Remove from current list
      contacts = contacts.filter(c => c.id !== target.id);

      showToastWithAction(
        `${target.name} fue archivado automáticamente como No respondió tras 7 días sin contacto.`,
        "Recuperar",
        () => {
          if (archivedBackup) {
            contacts.push(archivedBackup);
            archivedBackup = null;
            showToast("Contacto restaurado a la bandeja 'Esperando respuesta'.");
            renderAllTabs();
          }
        }
      );

      renderAllTabs();
    }

    // ==========================================================================
    // NEW FUNCTIONALITIES: SEARCH & ADDITIONAL RESOLUTIONS
    // ==========================================================================
    function handleSearchKeydown(event) {
      if (event.key === 'Enter') {
        performSearch();
      }
    }

    function normalizeString(str) {
      if (!str) return "";
      return str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    }

    function performSearch() {
      const rawQuery = document.getElementById('search-input').value.trim();
      if (!rawQuery) {
        showToast("Por favor, ingresa un nombre o empresa a buscar.");
        return;
      }
      const query = normalizeString(rawQuery);

      const match = contacts.find(c => 
        normalizeString(c.name).includes(query) || 
        (c.company && normalizeString(c.company).includes(query))
      );

      if (!match) {
        showToast("No se encontró ningún contacto con ese nombre o empresa.");
        return;
      }

      if (match.status === "Toque del día" || match.status === "Esperando respuesta") {
        if (currentTab !== 'inicio') {
          switchTab('inicio');
        }
        if (match.status === "Toque del día" && currentFilter !== 'Todos') {
          setFilter('Todos');
        }
        if (match.status === "Esperando respuesta" && isWaitingCollapsed) {
          toggleWaitingSection();
        }
      } else {
        if (match.type === 'Cliente') {
          switchTab('clientes');
          setClientesFilter(match.archived ? 'Archivados' : 'Todos');
        } else {
          switchTab('prospectos');
          setProspectosFilter(match.archived ? 'Archivados' : 'Todos');
        }
      }

      setTimeout(() => {
        const card = document.getElementById(`card-${match.id}`);
        if (card) {
          card.scrollIntoView({ behavior: 'smooth', block: 'center' });
          card.classList.remove('card-flash');
          void card.offsetWidth; // Force reflow
          card.classList.add('card-flash');
          showToast(`Encontrado: ${match.name}`);
        } else {
          showToast(`Encontrado en base de datos: ${match.name}`);
        }
      }, 100);
    }

    function resolutionNoAgreement(id) {
      archiveContact(id);
    }

    function resolutionOfferSomethingNew(id) {
      const contact = contacts.find(c => c.id === id);
      if (!contact) return;

      contact.status = "Toque del día";
      contact.cycleDays = 15;
      
      const nextContact = new Date(TODAY);
      nextContact.setDate(nextContact.getDate() + 15);
      const year = nextContact.getFullYear();
      const month = String(nextContact.getMonth() + 1).padStart(2, '0');
      const day = String(nextContact.getDate()).padStart(2, '0');
      contact.suggestedDate = `${year}-${month}-${day}`;

      showToast(`Contacto ${contact.name} movido a ciclo de 15 días para ofrecerle algo nuevo.`);
      renderAllTabs();
    }

    function toggleSuggestionsInline(id) {
      const container = document.getElementById(`suggestions-inline-${id}`);
      const btn = document.getElementById(`btn-sug-toggle-${id}`);
      if (!container) return;

      if (container.style.display === 'none') {
        container.style.display = 'block';
        container.innerHTML = generateIaSuggestionsHtml(id);
        btn.innerHTML = `✨ Ocultar IA`;
      } else {
        container.style.display = 'none';
        btn.innerHTML = `✨ Sugerencias IA`;
      }
    }

    function setClientesFilter(filter) {
      currentClientesFilter = filter;
      const filterButtons = document.querySelectorAll('#clientes-filters-row .filter-btn');
      filterButtons.forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(`btn-c-filter-${filter}`);
      if (activeBtn) activeBtn.classList.add('active');
      renderClientesTab();
    }

    function setProspectosFilter(filter) {
      currentProspectosFilter = filter;
      const filterButtons = document.querySelectorAll('#prospectos-filters-row .filter-btn');
      filterButtons.forEach(btn => btn.classList.remove('active'));
      const activeBtn = document.getElementById(`btn-p-filter-${filter}`);
      if (activeBtn) activeBtn.classList.add('active');
      renderProspectosTab();
    }
