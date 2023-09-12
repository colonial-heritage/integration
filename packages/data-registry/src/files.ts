import {glob} from 'glob';
import {basename} from 'node:path';
import {z} from 'zod';

const getFilesAndGraphsOptionsSchema = z.object({
  filePattern: z.string(), // E.g. 'data/testing/**/*.ttl'
  graphBaseIri: z.string(), // E.g. 'https://example.org/'
});

export type GetFilesAndGraphsOptions = z.infer<
  typeof getFilesAndGraphsOptionsSchema
>;

export type FileAndGraph = {
  file: string;
  graph: string;
};

export async function getFilesAndGraphs(options: GetFilesAndGraphsOptions) {
  const opts = getFilesAndGraphsOptionsSchema.parse(options);

  const files = await glob(opts.filePattern, {nodir: true, absolute: true});

  const filesAndGraphs: FileAndGraph[] = files.map(file => {
    const fileBasename = basename(file);

    // Create the graph name based on the base name of the file, e.g.
    // "organizations.ttl" --> "organizations"
    const dotPosition = fileBasename.indexOf('.');
    const fileBasenameNoExtension =
      dotPosition !== -1
        ? fileBasename.substring(0, dotPosition)
        : fileBasename;

    const graph = opts.graphBaseIri + fileBasenameNoExtension;

    return {file, graph};
  });

  return filesAndGraphs;
}
