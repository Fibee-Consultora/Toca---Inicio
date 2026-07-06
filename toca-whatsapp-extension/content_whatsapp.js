console.log("[Toca Extension] content_whatsapp.js inyectado en WhatsApp Web.");

// 1. Inyectar Estilos Premium para la interfaz flotante
const style = document.createElement("style");
style.textContent = `
  #toca-fab {
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background-color: #FFCC06;
    color: #111827;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.16);
    z-index: 999999;
    transition: transform 0.2s ease, background-color 0.2s ease;
    user-select: none;
  }
  #toca-fab:hover {
    transform: scale(1.08);
    background-color: #E6B800;
  }
  #toca-fab:active {
    transform: scale(0.95);
  }
  #toca-popover {
    position: fixed;
    bottom: 80px;
    right: 20px;
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
let allVisibleChats = [];

// 3. Scraping: Obtener chats visibles en la barra lateral
function getVisibleChats() {
  const pane = document.getElementById('pane-side');
  if (!pane) return [];
  
  const spans = pane.querySelectorAll('span[title]');
  const chats = [];
  const seen = new Set();
  
  spans.forEach(span => {
    const name = span.getAttribute('title');
    if (name && !seen.has(name)) {
      const row = span.closest('div[role="row"]');
      if (row) {
        seen.add(name);
        // Intentar extraer el teléfono del JID en los atributos o HTML del row
        let phone = "";
        let jid = row.getAttribute('data-id') || row.id || "";
        if (!jid) {
          const childWithId = row.querySelector('[data-id]');
          if (childWithId) jid = childWithId.getAttribute('data-id');
        }
        if (!jid) {
          const matchJid = row.outerHTML.match(/(\d+)@c\.us/);
          if (matchJid) jid = matchJid[0];
        }
        
        if (jid) {
          const phoneMatch = jid.match(/^(\d+)@c\.us/);
          if (phoneMatch) {
            phone = '+' + phoneMatch[1];
          }
        }
        
        // Fallback al avatar
        if (!phone) {
          const img = row.querySelector('img');
          if (img && img.src) {
            const match = img.src.match(/u=(\d+)/);
            if (match) {
              phone = '+' + match[1];
            }
          }
        }
        chats.push({ name, phone, element: span });
      }
    }
  });
  return chats;
}

// 4. Scraping: Obtener cabeceras e historial del chat activo
function getActiveContactName() {
  const header = document.querySelector('header');
  if (header) {
    const titleSpan = header.querySelector('span[title]') || 
                      header.querySelector('span[dir="auto"]') || 
                      header.querySelector('div[dir="auto"] span');
    if (titleSpan) {
      return (titleSpan.getAttribute('title') || titleSpan.innerText).trim();
    }
  }
  return "Desconocido";
}

function getActiveContactPhone() {
  // 1. Buscar en el contenedor de mensajes principal (#main)
  const main = document.getElementById('main');
  if (main) {
    const mainId = main.getAttribute('data-id') || main.id || "";
    const match = mainId.match(/(\d+)@c\.us/);
    if (match) return '+' + match[1];
  }

  const header = document.querySelector('header');
  if (header) {
    // 2. Buscar JID en la cabecera
    const matchJid = header.outerHTML.match(/(\d+)@c\.us/);
    if (matchJid) return '+' + matchJid[1];

    // 3. Buscar el avatar en la cabecera
    const img = header.querySelector('img');
    if (img && img.src) {
      const match = img.src.match(/u=(\d+)/);
      if (match) {
        return '+' + match[1];
      }
    }
    
    // Fallback: Verificar si el título de la cabecera es un número
    const titleSpan = header.querySelector('span[title]');
    if (titleSpan) {
      const title = titleSpan.getAttribute('title') || '';
      if (title.trim().match(/^\+?[\d\s-]+$/)) {
        return title.trim().replace(/\s+/g, '');
      }
    }
  }
  return "";
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
  // Retornar los últimos 12 mensajes como contexto para Toca
  return history.slice(-12).join('\n');
}

// 5. Renderizar la lista de chats en el popover
function renderChatsList(filterQuery = "") {
  listContainer.innerHTML = "";
  
  const filtered = allVisibleChats.filter(chat => 
    chat.name.toLowerCase().includes(filterQuery.toLowerCase())
  );

  if (filtered.length === 0) {
    listContainer.innerHTML = `<div class="toca-empty">No se encontraron chats activos.</div>`;
    return;
  }

  filtered.forEach(chat => {
    const item = document.createElement("div");
    item.className = "toca-item";
    item.innerHTML = `💬 <span>${chat.name}</span>`;
    
    item.onclick = () => {
      item.innerHTML = `⏳ <span>Sincronizando...</span>`;
      item.style.pointerEvents = "none";
      
      // Abrir el chat en WhatsApp Web
      chat.element.click();

      // Esperar 800ms a que el chat cargue y recolectar/enviar los datos
      setTimeout(() => {
        const name = getActiveContactName() !== "Desconocido" ? getActiveContactName() : chat.name;
        const phone = chat.phone || getActiveContactPhone();
        const context = getWhatsAppChatHistory();

        console.log("[Toca Extension] Datos extraídos:", { name, phone, context });

        // Enviar a background.js usando la acción mapeada "openContactInToca"
        try {
          chrome.runtime.sendMessage({
            action: "openContactInToca",
            name: name,
            phone: phone,
            context: context,
            company: "",
            fu1: "",
            fu2: "",
            fu3: "",
            type: "Prospecto"
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.error("[Toca Extension] Error de runtime:", chrome.runtime.lastError.message);
              alert("⚠️ Error: No se pudo conectar con la extensión. Intenta recargar (F5) la pestaña de WhatsApp Web.");
            } else {
              console.log("[Toca Extension] Mensaje enviado correctamente a background.js");
            }
          });
        } catch (err) {
          console.error("[Toca Extension] Excepción al enviar mensaje:", err);
          alert("⚠️ La extensión se ha actualizado. Por favor, refresca (F5) la página de WhatsApp Web para volver a sincronizar.");
        }

        // Ocultar popover y restaurar el item
        popover.style.display = "none";
        item.style.pointerEvents = "";
        item.innerHTML = `💬 <span>${chat.name}</span>`;
      }, 800);
    };

    listContainer.appendChild(item);
  });
}

// 6. Inicializar componentes de la Extensión en la página
function initExtensionUI() {
  if (document.getElementById("toca-fab")) return;

  // Crear FAB
  fab = document.createElement("div");
  fab.id = "toca-fab";
  fab.innerHTML = "🐝";
  fab.title = "Vincular contacto a Toca";
  document.body.appendChild(fab);

  // Crear Popover
  popover = document.createElement("div");
  popover.id = "toca-popover";
  popover.innerHTML = `
    <div class="toca-header">
      <span>Vincular chat a Toca 🐝</span>
      <button class="toca-close-btn" id="toca-close-btn">×</button>
    </div>
    <div class="toca-search-wrapper">
      <input type="text" class="toca-search-input" id="toca-search-input" placeholder="🔍 Buscar chat por nombre...">
    </div>
    <div class="toca-list" id="toca-list-container">
      <div class="toca-empty">Cargando chats activos...</div>
    </div>
    <div class="toca-footer">
      Toca local v2 • by fibee
    </div>
  `;
  document.body.appendChild(popover);

  searchInput = document.getElementById("toca-search-input");
  listContainer = document.getElementById("toca-list-container");

  searchInput.oninput = (e) => {
    renderChatsList(e.target.value);
  };

  document.getElementById("toca-close-btn").onclick = () => {
    popover.style.display = "none";
  };

  fab.onclick = () => {
    if (popover.style.display === "flex") {
      popover.style.display = "none";
    } else {
      popover.style.display = "flex";
      searchInput.value = "";
      
      allVisibleChats = getVisibleChats();
      renderChatsList();
      searchInput.focus();
    }
  };
}

// 7. Esperar a que la barra lateral de WhatsApp esté completamente lista
const initInterval = setInterval(() => {
  const pane = document.getElementById('pane-side');
  if (pane) {
    clearInterval(initInterval);
    console.log("[Toca Extension] WhatsApp Web detectado listo. Inicializando botón flotante.");
    initExtensionUI();
  }
}, 1000);
