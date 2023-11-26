import {IBindings, SparqlEndpointFetcher} from 'fetch-sparql-endpoint';
import {once, EventEmitter} from 'node:events';
import {WriteStream} from 'node:fs';
import {EOL} from 'node:os';
import {finished} from 'node:stream/promises';
import {setTimeout} from 'node:timers/promises';
import {z} from 'zod';

export const constructorOptionsSchema = z.object({
  endpointUrl: z.string().url(),
  endpointMethod: z.enum(['GET', 'POST']).default('POST'),
  waitBetweenRequests: z.number().min(0).default(500),
  timeoutPerRequest: z.number().min(0).default(60000),
  query: z.string(),
  numberOfIrisPerRequest: z.number().min(1).default(1),
  writeStream: z.instanceof(WriteStream),
});

export type ConstructorOptions = z.input<typeof constructorOptionsSchema>;

export class Iterator extends EventEmitter {
  private endpointUrl: string;
  private numberOfIrisPerRequest: number;
  private waitBetweenRequests: number;
  private fetcher: SparqlEndpointFetcher;
  private query: string;
  private writeStream: WriteStream;

  constructor(options: ConstructorOptions) {
    super();

    const opts = constructorOptionsSchema.parse(options);

    this.endpointUrl = opts.endpointUrl;
    this.numberOfIrisPerRequest = opts.numberOfIrisPerRequest;
    this.waitBetweenRequests = opts.waitBetweenRequests;
    this.query = this.getAndValidateIterateQuery(opts.query);
    this.writeStream = opts.writeStream;
    this.fetcher = new SparqlEndpointFetcher({
      method: opts.endpointMethod,
      timeout: opts.timeoutPerRequest,
    });
  }

  private getAndValidateIterateQuery(query: string) {
    // Some sanity checks - can be optimized
    // TBD: use sparqljs for validation?
    const bindings = ['?_limit', '?_offset']; // Basil notation
    const hasBindings = bindings.every(
      binding => query.indexOf(binding) !== undefined
    );
    if (!hasBindings) {
      throw new Error(
        `Bindings are missing in iterate query: ${bindings.join(', ')}`
      );
    }

    return query;
  }

  private async collectIrisInRange(limit: number, offset: number) {
    let hasResults = false;
    let numberOfIris = 0;

    // TBD: instead of doing string replacements, generate a new SPARQL query using sparqljs?
    const query = this.query
      .replace('?_limit', limit.toString())
      .replace('?_offset', offset.toString());

    // TBD: implement retries?
    const bindingsStream = await this.fetcher.fetchBindings(
      this.endpointUrl,
      query
    );

    // Write the results to a simple, line-based file
    for await (const rawBindings of bindingsStream) {
      hasResults = true;
      numberOfIris++; // For progress monitoring

      const bindings = rawBindings as unknown as IBindings; // TS assumes it's a string or Buffer
      const line = bindings.iri.value + EOL;
      if (!this.writeStream.write(line)) {
        await once(this.writeStream, 'drain'); // Handle backpressure
      }
    }

    if (hasResults) {
      this.emit('collected-iris', numberOfIris, limit, offset);
    }

    return hasResults;
  }

  private async collectIris() {
    const limit = this.numberOfIrisPerRequest;
    let offset = 0;

    let hasResults = false;
    do {
      try {
        hasResults = await this.collectIrisInRange(limit, offset);
      } catch (err) {
        const error = err as Error;
        const prettyError = new Error(
          `Error while collecting ${limit} IRIs from offset ${offset}: ${error.message}`
        );
        prettyError.stack = error.stack;
        this.emit('error', prettyError);
        // TBD: throw error and stop the entire run? Or make this an option?
      }

      // Try not to hurt the server or trigger its rate limiter
      await setTimeout(this.waitBetweenRequests);

      offset += limit;
    } while (hasResults);
  }

  async untilDone() {
    await this.collectIris();
    this.writeStream.end();
    await finished(this.writeStream); // Wait until writing is done
  }
}
