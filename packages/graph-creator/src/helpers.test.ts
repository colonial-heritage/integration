import {getNumberOfLinesInFile, readFileAsString} from './helpers.js';
import {describe, expect, it} from 'vitest';

describe('readFileAsString', () => {
  it('reads a file as a string', async () => {
    const file = './fixtures/iris.txt';

    const data = await readFileAsString(file);

    expect(data).toEqual(`http://vocab.getty.edu/aat/300379098
http://vocab.getty.edu/aat/300215302
http://vocab.getty.edu/aat/300055647
http://vocab.getty.edu/aat/300055644
http://vocab.getty.edu/aat/300417210
http://vocab.getty.edu/aat/300404670
http://vocab.getty.edu/aat/300404626
http://vocab.getty.edu/aat/300435416
`);
  });
});

describe('getNumberOfLinesInFile', () => {
  it('gets the number of lines in a file', async () => {
    const file = './fixtures/iris.txt';

    const numberOfLines = await getNumberOfLinesInFile(file);

    expect(numberOfLines).toEqual(8);
  });
});
