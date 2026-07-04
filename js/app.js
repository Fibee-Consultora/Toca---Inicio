// ==========================================================================
// INITIALIZATION
// ==========================================================================
function persistContact(contact) {
  if (!dbReady || !contact?.id) return;
  window.TocaDB.updateContact(contact).catch((err) => {
    console.error(err);
    showToast('Error al guardar en la base de datos.');
  });
}

function shouldUseSeedContacts() {
  return !window.TocaDB?.isConfigured() && !currentAuthUser;
}

function bootstrapAuthenticatedUser(user) {
  const storageKey = `toca_user_${user.id}`;
  const meta = user.user_metadata || {};
  const displayName =
    meta.full_name || meta.name || user.email?.split('@')[0] || 'Usuario';

  if (!localStorage.getItem(storageKey)) {
    businesses = [
      {
        id: 1,
        name: 'Mi negocio',
        sector: 'Otro',
        description: '',
        tone: 'Amigable',
        promotion: '',
        timezone: 'America/Lima',
      },
    ];
    currentBusinessId = 1;
    businessProfile = businesses[0];
    teamAgents = [
      {
        name: displayName,
        email: user.email || '',
        role: 'Administrador',
        status: 'Activo',
      },
    ];
    localStorage.setItem(storageKey, 'true');
    localStorage.setItem(`toca_businesses_${user.id}`, JSON.stringify(businesses));
    localStorage.setItem(`toca_current_business_id_${user.id}`, String(currentBusinessId));
    return;
  }

  const savedBusinesses = localStorage.getItem(`toca_businesses_${user.id}`);
  if (savedBusinesses) {
    businesses = JSON.parse(savedBusinesses);
    currentBusinessId =
      parseInt(localStorage.getItem(`toca_current_business_id_${user.id}`), 10) || 1;
    businessProfile = businesses.find((b) => b.id === currentBusinessId) || businesses[0];
  }
}

function resetLoginButtonIfNeeded() {
  if (!isLoggedIn) setLoginButtonLoading(false);
}

window.addEventListener('pageshow', resetLoginButtonIfNeeded);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') resetLoginButtonIfNeeded();
});

document.addEventListener("DOMContentLoaded", async () => {
  try {
    if (window.TocaDB?.isConfigured()) {
      window.TocaDB.init();
      await initAuth();
      contacts = await window.TocaDB.loadContacts();
      dbReady = true;
    } else {
      contacts = [...SEED_CONTACTS];
      isLoggedIn = localStorage.getItem('toca_is_logged_in') === 'true';
      updateLoginScreen();
    }
  } catch (err) {
    console.error(err);
    contacts = shouldUseSeedContacts() ? [...SEED_CONTACTS] : [];
    if (!shouldUseSeedContacts()) {
      showToast('No se pudieron cargar los contactos.');
    } else {
      showToast('No se pudo conectar a Supabase. Usando datos locales.');
    }
    updateLoginScreen();
  }

  // Carga de sesión de cliente suplantado (impersonated) en inicialización
  if (impersonatedClientId) {
    const client = adminClients.find(c => c.id === impersonatedClientId);
    if (client) {
      currentBusinessId = 999;
      currentActivePlan = client.plan;
      businessProfile = {
        id: 999,
        name: client.businessName,
        sector: "Venta e Importación",
        description: "Operaciones y gestiones comerciales del cliente suplantado.",
        tone: "Profesional",
        promotion: "Envío express",
        timezone: "America/Lima"
      };
      contacts = [
        { id: 901, name: "Contacto Cliente Slim 1", company: "SlimCorp Tech", type: "Prospecto", context: "Espera catálogo de importaciones.", status: "Toque del día", fu1: TODAY_STR, whatsapp: "+51987654321", suggestedDate: TODAY_STR, lastContacted: "Hace 2 días", leadSource: "Instagram", createdAt: TODAY_STR, lastActivityDate: TODAY_STR, businessId: 999 },
        { id: 902, name: "Contacto Cliente Slim 2", company: "Gamarra Mayorista", type: "Cliente", context: "Recompra quincenal activa.", status: "Esperando respuesta", whatsapp: "+51912345678", suggestedDate: "2026-07-15", lastContacted: "Ayer", cycleDays: 14, leadSource: "Referido", createdAt: TODAY_STR, lastActivityDate: TODAY_STR, businessId: 999 }
      ];
    }
  }

  const tz = businessProfile.timezone || 'America/Lima';
  const appDateEl = document.getElementById('app-date');
  if (appDateEl) {
    appDateEl.innerHTML = `${getFormattedDate(TODAY)} &bull; Zona Horaria: <strong>${tz}</strong>`;
  }

  const archiveDetailsInput = document.getElementById('archive-reason-details');
  if (archiveDetailsInput) {
    archiveDetailsInput.addEventListener('input', () => {
      const confirmBtn = document.getElementById('confirm-archive-btn');
      if (confirmBtn && selectedLostReason === 'Otro') {
        confirmBtn.disabled = archiveDetailsInput.value.trim() === '';
      }
    });
  }

  populateBusinessSwitchers();
  updateProfileUI();
  renderAllTabs();
  updateLoginScreen();
});

