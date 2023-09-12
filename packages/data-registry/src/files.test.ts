import {getFilesAndGraphs} from './files.js';
import {describe, expect, it} from 'vitest';

describe('getFilesAndGraphs', () => {
  it('gets files and graphs', async () => {
    const filesAndGraphs = await getFilesAndGraphs({
      filePattern: './fixtures/files/**/*',
      graphBaseIri: 'http://example.org/',
    });

    expect(filesAndGraphs).toEqual([
      {
        file: '/app/packages/data-registry/fixtures/files/2',
        graph: 'http://example.org/2',
      },
      {
        file: '/app/packages/data-registry/fixtures/files/1.ttl',
        graph: 'http://example.org/1',
      },
      {
        file: '/app/packages/data-registry/fixtures/files/deep/4.ext.ttl',
        graph: 'http://example.org/4',
      },
      {
        file: '/app/packages/data-registry/fixtures/files/deep/3.ttl',
        graph: 'http://example.org/3',
      },
    ]);
  });
});
