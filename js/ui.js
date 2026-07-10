// RENDERING: CLIENTES TAB
// ==========================================================================
function renderClientesTab() {
  const container = document.getElementById('clientes-list-container');
  if (!container) return;

  const allClients = contacts.filter(c => c.type === 'Cliente' && (c.businessId || 1) === currentBusinessId);
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
      <div class="minimal-card${c.starred ? ' card-starred' : ''}" onclick="openContactDetailPanel(${c.id})" style="display: flex; flex-direction: column; justify-content: space-between; padding: 14px 16px; box-sizing: border-box; height: 136px;">
        <!-- Top / Identity Row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div style="display: flex; flex-direction: column; overflow: hidden; max-width: calc(100% - 120px);">
            <div class="minimal-card-name" style="font-family: var(--font-title); font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</div>
            <div class="minimal-card-company" style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.company || 'Sin Empresa'}</div>
          </div>
          <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0;">
            <div style="display: flex; align-items: center; gap: 6px;">
              ${(!c.archived && c.starred) ? `<button class="btn-star-toggle active" onclick="toggleContactStar(${c.id}, event)" title="Quitar destaque">★</button>` : ''}
              <span class="minimal-pill tag-cliente" style="background: ${c.archived ? '#f3f4f6' : 'rgba(16, 185, 129, 0.1)'}; color: ${c.archived ? '#4b5563' : '#047857'}; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.02em;">
                ${c.archived ? 'Archivado' : 'Cliente'}
              </span>
            </div>
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
              Próximo: ${c.suggestedDate ? c.suggestedDate.split('-').reverse().join('/') : 'Sin fecha'}
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

  const allProspects = contacts.filter(c => c.type === 'Prospecto' && (c.businessId || 1) === currentBusinessId);
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
      <div class="minimal-card${c.starred ? ' card-starred' : ''}" onclick="openContactDetailPanel(${c.id})" style="display: flex; flex-direction: column; justify-content: space-between; padding: 14px 16px; box-sizing: border-box; height: 168px;">
        <!-- Top / Identity Row -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
          <div style="display: flex; flex-direction: column; overflow: hidden; max-width: calc(100% - 120px);">
            <div class="minimal-card-name" style="font-family: var(--font-title); font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); line-height: 1.2; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.name}</div>
            <div class="minimal-card-company" style="font-size: 0.78rem; color: var(--color-text-secondary); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${c.company || 'Sin Empresa'}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            ${(!c.archived && c.starred) ? `<button class="btn-star-toggle active" onclick="toggleContactStar(${c.id}, event)" title="Quitar destaque">★</button>` : ''}
            <span class="minimal-pill tag-prospecto" style="background: ${c.archived ? '#f3f4f6' : 'rgba(139, 92, 246, 0.1)'}; color: ${c.archived ? '#4b5563' : '#7c3aed'}; font-weight: 700; padding: 3px 8px; border-radius: 6px; font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.02em; flex-shrink: 0;">
              ${c.archived ? 'Archivado' : 'Prospecto'}
            </span>
          </div>
        </div>

        <!-- Context Strip (Full Width) -->
        <div class="minimal-card-context-strip" style="background: #f3f4f6; padding: 6px 12px; border-radius: 8px; font-size: 0.75rem; color: #374151; margin-top: 4px; margin-bottom: 4px; text-overflow: ellipsis; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; white-space: normal; line-height: 1.3; width: 100%; box-sizing: border-box; border: 1px solid rgba(0,0,0,0.02); height: 42px;">
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
            Próximo: ${c.suggestedDate ? c.suggestedDate.split('-').reverse().join('/') : 'Sin fecha'}
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
  const activeContacts = contacts.filter(c => !c.archived && (c.businessId || 1) === currentBusinessId);
  const dailyToques = activeContacts.filter(c => c.status === "Toque del día");
  
  const greetingName = currentAuthUser
    ? (
        currentAuthUser.user_metadata?.full_name ||
        currentAuthUser.user_metadata?.name ||
        currentAuthUser.email?.split('@')[0] ||
        'Usuario'
      ).split(' ')[0]
    : currentSimulatedUserRole === 'Administrador'
      ? 'Javier'
      : 'Sofía';
  document.getElementById('app-greeting').innerHTML = `Hola ${greetingName}, hoy tienes <span style="color:var(--color-accent); font-weight:700;">${dailyToques.length}</span> toques pendientes.`;
  
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
    if (c.starred) return true; // Prioridades destacadas siempre visibles en cualquier filtro
    return calculateUrgency(c.suggestedDate) === currentFilter;
  });

  filteredDaily.sort((a, b) => {
    // Starred elements always go FIRST
    const starA = a.starred ? 1 : 0;
    const starB = b.starred ? 1 : 0;
    if (starA !== starB) return starB - starA;

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

  // Filter starred elements
  const starredList = list.filter(c => c.starred);
  const unstarredList = list.filter(c => !c.starred);

  // Group lists by urgency
  const redList = unstarredList.filter(c => calculateUrgency(c.suggestedDate) === "Rojo");
  const yellowList = unstarredList.filter(c => calculateUrgency(c.suggestedDate) === "Amarillo");
  const greenList = unstarredList.filter(c => calculateUrgency(c.suggestedDate) === "Verde");

  // Helper function to render a list into a sub-grid container
  function renderGroupGrid(groupList) {
    if (groupList.length === 0) return null;

    const grid = document.createElement('div');
    grid.className = 'daily-list';
    grid.style.marginBottom = '16px';

    groupList.forEach(c => {
      const urgency = calculateUrgency(c.suggestedDate);
      const badgeData = getDaysRemainingBadge(c);
      const compactActions = badgeData.text.length > 5;

      const cardContainer = document.createElement('div');
      cardContainer.className = "minimal-card-container";
      cardContainer.id = `card-${c.id}`;

      cardContainer.innerHTML = `
        <div class="minimal-card${c.starred ? ' card-starred' : ''}">
          <div class="minimal-card-urgency-bar ${urgency.toLowerCase()}"></div>
          <div class="minimal-card-top">
            <div class="minimal-card-identity">
              <a class="minimal-card-name" onclick="openContactDetailPanel(${c.id})">${c.name}</a>
              <div class="minimal-card-company">${c.company || 'Sin Empresa'}</div>
            </div>
            <div style="display: flex; align-items: center; gap: 8px; flex-shrink: 0;">
              <button class="btn-star-toggle${c.starred ? ' active' : ''}" onclick="toggleContactStar(${c.id}, event)" title="${c.starred ? 'Quitar destaque' : 'Destacar contacto'}">${c.starred ? '★' : '☆'}</button>
              <span class="minimal-pill tag-${c.type.toLowerCase()}">${c.type}</span>
            </div>
          </div>
          <div class="minimal-card-bottom${compactActions ? ' minimal-card-bottom--compact' : ''}">
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

  if (starredList.length > 0) {
    const starredHeader = document.createElement('div');
    starredHeader.className = "daily-group-header font-title";
    starredHeader.style.cssText = "display: flex; align-items: center; gap: 8px; margin: 8px 0 12px 0; font-size: 0.85rem; font-weight: 700; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; width: 100%; grid-column: 1/-1;";
    starredHeader.innerHTML = `
      <span>⭐ Prioridades Destacadas</span>
      <span style="background: rgba(251, 191, 36, 0.15); color: #b45309; border-radius: 999px; padding: 2px 8px; font-size: 0.7rem; font-weight: 800;">${starredList.length}</span>
    `;
    container.appendChild(starredHeader);
    
    const starredGrid = renderGroupGrid(starredList);
    if (starredGrid) container.appendChild(starredGrid);
    
    if (redGrid || yellowGrid || greenGrid) {
      const sep = document.createElement('hr');
      sep.style.cssText = "border: none; border-top: 1px dashed var(--border-color); margin: 8px 0 16px 0; grid-column: 1/-1; width: 100%;";
      container.appendChild(sep);
    }
  }

  if (redGrid) container.appendChild(redGrid);
  if (yellowGrid) container.appendChild(yellowGrid);
  if (greenGrid) container.appendChild(greenGrid);
}

function renderAllTabs() {
  renderDashboard();
  renderClientesTab();
  renderProspectosTab();
  renderEstadisticasTab();
  renderAdminTab();
  renderProfileTab();
}

function formatProfileDate(isoDate) {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
}

async function renderAdminTab() {
  const container = document.getElementById('tab-admin');
  if (!container) return;

  if (!isSuperAdmin()) {
    container.innerHTML = '';
    return;
  }

  // 1. Mostrar banner de suplantación si está activo
  let impersonationBanner = '';
  if (impersonatedClientId) {
    const client = adminClients.find(c => String(c.id) === String(impersonatedClientId));
    impersonationBanner = `
      <div class="admin-banner-card" style="background: #e0f2fe; border: 1px solid #bae6fd; color: #0369a1; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(3, 105, 161, 0.08);">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-size: 1.15rem;">👁️</span>
          <span>Estás visualizando el sistema como: <strong>${client ? client.businessName : 'Cliente'}</strong></span>
        </div>
        <button class="btn-primary" onclick="stopImpersonating()" style="background: #0284c7; color: #fff; border: none; padding: 5px 12px; font-size: 0.72rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.15s;">
          Restaurar Admin
        </button>
      </div>
    `;
  }

  let isSimulated = true;
  if (currentAuthUser && window.TocaDB?.isConfigured()) {
    try {
      adminUsers = await window.TocaDB.loadAllProfiles();
      adminClients = adminUsers.map(u => {
        const planVal = u.plan || 'Gratuito';
        const extraAgents = u.extra_agents || 0;
        const extraPacks = u.extra_packs || 0;
        const baseLimits = PLAN_LIMITS[planVal] || PLAN_LIMITS['Gratuito'];
        const maxContacts = baseLimits.contacts + (extraPacks * 50);
        const maxAgents = baseLimits.agents + extraAgents;
        return {
          id: u.id,
          name: u.full_name || (u.email ? u.email.split('@')[0] : 'Sin nombre'),
          email: u.email || '',
          businessName: u.full_name ? `Negocio de ${u.full_name}` : (u.email ? `Negocio de ${u.email.split('@')[0]}` : 'Negocio sin configurar'),
          plan: planVal,
          extraAgents: extraAgents,
          extraPacks: extraPacks,
          maxContacts: maxContacts,
          maxAgents: maxAgents,
          contactsCount: u.contacts_count || 0,
          agentsCount: u.agents_count || 0,
          status: u.status || "Activo",
          lastPaymentDate: u.last_payment_date || "2026-07-01",
          copilot: planVal !== 'Néctar' && planVal !== 'Gratuito',
          autopilot: planVal === 'Colmena' || planVal === 'Apiario',
          created_at: u.created_at,
          factura: u.factura !== false
        };
      });
      isSimulated = false;
    } catch (err) {
      console.warn("Error cargando perfiles de Supabase, cayendo en simulación local:", err);
    }
  }

  // Calcular estadísticas de la simulación
  const activeClients = adminClients.filter(c => c.status === "Activo");
  const totalClientsCount = activeClients.length;
  const planCounts = { Gratuito: 0, Néctar: 0, Panal: 0, Colmena: 0, Apiario: 0 };
  let estimatedRevenue = 0;
  
  const PLAN_PRICES = { Gratuito: 0, Néctar: 59, Panal: 109, Colmena: 150, Apiario: 500, SuperAdmin: 0 };

  adminClients.forEach(c => {
    if (c.status === "Activo") {
      if (planCounts[c.plan] !== undefined) planCounts[c.plan]++;
      
      // El SuperAdmin no genera MRR y las cuentas sin facturación tampoco
      const clientEmail = c.email || '';
      if (c.plan !== 'SuperAdmin' && clientEmail.toLowerCase() !== 'fibeeconsultoradigital@gmail.com' && c.factura !== false) {
        const basePrice = PLAN_PRICES[c.plan] || 0;
        const extraAgentsCost = (c.extraAgents || 0) * 24.90;
        const extraPacksCost = (c.extraPacks || 0) * 19.90;
        estimatedRevenue += basePrice + extraAgentsCost + extraPacksCost;
      }
    }
  });

  let html = `
    ${impersonationBanner}
    <div style="padding: 8px 0 20px;">
      <h2 style="font-family: var(--font-title); font-size: 1.35rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 6px 0;">Panel Admin</h2>
      <p style="font-size: 0.88rem; color: var(--color-text-secondary); margin: 0;">Gestiona las cuentas de los clientes y supervisa sus consumos.</p>
    </div>
    ${getAdminMetricsHtml(totalClientsCount, estimatedRevenue, planCounts)}
    ${getAdminTableShellHtml()}
  `;

  if (selectedAdminClientId) {
    const client = adminClients.find(c => String(c.id) === String(selectedAdminClientId));
    if (client) {
      html += getAdminModalHtml(client);
    }
  }

  container.innerHTML = html;
  renderSortedAdminTable();
}

// SUB-RENDERERS PARA EL PANEL ADMIN (SIMULADO)

let adminSearchQuery = '';

function updateAdminSearchQuery(query) {
  adminSearchQuery = query;
  filterAdminClientsTable(query);
}

function getImpersonationBannerHtml() {
  if (!impersonatedClientId) return '';
  const client = adminClients.find(c => c.id === impersonatedClientId);
  return `
    <div class="admin-banner-card" style="background: #e0f2fe; border: 1px solid #bae6fd; color: #0369a1; padding: 12px 16px; border-radius: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem; box-shadow: 0 4px 12px rgba(3, 105, 161, 0.08);">
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 1.15rem;">👁️</span>
        <span>Estás visualizando el sistema como: <strong>${client ? client.businessName : 'Cliente'}</strong></span>
      </div>
      <button class="btn-primary" onclick="stopImpersonating()" style="background: #0284c7; color: #fff; border: none; padding: 5px 12px; font-size: 0.72rem; border-radius: 6px; cursor: pointer; font-weight: 600; transition: background 0.15s;">
        Restaurar Admin
      </button>
    </div>
  `;
}

function getAdminHeaderHtml() {
  return `
    <div style="padding: 8px 0 20px;">
      <h2 style="font-family: var(--font-title); font-size: 1.35rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 6px 0;">Panel de Administración Toca (Simulación)</h2>
      <p style="font-size: 0.88rem; color: var(--color-text-secondary); margin: 0;">Gestiona clientes locales, edita planes y simula accesos.</p>
    </div>
  `;
}

function getAdminMetricsHtml(totalActive, estimatedRevenue, planCounts) {
  return `
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="admin-metric-card" style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; height: 100px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--color-text-secondary); font-weight: 700; letter-spacing: 0.03em;">Clientes Activos</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: var(--color-text-primary); margin-top: 4px;">${totalActive}</div>
        <div style="font-size: 0.65rem; color: var(--color-text-muted);">Suscripciones activas</div>
      </div>
      <div class="admin-metric-card" style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; height: 100px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--color-text-secondary); font-weight: 700; letter-spacing: 0.03em;">MRR Estimado</div>
        <div style="font-size: 1.6rem; font-weight: 800; color: #10b981; margin-top: 4px;">S/. ${estimatedRevenue.toFixed(2)}</div>
        <div style="font-size: 0.65rem; color: var(--color-text-muted);">Suscripciones + Adicionales activos</div>
      </div>
      <div class="admin-metric-card" style="background: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; height: 100px;">
        <div style="font-size: 0.72rem; text-transform: uppercase; color: var(--color-text-secondary); font-weight: 700; letter-spacing: 0.03em;">Suscripciones por Plan</div>
        <div style="display: flex; gap: 8px; align-items: center; margin-top: 8px; font-size: 0.75rem; font-weight: 600; flex-wrap: wrap;">
          <span title="Gratuito" style="background: #f3f4f6; color: #4b5563; padding: 2px 6px; border-radius: 4px;">🌱 ${planCounts.Gratuito || 0}</span>
          <span title="Néctar" style="background: #fef0f0; color: #fe3c43; padding: 2px 6px; border-radius: 4px;">🌸 ${planCounts.Néctar || 0}</span>
          <span title="Panal" style="background: #fffbeb; color: #d97706; padding: 2px 6px; border-radius: 4px;">🍯 ${planCounts.Panal || 0}</span>
          <span title="Colmena" style="background: #f5f3ff; color: #7c3aed; padding: 2px 6px; border-radius: 4px;">🐝 ${planCounts.Colmena || 0}</span>
          <span title="Apiario" style="background: #ecfdf5; color: #059669; padding: 2px 6px; border-radius: 4px;">👑 ${planCounts.Apiario || 0}</span>
        </div>
      </div>
    </div>
  `;
}

function getAdminTableShellHtml() {
  return `
    <div style="margin-bottom: 16px; display: flex; gap: 10px;">
      <input type="text" id="admin-client-search" placeholder="🔍 Buscar por nombre de cliente, empresa o correo..." style="padding: 10px 14px; border-radius: 10px; border: 1px solid var(--border-color); font-family: var(--font-body); font-size: 0.82rem; width: 100%; max-width: 420px; box-shadow: var(--shadow-sm); outline: none; transition: border-color 0.15s;" oninput="updateAdminSearchQuery(this.value)" value="${adminSearchQuery || ''}">
    </div>

    <div style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 14px; overflow: auto; max-height: 440px; box-shadow: var(--shadow-sm); margin-bottom: 24px; position: relative;">
      <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem; text-align: left;">
        <thead style="position: sticky; top: 0; background: #f9fafb; z-index: 10; box-shadow: 0 1px 0 var(--border-color);">
          <tr style="text-transform: uppercase; font-size: 0.7rem; color: var(--color-text-secondary); font-weight: 700;">
            <th onclick="sortAdminTable('business')" style="padding: 10px 14px; background: #f9fafb; cursor: pointer; user-select: none; transition: background 0.1s;">Negocio<span id="sort-icon-business" style="font-size: 0.65rem; color: var(--color-text-muted);"> ↕</span></th>
            <th onclick="sortAdminTable('admin')" style="padding: 10px 14px; background: #f9fafb; cursor: pointer; user-select: none; transition: background 0.1s;">Administrador<span id="sort-icon-admin" style="font-size: 0.65rem; color: var(--color-text-muted);"> ↕</span></th>
            <th onclick="sortAdminTable('contacts')" style="padding: 10px 14px; background: #f9fafb; cursor: pointer; user-select: none; transition: background 0.1s;">Contactos / Agentes<span id="sort-icon-contacts" style="font-size: 0.65rem; color: var(--color-text-muted);"> ↕</span></th>
            <th onclick="sortAdminTable('plan')" style="padding: 10px 14px; background: #f9fafb; cursor: pointer; user-select: none; transition: background 0.1s;">Plan<span id="sort-icon-plan" style="font-size: 0.65rem; color: var(--color-text-muted);"> ↕</span></th>
            <th style="padding: 10px 14px; text-align: right; background: #f9fafb; user-select: none;">Acciones</th>
          </tr>
        </thead>
        <tbody id="admin-clients-tbody">
        </tbody>
      </table>
    </div>
  `;
}

function getAdminModalHtml(client) {
  return `
    <div id="admin-manage-modal" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(10, 10, 10, 0.45); backdrop-filter: blur(5px); -webkit-backdrop-filter: blur(5px); z-index: 100010; display: flex; align-items: center; justify-content: center; padding: 20px;">
      <style>
        @keyframes adminModalFade {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
      </style>
      <div class="admin-modal-card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 16px; padding: 24px; max-width: 520px; width: 100%; box-shadow: 0 20px 45px rgba(0, 0, 0, 0.15); animation: adminModalFade 0.18s ease-out; position: relative;">
        
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px;">
          <div>
            <h3 style="font-family: var(--font-title); font-size: 1.15rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0;">⚙️ Configurar Cuenta de Cliente</h3>
            <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0;">${client.businessName} &bull; Admin: ${client.name}</p>
          </div>
          <button onclick="selectClientForEdit(null)" style="background: transparent; border: none; font-size: 1.3rem; cursor: pointer; color: var(--color-text-muted); transition: color 0.15s; padding: 0; line-height: 1;">✕</button>
        </div>

        <div style="display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; max-height: 60vh; overflow-y: auto; padding-right: 4px;">
          
          <div style="background: #f9fafb; border: 1px solid var(--border-color); border-radius: 12px; padding: 14px;">
            <h4 style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.04em;">Estado & Facturación</h4>
            
            <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 14px; flex-wrap: wrap;">
              <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px;">
                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Estado del Servicio</span>
                <select id="admin-edit-status" style="padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: #ffffff; font-family: var(--font-body); font-size: 0.85rem; font-weight: 600; cursor: pointer; height: 34px;">
                  <option value="Activo" ${client.status === 'Activo' ? 'selected' : ''}>🟢 Activo</option>
                  <option value="Vencido" ${client.status === 'Vencido' ? 'selected' : ''}>🟡 Vencido</option>
                  <option value="Cancelado" ${client.status === 'Cancelado' ? 'selected' : ''}>🔴 Cancelado</option>
                </select>
              </div>
              
              <div style="display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 140px;">
                <span style="font-size: 0.72rem; color: var(--color-text-muted);">Último Pago Validado</span>
                <input type="date" id="admin-edit-payment-date" value="${client.lastPaymentDate}" style="padding: 6px 10px; border-radius: 8px; border: 1px solid var(--border-color); font-family: var(--font-body); font-size: 0.85rem; height: 34px;">
              </div>
            </div>

            <!-- Switch de Facturación (MRR) -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; background: #ffffff; padding: 10px 12px; border: 1px solid var(--border-color); border-radius: 8px;">
              <div style="display: flex; flex-direction: column; gap: 2px;">
                <span style="font-size: 0.78rem; font-weight: 600; color: var(--color-text-primary);">Contabilizar en MRR</span>
                <span style="font-size: 0.65rem; color: var(--color-text-muted);">Si está inactivo, este negocio no suma ingresos al MRR</span>
              </div>
              <label class="switch-toggle" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                <input type="checkbox" id="admin-edit-factura" ${client.factura !== false ? 'checked' : ''} style="opacity: 0; width: 0; height: 0; cursor: pointer;">
                <span style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .3s; border-radius: 24px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);"></span>
              </label>
              <style>
                .switch-toggle input:checked + span { background-color: #10b981; }
                .switch-toggle span:before {
                  position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px;
                  background-color: white; transition: .3s; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.15);
                }
                .switch-toggle input:checked + span:before { transform: translateX(20px); }
              </style>
            </div>

            <div style="display: flex; gap: 8px; flex-wrap: wrap; border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 10px;">
              <button onclick="adminValidatePayment('${client.id}')" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: background 0.15s;">
                💰 Validar Pago Mes Activo
              </button>
              <button onclick="adminCancelService('${client.id}')" style="flex: 1; display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: #fef2f2; border: 1px solid #fecaca; color: #991b1b; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: background 0.15s;">
                🚫 Cancelar Servicio
              </button>
            </div>
            
            <button onclick="adminDeleteUser('${client.id}')" style="display: inline-flex; align-items: center; justify-content: center; gap: 6px; background: #fff1f2; border: 1px solid #fecdd3; color: #be123c; border-radius: 8px; padding: 8px 12px; font-size: 0.75rem; font-weight: 700; cursor: pointer; transition: background 0.15s; margin-top: 10px; width: 100%;">
              🗑️ Eliminar Cuenta permanentemente
            </button>
          </div>

          <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 14px;">
            <h4 style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.04em;">Plan & Límites del Sistema</h4>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 12px; margin-bottom: 12px;">
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.72rem; color: var(--color-text-muted);">Plan Asignado</label>
                <select id="admin-edit-plan" onchange="toggleAdminCustomPlanFields(this.value); updateAdminWorkspaceLimit(this.value)" style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); background: #ffffff; font-family: var(--font-body); font-size: 0.85rem; height: 36px; cursor: pointer;">
                  <option value="Gratuito" ${client.plan === 'Gratuito' ? 'selected' : ''}>🌱 Plan Gratuito</option>
                  <option value="Néctar" ${client.plan === 'Néctar' ? 'selected' : ''}>🌸 Plan Néctar</option>
                  <option value="Panal" ${client.plan === 'Panal' ? 'selected' : ''}>🍯 Plan Panal</option>
                  <option value="Colmena" ${client.plan === 'Colmena' ? 'selected' : ''}>🐝 Plan Colmena</option>
                  <option value="Apiario" ${client.plan === 'Apiario' ? 'selected' : ''}>👑 Plan Apiario (Custom)</option>
                </select>
              </div>

              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.72rem; color: var(--color-text-muted);">Límite de Contactos</label>
                <input type="number" id="admin-edit-contacts" value="${client.maxContacts}" ${client.plan !== 'Apiario' ? 'disabled' : ''} style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); font-family: var(--font-body); font-size: 0.85rem; height: 34px; background: ${client.plan !== 'Apiario' ? '#f3f4f6' : '#ffffff'};">
              </div>

              <div style="display: flex; flex-direction: column; gap: 4px;">
                <label style="font-size: 0.72rem; color: var(--color-text-muted);">Límite de Agentes</label>
                <input type="number" id="admin-edit-agents" value="${client.maxAgents}" ${client.plan !== 'Apiario' ? 'disabled' : ''} style="padding: 8px 10px; border-radius: 8px; border: 1px solid var(--border-color); font-family: var(--font-body); font-size: 0.85rem; height: 34px; background: ${client.plan !== 'Apiario' ? '#f3f4f6' : '#ffffff'};">
              </div>
            </div>
          </div>

          <div id="admin-expansion-panel" style="border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; display: ${client.plan === 'Apiario' ? 'none' : 'block'}; background: #ffffff;">
            <h4 style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); margin: 0 0 12px 0; text-transform: uppercase; letter-spacing: 0.04em;">⚙️ Personalizar Expansión</h4>
            
            <input type="hidden" id="admin-edit-extra-agents" value="${client.extraAgents || 0}">
            <input type="hidden" id="admin-edit-extra-packs" value="${client.extraPacks || 0}">

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed var(--border-color); padding-bottom: 10px;">
              <div>
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-text-primary);">➕ Agente adicional</div>
                <div style="font-size: 0.72rem; color: var(--color-text-muted);">S/. 24.90 / mes por cada agente extra</div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button type="button" onclick="changeAdminExpansionField('agents', -1)" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-color); background: #ffffff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--color-text-primary); transition: background 0.1s;">-</button>
                <span id="admin-val-extra-agents" style="font-weight: 700; font-size: 0.85rem; min-width: 24px; text-align: center; color: var(--color-text-primary);">+${client.extraAgents || 0}</span>
                <button type="button" onclick="changeAdminExpansionField('agents', 1)" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-color); background: #ffffff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--color-text-primary); transition: background 0.1s;">+</button>
              </div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
              <div>
                <div style="font-size: 0.82rem; font-weight: 600; color: var(--color-text-primary);">➕ Pack de 50 contactos</div>
                <div style="font-size: 0.72rem; color: var(--color-text-muted);">S/. 19.90 / mes por cada pack de 50 contactos</div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button type="button" onclick="changeAdminExpansionField('packs', -1)" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-color); background: #ffffff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--color-text-primary); transition: background 0.1s;">-</button>
                <span id="admin-val-extra-packs" style="font-weight: 700; font-size: 0.85rem; min-width: 24px; text-align: center; color: var(--color-text-primary);">+${client.extraPacks || 0}</span>
                <button type="button" onclick="changeAdminExpansionField('packs', 1)" style="width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border-color); background: #ffffff; font-weight: 700; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 1rem; color: var(--color-text-primary); transition: background 0.1s;">+</button>
              </div>
            </div>

            <div style="background: #f9fafb; border-radius: 8px; padding: 10px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
              <div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; font-weight: 700;">Costo Adicional Estimado</div>
                <div id="admin-expansion-cost" style="font-size: 0.95rem; font-weight: 800; color: var(--color-text-primary);">S/. ${((client.extraAgents || 0) * 24.90 + (client.extraPacks || 0) * 19.90).toFixed(2)} / mes</div>
              </div>
            </div>
          </div>

          <div id="admin-apiario-custom-panel" style="background: #fdfbf7; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; display: ${client.plan === 'Apiario' ? 'block' : 'none'};">
            <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 10px;">
              <span style="font-size: 1rem;">👑</span>
              <h4 style="font-size: 0.75rem; font-weight: 700; color: #92400e; margin: 0; text-transform: uppercase; letter-spacing: 0.04em;">Plan Apiario a medida</h4>
            </div>
            <p style="font-size: 0.75rem; color: #b45309; margin: 0 0 12px 0; line-height: 1.4;">Activa o desactiva las mecánicas de comunicación de WhatsApp según las especificaciones del contrato de este cliente.</p>
            
            <div style="display: flex; flex-direction: column; gap: 10px; border-top: 1px dashed #fde68a; padding-top: 10px;">
              <label style="display: inline-flex; align-items: center; gap: 8px; font-size: 0.85rem; color: #78350f; cursor: pointer; font-weight: 600;">
                <input type="checkbox" id="admin-edit-copilot" ${client.copilot ? 'checked' : ''} style="cursor: pointer; width: 16px; height: 16px;">
                Activar Extensión Manual (Copilot)
              </label>
            </div>
          </div>

          <!-- Active Workspaces Selection Stack -->
          <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; background: #ffffff; display: flex; flex-direction: column; gap: 10px;">
            <h4 style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); margin: 0; text-transform: uppercase; letter-spacing: 0.04em; display: flex; align-items: center; justify-content: space-between;">
              <span>🏢 Marcas / Negocios Activos</span>
              <span style="font-size: 0.65rem; background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 2px 8px; border-radius: 999px; font-weight: 700;">Límite: <span id="admin-active-biz-limit-text">...</span></span>
            </h4>
            <div id="admin-workspaces-selection-container" style="display: flex; flex-direction: column; gap: 8px;">
              <p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 0;">Cargando negocios del cliente...</p>
            </div>
          </div>

          ${getCollaboratorsListHtml(client.agentsList)}

        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px; border-top: 1px solid var(--border-color); padding-top: 14px;">
          <button onclick="selectClientForEdit(null)" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 8px; padding: 10px 18px; font-size: 0.82rem; font-weight: 600; cursor: pointer; color: var(--color-text-primary); transition: background 0.15s;">
            Cancelar
          </button>
          <button onclick="adminApplyClientEditChanges('${client.id}')" style="background: var(--color-accent); border: none; color: #0a0a0a; font-weight: 600; padding: 10px 18px; font-size: 0.82rem; border-radius: 8px; cursor: pointer; transition: opacity 0.15s;">
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  `;
}

function getCollaboratorsListHtml(agentsList) {
  return `
    <div style="border: 1px solid var(--border-color); border-radius: 12px; padding: 14px; background: #ffffff;">
      <h4 style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-secondary); margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.04em;">👥 Colaboradores del Equipo (${(agentsList || []).length})</h4>
      <div style="display: flex; flex-direction: column; gap: 8px;">
        ${(agentsList && agentsList.length > 0) ? agentsList.map(a => `
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; margin-bottom: 2px;">
            <span style="color: var(--color-text-primary); font-weight: 600;">
              ${a.name} <span style="font-weight: normal; color: var(--color-text-secondary); font-size: 0.75rem;">(${a.email})</span>
            </span>
            <span style="font-size: 0.72rem; padding: 2px 6px; border-radius: 4px; background: ${a.role === 'Dueño' ? '#fef3c7' : '#f3f4f6'}; color: ${a.role === 'Dueño' ? '#92400e' : 'var(--color-text-secondary)'}; font-weight: 700;">
              ${a.role}
            </span>
          </div>
        `).join('') : `
          <span style="font-size: 0.8rem; color: var(--color-text-muted); font-style: italic;">No hay colaboradores registrados</span>
        `}
      </div>
    </div>
  `;
}

// Helpers para el Panel Admin
async function selectClientForEdit(clientId) {
  selectedAdminClientId = clientId;
  renderAllTabs();
  
  if (clientId) {
    let workspaces = [];
    try {
      if (currentAuthUser && window.TocaDB?.isConfigured()) {
        const { data, error } = await window.TocaDB.getClient().rpc('admin_get_user_workspaces', { client_user_id: clientId });
        if (!error) workspaces = data || [];
      } else {
        workspaces = JSON.parse(localStorage.getItem(`toca_businesses_${clientId}`)) || [];
      }
    } catch (err) {
      console.error("Error fetching workspaces for admin view:", err);
    }
    
    const client = adminClients.find(c => String(c.id) === String(clientId));
    if (client) {
      populateAdminWorkspacesSelection(client, workspaces);
    }
  }
}

function populateAdminWorkspacesSelection(client, workspaces) {
  const container = document.getElementById('admin-workspaces-selection-container');
  if (!container) return;

  const planSelect = document.getElementById('admin-edit-plan');
  const plan = planSelect ? planSelect.value : client.plan;
  const baseLimits = PLAN_LIMITS[plan] || { businesses: 1 };
  const limit = baseLimits.businesses;

  const limitText = document.getElementById('admin-active-biz-limit-text');
  if (limitText) {
    limitText.textContent = limit === 999 ? 'Ilimitados' : limit;
  }

  const rawProfile = adminUsers.find(u => String(u.id) === String(client.id));
  const parsed = rawProfile ? window.TocaDB.parseDbProfile(rawProfile.raw_full_name || rawProfile.full_name, rawProfile.plan) : { activeWorkspaces: client.activeWorkspaces || null };
  let activeIds = parsed.activeWorkspaces;
  
  if (!activeIds) {
    activeIds = workspaces.slice(0, limit).map(w => String(w.id || w.w_id));
  } else {
    activeIds = activeIds.map(String);
  }

  let html = '';
  if (workspaces.length === 0) {
    html = '<p style="font-size: 0.75rem; color: var(--color-text-muted); margin: 0;">No tiene negocios creados.</p>';
  } else {
    workspaces.forEach((w, idx) => {
      const id = String(w.id || w.w_id);
      const name = w.name || w.w_name || 'Sin nombre';
      const isChecked = activeIds.includes(id);
      html += `
        <label style="display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; border: 1px solid var(--border-color); border-radius: 8px; background: #f9fafb; font-size: 0.78rem; font-weight: 500; cursor: pointer; color: var(--color-text-primary); transition: all 0.15s; margin-bottom: 2px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span>🏢</span>
            <span>${name}</span>
          </div>
          <input type="checkbox" class="admin-workspace-checkbox" value="${id}" ${isChecked ? 'checked' : ''} onchange="validateAdminWorkspaceCheckboxes(${limit})" style="width: 16px; height: 16px; cursor: pointer;">
        </label>
      `;
    });
  }
  container.innerHTML = html;
  validateAdminWorkspaceCheckboxes(limit);
}

function validateAdminWorkspaceCheckboxes(limit) {
  if (limit === 999) return;
  const checkboxes = document.querySelectorAll('.admin-workspace-checkbox');
  const checked = Array.from(checkboxes).filter(cb => cb.checked);
  
  checkboxes.forEach(cb => {
    if (!cb.checked) {
      cb.disabled = checked.length >= limit;
      cb.parentNode.style.opacity = checked.length >= limit ? '0.5' : '1';
      cb.parentNode.style.cursor = checked.length >= limit ? 'not-allowed' : 'pointer';
    } else {
      cb.disabled = false;
      cb.parentNode.style.opacity = '1';
      cb.parentNode.style.cursor = 'pointer';
    }
  });
}

function updateAdminWorkspaceLimit(planValue) {
  const baseLimits = PLAN_LIMITS[planValue] || { businesses: 1 };
  const limit = baseLimits.businesses;
  
  const limitText = document.getElementById('admin-active-biz-limit-text');
  if (limitText) {
    limitText.textContent = limit === 999 ? 'Ilimitados' : limit;
  }
  
  validateAdminWorkspaceCheckboxes(limit);
}

function toggleAdminCustomPlanFields(planValue) {
  const customPanel = document.getElementById('admin-apiario-custom-panel');
  const expansionPanel = document.getElementById('admin-expansion-panel');
  const limitContacts = document.getElementById('admin-edit-contacts');
  const limitAgents = document.getElementById('admin-edit-agents');
  
  if (planValue === 'Apiario') {
    if (customPanel) customPanel.style.display = 'block';
    if (expansionPanel) expansionPanel.style.display = 'none';
    if (limitContacts) {
      limitContacts.removeAttribute('disabled');
      limitContacts.style.background = '#ffffff';
    }
    if (limitAgents) {
      limitAgents.removeAttribute('disabled');
      limitAgents.style.background = '#ffffff';
    }
  } else {
    if (customPanel) customPanel.style.display = 'none';
    if (expansionPanel) expansionPanel.style.display = 'block';
    if (limitContacts) {
      limitContacts.setAttribute('disabled', 'true');
      limitContacts.style.background = '#f3f4f6';
    }
    if (limitAgents) {
      limitAgents.setAttribute('disabled', 'true');
      limitAgents.style.background = '#f3f4f6';
    }
    
    // Reset limits based on base + expansions
    const baseLimits = PLAN_LIMITS[planValue] || PLAN_LIMITS['Panal'];
    const extraAgents = parseInt(document.getElementById('admin-edit-extra-agents')?.value) || 0;
    const extraPacks = parseInt(document.getElementById('admin-edit-extra-packs')?.value) || 0;
    
    if (limitContacts) limitContacts.value = baseLimits.contacts + (extraPacks * 50);
    if (limitAgents) limitAgents.value = baseLimits.agents + extraAgents;
  }
}

function changeAdminExpansionField(field, delta) {
  const hiddenInput = document.getElementById(field === 'agents' ? 'admin-edit-extra-agents' : 'admin-edit-extra-packs');
  const textVal = document.getElementById(field === 'agents' ? 'admin-val-extra-agents' : 'admin-val-extra-packs');
  const costVal = document.getElementById('admin-expansion-cost');
  const limitInput = document.getElementById(field === 'agents' ? 'admin-edit-agents' : 'admin-edit-contacts');
  
  if (!hiddenInput || !textVal || !costVal || !limitInput) return;
  
  let currentVal = parseInt(hiddenInput.value) || 0;
  let newVal = currentVal + delta;
  if (newVal < 0) newVal = 0;
  
  hiddenInput.value = newVal;
  textVal.textContent = `+${newVal}`;
  
  // Recalcular límites visuales
  const plan = document.getElementById('admin-edit-plan').value;
  const baseLimits = PLAN_LIMITS[plan] || { agents: 3, contacts: 200 };
  
  if (field === 'agents') {
    limitInput.value = baseLimits.agents + newVal;
  } else {
    limitInput.value = baseLimits.contacts + (newVal * 50);
  }
  
  // Recalcular costo
  const extraAgents = parseInt(document.getElementById('admin-edit-extra-agents').value) || 0;
  const extraPacks = parseInt(document.getElementById('admin-edit-extra-packs').value) || 0;
  const totalCost = (extraAgents * 24.90) + (extraPacks * 19.90);
  costVal.textContent = `S/. ${totalCost.toFixed(2)} / mes`;
}

function adminApplyClientEditChanges(clientId) {
  const plan = document.getElementById('admin-edit-plan').value;
  const maxContacts = document.getElementById('admin-edit-contacts').value;
  const maxAgents = document.getElementById('admin-edit-agents').value;
  const status = document.getElementById('admin-edit-status').value;
  const lastPaymentDate = document.getElementById('admin-edit-payment-date').value;
  const copilot = document.getElementById('admin-edit-copilot')?.checked ?? false;
  
  const extraAgents = document.getElementById('admin-edit-extra-agents')?.value ?? 0;
  const extraPacks = document.getElementById('admin-edit-extra-packs')?.value ?? 0;
  const factura = document.getElementById('admin-edit-factura')?.checked ?? true;

  const checkboxes = document.querySelectorAll('.admin-workspace-checkbox');
  const checkedIds = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);

  saveClientPlanChanges(clientId, plan, copilot, false, maxContacts, maxAgents, status, lastPaymentDate, extraAgents, extraPacks, factura, checkedIds);
  selectClientForEdit(null);
}

function filterAdminClientsTable(query) {
  const term = query.toLowerCase().trim();
  const rows = document.querySelectorAll('.admin-client-row');
  rows.forEach(row => {
    const searchVal = row.getAttribute('data-search') || '';
    if (searchVal.includes(term)) {
      row.style.display = '';
    } else {
      row.style.display = 'none';
    }
  });
}

let adminSortField = null;
let adminSortOrder = 'default'; // 'default', 'asc', 'desc'

function sortAdminTable(field) {
  if (adminSortField === field) {
    if (adminSortOrder === 'default') {
      adminSortOrder = 'asc';
    } else if (adminSortOrder === 'asc') {
      adminSortOrder = 'desc';
    } else {
      adminSortOrder = 'default';
    }
  } else {
    adminSortField = field;
    adminSortOrder = 'asc';
  }
  
  renderSortedAdminTable();
}

function renderSortedAdminTable() {
  const tbody = document.getElementById('admin-clients-tbody');
  if (!tbody) return;
  
  // 1. Obtener copia de los clientes
  let list = [...adminClients];
  
  // 2. Ordenar según el campo y orden actual
  if (adminSortField && adminSortOrder !== 'default') {
    list.sort((a, b) => {
      let valA, valB;
      if (adminSortField === 'business') {
        valA = a.businessName.toLowerCase();
        valB = b.businessName.toLowerCase();
        return adminSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (adminSortField === 'admin') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        return adminSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else if (adminSortField === 'contacts') {
        valA = a.contactsCount || 0;
        valB = b.contactsCount || 0;
        return adminSortOrder === 'asc' ? valA - valB : valB - valA;
      } else if (adminSortField === 'plan') {
        const ranks = { Gratuito: 1, Néctar: 2, Panal: 3, Colmena: 4, Apiario: 5 };
        valA = ranks[a.plan] || 0;
        valB = ranks[b.plan] || 0;
        return adminSortOrder === 'asc' ? valA - valB : valB - valA;
      }
      return 0;
    });
  }
  
  // 3. Renderizar el HTML de las filas
  const planPills = {
    Gratuito: { bg: '#f3f4f6', text: '#4b5563', tag: '🌱 Gratuito' },
    Néctar: { bg: '#fef0f0', text: '#fe3c43', tag: '🌸 Néctar' },
    Panal: { bg: '#fffbeb', text: '#d97706', tag: '🍯 Plan Panal' },
    Colmena: { bg: '#f5f3ff', text: '#7c3aed', tag: '🐝 Colmena' },
    Apiario: { bg: '#ecfdf5', text: '#059669', tag: '👑 Apiario' }
  };

  tbody.innerHTML = list.map(c => {
    const pill = planPills[c.plan] || planPills.Panal;
    const nameVal = c.name || '';
    const bizVal = c.businessName || '';
    const emailVal = c.email || '';
    const planVal = c.plan || '';
    const searchData = `${nameVal.toLowerCase()} ${bizVal.toLowerCase()} ${emailVal.toLowerCase()} ${planVal.toLowerCase()}`;
    return `
      <tr class="admin-client-row" data-search="${searchData}" style="border-bottom: 1px solid var(--border-color); background: #ffffff;">
        <td style="padding: 12px 14px; font-weight: 600; color: var(--color-text-primary);">${c.businessName}</td>
        <td style="padding: 12px 14px; color: var(--color-text-secondary);">
          <div style="font-weight: 500; font-size: 0.85rem;">${c.name}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted);">${c.email}</div>
        </td>
        <td style="padding: 12px 14px; color: var(--color-text-secondary); font-size: 0.8rem;">
          <span>👤 ${c.contactsCount} / ${c.maxContacts}</span>
          <span style="margin-left: 10px; color: var(--color-text-muted);">👥 ${c.agentsCount} agentes</span>
        </td>
        <td style="padding: 12px 14px;">
          <span style="background: ${pill.bg}; color: ${pill.text}; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 0.68rem; text-transform: uppercase;">
            ${pill.tag}
          </span>
        </td>
        <td style="padding: 12px 14px; text-align: right; white-space: nowrap;">
          ${(c.email || '').toLowerCase() === 'fibeeconsultoradigital@gmail.com' ? `
            <span style="font-size: 0.75rem; font-weight: 700; color: #7d35ef; text-transform: uppercase; letter-spacing: 0.05em; padding-right: 14px;">👑 Super Admin</span>
          ` : `
            <button onclick="selectClientForEdit('${c.id}')" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: 6px; padding: 5px 10px; font-size: 0.75rem; font-weight: 600; cursor: pointer; color: var(--color-text-primary); margin-right: 6px; transition: background 0.15s;">
              ⚙️ Gestionar
            </button>
            <button onclick="impersonateClient('${c.id}')" style="background: #f3f4f6; border: none; border-radius: 6px; padding: 5px 10px; font-size: 0.75rem; font-weight: 600; cursor: pointer; color: var(--color-text-primary); transition: background 0.15s;">
              👁️ Suplantar
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
  
  // 4. Actualizar iconos de ordenación en el DOM
  const fields = ['business', 'admin', 'contacts', 'plan'];
  fields.forEach(f => {
    const icon = document.getElementById(`sort-icon-${f}`);
    if (icon) {
      if (adminSortField === f && adminSortOrder !== 'default') {
        icon.textContent = adminSortOrder === 'asc' ? ' ▲' : ' ▼';
        icon.style.color = 'var(--color-accent)';
      } else {
        icon.textContent = ' ↕';
        icon.style.color = 'var(--color-text-muted)';
      }
    }
  });

  // Re-aplicar filtro si hay valor en el buscador
  const searchInput = document.getElementById('admin-client-search');
  if (searchInput && searchInput.value) {
    filterAdminClientsTable(searchInput.value);
  }
}

function generateIaSuggestionsHtml(id) {
  const c = contacts.find(contact => contact.id === id);
  if (!c) return '';

  const hasContext = c.context && c.context.trim() !== "";
  const first = c.name.split(' ')[0];
  
  // Customization based on Business Profile
  const bizName = businessProfile.name;
  const bizPromo = businessProfile.promotion ? ` (${businessProfile.promotion})` : "";
  const bizTone = businessProfile.tone;

  let suggestions = {};
  if (hasContext) {
    const contextLower = c.context.toLowerCase();
    suggestions = {
      Cercano: `¡Hola ${first}! 😊 ¿Cómo va todo? Te saludo de ${bizName}. Quedé atento a lo que conversamos sobre ${contextLower.replace(/\.$/, '')}. Cuéntame si pudiste darle una de tus miradas o si tienes alguna duda. ¡Abrazo!${bizPromo ? ' Recuerda que tenemos activo: ' + bizPromo : ''}`,
      Directo: `Estimado ${first}, espero que se encuentre muy bien. Le escribo de parte de ${bizName} para dar seguimiento a nuestro tema pendiente sobre ${contextLower.replace(/\.$/, '')} y saber si podemos agendar una breve llamada hoy. Quedo a su disposición.`,
      "Con gancho": `Hola ${first}, ¿cómo estás? Hace un momento estuve revisando en ${bizName} los detalles sobre ${contextLower.replace(/\.$/, '')} y creo que tengo una idea genial que podría simplificar las cosas. ¿Tendrás 5 minutos para conversar en la tarde?`
    };
  } else {
    suggestions = {
      Cercano: `¡Hola ${first}! 😊 ¿Cómo va todo? Te escribía de parte de ${bizName} para saludarte y ver si pudimos retomar nuestra conversación de hace unos días. ¡Abrazo!${bizPromo ? ' Por cierto, recuerda que sigue activo: ' + bizPromo : ''}`,
      Directo: `Estimado ${first}, espero que se encuentre muy bien. Le escribo de parte de ${bizName} para dar seguimiento a nuestro tema pendiente y saber si tiene unos minutos libres para conversar hoy.`,
      "Con gancho": `Hola ${first}, ¿cómo estás? He estado pensando en una alternativa desde ${bizName} que podría interesarte para el proyecto que tenemos en mente. ¿Te viene bien una breve llamada hoy?`
    };
  }

  return `
    <div class="ia-suggestions-inline-box" style="margin-top: 10px; padding: 12px; background: #fdfcfa; border-radius: 12px; border: 1px solid rgba(124, 58, 237, 0.15); display: flex; flex-direction: column; gap: 8px; animation: slideDown 0.25s ease-out; box-shadow: 0 4px 12px rgba(124, 58, 237, 0.04);">
      <div style="font-size: 0.75rem; color: #7c3aed; font-weight: 600; display: flex; align-items: center; gap: 6px;">
        <span>✨ Sugerencias de Mensajes IA</span>
      </div>
      <div style="font-size: 0.7rem; color: var(--color-text-muted); font-style: italic; margin-bottom: 2px;">
        Contexto: "${c.context || 'Sin contexto registrado (usando plantilla base)'}"
      </div>
      
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px;">
        <div class="ia-suggestion-card" style="padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
          <div>
            <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Cercano ${bizTone === 'Amigable' ? '<span style="color:#c2410c; margin-left:4px; font-weight:700;">★ recomendado</span>' : ''}</span>
            <p class="ia-text" id="sug-cercano-${id}" style="font-size: 0.76rem; margin: 6px 0 0 0; color: var(--color-text-primary); line-height: 1.35;">${suggestions.Cercano}</p>
          </div>
          <div class="ia-card-actions" style="display: flex; gap: 6px;">
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff; flex: 1;" onclick="actionSendMessage(${id}, 'sug-cercano-${id}')">↗ WhatsApp</button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff; flex: 1;" onclick="actionCopyMessage(${id}, 'sug-cercano-${id}', this)">⧉ Copiar</button>
          </div>
        </div>
        
        <div class="ia-suggestion-card" style="padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
          <div>
            <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Directo ${bizTone === 'Directo' || bizTone === 'Formal' ? '<span style="color:#c2410c; margin-left:4px; font-weight:700;">★ recomendado</span>' : ''}</span>
            <p class="ia-text" id="sug-directo-${id}" style="font-size: 0.76rem; margin: 6px 0 0 0; color: var(--color-text-primary); line-height: 1.35;">${suggestions.Directo}</p>
          </div>
          <div class="ia-card-actions" style="display: flex; gap: 6px;">
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff; flex: 1;" onclick="actionSendMessage(${id}, 'sug-directo-${id}')">↗ WhatsApp</button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff; flex: 1;" onclick="actionCopyMessage(${id}, 'sug-directo-${id}', this)">⧉ Copiar</button>
          </div>
        </div>
        
        <div class="ia-suggestion-card" style="padding: 10px; background: #ffffff; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; justify-content: space-between; gap: 8px;">
          <div>
            <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Con gancho ${bizTone === 'Divertido' ? '<span style="color:#c2410c; margin-left:4px; font-weight:700;">★ recomendado</span>' : ''}</span>
            <p class="ia-text" id="sug-gancho-${id}" style="font-size: 0.76rem; margin: 6px 0 0 0; color: var(--color-text-primary); line-height: 1.35;">${suggestions["Con gancho"]}</p>
          </div>
          <div class="ia-card-actions" style="display: flex; gap: 6px;">
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff; flex: 1;" onclick="actionSendMessage(${id}, 'sug-gancho-${id}')">↗ WhatsApp</button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff; flex: 1;" onclick="actionCopyMessage(${id}, 'sug-gancho-${id}', this)">⧉ Copiar</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderProfileTab() {
  const isModalOpen = document.getElementById('profile-config-modal')?.classList.contains('open');
  if (isModalOpen) return;
  renderProfileModalContent();
}

function renderProfileModalContent() {
  const container = document.getElementById('profile-modal-body');
  if (!container) return;

  const currentTab = typeof currentProfileModalTab !== 'undefined' ? currentProfileModalTab : 'perfil';

  // Toggle active class on modal tab buttons
  const btnPerfil = document.getElementById('btn-profile-tab-perfil');
  const btnPlan = document.getElementById('btn-profile-tab-plan');
  const btnEquipo = document.getElementById('btn-profile-tab-equipo');
  
  if (btnPerfil) btnPerfil.classList.toggle('active', currentTab === 'perfil');
  if (btnPlan) btnPlan.classList.toggle('active', currentTab === 'plan');
  if (btnEquipo) btnEquipo.classList.toggle('active', currentTab === 'equipo');

  if (currentTab === 'perfil') {
    const planLimitInfo = PLAN_LIMITS[currentActivePlan];
    const bizLimit = planLimitInfo ? planLimitInfo.businesses : 2;
    const displayLimit = bizLimit === 999 ? 'Ilimitados' : bizLimit;
    
    // Generate business list rows for workspace management
    let bizListHtml = '';
    businesses.forEach((b, idx) => {
      const isActive = b.id === currentBusinessId;
      const isMain = b.id === 1;
      const isLocked = currentActiveWorkspaces ? !currentActiveWorkspaces.includes(String(b.id)) : idx >= bizLimit;
      const showDelete = currentSimulatedUserRole === 'Administrador' && !isActive && !isMain;
      
      bizListHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid ${isActive ? 'var(--color-accent)' : 'var(--border-color)'}; opacity: ${isLocked ? '0.6' : '1'};">
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; flex-grow: 1;">
            <span style="font-size: 0.9rem;">🏢</span>
            <span style="font-size: 0.78rem; font-weight: ${isActive ? '700' : '500'}; color: var(--color-text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 180px;">${b.name}${isLocked ? ' 🔒' : ''}</span>
            ${isActive ? '<span style="font-size: 0.6rem; background: #fef3c7; color: #b45309; padding: 1px 4px; border-radius: 4px; font-weight: 700; border: 1px solid #fde68a; margin-left: 4px;">Activo</span>' : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            ${!isActive ? `
              <button onclick="${isLocked ? '' : `switchBusinessWorkspace('${b.id}')`}" 
                      ${isLocked ? 'disabled style="background: #e5e7eb; color: #9ca3af; cursor: not-allowed; border: none; font-size: 0.68rem; padding: 3px 6px; border-radius: 4px; font-weight: 600;"' : 'style="background: #f3f4f6; border: none; font-size: 0.68rem; padding: 3px 6px; border-radius: 4px; color: var(--color-text-secondary); cursor: pointer; font-weight: 600;"'}>
                Editar
              </button>
            ` : ''}
            ${showDelete ? `<button onclick="deleteBusinessWorkspace('${b.id}')" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 0.9rem; padding: 2px;" title="Eliminar negocio y contactos">🗑️</button>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <style>
        #profile-columns-layout {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
        }
        @media (max-width: 768px) {
          #profile-columns-layout {
            grid-template-columns: 1fr !important;
          }
        }
      </style>
      
      <div style="max-width: 1000px; margin: 0 auto;" id="profile-columns-layout">
        <!-- Left Column: User & Brand Config Stack -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          
          <!-- Card 1: Perfil de Usuario (General) -->
          <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 12px;">
            <h3 style="font-family: var(--font-title); font-size: 1rem; font-weight: 700; color: var(--color-text-primary); margin: 0; padding-bottom: 8px; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
              <span>👤 Perfil del Usuario</span>
              <span style="font-size: 0.65rem; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 999px; font-weight: 600;">Plan: ${PLAN_LIMITS[currentActivePlan]?.name || currentActivePlan}</span>
            </h3>
            <div class="form-group" style="margin-bottom: 0;">
              <label class="form-label" style="font-weight: 600; font-size: 0.72rem;">Tu Nombre y Apellido</label>
              <input type="text" id="profile-owner-name" class="form-input" value="${getCurrentOwnerName()}" placeholder="Ej. Javier Reyes" style="padding: 8px 12px; background: #ffffff;">
            </div>
          </div>

          <!-- Card 2: Perfil del Negocio (Individual) -->
          <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
            <h3 style="font-family: var(--font-title); font-size: 1rem; font-weight: 700; color: var(--color-text-primary); margin: 0; padding-bottom: 8px; border-bottom: 1px solid var(--border-color);">
              🏢 Información de la Marca
            </h3>
            
            <div class="form-group">
              <label class="form-label" style="font-weight: 600; font-size: 0.72rem;">Nombre del Negocio</label>
              <input type="text" id="profile-biz-name" class="form-input" value="${businessProfile.name}" placeholder="Ej. Polos Mayoristas Lima" style="padding: 8px 12px; background: #ffffff;">
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight: 600; font-size: 0.72rem;">Rubro o Sector</label>
              <select id="profile-biz-sector" class="form-input form-select" style="padding: 8px 12px; background: #ffffff;">
                <option value="Comercio" ${businessProfile.sector === 'Comercio' ? 'selected' : ''}>Comercio (Venta de productos/Mercaderías)</option>
                <option value="Servicios y Consultoría" ${businessProfile.sector === 'Servicios y Consultoría' ? 'selected' : ''}>Servicios y Consultoría</option>
                <option value="Suscripciones y Membresías" ${businessProfile.sector === 'Suscripciones y Membresías' ? 'selected' : ''}>Suscripciones y Membresías</option>
                <option value="Alimentos y Bebidas" ${businessProfile.sector === 'Alimentos y Bebidas' ? 'selected' : ''}>Alimentos y Bebidas</option>
                <option value="Tecnología y Software" ${businessProfile.sector === 'Tecnología y Software' ? 'selected' : ''}>Tecnología y Software</option>
                <option value="Educación y Cursos" ${businessProfile.sector === 'Educación y Cursos' ? 'selected' : ''}>Educación y Cursos</option>
                <option value="Otro" ${!['Comercio', 'Servicios y Consultoría', 'Suscripciones y Membresías', 'Alimentos y Bebidas', 'Tecnología y Software', 'Educación y Cursos'].includes(businessProfile.sector) ? 'selected' : ''}>Otro rubro / servicio</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label" style="font-weight: 600; font-size: 0.72rem;">Descripción del Producto/Servicio Principal</label>
              <textarea id="profile-biz-desc" class="form-input" rows="3" placeholder="Describe qué vendes..." style="padding: 8px 12px; background: #ffffff; resize: vertical; font-family: var(--font-body);">${businessProfile.description}</textarea>
            </div>

            <div class="form-row" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 12px;">
              <div class="form-group">
                <label class="form-label" style="font-weight: 600; font-size: 0.72rem;">Tono de la Marca</label>
                <select id="profile-biz-tone" class="form-input form-select" style="padding: 8px 12px; background: #ffffff;">
                  <option value="Amigable" ${businessProfile.tone === 'Amigable' ? 'selected' : ''}>Amigable 😊</option>
                  <option value="Formal" ${businessProfile.tone === 'Formal' ? 'selected' : ''}>Formal 💼</option>
                  <option value="Directo" ${businessProfile.tone === 'Directo' ? 'selected' : ''}>Directo 🎯</option>
                  <option value="Divertido" ${businessProfile.tone === 'Divertido' ? 'selected' : ''}>Divertido ⚡</option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label" style="font-weight: 600; font-size: 0.72rem;">Oferta / Promoción Clave</label>
                <input type="text" id="profile-biz-promo" class="form-input" value="${businessProfile.promotion}" placeholder="Ej. Envío gratis a todo el Perú" style="padding: 8px 12px; background: #ffffff;">
              </div>
            </div>
          </div>

          <!-- Single Save Button at the Bottom of Left Column -->
          <button class="btn-primary" style="align-self: flex-start; background: var(--color-accent); color: #0a0a0a; font-weight: 600; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer; font-size: 0.75rem;" onclick="saveAllProfileSettings()">
            💾 Guardar Configuración
          </button>
        </div>

        <!-- Right Column: Workspace switcher & lists -->
        <div style="display: flex; flex-direction: column; gap: 16px;">
          <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
            <!-- Workspace Switcher & Limits -->
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255, 204, 6, 0.08); border: 1px solid rgba(255, 204, 6, 0.3); padding: 10px 14px; border-radius: 8px; margin-bottom: 4px;">
              <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1;">
                <span style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700; letter-spacing: 0.03em;">Negocio en Edición</span>
                <select id="modal-business-switcher" onchange="switchBusinessWorkspace(isNaN(this.value) ? this.value : parseInt(this.value))" style="background: transparent; border: none; font-family: var(--font-title); font-size: 0.95rem; font-weight: 700; color: var(--color-text-primary); cursor: pointer; outline: none; padding: 0; width: 100%;">
                  ${businesses.map(b => `<option value="${b.id}" ${b.id === currentBusinessId ? 'selected' : ''}>${b.name}</option>`).join('')}
                </select>
              </div>
              <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 2px; min-width: 110px;">
                <span style="font-size: 0.72rem; font-weight: 700; color: var(--color-text-primary);">Límite: ${businesses.length}/${displayLimit} Negocios</span>
                ${bizLimit !== 999 && businesses.length >= bizLimit ? `<span style="font-size: 0.62rem; color: #b45309; font-weight: 600; cursor: pointer; text-decoration: underline;" onclick="switchProfileModalTab('plan')" title="Subir plan para agregar más marcas">📈 Upgrade Plan</span>` : ''}
              </div>
            </div>
            
            <!-- Workspace Management List -->
            <div style="background: #f9fafb; border: 1px solid var(--border-color); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
              <span style="font-size: 0.68rem; font-weight: 700; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: 0.02em;">Gestión de Espacios de Trabajo</span>
              <div style="display: flex; flex-direction: column; gap: 6px;">
                ${bizListHtml}
              </div>
              
              <!-- Add New Workspace button -->
              ${currentSimulatedUserRole === 'Administrador' ? `
                ${businesses.length < bizLimit ? `
                  <div style="display: flex; gap: 6px; margin-top: 4px;">
                    <input type="text" id="new-biz-name-input" placeholder="Nombre de nueva marca (Ej: Lima Growth)" style="flex-grow: 1; font-size: 0.72rem; padding: 5px 8px; border-radius: 6px; border: 1px solid var(--border-color); background: #ffffff;">
                    <button onclick="createBusinessWorkspace(document.getElementById('new-biz-name-input').value)" style="background: var(--color-accent); border: none; color: #0a0a0a; font-size: 0.72rem; font-weight: 600; padding: 5px 10px; border-radius: 6px; cursor: pointer; white-space: nowrap;">➕ Agregar</button>
                  </div>
                ` : `
                  <div style="font-size: 0.7rem; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px; text-align: center; font-weight: 600; margin-top: 2px;">
                    🔒 Límite de negocios alcanzado (${businesses.length}/${displayLimit}). <span style="text-decoration: underline; cursor: pointer;" onclick="switchProfileModalTab('plan')">Sube de plan para agregar más.</span>
                  </div>
                `}
              ` : `
                <div style="font-size: 0.68rem; color: var(--color-text-muted); text-align: center; padding: 4px;">
                  🔒 Solo el propietario puede administrar los negocios.
                </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  } else if (currentTab === 'plan') {
    const totalExtraCost = (tempExtraAgents * 24.90 + tempExtraPacks * 19.90).toFixed(2);
    const hasAddons = tempExtraAgents > 0 || tempExtraPacks > 0;
    
    container.innerHTML = `
      <style>
        .pricing-card {
          background: #ffffff;
          border: 1px solid var(--border-color);
          padding: 16px 12px;
          border-radius: 12px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 250px;
          position: relative;
          transition: all 0.2s ease;
          box-sizing: border-box;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.03);
        }
        .pricing-card.active {
          border: 2px solid #fbbf24;
          box-shadow: 0 4px 12px rgba(251, 191, 36, 0.08);
          background: rgba(251, 191, 36, 0.01);
        }
        .stepper-btn {
          width: 28px;
          height: 28px;
          border-radius: 6px;
          border: 1px solid var(--border-color);
          background: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.15s;
          outline: none;
        }
        .stepper-btn:hover:not(:disabled) {
          background: #f3f4f6;
        }
        .stepper-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        @media (max-width: 580px) {
          #pricing-grid {
            grid-template-columns: 1fr !important;
          }
          .pricing-card {
            min-height: auto;
          }
        }
      </style>
      <div style="display: flex; flex-direction: column; gap: 16px; padding: 10px 0;">
        <div style="text-align: center; margin-bottom: 8px;">
          <h3 style="font-family: var(--font-title); font-size: 1.15rem; font-weight: 700; color: var(--color-text-primary); margin: 0 0 4px 0;">Planes Fibee para Toca</h3>
          <p style="font-size: 0.8rem; color: var(--color-text-secondary); margin: 0;">Escoge el plan ideal para el tamaño de tu equipo de ventas y tus contactos activos.</p>
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; width: 100%;" id="pricing-grid">
          
          <!-- Plan Néctar -->
          <div class="pricing-card ${currentActivePlan === 'Néctar' ? 'active' : ''}">
            ${currentActivePlan === 'Néctar' ? '<span style="position: absolute; top: -10px; right: 12px; background: #fbbf24; color: #0a0a0a; font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.02em; z-index: 10;">✓ Activo</span>' : ''}
            <div style="display: flex; flex-direction: column; gap: 4px; height: 100%;">
              <h4 style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 700; color: ${currentActivePlan === 'Néctar' ? '#b45309' : 'var(--color-text-primary)'}; margin: 0; display: flex; align-items: center; gap: 4px;">Plan Néctar 🌸</h4>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-primary); margin: 4px 0;">S/. 59 <span style="font-size: 0.65rem; font-weight: 500; color: var(--color-text-muted);">/ mes</span></div>
              <ul style="font-size: 0.72rem; color: var(--color-text-secondary); padding-left: 14px; margin: 6px 0; line-height: 1.4; text-align: left; list-style-type: disc;">
                <li>1 Agente de ventas</li>
                <li>Hasta 50 contactos</li>
                <li>1 Negocio activo</li>
                <li>Copiloto IA incluido</li>
                <li>Estadísticas</li>
              </ul>
            </div>
            ${currentActivePlan === 'Néctar' ? `
              <div style="display: flex; gap: 6px; margin-top: 8px;">
                <button class="btn-primary" disabled style="flex: 1; justify-content: center; font-size: 0.72rem; padding: 6px; background: #f3f4f6; color: #9ca3af; border: none; cursor: default; border-radius: 6px;">Activo</button>
                <button class="btn-secondary" onclick="togglePricingExpansion()" style="font-size: 0.72rem; padding: 6px; border-color: #fbbf24; color: #b45309; background: ${isPricingExpanded ? '#fef3c7' : '#ffffff'}; font-weight: 600; cursor: pointer; border-radius: 6px;">
                  ${isPricingExpanded ? 'Ocultar' : 'Expandir'}
                </button>
              </div>
            ` : `
              <div style="margin-top: 8px;">
                <button class="btn-secondary" onclick="window.open('https://wa.me/51987654321?text=Hola%20asesor%20de%20Fibee%2C%20quisiera%20cambiar%20mi%20plan%20al%20Plan%20N%C3%A9ctar', '_blank')" style="width: 100%; justify-content: center; font-size: 0.72rem; padding: 6px; border-color: var(--border-color); color: var(--color-text-primary); background: #ffffff; cursor: pointer; border-radius: 6px;">Contratar</button>
              </div>
            `}
          </div>
          
          <!-- Plan Panal (RECOMENDADO/ACTIVO) -->
          <div class="pricing-card ${currentActivePlan === 'Panal' ? 'active' : ''}">
            ${currentActivePlan === 'Panal' ? '<span style="position: absolute; top: -10px; right: 12px; background: #fbbf24; color: #0a0a0a; font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.02em; z-index: 10;">✓ Activo</span>' : ''}
            <div style="display: flex; flex-direction: column; gap: 4px; height: 100%;">
              <h4 style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 700; color: ${currentActivePlan === 'Panal' ? '#b45309' : 'var(--color-text-primary)'}; margin: 0; display: flex; align-items: center; gap: 4px;">Plan Panal 🍯</h4>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-primary); margin: 4px 0;">S/. 109 <span style="font-size: 0.65rem; font-weight: 500; color: var(--color-text-muted);">/ mes</span></div>
              <div style="font-size: 0.62rem; color: #b45309; font-weight: 700; margin-top: -2px; margin-bottom: 2px; text-transform: uppercase; letter-spacing: 0.02em;">⭐ El más elegido</div>
              <ul style="font-size: 0.72rem; color: var(--color-text-secondary); padding-left: 14px; margin: 6px 0; line-height: 1.4; text-align: left; list-style-type: disc;">
                <li>Hasta 3 agentes</li>
                <li>Hasta 200 contactos</li>
                <li>Hasta 2 negocios activos</li>
                <li>Copiloto IA incluido</li>
                <li>Estadísticas</li>
              </ul>
            </div>
            ${currentActivePlan === 'Panal' ? `
              <div style="display: flex; gap: 6px; margin-top: 8px;">
                <button class="btn-primary" disabled style="flex: 1; justify-content: center; font-size: 0.72rem; padding: 6px; background: #f3f4f6; color: #9ca3af; border: none; cursor: default; border-radius: 6px;">Activo</button>
                <button class="btn-secondary" onclick="togglePricingExpansion()" style="font-size: 0.72rem; padding: 6px; border-color: #fbbf24; color: #b45309; background: ${isPricingExpanded ? '#fef3c7' : '#ffffff'}; font-weight: 600; cursor: pointer; border-radius: 6px;">
                  ${isPricingExpanded ? 'Ocultar' : 'Expandir'}
                </button>
              </div>
            ` : `
              <div style="margin-top: 8px;">
                <button class="btn-secondary" onclick="window.open('https://wa.me/51987654321?text=Hola%20asesor%20de%20Fibee%2C%20quisiera%20cambiar%20mi%20plan%20al%20Plan%20Panal', '_blank')" style="width: 100%; justify-content: center; font-size: 0.72rem; padding: 6px; border-color: var(--border-color); color: var(--color-text-primary); background: #ffffff; cursor: pointer; border-radius: 6px;">Contratar</button>
              </div>
            `}
          </div>
          
          <!-- Plan Colmena -->
          <div class="pricing-card ${currentActivePlan === 'Colmena' ? 'active' : ''}">
            ${currentActivePlan === 'Colmena' ? '<span style="position: absolute; top: -10px; right: 12px; background: #fbbf24; color: #0a0a0a; font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.02em; z-index: 10;">✓ Activo</span>' : ''}
            <div style="display: flex; flex-direction: column; gap: 4px; height: 100%;">
              <h4 style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 700; color: ${currentActivePlan === 'Colmena' ? '#b45309' : 'var(--color-text-primary)'}; margin: 0; display: flex; align-items: center; gap: 4px;">Plan Colmena 🐝</h4>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-primary); margin: 4px 0;">S/. 150 <span style="font-size: 0.65rem; font-weight: 500; color: var(--color-text-muted);">/ mes</span></div>
              <ul style="font-size: 0.72rem; color: var(--color-text-secondary); padding-left: 14px; margin: 6px 0; line-height: 1.4; text-align: left; list-style-type: disc;">
                <li>Hasta 8 agentes</li>
                <li>Hasta 600 contactos</li>
                <li>Hasta 5 negocios activos</li>
                <li>Copiloto IA incluido</li>
                <li>Estadísticas</li>
              </ul>
            </div>
            ${currentActivePlan === 'Colmena' ? `
              <div style="display: flex; gap: 6px; margin-top: 8px;">
                <button class="btn-primary" disabled style="flex: 1; justify-content: center; font-size: 0.72rem; padding: 6px; background: #f3f4f6; color: #9ca3af; border: none; cursor: default; border-radius: 6px;">Activo</button>
                <button class="btn-secondary" onclick="togglePricingExpansion()" style="font-size: 0.72rem; padding: 6px; border-color: #fbbf24; color: #b45309; background: ${isPricingExpanded ? '#fef3c7' : '#ffffff'}; font-weight: 600; cursor: pointer; border-radius: 6px;">
                  ${isPricingExpanded ? 'Ocultar' : 'Expandir'}
                </button>
              </div>
            ` : `
              <div style="margin-top: 8px;">
                <button class="btn-secondary" onclick="window.open('https://wa.me/51987654321?text=Hola%20asesor%20de%20Fibee%2C%20quisiera%20cambiar%20mi%20plan%20al%20Plan%20Colmena', '_blank')" style="width: 100%; justify-content: center; font-size: 0.72rem; padding: 6px; border-color: var(--border-color); color: var(--color-text-primary); background: #ffffff; cursor: pointer; border-radius: 6px;">Contratar</button>
              </div>
            `}
          </div>

          <!-- Plan Apiario -->
          <div class="pricing-card ${currentActivePlan === 'Apiario' ? 'active' : ''}">
            ${currentActivePlan === 'Apiario' ? '<span style="position: absolute; top: -10px; right: 12px; background: #fbbf24; color: #0a0a0a; font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.02em; z-index: 10;">✓ Activo</span>' : ''}
            <div style="display: flex; flex-direction: column; gap: 4px; height: 100%;">
              <h4 style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 700; color: ${currentActivePlan === 'Apiario' ? '#b45309' : 'var(--color-text-primary)'}; margin: 0; display: flex; align-items: center; gap: 4px;">Plan Apiario 👑</h4>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-primary); margin: 4px 0;">A Medida</div>
              <ul style="font-size: 0.72rem; color: var(--color-text-secondary); padding-left: 14px; margin: 6px 0; line-height: 1.4; text-align: left; list-style-type: disc;">
                <li>Agentes ilimitados</li>
                <li>Contactos ilimitados</li>
                <li>Negocios ilimitados</li>
                <li>Copiloto IA personalizado</li>
                <li>Estadísticas</li>
              </ul>
            </div>
            ${currentActivePlan === 'Apiario' ? `
              <div style="display: flex; gap: 6px; margin-top: 8px;">
                <button class="btn-primary" disabled style="flex: 1; justify-content: center; font-size: 0.72rem; padding: 6px; background: #f3f4f6; color: #9ca3af; border: none; cursor: default; border-radius: 6px;">Activo</button>
                <button class="btn-secondary" onclick="togglePricingExpansion()" style="font-size: 0.72rem; padding: 6px; border-color: #fbbf24; color: #b45309; background: ${isPricingExpanded ? '#fef3c7' : '#ffffff'}; font-weight: 600; cursor: pointer; border-radius: 6px;">
                  ${isPricingExpanded ? 'Ocultar' : 'Expandir'}
                </button>
              </div>
            ` : `
              <div style="margin-top: 8px;">
                <button class="btn-primary" onclick="window.open('https://wa.me/51987654321?text=Hola%20asesor%20de%20Fibee%2C%20quisiera%20cotizar%20un%20Plan%20Apiario%20personalizado%20para%20mi%20empresa', '_blank')" style="width: 100%; justify-content: center; font-size: 0.72rem; background: var(--color-accent); color: #0a0a0a; border: none; cursor: pointer; border-radius: 6px; font-weight: 600;">Consultar</button>
              </div>
            `}
          </div>
          
        </div>

        <!-- Expansion drawer -->
        <div id="pricing-expansion-drawer" style="display: ${isPricingExpanded ? 'block' : 'none'}; background: #fffbeb; border: 1px solid #fbbf24; border-radius: 12px; padding: 16px; margin-top: 4px; animation: slideDown 0.2s ease-out;">
          <h4 style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 700; color: #b45309; margin: 0 0 4px 0; display: flex; align-items: center; gap: 6px;">⚙️ Personalizar Expansión del Plan Activo (${currentActivePlan})</h4>
          <p style="font-size: 0.76rem; color: #78350f; margin: 0 0 14px 0;">Incrementa tus límites de agentes o contactos agregando adicionales a tu suscripción:</p>
          
          <div style="display: flex; flex-direction: column; gap: 12px;">
            
            <!-- Extra Agent seat -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #fde68a;">
              <div>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-primary);">➕ Agente adicional</div>
                <div style="font-size: 0.7rem; color: var(--color-text-secondary);">S/. 24.90 / mes por cada agente extra</div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button class="stepper-btn" onclick="adjustExtraAgents(-1)" ${tempExtraAgents <= 0 ? 'disabled' : ''}>-</button>
                <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-primary); min-width: 16px; text-align: center;">+${tempExtraAgents}</span>
                <button class="stepper-btn" onclick="adjustExtraAgents(1)" ${tempExtraAgents >= 2 ? 'disabled' : ''}>+</button>
              </div>
            </div>

            <!-- Extra Contacts pack -->
            <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 10px 14px; border-radius: 8px; border: 1px solid #fde68a;">
              <div>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-primary);">➕ Pack de 50 contactos</div>
                <div style="font-size: 0.7rem; color: var(--color-text-secondary);">S/. 19.90 / mes por cada pack de 50 contactos extra</div>
              </div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <button class="stepper-btn" onclick="adjustExtraPacks(-1)" ${tempExtraPacks <= 0 ? 'disabled' : ''}>-</button>
                <span style="font-size: 0.85rem; font-weight: 700; color: var(--color-text-primary); min-width: 16px; text-align: center;">+${tempExtraPacks}</span>
                <button class="stepper-btn" onclick="adjustExtraPacks(1)" ${tempExtraPacks >= 2 ? 'disabled' : ''}>+</button>
              </div>
            </div>

            <!-- Total and button row -->
            <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 6px; padding-top: 10px; border-top: 1px dashed #fde68a;">
              <div>
                <div style="font-size: 0.7rem; color: #78350f;">Costo Adicional Estimado:</div>
                <div style="font-size: 1.1rem; font-weight: 800; color: #b45309;">S/. ${totalExtraCost} <span style="font-size: 0.7rem; font-weight: 500;">/ mes</span></div>
              </div>
              <button class="btn-primary" onclick="submitPlanExpansion()" ${!hasAddons ? 'disabled' : ''} style="background: #fbbf24; border: none; color: #0a0a0a; font-weight: 600; padding: 8px 16px; font-size: 0.8rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                💬 Contratar Adicionales
              </button>
            </div>

          </div>
        </div>
        
        <div style="background: #f9fafb; border: 1px solid var(--border-color); border-radius: 8px; padding: 8px 12px; font-size: 0.72rem; color: var(--color-text-muted); line-height: 1.4; text-align: center; display: flex; flex-direction: column; gap: 4px;">
          <div>💡 <strong>Nota de Facturación:</strong> Los pagos y cambios de plan se coordinan por WhatsApp con tu asesor de <strong>Fibee</strong>.</div>
          ${purchasedExtraAgents > 0 || purchasedExtraPacks > 0 ? `
            <div style="margin-top: 4px; border-top: 1px solid var(--border-color); padding-top: 4px;">
              Adicionales Activos: +${purchasedExtraAgents} agentes, +${purchasedExtraPacks} packs de contactos.
            </div>
          ` : ''}
        </div>
      </div>
    `;
  } else if (currentTab === 'equipo') {
    const isAdmin = currentSimulatedUserRole === 'Administrador';
    const agentLimit = PLAN_LIMITS[currentActivePlan].agents + purchasedExtraAgents;
    const isLimitReached = teamAgents.length >= agentLimit;
    
    // Build agent rows based on currentSimulatedUserRole
    const agentRows = teamAgents.map(agent => {
      let actionsHtml = '';
      
      if (isAdmin) {
        // Owner/Admin can delete other agents
        if (agent.role === 'Administrador') {
          // Owner/Admin is the owner/main admin, can't delete self
          actionsHtml = `<span style="color: var(--color-ontrack); font-weight: 700;">● Propietario</span>`;
        } else {
          // Can delete any other agent (active or pending)
          const deleteBtn = `<button onclick="deleteAgent('${agent.email}')" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 0.95rem; padding: 2px 6px; display: inline-flex; align-items: center; justify-content: center; transition: color 0.15s;" onmouseover="this.style.color='var(--color-urgent)'" onmouseout="this.style.color='var(--color-text-muted)'" title="Eliminar agente">🗑️</button>`;
          if (agent.status === 'Activo') {
            actionsHtml = `<div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                             <span style="color: var(--color-ontrack); font-weight: 700; font-size: 0.76rem;">● Activo</span>
                             ${deleteBtn}
                           </div>`;
          } else {
            actionsHtml = `<div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                             <span style="color: var(--color-attention); font-weight: 700; font-size: 0.76rem; animation: blink 2s infinite;">● Pendiente</span>
                             <button onclick="resendAgentInvitation('${agent.email}')" style="background: #ffffff; border: 1px solid var(--border-color); font-size: 0.68rem; padding: 2px 6px; border-radius: 4px; color: var(--color-text-secondary); cursor: pointer;">Reenviar</button>
                             ${deleteBtn}
                           </div>`;
          }
        }
      } else {
        // Simulated user is Agent
        const activeEmail = (typeof currentAuthUser !== 'undefined' && currentAuthUser) ? currentAuthUser.email : 'vendedor@empresa.com';
        if (agent.email.toLowerCase() === activeEmail.toLowerCase()) {
          // Agent can delete/unsubscribe themselves
          actionsHtml = `<div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                           <span style="color: var(--color-ontrack); font-weight: 700; font-size: 0.76rem;">● Activo</span>
                           <button onclick="selfUnsubscribeAgent('${agent.email}')" style="background: #fee2e2; border: 1px solid #fecaca; color: #ef4444; font-size: 0.68rem; padding: 4px 8px; border-radius: 6px; cursor: pointer; font-weight: 600;" title="Dar de baja mi acceso">🚪 Darse de baja</button>
                         </div>`;
        } else {
          // Can only see status of others
          actionsHtml = agent.status === 'Activo' 
            ? `<span style="color: var(--color-ontrack); font-weight: 700; font-size: 0.76rem;">● Activo</span>`
            : `<span style="color: var(--color-attention); font-weight: 700; font-size: 0.76rem;">● Pendiente</span>`;
        }
      }
      
      return `
        <tr style="border-bottom: 1px solid var(--border-color);">
          <td style="padding: 8px; font-weight: 600; color: var(--color-text-primary);">${agent.name}</td>
          <td style="padding: 8px; color: var(--color-text-secondary);">${agent.email}</td>
          <td style="padding: 8px;">
            <span style="font-size: 0.72rem; font-weight: 700; padding: 2px 6px; border-radius: 4px; background: ${agent.role === 'Administrador' ? 'rgba(124, 58, 237, 0.1)' : 'rgba(59, 130, 246, 0.1)'}; color: ${agent.role === 'Administrador' ? '#7c3aed' : '#3b82f6'};">
              ${agent.role}
            </span>
          </td>
          <td style="padding: 8px; text-align: right; white-space: nowrap;">
            ${actionsHtml}
          </td>
        </tr>
      `;
    }).join('');

    let rightColumnHtml = '';
    if (!isAdmin) {
      rightColumnHtml = `
        <!-- Locked message for Agent role -->
        <div class="detail-card" style="background: #f9fafb; border: 2px dashed var(--border-color); padding: 24px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; height: fit-content; min-height: 250px;">
          <div style="font-size: 2.2rem; margin-bottom: 4px;">🔒</div>
          <h3 style="font-family: var(--font-title); font-size: 0.95rem; font-weight: 700; color: var(--color-text-primary); margin: 0;">Sección Propietario</h3>
          <p style="font-size: 0.76rem; color: var(--color-text-secondary); line-height: 1.5; margin: 0; max-width: 240px;">
            Solo el administrador propietario de la cuenta (dueño) puede invitar nuevos colaboradores o eliminar miembros del equipo.
          </p>
        </div>
      `;
    } else if (isLimitReached) {
      rightColumnHtml = `
        <!-- Invite Locked due to Limit -->
        <div class="detail-card" style="background: #fffbeb; border: 2px dashed #fde68a; padding: 24px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 14px; height: fit-content; min-height: 250px;">
          <div style="font-size: 2.2rem; margin-bottom: 4px;">🔒</div>
          <h3 style="font-family: var(--font-title); font-size: 0.95rem; font-weight: 700; color: #b45309; margin: 0;">Límite de Agentes Alcanzado</h3>
          <p style="font-size: 0.76rem; color: #78350f; line-height: 1.5; margin: 0; max-width: 240px;">
            Has alcanzado el límite de <strong>${agentLimit}</strong> agentes asignados a tu plan actual (Plan ${currentActivePlan}).
          </p>
          <button class="btn-primary" style="background: #fbbf24; border: none; color: #0a0a0a; font-weight: 600; padding: 8px 16px; font-size: 0.76rem; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; width: 100%; text-align: center;" onclick="switchProfileModalTab('plan')">
            📈 Expandir o Subir Plan
          </button>
        </div>
      `;
    } else {
      rightColumnHtml = `
        <!-- Invite Agent Form (Admin only) -->
        <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 14px; height: fit-content;">
          <h3 style="font-family: var(--font-title); font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); margin: 0; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">✉️ Invitar Colaborador</h3>
          
          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Nombre Completo</label>
            <input type="text" id="invite-agent-name" class="form-input" placeholder="Ej. Roberto Gómez" style="padding: 8px 12px; background: #ffffff;">
          </div>
          
          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Correo Electrónico</label>
            <input type="email" id="invite-agent-email" class="form-input" placeholder="vendedor@empresa.com" style="padding: 8px 12px; background: #ffffff;">
          </div>
          
          <button class="btn-primary" style="background: var(--color-accent); color: #0a0a0a; font-weight: 600; padding: 10px 16px; border-radius: 8px; border: none; cursor: pointer; display: flex; justify-content: center; width: 100%; text-align: center; margin-top: 6px;" onclick="submitAgentInvitation()">
            ✉️ Enviar Invitación
          </button>
        </div>
      `;
    }

    container.innerHTML = `
      <style>
        @media (max-width: 768px) {
          #team-columns-layout {
            grid-template-columns: 1fr !important;
          }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      </style>
      <div style="display: flex; flex-direction: column; gap: 20px; padding: 10px 0;">
        
        <div style="display: grid; grid-template-columns: 1.25fr 1fr; gap: 20px;" id="team-columns-layout">
          
          <!-- Table of active agents -->
          <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 14px;">
            <h3 style="font-family: var(--font-title); font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); margin: 0; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">👥 Equipo Activo (Límite: ${teamAgents.length}/${agentLimit})</h3>
            
            <div style="overflow-x: auto; width: 100%;">
              <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; text-align: left;">
                <thead>
                  <tr style="border-bottom: 2px solid var(--border-color); color: var(--color-text-muted);">
                    <th style="padding: 8px;">Nombre</th>
                    <th style="padding: 8px;">Correo</th>
                    <th style="padding: 8px;">Rol</th>
                    <th style="padding: 8px; text-align: right;">Estado</th>
                  </tr>
                </thead>
                <tbody id="team-agents-table-body">
                  ${agentRows}
                </tbody>
              </table>
            </div>
          </div>
          
          ${rightColumnHtml}
          
        </div>
        
      </div>
    `;
  }
  
  // Re-populate switchers on every tab render inside modal to keep it synced
  populateBusinessSwitchers();
}

function updateProfileDemoMessage() {
  const context = document.getElementById('demo-prompt-context').value;
  const output = document.getElementById('profile-demo-output');
  if (!output) return;
  if (!context.trim()) {
    output.innerText = "Empieza a escribir arriba para ver la respuesta sugerida...";
    output.style.fontStyle = "italic";
    return;
  }
  
  output.style.fontStyle = "normal";
  const name = "Rosa";
  const bizName = businessProfile.name;
  const tone = businessProfile.tone;
  const promo = businessProfile.promotion ? ` (${businessProfile.promotion})` : "";
  
  let msg = "";
  if (tone === "Amigable") {
    msg = `¡Hola ${name}! 😊 Te saludo de ${bizName}. Vi que nos consultaste sobre "${context}". Con gusto te ayudo. Te comento que hoy tenemos activo: ${promo || 'nuestra promo de catálogo'}. ¡Me avisas si te parece bien!`;
  } else if (tone === "Formal") {
    msg = `Estimada ${name}, le saludamos de ${bizName}. Respecto a su solicitud sobre "${context}", le adjunto la información requerida. Adicionalmente, le informamos sobre nuestra oferta del día: ${promo || 'tarifas preferenciales'}. Quedamos atentos a sus comentarios.`;
  } else if (tone === "Directo") {
    msg = `Hola ${name}, de ${bizName}. Para avanzar con "${context}", confírmame cuántas unidades necesitas. Recuerda que contamos con: ${promo || 'envíos a nivel nacional'}. Quedo atento para cerrar.`;
  } else { // Divertido
    msg = `¡Hola ${name}! ⚡ Aquí en ${bizName} estamos listos para arrancar con "${context}". ¡Es una súper elección! 🚀 Además, te llevas: ${promo || 'sorpresas en tu primer pedido'}. ¡Escríbeme para activar tu orden de una!`;
  }
  
  output.innerText = msg;
}

function renderEstadisticasTab() {
  const container = document.getElementById('tab-estadisticas');
  if (!container) return;

  if (currentActivePlan === 'Gratuito') {
    container.innerHTML = `
      <div style="position: relative; width: 100%; min-height: 500px; padding: 20px; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 16px;">
        <!-- Blurred background simulation of statistics -->
        <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; filter: blur(8px) grayscale(40%); opacity: 0.15; display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; padding: 20px; pointer-events: none; user-select: none;">
          ${Array(4).fill(0).map(() => `
            <div style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; height: 120px; display: flex; flex-direction: column; gap: 8px;">
              <div style="width: 40%; height: 12px; background: #e5e7eb; border-radius: 4px;"></div>
              <div style="width: 80%; height: 32px; background: #e5e7eb; border-radius: 6px;"></div>
            </div>
          `).join('')}
          <div style="grid-column: span 4; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; height: 300px; padding: 20px;">
            <div style="width: 20%; height: 16px; background: #e5e7eb; border-radius: 4px; margin-bottom: 20px;"></div>
            <div style="width: 100%; height: 200px; background: #f3f4f6; border-radius: 8px;"></div>
          </div>
        </div>

        <!-- Lock Message Panel -->
        <div style="position: relative; z-index: 10; background: rgba(255, 255, 255, 0.95); border: 1px solid var(--border-color); padding: 40px 30px; border-radius: 20px; box-shadow: var(--shadow-lg); text-align: center; max-width: 420px; display: flex; flex-direction: column; align-items: center; gap: 16px;">
          <div style="font-size: 3rem;">📊🔒</div>
          <h3 style="font-family: var(--font-title); font-size: 1.25rem; font-weight: 700; color: #111827; margin: 0;">Panel de Estadísticas Bloqueado</h3>
          <p style="font-family: var(--font-body); font-size: 0.85rem; color: #4b5563; line-height: 1.5; margin: 0;">
            El análisis de conversión, métricas de seguimiento y consistencia de cierres solo están disponibles en planes de pago.
          </p>
          <button class="btn-primary" style="margin-top: 8px; width: 100%; background: var(--color-accent); color: #0a0a0a; font-weight: 600; padding: 12px 24px; border-radius: 999px; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 0.88rem;" onclick="openProfileConfigModal(); switchProfileModalTab('plan');">
            🚀 Subir a Plan Panal o Superior
          </button>
        </div>
      </div>
    `;
    return;
  }

  // 1. Calculate Period Boundaries based on currentStatsPeriod
  const periodDaysMap = {
    'semana': 7,
    'mes': 30,
    '3meses': 90,
    '6meses': 180,
    '1ano': 365
  };
  const days = periodDaysMap[currentStatsPeriod] || 30;
  const startDate = new Date(TODAY);
  startDate.setDate(startDate.getDate() - days);

  // Helper date checker
  function isDateInPeriod(dateStr) {
    if (!dateStr) return false;
    const d = new Date(dateStr + "T00:00:00");
    return d >= startDate && d <= TODAY;
  }

  // 2. Filter data
  const activeContacts = contacts.filter(c => !c.archived && (c.businessId || 1) === currentBusinessId && new Date(c.createdAt + "T00:00:00") <= TODAY);
  const activeClients = activeContacts.filter(c => c.type === 'Cliente').length;
  const activeProspects = activeContacts.filter(c => c.type === 'Prospecto').length;

  // Nuevos contactos ingresados en el período
  const newContacts = contacts.filter(c => (c.businessId || 1) === currentBusinessId && isDateInPeriod(c.createdAt));
  const newContactsCount = newContacts.length;

  // Cierres ganados (conversionDate in period)
  const wins = contacts.filter(c => (c.businessId || 1) === currentBusinessId && c.type === 'Cliente' && c.conversionDate && isDateInPeriod(c.conversionDate));
  const winsCount = wins.length;

  // Cierres perdidos (archived = true, lostDate in period)
  const losses = contacts.filter(c => (c.businessId || 1) === currentBusinessId && c.archived && c.lostDate && isDateInPeriod(c.lostDate));
  const lossesCount = losses.length;

  // 3. Consistency Metrics (Seguimiento)
  const onTimeContacts = activeContacts.filter(c => calculateUrgency(c.suggestedDate) !== 'Rojo').length;
  const overdueContacts = activeContacts.filter(c => calculateUrgency(c.suggestedDate) === 'Rojo').length;
  const totalTouches = onTimeContacts + overdueContacts;
  const onTimePercentage = totalTouches > 0 ? Math.round((onTimeContacts / totalTouches) * 100) : 0;

  // Average days between contacts
  const clientsWithCycle = activeContacts.filter(c => c.type === 'Cliente' && c.cycleDays !== null);
  const avgClientDays = clientsWithCycle.length > 0 
    ? Math.round(clientsWithCycle.reduce((acc, curr) => acc + curr.cycleDays, 0) / clientsWithCycle.length) 
    : 28;

  function parseHistoryDate(dateStr) {
    if (!dateStr) return null;
    const parts = dateStr.trim().split(' ');
    if (parts.length < 2) return null;
    const day = parseInt(parts[0]);
    const monthStr = parts[1].toUpperCase().replace(/\./g, '');
    const monthMap = {
      'ENE': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3, 'MAY': 4, 'JUN': 5,
      'JUL': 6, 'AGO': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11
    };
    const month = monthMap[monthStr];
    if (isNaN(day) || month === undefined) return null;
    return new Date(2026, month, day);
  }

  let totalDiff = 0;
  let countDiff = 0;
  activeContacts.forEach(c => {
    if (c.type === 'Prospecto' && c.history && c.history.length > 1) {
      for (let i = 0; i < c.history.length - 1; i++) {
        const d1 = parseHistoryDate(c.history[i].date);
        const d2 = parseHistoryDate(c.history[i+1].date);
        if (d1 && d2) {
          const diff = Math.abs(d1 - d2) / (1000 * 60 * 60 * 24);
          totalDiff += diff;
          countDiff++;
        }
      }
    }
  });
  const avgProspectDays = countDiff > 0 ? Math.round(totalDiff / countDiff) : 5;

  // No activity in last 15 / 30 days
  const inactive15 = activeContacts.filter(c => {
    if (!c.lastActivityDate) return true;
    const actDate = new Date(c.lastActivityDate + "T00:00:00");
    const diff = (TODAY - actDate) / (1000 * 60 * 60 * 24);
    return diff > 15;
  });
  const inactive30 = activeContacts.filter(c => {
    if (!c.lastActivityDate) return true;
    const actDate = new Date(c.lastActivityDate + "T00:00:00");
    const diff = (TODAY - actDate) / (1000 * 60 * 60 * 24);
    return diff > 30;
  });

  // 4. Conversion Metrics
  const totalClosed = winsCount + lossesCount;
  const closeRate = totalClosed > 0 ? Math.round((winsCount / totalClosed) * 100) : 0;

  const conversionTimes = wins.map(c => {
    const start = new Date(c.createdAt + "T00:00:00");
    const end = new Date(c.conversionDate + "T00:00:00");
    return Math.max(0, Math.round((end - start) / (1000 * 60 * 60 * 24)));
  });
  const avgConversionTime = conversionTimes.length > 0 
    ? Math.round(conversionTimes.reduce((acc, curr) => acc + curr, 0) / conversionTimes.length) 
    : 18;

  // Loss Reason counts in period
  const lossReasons = { 'Precio': 0, 'No respondió': 0, 'Compró a otro': 0, 'Sin presupuesto': 0, 'Otro': 0 };
  losses.forEach(c => {
    const reason = c.lostReason || 'Otro';
    if (lossReasons[reason] !== undefined) lossReasons[reason]++;
    else lossReasons['Otro']++;
  });
  const rankedLossReasons = Object.entries(lossReasons).sort((a,b) => b[1] - a[1]);

  // Lead Sources counts in period
  const leadSources = { 'Instagram': 0, 'TikTok': 0, 'Facebook Ads': 0, 'Referido': 0, 'WhatsApp Directo': 0 };
  newContacts.forEach(c => {
    const src = c.leadSource || 'WhatsApp Directo';
    if (leadSources[src] !== undefined) leadSources[src]++;
    else leadSources['WhatsApp Directo']++;
  });

  // 5. Recurrent Client Metrics
  const activeClientsObj = activeContacts.filter(c => c.type === 'Cliente');
  const recurrentClientsWithRecompra = activeClientsObj.filter(c => c.recompraCount && c.recompraCount > 0).length;
  
  const clientsAtRisk = activeClientsObj.filter(c => {
    if (!c.lastActivityDate) return true;
    const actDate = new Date(c.lastActivityDate + "T00:00:00");
    return (TODAY - actDate) / (1000 * 60 * 60 * 24) > 30;
  }).length;
  
  const avgRepurchaseFrequency = avgClientDays;

  // Render HTML
  container.innerHTML = `
    <style>
      .stats-period-btn {
        background: transparent;
        border: none;
        color: var(--color-text-secondary);
        font-size: 0.8rem;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s;
        font-weight: 600;
      }
      .stats-period-btn.active {
        background: #ffffff;
        color: var(--color-text-primary);
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      .stats-period-btn:hover:not(.active) {
        background: rgba(0,0,0,0.05);
        color: var(--color-text-primary);
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 16px;
        margin-bottom: 20px;
      }
      .stats-card {
        background: #ffffff;
        border: 1px solid var(--border-color);
        padding: 16px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        position: relative;
        overflow: hidden;
      }
      .stats-card::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: transparent;
      }
      .stats-card.active-contacts::after { background: var(--color-accent); }
      .stats-card.new-contacts::after { background: var(--color-waiting); }
      .stats-card.won-deals::after { background: var(--color-ontrack); }
      .stats-card.lost-deals::after { background: var(--color-urgent); }

      .stats-section-title {
        font-family: var(--font-title);
        font-size: 1.05rem;
        font-weight: 700;
        color: var(--color-text-primary);
        margin: 0;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--border-color);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .stats-progress-label {
        display: flex;
        justify-content: space-between;
        font-size: 0.78rem;
        font-weight: 500;
        color: var(--color-text-primary);
      }
      .stats-progress-bar {
        width: 100%;
        height: 8px;
        background: #f3f4f6;
        border-radius: 999px;
        overflow: hidden;
      }
      .stats-progress-fill {
        height: 100%;
        border-radius: 999px;
        transition: width 0.3s ease;
      }
      .metric-circle-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }
      .metric-subinfo {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 0.78rem;
        color: var(--color-text-secondary);
      }
    </style>

    <div class="period-selector-row" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:16px;">
      <div>
        <h1 style="font-size: 1.5rem; font-weight: 700; color: var(--color-text-primary); margin-bottom: 4px;">Métricas y Rendimiento</h1>
        <p style="font-size: 0.9rem; color: var(--color-text-secondary); margin: 0;">
          Estadísticas operativas de tu embudo de ventas, canales de origen y nivel de actividad.
        </p>
      </div>
      <div style="display:flex; align-items:center; gap:4px; background:#f3f4f6; padding:4px; border-radius:10px; border:1px solid var(--border-color);">
        <button class="stats-period-btn ${currentStatsPeriod === 'semana' ? 'active' : ''}" onclick="changeStatsPeriod('semana')">Esta semana</button>
        <button class="stats-period-btn ${currentStatsPeriod === 'mes' ? 'active' : ''}" onclick="changeStatsPeriod('mes')">Este mes</button>
        <button class="stats-period-btn ${currentStatsPeriod === '3meses' ? 'active' : ''}" onclick="changeStatsPeriod('3meses')">Últimos 3 meses</button>
        <button class="stats-period-btn ${currentStatsPeriod === '6meses' ? 'active' : ''}" onclick="changeStatsPeriod('6meses')">6 meses</button>
        <button class="stats-period-btn ${currentStatsPeriod === '1ano' ? 'active' : ''}" onclick="changeStatsPeriod('1ano')">1 año</button>
      </div>
    </div>

    <!-- 1. Key Numbers -->
    <div class="stats-grid">
      <div class="stats-card active-contacts">
        <span style="font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 500;">Contactos Activos</span>
        <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-text-primary); font-family: var(--font-title);">${activeContacts.length}</span>
        <span style="font-size: 0.72rem; color: var(--color-text-secondary); display:flex; gap:6px;">
          <strong>${activeClients}</strong> Clientes • <strong>${activeProspects}</strong> Leads
        </span>
      </div>

      <div class="stats-card new-contacts">
        <span style="font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 500;">Nuevos Contactos</span>
        <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-waiting); font-family: var(--font-title);">+${newContactsCount}</span>
        <span style="font-size: 0.72rem; color: var(--color-text-muted);">Registrados en el período</span>
      </div>

      <div class="stats-card won-deals">
        <span style="font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 500;">Cierres Ganados</span>
        <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-ontrack); font-family: var(--font-title);">${winsCount}</span>
        <span style="font-size: 0.72rem; color: var(--color-text-muted);">Tratos cerrados con éxito</span>
      </div>

      <div class="stats-card lost-deals">
        <span style="font-size: 0.8rem; color: var(--color-text-secondary); font-weight: 500;">Cierres Perdidos</span>
        <span style="font-size: 1.8rem; font-weight: 800; color: var(--color-urgent); font-family: var(--font-title);">${lossesCount}</span>
        <span style="font-size: 0.72rem; color: var(--color-text-muted);">Archivados sin acuerdo</span>
      </div>
    </div>

    <!-- Insights Layout Grid -->
    <div style="display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; margin-bottom: 20px;" id="stats-insights-layout-1">
      
      <!-- 2. Seguimiento & Constancia -->
      <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
        <h3 class="stats-section-title">🏃‍♂️ Seguimiento y Constancia</h3>
        
        <div class="metric-circle-container">
          <div style="position: relative; width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(var(--color-ontrack) ${onTimePercentage}%, #f3f4f6 ${onTimePercentage}%); display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 800; color: var(--color-text-primary);">${onTimePercentage}%</div>
          </div>
          <div class="metric-subinfo" style="flex-grow: 1;">
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--color-text-primary);">Toques a Tiempo</div>
            <div><strong>${onTimeContacts}</strong> contactos al día de seguimiento.</div>
            <div style="color:var(--color-urgent); font-weight: 600;">${overdueContacts} contactos con toque vencido.</div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; flex-direction: column; gap: 10px;">
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary);">Frecuencia de Contacto (Promedio)</div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div style="background: #f9fafb; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); text-align: center;">
              <div style="font-size: 0.72rem; color: var(--color-text-muted);">Prospectos</div>
              <div style="font-size: 1.15rem; font-weight: 700; color: var(--color-text-primary); margin-top: 2px;">Cada ${avgProspectDays} días</div>
            </div>
            <div style="background: #f9fafb; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color); text-align: center;">
              <div style="font-size: 0.72rem; color: var(--color-text-muted);">Clientes Recurrentes</div>
              <div style="font-size: 1.15rem; font-weight: 700; color: var(--color-text-primary); margin-top: 2px;">Cada ${avgClientDays} días</div>
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; flex-direction: column; gap: 8px;">
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary);">⚠️ Alertas de Abandono (Sin Actividad)</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; font-size: 0.76rem; padding: 6px 10px; background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 6px; color: #b45309;">
              <span>Sin ninguna interacción en 15+ días:</span>
              <strong>${inactive15.length} contactos</strong>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.76rem; padding: 6px 10px; background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 6px; color: #b91c1c;">
              <span>Sin ninguna interacción en 30+ días:</span>
              <strong>${inactive30.length} contactos</strong>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. Conversión & Ventas -->
      <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
        <h3 class="stats-section-title">🏆 Conversión y Ventas</h3>
        
        <div class="metric-circle-container">
          <div style="position: relative; width: 80px; height: 80px; border-radius: 50%; background: conic-gradient(#7c3aed ${closeRate}%, #f3f4f6 ${closeRate}%); display: flex; align-items: center; justify-content: center; box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);">
            <div style="width: 64px; height: 64px; border-radius: 50%; background: #ffffff; display: flex; align-items: center; justify-content: center; font-size: 0.95rem; font-weight: 800; color: var(--color-text-primary);">${closeRate}%</div>
          </div>
          <div class="metric-subinfo" style="flex-grow: 1;">
            <div style="font-size: 0.9rem; font-weight: 700; color: var(--color-text-primary);">Tasa de Cierre</div>
            <div><strong>${winsCount}</strong> tratos ganados de <strong>${totalClosed}</strong> resueltos en el período.</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 4px;">
              ⏱ Tiempo promedio de cierre: <strong>${avgConversionTime} días</strong> desde el 1er contacto.
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid var(--border-color); padding-top: 12px; display: flex; flex-direction: column; gap: 12px;">
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-secondary);">Ranking de Motivos de Pérdida</div>
          
          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${rankedLossReasons.map(([reason, count]) => {
              const pct = lossesCount > 0 ? Math.round((count / lossesCount) * 100) : 0;
              let barColor = "#ef4444";
              if (reason === 'No respondió') barColor = "#f59e0b";
              if (reason === 'Otro') barColor = "#9ca3af";

              return `
                <div style="display: flex; flex-direction: column; gap: 3px;">
                  <div class="stats-progress-label">
                    <span>${reason === 'Precio' ? '💰 Precio' : 
                           reason === 'No respondió' ? '🔇 No respondió' :
                           reason === 'Compró a otro' ? '🤝 Compró a otro' :
                           reason === 'Sin presupuesto' ? '❌ Sin presupuesto' : '✏️ Otro'}</span>
                    <span style="font-weight: 600;">${count} (${pct}%)</span>
                  </div>
                  <div class="stats-progress-bar">
                    <div class="stats-progress-fill" style="width: ${pct}%; background: ${barColor};"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <!-- Second Level Layout Grid -->
    <div style="display: grid; grid-template-columns: 1.15fr 1fr; gap: 20px;" id="stats-insights-layout-2">
      
      <!-- 4. Clientes Recurrentes -->
      <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
        <h3 class="stats-section-title">🔄 Clientes Recurrentes y Retención</h3>
        
        <div style="display: grid; grid-template-columns: 1.2fr 1fr; gap: 16px;">
          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); display:flex; flex-direction:column; gap:2px;">
              <span style="font-size: 0.72rem; color: var(--color-text-secondary); font-weight:500;">Clientes con recompra activa:</span>
              <span style="font-size: 1.3rem; font-weight:800; color:var(--color-text-primary); margin-top:2px;">
                ${recurrentClientsWithRecompra} <span style="font-size: 0.78rem; font-weight:500; color:var(--color-text-muted);">de ${activeClients} clientes (${activeClients > 0 ? Math.round((recurrentClientsWithRecompra / activeClients) * 100) : 0}%)</span>
              </span>
            </div>
            
            <div style="background: #f9fafb; padding: 12px; border-radius: 8px; border: 1px solid var(--border-color); display:flex; flex-direction:column; gap:2px;">
              <span style="font-size: 0.72rem; color: var(--color-text-secondary); font-weight:500;">Frecuencia promedio de recompra:</span>
              <span style="font-size: 1.3rem; font-weight:800; color:var(--color-text-primary); margin-top:2px;">
                ${avgRepurchaseFrequency} días
              </span>
            </div>
          </div>

          <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; background: rgba(239, 68, 68, 0.03); border: 1px dashed rgba(239,68,68,0.2); padding: 16px; border-radius: 10px; text-align:center; gap:8px;">
            <span style="font-size:1.6rem;">🚨</span>
            <div style="font-size:0.8rem; font-weight:700; color:var(--color-text-primary);">Clientes en Riesgo</div>
            <div style="font-size: 1.5rem; font-weight:800; color:var(--color-urgent);">${clientsAtRisk}</div>
            <div style="font-size:0.68rem; color:var(--color-text-muted); line-height:1.3;">Más de 30 días sin interacción ni compras registradas.</div>
          </div>
        </div>
      </div>

      <!-- 5. Origen de nuevos leads -->
      <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
        <h3 class="stats-section-title">📣 Origen de nuevos leads en el período</h3>
        
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${Object.entries(leadSources).map(([source, count]) => {
            const pct = newContactsCount > 0 ? Math.round((count / newContactsCount) * 100) : 0;
            let barColor = "#8b5cf6";
            if (source === 'TikTok') barColor = "#0a0a0a";
            if (source === 'Facebook Ads') barColor = "#3b82f6";
            if (source === 'Referido') barColor = "#f59e0b";
            if (source === 'WhatsApp Directo') barColor = "#10b981";

            return `
              <div style="display: flex; flex-direction: column; gap: 4px;">
                <div class="stats-progress-label">
                  <span>${source}</span>
                  <span style="color: var(--color-text-secondary); font-weight: 600;">${count} (${pct}%)</span>
                </div>
                <div class="stats-progress-bar">
                  <div class="stats-progress-fill" style="width: ${pct}%; background: ${barColor};"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>
  `;
}

