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
  
  const greetingName = currentSimulatedUserRole === 'Administrador' ? 'Javier' : 'Sofía';
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
                ${compactActions ? `
                <span class="btn-sug-ia-label">
                  <span>✨ Sugerencias</span>
                  <span>IA</span>
                </span>
                ` : `
                <span class="btn-sug-ia-icon" aria-hidden="true">✨</span>
                <span class="btn-sug-ia-label">
                  <span>Sugerencias</span>
                  <span>IA</span>
                </span>
                `}
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
  renderProfileTab();
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
    <div class="ia-suggestions-inline-box" style="margin-top: 10px; padding: 12px; background: #f9fafb; border-radius: 8px; border: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 8px; animation: slideDown 0.25s ease-out;">
      <div style="font-size: 0.75rem; color: #7c3aed; font-weight: 600; display: flex; align-items: center; gap: 6px;">
        <span>✨ Sugerencias de Mensajes IA</span>
      </div>
      <div style="font-size: 0.7rem; color: var(--color-text-muted); font-style: italic; margin-bottom: 2px;">
        Contexto: "${c.context || 'Sin contexto registrado (usando plantilla base)'}"
      </div>
      
      <div style="display: flex; flex-direction: column; gap: 8px;">
        <div class="ia-suggestion-card" style="padding: 8px; background: #ffffff; border-radius: 6px; border: 1px solid var(--border-color);">
          <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Cercano ${bizTone === 'Amigable' ? '<span style="color:#c2410c; margin-left:4px; font-weight:700;">★ recomendado</span>' : ''}</span>
          <p class="ia-text" id="sug-cercano-${id}" style="font-size: 0.78rem; margin: 4px 0; color: var(--color-text-primary);">${suggestions.Cercano}</p>
          <div class="ia-card-actions" style="margin-top: 4px; display: flex; gap: 6px;">
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionSendMessage(${id}, 'sug-cercano-${id}')">↗ WhatsApp</button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionCopyMessage(${id}, 'sug-cercano-${id}', this)">⧉ Copiar</button>
          </div>
        </div>
        
        <div class="ia-suggestion-card" style="padding: 8px; background: #ffffff; border-radius: 6px; border: 1px solid var(--border-color);">
          <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Directo ${bizTone === 'Directo' || bizTone === 'Formal' ? '<span style="color:#c2410c; margin-left:4px; font-weight:700;">★ recomendado</span>' : ''}</span>
          <p class="ia-text" id="sug-directo-${id}" style="font-size: 0.78rem; margin: 4px 0; color: var(--color-text-primary);">${suggestions.Directo}</p>
          <div class="ia-card-actions" style="margin-top: 4px; display: flex; gap: 6px;">
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionSendMessage(${id}, 'sug-directo-${id}')">↗ WhatsApp</button>
            <button class="btn-secondary" style="padding: 4px 8px; font-size: 0.72rem; background: #ffffff;" onclick="actionCopyMessage(${id}, 'sug-directo-${id}', this)">⧉ Copiar</button>
          </div>
        </div>
        
        <div class="ia-suggestion-card" style="padding: 8px; background: #ffffff; border-radius: 6px; border: 1px solid var(--border-color);">
          <span class="ia-tag" style="font-size: 0.65rem; color: #7c3aed; background: rgba(124, 58, 237, 0.1); padding: 2px 6px; border-radius: 4px; font-weight: 600; display: inline-block;">Con gancho ${bizTone === 'Divertido' ? '<span style="color:#c2410c; margin-left:4px; font-weight:700;">★ recomendado</span>' : ''}</span>
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

