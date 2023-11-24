import {FileStorer} from './storer.js';
import {setupServer} from 'msw/node';
import {http, HttpResponse} from 'msw';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {rimraf} from 'rimraf';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

const server = setupServer(
  http.get(
    'http://localhost/resource-with-basic-auth.ttl',
    async ({request}) => {
      // Basic auth - base64-encoded representation of 'username' and 'password'
      const authorization = request.headers.get('Authorization');
      if (authorization !== 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=') {
        return new HttpResponse(null, {status: 401});
      }

      const data = await readFile('./fixtures/resource.ttl', 'utf-8');
      return new HttpResponse(data, {headers: {'Content-Type': 'text/turtle'}});
    }
  ),
  http.get(
    'http://localhost/resource-with-accept-header.ttl',
    async ({request}) => {
      // Simple string check, just for the test. The actual Accept header send by the client
      // is much richer (e.g. "application/n-quads,application/trig;q=0.95")
      const accept = request.headers.get('Accept');
      if (!accept?.startsWith('text/turtle')) {
        return new HttpResponse(null, {status: 406});
      }

      const data = await readFile('./fixtures/resource.ttl', 'utf-8');
      return new HttpResponse(data, {headers: {'Content-Type': 'text/turtle'}});
    }
  ),
  http.get('http://localhost/resource.ttl', async () => {
    const data = await readFile('./fixtures/resource.ttl', 'utf-8');
    return new HttpResponse(data, {headers: {'Content-Type': 'text/turtle'}});
  }),
  http.get(
    'http://localhost/deleted.ttl',
    async () => new HttpResponse(null, {status: 410})
  ),
  http.get(
    'http://localhost/error.ttl',
    async () => new HttpResponse(null, {status: 500})
  )
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('createFilenameFromIri', () => {
  it('creates a filename from an IRI', async () => {
    const store = new FileStorer({dir: './tmp/'});
    const filename = store.createFilenameFromIri('http://localhost/resource');

    expect(filename.endsWith('/b/0/d388f3dc1aaec96db5e05936bfb1aa0b.nt')).toBe(
      true
    );
  });
});

describe('save - with basic authentication', () => {
  const dir = './tmp/integration-test';

  beforeEach(async () => {
    await rimraf(dir);
  });

  it('emits an error if credentials are invalid when dereferencing', async () => {
    expect.assertions(1);

    const store = new FileStorer({
      dir,
      credentials: {
        type: 'basic-auth',
        username: 'badUsername',
        password: 'badPassword',
      },
    });

    store.on('error', (err: Error) => {
      expect(err.message).toEqual(
        `An error occurred when saving IRI http://localhost/resource-with-basic-auth.ttl: Could not retrieve http://localhost/resource-with-basic-auth.ttl (HTTP status 401):
empty response`
      );
    });

    await store.save({
      type: 'upsert',
      iri: 'http://localhost/resource-with-basic-auth.ttl',
    });
    await store.untilDone();
  });

  it('upserts a resource if credentials are valid when dereferencing', async () => {
    expect.assertions(2);

    const store = new FileStorer({
      dir,
      credentials: {
        type: 'basic-auth',
        username: 'username',
        password: 'password',
      },
    });

    store.on('upsert', (iri: string, filename: string) => {
      expect(iri).toEqual('http://localhost/resource-with-basic-auth.ttl');
      expect(existsSync(filename)).toBe(true);
    });

    await store.save({
      type: 'upsert',
      iri: 'http://localhost/resource-with-basic-auth.ttl',
    });
    await store.untilDone();
  });
});

describe('save - with headers', () => {
  const dir = './tmp/integration-test';

  beforeEach(async () => {
    await rimraf(dir);
  });

  it('emits an error if HTTP header is invalid when dereferencing', async () => {
    expect.assertions(1);

    const store = new FileStorer({
      dir,
      headers: {
        Accept: 'bad/value',
      },
    });

    store.on('error', (err: Error) => {
      expect(err.message).toEqual(
        `An error occurred when saving IRI http://localhost/resource-with-accept-header.ttl: Could not retrieve http://localhost/resource-with-accept-header.ttl (HTTP status 406):
empty response`
      );
    });

    await store.save({
      type: 'upsert',
      iri: 'http://localhost/resource-with-accept-header.ttl',
    });
    await store.untilDone();
  });

  it('upserts a resource with valid HTTP header when dereferencing', async () => {
    expect.assertions(2);

    const store = new FileStorer({
      dir,
      headers: {
        Accept: 'text/turtle',
      },
    });

    store.on('upsert', (iri: string, filename: string) => {
      expect(iri).toEqual('http://localhost/resource-with-accept-header.ttl');
      expect(existsSync(filename)).toBe(true);
    });

    await store.save({
      type: 'upsert',
      iri: 'http://localhost/resource-with-accept-header.ttl',
    });
    await store.untilDone();
  });
});

describe('save', () => {
  const dir = './tmp/integration-test';
  let store: FileStorer;

  beforeEach(async () => {
    await rimraf(dir);
    store = new FileStorer({dir});
  });

  it('upserts a resource', async () => {
    expect.assertions(2);

    store.on('upsert', (iri: string, filename: string) => {
      expect(iri).toEqual('http://localhost/resource.ttl');
      expect(existsSync(filename)).toBe(true);
      // TBD: compare graph on file?
    });

    await store.save({type: 'upsert', iri: 'http://localhost/resource.ttl'});
    await store.untilDone();
  });

  it('deletes a resource that returns a 410 status code', async () => {
    expect.assertions(2);

    // The 'upsert' event must not be called
    let upsertHasBeenEmitted = false;
    store.on('upsert', () => (upsertHasBeenEmitted = true));

    store.on('delete', (iri: string) => {
      expect(iri).toEqual('http://localhost/deleted.ttl');
    });

    await store.save({type: 'upsert', iri: 'http://localhost/deleted.ttl'});
    await store.untilDone();

    expect(upsertHasBeenEmitted).toBe(false);
  });

  it('deletes a resource', async () => {
    expect.assertions(2);

    store.on('delete', (iri: string, filename: string) => {
      expect(iri).toEqual('http://localhost/resource.ttl');
      expect(existsSync(filename)).toBe(false);
    });

    await store.save({type: 'delete', iri: 'http://localhost/resource.ttl'});
    await store.untilDone();
  });

  it('does not throw when deleting a resource that does not exist', async () => {
    expect.assertions(2);

    store.on('delete', (iri: string, filename: string) => {
      expect(iri).toEqual('http://localhost/unknown.ttl');
      expect(existsSync(filename)).toBe(false);
    });

    await store.save({type: 'delete', iri: 'http://localhost/unknown.ttl'});
    await store.untilDone();
  });

  it('emits an error if an error occurred', async () => {
    expect.assertions(1);

    store.on('error', (err: Error) => {
      expect(err.message).toEqual(
        `An error occurred when saving IRI http://localhost/error.ttl: Could not retrieve http://localhost/error.ttl (HTTP status 500):
empty response`
      );
    });

    await store.save({type: 'upsert', iri: 'http://localhost/error.ttl'});
    await store.untilDone();
  });
});
