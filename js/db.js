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
    if (contact.context && contact.context.trim()) {
      await addHistoryItem(data.id, { date: '15 JUN.', text: contact.context });
    }
    await addHistoryItem(data.id, { date: '10 JUN.', text: 'Contacto inicial registrado en el sistema Toca.' });
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

  window.TocaDB = {
    isConfigured,
    init,
    getClient,
    signInWithGoogle,
    signOut,
    getSession,
    onAuthStateChange,
    loadContacts,
    insertContact,
    updateContact,
    deleteContact,
    addHistoryItem,
  };
})();
