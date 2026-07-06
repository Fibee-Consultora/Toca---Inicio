console.log("[Toca Extension] content_whatsapp.js inyectado en WhatsApp Web.");

// 1. Inyectar Estilos Premium para la interfaz flotante
const style = document.createElement("style");
style.textContent = `
  #toca-fab {
    position: fixed;
    left: auto;
    top: auto;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #FFCC06;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    cursor: grab;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
    z-index: 999999;
    transition: transform 0.2s ease, background-color 0.2s ease;
    user-select: none;
    touch-action: none;
    border: none;
  }
  #toca-fab:hover {
    transform: scale(1.08);
    background-color: #E6B800;
  }
  #toca-fab.toca-dragging {
    cursor: grabbing;
    transform: scale(1.05);
    background-color: #E6B800;
  }
  #toca-popover {
    position: fixed;
    left: auto;
    top: auto;
    bottom: auto;
    right: auto;
    width: 290px;
    max-height: 390px;
    border-radius: 16px;
    background-color: #ffffff;
    border: 1px solid #E5E7EB;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    z-index: 999998;
    display: none;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    overflow: hidden;
    animation: toca-fade-in 0.2s ease-out;
  }
  @keyframes toca-fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .toca-header {
    background-color: #FFCC06;
    padding: 12px 16px;
    font-weight: 700;
    font-size: 14px;
    color: #111827;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #E5E7EB;
  }
  .toca-close-btn {
    cursor: pointer;
    background: none;
    border: none;
    font-size: 16px;
    color: #111827;
    padding: 0 4px;
  }
  .toca-search-wrapper {
    padding: 8px 12px;
    border-bottom: 1px solid #F3F4F6;
  }
  .toca-search-input {
    width: 100%;
    padding: 6px 10px;
    border-radius: 8px;
    border: 1px solid #D1D5DB;
    font-size: 12px;
    box-sizing: border-box;
    outline: none;
  }
  .toca-search-input:focus {
    border-color: #FFCC06;
  }
  .toca-list {
    padding: 8px;
    overflow-y: auto;
    flex-grow: 1;
    max-height: 250px;
  }
  .toca-item {
    padding: 10px 12px;
    border-radius: 8px;
    margin-bottom: 4px;
    cursor: pointer;
    font-size: 13px;
    color: #374151;
    background-color: #FAFBFB;
    border: 1px solid #F3F4F6;
    transition: background-color 0.15s ease, border-color 0.15s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .toca-item:hover {
    background-color: #FFFDF0;
    border-color: #FFE680;
  }
  .toca-empty {
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #9CA3AF;
  }
  .toca-footer {
    padding: 8px 16px;
    background-color: #F9FAFB;
    border-top: 1px solid #E5E7EB;
    font-size: 10px;
    color: #9CA3AF;
    text-align: center;
  }
`;
document.head.appendChild(style);

// 2. Elementos DOM de la Extensión
let fab = null;
let popover = null;
let searchInput = null;
let listContainer = null;
let allVisibleContacts = [];

const FAB_SIZE = 48;
const FAB_GAP = 12;
const FAB_MARGIN = 14;
const DRAG_THRESHOLD = 6;

let fabPositionMode = "auto";
let positionObserver = null;
let dragState = null;

function getWhatsAppComposeFooter() {
  const main = document.getElementById("main");
  if (!main) return null;

  return (
    main.querySelector("footer") ||
    main.querySelector('[data-testid="conversation-compose-box-input"]')?.closest("footer") ||
    document.querySelector('[contenteditable="true"][data-tab="10"]')?.closest("footer") ||
    null
  );
}

function clampFabPosition(left, top) {
  if (!fab) return { left, top };

  const pad = 8;
  const w = fab.offsetWidth || FAB_SIZE;
  const h = fab.offsetHeight || FAB_SIZE;
  const footer = getWhatsAppComposeFooter();
  let maxTop = window.innerHeight - h - pad;

  if (footer) {
    const footerTop = footer.getBoundingClientRect().top;
    maxTop = Math.min(maxTop, footerTop - h - FAB_GAP);
  }

  return {
    left: Math.max(pad, Math.min(left, window.innerWidth - w - pad)),
    top: Math.max(pad, Math.min(top, maxTop)),
  };
}

