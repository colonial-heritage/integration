import {run} from './file-iterator.js';
import {readFile} from 'node:fs/promises';
import {EOL} from 'node:os';
import {describe, expect, it} from 'vitest';

describe('run', () => {
  it('runs', async () => {
    const iriFile = './tmp/iris.txt';

    await run({
      inputDir: './fixtures/geonames',
      queryFile: './queries/geonames/countries.rq',
      iriFile,
    });

    const data = await readFile(iriFile, {encoding: 'utf-8'});
    const iris = data
      .split(EOL)
      .filter(iri => iri.length > 0) // Skip empty lines
      .sort();

    expect(iris).toEqual([
      'https://sws.geonames.org/1643084/',
      'https://sws.geonames.org/1643084/',
      'https://sws.geonames.org/1733045/',
    ]);
  });
});
