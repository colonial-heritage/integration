// src/dereferencer.ts
import { getLogger } from "@colonial-collections/common";
import { FileStorer } from "@colonial-collections/file-storer";
import { parse } from "csv";
import { createReadStream } from "fs";
import { z } from "zod";
var runOptionsSchema = z.object({
  fileWithChanges: z.string(),
  dirWithChanges: z.string(),
  waitBetweenRequests: z.number().min(0).optional(),
  numberOfConcurrentRequests: z.number().min(1).optional(),
  credentials: z.object({
    type: z.literal("basic-auth"),
    username: z.string(),
    password: z.string()
  }).optional(),
  headers: z.record(z.string(), z.string()).optional()
});
var rowSchema = z.tuple([z.string(), z.string()]);
async function run(options) {
  const opts = runOptionsSchema.parse(options);
  const logger = getLogger();
  logger.info(`Processing IRIs in "${opts.fileWithChanges}"`);
  const storer = new FileStorer({
    dir: opts.dirWithChanges,
    waitBetweenRequests: opts.waitBetweenRequests,
    numberOfConcurrentRequests: opts.numberOfConcurrentRequests,
    credentials: opts.credentials,
    headers: opts.headers
  });
  storer.on(
    "upsert",
    (iri, filename) => logger.info(`Created or updated "${filename}" for "${iri}"`)
  );
  storer.on(
    "delete",
    (iri, filename) => logger.info(`Deleted "${filename}" for "${iri}"`)
  );
  storer.on("error", (err) => logger.error(err));
  const parser = createReadStream(opts.fileWithChanges).pipe(parse());
  for await (const row of parser) {
    rowSchema.parse(row);
    await storer.save({ iri: row[0], type: row[1] });
  }
  await storer.untilDone();
}
export {
  run,
  runOptionsSchema
};
