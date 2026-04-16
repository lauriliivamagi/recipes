import { Agent, AtpAgent } from '@atproto/api';

export interface AppPasswordSession {
  service: string;
  did: string;
  handle: string;
  accessJwt: string;
  refreshJwt: string;
  active: boolean;
}

export interface LoginWithAppPasswordArgs {
  service: string;
  identifier: string;
  password: string;
}

export interface LoginResult {
  agent: Agent;
  session: AppPasswordSession;
}

/**
 * Log in using an app password via `com.atproto.server.createSession`. Returns
 * a bound `Agent` and a persistable session snapshot.
 *
 * Used by non-browser clients (Chrome extension, CLI) where AT Protocol OAuth
 * is unavailable. Tokens are long-lived bearer credentials and are NOT
 * DPoP-bound; store carefully.
 */
export async function loginWithAppPassword(
  args: LoginWithAppPasswordArgs,
): Promise<LoginResult> {
  const atpAgent = new AtpAgent({ service: args.service });
  const res = await atpAgent.login({
    identifier: args.identifier,
    password: args.password,
  });
  const session: AppPasswordSession = {
    service: args.service,
    did: res.data.did,
    handle: res.data.handle,
    accessJwt: res.data.accessJwt,
    refreshJwt: res.data.refreshJwt,
    active: res.data.active ?? true,
  };
  return { agent: atpAgent, session };
}

export interface ResumeAppPasswordSessionArgs {
  session: AppPasswordSession;
  /**
   * Callback invoked when tokens rotate during use (e.g. after a refresh).
   * Persist the new session so subsequent calls resume cleanly.
   */
  onSessionUpdate?: (session: AppPasswordSession) => void | Promise<void>;
}

export interface ResumeResult {
  agent: AtpAgent;
  session: AppPasswordSession;
}

/**
 * Rebuild an agent from a persisted app-password session. Uses AtpAgent's
 * built-in `resumeSession` which will transparently refresh on 401.
 */
export async function resumeAppPasswordSession(
  args: ResumeAppPasswordSessionArgs,
): Promise<ResumeResult> {
  let current: AppPasswordSession = args.session;

  const atpAgent = new AtpAgent({
    service: args.session.service,
    persistSession: (_evt, sessionData) => {
      if (!sessionData) return;
      const next: AppPasswordSession = {
        service: current.service,
        did: sessionData.did,
        handle: sessionData.handle,
        accessJwt: sessionData.accessJwt,
        refreshJwt: sessionData.refreshJwt,
        active: sessionData.active ?? true,
      };
      current = next;
      void args.onSessionUpdate?.(next);
    },
  });

  await atpAgent.resumeSession({
    did: args.session.did,
    handle: args.session.handle,
    accessJwt: args.session.accessJwt,
    refreshJwt: args.session.refreshJwt,
    active: args.session.active,
  });

  return { agent: atpAgent, session: current };
}
