import {readFileAsString} from './helpers.js';
import {run} from './iterator.js';
import {EOL} from 'node:os';
import {describe, expect, it} from 'vitest';

describe('run', () => {
  it('runs', async () => {
    const iriFile = './tmp/iris.txt';

    await run({
      endpointUrl: 'https://query.wikidata.org/sparql',
      queryFile: './fixtures/iterate.rq',
      iriFile,
      numberOfIrisPerRequest: 100,
    });

    const data = await readFileAsString(iriFile);
    const iris = data
      .split(EOL)
      .filter(iri => iri.length > 0) // Skip empty lines
      .sort();

    // This can change if the source data changes
    expect(iris).toEqual([
      'http://www.wikidata.org/entity/Q9918',
      'http://www.wikidata.org/entity/Q9920',
      'http://www.wikidata.org/entity/Q9974',
    ]);
  });
});
