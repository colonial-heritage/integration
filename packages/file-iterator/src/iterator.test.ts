import {Iterator} from './iterator.js';
import {WriteStream, createWriteStream} from 'node:fs';
import {readFile} from 'node:fs/promises';
import {EOL} from 'node:os';
import {beforeEach, describe, expect, it} from 'vitest';

describe('untilDone', () => {
  const iriFile = './tmp/iris.txt';
  const query = `
    PREFIX ex: <http://example.org/>
    SELECT ?iri
    WHERE {
      ?s ex:feature ?iri .
    }
  `;
  let writeStream: WriteStream;

  beforeEach(async () => {
    writeStream = createWriteStream(iriFile);
  });

  it('does not write results if there are no files to iterate', async () => {
    const iterator = new Iterator({
      dir: './fixtures/no-files',
      query,
      writeStream,
    });

    await iterator.untilDone();

    const data = await readFile(iriFile, {encoding: 'utf-8'});

    expect(data).toBe('');
  });

  it('does not write results if the "iri" binding is missing in the query', async () => {
    const query = `
      PREFIX ex: <http://example.org/>
      SELECT ?o
      WHERE {
        ?s ex:feature ?o .
      }
    `;

    const iterator = new Iterator({
      dir: './fixtures/files',
      query,
      writeStream,
    });

    await iterator.untilDone();

    const data = await readFile(iriFile, {encoding: 'utf-8'});

    expect(data).toBe('');
  });

  it('writes results', async () => {
    const iterator = new Iterator({
      dir: './fixtures/files',
      query,
      writeStream,
    });

    await iterator.untilDone();

    const data = await readFile(iriFile, {encoding: 'utf-8'});
    const iris = data
      .split(EOL)
      .filter(iri => iri.length > 0) // Skip empty lines
      .sort();

    expect(iris).toEqual([
      'http://example.org/a',
      'http://example.org/b',
      'http://example.org/b',
      'http://example.org/c',
    ]);
  });

  it('emits events when writing results', async () => {
    const iterator = new Iterator({
      dir: './fixtures/files',
      query,
      writeStream,
    });

    let numberOfEmits = 0;
    let numberOfIris = 0;
    const filenames: string[] = [];

    iterator.on(
      'collected-iris',
      (numberOfIrisInFile: number, filename: string) => {
        numberOfEmits++;
        numberOfIris += numberOfIrisInFile;
        filenames.push(filename);
      }
    );

    await iterator.untilDone();

    expect(numberOfEmits).toBe(3);
    expect(numberOfIris).toBe(4);
    expect(filenames).toEqual([
      '/app/packages/file-iterator/fixtures/files/2.ttl',
      '/app/packages/file-iterator/fixtures/files/1.ttl',
      '/app/packages/file-iterator/fixtures/files/deep/2.ttl',
    ]);
  });
});
