import {getNumberOfLinesInFile} from './lines-in-file.js';
import {describe, expect, it} from 'vitest';

describe('getNumberOfLinesInFile', () => {
  it('gets the number of lines in a file', async () => {
    const file = './fixtures/lines.txt';

    const numberOfLines = await getNumberOfLinesInFile(file);

    expect(numberOfLines).toEqual(10);
  });
});
