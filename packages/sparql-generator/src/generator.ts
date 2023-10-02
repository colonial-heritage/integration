import fastq from 'fastq';
import type {queueAsPromised} from 'fastq';
import {SparqlEndpointFetcher} from 'fetch-sparql-endpoint';
import {once, EventEmitter} from 'node:events';
import {WriteStream} from 'node:fs';
import {EOL} from 'node:os';
import {finished} from 'node:stream/promises';
import {setTimeout as wait} from 'node:timers/promises';
import rdfSerializer from 'rdf-serialize';
import {z} from 'zod';

// Required to use ESM in both TypeScript and JavaScript
const serializer =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'default' in rdfSerializer ? (rdfSerializer.default as any) : rdfSerializer;

const constructorOptionsSchema = z.object({
  endpointUrl: z.string().url(),
  waitBetweenRequests: z.number().min(0).default(500),
  timeoutPerRequest: z.number().min(0).default(60000),
  query: z.string(),
  numberOfConcurrentRequests: z.number().min(1).default(1),
  writeStream: z.instanceof(WriteStream),
});

export type ConstructorOptions = z.input<typeof constructorOptionsSchema>;

export class Generator extends EventEmitter {
  private endpointUrl: string;
  private waitBetweenRequests: number;
  private fetcher: SparqlEndpointFetcher;
  private queue: queueAsPromised<string[]>;
  private query: string;
  private writeStream: WriteStream;

  constructor(options: ConstructorOptions) {
    super();

    const opts = constructorOptionsSchema.parse(options);

    this.endpointUrl = opts.endpointUrl;
    this.waitBetweenRequests = opts.waitBetweenRequests;
    this.query = this.getAndValidateQuery(opts.query);
    this.writeStream = opts.writeStream;
    this.fetcher = new SparqlEndpointFetcher({
      timeout: opts.timeoutPerRequest,
    });
    this.queue = fastq.promise(
      this._generate.bind(this),
      opts.numberOfConcurrentRequests
    );
  }

  private getAndValidateQuery(query: string) {
    // TBD: use sparqljs for validation?
    const bindings = ['?_iris']; // Basil notation
    const hasBindings = bindings.every(
      binding => query.indexOf(binding) !== -1
    );
    if (!hasBindings) {
      throw new Error(`Bindings are missing in query: ${bindings.join(', ')}`);
    }

    return query;
  }

  // For each call to generate(), this method gets invoked
  private async _generate(iris: string[]) {
    const sparqlReadyIris = iris.map(iri => `<${iri}>`).join(EOL);

    // TBD: instead of doing string replacements, generate a new SPARQL query using sparqljs?
    const query = this.query.replace('?_iris', sparqlReadyIris);

    // TBD: implement retries?
    const triplesStream = await this.fetcher.fetchTriples(
      this.endpointUrl,
      query
    );

    const dataStream = serializer.serialize(triplesStream, {
      contentType: 'application/n-triples', // TBD: make configurable?
    });

    // https://2ality.com/2019/11/nodejs-streams-async-iteration.html#writing-to-a-writable-stream-in-an-async-function
    for await (const chunk of dataStream) {
      if (!this.writeStream.write(chunk)) {
        await once(this.writeStream, 'drain'); // Handle backpressure
      }
    }

    // Try not to hurt the server or trigger its rate limiter
    await wait(this.waitBetweenRequests);

    this.emit('generate-end', iris);
  }

  // TBD: validate IRIs? A SPARQL endpoint can fail due to malformed ones
  // TBD: check for unique IRIs?
  // TBD: make sure 'iris' has at least 1 IRI?
  async generate(iris: string[]) {
    try {
      await this.queue.push(iris);
    } catch (err) {
      const error = err as Error;
      const prettyError = new Error(
        `An error occurred when generating resources of IRIs ${iris.join(
          ', '
        )}: ${error.message}`
      );
      prettyError.stack = error.stack;
      this.emit('error', prettyError);
    }
  }

  async untilDone() {
    await this.queue.drained();
    this.writeStream.end();
    await finished(this.writeStream); // Wait until writing is done
  }
}
