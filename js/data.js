// STATE — contactos desde Supabase (PostgreSQL)
// ==========================================================================
let contacts = [];
let dbReady = false;

const SEED_CONTACTS = [
  {
    id: 1,
    name: "Jorge Ramírez",
    company: "Tienda Urbana Chic",
    type: "Prospecto",
    context: "Espera cotización de 5 docenas de polos oversize de algodón.",
    status: "Toque del día",
    fu1: "2026-06-21",
    fu2: "",
    fu3: "",
    whatsapp: "+51987654321",
    suggestedDate: "2026-06-21", // Hoy (Rojo)
    lastContacted: "Hace 10 días",
    leadSource: "Instagram",
    createdAt: "2026-06-10",
    lastActivityDate: "2026-06-15",
    businessId: 1
  },
  {
    id: 2,
    name: "Rosa Quispe",
    company: "Boutique Rosa de Gamarra",
    type: "Prospecto",
    context: "Interesada en catálogo y precios de polos oversize premium.",
    status: "Toque del día",
    fu1: "2026-06-21",
    fu2: "",
    fu3: "",
    whatsapp: "+51912345678",
    suggestedDate: "2026-06-21", // Hoy (Rojo)
    lastContacted: "Hace 7 días",
    leadSource: "TikTok",
    createdAt: "2026-06-12",
    lastActivityDate: "2026-06-21",
    businessId: 1
  },
  {
    id: 3,
    name: "Carlos Mendoza",
    company: "Mendoza Ropa Deportiva",
    type: "Cliente",
    context: "Hizo recompra de 100 polos de algodón básico.",
    status: "Toque del día",
    whatsapp: "+51923456789",
    suggestedDate: "2026-06-20", // Vencido ayer (Rojo)
    lastContacted: "Ayer",
    cycleDays: 28,
    leadSource: "Facebook Ads",
    createdAt: "2026-05-10",
    conversionDate: "2026-06-05",
    lastActivityDate: "2026-06-20",
    recompraCount: 1,
    businessId: 1
  },
  {
    id: 4,
    name: "Marco Reyes",
    company: "Estilo Reyes E.I.R.L.",
    type: "Prospecto",
    context: "Pintado de logo personalizado en lote de 50 polos.",
    status: "Toque del día",
    fu1: "2026-06-22",
    fu2: "",
    fu3: "",
    whatsapp: "+51934567890",
    suggestedDate: "2026-06-22", // Mañana (Rojo)
    lastContacted: "Hace 5 días",
    leadSource: "Referido",
    createdAt: "2026-06-16",
    lastActivityDate: "2026-06-18",
    businessId: 1
  },
  {
    id: 5,
    name: "Sofía Castro",
    company: "Castro Urban Wear",
    type: "Cliente",
    context: "Próximo pedido mensual de polos oversize en colores pastel.",
    status: "Toque del día",
    whatsapp: "+51945678901",
    suggestedDate: "2026-06-24", // Vence en 3 días (Amarillo)
    lastContacted: "Hace 26 días",
    cycleDays: 28,
    leadSource: "WhatsApp Directo",
    createdAt: "2026-04-15",
    conversionDate: "2026-05-20",
    lastActivityDate: "2026-06-10",
    recompraCount: 2,
    businessId: 1
  },
  {
    id: 6,
    name: "Andrés Loli",
    company: "Loli Tienda Multimarca",
    type: "Prospecto",
    context: "Enviada cotización de polos oversize blancos con estampado de marca.",
    status: "Toque del día",
    whatsapp: "+51956789012",
    suggestedDate: "2026-07-02", // Vence en 11 días (Verde)
    lastContacted: "Hace 2 días",
    leadSource: "Instagram",
    createdAt: "2026-06-19",
    lastActivityDate: "2026-06-19",
    businessId: 1
  },
  {
    id: 7,
    name: "Lucía Fernández",
    company: "Fernández Closet",
    type: "Prospecto",
    context: "", // Empty context to test AI Error state
    status: "Toque del día",
    whatsapp: "+51998877665",
    suggestedDate: "2026-06-20", // Vencido ayer (Rojo)
    lastContacted: "Hace 15 días",
    leadSource: "TikTok",
    createdAt: "2026-06-05",
    lastActivityDate: "2026-06-10",
    businessId: 1
  },
  {
    id: 8,
    name: "Roberto Gómez",
    company: "Gómez Urban Store",
    type: "Cliente",
    context: "Pedido de 120 polos oversize de alta calidad para su nueva tienda.",
    status: "Toque del día",
    whatsapp: "+51991122334",
    suggestedDate: "2026-07-05", // Vence en 14 días (Verde)
    lastContacted: "Hace 14 días",
    cycleDays: 28,
    leadSource: "Referido",
    createdAt: "2026-05-01",
    conversionDate: "2026-05-28",
    lastActivityDate: "2026-06-14",
    recompraCount: 1,
    businessId: 1
  },
  {
    id: 9,
    name: "Elena Patiño",
    company: "Elena Tienda de Moda",
    type: "Prospecto",
    context: "Solicitó catálogo y cotización de polos oversize por WhatsApp.",
    status: "Toque del día",
    whatsapp: "+51995544332",
    suggestedDate: "2026-06-26", // Vence en 5 días (Amarillo)
    lastContacted: "Hace 5 días",
    leadSource: "Facebook Ads",
    createdAt: "2026-06-15",
    lastActivityDate: "2026-06-16",
    businessId: 1
  },
  {
    id: 10,
    name: "Mateo Salazar",
    company: "Salazar Concept Store",
    type: "Cliente",
    context: "Renovación de pedido recurrente de polos oversize premium.",
    status: "Toque del día",
    whatsapp: "+51996633221",
    suggestedDate: "2026-06-18", // Vencido hace 3 días (Rojo)
    lastContacted: "Hace 1 mes",
    cycleDays: 28,
    leadSource: "WhatsApp Directo",
    createdAt: "2026-03-01",
    conversionDate: "2026-04-15",
    lastActivityDate: "2026-05-18",
    recompraCount: 0,
    businessId: 1
  },
  // Contactos Archivados / Perdidos / Bajas para tener métricas de conversión realistas
  {
    id: 11,
    name: "Felipe Soto",
    company: "Soto Mayoristas",
    type: "Prospecto",
    context: "Preguntó por polos de algodón de 20 al hilo pero el precio le pareció elevado.",
    status: "Toque del día",
    whatsapp: "+51998822110",
    suggestedDate: "2026-06-05",
    lastContacted: "Hace 3 semanas",
    archived: true,
    lostReason: "Precio",
    createdAt: "2026-05-10",
    lostDate: "2026-06-05",
    leadSource: "Instagram",
    lastActivityDate: "2026-06-05",
    businessId: 1
  },
  {
    id: 12,
    name: "Gabriela Ruiz",
    company: "Ruiz Closet Gamarra",
    type: "Prospecto",
    context: "Se le envió catálogo de polos oversize de colores pero no volvió a contestar.",
    status: "Toque del día",
    whatsapp: "+51995577889",
    suggestedDate: "2026-06-12",
    lastContacted: "Hace 2 semanas",
    archived: true,
    lostReason: "No respondió",
    createdAt: "2026-06-02",
    lostDate: "2026-06-12",
    leadSource: "TikTok",
    lastActivityDate: "2026-06-12",
    businessId: 1
  },
  {
    id: 13,
    name: "Javier Vargas",
    company: "Vargas Moda Urbana",
    type: "Cliente",
    context: "Se dio de baja por cierre temporal de su tienda en Gamarra.",
    status: "Toque del día",
    whatsapp: "+51996611335",
    suggestedDate: "2026-06-15",
    lastContacted: "Hace 1 semana",
    archived: true,
    archivedDate: "15/06/2026",
    lostReason: "Compró a otro",
    createdAt: "2026-04-01",
    conversionDate: "2026-05-01",
    lostDate: "2026-06-15",
    leadSource: "Referido",
    lastActivityDate: "2026-06-15",
    businessId: 1
  },
  // Coolbox Express (businessId: 2) contacts
  {
    id: 14,
    name: "Julio Tecno",
    company: "Tecno Store Gamarra",
    type: "Prospecto",
    context: "Preguntó por stock de audífonos Bluetooth y cargadores tipo C.",
    status: "Toque del día",
    fu1: "2026-06-21",
    fu2: "",
    fu3: "",
    whatsapp: "+51999888777",
    suggestedDate: "2026-06-21",
    lastContacted: "Hace 2 días",
    leadSource: "Facebook Ads",
    createdAt: "2026-06-18",
    lastActivityDate: "2026-06-19",
    businessId: 2
  },
  {
    id: 15,
    name: "Beatriz Tech",
    company: "B&B Importaciones",
    type: "Prospecto",
    context: "Espera cotización de 10 smartwatches serie 8.",
    status: "Toque del día",
    fu1: "2026-06-21",
    fu2: "",
    fu3: "",
    whatsapp: "+51977665544",
    suggestedDate: "2026-06-21",
    lastContacted: "Hace 5 días",
    leadSource: "Instagram",
    createdAt: "2026-06-15",
    lastActivityDate: "2026-06-16",
    businessId: 2
  },
  {
    id: 16,
    name: "Renato Gadgets",
    company: "Gadget Shop",
    type: "Cliente",
    context: "Recompra mensual de cargadores rápidos para smartphones.",
    status: "Toque del día",
    whatsapp: "+51955443322",
    suggestedDate: "2026-06-20",
    lastContacted: "Ayer",
    cycleDays: 28,
    leadSource: "WhatsApp Directo",
    createdAt: "2026-05-10",
    conversionDate: "2026-06-05",
    lastActivityDate: "2026-06-20",
    recompraCount: 3,
    businessId: 2
  },
  {
    id: 17,
    name: "Valeria Tech",
    company: "Valeria Store",
    type: "Cliente",
    context: "Interesada en parlantes impermeables para campaña de verano.",
    status: "Toque del día",
    whatsapp: "+51933221100",
    suggestedDate: "2026-06-24",
    lastContacted: "Hace 10 días",
    cycleDays: 28,
    leadSource: "Referido",
    createdAt: "2026-04-15",
    conversionDate: "2026-05-15",
    lastActivityDate: "2026-06-14",
    recompraCount: 1,
    businessId: 2
  }
];

