import {readFileAsString} from './helpers.js';
import {run} from './iterator.js';
import {EOL} from 'node:os';
import {env} from 'node:process';
import {describe, expect, it} from 'vitest';

describe('run', () => {
  it('runs', async () => {
    const iriFile = './tmp/iris.txt';

    await run({
      endpointUrl: env.SPARQL_ENDPOINT_KG as string,
      queryFile: './queries/aat/iterate.rq',
      iriFile,
    });

    const data = await readFileAsString(iriFile);
    const iris = data.split(EOL).filter(iri => iri.length > 0); // Skip empty lines

    expect(iris).toEqual([
      'http://vocab.getty.edu/aat/300043196',
      'http://vocab.getty.edu/aat/300111999',
      'http://vocab.getty.edu/aat/300027200',
      'http://vocab.getty.edu/aat/300048715',
      'http://vocab.getty.edu/aat/300386957',
      'http://vocab.getty.edu/aat/300404198',
      'http://vocab.getty.edu/aat/300417586',
      'http://vocab.getty.edu/aat/300431978',
    ]);
  });
});
