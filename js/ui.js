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
      const compactActions = badgeData.text.length > 5;

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

  if (redGrid) container.appendChild(redGrid);
  if (yellowGrid) container.appendChild(yellowGrid);
  if (greenGrid) container.appendChild(greenGrid);
}

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

