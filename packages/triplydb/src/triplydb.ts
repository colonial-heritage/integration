import App from '@triply/triplydb';
import {pino} from 'pino';
import {z} from 'zod';

const constructorOptionsSchema = z.object({
  logger: z.any(),
  instanceUrl: z.string(),
  apiToken: z.string(),
  account: z.string(),
  dataset: z.string(),
});

export type ConstructorOptions = z.infer<typeof constructorOptionsSchema>;

const upsertGraphFromRdfFileOptionsSchema = z.object({
  file: z.string(),
  graph: z.string(),
});

export type UpsertGraphFromRdfFileOptions = z.infer<
  typeof upsertGraphFromRdfFileOptionsSchema
>;

const restartServiceOptionsSchema = z.object({
  name: z.string(),
  type: z.string(), // E.g. "virtuoso", "elasticsearch"
});

export type RestartServiceOptions = z.infer<typeof restartServiceOptionsSchema>;

export class TriplyDb {
  private logger: pino.Logger;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dataset: any; // Triply package doesn't export a type

  private constructor(options: ConstructorOptions) {
    const opts = constructorOptionsSchema.parse(options);

    this.logger = opts.logger;
  }

  private async init(options: ConstructorOptions) {
    const triplyDb = App.get({
      token: options.apiToken,
      url: options.instanceUrl,
    });
    const account = await triplyDb.getAccount(options.account);
    this.dataset = await account.getDataset(options.dataset);
  }

  static async new(options: ConstructorOptions) {
    const triplyDb = new TriplyDb(options);
    await triplyDb.init(options);

    return triplyDb;
  }

  async upsertGraphFromRdfFile(options: UpsertGraphFromRdfFileOptions) {
    const opts = upsertGraphFromRdfFileOptionsSchema.parse(options);

    this.logger.info(`Deleting graph "${opts.graph}"`);

    try {
      await this.dataset.deleteGraph(opts.graph);
    } catch (err) {
      const error = err as Error;
      if (
        !error.message.includes(`Graph '${opts.graph}' not found in dataset`)
      ) {
        throw err;
      }
    }

    this.logger.info(`Adding RDF file "${opts.file}" to graph "${opts.graph}"`);

    await this.dataset.importFromFiles([opts.file], {
      defaultGraphName: opts.graph,
    });
  }

  async restartService(options: RestartServiceOptions) {
    const opts = restartServiceOptionsSchema.parse(options);

    this.logger.info(`Restarting service "${opts.name}"`);

    // Create service if it doesn't exist.
    // This doesn't work for an Elasticsearch service though - a bug?
    const service = await this.dataset.ensureService(opts.name, {
      type: opts.type,
    });

    // Update the service with the new data in the uploaded RDF files
    try {
      await service.update();
    } catch (err) {
      const error = err as Error;
      if (
        !error.message.includes('Cannot sync a service that is not out of sync')
      ) {
        throw err;
      }
    }
  }
}