function applyFabCoords(left, top) {
  const clamped = clampFabPosition(left, top);
  fab.style.left = `${clamped.left}px`;
  fab.style.top = `${clamped.top}px`;
  fab.style.right = "auto";
  fab.style.bottom = "auto";
}

function reclampCustomFabPosition() {
  if (!fab || fabPositionMode !== "custom") return;
  applyFabCoords(parseFloat(fab.style.left) || 0, parseFloat(fab.style.top) || 0);
}

function getAutoFabCoords() {
  const footer = getWhatsAppComposeFooter();

  if (footer) {
    const rect = footer.getBoundingClientRect();
    return {
      left: rect.right - FAB_SIZE - FAB_MARGIN,
      top: rect.top - FAB_SIZE - FAB_GAP,
    };
  }

  return {
    left: window.innerWidth - FAB_SIZE - FAB_MARGIN,
    top: window.innerHeight - 88 - FAB_SIZE,
  };
}

function applyAutoFabPosition() {
  if (!fab || fabPositionMode !== "auto") return;
  const coords = getAutoFabCoords();
  applyFabCoords(coords.left, coords.top);
}

function setupFabPositionWatch() {
  if (positionObserver) {
    positionObserver.disconnect();
    positionObserver = null;
  }

  const attachFooterObserver = () => {
    const footer = getWhatsAppComposeFooter();
    if (!footer || typeof ResizeObserver === "undefined" || positionObserver) {
      return !!footer;
    }

    positionObserver = new ResizeObserver(() => {
      if (fabPositionMode === "auto") {
        applyAutoFabPosition();
      } else {
        reclampCustomFabPosition();
      }
      if (popover?.style.display === "flex") positionPopoverNearFab();
    });
    positionObserver.observe(footer);

    if (fabPositionMode === "auto") applyAutoFabPosition();
    return true;
  };

  if (!attachFooterObserver()) {
    const main = document.getElementById("main");
    if (main && !main.dataset.tocaFooterWatch) {
      main.dataset.tocaFooterWatch = "1";
      const mo = new MutationObserver(() => {
        if (attachFooterObserver()) mo.disconnect();
      });
      mo.observe(main, { childList: true, subtree: true });
    }
  }

  window.removeEventListener("resize", onFabViewportChange);
  window.addEventListener("resize", onFabViewportChange);
}

function onFabViewportChange() {
  if (fabPositionMode === "auto") {
    applyAutoFabPosition();
  } else {
    reclampCustomFabPosition();
  }
  if (popover?.style.display === "flex") positionPopoverNearFab();
}

function positionPopoverNearFab() {
  if (!fab || !popover) return;

  const fabRect = fab.getBoundingClientRect();
  const popoverWidth = 290;
  const popoverHeight = Math.min(popover.offsetHeight || 320, 390);
  const gap = 10;
  const pad = 8;

  let left = fabRect.left + fabRect.width / 2 - popoverWidth / 2;
  left = Math.max(pad, Math.min(left, window.innerWidth - popoverWidth - pad));

  let top = fabRect.top - popoverHeight - gap;
  if (top < pad) {
    top = fabRect.bottom + gap;
  }

  popover.style.left = `${left}px`;
  popover.style.top = `${top}px`;
  popover.style.right = "auto";
  popover.style.bottom = "auto";
}

