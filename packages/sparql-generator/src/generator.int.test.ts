import {Generator} from './generator.js';
import {readFile} from 'node:fs/promises';
import {WriteStream, createWriteStream} from 'node:fs';
import {EOL} from 'node:os';
import {beforeEach, describe, expect, it} from 'vitest';

describe('untilDone', () => {
  const graphFile = './tmp/graph.nt';
  const query = `
    PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
    CONSTRUCT {
      ?iri a skos:Concept ;
        skos:prefLabel ?prefLabel ;
        skos:altLabel ?altLabel .
    }
    WHERE {
      VALUES ?iri {
        ?_iris
      }
      ?iri a skos:Concept ;
        skos:prefLabel ?prefLabel .
      OPTIONAL { ?iri skos:altLabel ?altlabel }
    }
  `;
  let writeStream: WriteStream;

  beforeEach(() => {
    writeStream = createWriteStream(graphFile);
  });

  it('errors if the endpoint is invalid', async () => {
    expect.assertions(1);

    const generator = new Generator({
      endpointUrl: 'http://localhost',
      queries: [query],
      writeStream,
    });

    generator.on('error', (err: Error) => {
      expect(err.message).toBe(
        'An error occurred when generating resources for IRIs http://vocab.getty.edu/aat/300111999: fetch failed'
      );
    });

    await generator.generate(['http://vocab.getty.edu/aat/300111999']);

    await generator.untilDone();
  });

  it('creates a graph with one query', async () => {
    const generator = new Generator({
      endpointUrl: 'https://vocab.getty.edu/sparql',
      queries: [query],
      writeStream,
    });

    await generator.generate([
      'http://vocab.getty.edu/aat/300111999',
      'http://vocab.getty.edu/aat/300027200',
      'http://vocab.getty.edu/aat/300043196',
      'http://vocab.getty.edu/aat/300048715',
    ]);
    await generator.generate([
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

  it('creates a graph with multiple queries', async () => {
    const queries = [
      `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      CONSTRUCT {
        ?iri a skos:Concept ;
          skos:prefLabel ?prefLabel .
      }
      WHERE {
        VALUES ?iri {
          ?_iris
        }
        ?iri skos:prefLabel ?prefLabel .
      }`,
      `
      PREFIX skos: <http://www.w3.org/2004/02/skos/core#>
      CONSTRUCT {
        ?iri skos:altLabel ?altLabel .
      }
      WHERE {
        VALUES ?iri {
          ?_iris
        }
        ?iri skos:altLabel ?altLabel .
      }`,
    ];

    const generator = new Generator({
      endpointUrl: 'https://vocab.getty.edu/sparql',
      queries,
      writeStream,
    });

    await generator.generate([
      'http://vocab.getty.edu/aat/300111999',
      'http://vocab.getty.edu/aat/300417586', // Doesn't have altLabels
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