function renderProfileTab() {
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
    businesses.forEach(b => {
      const isActive = b.id === currentBusinessId;
      const isMain = b.id === 1;
      const showDelete = currentSimulatedUserRole === 'Administrador' && !isActive && !isMain;
      
      bizListHtml += `
        <div style="display: flex; align-items: center; justify-content: space-between; background: #ffffff; padding: 6px 10px; border-radius: 6px; border: 1px solid ${isActive ? 'var(--color-accent)' : 'var(--border-color)'};">
          <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; flex-grow: 1;">
            <span style="font-size: 0.9rem;">🏢</span>
            <span style="font-size: 0.78rem; font-weight: ${isActive ? '700' : '500'}; color: var(--color-text-primary); text-overflow: ellipsis; white-space: nowrap; overflow: hidden; max-width: 180px;">${b.name}</span>
            ${isActive ? '<span style="font-size: 0.6rem; background: #fef3c7; color: #b45309; padding: 1px 4px; border-radius: 4px; font-weight: 700; border: 1px solid #fde68a; margin-left: 4px;">Activo</span>' : ''}
          </div>
          <div style="display: flex; align-items: center; gap: 6px; flex-shrink: 0;">
            ${!isActive ? `<button onclick="switchBusinessWorkspace(${b.id})" style="background: #f3f4f6; border: none; font-size: 0.68rem; padding: 3px 6px; border-radius: 4px; color: var(--color-text-secondary); cursor: pointer; font-weight: 600;">Editar</button>` : ''}
            ${showDelete ? `<button onclick="deleteBusinessWorkspace(${b.id})" style="background: transparent; border: none; color: var(--color-text-muted); cursor: pointer; font-size: 0.9rem; padding: 2px;" title="Eliminar negocio y contactos">🗑️</button>` : ''}
          </div>
        </div>
      `;
    });

    container.innerHTML = `
      <style>
        @media (max-width: 768px) {
          #profile-columns-layout {
            grid-template-columns: 1fr !important;
          }
        }
      </style>
      
      <div style="max-width: 600px; margin: 0 auto;" id="profile-columns-layout">
        <!-- Configuration Form -->
        <div class="detail-card" style="background: #ffffff; border: 1px solid var(--border-color); padding: 20px; border-radius: 12px; display: flex; flex-direction: column; gap: 16px;">
          <h3 style="font-family: var(--font-title); font-size: 1.05rem; font-weight: 700; color: var(--color-text-primary); margin: 0; padding-bottom: 10px; border-bottom: 1px solid var(--border-color);">⚙️ Configuración de IA y Sistema</h3>
          
          <!-- Workspace Switcher & Limits -->
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 12px; background: rgba(255, 204, 6, 0.08); border: 1px solid rgba(255, 204, 6, 0.3); padding: 10px 14px; border-radius: 8px; margin-bottom: 4px;">
            <div style="display: flex; flex-direction: column; gap: 2px; flex-grow: 1;">
              <span style="font-size: 0.65rem; text-transform: uppercase; color: var(--color-text-muted); font-weight: 700; letter-spacing: 0.03em;">Negocio en Edición</span>
              <select id="modal-business-switcher" onchange="switchBusinessWorkspace(parseInt(this.value))" style="background: transparent; border: none; font-family: var(--font-title); font-size: 0.95rem; font-weight: 700; color: var(--color-text-primary); cursor: pointer; outline: none; padding: 0; width: 100%;">
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
          
          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Nombre del Negocio</label>
            <input type="text" id="profile-biz-name" class="form-input" value="${businessProfile.name}" placeholder="Ej. Polos Mayoristas Lima" style="padding: 8px 12px; background: #ffffff;">
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Rubro o Sector</label>
            <select id="profile-biz-sector" class="form-input form-select" style="padding: 8px 12px; background: #ffffff;">
              <option value="Venta de ropa al por mayor" ${businessProfile.sector === 'Venta de ropa al por mayor' ? 'selected' : ''}>Venta de ropa al por mayor</option>
              <option value="Suscripciones de streaming" ${businessProfile.sector === 'Suscripciones de streaming' ? 'selected' : ''}>Suscripciones de streaming</option>
              <option value="Servicios de consultoría" ${businessProfile.sector === 'Servicios de consultoría' ? 'selected' : ''}>Servicios de consultoría</option>
              <option value="Alimentos y Abarrotes" ${businessProfile.sector === 'Alimentos y Abarrotes' ? 'selected' : ''}>Alimentos y Abarrotes</option>
              <option value="Otro" ${!['Venta de ropa al por mayor', 'Suscripciones de streaming', 'Servicios de consultoría', 'Alimentos y Abarrotes'].includes(businessProfile.sector) ? 'selected' : ''}>Otro rubro / servicio</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Zona Horaria del Sistema</label>
            <select id="profile-biz-timezone" class="form-input form-select" style="padding: 8px 12px; background: #ffffff;">
              <option value="America/Lima" ${businessProfile.timezone === 'America/Lima' ? 'selected' : ''}>🇵🇪 Perú (America/Lima)</option>
              <option value="America/Bogota" ${businessProfile.timezone === 'America/Bogota' ? 'selected' : ''}>🇨🇴 Colombia (America/Bogota)</option>
              <option value="America/Mexico_City" ${businessProfile.timezone === 'America/Mexico_City' ? 'selected' : ''}>🇲🇽 México (America/Mexico_City)</option>
              <option value="America/Santiago" ${businessProfile.timezone === 'America/Santiago' ? 'selected' : ''}>🇨🇱 Chile (America/Santiago)</option>
              <option value="America/Buenos_Aires" ${businessProfile.timezone === 'America/Buenos_Aires' ? 'selected' : ''}>🇦🇷 Argentina (America/Buenos_Aires)</option>
              <option value="America/Caracas" ${businessProfile.timezone === 'America/Caracas' ? 'selected' : ''}>🇻🇪 Venezuela (America/Caracas)</option>
              <option value="Europe/Madrid" ${businessProfile.timezone === 'Europe/Madrid' ? 'selected' : ''}>🇪🇸 España (Europe/Madrid)</option>
              <option value="America/New_York" ${businessProfile.timezone === 'America/New_York' ? 'selected' : ''}>🇺🇸 USA Este (America/New_York)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label" style="font-weight: 600;">Descripción del Producto/Servicio Principal</label>
            <textarea id="profile-biz-desc" class="form-input" rows="3" placeholder="Describe qué vendes..." style="padding: 8px 12px; background: #ffffff; resize: vertical; font-family: var(--font-body);">${businessProfile.description}</textarea>
          </div>

          <div class="form-row" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 12px;">
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Tono de la Marca</label>
              <select id="profile-biz-tone" class="form-input form-select" style="padding: 8px 12px; background: #ffffff;">
                <option value="Amigable" ${businessProfile.tone === 'Amigable' ? 'selected' : ''}>Amigable 😊</option>
                <option value="Formal" ${businessProfile.tone === 'Formal' ? 'selected' : ''}>Formal 💼</option>
                <option value="Directo" ${businessProfile.tone === 'Directo' ? 'selected' : ''}>Directo 🎯</option>
                <option value="Divertido" ${businessProfile.tone === 'Divertido' ? 'selected' : ''}>Divertido ⚡</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label" style="font-weight: 600;">Oferta / Promoción Clave</label>
              <input type="text" id="profile-biz-promo" class="form-input" value="${businessProfile.promotion}" placeholder="Ej. Envío gratis a todo el Perú" style="padding: 8px 12px; background: #ffffff;">
            </div>
          </div>

          <button class="btn-primary" style="align-self: flex-start; margin-top: 10px; background: var(--color-accent); color: #0a0a0a; font-weight: 600; padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;" onclick="saveBusinessProfile()">
            💾 Guardar Configuración
          </button>
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
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-primary); margin: 4px 0;">S/. 69 <span style="font-size: 0.65rem; font-weight: 500; color: var(--color-text-muted);">/ mes</span></div>
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
                <div style="text-align: center; margin-top: 4px;"><span style="font-size: 0.6rem; color: #3b82f6; cursor: pointer; text-decoration: underline;" onclick="switchSimulatedPlan('Néctar')">⚡ Simular Activación</span></div>
              </div>
            `}
          </div>
          
          <!-- Plan Panal (RECOMENDADO/ACTIVO) -->
          <div class="pricing-card ${currentActivePlan === 'Panal' ? 'active' : ''}">
            ${currentActivePlan === 'Panal' ? '<span style="position: absolute; top: -10px; right: 12px; background: #fbbf24; color: #0a0a0a; font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.02em; z-index: 10;">✓ Activo</span>' : ''}
            <div style="display: flex; flex-direction: column; gap: 4px; height: 100%;">
              <h4 style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 700; color: ${currentActivePlan === 'Panal' ? '#b45309' : 'var(--color-text-primary)'}; margin: 0; display: flex; align-items: center; gap: 4px;">Plan Panal 🍯</h4>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-primary); margin: 4px 0;">S/. 119 <span style="font-size: 0.65rem; font-weight: 500; color: var(--color-text-muted);">/ mes</span></div>
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
                <div style="text-align: center; margin-top: 4px;"><span style="font-size: 0.6rem; color: #3b82f6; cursor: pointer; text-decoration: underline;" onclick="switchSimulatedPlan('Panal')">⚡ Simular Activación</span></div>
              </div>
            `}
          </div>
          
          <!-- Plan Colmena -->
          <div class="pricing-card ${currentActivePlan === 'Colmena' ? 'active' : ''}">
            ${currentActivePlan === 'Colmena' ? '<span style="position: absolute; top: -10px; right: 12px; background: #fbbf24; color: #0a0a0a; font-size: 0.6rem; font-weight: 800; padding: 2px 8px; border-radius: 999px; text-transform: uppercase; letter-spacing: 0.02em; z-index: 10;">✓ Activo</span>' : ''}
            <div style="display: flex; flex-direction: column; gap: 4px; height: 100%;">
              <h4 style="font-family: var(--font-title); font-size: 0.9rem; font-weight: 700; color: ${currentActivePlan === 'Colmena' ? '#b45309' : 'var(--color-text-primary)'}; margin: 0; display: flex; align-items: center; gap: 4px;">Plan Colmena 🐝</h4>
              <div style="font-size: 1.15rem; font-weight: 800; color: var(--color-text-primary); margin: 4px 0;">S/. 199 <span style="font-size: 0.65rem; font-weight: 500; color: var(--color-text-muted);">/ mes</span></div>
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
                <div style="text-align: center; margin-top: 4px;"><span style="font-size: 0.6rem; color: #3b82f6; cursor: pointer; text-decoration: underline;" onclick="switchSimulatedPlan('Colmena')">⚡ Simular Activación</span></div>
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
                <div style="text-align: center; margin-top: 4px;"><span style="font-size: 0.6rem; color: #3b82f6; cursor: pointer; text-decoration: underline;" onclick="switchSimulatedPlan('Apiario')">⚡ Simular Activación</span></div>
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
              <span style="color: #ef4444; text-decoration: underline; cursor: pointer; font-weight: 600; margin-left: 6px;" onclick="resetSimulatedAddons()">Restablecer a 0</span>
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
        if (agent.role === 'Administrador' && agent.name === 'Javier Reyes') {
          // Javier Reyes is the owner/main admin, can't delete self
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
        // Simulated user is Agent (Sofía Castro)
        if (agent.name === 'Sofía Castro') {
          // Sofia can delete/unsubscribe herself
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