let currentViewport = 'desktop';
let currentFilter = 'Rojo';
let currentClientesFilter = 'Todos';
let currentProspectosFilter = 'Todos';
let selectedContactId = null;
let lastUsedType = 'Prospecto'; // Memory for Nuevo Contacto Modal
let selectedTypeInModal = 'Prospecto'; 
let archivedBackup = null; // For Undo Archive
let isWaitingCollapsed = false;
let currentTab = 'inicio';
let currentStatsPeriod = 'mes';
let currentProfileModalTab = 'perfil';
let tempExtraAgents = 0;
const PLAN_LIMITS = {
  'Néctar': { name: 'Plan Néctar', tag: '🌸', businesses: 1, agents: 1, contacts: 50 },
  'Panal': { name: 'Plan Panal', tag: '🍯', businesses: 2, agents: 3, contacts: 200 },
  'Colmena': { name: 'Plan Colmena', tag: '🐝', businesses: 5, agents: 8, contacts: 600 },
  'Apiario': { name: 'Plan Apiario', tag: '👑', businesses: 999, agents: 999, contacts: 99999 }
};

let currentActivePlan = localStorage.getItem('toca_current_active_plan') || 'Panal';
let purchasedExtraAgents = parseInt(localStorage.getItem('toca_extra_agents')) || 0;
let purchasedExtraPacks = parseInt(localStorage.getItem('toca_extra_packs')) || 0;

