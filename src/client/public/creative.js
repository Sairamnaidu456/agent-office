const $ = id => document.getElementById(id);
const roles = { creativeLead: 'Creative Lead', internalEngineer: 'Office Engineer', qa: 'Creative QA' };
let socket;
let admin = false;
const node = (tag, text) => Object.assign(document.createElement(tag), { textContent: text });
const status = (text, error = false) => { $('status').textContent = text; $('status').className = error ? 'error' : ''; };
async function api(path, body) {
  const res = await fetch(path, { ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  if (res.status === 401) { location.assign('/login'); throw new Error('Sign in to continue'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
  return data;
}
function send(message) {
  if (!admin || socket?.readyState !== WebSocket.OPEN) throw new Error('Account administration is disconnected. Reload to reconnect.');
  socket.send(JSON.stringify(message));
}
function action(text, run) {
  const button = node('button', text);
  button.type = 'button';
  button.onclick = () => { try { run(); } catch (e) { status(e.message, true); } };
  return button;
}
function accounts(state) {
  $('accounts').replaceChildren(...state.accounts.map(a => {
    const row = node('li', `${a.name} · ${a.role} · ${a.online ? 'online' : 'offline'} `);
    row.append(action(a.role === 'admin' ? 'Make member' : 'Make admin', () => {
      if (confirm(`Change ${a.name} to ${a.role === 'admin' ? 'member' : 'administrator'}?`)) send({ t: 'accounts.role', accountId: a.id, role: a.role === 'admin' ? 'member' : 'admin' });
    }), action('Revoke access', () => {
      if (confirm(`Revoke ${a.name}'s account?`)) send({ t: 'accounts.revoke', accountId: a.id });
    }));
    return row;
  }));
  if (!state.accounts.length) $('accounts').append(node('li', 'No individual accounts yet. Create an admin account for yourself before disabling shared login.'));
  $('invites').replaceChildren(...state.invites.map(invite => {
    const row = node('li', `${invite.name ?? 'Unnamed invite'} · ${invite.role} · expires ${new Date(invite.expiresAt).toLocaleDateString()} `);
    row.append(action('Cancel invite', () => send({ t: 'accounts.cancel', inviteId: invite.id })));
    return row;
  }));
  $('shared').textContent = `Shared-password login is ${state.sharedPassword ? 'enabled (grants admin privileges)' : 'disabled'}. Manage shared login in the office’s Accounts settings.`;
}
async function refresh() {
  if (document.hidden) return;
  try {
    const state = await api('/api/boss/state');
    $('team').replaceChildren(...Object.entries(roles).map(([key, title]) => {
      const worker = state.workers.find(w => w.id === state.roles[key]);
      const card = node('article', ''); card.className = 'card';
      card.append(node('h2', title), node('p', worker ? `${worker.name} · ${worker.deskId}` : 'No desk assigned'));
      const badge = node('span', worker?.status ?? 'Not seated'); badge.className = 'badge'; card.append(badge);
      if (worker) {
        card.append(node('p', worker.activity ?? worker.task?.name ?? 'No activity reported'));
        const terminal = node('a', 'Open office terminals ↗'); terminal.href = '/lite'; card.append(terminal);
      }
      return card;
    }));
    $('tickets').replaceChildren(...state.tickets.map(t => {
      const row = node('li', `${t.title} · ${t.status}`);
      if (t.deliveryError) row.append(node('p', t.deliveryError));
      if (t.notes) row.append(node('p', t.notes));
      return row;
    }));
    if (!state.tickets.length) $('tickets').append(node('li', 'No internal tickets yet.'));
    status(`Connected · Agent terminal mode: ${state.permissions.mode}. Running workers retain their launch settings.`);
    $('freshness').textContent = `Last checked ${new Date().toLocaleTimeString()}.`;
  } catch (e) { status(`Could not refresh the office: ${e.message}. Boss controls must be enabled in the running release.`, true); }
}
$('ticket-form').onsubmit = async event => {
  event.preventDefault(); const form = event.currentTarget; const button = form.querySelector('button'); button.disabled = true;
  try {
    const data = new FormData(form);
    await api('/api/boss/tickets', { title: data.get('title'), description: data.get('description') });
    form.reset(); await refresh();
  } catch (e) { status(e.message, true); } finally { button.disabled = false; }
};
$('invite-form').onsubmit = event => {
  event.preventDefault();
  try {
    const data = new FormData(event.currentTarget);
    send({ t: 'accounts.invite', name: data.get('name')?.trim() || undefined, role: data.get('role') });
    $('invite-result').textContent = 'Creating invitation…';
  } catch (e) { status(e.message, true); }
};
try {
  const { me } = await api('/api/whoami'); admin = me.admin;
  if (admin) {
    $('employee-section').hidden = false;
    socket = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`);
    socket.onmessage = event => {
      const msg = JSON.parse(event.data);
      if (msg.t === 'welcome') send({ t: 'accounts.get' });
      if (msg.t === 'accounts') accounts(msg.state);
      if (msg.t === 'accounts.invited') {
        $('invite-result').replaceChildren();
        if (msg.error) $('invite-result').textContent = msg.error;
        else if (msg.invite) {
          const link = node('a', 'Single-use invite link (private)'); link.href = `/join#${msg.invite.token}`;
          $('invite-result').append(link, node('p', 'Copy this link privately to the intended employee.'));
        }
      }
      if (msg.t === 'me' && !msg.me.admin) { admin = false; $('employee-section').hidden = true; $('invite-result').replaceChildren(); }
      if (msg.t === 'toast' && msg.level === 'warn') status(msg.text, true);
    };
    socket.onclose = () => { $('employee-section').hidden = true; $('invite-result').replaceChildren(); status('Account administration disconnected. Reload to reconnect.', true); };
  } else {
    $('ticket-form').hidden = true;
    status('This page requires an administrator account.', true);
  }
} catch (e) { status(e.message, true); }
if (admin) { await refresh(); setInterval(refresh, 10000); }
