import {Iterator} from './iterator.js';
import {WriteStream, createWriteStream} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {EOL} from 'node:os';
import {beforeEach, describe, expect, it} from 'vitest';

describe('untilDone', () => {
  let iriFile: string;
  let writeStream: WriteStream;
  let query: string;

  beforeEach(async () => {
    iriFile = './tmp/iris.txt';
    writeStream = createWriteStream(iriFile);
    query = await readFile('./fixtures/iterate.rq', 'utf-8');
  });

  it('errors if the endpoint is invalid', async () => {
    expect.assertions(1);

    const iterator = new Iterator({
      endpointUrl: 'http://localhost',
      query,
      writeStream,
    });

    iterator.on('error', (err: Error) => {
      expect(err.message).toBe(
        'Error while collecting 1 IRIs from offset 0: fetch failed'
      );
    });

    await iterator.untilDone();
  });

  it('iterates until done', async () => {
    const iterator = new Iterator({
      endpointUrl: 'https://query.wikidata.org/sparql',
      query,
      writeStream,
      numberOfIrisPerRequest: 2,
    });

    let numberOfEmits = 0;
    iterator.on('collected-iris', () => numberOfEmits++);

    await iterator.untilDone();

    // This can change if the source data changes
    expect(numberOfEmits).toBe(2);

    const data = await readFile(iriFile, 'utf-8');
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
