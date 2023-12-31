import {md5} from './md5.js';
import fastq from 'fastq';
import type {queueAsPromised} from 'fastq';
import {Buffer} from 'node:buffer';
import {EventEmitter} from 'node:events';
import {createWriteStream} from 'node:fs';
import {mkdir, unlink} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {setTimeout} from 'node:timers/promises';
import rdfDereferencer, {IDereferenceOptions} from 'rdf-dereference';
import rdfSerializer from 'rdf-serialize';
import {z} from 'zod';

// Required to use ESM in both TypeScript and JavaScript
const dereferencer =
  /* c8 ignore next 3 - the unit tests always use 'rdfDereferencer' directly */
  'default' in rdfDereferencer
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rdfDereferencer.default as any)
    : rdfDereferencer;

const serializer =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'default' in rdfSerializer ? (rdfSerializer.default as any) : rdfSerializer;

const constructorOptionsSchema = z.object({
  dir: z.string(),
  waitBetweenRequests: z.number().min(0).default(500),
  numberOfConcurrentRequests: z.number().min(1).default(1),
  credentials: z
    .object({
      type: z.literal('basic-auth'), // Only supported type at this moment
      username: z.string(),
      password: z.string(),
    })
    .optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export type ConstructorOptions = z.input<typeof constructorOptionsSchema>;

export const saveOptionsSchema = z.object({
  type: z.enum(['upsert', 'delete']),
  iri: z.string().url(),
});

export type SaveOptions = z.infer<typeof saveOptionsSchema>;

export class FileStorer extends EventEmitter {
  private dir: string;
  private waitBetweenRequests: number;
  private dereferenceOptions: IDereferenceOptions;
  private queue: queueAsPromised<SaveOptions>;

  constructor(options: ConstructorOptions) {
    super();

    const opts = constructorOptionsSchema.parse(options);

    this.dir = resolve(opts.dir);
    this.waitBetweenRequests = opts.waitBetweenRequests;
    this.dereferenceOptions = this.getDereferenceOptions(opts);
    this.queue = fastq.promise(
      this._save.bind(this),
      opts.numberOfConcurrentRequests
    );
  }

  private createBasicAuthHeader(username: string, password: string) {
    const authValue = `${username}:${password}`;
    const authValueBase64 = Buffer.from(authValue).toString('base64');
    const headerValue = `Basic ${authValueBase64}`;

    return headerValue;
  }

  // TBD: create dereference options per IRI domain, so that the dereferencer
  // can make calls to various domains, each having their own options?
  private getDereferenceOptions(options: ConstructorOptions) {
    const dereferenceOptions: IDereferenceOptions = {};
    const headers: Record<string, string> = {};

    if (options.headers !== undefined) {
      Object.assign(headers, options.headers);
    }

    if (options.credentials !== undefined) {
      headers.Authorization = this.createBasicAuthHeader(
        options.credentials.username,
        options.credentials.password
      );
    }

    if (Object.entries(headers).length > 0) {
      dereferenceOptions.headers = headers;
    }

    return dereferenceOptions;
  }

  createFilenameFromIri(iri: string) {
    const md5OfIri = md5(iri);

    // A large number of files in a single directory can slow down file access;
    // create a multi-level directory hierarchy instead by using the last characters
    // of the filename's MD5 (similar to the file caching strategy of Nginx)
    const subDir1 = md5OfIri.substring(md5OfIri.length - 1);
    const subDir2 = md5OfIri.substring(
      md5OfIri.length - 2,
      md5OfIri.length - 1
    );
    const path = join(this.dir, subDir1, subDir2, md5OfIri + '.nt');

    return path;
  }

  private async delete(options: SaveOptions) {
    const filename = this.createFilenameFromIri(options.iri);

    try {
      await unlink(filename);
    } catch (err) {
      const error = err as Error;
      const isFileNotFoundError = error.message.includes('ENOENT');
      if (!isFileNotFoundError) {
        throw err;
      }
    }

    this.emit('delete', options.iri, filename);
  }

  private async upsert(options: SaveOptions) {
    let quadStream;
    try {
      const response = await dereferencer.dereference(
        options.iri,
        this.dereferenceOptions
      );
      quadStream = response.data;
    } catch (err) {
      // A lookup may result in a '410 Gone' status. We then assume the
      // resource no longer exists and must be deleted from the local store
      const error = err as Error;
      const isGoneError = error.message.includes('HTTP status 410');
      if (!isGoneError) {
        // TBD: send IRI to a dead letter queue?
        throw err;
      }

      return this.delete(options);
    }

    const filename = this.createFilenameFromIri(options.iri);
    await mkdir(dirname(filename), {recursive: true});
    const writeStream = createWriteStream(filename); // Overwrite an existing file, if any
    const dataStream = serializer.serialize(quadStream, {path: filename});
    await pipeline(dataStream, writeStream);

    // Try not to hurt the server or trigger its rate limiter
    await setTimeout(this.waitBetweenRequests);

    this.emit('upsert', options.iri, filename);
  }

  // For each call to save(), this method gets invoked
  private async _save(options: SaveOptions) {
    const opts = saveOptionsSchema.parse(options);

    if (opts.type === 'delete') {
      return this.delete(opts);
    }

    return this.upsert(opts);
  }

  async save(options: SaveOptions) {
    this.queue.push(options).catch(err => {
      const prettyError = new Error(
        `An error occurred when saving IRI ${options.iri}: ${err.message}`
      );
      prettyError.stack = err.stack;
      this.emit('error', prettyError);
    });
  }

  async untilDone() {
    await this.queue.drained();
  }
}
