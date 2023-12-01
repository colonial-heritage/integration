import {fetchIrisAndWriteToFile} from './iterator.js';
import {readFile} from 'node:fs/promises';
import {EOL} from 'node:os';
import {env} from 'node:process';
import {describe, expect, it} from 'vitest';

describe('fetchIrisAndWriteToFile', () => {
  it('runs', async () => {
    const iriFile = './tmp/iris.txt';

    await fetchIrisAndWriteToFile({
      endpointUrl: env.SPARQL_ENDPOINT_KG_TESTING as string,
      queryFile: './fixtures/iterate.rq',
      iriFile,
      numberOfIrisPerRequest: 100,
    });

    const data = await readFile(iriFile, 'utf-8');
    const iris = data
      .split(EOL)
      .filter(iri => iri.length > 0) // Skip empty lines
      .sort();

    // This can change if the source data changes
    expect(iris).toEqual([
      'https://example.org/objects/1',
      'https://example.org/objects/2',
      'https://example.org/objects/3',
      'https://example.org/objects/4',
      'https://example.org/objects/5',
    ]);
  });
});
