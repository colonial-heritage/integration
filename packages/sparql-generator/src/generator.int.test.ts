import {Generator} from './generator.js';
import {readFile} from 'node:fs/promises';
import {WriteStream, createWriteStream} from 'node:fs';
import {EOL} from 'node:os';
import {beforeEach, describe, expect, it} from 'vitest';

describe('untilDone', () => {
  let graphFile: string;
  let writeStream: WriteStream;
  let query: string;

  beforeEach(async () => {
    graphFile = './tmp/graph.nt';
    writeStream = createWriteStream(graphFile);
    query = await readFile('./fixtures/generate.rq', {
      encoding: 'utf-8',
    });
  });

  it('errors if the endpoint is invalid', async () => {
    expect.assertions(1);

    const generator = new Generator({
      endpointUrl: 'http://localhost',
      query,
      writeStream,
    });

    generator.on('error', (err: Error) => {
      expect(err.message).toBe(
        'An error occurred when generating resources of IRIs http://vocab.getty.edu/aat/300111999: fetch failed'
      );
    });

    generator.generate(['http://vocab.getty.edu/aat/300111999']);

    await generator.untilDone();
  });

  it('generates until done', async () => {
    const generator = new Generator({
      endpointUrl: 'https://vocab.getty.edu/sparql',
      query,
      writeStream,
    });

    generator.generate([
      'http://vocab.getty.edu/aat/300111999',
      'http://vocab.getty.edu/aat/300027200',
      'http://vocab.getty.edu/aat/300043196',
      'http://vocab.getty.edu/aat/300048715',
    ]);
    generator.generate([
      'http://vocab.getty.edu/aat/300386957',
      'http://vocab.getty.edu/aat/300404198',
      'http://vocab.getty.edu/aat/300417586',
      'http://vocab.getty.edu/aat/300431978',
    ]);

    await generator.untilDone();

    // Basic string check. TODO: improve by parsing 'graphFile' to RDF
    const data = await readFile(graphFile, {encoding: 'utf-8'});
    const triples = data.split(EOL);

    expect(triples[0]).toBe(
      '<http://vocab.getty.edu/aat/300111999> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2004/02/skos/core#Concept> .'
    );
  });
});
