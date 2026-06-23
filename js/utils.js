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


