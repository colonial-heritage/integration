import {IiifChangeDiscoverer} from './discoverer.js';
import {setupServer} from 'msw/node';
import {rest} from 'msw';
import {readFile} from 'node:fs/promises';
import {afterAll, afterEach, beforeAll, describe, expect, it} from 'vitest';

async function readFileAsJson(fileName: string) {
  const data = await readFile(fileName, {encoding: 'utf-8'});
  return JSON.parse(data);
}

const handlers = [
  rest.get('http://localhost/collection-add.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/collection-add.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/collection-update.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/collection-update.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/collection-delete.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/collection-delete.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get(
    'http://localhost/collection-refresh.json',
    async (req, res, ctx) => {
      const data = await readFileAsJson('./fixtures/collection-refresh.json');
      return res(ctx.status(200), ctx.json(data));
    }
  ),
  rest.get('http://localhost/collection-remove.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/collection-remove.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/collection-create.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/collection-create.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/collection-move.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/collection-move.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/page-add.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/page-add.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/page-create.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/page-create.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/page-update.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/page-update.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/page-delete.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/page-delete.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/page-refresh.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/page-refresh.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/page-move.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/page-move.json');
    return res(ctx.status(200), ctx.json(data));
  }),
  rest.get('http://localhost/page-remove.json', async (req, res, ctx) => {
    const data = await readFileAsJson('./fixtures/page-remove.json');
    return res(ctx.status(200), ctx.json(data));
  }),
];

const server = setupServer(...handlers);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('run - step 1', () => {
  it('terminates processing if the end time of the item is before the date of last run', async () => {
    expect.assertions(1);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-add.json',
      dateLastRun: new Date('2017-04-10T10:00:00Z'),
    });

    client.on('terminate', (endTime: Date) => {
      expect(endTime).toEqual(new Date('2017-03-10T10:00:00Z'));
    });

    await client.run();
  });
});

describe('run - step 2', () => {
  it('terminates processing if a Refresh is found and the client has not run before', async () => {
    expect.assertions(1);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-refresh.json',
      dateLastRun: undefined,
    });

    client.on('terminate', (startTime: Date) => {
      expect(startTime).toEqual(new Date('2020-03-10T10:00:00Z'));
    });

    await client.run();
  });
});

describe('run - step 3', () => {
  it('does not re-process an already processed item', async () => {
    expect.assertions(1);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-update.json',
      dateLastRun: new Date('2018-02-10T10:00:00Z'),
    });

    client.on('processed-before', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource1.json');
    });

    await client.run();
  });
});

describe('run - step 5', () => {
  it('emits a delete event if a Delete activity is found', async () => {
    expect.assertions(1);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-delete.json',
      dateLastRun: undefined,
    });

    client.on('delete', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource1.json');
    });

    await client.run();
  });
});

describe('run - step 5', () => {
  it('emits a remove event if a Remove activity is found', async () => {
    expect.assertions(1);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-remove.json',
      dateLastRun: undefined,
    });

    client.on('remove', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource3.json');
    });

    await client.run();
  });
});

describe('run - step 6', () => {
  it('emits a delete-only event if a Refresh activity is found and the client has run before', async () => {
    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-refresh.json',
      dateLastRun: new Date('1970-01-01'), // Arbitrary date far in the past
    });

    let onlyDeleteEventHasBeenEmitted = false;
    client.on('only-delete', () => (onlyDeleteEventHasBeenEmitted = true));

    await client.run();

    expect(onlyDeleteEventHasBeenEmitted).toBe(true);
  });

  it('emits only a delete event if a Refresh activity is found and the client has run before', async () => {
    expect.assertions(2);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-refresh.json',
      dateLastRun: new Date('1970-01-01'), // Arbitrary date far in the past
    });

    client.on('delete', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource1.json');
    });

    // TODO: also check for 'remove'

    let numberOfOtherEmits = 0;
    client.on('add', () => numberOfOtherEmits++);
    client.on('create', () => numberOfOtherEmits++);
    client.on('update', () => numberOfOtherEmits++);
    client.on('move', () => numberOfOtherEmits++);

    await client.run();

    expect(numberOfOtherEmits).toBe(0);
  });
});

describe('run - step 7', () => {
  it('emits a create event if a Create activity is found', async () => {
    expect.assertions(1);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-create.json',
      dateLastRun: new Date('1970-01-01'), // Arbitrary date far in the past
    });

    client.on('create', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource2.json');
    });

    await client.run();
  });
});

describe('run - step 7', () => {
  it('emits an update event if an Update activity is found', async () => {
    expect.assertions(1);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-update.json',
      dateLastRun: new Date('2018-02-10T10:00:00Z'),
    });

    client.on('update', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource1.json');
    });

    await client.run();
  });
});

describe('run - step 7', () => {
  it('emits an add event if an Add activity is found', async () => {
    expect.assertions(1);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-add.json',
      dateLastRun: new Date('1970-01-01'), // Arbitrary date far in the past
    });

    client.on('add', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource1.json');
    });

    await client.run();
  });
});

describe('run - step 8', () => {
  it('emits a move event if a Move activity is found', async () => {
    expect.assertions(2);

    const client = new IiifChangeDiscoverer({
      collectionIri: 'http://localhost/collection-move.json',
      dateLastRun: new Date('1970-01-01'), // Arbitrary date far in the past
    });

    client.on('move-delete', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource2.json');
    });
    client.on('move-create', (objectIri: string) => {
      expect(objectIri).toEqual('http://localhost/resource3.json');
    });

    await client.run();
  });
});
