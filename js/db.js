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

  async function safeFetch(path, options = {}) {
    const client = getClient();
    const sessionRes = await client.auth.getSession();
    const jwt = sessionRes.data.session?.access_token;
    
    const headers = {
      "apikey": window.SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      ...options.headers
    };
    if (jwt) {
      headers["Authorization"] = `Bearer ${jwt}`;
    }
    
    const res = await fetch(`${window.SUPABASE_URL}/rest/v1/${path}`, {
      ...options,
      headers
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`HTTP ${res.status}: ${txt}`);
    }
    if (res.status === 204) return null;
    return await res.json();
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
    let plan = dbPlan || 'Gratuito';
    let extraAgents = 0;
    let extraPacks = 0;
    let status = 'Activo';
    let lastPaymentDate = '2026-07-01';
    let factura = true;
    let activeWorkspaces = null;
    
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
        } else if (part.startsWith('active_workspaces:')) {
          activeWorkspaces = part.substring(18).split(',').filter(x => x.trim());
        }
      }
    } else {
      plan = dbPlan || 'Gratuito';
      status = 'Activo';
      lastPaymentDate = '2026-07-01';
      factura = true;
    }

    return { name, plan, extraAgents, extraPacks, status, lastPaymentDate, factura, activeWorkspaces };
  }

  async function loadMyProfile() {
    const { data: { user } } = await getClient().auth.getUser();
    if (!user) return null;
    
    let data = null;
    const { data: selectData, error } = await client
      .from('profiles')
      .select('id, email, full_name, avatar_url, plan, created_at, last_session_id')
      .eq('id', user.id)
      .maybeSingle();
      
    if (error) {
      console.warn("Error loading profile with last_session_id, attempting fallback select:", error);
      const { data: fallbackData, error: fallbackError } = await client
        .from('profiles')
        .select('id, email, full_name, avatar_url, plan, created_at')
        .eq('id', user.id)
        .maybeSingle();
      if (fallbackError) throw fallbackError;
      data = fallbackData;
    } else {
      data = selectData;
    }
    
    if (data) {
      window.lastLoadedRawProfile = { full_name: data.full_name, plan: data.plan };
      console.log("TOCA_DEBUG: loaded raw profiles data:", { full_name: data.full_name, plan: data.plan });
      const parsed = parseDbProfile(data.full_name, data.plan);
      console.log("TOCA_DEBUG: resolved profile parsed:", parsed);
      data.full_name = parsed.name;
      data.plan = parsed.plan;
      data.extra_agents = parsed.extraAgents;
      data.extra_packs = parsed.extraPacks;
      data.status = parsed.status;
      data.last_payment_date = parsed.lastPaymentDate;
      data.factura = parsed.factura;
      data.active_workspaces = parsed.activeWorkspaces;
    }
    return data;
  }

  async function loadAllProfiles() {
    // Intentar llamar a RPC get_all_users para sincronización absoluta con auth.users
    const { data, error } = await client.rpc('get_all_users');
    if (!error) {
      if (data) {
        data.forEach(row => {
          row.raw_full_name = row.u_full_name; // Guardar el original con metadata
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
        row.raw_full_name = row.full_name; // Guardar el original con metadata
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
    let activeWorkspaces = '';

    for (let i = 1; i < parts.length; i++) {
      if (parts[i].startsWith('agents:')) extraAgents = parseInt(parts[i].substring(7)) || 0;
      else if (parts[i].startsWith('packs:')) extraPacks = parseInt(parts[i].substring(6)) || 0;
      else if (parts[i].startsWith('status:')) status = parts[i].substring(7);
      else if (parts[i].startsWith('pay:')) lastPaymentDate = parts[i].substring(4);
      else if (parts[i].startsWith('factura:')) factura = parts[i].substring(8) === 'true';
      else if (parts[i].startsWith('active_workspaces:')) activeWorkspaces = parts[i].substring(18);
    }

    let validDbPlan = planName;
    if (validDbPlan === 'Gratuito') {
      validDbPlan = 'Néctar';
    }

    const activeWorkspacesStr = activeWorkspaces ? `|active_workspaces:${activeWorkspaces}` : '';
    const formattedName = `${fullName || 'Sin nombre'}|plan:${planName}|agents:${extraAgents}|packs:${extraPacks}|status:${status}|pay:${lastPaymentDate}|factura:${factura}${activeWorkspacesStr}`;

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
    const client = getClient();
    const { data: userRes } = await client.auth.getUser();
    const user = userRes?.user;
    if (!user) return [];

    // 1. Invocación limpia mediante RPC SECURITY DEFINER
    try {
      const { data: rpcData, error: rpcError } = await client.rpc('get_user_workspaces');
      if (!rpcError && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
        let mapped = rpcData.map(w => ({
          id: w.id,
          name: w.name,
          sector: w.sector,
          description: w.description,
          tone: w.tone,
          promotion: w.promotion,
          timezone: w.timezone,
          owner_id: w.owner_id,
          _role: w.member_role,
          _status: w.member_status,
          _isPending: w.is_pending === true
        }));

        // Si el usuario tiene invitaciones a otros espacios, ocultar el 'Mi negocio' por defecto
        const hasInvited = mapped.some(w => w.owner_id !== user.id || (w._role && w._role !== 'Propietario'));
        if (hasInvited) {
          mapped = mapped.filter(w => {
            if (w.owner_id !== user.id || (w._role && w._role !== 'Propietario')) return true;
            const normName = (w.name || '').trim().toLowerCase();
            return normName !== 'mi negocio';
          });
        }

        return mapped;
      }
    } catch (rpcErr) {
      console.warn("RPC get_user_workspaces fallback warning:", rpcErr);
    }

    // 2. Fallback estándar si el RPC no retorna datos
    const email = user.email ? user.email.toLowerCase() : '';

    // Vincular invitaciones pendientes automáticamente si coincide el correo del usuario
    if (email && user.id) {
      try {
        await claimPendingInvitations(email, user.id);
      } catch (claimErr) {
        console.warn("Auto claim invitations error:", claimErr);
      }
    }

    const { data: ownedData, error: ownedError } = await client
      .from('workspaces')
      .select('*')
      .order('created_at');
    if (ownedError) console.warn("Error loading owned workspaces:", ownedError);

    let list = ownedData || [];

    // Query workspace_members for user (active or pending)
    const { data: memberData } = await client
      .from('workspace_members')
      .select('id, workspace_id, role, status, invited_by')
      .or(`user_id.eq.${user.id},invite_email.ilike.${email}`);

    // Query workspace_team for user (active or pending)
    const { data: teamData } = await client
      .from('workspace_team')
      .select('id, workspace_id, role, status')
      .or(`user_id.eq.${user.id},email.ilike.${email}`);

    const candidateMap = new Map();
    if (memberData) {
      memberData.forEach(m => {
        if (m.workspace_id) {
          candidateMap.set(String(m.workspace_id), {
            memberId: m.id,
            role: m.role || 'Colaborador',
            status: m.status || 'Pendiente',
            invitedBy: m.invited_by || null
          });
        }
      });
    }
    if (teamData) {
      teamData.forEach(t => {
        if (t.workspace_id && !candidateMap.has(String(t.workspace_id))) {
          candidateMap.set(String(t.workspace_id), {
            memberId: null,
            role: t.role || 'Colaborador',
            status: t.status || 'Pendiente',
            invitedBy: null
          });
        }
      });
    }

    for (const [wsId, info] of candidateMap.entries()) {
      if (!list.some(w => String(w.id) === wsId)) {
        const { data: wsDirect } = await client
          .from('workspaces')
          .select('*')
          .eq('id', wsId)
          .maybeSingle();

        if (wsDirect) {
          wsDirect._role = info.role;
          wsDirect._status = info.status;
          wsDirect._isPending = (info.status === 'Pendiente');
          wsDirect._memberId = info.memberId;
          list.push(wsDirect);

          // Cargar también todos los demás espacios pertenecientes al mismo propietario invitado
          if (wsDirect.owner_id && wsDirect.owner_id !== user.id) {
            const { data: siblingWorkspaces } = await client
              .from('workspaces')
              .select('*')
              .eq('owner_id', wsDirect.owner_id);

            if (siblingWorkspaces && siblingWorkspaces.length > 0) {
              siblingWorkspaces.forEach(sw => {
                if (!list.some(w => String(w.id) === String(sw.id))) {
                  sw._role = info.role || 'Colaborador';
                  sw._status = 'Activo';
                  sw._isPending = false;
                  list.push(sw);
                }
              });
            }
          }
        } else if (info.invitedBy && info.invitedBy !== user.id) {
          // Si wsDirect nulo pero tenemos invitedBy, cargar todos los espacios del dueño invitador
          const { data: siblingWorkspaces } = await client
            .from('workspaces')
            .select('*')
            .eq('owner_id', info.invitedBy);

          if (siblingWorkspaces && siblingWorkspaces.length > 0) {
            siblingWorkspaces.forEach(sw => {
              if (!list.some(w => String(w.id) === String(sw.id))) {
                sw._role = info.role || 'Colaborador';
                sw._status = info.status || 'Activo';
                sw._isPending = (info.status === 'Pendiente');
                list.push(sw);
              }
            });
          }
        } else {
          let resolvedName = 'Espacio de Trabajo';
          if (window.pendingWorkspaceInvitations && Array.isArray(window.pendingWorkspaceInvitations)) {
            const match = window.pendingWorkspaceInvitations.find(i => String(i.workspace_id) === String(wsId));
            if (match && match.workspaces && match.workspaces.name) {
              resolvedName = match.workspaces.name;
            }
          }
          list.push({
            id: wsId,
            name: resolvedName,
            sector: 'Colaborativo',
            _role: info.role,
            _status: info.status,
            _isPending: (info.status === 'Pendiente'),
            _memberId: info.memberId
          });
        }
      }
    }

    return list;
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

  async function loadTeamMembers(workspaceId) {
    const client = getClient();
    const { data: teamData, error } = await client
      .from('workspace_team')
      .select('*')
      .eq('workspace_id', workspaceId);
    if (error) throw error;

    const { data: memberData } = await client
      .from('workspace_members')
      .select('invite_email, user_id, status, role')
      .eq('workspace_id', workspaceId);

    let members = teamData || [];
    if (memberData && memberData.length > 0) {
      members = members.map(t => {
        const matchingMember = memberData.find(m => 
          (m.invite_email && m.invite_email.toLowerCase() === (t.email || '').toLowerCase()) ||
          (m.user_id && t.user_id && m.user_id === t.user_id)
        );
        if (matchingMember && matchingMember.status) {
          t.status = matchingMember.status;
        }
        return t;
      });
    }

    return members;
  }

  async function inviteTeamMember(invitation) {
    const client = getClient();
    let wsId = invitation.workspaceId;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!wsId || !uuidRegex.test(String(wsId))) {
      const { data: userRes } = await client.auth.getUser();
      if (userRes?.user) {
        const { data: wsList } = await client
          .from('workspaces')
          .select('id')
          .eq('owner_id', userRes.user.id)
          .limit(1);
        if (wsList && wsList.length > 0) {
          wsId = wsList[0].id;
        }
      }
    }

    if (!wsId || !uuidRegex.test(String(wsId))) {
      throw new Error("No se encontró un espacio de trabajo válido (UUID) para registrar la invitación.");
    }

    const { data: teamData, error: teamError } = await client
      .from('workspace_team')
      .insert({
        workspace_id: wsId,
        name: invitation.name,
        email: invitation.email,
        role: invitation.role,
        status: 'Pendiente'
      })
      .select()
      .single();
    if (teamError) throw teamError;

    const { error: memberError } = await client
      .from('workspace_members')
      .insert({
        workspace_id: wsId,
        user_id: null,
        invite_email: invitation.email,
        role: invitation.role,
        invited_by: invitation.invitedBy,
        status: 'Pendiente'
      });
    if (memberError) {
      await client.from('workspace_team').delete().eq('id', teamData.id);
      throw memberError;
    }
    return teamData;
  }

  async function claimPendingInvitations(email, userId) {
    const client = getClient();
    const cleanEmail = (email || '').trim().toLowerCase();
    const { data: pendingMembers, error: findError } = await client
      .from('workspace_members')
      .select('*')
      .ilike('invite_email', cleanEmail)
      .eq('status', 'Pendiente');
    if (findError) throw findError;

    if (pendingMembers && pendingMembers.length > 0) {
      for (const member of pendingMembers) {
        await client
          .from('workspace_members')
          .update({
            user_id: userId,
            status: 'Activo'
          })
          .eq('id', member.id);

        await client
          .from('workspace_team')
          .update({
            user_id: userId,
            status: 'Activo'
          })
          .eq('workspace_id', member.workspace_id)
          .ilike('email', cleanEmail);
      }
    }
  }

  async function deleteTeamMember(email, workspaceId) {
    const client = getClient();
    const cleanEmail = String(email || '').trim().toLowerCase();

    const { error: teamErr } = await client
      .from('workspace_team')
      .delete()
      .eq('workspace_id', workspaceId)
      .ilike('email', cleanEmail);
    if (teamErr) console.warn("deleteTeamMember workspace_team warning:", teamErr);

    const { error: memberErr } = await client
      .from('workspace_members')
      .delete()
      .eq('workspace_id', workspaceId)
      .ilike('invite_email', cleanEmail);
    if (memberErr) console.warn("deleteTeamMember workspace_members warning:", memberErr);
  }

  async function acceptInvitation(invId, userId) {
    const client = getClient();

    const { data: memberBefore } = await client
      .from('workspace_members')
      .select('*')
      .eq('id', invId)
      .maybeSingle();

    const { data: member, error } = await client
      .from('workspace_members')
      .update({ user_id: userId, status: 'Activo' })
      .eq('id', invId)
      .select()
      .maybeSingle();

    if (error) console.error("acceptInvitation update error:", error);

    const activeMember = member || memberBefore;
    if (activeMember && activeMember.workspace_id && activeMember.invite_email) {
      const cleanEmail = activeMember.invite_email.trim().toLowerCase();
      await client
        .from('workspace_team')
        .update({ user_id: userId, status: 'Activo' })
        .eq('workspace_id', activeMember.workspace_id)
        .ilike('email', cleanEmail);
    }
    return activeMember;
  }

  async function rejectInvitation(invId) {
    const client = getClient();
    const { error } = await client
      .from('workspace_members')
      .update({ status: 'Rechazado' })
      .eq('id', invId);
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
    safeFetch,
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
    loadTeamMembers,
    inviteTeamMember,
    deleteTeamMember,
    claimPendingInvitations,
    acceptInvitation,
    rejectInvitation,
    loadContacts,
    insertContact,
    updateContact,
    deleteContact,
    addHistoryItem,
    parseDbProfile,
  };
})();
