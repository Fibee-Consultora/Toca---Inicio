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
    lastContacted: "Hace 10 días"
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
    lastContacted: "Hace 7 días"
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
    cycleDays: 28
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
    lastContacted: "Hace 5 días"
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
    cycleDays: 28
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
    lastContacted: "Hace 2 días"
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
    lastContacted: "Hace 15 días"
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
    cycleDays: 28
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
    lastContacted: "Hace 5 días"
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
    cycleDays: 28
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

// Time constant mockup (simulation represents June 21, 2026)
const TODAY_STR = "2026-06-21";
const TODAY = new Date(TODAY_STR + "T00:00:00");

// ==========================================================================
