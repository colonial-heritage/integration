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
    query = await readFile('./fixtures/queries/iterate.rq', {
      encoding: 'utf-8',
    });
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

  it('iterates until done', async () => {
    const iterator = new Iterator({
      dir: './fixtures/files',
      query,
      writeStream,
    });

    let numberOfEmits = 0;
    let numberOfIris = 0;
    iterator.on('collected-iris', (numberOfIrisInFile: number) => {
      numberOfEmits++;
      numberOfIris += numberOfIrisInFile;
    });

    await iterator.untilDone();

    expect(numberOfEmits).toBe(3);
    expect(numberOfIris).toBe(4);

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
});
