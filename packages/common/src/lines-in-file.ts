import {createReadStream} from 'node:fs';
import {EOL} from 'node:os';

// Based on https://stackoverflow.com/a/41439945
export async function getNumberOfLinesInFile(
  filename: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    let numberOfLines = 0;
    createReadStream(filename)
      .on('data', chunk => {
        let index = -1;
        numberOfLines--; // Because the loop will run once for index = -1
        do {
          // Find the next EOL and count that as 1 IRI
          index = chunk.indexOf(EOL, index + 1);
          numberOfLines++;
        } while (index !== -1);
      })
      .on('end', () => resolve(numberOfLines))
      .on('error', reject);
  });
}
