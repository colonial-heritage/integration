import {Iterator} from './iterator.js';
import {beforeEach, describe, expect, it} from 'vitest';
import {readFile} from 'node:fs/promises';
import {WriteStream, createWriteStream} from 'node:fs';
import {EOL} from 'node:os';
import {env} from 'node:process';

async function readFileAsString(fileName: string) {
  return readFile(fileName, {encoding: 'utf-8'});
}

describe('untilDone', () => {
  let iriFile: string;
  let writeStream: WriteStream;
  let query: string;

  beforeEach(async () => {
    iriFile = './tmp/iris.txt';
    writeStream = createWriteStream(iriFile);
    query = await readFileAsString('./fixtures/iterate.rq');
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
      endpointUrl: env.SPARQL_ENDPOINT_KG as string,
      query,
      writeStream,
    });

    let numberOfEmits = 0;
    iterator.on('collected-iris', () => numberOfEmits++);

    await iterator.untilDone();

    expect(numberOfEmits).toBe(10);

    const data = await readFileAsString(iriFile);
    const iris = data.split(EOL).filter(iri => iri.length > 0); // Skip empty lines

    expect(iris).toEqual([
      'http://vocab.getty.edu/aat/300111999',
      'http://vocab.getty.edu/aat/300027200',
      'http://vocab.getty.edu/aat/300043196',
      'http://vocab.getty.edu/aat/300043196',
      'http://vocab.getty.edu/aat/300048715',
      'http://vocab.getty.edu/aat/300048715',
      'http://vocab.getty.edu/aat/300386957',
      'http://vocab.getty.edu/aat/300404198',
      'http://vocab.getty.edu/aat/300417586',
      'http://vocab.getty.edu/aat/300431978',
    ]);
  });
});
