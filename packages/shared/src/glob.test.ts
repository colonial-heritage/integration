import {getRdfFiles} from './glob.js';
import {describe, expect, it} from 'vitest';

describe('getRdfFiles', () => {
  it('returns RDF files', async () => {
    const files = await getRdfFiles('./fixtures/files');

    expect(files).toEqual([
      '/app/packages/shared/fixtures/files/1.ttl',
      '/app/packages/shared/fixtures/files/deep/2.nt',
    ]);
  });
});
