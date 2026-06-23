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
    lastContacted: "Hace 10 días",
    leadSource: "Instagram",
    createdAt: "2026-06-10",
    lastActivityDate: "2026-06-15"
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
    lastContacted: "Hace 7 días",
    leadSource: "TikTok",
    createdAt: "2026-06-12",
    lastActivityDate: "2026-06-21"
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
    cycleDays: 28,
    leadSource: "Facebook Ads",
    createdAt: "2026-05-10",
    conversionDate: "2026-06-05",
    lastActivityDate: "2026-06-20",
    recompraCount: 1
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
    lastContacted: "Hace 5 días",
    leadSource: "Referido",
    createdAt: "2026-06-16",
    lastActivityDate: "2026-06-18"
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
    cycleDays: 28,
    leadSource: "WhatsApp Directo",
    createdAt: "2026-04-15",
    conversionDate: "2026-05-20",
    lastActivityDate: "2026-06-10",
    recompraCount: 2
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
    lastContacted: "Hace 2 días",
    leadSource: "Instagram",
    createdAt: "2026-06-19",
    lastActivityDate: "2026-06-19"
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
    lastContacted: "Hace 15 días",
    leadSource: "TikTok",
    createdAt: "2026-06-05",
    lastActivityDate: "2026-06-10"
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
    cycleDays: 28,
    leadSource: "Referido",
    createdAt: "2026-05-01",
    conversionDate: "2026-05-28",
    lastActivityDate: "2026-06-14",
    recompraCount: 1
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
    lastContacted: "Hace 5 días",
    leadSource: "Facebook Ads",
    createdAt: "2026-06-15",
    lastActivityDate: "2026-06-16"
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
    cycleDays: 28,
    leadSource: "WhatsApp Directo",
    createdAt: "2026-03-01",
    conversionDate: "2026-04-15",
    lastActivityDate: "2026-05-18",
    recompraCount: 0
  },
  // Contactos Archivados / Perdidos / Bajas para tener métricas de conversión realistas
  {
    id: 11,
    name: "Felipe Soto",
    company: "Soto Distribuciones",
    type: "Prospecto",
    context: "Preguntó por tarifas pero consideró elevado el precio.",
    status: "Toque del día",
    whatsapp: "+51998822110",
    suggestedDate: "2026-06-05",
    lastContacted: "Hace 3 semanas",
    archived: true,
    lostReason: "Precio",
    createdAt: "2026-05-10",
    lostDate: "2026-06-05",
    leadSource: "Instagram",
    lastActivityDate: "2026-06-05"
  },
  {
    id: 12,
    name: "Gabriela Ruiz",
    company: "Ruiz Boutique",
    type: "Prospecto",
    context: "Se le envió el catálogo pero no volvió a contestar.",
    status: "Toque del día",
    whatsapp: "+51995577889",
    suggestedDate: "2026-06-12",
    lastContacted: "Hace 2 semanas",
    archived: true,
    lostReason: "No respondió",
    createdAt: "2026-06-02",
    lostDate: "2026-06-12",
    leadSource: "TikTok",
    lastActivityDate: "2026-06-12"
  },
  {
    id: 13,
    name: "Javier Vargas",
    company: "Vargas Ferreteros",
    type: "Cliente",
    context: "Se dio de baja por mudanza de local comercial.",
    status: "Toque del día",
    whatsapp: "+51996611335",
    suggestedDate: "2026-06-15",
    lastContacted: "Hace 1 semana",
    archived: true,
    archivedDate: "15 Jun.",
    lostReason: "Compró a otro",
    createdAt: "2026-04-01",
    conversionDate: "2026-05-01",
    lostDate: "2026-06-15",
    leadSource: "Referido",
    lastActivityDate: "2026-06-15"
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
let currentStatsPeriod = 'mes';

// Auth State (persisted via localStorage for prototype feel)
let isLoggedIn = localStorage.getItem('toca_is_logged_in') === 'true';

// Business Profile State (for AI prompt engineering customization)
let businessProfile = JSON.parse(localStorage.getItem('toca_business_profile')) || {
  name: "Polos Mayoristas Lima",
  sector: "Venta de ropa al por mayor",
  description: "Prendas de algodón peruano oversize de alta calidad para marcas independientes.",
  tone: "Amigable",
  promotion: "Envío gratis a todo el Perú por compras de 1 docena o más",
  timezone: "America/Lima"
};

if (!businessProfile.timezone) {
  businessProfile.timezone = "America/Lima";
}

// Time constant mockup (simulation represents June 21, 2026)
const TODAY_STR = "2026-06-21";
const TODAY = new Date(TODAY_STR + "T00:00:00");

// ==========================================================================
