import {createReadStream, createWriteStream} from 'node:fs';
import {access, mkdir} from 'node:fs/promises';
import {dirname, resolve} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {DataFactory} from 'rdf-data-factory';
import rdfParser from 'rdf-parse';
import rdfSerializer from 'rdf-serialize';
import {storeStream} from 'rdf-store-stream';
import {RdfStore} from 'rdf-stores';
import {z} from 'zod';

// Required to use ESM in both TypeScript and JavaScript
const parser =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'default' in rdfParser ? (rdfParser.default as any) : rdfParser;

const serializer =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  'default' in rdfSerializer ? (rdfSerializer.default as any) : rdfSerializer;

const DF = new DataFactory();

const constructorOptionsSchema = z.object({
  path: z.string(),
});

export type ConstructorOptions = z.input<typeof constructorOptionsSchema>;

export type Run = {
  id: string;
  startedAt: Date;
  endedAt: Date;
};

const saveRunOptionsSchema = z.object({
  id: z.string().url(),
  startedAt: z.date(),
  endedAt: z.date(),
});

export type SaveRunOptions = z.input<typeof saveRunOptionsSchema>;

const provPrefix = 'http://www.w3.org/ns/prov#';

export class ChangeManager {
  private path: string;

  constructor(options: ConstructorOptions) {
    const opts = constructorOptionsSchema.parse(options);

    this.path = resolve(opts.path);
  }

  private getRunFromStore(store: RdfStore) {
    // TBD: first validate the RDF with SHACL?
    const activities = store.getQuads(
      undefined,
      DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
      DF.namedNode(provPrefix + 'Activity')
    );

    if (activities.length !== 1) {
      throw new Error('No "prov:Activity" found in run');
    }

    const startedAtTimes = store.getQuads(
      activities[0].subject,
      DF.namedNode(provPrefix + 'startedAtTime'),
      undefined
    );

    if (startedAtTimes.length !== 1) {
      throw new Error('No "prov:startedAtTime" found in run');
    }

    const endedAtTimes = store.getQuads(
      activities[0].subject,
      DF.namedNode(provPrefix + 'endedAtTime'),
      undefined
    );

    if (endedAtTimes.length !== 1) {
      throw new Error('No "prov:endedAtTime" found in run');
    }

    const run: Run = {
      id: activities[0].subject.value,
      startedAt: new Date(startedAtTimes[0].object.value),
      endedAt: new Date(endedAtTimes[0].object.value),
    };

    return run;
  }

  async getRun() {
    try {
      await access(this.path);
    } catch (err) {
      // The run probably doesn't exist
      return undefined;
    }

    const readStream = createReadStream(this.path);
    const contentType = parser.getContentTypeFromExtension(this.path);
    const quadStream = parser.parse(readStream, {contentType});
    const store = (await storeStream(quadStream)) as RdfStore;

    return this.getRunFromStore(store);
  }

  async saveRun(options: SaveRunOptions) {
    const opts = saveRunOptionsSchema.parse(options);

    const store = RdfStore.createDefault();
    const idNode = DF.namedNode(opts.id);

    store.addQuad(
      DF.quad(
        idNode,
        DF.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        DF.namedNode(provPrefix + 'Activity')
      )
    );
    store.addQuad(
      DF.quad(
        idNode,
        DF.namedNode(provPrefix + 'startedAtTime'),
        DF.literal(
          opts.startedAt.toISOString(),
          DF.namedNode('http://www.w3.org/2001/XMLSchema#dateTime')
        )
      )
    );
    store.addQuad(
      DF.quad(
        idNode,
        DF.namedNode(provPrefix + 'endedAtTime'),
        DF.literal(
          opts.endedAt.toISOString(),
          DF.namedNode('http://www.w3.org/2001/XMLSchema#dateTime')
        )
      )
    );

    await mkdir(dirname(this.path), {recursive: true});
    const writeStream = createWriteStream(this.path);
    const quadStream = store.match(); // All quads
    const dataStream = serializer.serialize(quadStream, {path: this.path});
    await pipeline(dataStream, writeStream);
  }
}
