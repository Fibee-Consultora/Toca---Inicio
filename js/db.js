// ==========================================================================
// Capa de datos — Supabase / PostgreSQL
// ==========================================================================

(function () {
  let client = null;

  function isConfigured() {
    return (
      window.SUPABASE_URL &&
      window.SUPABASE_ANON_KEY &&
      window.SUPABASE_URL !== 'TU_URL_DE_SUPABASE' &&
      window.SUPABASE_ANON_KEY !== 'TU_ANON_KEY_DE_SUPABASE'
    );
  }

  function init() {
    if (!isConfigured()) {
      throw new Error('Configura js/supabase-config.js con tu URL y clave pública de Supabase.');
    }
    if (!window.supabase) {
      throw new Error('No se cargó la librería de Supabase.');
    }
    client = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    return client;
  }

  function getClient() {
    if (!client) init();
    return client;
  }

  async function signInWithGoogle() {
    const c = getClient();
    const redirectTo = `${window.location.origin}${window.location.pathname}`;
    return c.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
  }

  async function signOut() {
    return getClient().auth.signOut();
  }

  async function getSession() {
    return getClient().auth.getSession();
  }

  function onAuthStateChange(callback) {
    return getClient().auth.onAuthStateChange(callback);
  }

  function rowToContact(row, historyRows) {
    const history = (historyRows || [])
      .filter((h) => h.contact_id === row.id)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((h) => ({ date: h.date_label, text: h.text }));

    return {
      id: row.id,
      name: row.name,
      company: row.company || '',
      type: row.type,
      context: row.context || '',
      status: row.status,
      fu1: row.fu1 || '',
      fu2: row.fu2 || '',
      fu3: row.fu3 || '',
      whatsapp: row.whatsapp,
      suggestedDate: row.suggested_date || '',
      lastContacted: row.last_contacted || '',
      cycleDays: row.cycle_days,
      archived: row.archived || false,
      archivedDate: row.archived_date || '',
      waitingSince: row.waiting_since || '',
      daysWaiting: row.days_waiting,
      businessId: row.workspace_id,
      history,
    };
  }

  function contactToRow(contact) {
    return {
      name: contact.name,
      company: contact.company || null,
      type: contact.type,
      context: contact.context || null,
      status: contact.status,
      fu1: contact.fu1 || null,
      fu2: contact.fu2 || null,
      fu3: contact.fu3 || null,
      whatsapp: contact.whatsapp,
      suggested_date: contact.suggestedDate || null,
      last_contacted: contact.lastContacted || null,
      cycle_days: contact.cycle_days ?? contact.cycleDays ?? null,
      archived: !!contact.archived,
      archived_date: contact.archivedDate || null,
      waiting_since: contact.waitingSince || null,
      days_waiting: contact.days_waiting ?? contact.daysWaiting ?? null,
      workspace_id: contact.businessId || window.currentBusinessId || null,
    };
  }

  async function fetchHistoryForContacts(ids) {
    if (!ids.length) return [];
    const { data, error } = await client
      .from('contact_history')
      .select('*')
      .in('contact_id', ids)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function loadContacts() {
    const { data: rows, error } = await client.from('contacts').select('*').order('id');
    if (error) throw error;
    if (!rows || rows.length === 0) return [];
    const historyRows = await fetchHistoryForContacts(rows.map((r) => r.id));
    return rows.map((row) => rowToContact(row, historyRows));
  }

  async function insertContact(contact) {
    const { data, error } = await client.from('contacts').insert(contactToRow(contact)).select().single();
    if (error) throw error;
    
    // Formatear fecha actual de manera dinámica
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    const dateStr = `${dd}/${mm}/${yyyy}`;

    if (contact.context && contact.context.trim()) {
      await addHistoryItem(data.id, { date: dateStr, text: `Necesidad / Contexto inicial: "${contact.context}"` });
    }
    await addHistoryItem(data.id, { date: dateStr, text: `Contacto inicial registrado en el sistema. Origen: ${contact.leadSource || 'WhatsApp Directo'}.` });
    
    const historyRows = await fetchHistoryForContacts([data.id]);
    return rowToContact(data, historyRows);
  }

  async function updateContact(contact) {
    const { error } = await client.from('contacts').update(contactToRow(contact)).eq('id', contact.id);
    if (error) throw error;
  }

  async function deleteContact(id) {
    const { error } = await client.from('contacts').delete().eq('id', id);
    if (error) throw error;
  }

  async function addHistoryItem(contactId, item) {
    const { error } = await client.from('contact_history').insert({
      contact_id: contactId,
      date_label: item.date,
      text: item.text,
    });
    if (error) throw error;
  }

  function parseDbProfile(fullName, dbPlan) {
    let name = fullName || 'Sin nombre';
    let plan = dbPlan || 'Panal';
    let extraAgents = 0;
    let extraPacks = 0;
    let status = 'Activo';
    let lastPaymentDate = '2026-07-01';
    let factura = true;
    
    if (name.includes('|')) {
      const parts = name.split('|');
      name = parts[0].trim();
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.startsWith('plan:')) {
          plan = part.substring(5);
        } else if (part.startsWith('agents:')) {
          extraAgents = parseInt(part.substring(7)) || 0;
        } else if (part.startsWith('packs:')) {
          extraPacks = parseInt(part.substring(6)) || 0;
        } else if (part.startsWith('status:')) {
          status = part.substring(7);
        } else if (part.startsWith('pay:')) {
          lastPaymentDate = part.substring(4);
        } else if (part.startsWith('factura:')) {
          factura = part.substring(8) === 'true';
        }
      }
    } else {
      plan = 'Gratuito';
      status = 'Activo';
      lastPaymentDate = '2026-07-01';
      factura = true;
    }
    return { name, plan, extraAgents, extraPacks, status, lastPaymentDate, factura };
  }

  async function loadMyProfile() {
    const { data: { user } } = await getClient().auth.getUser();
    if (!user) return null;
    const { data, error } = await client
      .from('profiles')
      .select('id, email, full_name, avatar_url, plan, created_at, last_session_id')
      .eq('id', user.id)
      .maybeSingle();
    if (error) throw error;
    if (data) {
      const parsed = parseDbProfile(data.full_name, data.plan);
      data.full_name = parsed.name;
      data.plan = parsed.plan;
      data.extra_agents = parsed.extraAgents;
      data.extra_packs = parsed.extraPacks;
      data.status = parsed.status;
      data.last_payment_date = parsed.lastPaymentDate;
      data.factura = parsed.factura;
    }
    return data;
  }

  async function loadAllProfiles() {
    // Intentar llamar a RPC get_all_users para sincronización absoluta con auth.users
    const { data, error } = await client.rpc('get_all_users');
    if (!error) {
      if (data) {
        data.forEach(row => {
          // Mapear alias de retorno del RPC
          row.id = row.u_id;
          row.email = row.u_email;
          row.full_name = row.u_full_name;
          row.plan = row.u_plan;
          row.created_at = row.u_created_at;
          row.contacts_count = row.u_contacts_count;
          row.agents_count = row.u_agents_count;

          const parsed = parseDbProfile(row.full_name, row.plan);
          row.full_name = parsed.name;
          row.plan = parsed.plan;
          row.extra_agents = parsed.extraAgents;
          row.extra_packs = parsed.extraPacks;
          row.status = parsed.status;
          row.last_payment_date = parsed.lastPaymentDate;
          row.factura = parsed.factura;
        });
      }
      return data || [];
    }

    console.warn("RPC get_all_users no encontrado, cayendo en select directo de profiles:", error);
    const { data: selectData, error: selectError } = await client
      .from('profiles')
      .select('id, email, full_name, plan, created_at')
      .order('created_at', { ascending: false });
    if (selectError) throw selectError;
    if (selectData) {
      selectData.forEach(row => {
        const parsed = parseDbProfile(row.full_name, row.plan);
        row.full_name = parsed.name;
        row.plan = parsed.plan;
        row.extra_agents = parsed.extraAgents;
        row.extra_packs = parsed.extraPacks;
        row.status = parsed.status;
        row.last_payment_date = parsed.lastPaymentDate;
      });
    }
    return selectData || [];
  }

  async function updateUserPlan(userId, planStr, fullName) {
    const parts = planStr.split('|');
    const planName = parts[0] || 'Gratuito';
    let extraAgents = 0;
    let extraPacks = 0;
    let status = 'Activo';
    let lastPaymentDate = '2026-07-01';
    let factura = true;

    for (let i = 1; i < parts.length; i++) {
      if (parts[i].startsWith('agents:')) extraAgents = parseInt(parts[i].substring(7)) || 0;
      else if (parts[i].startsWith('packs:')) extraPacks = parseInt(parts[i].substring(6)) || 0;
      else if (parts[i].startsWith('status:')) status = parts[i].substring(7);
      else if (parts[i].startsWith('pay:')) lastPaymentDate = parts[i].substring(4);
      else if (parts[i].startsWith('factura:')) factura = parts[i].substring(8) === 'true';
    }

    let validDbPlan = planName;
    if (validDbPlan === 'Gratuito') {
      validDbPlan = 'Néctar';
    }

    const formattedName = `${fullName || 'Sin nombre'}|plan:${planName}|agents:${extraAgents}|packs:${extraPacks}|status:${status}|pay:${lastPaymentDate}|factura:${factura}`;

    const { error } = await client
      .from('profiles')
      .update({ 
        plan: validDbPlan, 
        full_name: formattedName,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);
    if (error) throw error;
  }

  async function loadWorkspaces() {
    const { data, error } = await getClient()
      .from('workspaces')
      .select('*')
      .order('created_at');
    if (error) throw error;
    return data || [];
  }

  async function insertWorkspace(workspace) {
    const { data, error } = await getClient()
      .from('workspaces')
      .insert(workspace)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async function updateWorkspace(workspace) {
    const { error } = await getClient()
      .from('workspaces')
      .update(workspace)
      .eq('id', workspace.id);
    if (error) throw error;
  }

  async function deleteWorkspace(id) {
    const { error } = await getClient()
      .from('workspaces')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  async function updateSessionToken(userId, token) {
    const { error } = await getClient()
      .from('profiles')
      .update({ last_session_id: token, updated_at: new Date().toISOString() })
      .eq('id', userId);
    if (error) throw error;
  }

  window.TocaDB = {
    isConfigured,
    init,
    getClient,
    signInWithGoogle,
    signOut,
    getSession,
    onAuthStateChange,
    loadMyProfile,
    loadAllProfiles,
    updateUserPlan,
    updateSessionToken,
    loadWorkspaces,
    insertWorkspace,
    updateWorkspace,
    deleteWorkspace,
    loadContacts,
    insertContact,
    updateContact,
    deleteContact,
    addHistoryItem,
  };
})();