function enableFabDragging() {
  const onPointerDown = (e) => {
    if (e.button !== 0) return;

    const rect = fab.getBoundingClientRect();
    dragState = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: rect.left,
      startTop: rect.top,
      moved: false,
    };

    fab.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onPointerMove = (e) => {
    if (!dragState || e.pointerId !== dragState.pointerId) return;

    const dx = e.clientX - dragState.startX;
    const dy = e.clientY - dragState.startY;

    if (!dragState.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;

    dragState.moved = true;
    fab.classList.add("toca-dragging");
    applyFabCoords(dragState.startLeft + dx, dragState.startTop + dy);
  };

  const onPointerUp = (e) => {
    if (!dragState || e.pointerId !== dragState.pointerId) return;

    fab.classList.remove("toca-dragging");
    fab.releasePointerCapture(e.pointerId);

    if (dragState.moved) {
      fabPositionMode = "custom";
      const left = parseFloat(fab.style.left) || 0;
      const top = parseFloat(fab.style.top) || 0;
      applyFabCoords(left, top);
    }

    const wasDrag = dragState.moved;
    dragState = null;

    if (!wasDrag) togglePopover();
  };

  fab.addEventListener("pointerdown", onPointerDown);
  fab.addEventListener("pointermove", onPointerMove);
  fab.addEventListener("pointerup", onPointerUp);
  fab.addEventListener("pointercancel", onPointerUp);
}

function togglePopover() {
  if (popover.style.display === "flex") {
    popover.style.display = "none";
    return;
  }

  popover.style.display = "flex";
  searchInput.value = "";
  allVisibleContacts = getVisibleContacts();
  renderContactsList();
  positionPopoverNearFab();
  searchInput.focus();
}

function initFabPosition() {
  fabPositionMode = "auto";
  applyAutoFabPosition();
  setupFabPositionWatch();
}

// 3. Scraping: Obtener contactos visibles en la barra lateral (no mensajes del chat)
function isLikelyContactName(text) {
  if (!text) return false;
  const t = text.trim();
  if (t.length < 1 || t.length > 60) return false;
  if (/^\d{1,2}:\d{2}(\s*(a\.?m\.?|p\.?m\.?))?$/i.test(t)) return false;
  if (/^(ayer|hoy|yesterday|today|monday|tuesday|wednesday|thursday|friday|saturday|sunday|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|domingo)$/i.test(t)) return false;
  return true;
}

function extractPhoneFromRow(row) {
  let phone = "";
  let jid = row.getAttribute("data-id") || row.id || "";
  if (!jid) {
    const childWithId = row.querySelector("[data-id]");
    if (childWithId) jid = childWithId.getAttribute("data-id");
  }
  if (!jid) {
    const matchJid = row.outerHTML.match(/(\d+)@c\.us/);
    if (matchJid) jid = matchJid[0];
  }
  if (jid) {
    const phoneMatch = jid.match(/^(\d+)@c\.us/);
    if (phoneMatch) phone = "+" + phoneMatch[1];
  }
  if (!phone) {
    const img = row.querySelector("img");
    if (img && img.src) {
      const match = img.src.match(/u=(\d+)/);
      if (match) phone = "+" + match[1];
    }
  }
  return phone;
}

function getVisibleContacts() {
  const pane = document.getElementById("pane-side");
  if (!pane) return [];

  const rows = pane.querySelectorAll('div[role="row"]');
  const contacts = [];
  const seen = new Set();

  rows.forEach((row) => {
    const titleSpans = row.querySelectorAll("span[title]");
    let name = "";

    for (const span of titleSpans) {
      const candidate = (span.getAttribute("title") || "").trim();
      if (isLikelyContactName(candidate)) {
        name = candidate;
        break;
      }
    }

    if (!name) {
      const autoSpan = row.querySelector('span[dir="auto"]');
      const candidate = (autoSpan?.textContent || "").trim();
      if (isLikelyContactName(candidate)) {
        name = candidate;
      }
    }

    if (!name || seen.has(name)) return;

    seen.add(name);
    contacts.push({
      name,
      phone: extractPhoneFromRow(row),
    });
  });

  return contacts;
}

function getWhatsAppChatHistory() {
  const messageNodes = document.querySelectorAll('div.message-in, div.message-out');
  const history = [];
  messageNodes.forEach(node => {
    const textEl = node.querySelector('span.selectable-text');
    if (textEl) {
      const text = textEl.innerText;
      const isOut = node.classList.contains('message-out');
      history.push(`${isOut ? 'Tú' : 'Cliente'}: ${text}`);
    }
  });
  return history.slice(-12).join('\n');
}

// 4. Renderizar la lista de contactos en el popover
function renderContactsList(filterQuery = "") {
  listContainer.innerHTML = "";

  const filtered = allVisibleContacts.filter((contact) =>
    contact.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
    (contact.phone && contact.phone.includes(filterQuery.replace(/\D/g, "")))
  );

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="toca-empty">No se encontraron contactos en la lista de WhatsApp.</div>`;
    return;
  }

  filtered.forEach((contact) => {
    const item = document.createElement("div");
    item.className = "toca-item";
    const phoneLabel = contact.phone ? `<span style="font-size:11px;color:#9CA3AF;margin-left:auto;">${contact.phone}</span>` : "";
    item.innerHTML = `👤 <span>${contact.name}</span>${phoneLabel}`;

    item.onclick = () => {
      item.innerHTML = `⏳ <span>Sincronizando...</span>`;
      item.style.pointerEvents = "none";

      // Intentar buscar y abrir el chat en la barra lateral
      let clicked = false;
      const pane = document.getElementById('pane-side');
      if (pane) {
        const rows = pane.querySelectorAll('div[role="row"]');
        for (const row of rows) {
          const spans = row.querySelectorAll('span[title]');
          for (const s of spans) {
            if ((s.getAttribute('title') || '').trim() === contact.name) {
              row.click();
              clicked = true;
              break;
            }
          }
          if (clicked) break;
        }
      }

      // Esperar 800ms a que el chat cargue y recolectar/enviar los datos
      setTimeout(() => {
        const context = getWhatsAppChatHistory();
        console.log("[Toca Extension] Sincronizando:", { name: contact.name, phone: contact.phone, context });

        try {
          chrome.runtime.sendMessage({
            action: "openContactInToca",
            name: contact.name,
            phone: contact.phone,
            context: context,
          }, () => {
            if (chrome.runtime.lastError) {
              console.error("[Toca Extension] Error de runtime:", chrome.runtime.lastError.message);
              alert("⚠️ Error: No se pudo conectar con la extensión. Intenta recargar (F5) la pestaña de WhatsApp Web.");
            } else {
              console.log("[Toca Extension] Contacto enviado correctamente a Toca");
            }
          });
        } catch (err) {
          console.error("[Toca Extension] Excepción al enviar contacto:", err);
          alert("⚠️ La extensión se ha actualizado. Por favor, refresca (F5) la página de WhatsApp Web para volver a sincronizar.");
        }

        popover.style.display = "none";
        item.style.pointerEvents = "";
        item.innerHTML = `👤 <span>${contact.name}</span>${phoneLabel}`;
      }, 800);
    };

    listContainer.appendChild(item);
  });
}

// 5. Inicializar componentes de la Extensión en la página
function initExtensionUI() {
  if (document.getElementById("toca-fab")) return;

  // Crear FAB
  fab = document.createElement("div");
  fab.id = "toca-fab";
  fab.innerHTML = "🐝";
  fab.title = "Vincular contacto a Toca (arrastra para mover)";
  document.body.appendChild(fab);
  enableFabDragging();
  initFabPosition();

  // Crear Popover
  popover = document.createElement("div");
  popover.id = "toca-popover";
  popover.innerHTML = `
    <div class="toca-header">
      <span>Vincular contacto a Toca 🐝</span>
      <button class="toca-close-btn" id="toca-close-btn">×</button>
    </div>
    <div class="toca-search-wrapper">
      <input type="text" class="toca-search-input" id="toca-search-input" placeholder="🔍 Buscar contacto por nombre o teléfono...">
    </div>
    <div class="toca-list" id="toca-list-container">
      <div class="toca-empty">Cargando contactos de WhatsApp...</div>
    </div>
    <div class="toca-footer">
      Toca local v2 • by fibee
    </div>
  `;
  document.body.appendChild(popover);

  searchInput = document.getElementById("toca-search-input");
  listContainer = document.getElementById("toca-list-container");

  searchInput.oninput = (e) => {
    renderContactsList(e.target.value);
  };

  document.getElementById("toca-close-btn").onclick = () => {
    popover.style.display = "none";
  };
}

// 6. Esperar a que la barra lateral de WhatsApp esté completamente lista
const initInterval = setInterval(() => {
  const pane = document.getElementById('pane-side');
  if (pane) {
    clearInterval(initInterval);
    console.log("[Toca Extension] WhatsApp Web detectado listo. Inicializando botón flotante.");
    initExtensionUI();
  }
}, 1000);
