import {getLogger, md5} from '@colonial-collections/common';
import {globStream} from 'glob';
import {readFile, unlink} from 'node:fs/promises';
import {EOL} from 'node:os';
import {basename} from 'node:path';
import {z} from 'zod';

const optionsSchema = z.object({
  dirWithResources: z.string(),
  iriFile: z.string(),
});

export type Options = z.infer<typeof optionsSchema>;

async function deleteFileIfObsolete(filename: string, iris: string[]) {
  const filenameWithoutExtension = basename(filename, '.nt');
  const iri = iris.find(iri => {
    const md5OfIri = md5(iri);
    return md5OfIri === filenameWithoutExtension;
  });

  if (iri !== undefined) {
    return;
  }

  // The IRI does not exist anymore - delete the corresponding file
  try {
    await unlink(filename);
  } catch (err) {
    const error = err as Error;
    const isFileNotFoundError = error.message.includes('ENOENT');
    if (!isFileNotFoundError) {
      throw err;
    }
  }
}

async function getIrisFromFile(iriFile: string) {
  const data = await readFile(iriFile, 'utf-8');
  const iris = data.split(EOL);

  return iris;
}

export async function deleteObsoleteResoures(options: Options) {
  const opts = optionsSchema.parse(options);

  const logger = getLogger();
  logger.info(`Deleting obsolete resources in "${opts.dirWithResources}"`);

  // This can be a huge file - be mindful of the memory consumption
  const iris = await getIrisFromFile(opts.iriFile);

  const filesStream = globStream(`${opts.dirWithResources}/**/*.nt`, {
    nodir: true,
    absolute: true,
  });

  for await (const filename of filesStream) {
    await deleteFileIfObsolete(filename, iris);
  }
}
