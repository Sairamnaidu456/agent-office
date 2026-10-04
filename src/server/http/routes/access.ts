// Account administration for internal tools; privileges always come from the current session.
import type { Route } from '../router.js';
import { readBody, send } from '../util.js';

export const accessRoutes = {
  capabilities: {
    method: 'GET', path: '/api/access', auth: 'session',
    handle(ctx, { res, session }) {
      const me = ctx.meOf(session.account?.id);
      return send(res, 200, { me, capabilities: { manageAccounts: me.admin } });
    },
  },
  accounts: {
    method: 'GET', path: '/api/access/accounts', auth: 'session',
    handle(ctx, { res, session }) {
      if (!ctx.meOf(session.account?.id).admin) return send(res, 403, { error: 'Only admins can manage accounts' });
      return send(res, 200, ctx.accounts.state(ctx.onlineAccounts()));
    },
  },
  invites: {
    method: 'POST', path: '/api/access/invites', auth: 'session',
    async handle(ctx, { req, res, session }) {
      const me = ctx.meOf(session.account?.id);
      if (!me.admin) return send(res, 403, { error: 'Only admins can manage accounts' });
      if (!req.headers['content-type']?.toLowerCase().startsWith('application/json')) return send(res, 415, { error: 'Use application/json' });
      if (req.headers.origin) {
        try {
          if (new URL(req.headers.origin).host !== req.headers.host) return send(res, 403, { error: 'Origin not allowed' });
        } catch { return send(res, 403, { error: 'Origin not allowed' }); }
      }
      let body: unknown;
      try { body = JSON.parse(await readBody(req, 4096)); }
      catch { return send(res, 400, { error: 'Bad request' }); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) return send(res, 400, { error: 'Bad request' });
      if (!ctx.meOf(session.account?.id).admin) return send(res, 403, { error: 'Only admins can manage accounts' });
      const data = body as Record<string, unknown>;
      if (data.action === 'cancel') {
        if (typeof data.inviteId !== 'string') return send(res, 400, { error: 'inviteId is required' });
        if (!ctx.accounts.cancel(data.inviteId)) return send(res, 404, { error: 'Invite not found' });
        ctx.accountsChanged();
        return send(res, 200, { ok: true });
      }
      if (data.action !== 'create' || (data.role !== 'member' && data.role !== 'admin') ||
          (data.name !== undefined && (typeof data.name !== 'string' || data.name.length > 24))) {
        return send(res, 400, { error: 'Use action create, role member or admin, and an optional name up to 24 characters' });
      }
      const invite = ctx.accounts.invite(me.account?.name ?? "Shared-password admin", data.role, data.name as string | undefined);
      if (typeof invite === 'string') return send(res, 400, { error: invite });
      ctx.accountsChanged();
      return send(res, 200, { invite });
    },
  },
} satisfies Record<string, Route>;
