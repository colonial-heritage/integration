import cp from 'node:child_process';
import {mkdir} from 'node:fs/promises';
import {basename} from 'node:path';
import {promisify} from 'node:util';
import {z} from 'zod';

const execPromise = promisify(cp.exec);

const splitFileByLinesOptionsSchema = z.object({
  filename: z.string(),
  numberOfLines: z.number().min(1),
  outputDir: z.string(),
});

export type SplitOptions = z.infer<typeof splitFileByLinesOptionsSchema>;

async function exec(command: string) {
  await execPromise(command, {encoding: 'utf8'});
}

// Linux-only but soooo much faster than a JS implementation
export async function splitFileByLines(options: SplitOptions) {
  const opts = splitFileByLinesOptionsSchema.parse(options);

  await mkdir(opts.outputDir, {recursive: true});

  const fileBasename = basename(opts.filename);

  // Beware: this overwrites existing files, if any
  await exec(
    `split -l ${opts.numberOfLines} "${opts.filename}" "${opts.outputDir}/${fileBasename}."`
  );
}
