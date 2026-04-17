import { describe, expect, it } from 'vitest';
import {
  pdsEndpointFromDidDocument,
  resolveDidDocument,
  resolvePdsEndpoint,
  type DidDocument,
} from './resolve-pds.js';

describe('pdsEndpointFromDidDocument', () => {
  it('extracts serviceEndpoint from #atproto_pds service', () => {
    const doc: DidDocument = {
      id: 'did:plc:abcdefghijklmnopqrstuvwx',
      service: [
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'https://porcini.us-east.host.bsky.network',
        },
      ],
    };
    expect(pdsEndpointFromDidDocument(doc)).toBe(
      'https://porcini.us-east.host.bsky.network',
    );
  });

  it('accepts fully qualified id (did:web:example.com#atproto_pds)', () => {
    const doc: DidDocument = {
      id: 'did:web:example.com',
      service: [
        {
          id: 'did:web:example.com#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'https://pds.example.com',
        },
      ],
    };
    expect(pdsEndpointFromDidDocument(doc)).toBe('https://pds.example.com');
  });

  it('ignores non-PDS services', () => {
    const doc: DidDocument = {
      id: 'did:plc:abcdefghijklmnopqrstuvwx',
      service: [
        {
          id: '#other',
          type: 'SomethingElse',
          serviceEndpoint: 'https://nope.example',
        },
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'https://pds.example',
        },
      ],
    };
    expect(pdsEndpointFromDidDocument(doc)).toBe('https://pds.example');
  });

  it('throws when no PDS service is present', () => {
    const doc: DidDocument = { id: 'did:plc:abcdefghijklmnopqrstuvwx', service: [] };
    expect(() => pdsEndpointFromDidDocument(doc)).toThrow(
      /AtprotoPersonalDataServer/,
    );
  });

  it('rejects plaintext http endpoints on non-localhost hosts', () => {
    const doc: DidDocument = {
      id: 'did:web:evil.example',
      service: [
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'http://evil.example',
        },
      ],
    };
    expect(() => pdsEndpointFromDidDocument(doc)).toThrow(/plaintext/);
  });

  it.each([
    'http://127.0.0.1:8080',
    'http://10.0.0.5',
    'http://192.168.1.1',
    'http://169.254.169.254',
    'https://[::1]',
  ])('rejects private/loopback endpoint %s', (endpoint) => {
    const doc: DidDocument = {
      id: 'did:web:evil.example',
      service: [
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: endpoint,
        },
      ],
    };
    expect(() => pdsEndpointFromDidDocument(doc)).toThrow();
  });

  it('allows http://localhost for local dev', () => {
    const doc: DidDocument = {
      id: 'did:web:localhost',
      service: [
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'http://localhost:3000',
        },
      ],
    };
    expect(pdsEndpointFromDidDocument(doc)).toBe('http://localhost:3000');
  });

  it('rejects non-http(s) endpoints', () => {
    const doc: DidDocument = {
      id: 'did:web:evil.example',
      service: [
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'file:///etc/passwd',
        },
      ],
    };
    expect(() => pdsEndpointFromDidDocument(doc)).toThrow(/protocol/);
  });
});

describe('resolveDidDocument', () => {
  it('fetches did:plc from the PLC directory', async () => {
    const mockDoc: DidDocument = {
      id: 'did:plc:abcdefghijklmnopqrstuvwx',
      service: [
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'https://pds.example',
        },
      ],
    };
    const fetchImpl = async (url: string | URL) => {
      expect(String(url)).toBe('https://plc.directory/did:plc:abcdefghijklmnopqrstuvwx');
      return new Response(JSON.stringify(mockDoc), { status: 200 });
    };
    const doc = await resolveDidDocument('did:plc:abcdefghijklmnopqrstuvwx', {
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(doc.id).toBe('did:plc:abcdefghijklmnopqrstuvwx');
  });

  it('fetches did:web from .well-known/did.json', async () => {
    const mockDoc: DidDocument = {
      id: 'did:web:example.com',
      service: [],
    };
    const fetchImpl = async (url: string | URL) => {
      expect(String(url)).toBe('https://example.com/.well-known/did.json');
      return new Response(JSON.stringify(mockDoc), { status: 200 });
    };
    const doc = await resolveDidDocument('did:web:example.com', {
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(doc.id).toBe('did:web:example.com');
  });

  it('throws for unsupported DID methods', async () => {
    await expect(resolveDidDocument('did:key:z6Mk')).rejects.toThrow(
      /Unsupported DID method/,
    );
  });

  it.each([
    'did:plc:TOO-SHORT',
    'did:plc:has-invalid-chars-in-it!!',
    'did:plc:aaaaaaaaaaaaaaaaaaaaaaaa1', // 25 chars
  ])('rejects malformed did:plc %s', async (did) => {
    await expect(resolveDidDocument(did)).rejects.toThrow(/Malformed did:plc/);
  });

  it.each([
    'did:web:', // empty host
    'did:web:-leading-dash.example',
    'did:web:has spaces.example',
    'did:web:example.com/some/path',
  ])('rejects malformed did:web %s', async (did) => {
    await expect(resolveDidDocument(did)).rejects.toThrow(/Malformed did:web/);
  });

  it.each([
    'did:web:localhost',
    'did:web:127.0.0.1',
    'did:web:10.0.0.5',
    'did:web:192.168.1.1',
    'did:web:169.254.169.254',
  ])('rejects did:web with private/loopback host %s', async (did) => {
    await expect(resolveDidDocument(did)).rejects.toThrow(
      /private\/loopback/,
    );
  });

  it('throws on HTTP failure', async () => {
    const fetchImpl = async () => new Response('not found', { status: 404 });
    await expect(
      resolveDidDocument('did:plc:abcdefghijklmnopqrstuvwx', {
        fetchImpl: fetchImpl as typeof fetch,
      }),
    ).rejects.toThrow(/HTTP 404/);
  });
});

describe('resolvePdsEndpoint', () => {
  it('combines resolveDidDocument and pdsEndpointFromDidDocument', async () => {
    const fetchImpl = async () =>
      new Response(
        JSON.stringify({
          id: 'did:plc:abcdefghijklmnopqrstuvwx',
          service: [
            {
              id: '#atproto_pds',
              type: 'AtprotoPersonalDataServer',
              serviceEndpoint: 'https://pds.example',
            },
          ],
        }),
        { status: 200 },
      );
    const endpoint = await resolvePdsEndpoint('did:plc:abcdefghijklmnopqrstuvwx', {
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(endpoint).toBe('https://pds.example');
  });
});
