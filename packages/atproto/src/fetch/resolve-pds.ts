import { Agent } from '@atproto/api';

export interface DidDocument {
  id: string;
  service?: Array<{
    id: string;
    type: string;
    serviceEndpoint: string | string[];
  }>;
}

export interface ResolvePdsOptions {
  /** Override the PLC directory endpoint (default: https://plc.directory). */
  plcDirectory?: string;
  /** Provide a fetch impl (for testing). */
  fetchImpl?: typeof fetch;
}

const DEFAULT_PLC_DIRECTORY = 'https://plc.directory';

// did:plc per spec: `did:plc:` followed by 24 base32 chars (rfc4648). Accept
// lowercase only — PLC IDs are always lowercase.
const DID_PLC_REGEX = /^did:plc:[a-z2-7]{24}$/;
// did:web per spec: each domain label is [A-Za-z0-9-]+ (no leading/trailing dash);
// optional percent-encoded port as `%3A<digits>`. No path components.
const DID_WEB_REGEX =
  /^did:web:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*(?:%3A\d{1,5})?$/i;

const PRIVATE_HOST_REGEXES: RegExp[] = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./, // link-local (incl. AWS IMDSv1 169.254.169.254)
  /^0\./,
  /^::1$/,
  /^\[::1\]$/,
  /^fc[0-9a-f]{2}:/i,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

function isPrivateHost(host: string): boolean {
  const stripped = host.replace(/^\[|\]$/g, '');
  return PRIVATE_HOST_REGEXES.some((re) => re.test(stripped));
}

/**
 * Resolve a DID to its DID document.
 *
 * - `did:plc:*` → GET `{plcDirectory}/{did}`
 * - `did:web:{domain}` → GET `https://{domain}/.well-known/did.json`
 *
 * Rejects malformed DIDs and `did:web` hosts that resolve to private/loopback
 * address ranges to prevent a caller-supplied DID from being used as a
 * browser-side SSRF vector into the user's local network.
 */
export async function resolveDidDocument(
  did: string,
  options: ResolvePdsOptions = {},
): Promise<DidDocument> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const plcDirectory = options.plcDirectory ?? DEFAULT_PLC_DIRECTORY;

  let url: string;
  if (did.startsWith('did:plc:')) {
    if (!DID_PLC_REGEX.test(did)) {
      throw new Error(`Malformed did:plc identifier: ${did}`);
    }
    url = `${plcDirectory}/${did}`;
  } else if (did.startsWith('did:web:')) {
    if (!DID_WEB_REGEX.test(did)) {
      throw new Error(`Malformed did:web identifier: ${did}`);
    }
    const raw = did.slice('did:web:'.length);
    const hostPart = raw.split('%3A')[0]!.toLowerCase();
    if (isPrivateHost(hostPart)) {
      throw new Error(`Refusing to resolve did:web with private/loopback host: ${did}`);
    }
    const domain = raw.replace(/%3A/gi, ':');
    url = `https://${domain}/.well-known/did.json`;
  } else {
    throw new Error(`Unsupported DID method: ${did}`);
  }

  const res = await fetchImpl(url);
  if (!res.ok) {
    throw new Error(`Failed to resolve DID document for ${did}: HTTP ${res.status}`);
  }
  return (await res.json()) as DidDocument;
}

/**
 * Extract the PDS service endpoint URL from a DID document.
 *
 * Looks for a service entry whose `id` ends in `#atproto_pds` and whose
 * `type` is `AtprotoPersonalDataServer` (per atproto/specs/did).
 *
 * Rejects endpoints that are not `https://` (except `http://localhost` for
 * local dev) or point at private/loopback networks — a caller-controlled DID
 * document must not be able to redirect the browser's requests at the user's
 * own LAN.
 */
export function pdsEndpointFromDidDocument(doc: DidDocument): string {
  const services = doc.service ?? [];
  for (const svc of services) {
    const idEndsMatch = svc.id === '#atproto_pds' || svc.id.endsWith('#atproto_pds');
    if (idEndsMatch && svc.type === 'AtprotoPersonalDataServer') {
      const endpoint = Array.isArray(svc.serviceEndpoint)
        ? svc.serviceEndpoint[0]
        : svc.serviceEndpoint;
      if (typeof endpoint === 'string' && endpoint.length > 0) {
        assertSafeEndpoint(endpoint, doc.id);
        return endpoint;
      }
    }
  }
  throw new Error(`No AtprotoPersonalDataServer service found in DID document ${doc.id}`);
}

function assertSafeEndpoint(endpoint: string, didId: string): void {
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error(`Malformed PDS endpoint in DID document ${didId}: ${endpoint}`);
  }
  // Only bare `localhost` is treated as a dev allowance. `127.0.0.1` and other
  // loopback addresses fall through to the private-host check, so an attacker
  // cannot redirect the browser's requests at the user's own machine.
  const isLocalhost = parsed.hostname === 'localhost';
  if (parsed.protocol === 'http:' && !isLocalhost) {
    throw new Error(
      `Refusing plaintext PDS endpoint in DID document ${didId}: ${endpoint}`,
    );
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    throw new Error(
      `Unsupported PDS endpoint protocol in DID document ${didId}: ${endpoint}`,
    );
  }
  if (!isLocalhost && isPrivateHost(parsed.hostname)) {
    throw new Error(
      `Refusing PDS endpoint with private/loopback host in DID document ${didId}: ${endpoint}`,
    );
  }
}

/**
 * Convenience: resolve a DID to its PDS endpoint URL.
 */
export async function resolvePdsEndpoint(
  did: string,
  options?: ResolvePdsOptions,
): Promise<string> {
  const doc = await resolveDidDocument(did, options);
  return pdsEndpointFromDidDocument(doc);
}

/**
 * Build an unauthenticated `Agent` pointed at the given DID's PDS. Suitable
 * for public reads (`com.atproto.repo.listRecords`, `getRecord`) which do not
 * require auth per the atproto spec.
 */
export async function agentForDid(
  did: string,
  options?: ResolvePdsOptions,
): Promise<Agent> {
  const endpoint = await resolvePdsEndpoint(did, options);
  return new Agent(endpoint);
}
