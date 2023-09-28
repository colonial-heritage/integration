import {QueryEngine} from '@comunica/query-sparql-file';
import {globStream} from 'glob';
import {once, EventEmitter} from 'node:events';
import {WriteStream} from 'node:fs';
import {EOL} from 'node:os';
import {finished} from 'node:stream/promises';
import {z} from 'zod';

export const constructorOptionsSchema = z.object({
  dir: z.string(),
  query: z.string(),
  writeStream: z.instanceof(WriteStream),
});

export type ConstructorOptions = z.input<typeof constructorOptionsSchema>;

export class Iterator extends EventEmitter {
  private dir: string;
  private query: string;
  private writeStream: WriteStream;
  private queryEngine: QueryEngine;

  constructor(options: ConstructorOptions) {
    super();

    const opts = constructorOptionsSchema.parse(options);

    this.dir = opts.dir;
    this.query = opts.query;
    this.writeStream = opts.writeStream;
    this.queryEngine = new QueryEngine();
  }

  private async collectIrisInFile(file: string) {
    let numberOfIris = 0;

    const bindingsStream = await this.queryEngine.queryBindings(this.query, {
      sources: [file],
    });
    const bindings = await bindingsStream.toArray();

    for (const binding of bindings) {
      const term = binding.get('iri');
      if (term === undefined) {
        continue;
      }

      numberOfIris++; // For progress monitoring

      const line = term.value + EOL;
      if (!this.writeStream.write(line)) {
        await once(this.writeStream, 'drain'); // Handle backpressure
      }
    }

    this.emit('collected-iris', numberOfIris, file);
  }

  private async collectIris() {
    // Scan for some common RDF file extensions
    const filesStream = globStream(`${this.dir}/**/*.{nt,nq,trig,ttl}`, {
      nodir: true,
      absolute: true,
    });

    for await (const file of filesStream) {
      await this.collectIrisInFile(file);
    }
  }

  async untilDone() {
    await this.collectIris();
    this.writeStream.end();
    await finished(this.writeStream); // Wait until writing is done
  }
}
