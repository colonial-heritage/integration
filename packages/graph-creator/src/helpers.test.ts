import {getNumberOfLinesInFile, getQueryFiles, readQueries} from './helpers.js';
import {describe, expect, it} from 'vitest';

describe('getNumberOfLinesInFile', () => {
  it('gets the number of lines in a file', async () => {
    const file = './fixtures/aat/iris.txt';

    const numberOfLines = await getNumberOfLinesInFile(file);

    expect(numberOfLines).toEqual(8);
  });
});

describe('getQueryFiles', () => {
  it('gets query files if path points to a file', async () => {
    const path = './fixtures/queries/query1.rq';
    const filenames = await getQueryFiles(path);

    expect(filenames.length).toBe(1);
    expect(filenames[0].endsWith('/fixtures/queries/query1.rq')).toBe(true);
  });

  it('gets query files if path points to a directory', async () => {
    const path = './fixtures/queries';
    const filenames = await getQueryFiles(path);

    expect(filenames.length).toBe(2);
    expect(filenames[0].endsWith('/fixtures/queries/query1.rq')).toBe(true);
    expect(filenames[1].endsWith('/fixtures/queries/deep/query2.rq')).toBe(
      true
    );
  });
});

describe('readQueries', () => {
  it('reads queries', async () => {
    const path = './fixtures/queries';
    const queries = await readQueries(path);

    expect(queries.length).toBe(2);
    expect(queries).toStrictEqual([
      'SELECT * WHERE { ?s ?p ?o } LIMIT 1',
      'SELECT * WHERE { ?s ?p ?o } LIMIT 2',
    ]);
  });
});
