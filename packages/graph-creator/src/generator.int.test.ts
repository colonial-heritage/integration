import {run} from './generator.js';
import {readFileAsString} from './helpers.js';
import {EOL} from 'node:os';
import {describe, expect, it} from 'vitest';

describe('run', () => {
  it('runs', async () => {
    const iriFile = './fixtures/iris.txt';
    const rdfFile = './tmp/aat-terms.nt';

    await run({
      endpointUrl: 'https://vocab.getty.edu/sparql',
      queryFile: './queries/aat/generate.rq',
      iriFile,
      rdfFile,
    });

    // Basic string check. TODO: improve by parsing 'rdfFile' to RDF
    const data = await readFileAsString(rdfFile);
    const triples = data.split(EOL);

    expect(triples[0]).toBe(
      '<http://vocab.getty.edu/aat/300379098> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://www.w3.org/2004/02/skos/core#Concept> .'
    );
  });
});
