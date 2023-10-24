import {glob} from 'glob';
import {lstat, readFile} from 'node:fs/promises';

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
