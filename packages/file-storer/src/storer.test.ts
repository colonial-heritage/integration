import {FileStorer} from './storer.js';
import {setupServer} from 'msw/node';
import {rest} from 'msw';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {rimraf} from 'rimraf';
import {afterAll, beforeAll, beforeEach, describe, expect, it} from 'vitest';

const server = setupServer(
  rest.get(
    'http://localhost/resource-with-basic-auth.ttl',
    async (req, res, ctx) => {
      // Basic auth - base64-encoded representation of 'username' and 'password'
      const authorization = req.headers.get('Authorization');
      if (authorization !== 'Basic dXNlcm5hbWU6cGFzc3dvcmQ=') {
        return res(ctx.status(401));
      }
      const data = await readFile('./fixtures/resource.ttl', {
        encoding: 'utf-8',
      });
      return res(
        ctx.status(200),
        ctx.set('Content-Type', 'text/turtle'),
        ctx.body(data)
      );
    }
  ),
  rest.get('http://localhost/resource.ttl', async (req, res, ctx) => {
    const data = await readFile('./fixtures/resource.ttl', {encoding: 'utf-8'});
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'text/turtle'),
      ctx.body(data)
    );
  }),
  rest.get('http://localhost/deleted.ttl', async (req, res, ctx) => {
    return res(
      ctx.status(410) // Gone
    );
  }),
  rest.get('http://localhost/error.ttl', async (req, res, ctx) => {
    return res(
      ctx.status(500) // Internal server error
    );
  })
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

  it('emits an error if credentials are invalid', async () => {
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

  it('upserts a resource if credentials are valid', async () => {
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

    // The 'upsert' event may not be called
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
