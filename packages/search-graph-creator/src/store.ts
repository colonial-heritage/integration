import {md5} from '@colonial-collections/common';
import {globStream} from 'glob';
import {createWriteStream} from 'node:fs';
import {mkdir, unlink} from 'node:fs/promises';
import {basename, dirname, join, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import rdfSerializer from 'rdf-serialize';
import {z} from 'zod';

// Required to use ESM in both TypeScript and JavaScript
const serializer =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'default' in rdfSerializer ? (rdfSerializer.default as any) : rdfSerializer;

const constructorOptionsSchema = z.object({
  dir: z.string(),
});

export type ConstructorOptions = z.input<typeof constructorOptionsSchema>;

const iriSchema = z.string().url();
const pathSchema = z.string();
const matchFnSchema = z.function();

export const deleteObsoleteOptionsSchema = z.object({
  matchFn: z.function(),
});

export type DeleteObsoleteOptions = z.infer<typeof deleteObsoleteOptionsSchema>;

export const upsertOptionsSchema = z.object({
  iri: iriSchema,
  quadStream: z.string().url(), // TODO: fix type
});

export type UpsertOptions = z.infer<typeof upsertOptionsSchema>;

// Simple storage of RDF resources in files on the file system
export class ResourceStore {
  private dir: string;

  constructor(options: ConstructorOptions) {
    const opts = constructorOptionsSchema.parse(options);

    this.dir = resolve(opts.dir);
  }

  createHashFromIri(iri: string) {
    return md5(iri);
  }

  createPathFromIri(iri: string) {
    iriSchema.parse(iri);

    const hashOfIri = this.createHashFromIri(iri);

    // A large number of files in a single directory can slow down file access;
    // create a multi-level directory hierarchy instead by using the last characters
    // of the filename's MD5 (similar to the file caching strategy of Nginx)
    const subDir1 = hashOfIri.substring(hashOfIri.length - 1);
    const subDir2 = hashOfIri.substring(
      hashOfIri.length - 2,
      hashOfIri.length - 1
    );
    const path = join(this.dir, subDir1, subDir2, hashOfIri + '.nt');

    return path;
  }

  async deleteByPath(path: string) {
    pathSchema.parse(path);

    try {
      await unlink(path);
    } catch (err) {
      const error = err as Error;
      const isFileNotFoundError = error.message.includes('ENOENT');
      if (!isFileNotFoundError) {
        throw err;
      }
    }
  }

  async deleteByIri(iri: string) {
    iriSchema.parse(iri);

    const path = this.createPathFromIri(iri);

    return this.deleteByPath(path);
  }

  async deleteIfMatches(matchFn: (hashOfIri: string) => Promise<boolean>) {
    matchFnSchema.parse(matchFn);

    const filesStream = globStream(`${this.dir}/**/*.nt`, {
      nodir: true,
      absolute: true,
    });

    for await (const path of filesStream) {
      const hashOfIri = basename(path, '.nt');
      const isMatch = await matchFn(hashOfIri);
      if (isMatch) {
        await this.deleteByPath(path);
      }
    }
  }

  async upsert(options: UpsertOptions) {
    const opts = upsertOptionsSchema.parse(options);

    const path = this.createPathFromIri(opts.iri);
    await mkdir(dirname(path), {recursive: true});
    const writeStream = createWriteStream(path); // Overwrite an existing file, if any
    const dataStream = serializer.serialize(opts.quadStream, {path});
    await pipeline(dataStream, writeStream);
  }
}