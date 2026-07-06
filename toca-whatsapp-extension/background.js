console.log("[Toca Extension] Service Worker (background.js) activo.");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openContactInToca") {
    try {
      const name = message.name || '';
      const phone = message.phone || '';
      const context = message.context || '';
      
      // Detectar dinámicamente si el usuario usa localhost, 127.0.0.1 o toca.fibee.pro
      chrome.tabs.query({}, (tabs) => {
        let host = "http://localhost:8000"; // Fallback por defecto
        
        try {
          if (!chrome.runtime.lastError && tabs && tabs.length > 0) {
            const tocaTab = tabs.find(tab => {
              if (!tab.url) return false;
              const url = tab.url.toLowerCase();
              return url.includes("toca.fibee.pro") || url.includes("localhost") || url.includes("127.0.0.1");
            });
            
            if (tocaTab) {
              const match = tocaTab.url.match(/^https?:\/\/[^\/]+/i);
              if (match) {
                host = match[0];
              }
            }
          }
        } catch (e) {
          console.warn("[Toca Extension] Error detectando host, usando localhost:", e);
        }

        const url = `${host}/?openModal=true&name=${encodeURIComponent(name)}&phone=${encodeURIComponent(phone)}&context=${encodeURIComponent(context)}`;
        
        chrome.tabs.create({ url }, () => {
          if (chrome.runtime.lastError) {
            console.error("[Toca Extension] Error al crear pestaña:", chrome.runtime.lastError);
            sendResponse({ success: false, error: chrome.runtime.lastError.message });
          } else {
            sendResponse({ success: true });
          }
        });
      });
    } catch (err) {
      console.error("[Toca Extension] Error en listener:", err);
      sendResponse({ success: false, error: err.message });
    }
    return true; // Asíncrono
  }
});
