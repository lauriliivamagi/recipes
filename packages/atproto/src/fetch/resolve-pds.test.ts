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
      id: 'did:plc:abc',
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
      id: 'did:plc:abc',
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
    const doc: DidDocument = { id: 'did:plc:abc', service: [] };
    expect(() => pdsEndpointFromDidDocument(doc)).toThrow(
      /AtprotoPersonalDataServer/,
    );
  });
});

describe('resolveDidDocument', () => {
  it('fetches did:plc from the PLC directory', async () => {
    const mockDoc: DidDocument = {
      id: 'did:plc:abc',
      service: [
        {
          id: '#atproto_pds',
          type: 'AtprotoPersonalDataServer',
          serviceEndpoint: 'https://pds.example',
        },
      ],
    };
    const fetchImpl = async (url: string | URL) => {
      expect(String(url)).toBe('https://plc.directory/did:plc:abc');
      return new Response(JSON.stringify(mockDoc), { status: 200 });
    };
    const doc = await resolveDidDocument('did:plc:abc', {
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(doc.id).toBe('did:plc:abc');
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

  it('throws on HTTP failure', async () => {
    const fetchImpl = async () => new Response('not found', { status: 404 });
    await expect(
      resolveDidDocument('did:plc:abc', {
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
          id: 'did:plc:abc',
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
    const endpoint = await resolvePdsEndpoint('did:plc:abc', {
      fetchImpl: fetchImpl as typeof fetch,
    });
    expect(endpoint).toBe('https://pds.example');
  });
});
