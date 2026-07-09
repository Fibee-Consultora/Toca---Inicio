// STATE — contactos desde Supabase (PostgreSQL)
// ==========================================================================
let contacts = [];
let dbReady = false;

const SEED_CONTACTS = [];

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
  'Gratuito': { name: 'Plan Gratuito', tag: '🌱', businesses: 1, agents: 1, contacts: 5 },
  'Néctar': { name: 'Plan Néctar', tag: '🌸', businesses: 1, agents: 1, contacts: 50 },
  'Panal': { name: 'Plan Panal', tag: '🍯', businesses: 2, agents: 3, contacts: 200 },
  'Colmena': { name: 'Plan Colmena', tag: '🐝', businesses: 5, agents: 8, contacts: 600 },
  'Apiario': { name: 'Plan Apiario', tag: '👑', businesses: 999, agents: 999, contacts: 99999 }
};

let currentActivePlan = localStorage.getItem('toca_current_active_plan') || 'Gratuito';
let currentUserProfileName = localStorage.getItem('toca_user_profile_name') || 'Sin nombre';
let currentActiveWorkspaces = localStorage.getItem('toca_active_workspaces') ? localStorage.getItem('toca_active_workspaces').split(',') : null;
let purchasedExtraAgents = parseInt(localStorage.getItem('toca_extra_agents')) || 0;
let purchasedExtraPacks = parseInt(localStorage.getItem('toca_extra_packs')) || 0;

let tempExtraPacks = 0;
let isPricingExpanded = false;
let currentSimulatedUserRole = localStorage.getItem('toca_current_simulated_role') || 'Administrador';

let businesses = JSON.parse(localStorage.getItem('toca_businesses')) || [
  {
    id: 1,
    name: "Mi Negocio",
    sector: "Otro",
    description: "",
    tone: "Amigable",
    promotion: "",
    timezone: "America/Lima"
  }
];

let currentBusinessId = parseInt(localStorage.getItem('toca_current_business_id')) || 1;
let businessProfile = businesses.find(b => b.id === currentBusinessId) || businesses[0];

