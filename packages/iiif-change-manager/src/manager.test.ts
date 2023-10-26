import {ChangeManager} from './manager.js';
import {existsSync} from 'node:fs';
import {unlink} from 'node:fs/promises';
import {beforeEach, describe, expect, it} from 'vitest';

describe('getRun', () => {
  it('returns undefined if no run is found', async () => {
    const path = './fixtures/no-runs/run.ttl';
    const changeManager = new ChangeManager({path});
    const run = await changeManager.getRun();

    expect(run).toBeUndefined();
  });

  it('throws if an incomplete run is found', async () => {
    const path = './fixtures/runs/bad-run-1.ttl';
    const changeManager = new ChangeManager({path});

    await expect(changeManager.getRun()).rejects.toThrowError(
      'No "prov:Activity" found in run'
    );
  });

  it('throws if an incomplete run is found', async () => {
    const path = './fixtures/runs/bad-run-2.ttl';
    const changeManager = new ChangeManager({path});

    await expect(changeManager.getRun()).rejects.toThrowError(
      'No "prov:startedAtTime" found in run'
    );
  });

  it('throws if an incomplete run is found', async () => {
    const path = './fixtures/runs/bad-run-4.ttl';
    const changeManager = new ChangeManager({path});

    await expect(changeManager.getRun()).rejects.toThrowError(
      'No "prov:endedAtTime" found in run'
    );
  });

  it('throws if run contains malformed RDF', async () => {
    const path = './fixtures/runs/bad-run-3.ttl';
    const changeManager = new ChangeManager({path});

    await expect(changeManager.getRun()).rejects.toThrowError(
      'Unexpected "Malformed" on line 1'
    );
  });

  it('gets the run with default filename', async () => {
    const path = './fixtures/runs/good-run.ttl';
    const changeManager = new ChangeManager({path});
    const run = await changeManager.getRun();

    expect(run).toStrictEqual({
      id: 'http://example.org/run1',
      startedAt: new Date('2023-08-02T23:01:02.463Z'),
      endedAt: new Date('2023-08-02T23:11:02.463Z'),
    });
  });
});

describe('saveRun', () => {
  const id = `http://example.org/${Date.now()}`;
  const path = './tmp/runs/run.nt';
  const changeManager = new ChangeManager({path});

  beforeEach(async () => {
    await unlink(path);
  });

  it('saves run', async () => {
    const startedAt = new Date();
    const endedAt = new Date();
    await changeManager.saveRun({id, startedAt, endedAt});

    expect(existsSync(path)).toBe(true);

    const lastRun = await changeManager.getRun();

    expect(lastRun).toStrictEqual({id, startedAt, endedAt});
  });
});