let tempExtraPacks = 0;
let isPricingExpanded = false;
let currentSimulatedUserRole = localStorage.getItem('toca_current_simulated_role') || 'Administrador';

let businesses = JSON.parse(localStorage.getItem('toca_businesses')) || [
  {
    id: 1,
    name: "Polos Mayoristas Lima",
    sector: "Venta de ropa al por mayor",
    description: "Prendas de algodón peruano oversize de alta calidad para marcas independientes.",
    tone: "Amigable",
    promotion: "Envío gratis a todo el Perú por compras de 1 docena o más",
    timezone: "America/Lima"
  },
  {
    id: 2,
    name: "Coolbox Express",
    sector: "Otro",
    description: "Dispositivos tecnológicos, audífonos, parlantes y gadgets para el día a día.",
    tone: "Directo",
    promotion: "10% de descuento en tu primera compra online",
    timezone: "America/Lima"
  }
];

let currentBusinessId = parseInt(localStorage.getItem('toca_current_business_id')) || 1;
let businessProfile = businesses.find(b => b.id === currentBusinessId) || businesses[0];

let teamAgents = JSON.parse(localStorage.getItem('toca_team_agents')) || [
  { name: "Javier Reyes", email: "javier@poloslima.com", role: "Administrador", status: "Activo" },
  { name: "Sofía Castro", email: "sofia@poloslima.com", role: "Agente", status: "Activo" }
];