let teamAgents = JSON.parse(localStorage.getItem('toca_team_agents')) || [
  { name: "Dueño Local", email: "admin@toca.app", role: "Administrador", status: "Activo" }
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
    name: "Roberto Gómez", email: "roberto@gomeztech.com", businessName: "Gómez Gadgets", plan: "Apiario", copilot: true, maxContacts: 1000, contactsCount: 850, agentsCount: 12, maxAgents: 15, status: "Activo", lastPaymentDate: "2026-06-14", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Roberto Gómez", email: "roberto@gomeztech.com", role: "Dueño" },
      { name: "Lucía Fernández", email: "lucia@gomeztech.com", role: "Agente" }
    ]
  },
  { 
    id: 104, 
    name: "Sandra Bull", email: "sandra@sandra.com", businessName: "Sandra Boutique", plan: "Néctar", copilot: false, maxContacts: 50, contactsCount: 12, agentsCount: 1, maxAgents: 1, status: "Activo", lastPaymentDate: "2026-06-01", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Sandra Bull", email: "sandra@sandra.com", role: "Dueño" }
    ]
  },
  { 
    id: 105, 
    name: "Juan Pérez", email: "juan@ferreteriaexpress.com", businessName: "Ferretería Express", plan: "Néctar", copilot: false, maxContacts: 50, contactsCount: 45, agentsCount: 1, maxAgents: 1, status: "Vencido", lastPaymentDate: "2026-05-01", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Juan Pérez", email: "juan@ferreteriaexpress.com", role: "Dueño" }
    ]
  },
  { 
    id: 106, 
    name: "Ana María", email: "ana@calzadolima.pe", businessName: "Calzado Lima.pe", plan: "Panal", copilot: true, maxContacts: 200, contactsCount: 180, agentsCount: 3, maxAgents: 5, status: "Activo", lastPaymentDate: "2026-06-18", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Ana María", email: "ana@calzadolima.pe", role: "Dueño" }
    ]
  },
  { 
    id: 107, 
    name: "Diego Maradona", email: "diego@maradonastore.com", businessName: "Maradona Sports", plan: "Colmena", copilot: true, maxContacts: 600, contactsCount: 520, agentsCount: 8, maxAgents: 10, status: "Cancelado", lastPaymentDate: "2026-05-11", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Diego Maradona", email: "diego@maradonastore.com", role: "Dueño" }
    ]
  },
  { 
    id: 108, 
    name: "Elon Musk", email: "elon@teslatoys.la", businessName: "Tesla Toys Latam", plan: "Apiario", copilot: true, maxContacts: 5000, contactsCount: 2450, agentsCount: 25, maxAgents: 50, status: "Activo", lastPaymentDate: "2026-06-20", extraAgents: 0, extraPacks: 0,
    agentsList: [
      { name: "Elon Musk", email: "elon@teslatoys.la", role: "Dueño" }
    ]
  },
  { 
    id: 109, 
    name: "Steve Jobs", email: "steve@appletoys.la", businessName: "iToys Store", plan: "Panal", copilot: true, maxContacts: 200, contactsCount: 99, agentsCount: 2, maxAgents: 3, status: "Activo", lastPaymentDate: "2026-06-21", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Steve Jobs", email: "steve@appletoys.la", role: "Dueño" }]
  },
  { 
    id: 110, 
    name: "Jeff Bezos", email: "jeff@rocketshop.com", businessName: "Rocket Logistics", plan: "Colmena", copilot: true, maxContacts: 600, contactsCount: 590, agentsCount: 7, maxAgents: 10, status: "Activo", lastPaymentDate: "2026-06-19", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Jeff Bezos", email: "jeff@rocketshop.com", role: "Dueño" }]
  },
  { 
    id: 111, 
    name: "Bill Gates", email: "bill@microhard.pe", businessName: "MicroHard Peru", plan: "Néctar", copilot: false, maxContacts: 50, contactsCount: 15, agentsCount: 1, maxAgents: 1, status: "Activo", lastPaymentDate: "2026-06-05", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Bill Gates", email: "bill@microhard.pe", role: "Dueño" }]
  },
  { 
    id: 112, 
    name: "Mark Zuckerberg", email: "mark@metasol.la", businessName: "Meta Soluciones", plan: "Apiario", copilot: true, maxContacts: 8000, contactsCount: 6500, agentsCount: 40, maxAgents: 100, status: "Activo", lastPaymentDate: "2026-06-15", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Mark Zuckerberg", email: "mark@metasol.la", role: "Dueño" }]
  },
  { 
    id: 113, 
    name: "Luis Miguel", email: "luismi@elsol.mx", businessName: "El Sol Producciones", plan: "Panal", copilot: true, maxContacts: 200, contactsCount: 110, agentsCount: 3, maxAgents: 5, status: "Vencido", lastPaymentDate: "2026-04-20", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Luis Miguel", email: "luismi@elsol.mx", role: "Dueño" }]
  },
  { 
    id: 114, 
    name: "Shakira Ripoll", email: "shak@waka.co", businessName: "Waka Waka Dance", plan: "Colmena", copilot: true, maxContacts: 600, contactsCount: 450, agentsCount: 5, maxAgents: 8, status: "Activo", lastPaymentDate: "2026-06-11", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Shakira Ripoll", email: "shak@waka.co", role: "Dueño" }]
  },
  { 
    id: 115, 
    name: "Lionel Messi", email: "leo@intermiami.com", businessName: "La Pulga Academy", plan: "Panal", copilot: true, maxContacts: 200, contactsCount: 195, agentsCount: 3, maxAgents: 4, status: "Activo", lastPaymentDate: "2026-06-17", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Lionel Messi", email: "leo@intermiami.com", role: "Dueño" }]
  },
  { 
    id: 116, 
    name: "Cristiano Ronaldo", email: "cr7@siuuu.com", businessName: "CR7 Fitness Latam", plan: "Apiario", copilot: true, maxContacts: 3000, contactsCount: 2900, agentsCount: 15, maxAgents: 20, status: "Activo", lastPaymentDate: "2026-06-20", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Cristiano Ronaldo", email: "cr7@siuuu.com", role: "Dueño" }]
  },
  { 
    id: 117, 
    name: "Taylor Swift", email: "taylor@swifties.us", businessName: "Swiftie Merch Peru", plan: "Colmena", copilot: true, maxContacts: 600, contactsCount: 380, agentsCount: 6, maxAgents: 8, status: "Cancelado", lastPaymentDate: "2026-05-15", extraAgents: 0, extraPacks: 0,
    agentsList: [{ name: "Taylor Swift", email: "taylor@swifties.us", role: "Dueño" }]
  },
  { 
    id: 118, 
    name: "Pedro Pascal", email: "pedro@pascalagency.cl", businessName: "Pascal Representaciones", plan: "Néctar", copilot: false, maxContacts: 50, contactsCount: 8, agentsCount: 1, maxAgents: 1, status: "Activo", lastPaymentDate: "2026-06-03", extraAgents: 0, extraPacks: 0,
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

// Time constant mockup (simulation represents July 7, 2026)
const TODAY_STR = "2026-07-07";
const TODAY = new Date(TODAY_STR + "T00:00:00");

let currentAccountStatus = localStorage.getItem('toca_current_account_status') || 'Activo';
let currentLastPaymentDate = localStorage.getItem('toca_current_last_payment_date') || TODAY_STR;

// ==========================================================================
