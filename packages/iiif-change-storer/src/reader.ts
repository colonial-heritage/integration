import {
  runOptionsSchema as workerRunOptionsSchema,
  RunOptions as WorkerRunOptions,
} from './worker.js';
import {glob} from 'glob';
import {URL} from 'node:url';
import {pino} from 'pino';
import PrettyMilliseconds from 'pretty-ms';
import Tinypool from 'tinypool';
import {z} from 'zod';

const constructorOptionsSchema = z.object({
  logger: z.any(),
});

export type ChangeReaderConstructorOptions = z.input<
  typeof constructorOptionsSchema
>;

const runOptionsSchema = z
  .object({
    dirWithFiles: z.string(),
  })
  .merge(workerRunOptionsSchema.omit({fileWithIris: true}));

export type RunOptions = z.infer<typeof runOptionsSchema>;

export class ChangeReader {
  private logger: pino.Logger;

  constructor(options: ChangeReaderConstructorOptions) {
    const opts = constructorOptionsSchema.parse(options);

    this.logger = opts.logger;
  }

  async run(options: RunOptions) {
    const opts = runOptionsSchema.parse(options);

    const startTime = Date.now();

    const files = await glob(`${opts.dirWithFiles}/**/*.csv`, {
      nodir: true,
      absolute: true,
    });

    const pool = new Tinypool({
      name: 'run',
      runtime: 'child_process',
      filename: new URL('./worker.js', import.meta.url).href,
      maxQueue: 'auto',
      minThreads: files.length, // One thread per file
    });

    const runs = files.map(file => {
      const runOptionsSchema: WorkerRunOptions = {
        fileWithIris: file,
        dirWithChanges: opts.dirWithChanges,
        waitBetweenRequests: opts.waitBetweenRequests,
        numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
        credentials: opts.credentials,
        headers: opts.headers,
      };

      try {
        return pool.run(runOptionsSchema);
      } catch (err) {
        this.logger.error(err);
        return; // Satisfy TS compiler
      }
    });

    await Promise.all(runs);

    const finishTime = Date.now();
    const runtime = finishTime - startTime;
    this.logger.info(`Processed all changes in ${PrettyMilliseconds(runtime)}`);
  }
}
