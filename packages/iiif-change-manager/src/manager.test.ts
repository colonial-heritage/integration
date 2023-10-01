import {ChangeManager} from './manager.js';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('getLastRun', () => {
  it('returns undefined if no run is found', async () => {
    const dir = './fixtures/no-runs';
    const changeManager = new ChangeManager({dir});
    const run = await changeManager.getLastRun();

    expect(run).toBeUndefined();
  });

  it('throws if an incomplete run is found', async () => {
    const dir = './fixtures/bad-runs-1';
    const changeManager = new ChangeManager({dir});

    await expect(changeManager.getLastRun()).rejects.toThrowError(
      'No "prov:Activity" found in run'
    );
  });

  it('throws if an incomplete run is found', async () => {
    const dir = './fixtures/bad-runs-2';
    const changeManager = new ChangeManager({dir});

    await expect(changeManager.getLastRun()).rejects.toThrowError(
      'No "prov:startedAtTime" found in run'
    );
  });

  it('throws if an incomplete run is found', async () => {
    const dir = './fixtures/bad-runs-4';
    const changeManager = new ChangeManager({dir});

    await expect(changeManager.getLastRun()).rejects.toThrowError(
      'No "prov:endedAtTime" found in run'
    );
  });

  it('throws if run contains malformed RDF', async () => {
    const dir = './fixtures/bad-runs-3';
    const changeManager = new ChangeManager({dir});

    await expect(changeManager.getLastRun()).rejects.toThrowError(
      'Unexpected "Malformed" on line 1'
    );
  });

  it('gets the last run', async () => {
    const dir = './fixtures/good-runs';
    const changeManager = new ChangeManager({dir});
    const run = await changeManager.getLastRun();

    expect(run).toStrictEqual({
      id: 'http://example.org/run1',
      startedAt: new Date('2023-08-02T23:01:02.463Z'),
      endedAt: new Date('2023-08-02T23:11:02.463Z'),
    });
  });
});

describe('saveRun', () => {
  const id = `http://example.org/${Date.now()}`;
  const dir = './tmp/runs';
  const changeManager = new ChangeManager({dir});

  beforeEach(async () => {
    await rimraf(dir);
  });

  it('saves run', async () => {
    const startedAt = new Date();
    const endedAt = new Date();
    await changeManager.saveRun({id, startedAt, endedAt});

    const filename = join(dir, endedAt.getTime() + '.nt');
    expect(existsSync(filename)).toBe(true);

    const lastRun = await changeManager.getLastRun();
    expect(lastRun).toStrictEqual({id, startedAt, endedAt});
  });
});
