import cp from 'child_process';
import {mkdirp} from 'mkdirp';
import util from 'util';
import {z} from 'zod';

const execPromise = util.promisify(cp.exec);

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

  await mkdirp(opts.outputDir);

  await exec(
    `split -l ${opts.numberOfLines} "${opts.filename}" "${opts.outputDir}/metadata"`
  );
}
