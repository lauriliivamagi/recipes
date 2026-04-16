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

/**
 * Resolve a DID to its DID document.
 *
 * - `did:plc:*` → GET `{plcDirectory}/{did}`
 * - `did:web:{domain}` → GET `https://{domain}/.well-known/did.json`
 */
export async function resolveDidDocument(
  did: string,
  options: ResolvePdsOptions = {},
): Promise<DidDocument> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const plcDirectory = options.plcDirectory ?? DEFAULT_PLC_DIRECTORY;

  let url: string;
  if (did.startsWith('did:plc:')) {
    url = `${plcDirectory}/${did}`;
  } else if (did.startsWith('did:web:')) {
    const domain = did.slice('did:web:'.length).replace(/:/g, '/');
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
        return endpoint;
      }
    }
  }
  throw new Error(`No AtprotoPersonalDataServer service found in DID document ${doc.id}`);
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