// Auth — sesión real vía Supabase; fallback localStorage solo sin Supabase
let currentAuthUser = null;
let isLoggedIn = false;
const SUPER_ADMIN_EMAIL = 'fibeeconsultoradigital@gmail.com';
let adminUsers = [];

function isSuperAdmin() {
  return (
    currentAuthUser?.email?.toLowerCase() === SUPER_ADMIN_EMAIL.toLowerCase() ||
    currentSimulatedUserRole === 'SuperAdmin'
  );
}




// SIMULATED CLIENTS DATABASE (for local Admin Dashboard simulation)
const DEFAULT_ADMIN_CLIENTS = [
  { 
    id: 101, 
    name: "Carlos Slim", 
    email: "carlos@slimcorp.com", 
    businessName: "Slim Importaciones", 
    plan: "Panal", 
    copilot: true, 
    autopilot: false, 
    maxContacts: 200, 
    contactsCount: 142, 
    agentsCount: 2, 
    maxAgents: 3, 
    status: "Activo", 
    lastPaymentDate: "2026-06-10", 
    extraAgents: 0, 
    extraPacks: 0,
    agentsList: [
      { name: "Carlos Slim", email: "carlos@slimcorp.com", role: "Dueño" },
      { name: "Javier Reyes", email: "javier@slimcorp.com", role: "Agente" }
    ]
  },
  { 
    id: 102, 
    name: "María Pía", 
    email: "pia@organicwear.com", 
    businessName: "Organic Wear Peru", 
    plan: "Colmena", 
    copilot: true, 
    autopilot: true, 
    maxContacts: 600, 
    contactsCount: 420, 
    agentsCount: 6, 
    maxAgents: 10, 
    status: "Activo", 
    lastPaymentDate: "2026-06-12", 
    extraAgents: 0, 
    extraPacks: 0,
    agentsList: [
      { name: "María Pía", email: "pia@organicwear.com", role: "Dueño" },
      { name: "Luis Soto", email: "luis@organicwear.com", role: "Agente" },
      { name: "Sofía Castro", email: "sofia@organicwear.com", role: "Agente" }
    ]
  },
  { 
    id: 103, 
    name: "Roberto Gómez", email: "roberto@gomeztech.com", businessName: "Gómez Gadgets", plan: "Apiario", copilot: true, autopilot: true, maxContacts: 1000, contactsCount: 850, agentsCount: 12, maxAgents: 15, status: "Activo", lastPaymentDate: "2026-06-14", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Roberto Gómez", email: "roberto@gomeztech.com", role: "Dueño" },
      { name: "Lucía Fernández", email: "lucia@gomeztech.com", role: "Agente" }
    ]
  },
  { 
    id: 104, 
    name: "Sandra Bull", email: "sandra@sandra.com", businessName: "Sandra Boutique", plan: "Néctar", copilot: false, autopilot: false, maxContacts: 50, contactsCount: 12, agentsCount: 1, maxAgents: 1, status: "Activo", lastPaymentDate: "2026-06-01", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Sandra Bull", email: "sandra@sandra.com", role: "Dueño" }
    ]
  },
  { 
    id: 105, 
    name: "Juan Pérez", email: "juan@ferreteriaexpress.com", businessName: "Ferretería Express", plan: "Néctar", copilot: false, autopilot: false, maxContacts: 50, contactsCount: 45, agentsCount: 1, maxAgents: 1, status: "Vencido", lastPaymentDate: "2026-05-01", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Juan Pérez", email: "juan@ferreteriaexpress.com", role: "Dueño" }
    ]
  },
  { 
    id: 106, 
    name: "Ana María", email: "ana@calzadolima.pe", businessName: "Calzado Lima.pe", plan: "Panal", copilot: true, autopilot: false, maxContacts: 200, contactsCount: 180, agentsCount: 3, maxAgents: 5, status: "Activo", lastPaymentDate: "2026-06-18", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Ana María", email: "ana@calzadolima.pe", role: "Dueño" }
    ]
  },
  { 
    id: 107, 
    name: "Diego Maradona", email: "diego@maradonastore.com", businessName: "Maradona Sports", plan: "Colmena", copilot: true, autopilot: true, maxContacts: 600, contactsCount: 520, agentsCount: 8, maxAgents: 10, status: "Cancelado", lastPaymentDate: "2026-05-11", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Diego Maradona", email: "diego@maradonastore.com", role: "Dueño" }
    ]
  },
  { 
    id: 108, 
    name: "Elon Musk", email: "elon@teslatoys.la", businessName: "Tesla Toys Latam", plan: "Apiario", copilot: true, autopilot: true, maxContacts: 5000, contactsCount: 2450, agentsCount: 25, maxAgents: 50, status: "Activo", lastPaymentDate: "2026-06-20", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Elon Musk", email: "elon@teslatoys.la", role: "Dueño" }
    ]
  },
  { 
    id: 109, 
    name: "Steve Jobs", email: "steve@appletoys.la", businessName: "iToys Store", plan: "Panal", copilot: true, autopilot: false, maxContacts: 200, contactsCount: 99, agentsCount: 2, maxAgents: 3, status: "Activo", lastPaymentDate: "2026-06-21", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Steve Jobs", email: "steve@appletoys.la", role: "Dueño" }]
  },
  { 
    id: 110, 
    name: "Jeff Bezos", email: "jeff@rocketshop.com", businessName: "Rocket Logistics", plan: "Colmena", copilot: true, autopilot: true, maxContacts: 600, contactsCount: 590, agentsCount: 7, maxAgents: 10, status: "Activo", lastPaymentDate: "2026-06-19", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Jeff Bezos", email: "jeff@rocketshop.com", role: "Dueño" }]
  },
  { 
    id: 111, 
    name: "Bill Gates", email: "bill@microhard.pe", businessName: "MicroHard Peru", plan: "Néctar", copilot: false, autopilot: false, maxContacts: 50, contactsCount: 15, agentsCount: 1, maxAgents: 1, status: "Activo", lastPaymentDate: "2026-06-05", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Bill Gates", email: "bill@microhard.pe", role: "Dueño" }]
  },
  { 
    id: 112, 
    name: "Mark Zuckerberg", email: "mark@metasol.la", businessName: "Meta Soluciones", plan: "Apiario", copilot: true, autopilot: true, maxContacts: 8000, contactsCount: 6500, agentsCount: 40, maxAgents: 100, status: "Activo", lastPaymentDate: "2026-06-15", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Mark Zuckerberg", email: "mark@metasol.la", role: "Dueño" }]
  },
  { 
    id: 113, 
    name: "Luis Miguel", email: "luismi@elsol.mx", businessName: "El Sol Producciones", plan: "Panal", copilot: true, autopilot: false, maxContacts: 200, contactsCount: 110, agentsCount: 3, maxAgents: 5, status: "Vencido", lastPaymentDate: "2026-04-20", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Luis Miguel", email: "luismi@elsol.mx", role: "Dueño" }]
  },
  { 
    id: 114, 
    name: "Shakira Ripoll", email: "shak@waka.co", businessName: "Waka Waka Dance", plan: "Colmena", copilot: true, autopilot: true, maxContacts: 600, contactsCount: 450, agentsCount: 5, maxAgents: 8, status: "Activo", lastPaymentDate: "2026-06-11", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Shakira Ripoll", email: "shak@waka.co", role: "Dueño" }]
  },
  { 
    id: 115, 
    name: "Lionel Messi", email: "leo@intermiami.com", businessName: "La Pulga Academy", plan: "Panal", copilot: true, autopilot: false, maxContacts: 200, contactsCount: 195, agentsCount: 3, maxAgents: 4, status: "Activo", lastPaymentDate: "2026-06-17", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Lionel Messi", email: "leo@intermiami.com", role: "Dueño" }]
  },
  { 
    id: 116, 
    name: "Cristiano Ronaldo", email: "cr7@siuuu.com", businessName: "CR7 Fitness Latam", plan: "Apiario", copilot: true, autopilot: true, maxContacts: 3000, contactsCount: 2900, agentsCount: 15, maxAgents: 20, status: "Activo", lastPaymentDate: "2026-06-20", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Cristiano Ronaldo", email: "cr7@siuuu.com", role: "Dueño" }]
  },
  { 
    id: 117, 
    name: "Taylor Swift", email: "taylor@swifties.us", businessName: "Swiftie Merch Peru", plan: "Colmena", copilot: true, autopilot: true, maxContacts: 600, contactsCount: 380, agentsCount: 6, maxAgents: 8, status: "Cancelado", lastPaymentDate: "2026-05-15", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Taylor Swift", email: "taylor@swifties.us", role: "Dueño" }]
  },
  { 
    id: 118, 
    name: "Pedro Pascal", email: "pedro@pascalagency.cl", businessName: "Pascal Representaciones", plan: "Néctar", copilot: false, autopilot: false, maxContacts: 50, contactsCount: 8, agentsCount: 1, maxAgents: 1, status: "Activo", lastPaymentDate: "2026-06-03", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Pedro Pascal", email: "pedro@pascalagency.cl", role: "Dueño" }]
  }
];

let adminClients = JSON.parse(localStorage.getItem('toca_simulated_admin_clients')) || DEFAULT_ADMIN_CLIENTS;
// Forzar reset si falta la propiedad 'agentsList' en el primer cliente, cambia de longitud o no contiene todos los clientes nuevos
if (!adminClients[0] || adminClients[0].agentsList === undefined || adminClients.length !== DEFAULT_ADMIN_CLIENTS.length) {
  adminClients = DEFAULT_ADMIN_CLIENTS;
  localStorage.setItem('toca_simulated_admin_clients', JSON.stringify(adminClients));
}

let selectedAdminClientId = null;
let impersonatedClientId = JSON.parse(localStorage.getItem('toca_impersonated_client_id')) || null;

// Time constant mockup (simulation represents June 21, 2026)
const TODAY_STR = "2026-06-21";
const TODAY = new Date(TODAY_STR + "T00:00:00");

// ==========================================================================