function addSystemHistoryLog(contact, text) {
  const now = new Date(TODAY);
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const dateStr = `${dd}/${mm}/${yyyy}`;
  
  if (!contact.history) contact.history = [];
  contact.history.unshift({
    date: dateStr,
    text: text
  });
}

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
    suggestedDate: contact.suggestedDate,
    recontact: contact.recontact
  };

  contact.status = "Esperando respuesta";
  contact.recontact = false; // Ya se le volvió a escribir: se retira la marca de re-contacto
  const tz = businessProfile.timezone || 'America/Lima';
  const timeStr = new Date().toLocaleTimeString('es-ES', { timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase();
  contact.waitingSince = "hoy a las " + timeStr;
  contact.daysWaiting = 0;

  persistContact(contact);

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
      contact.recontact = undoOriginalData.recontact;

      persistContact(contact);
      
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

  const fmtDate = newDateStr.split('-').reverse().join('/');
  addSystemHistoryLog(contact, `Conversación aplazada. Próximo contacto agendado para el ${fmtDate}.`);

  persistContact(contact);

  showToast(`Se programó contacto para el ${fmtDate}. Movido a Toques del Día.`);
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

      addSystemHistoryLog(contact, `Venta registrada. Nueva recompra exitosa concretada (Ciclo: ${cycle} días).`);

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

      addSystemHistoryLog(contact, `Venta registrada. Nueva recompra exitosa concretada (Renovación fija: ${contact.suggestedDate.split('-').reverse().join('/')}).`);

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

    addSystemHistoryLog(contact, "Trato cerrado. Convertido de Prospecto a Cliente con ciclo de 28 días.");

    showToastWithAction(
      `¡Trato cerrado! ${contact.name} ya es cliente. Ciclo: 28 días.`,
      "Editar",
      () => openEditCycleDetail(contact.id)
    );
  }

  persistContact(contact);
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

    persistContact(contact);
    
    showToastWithAction(
      `${contact.name} fue archivado con éxito.`,
      "Deshacer",
      () => {
        contact.archived = false;
        delete contact.archivedDate;
        persistContact(contact);
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
    addSystemHistoryLog(contact, "Contacto restaurado a seguimiento activo.");
    persistContact(contact);
    showToast(`${contact.name} ha sido restaurado y reactivado.`);
    closeContactDetailPanel();
    renderAllTabs();
  }
}

async function deleteContact(id) {
  const contact = contacts.find(c => c.id === id);
  if (!contact) return;
  
  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${contact.name}? Esta acción no se puede deshacer.`)) {
    try {
      if (dbReady) await window.TocaDB.deleteContact(id);
      const index = contacts.findIndex(c => c.id === id);
      if (index !== -1) {
        contacts.splice(index, 1);
        showToast(`${contact.name} ha sido eliminado permanentemente.`);
        closeContactDetailPanel();
        renderAllTabs();
      }
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar el contacto.');
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
  
  // Clear context input values
  const pContext = document.getElementById('p-context');
  if (pContext) pContext.value = '';
  const cContext = document.getElementById('c-context');
  if (cContext) cContext.value = '';
  
  const suggestionDiv = document.getElementById('p-context-ia-suggestion');
  if (suggestionDiv) suggestionDiv.style.display = 'none';
  
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
  
  const contactLimit = PLAN_LIMITS[currentActivePlan].contacts + purchasedExtraPacks * 50;
  const activeContactsCount = contacts.filter(c => !c.archived).length;
  if (activeContactsCount >= contactLimit) {
    showToast(`🔒 Límite de contactos alcanzado (${activeContactsCount}/${contactLimit}). Sube de plan o compra adicionales en la pestaña Plan.`);
    return;
  }
  
  const name = document.getElementById('p-name').value;
  const whatsapp = document.getElementById('p-whatsapp').value;
  const company = document.getElementById('p-company').value;
  const context = document.getElementById('p-context').value;
  const fu1 = document.getElementById('p-fu1').value;
  const fu2 = document.getElementById('p-fu2').value;
  const fu3 = document.getElementById('p-fu3').value;
  const leadSource = document.getElementById('p-leadsource').value;

  // Validation
  if (!validateContextCoherence(context)) {
    showToast("⚠️ IA Rechazó Notas: El contexto no es coherente. Por favor describe la interacción con palabras reales.");
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalHtml = submitBtn.innerHTML;
  
  // Spinner & disable
  submitBtn.disabled = true;
  submitBtn.innerHTML = `${getSpinnerHtml('sm')}Validando notas con IA...`;

  setTimeout(async () => {
    const newProspect = {
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
      leadSource: leadSource,
      createdAt: TODAY_STR,
      lastActivityDate: TODAY_STR,
      businessId: currentBusinessId
    };

    try {
      if (dbReady) {
        const saved = await window.TocaDB.insertContact(newProspect);
        contacts.push({ ...saved, leadSource, createdAt: TODAY_STR, lastActivityDate: TODAY_STR, businessId: currentBusinessId });
      } else {
        const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
        contacts.push({ ...newProspect, id: newId, history: [] });
      }
    } catch (err) {
      console.error(err);
      showToast('Error al crear el prospecto.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
      return;
    }

    closeNewContactModal();
    document.getElementById('form-prospecto').reset();
    
    // Hide context IA suggestion label
    const suggestionDiv = document.getElementById('p-context-ia-suggestion');
    if (suggestionDiv) suggestionDiv.style.display = 'none';

    showToast(`Prospecto ${name} agregado con éxito.`);
    
    // Re-enable and reset button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
    
    renderAllTabs();
  }, 800);
}

function submitClienteForm(event) {
  event.preventDefault();

  const contactLimit = PLAN_LIMITS[currentActivePlan].contacts + purchasedExtraPacks * 50;
  const activeContactsCount = contacts.filter(c => !c.archived).length;
  if (activeContactsCount >= contactLimit) {
    showToast(`🔒 Límite de contactos alcanzado (${activeContactsCount}/${contactLimit}). Sube de plan o compra adicionales en la pestaña Plan.`);
    return;
  }

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

  // Validation
  if (!validateContextCoherence(context)) {
    showToast("⚠️ IA Rechazó Notas: El contexto no es coherente. Por favor describe la interacción con palabras reales.");
    return;
  }

  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalHtml = submitBtn.innerHTML;
  
  // Spinner & disable
  submitBtn.disabled = true;
  submitBtn.innerHTML = `${getSpinnerHtml('sm')}Validando notas con IA...`;

  setTimeout(async () => {
    const newClient = {
      name: name,
      company: company,
      type: "Cliente",
      context: context,
      status: "Toque del día",
      whatsapp: whatsapp,
      suggestedDate: suggestedDateStr,
      lastContacted: "Recién creado",
      cycleDays: cycleDays,
      leadSource: leadSource,
      createdAt: TODAY_STR,
      lastActivityDate: TODAY_STR,
      businessId: currentBusinessId
    };

    try {
      if (dbReady) {
        const saved = await window.TocaDB.insertContact(newClient);
        contacts.push({ ...saved, leadSource, createdAt: TODAY_STR, lastActivityDate: TODAY_STR, businessId: currentBusinessId });
      } else {
        const newId = contacts.length > 0 ? Math.max(...contacts.map(c => c.id)) + 1 : 1;
        contacts.push({ ...newClient, id: newId, history: [] });
      }
    } catch (err) {
      console.error(err);
      showToast('Error al crear el cliente.');
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalHtml;
      return;
    }

    closeNewContactModal();
    document.getElementById('form-cliente').reset();
    
    // Reset follow mode in Client form
    document.getElementById('c-follow-mode').value = 'recurrente';
    toggleClientFollowModeModal();

    const msg = cycleDays 
      ? `Cliente ${name} agregado con éxito. Ciclo: ${cycleDays} días.`
      : `Cliente ${name} agregado con éxito. Siguiente contacto: ${suggestedDateStr}.`;
    
    showToast(msg);
    
    // Re-enable and reset button
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalHtml;
    
    renderAllTabs();
  }, 800);
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
      <div style="display:flex; align-items:center; gap:8px;">
        ${c.archived ? '' : `<button class="btn-star-toggle${c.starred ? ' active' : ''}" id="detail-star-toggle" onclick="toggleContactStar(${c.id}, event)" title="${c.starred ? 'Quitar destaque' : 'Destacar contacto'}" style="font-size: 1.4rem; padding: 6px;">${c.starred ? '★' : '☆'}</button>`}
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
    const formatter = new Intl.DateTimeFormat('es-ES', { 
      timeZone: tz, 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const dateStr = formatter.format(now);

    if (!c.history) c.history = [];
    c.history.unshift({
      date: dateStr,
      text: text
    });

    c.context = text;

    if (dbReady) {
      window.TocaDB.addHistoryItem(id, { date: dateStr, text })
        .then(() => window.TocaDB.updateContact(c))
        .catch((err) => {
          console.error(err);
          showToast('Error al guardar el contexto.');
        });
    }

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
    const oldSuggestedDate = c.suggestedDate;
    const oldCycleDays = c.cycleDays;
    const oldFu1 = c.fu1;
    const oldFu2 = c.fu2;
    const oldFollowMode = c.type === 'Cliente' ? (oldCycleDays !== null ? 'recurrente' : 'fijo') : null;

    c.name = name;
    c.whatsapp = whatsapp;
    c.company = company;
    if (context !== null) c.context = context;

    // Suggested date from the main Seguimiento card input field
    const mainSuggestedInput = document.getElementById(`detail-suggested-${id}`);
    if (mainSuggestedInput && mainSuggestedInput.value) {
      c.suggestedDate = mainSuggestedInput.value;
    }

    let configLog = null;

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
            if (oldFollowMode !== 'recurrente' || oldCycleDays !== cycleVal) {
              configLog = `Seguimiento configurado: Ciclo de ${cycleVal} días.`;
            }
          }
        }
      } else {
        const dateInput = document.getElementById(`detail-date-${id}`);
        if (dateInput && dateInput.value) {
          c.cycleDays = null;
          c.suggestedDate = dateInput.value;
          if (oldFollowMode !== 'fijo' || oldSuggestedDate !== dateInput.value) {
            configLog = `Seguimiento configurado: Fecha Fija para el ${dateInput.value.split('-').reverse().join('/')}.`;
          }
        }
      }
    } else {
      const fu1Input = document.getElementById(`detail-fu1-${id}`);
      const fu2Input = document.getElementById(`detail-fu2-${id}`);

      if (fu1Input && fu1Input.value) c.fu1 = fu1Input.value;
      if (fu2Input && fu2Input.value) c.fu2 = fu2Input.value;

      if (oldFu1 !== c.fu1 || oldFu2 !== c.fu2) {
        const f1 = c.fu1 ? c.fu1.split('-').reverse().join('/') : 'Sin fecha';
        const f2 = c.fu2 ? c.fu2.split('-').reverse().join('/') : 'Sin fecha';
        configLog = `Fechas de seguimiento actualizadas: fu1 (${f1}), fu2 (${f2}).`;
      }
    }

    // Log manual reprogram of suggested date if changed manually and configLog wasn't set
    if (oldSuggestedDate !== c.suggestedDate && !configLog) {
      configLog = `Próximo contacto reprogramado manualmente para el ${c.suggestedDate.split('-').reverse().join('/')}.`;
    }

    if (configLog) {
      addSystemHistoryLog(c, configLog);
    }

    showToast(`Datos de ${c.name} actualizados correctamente.`);
    persistContact(c);
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
  } else if (tabId === 'admin') {
    renderAdminTab();
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
  
  const nextContact = new Date(TODAY);
  nextContact.setDate(nextContact.getDate() + 15);
  const year = nextContact.getFullYear();
  const month = String(nextContact.getMonth() + 1).padStart(2, '0');
  const day = String(nextContact.getDate()).padStart(2, '0');
  const nextContactStr = `${year}-${month}-${day}`;
  contact.suggestedDate = nextContactStr;
  
  if (contact.type === 'Cliente') {
    contact.cycleDays = 15;
    showToast(`Contacto ${contact.name} configurado con ciclo de recompra de 15 días para ofrecerle algo nuevo.`);
  } else {
    contact.fu1 = nextContactStr;
    showToast(`Contacto ${contact.name} reprogramado para dentro de 15 días para ofrecerle algo nuevo.`);
  }

  const fmtDate = nextContactStr.split('-').reverse().join('/');
  addSystemHistoryLog(contact, `Se inició un nuevo ciclo de oferta de 15 días (Próximo contacto: ${fmtDate}).`);

  persistContact(contact);
  
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

  // Find and update in businesses list
  const bizIdx = businesses.findIndex(b => b.id === currentBusinessId);
  if (bizIdx !== -1) {
    businesses[bizIdx] = {
      id: currentBusinessId,
      name,
      sector,
      timezone,
      description,
      tone,
      promotion
    };
    localStorage.setItem('toca_businesses', JSON.stringify(businesses));
  }

  businessProfile = businesses[bizIdx];
  localStorage.setItem('toca_business_profile', JSON.stringify(businessProfile));

  showToast(`🏢 Perfil de: "${name}" e instrucciones de IA actualizadas.`);

  // Update switcher dropdown options and values
  populateBusinessSwitchers();

  renderAllTabs();
}

function getSpinnerHtml(size = 'md') {
  const sizeClass = size === 'sm' ? 'ui-spinner--sm' : 'ui-spinner--md';
  const margin = size === 'sm' ? ' style="margin-right: 6px;"' : '';
  return `<span class="ui-spinner ${sizeClass}"${margin} aria-hidden="true"></span>`;
}

function getGoogleLoginButtonHtml() {
  return `
    <svg width="18" height="18" viewBox="0 0 18 18" style="margin-right: 8px;">
      <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84c-.21 1.12-.84 2.07-1.79 2.7v2.24h2.9c1.69-1.55 2.69-3.84 2.69-6.57z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.24c-.8.54-1.84.87-3.06.87-2.35 0-4.34-1.58-5.05-3.71H.95v2.3C2.43 15.98 5.48 18 9 18z" fill="#34A853"/>
      <path d="M3.95 10.74c-.18-.54-.28-1.12-.28-1.74s.1-1.2.28-1.74V4.96H.95C.35 6.17 0 7.55 0 9s.35 2.83.95 4.04l3-2.3z" fill="#FBBC05"/>
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.47 1.03 11.43 0 9 0 5.48 0 2.43 2.02.95 4.96l3 2.3c.71-2.13 2.7-3.71 5.05-3.71z" fill="#EA4335"/>
    </svg>
    Iniciar sesión con Google
  `;
}

function setLoginButtonLoading(loading) {
  const loginBtn = document.querySelector('#login-screen button');
  if (!loginBtn) return;
  loginBtn.disabled = loading;
  loginBtn.innerHTML = loading
    ? `${getSpinnerHtml('md')}Iniciando sesión...`
    : getGoogleLoginButtonHtml();
}

function updateLoginScreen() {
  const loginScreen = document.getElementById('login-screen');
  if (loginScreen) {
    loginScreen.style.display = isLoggedIn ? 'none' : 'flex';
  }
  if (!isLoggedIn) setLoginButtonLoading(false);
}

function applyAuthUser(user) {
  currentAuthUser = user || null;
  isLoggedIn = !!user;
  if (user) bootstrapAuthenticatedUser(user);
  updateAdminNavVisibility();
  updateLoginScreen();
  updateProfileUI();
  if (user) syncUserPlanFromProfile();
}

function updateAdminNavVisibility() {
  const show = isSuperAdmin();
  const sideWrap = document.getElementById('side-nav-admin-wrap');
  const mobNav = document.getElementById('mob-nav-admin');
  if (sideWrap) sideWrap.style.display = show ? '' : 'none';
  if (mobNav) mobNav.style.display = show ? 'flex' : 'none';
}

async function syncUserPlanFromProfile() {
  if (!currentAuthUser || !window.TocaDB?.isConfigured()) return;
  try {
    const profile = await window.TocaDB.loadMyProfile();
    if (profile?.plan && PLAN_LIMITS[profile.plan]) {
      currentActivePlan = profile.plan;
      localStorage.setItem('toca_current_active_plan', profile.plan);
      updateProfileUI();
    }
  } catch (err) {
    console.error(err);
  }
}

async function adminSetUserPlan(userId, plan) {
  if (!isSuperAdmin() || !PLAN_LIMITS[plan]) return;
  try {
    await window.TocaDB.updateUserPlan(userId, plan);
    const user = adminUsers.find((u) => u.id === userId);
    if (user) user.plan = plan;
    if (currentAuthUser?.id === userId) {
      currentActivePlan = plan;
      localStorage.setItem('toca_current_active_plan', plan);
      updateProfileUI();
      renderAllTabs();
    }
    showToast(`Plan ${plan} asignado correctamente.`);
  } catch (err) {
    console.error(err);
    showToast('No se pudo actualizar el plan.');
    renderAdminTab();
  }
}

async function initAuth() {
  if (!window.TocaDB?.isConfigured()) return;

  if (window.location.hash.includes('error=')) {
    window.history.replaceState(null, '', window.location.pathname + window.location.search);
    showToast('Inicio de sesión cancelado.');
  }

  const { data: { session } } = await window.TocaDB.getSession();
  applyAuthUser(session?.user ?? null);
  if (!session?.user) resetLoginButtonIfNeeded();

  let authReady = false;
  window.TocaDB.onAuthStateChange(async (event, session) => {
    const user = session?.user ?? null;
    const wasLoggedIn = isLoggedIn;

    if (user) {
      applyAuthUser(user);
      if (authReady && event === 'SIGNED_IN' && !wasLoggedIn) {
        showToast('Sesión iniciada con Google correctamente.');
      }
      if (dbReady) {
        try {
          contacts = await window.TocaDB.loadContacts();
          renderAllTabs();
        } catch (err) {
          console.error(err);
        }
      }
    } else if (event === 'SIGNED_OUT') {
      applyAuthUser(null);
    }
  });

  authReady = true;
}

async function loginWithGoogle() {
  if (!window.TocaDB?.isConfigured()) {
    showToast('Supabase no está configurado. Revisa las variables en Netlify.');
    return;
  }

  setLoginButtonLoading(true);
  try {
    const { error } = await window.TocaDB.signInWithGoogle();
    if (error) throw error;
  } catch (err) {
    console.error(err);
    setLoginButtonLoading(false);
    showToast('No se pudo iniciar sesión con Google.');
  }
}

function loginLocalSimulation() {
  isLoggedIn = true;
  localStorage.setItem('toca_is_logged_in', 'true');
  updateAdminNavVisibility();
  updateLoginScreen();
  updateProfileUI();
  renderAllTabs();
  showToast("Sesión iniciada en modo demostración local.");
}

async function logout() {
  if (window.TocaDB?.isConfigured()) {
    try {
      await window.TocaDB.signOut();
    } catch (err) {
      console.error(err);
    }
  }

  applyAuthUser(null);
  localStorage.removeItem('toca_is_logged_in');
  updateLoginScreen();
  setLoginButtonLoading(false);
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
  
  const key = normalizeString(reason);
  let targetId = '';
  if (key.includes('precio')) targetId = 'lost-reason-precio';
  else if (key.includes('respondio')) targetId = 'lost-reason-no-respondio';
  else if (key.includes('compro')) targetId = 'lost-reason-compro-a-otro';
  else if (key.includes('presupuesto')) targetId = 'lost-reason-sin-presupuesto';
  else if (key.includes('otro')) targetId = 'lost-reason-otro';
  
  const selectedPill = document.getElementById(targetId);
  if (selectedPill) selectedPill.classList.add('selected');
  
  const confirmBtn = document.getElementById('confirm-archive-btn');
  const detailsInput = document.getElementById('archive-reason-details');
  
  if (confirmBtn) {
    if (reason === 'Otro') {
      confirmBtn.disabled = !detailsInput || detailsInput.value.trim() === '';
    } else {
      confirmBtn.disabled = false;
    }
  }
  
  const label = document.getElementById('archive-details-label');
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
    
    const now = new Date(TODAY);
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;
    contact.archivedDate = dateStr;
    
    const reasonText = selectedLostReason === 'Otro' ? `Perdido: ${details}` : `Perdido por: ${selectedLostReason}. ${details ? '(' + details + ')' : ''}`;
    addSystemHistoryLog(contact, `Contacto archivado. Motivo: ${reasonText}`);
    
    closeArchiveReasonModal();
    closeContactDetailPanel();

    persistContact(contact);
    
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
        persistContact(contact);
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

// ==========================================================================
// MOCK IA FUNCTIONS & EVENT HANDLERS (Pedro suggestions)
// ==========================================================================

function playNotificationSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    gain1.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.15);
    
    osc1.start();
    osc1.stop(audioCtx.currentTime + 0.15);
    
    setTimeout(() => {
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain2.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + 0.25);
      
      osc2.start();
      osc2.stop(audioCtx.currentTime + 0.25);
    }, 100);
  } catch (e) {
    console.warn("Audio Context sound blocked or not supported:", e);
  }
}

function validateContextCoherence(text) {
  if (!text || text.trim().length < 12) return false;
  if (!text.trim().includes(' ')) return false;
  
  const lower = text.toLowerCase().trim();
  
  // Gibberish strings like "asdfasdfasdf", "123123123", "qwertyqwerty"
  if (/(asd|qwe|zxc|jkl|123){2,}/i.test(lower.replace(/\s+/g, ''))) return false;
  
  const words = lower.split(/\s+/);
  for (const word of words) {
    if (/([a-z0-9])\1{4,}/i.test(word)) return false; // repetitive characters (aaaaa)
    if (word.length > 20 && !word.includes('-')) return false; // nonsense long words
  }
  
  return true;
}

function extractSuggestedDateFromContext(text) {
  if (!text) return null;
  const lower = text.toLowerCase();
  
  // Look for date patterns like: "el 28", "el 28 de junio", "el 5 de julio", "el dia 2"
  const match = lower.match(/(?:el\s+dia\s+|el\s+|dia\s+|reunion\s+el\s+|llamar\s+el\s+|conversar\s+el\s+)(\d{1,2})(?:\s+de\s+([a-z]+))?/i);
  if (match) {
    const dayNum = parseInt(match[1]);
    if (dayNum >= 1 && dayNum <= 31) {
      let month = 5; // 0-indexed: June is 5
      let year = 2026;
      
      const monthName = match[2];
      if (monthName) {
        const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
        const idx = months.findIndex(m => m.startsWith(monthName.substring(0, 3)));
        if (idx !== -1) {
          month = idx;
        }
      } else {
        // If no month is specified, and the day is in the past relative to June 21, assume next month (July)
        if (dayNum < 21) {
          month = 6; // July
        }
      }
      
      const dateObj = new Date(year, month, dayNum);
      const y = dateObj.getFullYear();
      const m = String(dateObj.getMonth() + 1).padStart(2, '0');
      const d = String(dateObj.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }
  
  return null;
}

function handleContextInput(value) {
  const suggestionDiv = document.getElementById('p-context-ia-suggestion');
  if (!suggestionDiv) return;
  
  if (!value || value.trim().length === 0) {
    suggestionDiv.style.display = 'none';
    return;
  }
  
  let fu1Str = '';
  let fu2Str = '';
  let fu3Str = '';
  let isMentioned = false;
  
  const parsedDate = extractSuggestedDateFromContext(value);
  if (parsedDate) {
    fu1Str = parsedDate;
    isMentioned = true;
  } else {
    // Default sequence: today + 3 days, today + 7 days, today + 11 days
    const d1 = new Date(TODAY);
    d1.setDate(d1.getDate() + 3);
    fu1Str = d1.toISOString().split('T')[0];
  }
  
  const d2 = new Date(fu1Str + "T00:00:00");
  d2.setDate(d2.getDate() + 4);
  fu2Str = d2.toISOString().split('T')[0];
  
  const d3 = new Date(fu2Str + "T00:00:00");
  d3.setDate(d3.getDate() + 4);
  fu3Str = d3.toISOString().split('T')[0];
  
  // Update inputs
  const fu1Input = document.getElementById('p-fu1');
  const fu2Input = document.getElementById('p-fu2');
  const fu3Input = document.getElementById('p-fu3');
  
  if (fu1Input) fu1Input.value = fu1Str;
  if (fu2Input) fu2Input.value = fu2Str;
  if (fu3Input) fu3Input.value = fu3Str;
  
  // Format display dates
  const fmt1 = fu1Str.split('-').reverse().join('/');
  const fmt2 = fu2Str.split('-').reverse().join('/');
  const fmt3 = fu3Str.split('-').reverse().join('/');
  
  suggestionDiv.style.display = 'block';
  if (isMentioned) {
    suggestionDiv.innerHTML = `✨ IA sugiere fechas (mencionada): fu1 (${fmt1}), fu2 (${fmt2}), fu3 (${fmt3})`;
  } else {
    suggestionDiv.innerHTML = `✨ IA sugiere fechas (por defecto): fu1 (${fmt1}), fu2 (${fmt2}), fu3 (${fmt3})`;
  }
}

function triggerDay7RecontactDemo() {
  const elena = contacts.find(c => c.name === "Elena Patiño");
  if (!elena) {
    showToast("Elena Patiño no se encontró en la base de datos.");
    return;
  }
  
  // Phase 1: Move Elena to Esperando respuesta (simulate she was there)
  elena.status = "Esperando respuesta";
  elena.daysWaiting = 7;
  elena.waitingSince = "hace 7 días";
  
  showToast("Simulando Elena Patiño en 'Esperando respuesta' por 7 días...");
  renderAllTabs();
  
  // Phase 2: After 1.2s, trigger the recontact transition
  setTimeout(() => {
    elena.status = "Toque del día";
    elena.suggestedDate = TODAY_STR; // Make it due today (Red)
    elena.recontact = true; // Marca de re-contacto: 7 días sin respuesta
    
    addSystemHistoryLog(elena, "Devuelto a seguimiento: 7 días sin respuesta de WhatsApp.");
    
    playNotificationSound();
    
    showToastWithAction(
      `⚠️ Alerta IA: Elena Patiño devuelta a Toques del día (7 días sin respuesta).`,
      "Ver Ficha",
      () => openContactDetailPanel(elena.id)
    );
    
    renderAllTabs();
  }, 1200);
}

function toggleContactStar(id, event) {
  if (event) event.stopPropagation();
  const contact = contacts.find(c => c.id === id);
  if (contact) {
    contact.starred = !contact.starred;
    if (contact.starred) {
      showToast(`⭐ Contacto destacado: ${contact.name} es prioritario para hoy.`);
      addSystemHistoryLog(contact, "Añadido como contacto destacado (Prioridad manual).");
    } else {
      showToast(`☆ Contacto devuelto al orden estándar.`);
      addSystemHistoryLog(contact, "Destaque manual retirado.");
    }
    
    // Update detail panel star toggle button in the DOM if open for this contact
    const detailStarBtn = document.getElementById('detail-star-toggle');
    if (detailStarBtn && selectedContactId === id) {
      if (contact.starred) {
        detailStarBtn.classList.add('active');
        detailStarBtn.innerHTML = '★';
        detailStarBtn.title = 'Quitar destaque';
      } else {
        detailStarBtn.classList.remove('active');
        detailStarBtn.innerHTML = '☆';
        detailStarBtn.title = 'Destacar contacto';
      }
    }
    
    renderAllTabs();
  }
}

function submitAgentInvitation() {
  const nameInput = document.getElementById('invite-agent-name');
  const emailInput = document.getElementById('invite-agent-email');
  
  if (!nameInput || !emailInput) return;
  
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const role = "Agente";
  
  const agentLimit = PLAN_LIMITS[currentActivePlan].agents + purchasedExtraAgents;
  if (teamAgents.length >= agentLimit) {
    showToast(`🔒 Límite de agentes alcanzado (${teamAgents.length}/${agentLimit}). Sube de plan o compra adicionales en la pestaña Plan.`);
    return;
  }
  
  if (!name || !email) {
    showToast("Por favor, completa todos los campos para enviar la invitación.");
    return;
  }
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showToast("Por favor, ingresa un correo electrónico válido.");
    return;
  }
  
  // Check if already exists
  const exists = teamAgents.some(agent => agent.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    showToast("Este correo ya está registrado en el equipo.");
    return;
  }
  
  // Add to global state
  const newAgent = {
    name: name,
    email: email,
    role: role,
    status: "Pendiente"
  };
  
  teamAgents.push(newAgent);
  localStorage.setItem('toca_team_agents', JSON.stringify(teamAgents));
  
  showToast(`✉️ Invitación enviada a ${name} (${email})`);
  
  // Clear fields
  nameInput.value = "";
  emailInput.value = "";
  
  // Refresh modal tab content
  renderProfileModalContent();
}

function resendAgentInvitation(email) {
  const agent = teamAgents.find(a => a.email === email);
  if (agent) {
    showToast(`✉️ Invitación reenviada a ${agent.name} (${email})`);
  } else {
    showToast("No se encontró el agente especificado.");
  }
}

function togglePricingExpansion() {
  isPricingExpanded = !isPricingExpanded;
  renderProfileModalContent();
}

function adjustExtraAgents(amount) {
  const newVal = tempExtraAgents + amount;
  if (newVal >= 0 && newVal <= 2) {
    tempExtraAgents = newVal;
    renderProfileModalContent();
  }
}

function adjustExtraPacks(amount) {
  const newVal = tempExtraPacks + amount;
  if (newVal >= 0 && newVal <= 2) {
    tempExtraPacks = newVal;
    renderProfileModalContent();
  }
}

function submitPlanExpansion() {
  if (tempExtraAgents === 0 && tempExtraPacks === 0) return;
  
  const text = `Hola Fibee, quiero expandir mi plan en Toca, con +${tempExtraAgents} agentes extra y +${tempExtraPacks} packs de contacto`;
  window.open(`https://wa.me/51987654321?text=${encodeURIComponent(text)}`, '_blank');
  
  // Simulator prompt
  const extraAgents = tempExtraAgents;
  const extraPacks = tempExtraPacks;
  setTimeout(() => {
    if (confirm(`[SIMULADOR PROTOTIPO] ¿Deseas activar inmediatamente en el prototipo los adicionales solicitados (+${extraAgents} agente(s) y +${extraPacks} pack(s) de contactos)?`)) {
      purchasedExtraAgents += extraAgents;
      purchasedExtraPacks += extraPacks;
      localStorage.setItem('toca_extra_agents', purchasedExtraAgents);
      localStorage.setItem('toca_extra_packs', purchasedExtraPacks);
      
      tempExtraAgents = 0;
      tempExtraPacks = 0;
      isPricingExpanded = false;
      
      showToast("✅ Adicionales simulados y activados en el prototipo.");
      renderProfileModalContent();
      renderAllTabs();
      updateProfileUI();
    } else {
      tempExtraAgents = 0;
      tempExtraPacks = 0;
      isPricingExpanded = false;
      renderProfileModalContent();
    }
  }, 1000);
}

function resetSimulatedAddons() {
  if (confirm("¿Estás seguro de que deseas restablecer todos los adicionales simulados (agentes y packs extras) a 0?")) {
    purchasedExtraAgents = 0;
    purchasedExtraPacks = 0;
    localStorage.removeItem('toca_extra_agents');
    localStorage.removeItem('toca_extra_packs');
    
    showToast("🔄 Adicionales restablecidos a 0.");
    renderProfileModalContent();
    renderAllTabs();
    updateProfileUI();
  }
}

function updateProfileUI() {
  const nameEl = document.querySelector('.profile-name');
  const roleEl = document.getElementById('sidebar-profile-role');
  const avatarEl = document.querySelector('.profile-avatar');
  const mobileBtnEl = document.querySelector('.mobile-header-profile-btn');
  const selectRoleEl = document.getElementById('select-role-simulator');

  if (selectRoleEl) {
    selectRoleEl.value = currentSimulatedUserRole;
  }

  const floatingSelectEl = document.getElementById('floating-role-select');
  if (floatingSelectEl) {
    floatingSelectEl.value = currentSimulatedUserRole;
  }

  const planInfo = PLAN_LIMITS[currentActivePlan];
  const planName = planInfo ? planInfo.name : 'Plan Panal';

  if (currentAuthUser) {
    const meta = currentAuthUser.user_metadata || {};
    const displayName =
      meta.full_name ||
      meta.name ||
      currentAuthUser.email?.split('@')[0] ||
      'Usuario';
    const avatarUrl = meta.avatar_url || meta.picture;
    const initial = displayName.charAt(0).toUpperCase();

    if (nameEl) nameEl.textContent = displayName;
    if (roleEl) roleEl.textContent = planName;
    if (avatarEl) {
      if (avatarUrl) {
        avatarEl.innerHTML = `<img src="${avatarUrl}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
      } else {
        avatarEl.textContent = initial;
      }
    }
    if (mobileBtnEl) mobileBtnEl.textContent = initial;
    return;
  }

  if (currentSimulatedUserRole === 'SuperAdmin') {
    if (nameEl) nameEl.textContent = 'Super Admin';
    if (roleEl) roleEl.textContent = '🛡️ Toca Master';
    if (avatarEl) avatarEl.textContent = '🛡️';
    if (mobileBtnEl) mobileBtnEl.textContent = '🛡️';
  } else if (currentSimulatedUserRole === 'Administrador') {
    if (nameEl) nameEl.textContent = 'Javier Reyes';
    if (roleEl) roleEl.textContent = planName;
    if (avatarEl) avatarEl.textContent = 'J';
    if (mobileBtnEl) mobileBtnEl.textContent = 'J';
  } else {
    if (nameEl) nameEl.textContent = 'Sofía Castro';
    if (roleEl) roleEl.textContent = `${planName} (Colaborador)`;
    if (avatarEl) avatarEl.textContent = 'S';
    if (mobileBtnEl) mobileBtnEl.textContent = 'S';
  }



  const selectPlanEl = document.getElementById('select-plan-simulator');
  if (selectPlanEl) {
    selectPlanEl.value = currentActivePlan;
  }
}

function switchSimulatedRole(role) {
  currentSimulatedUserRole = role;
  localStorage.setItem('toca_current_simulated_role', role);
  
  updateAdminNavVisibility();
  updateProfileUI();
  renderAllTabs();
  
  if (role === 'SuperAdmin') {
    showToast("Simulando rol: Super-Administrador de Toca. Gestión global.");
    switchTab('admin');
  } else if (role === 'Administrador') {
    showToast("Simulando rol: Dueño (Administrador) - Javier Reyes. Control total.");
    if (currentTab === 'admin') switchTab('inicio');
  } else {
    showToast("Simulando rol: Colaborador (Agente) - Sofía Castro. Acceso limitado.");
    if (currentTab === 'admin') switchTab('inicio');
  }
}

function deleteAgent(email) {
  const agent = teamAgents.find(a => a.email.toLowerCase() === email.toLowerCase());
  const agentName = agent ? agent.name : email;
  if (confirm(`¿Estás seguro de que deseas eliminar a ${agentName} del equipo?`)) {
    teamAgents = teamAgents.filter(a => a.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem('toca_team_agents', JSON.stringify(teamAgents));
    showToast(`🗑️ Agente ${agentName} eliminado del equipo.`);
    renderProfileModalContent();
  }
}

function selfUnsubscribeAgent(email) {
  if (confirm("¿Estás seguro de que deseas darte de baja del equipo? Perderás acceso al sistema de inmediato.")) {
    teamAgents = teamAgents.filter(a => a.email.toLowerCase() !== email.toLowerCase());
    localStorage.setItem('toca_team_agents', JSON.stringify(teamAgents));
    
    // Close modal
    closeProfileConfigModal();
    
    showToast("Te has dado de baja del equipo correctamente.");
    
    // Reset simulated role to Administrador
    currentSimulatedUserRole = 'Administrador';
    localStorage.setItem('toca_current_simulated_role', 'Administrador');
    
    // Update profile dropdown in simulator
    const selectRoleEl = document.getElementById('select-role-simulator');
    if (selectRoleEl) {
      selectRoleEl.value = 'Administrador';
    }
    
    // Log out (simulate logout)
    logout();
  }
}

function populateBusinessSwitchers() {
  const switcherMenu = document.getElementById('workspace-switcher-menu');
  const triggerText = document.getElementById('current-workspace-name');
  const triggerBtn = document.getElementById('workspace-switcher-trigger');
  const modalSelect = document.getElementById('modal-business-switcher');
  
  const limit = PLAN_LIMITS[currentActivePlan].businesses;
  
  // 1. Populate custom dropdown menu in sidebar
  let menuHtml = '';
  businesses.forEach((b, idx) => {
    const isLocked = idx >= limit;
    const isActive = b.id === currentBusinessId;
    
    if (isActive && triggerText) {
      triggerText.textContent = isLocked ? `${b.name} 🔒` : b.name;
    }
    
    menuHtml += `
      <button onclick="${isLocked ? '' : `selectWorkspace(${b.id})`}" 
              ${isLocked ? 'disabled' : ''} 
              style="width: 100%; text-align: left; padding: 8px 12px; background: transparent; border: none; color: ${isActive ? 'var(--color-accent)' : '#ffffff'}; font-size: 0.8rem; font-family: var(--font-body); font-weight: ${isActive ? '700' : '500'}; cursor: ${isLocked ? 'not-allowed' : 'pointer'}; opacity: ${isLocked ? '0.4' : '1'}; display: flex; align-items: center; justify-content: space-between; transition: background 0.15s; outline: none;"
              onmouseover="this.style.background='rgba(255,255,255,0.06)'" 
              onmouseout="this.style.background='transparent'">
        <span>🏢 ${b.name} ${isLocked ? ' 🔒 (Subir Plan)' : ''}</span>
        ${isActive ? '<span style="color: var(--color-accent); font-size: 0.75rem;">✓</span>' : ''}
      </button>
    `;
  });
  
  if (switcherMenu) {
    switcherMenu.innerHTML = menuHtml;
  }
  if (triggerBtn) {
    triggerBtn.disabled = (limit === 1);
  }
  
  // 2. Populate native select in modal configuration
  let optionsHtml = '';
  businesses.forEach((b, idx) => {
    const isLocked = idx >= limit;
    const label = isLocked ? `${b.name} 🔒 (Subir Plan)` : b.name;
    const disabledAttr = isLocked ? 'disabled' : '';
    const selectedAttr = b.id === currentBusinessId ? 'selected' : '';
    optionsHtml += `<option value="${b.id}" ${disabledAttr} ${selectedAttr}>${label}</option>`;
  });
  
  if (modalSelect) {
    modalSelect.innerHTML = optionsHtml;
    modalSelect.value = currentBusinessId;
    modalSelect.disabled = (limit === 1);
  }
}

function toggleWorkspaceDropdown(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('workspace-switcher-menu');
  const chevron = document.getElementById('workspace-switcher-chevron');
  if (!menu) return;
  const isVisible = menu.style.display === 'block';
  menu.style.display = isVisible ? 'none' : 'block';
  if (chevron) {
    chevron.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(180deg)';
  }
}

function selectWorkspace(id) {
  switchBusinessWorkspace(id);
  const menu = document.getElementById('workspace-switcher-menu');
  const chevron = document.getElementById('workspace-switcher-chevron');
  if (menu) menu.style.display = 'none';
  if (chevron) chevron.style.transform = 'rotate(0deg)';
}

// Close workspace dropdown when clicking outside
document.addEventListener('click', () => {
  const menu = document.getElementById('workspace-switcher-menu');
  const chevron = document.getElementById('workspace-switcher-chevron');
  if (menu) menu.style.display = 'none';
  if (chevron) chevron.style.transform = 'rotate(0deg)';
});

function switchBusinessWorkspace(id) {
  currentBusinessId = id;
  localStorage.setItem('toca_current_business_id', id);
  businessProfile = businesses.find(b => b.id === id) || businesses[0];
  
  const triggerText = document.getElementById('current-workspace-name');
  if (triggerText) {
    const limit = PLAN_LIMITS[currentActivePlan].businesses;
    const idx = businesses.findIndex(b => b.id === id);
    const isLocked = idx >= limit;
    triggerText.textContent = isLocked ? `${businessProfile.name} 🔒` : businessProfile.name;
  }
  
  const modalSelect = document.getElementById('modal-business-switcher');
  if (modalSelect) modalSelect.value = id;
  
  showToast(`🏢 Espacio de trabajo cambiado a: ${businessProfile.name}`);
  
  const modal = document.getElementById('profile-config-modal');
  if (modal && modal.classList.contains('open')) {
    renderProfileModalContent();
  }
  
  renderAllTabs();
}

function switchSimulatedPlan(plan) {
  currentActivePlan = plan;
  localStorage.setItem('toca_current_active_plan', plan);
  
  // Enforce business limit: if current active business index exceeds new plan limit, switch to first business
  const limit = PLAN_LIMITS[plan].businesses;
  const activeIdx = businesses.findIndex(b => b.id === currentBusinessId);
  if (activeIdx >= limit) {
    const mainBizId = businesses[0].id;
    currentBusinessId = mainBizId;
    localStorage.setItem('toca_current_business_id', mainBizId);
    businessProfile = businesses[0];
    localStorage.setItem('toca_business_profile', JSON.stringify(businessProfile));
    showToast(`⚠️ Límite del plan excedido. Cambiado al negocio principal: ${businessProfile.name}`);
  }
  
  // Re-populate switchers
  populateBusinessSwitchers();
  
  // Update role/plan displayed in sidebar and simulator select
  updateProfileUI();
  
  // Update plan tab contents
  const modal = document.getElementById('profile-config-modal');
  if (modal && modal.classList.contains('open')) {
    renderProfileModalContent();
  }
  
  // Re-render other elements
  renderAllTabs();
  
  // Dispatch a descriptive toast message about limits
  const details = PLAN_LIMITS[plan];
  showToast(`⚡ Plan Simulado cambiado a: ${details.tag} ${details.name} (Límite: ${details.businesses} Negocio(s), ${details.agents} Agente(s), ${details.contacts} Contactos)`);
}

function createBusinessWorkspace(name) {
  if (!name || name.trim() === '') {
    showToast("⚠️ El nombre del negocio no puede estar vacío.");
    return;
  }
  
  const limit = PLAN_LIMITS[currentActivePlan].businesses;
  if (businesses.length >= limit) {
    showToast(`🔒 No puedes crear más negocios. Has alcanzado el límite de ${limit} negocios para tu plan.`);
    return;
  }
  
  const newId = businesses.length > 0 ? Math.max(...businesses.map(b => b.id)) + 1 : 1;
  const newBiz = {
    id: newId,
    name: name.trim(),
    sector: "Otro",
    description: "Descripción de mi nuevo negocio.",
    tone: "Amigable",
    promotion: "Envío a nivel nacional",
    timezone: "America/Lima"
  };
  
  businesses.push(newBiz);
  localStorage.setItem('toca_businesses', JSON.stringify(businesses));
  
  showToast(`🏢 Nuevo negocio creado: ${newBiz.name}`);
  
  // Automatically switch to the newly created business
  switchBusinessWorkspace(newId);
}

function deleteBusinessWorkspace(id) {
  if (businesses.length <= 1) {
    showToast("⚠️ No puedes eliminar el único negocio existente.");
    return;
  }
  
  if (id === currentBusinessId) {
    showToast("⚠️ No puedes eliminar el negocio activo en este momento. Cambia a otro negocio primero.");
    return;
  }

  const bizToDelete = businesses.find(b => b.id === id);
  const name = bizToDelete ? bizToDelete.name : `ID ${id}`;

  if (confirm(`¿Estás seguro de que deseas eliminar permanentemente el negocio "${name}" y TODOS sus contactos asociados?`)) {
    // Delete contacts
    contacts = contacts.filter(c => c.businessId !== id);
    // Delete business
    businesses = businesses.filter(b => b.id !== id);
    
    localStorage.setItem('toca_businesses', JSON.stringify(businesses));
    showToast(`🗑️ Negocio "${name}" y sus contactos eliminados.`);
    
    // Refresh UI
    populateBusinessSwitchers();
    if (document.getElementById('profile-config-modal').classList.contains('open')) {
      renderProfileModalContent();
    }
    renderAllTabs();
  }
}

// ==========================================================================
// SECCIÓN ADMINISTRATIVA (Simulación de Gestión de Clientes y Planes)
// ==========================================================================

function saveClientPlanChanges(clientId, plan, copilot, autopilot, maxContacts, maxAgents, status, lastPaymentDate, extraAgents, extraPacks) {
  const client = adminClients.find(c => c.id === clientId);
  if (!client) return;

  client.plan = plan;
  client.status = status || "Activo";
  client.lastPaymentDate = lastPaymentDate || "2026-06-21";

  if (plan === 'Apiario') {
    // Apiario is custom, limits and toggles are fully editable
    client.maxContacts = parseInt(maxContacts) || 1000;
    client.maxAgents = parseInt(maxAgents) || 10;
    client.copilot = !!copilot;
    client.autopilot = !!autopilot;
    client.extraAgents = 0;
    client.extraPacks = 0;
  } else {
    // Fixed plans (Néctar, Panal, Colmena): limits are set dynamically by base limits + expansions
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['Panal'];
    client.extraAgents = parseInt(extraAgents) || 0;
    client.extraPacks = parseInt(extraPacks) || 0;

    client.maxContacts = limits.contacts + (client.extraPacks * 50);
    client.maxAgents = limits.agents + client.extraAgents;

    // Enforce default capabilities of the fixed plans
    if (plan === 'Néctar') {
      client.copilot = false;
      client.autopilot = false;
    } else if (plan === 'Panal') {
      client.copilot = true;
      client.autopilot = false;
    } else if (plan === 'Colmena') {
      client.copilot = true;
      client.autopilot = true;
    }
  }

  localStorage.setItem('toca_simulated_admin_clients', JSON.stringify(adminClients));
  showToast(`✓ Cambios guardados para ${client.businessName}.`);
  
  // Si estamos suplantando a este cliente, actualizar los límites activos de inmediato
  if (impersonatedClientId === clientId) {
    currentActivePlan = plan;
    localStorage.setItem('toca_current_active_plan', plan);
  }

  renderAllTabs();
}

function adminValidatePayment(clientId) {
  const client = adminClients.find(c => c.id === clientId);
  if (!client) return;

  client.status = "Activo";
  client.lastPaymentDate = "2026-06-21";

  localStorage.setItem('toca_simulated_admin_clients', JSON.stringify(adminClients));
  showToast(`✅ Pago validado con éxito para ${client.businessName}. Cuenta Activada.`);
  
  // Refresh modal if open
  if (selectedAdminClientId === clientId) {
    renderAllTabs();
  }
}

function adminCancelService(clientId) {
  const client = adminClients.find(c => c.id === clientId);
  if (!client) return;

  if (confirm(`¿Estás seguro de que deseas cancelar el servicio de ${client.businessName}?`)) {
    client.status = "Cancelado";
    localStorage.setItem('toca_simulated_admin_clients', JSON.stringify(adminClients));
    showToast(`🗑️ Servicio cancelado para ${client.businessName}.`);
    
    // Refresh modal if open
    if (selectedAdminClientId === clientId) {
      renderAllTabs();
    }
  }
}

function impersonateClient(clientId) {
  const client = adminClients.find(c => c.id === clientId);
  if (!client) return;

  impersonatedClientId = clientId;
  localStorage.setItem('toca_impersonated_client_id', JSON.stringify(clientId));

  // Cambiar el plan activo simulado en el sistema
  currentActivePlan = client.plan;
  localStorage.setItem('toca_current_active_plan', client.plan);

  // Simular los datos del negocio y sus contactos correspondientes
  currentBusinessId = 999;
  localStorage.setItem('toca_current_business_id', 999);

  businessProfile = {
    id: 999,
    name: client.businessName,
    sector: "Venta e Importación",
    description: "Operaciones y gestiones comerciales del cliente suplantado.",
    tone: "Profesional",
    promotion: "Envío express",
    timezone: "America/Lima"
  };

  // Cargar contactos semilla filtrados para el cliente suplantado
  contacts = [
    { id: 901, name: "Contacto Cliente Slim 1", company: "SlimCorp Tech", type: "Prospecto", context: "Espera catálogo de importaciones.", status: "Toque del día", fu1: TODAY_STR, whatsapp: "+51987654321", suggestedDate: TODAY_STR, lastContacted: "Hace 2 días", leadSource: "Instagram", createdAt: TODAY_STR, lastActivityDate: TODAY_STR, businessId: 999 },
    { id: 902, name: "Contacto Cliente Slim 2", company: "Gamarra Mayorista", type: "Cliente", context: "Recompra quincenal activa.", status: "Esperando respuesta", whatsapp: "+51912345678", suggestedDate: "2026-07-15", lastContacted: "Ayer", cycleDays: 14, leadSource: "Referido", createdAt: TODAY_STR, lastActivityDate: TODAY_STR, businessId: 999 }
  ];

  showToast(`👁️ Suplantando sesión de: ${client.businessName}.`);
  
  // Salir de la pestaña admin y redirigir a inicio para ver el dashboard del cliente
  switchTab('inicio');
  renderAllTabs();
  updateProfileUI();
}

function stopImpersonating() {
  if (!impersonatedClientId) return;

  impersonatedClientId = null;
  localStorage.removeItem('toca_impersonated_client_id');

  // Restaurar el negocio original (Polos Mayoristas Lima)
  currentBusinessId = 1;
  localStorage.setItem('toca_current_business_id', 1);
  businessProfile = businesses.find(b => b.id === 1) || businesses[0];

  // Restaurar rol a SuperAdmin
  currentSimulatedUserRole = 'SuperAdmin';
  localStorage.setItem('toca_current_simulated_role', 'SuperAdmin');
  
  // Recargar contactos originales
  contacts = [...SEED_CONTACTS];

  showToast("Sesión restaurada a Super-Administrador.");
  
  switchTab('admin');
  renderAllTabs();
  updateProfileUI();
}


