import {glob} from 'glob';
import {createReadStream} from 'node:fs';
import {lstat, readFile} from 'node:fs/promises';
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

export async function getQueryFiles(path: string) {
  const stats = await lstat(path);
  const pattern = stats.isFile() ? path : `${path}/**/*.rq`; // Assume it's a directory
  const filenames = await glob(pattern, {nodir: true, absolute: true});

  return filenames;
}

export async function readQueries(path: string) {
  const filenames = await getQueryFiles(path);
  const readFileActions = filenames.map(filename =>
    readFile(filename, {encoding: 'utf-8'})
  );
  const queries = await Promise.all(readFileActions);

  return queries;
}
