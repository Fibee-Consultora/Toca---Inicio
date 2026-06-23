// ==========================================================================
// INITIALIZATION
// ==========================================================================
document.addEventListener("DOMContentLoaded", () => {
  contacts.forEach(c => {
    if (!c.history) {
      if (c.id === 2) {
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

  const tz = businessProfile.timezone || 'America/Lima';
  const appDateEl = document.getElementById('app-date');
  if (appDateEl) {
    appDateEl.innerHTML = `${getFormattedDate(TODAY)} &bull; Zona Horaria: <strong>${tz}</strong>`;
  }

  // Set up login screen state
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) {
    loginScreen.style.display = isLoggedIn ? 'none' : 'flex';
  }

  renderAllTabs();
});

// ==========================================================================
// UNDO STATE (Esperando respuesta)
// ==========================================================================
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
  const tz = businessProfile.timezone || 'America/Lima';
  const timeStr = new Date().toLocaleTimeString('es-ES', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  contact.waitingSince = "hoy a las " + timeStr;
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
  const leadSource = document.getElementById('p-leadsource').value;

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
    lastContacted: "Recién creado",
    leadSource: leadSource
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
  const leadSource = document.getElementById('c-leadsource').value;
  
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
    cycleDays: cycleDays,
    leadSource: leadSource
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
    headerActionButton = `<button class="btn-secondary" style="font-size:0.8rem; padding:8px 14px; border-color:var(--border-color); color:var(--color-text-secondary); background:#ffffff;" onclick="showArchiveReasonModal(${c.id})">🗑️ Archivar</button>`;
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
          <button class="btn-secondary" style="color:var(--color-urgent); border-color:rgba(239, 68, 68, 0.15); padding:8px;" onclick="showArchiveReasonModal(${c.id})">🗑️ Archivar</button>
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
    closeContactDetailPanel();
    closeNewContactModal();
    closeProfileConfigModal();
    closeArchiveReasonModal();
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
    const tz = businessProfile.timezone || 'America/Lima';
    const formatter = new Intl.DateTimeFormat('es-ES', { timeZone: tz, day: 'numeric', month: 'short' });
    const parts = formatter.formatToParts(now);
    const day = parts.find(p => p.type === 'day').value;
    const monthStr = parts.find(p => p.type === 'month').value.replace(/\./g, '').toUpperCase();
    const dateStr = `${day} ${monthStr}.`;

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

// TAB NAVIGATION CONTROLLER
// ==========================================================================
function switchTab(tabId) {
  if (tabId === 'profile') {
    openProfileConfigModal();
    return;
  }
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
  } else if (tabId === 'estadisticas') {
    renderEstadisticasTab();
  } else if (tabId === 'profile') {
    renderProfileTab();
  }
}

// ==========================================================================
// VIEWPORT MANAGER (Desktop vs Mobile simulator toggling)
// ==========================================================================
function setViewport(mode) {
  currentViewport = mode;

  const btnDesktop = document.getElementById('btn-desktop');
  const btnMobile = document.getElementById('btn-mobile');

  btnDesktop.classList.remove('active');
  btnMobile.classList.remove('active');

  document.body.classList.remove('view-desktop', 'view-mobile');
  document.body.classList.add(mode === 'desktop' ? 'view-desktop' : 'view-mobile');

  if (mode === 'desktop') {
    btnDesktop.classList.add('active');
  } else {
    btnMobile.classList.add('active');
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
  showArchiveReasonModal(id);
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
  if (!container || !btn) return;

  const label = btn.querySelector('.btn-sug-ia-label');
  const isCompact = Boolean(btn.closest('.minimal-card-bottom--compact'));

  if (container.style.display === 'none') {
    container.style.display = 'block';
    container.innerHTML = generateIaSuggestionsHtml(id);
    if (label) {
      label.innerHTML = isOpen
        ? (isCompact ? '<span>✨ Ocultar</span><span>IA</span>' : '<span>Ocultar</span><span>IA</span>')
        : (isCompact ? '<span>✨ Sugerencias</span><span>IA</span>' : '<span>Sugerencias</span><span>IA</span>');
    } else {
      btn.innerHTML = `✨ Ocultar IA`;
    }
  } else {
    container.style.display = 'none';
    if (label) {
      label.innerHTML = isCompact
        ? '<span>✨ Sugerencias</span><span>IA</span>'
        : '<span>Sugerencias</span><span>IA</span>';
    } else {
      btn.innerHTML = `✨ Sugerencias IA`;
    }
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

function saveBusinessProfile() {
  const name = document.getElementById('profile-biz-name').value;
  const sector = document.getElementById('profile-biz-sector').value;
  const timezone = document.getElementById('profile-biz-timezone').value;
  const description = document.getElementById('profile-biz-desc').value;
  const tone = document.getElementById('profile-biz-tone').value;
  const promotion = document.getElementById('profile-biz-promo').value;

  businessProfile = {
    name,
    sector,
    timezone,
    description,
    tone,
    promotion
  };

  localStorage.setItem('toca_business_profile', JSON.stringify(businessProfile));
  showToast("Perfil de negocio e instrucciones de IA actualizadas.");
  
  const appDateEl = document.getElementById('app-date');
  if (appDateEl) {
    appDateEl.innerHTML = `${getFormattedDate(TODAY)} &bull; Zona Horaria: <strong>${timezone}</strong>`;
  }

  renderAllTabs();
}

function simulateGoogleLogin() {
  const loginBtn = document.querySelector('#login-screen button');
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.innerHTML = `
      <svg class="animate-spin" style="animation: spin 1s linear infinite; margin-right: 8px;" width="18" height="18" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" style="opacity:0.25;"></circle>
        <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="#000000"></path>
      </svg>
      Iniciando sesión...
    `;
  }
  
  setTimeout(() => {
    isLoggedIn = true;
    localStorage.setItem('toca_is_logged_in', 'true');
    const loginScreen = document.getElementById('login-screen');
    if (loginScreen) {
      loginScreen.style.display = 'none';
    }
    showToast("Sesión iniciada con Google correctamente.");
    renderAllTabs();
  }, 1200);
}

function logout() {
  isLoggedIn = false;
  localStorage.setItem('toca_is_logged_in', 'false');
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) {
    loginScreen.style.display = 'flex';
    const loginBtn = document.querySelector('#login-screen button');
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 18 18" style="margin-right: 8px;">
          <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.9c1.69-1.55 2.69-3.84 2.69-6.57z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.58-5.05-3.71H.95v2.3C2.43 15.98 5.48 18 9 18z" fill="#34A853"/>
          <path d="M3.95 10.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74V4.96H.95C.35 6.17 0 7.55 0 9s.35 2.83.95 4.04l3-2.3z" fill="#FBBC05"/>
          <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.47 1.03 11.43 0 9 0 5.48 0 2.43 2.02.95 4.96l3 2.3c.71-2.13 2.7-3.71 5.05-3.71z" fill="#EA4335"/>
        </svg>
        Iniciar sesión con Google
      `;
    }
  }
}

// ==========================================================================
// ARCHIVE MODAL LOGIC & STATISTICS PERIODS
// ==========================================================================
let contactIdToArchive = null;
let selectedLostReason = null;

function showArchiveReasonModal(id) {
  contactIdToArchive = id;
  selectedLostReason = null;
  
  const pills = document.querySelectorAll('#archive-reason-modal .type-card');
  pills.forEach(pill => pill.classList.remove('selected'));
  
  const confirmBtn = document.getElementById('confirm-archive-btn');
  if (confirmBtn) confirmBtn.disabled = true;
  
  const textDetails = document.getElementById('archive-reason-details');
  if (textDetails) textDetails.value = '';
  
  const label = document.getElementById('archive-details-label');
  if (label) label.innerText = "Detalles / Notas Adicionales:";
  
  const modal = document.getElementById('archive-reason-modal');
  if (modal) modal.classList.add('open');
}

function closeArchiveReasonModal() {
  const modal = document.getElementById('archive-reason-modal');
  if (modal) modal.classList.remove('open');
  contactIdToArchive = null;
  selectedLostReason = null;
}

function selectLostReason(reason) {
  selectedLostReason = reason;
  
  const pills = document.querySelectorAll('#archive-reason-modal .type-card');
  pills.forEach(pill => {
    pill.classList.remove('selected');
  });
  
  let targetId = '';
  if (reason === 'Precio') targetId = 'lost-reason-precio';
  else if (reason === 'No respondió') targetId = 'lost-reason-no-respondio';
  else if (reason === 'Compró a otro') targetId = 'lost-reason-compro-a-otro';
  else if (reason === 'Sin presupuesto') targetId = 'lost-reason-sin-presupuesto';
  else if (reason === 'Otro') targetId = 'lost-reason-otro';
  
  const selectedPill = document.getElementById(targetId);
  if (selectedPill) selectedPill.classList.add('selected');
  
  const confirmBtn = document.getElementById('confirm-archive-btn');
  if (confirmBtn) confirmBtn.disabled = false;
  
  const label = document.getElementById('archive-details-label');
  const detailsInput = document.getElementById('archive-reason-details');
  if (reason === 'Otro') {
    if (label) label.innerHTML = 'Detalles / Notas Adicionales: <span style="color:var(--color-urgent); font-weight:700;">* Obligatorio</span>';
    if (detailsInput) detailsInput.placeholder = "Por favor, escribe el motivo específico aquí...";
  } else {
    if (label) label.innerText = "Detalles / Notas Adicionales:";
    if (detailsInput) detailsInput.placeholder = "Escribe detalles adicionales...";
  }
}

function confirmArchiveWithReason() {
  if (!contactIdToArchive) return;
  if (!selectedLostReason) {
    showToast("Por favor, selecciona un motivo de pérdida.");
    return;
  }
  
  const detailsInput = document.getElementById('archive-reason-details');
  const details = detailsInput ? detailsInput.value.trim() : '';
  
  if (selectedLostReason === 'Otro' && !details) {
    showToast("Por favor, especifica el motivo en los detalles.");
    return;
  }
  
  const contact = contacts.find(c => c.id === contactIdToArchive);
  if (contact) {
    archivedBackup = { ...contact };
    
    contact.archived = true;
    contact.lostReason = selectedLostReason;
    contact.lostDate = TODAY_STR;
    contact.lastActivityDate = TODAY_STR;
    
    const months = ["ENE.", "FEB.", "MAR.", "ABR.", "MAY.", "JUN.", "JUL.", "AGO.", "SEP.", "OCT.", "NOV.", "DIC."];
    const now = new Date(TODAY);
    contact.archivedDate = `${now.getDate()} ${months[now.getMonth()]}`;
    
    const reasonText = selectedLostReason === 'Otro' ? `Perdido: ${details}` : `Perdido por: ${selectedLostReason}. ${details ? '(' + details + ')' : ''}`;
    if (!contact.history) contact.history = [];
    contact.history.unshift({
      date: `${now.getDate()} ${months[now.getMonth()]}`,
      text: `Contacto archivado. Motivo: ${reasonText}`
    });
    
    closeArchiveReasonModal();
    closeContactDetailPanel();
    
    showToastWithAction(
      `${contact.name} fue archivado con éxito.`,
      "Deshacer",
      () => {
        contact.archived = false;
        delete contact.lostReason;
        delete contact.lostDate;
        delete contact.archivedDate;
        if (contact.history && contact.history.length > 0) {
          contact.history.shift();
        }
        showToast("Contacto restaurado.");
        renderAllTabs();
      }
    );
    
    renderAllTabs();
  }
}

function changeStatsPeriod(period) {
  currentStatsPeriod = period;
  renderEstadisticasTab();
}

// Profile Modal State & Controls
let currentProfileModalTab = 'perfil';

function openProfileConfigModal() {
  currentProfileModalTab = 'perfil';
  renderProfileModalContent();
  const modal = document.getElementById('profile-config-modal');
  if (modal) modal.classList.add('open');
}

function closeProfileConfigModal() {
  const modal = document.getElementById('profile-config-modal');
  if (modal) modal.classList.remove('open');
}

function switchProfileModalTab(tabId) {
  currentProfileModalTab = tabId;
  renderProfileModalContent();
}


