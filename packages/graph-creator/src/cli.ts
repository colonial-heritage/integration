#!/bin/env node

import {cac} from 'cac';
import type {RunOptions as DereferenceRunOptions} from './dereferencer.js';
import type {RunOptions as IterateRunOptions} from './iterator.js';
import type {RunOptions as FsIterateRunOptions} from './fs-iterator.js';
import type {RunOptions as GenerateRunOptions} from './generator.js';
import type {RunOptions as UploadRunOptions} from './uploader.js';

const cli = cac();

cli
  .command('sparql-iterate', 'Collect IRIs from a SPARQL endpoint')
  .option('--endpoint-url <string>', 'SPARQL endpoint URL')
  .option('--query-file <string>', 'Iterate query file')
  .option(
    '--number-of-iris-per-request [number]',
    'Number of IRIs to collect per request',
    {default: 1}
  )
  .option(
    '--wait-between-requests [number]',
    'Wait between requests, in milliseconds',
    {
      default: 500,
    }
  )
  .option('--iri-file <string>', 'File for storing collected IRIs')
  .action(async (options: IterateRunOptions) => {
    import('./iterator.js').then(action => action.run(options));
  });

cli
  .command('sparql-generate', 'Generate graph from a SPARQL endpoint')
  .option('--endpoint-url <string>', 'SPARQL endpoint URL')
  .option('--query-file <string>', 'Generate query file')
  .option(
    '--number-of-resources-per-request [number]',
    'Number of resources to generate per request',
    {default: 1}
  )
  .option(
    '--wait-between-requests [number]',
    'Wait between requests, in milliseconds',
    {
      default: 500,
    }
  )
  .option(
    '--number-of-concurrent-requests [number]',
    'Number of concurrent requests',
    {
      default: 1,
    }
  )
  .option('--iri-file <string>', 'File for retrieving the collected IRIs')
  .option('--rdf-file <string>', 'File for storing the generated resources')
  .action(async (options: GenerateRunOptions) => {
    import('./generator.js').then(action => action.run(options));
  });

cli
  .command('dereference', 'Dereference IRIs')
  .option('--iri-file <string>', 'File containing dereferenceable IRIs')
  .option(
    '--wait-between-requests [number]',
    'Wait between requests, in milliseconds',
    {
      default: 500,
    }
  )
  .option(
    '--number-of-concurrent-requests [number]',
    'Number of concurrent requests',
    {
      default: 1,
    }
  )
  .option('--output-dir <string>', 'Directory for storing the resources')
  .action(async (options: DereferenceRunOptions) => {
    import('./dereferencer.js').then(action => action.run(options));
  });

cli
  .command('fs-iterate', 'Collect IRIs from local RDF files')
  .option('--input-dir <string>', 'Directory of the RDF files')
  .option('--query-file <string>', 'Iterate query file')
  .option('--iri-file <string>', 'File for storing collected IRIs')
  .action(async (options: FsIterateRunOptions) => {
    import('./fs-iterator.js').then(action => action.run(options));
  });

cli
  .command('upload', 'Upload graph to the RDF store')
  .option('--triplydb-instance-url <string>', 'TriplyDB instance URL')
  .option('--triplydb-api-token <string>', 'TriplyDB API token')
  .option('--triplydb-account <string>', 'TriplyDB account')
  .option('--triplydb-dataset <string>', 'TriplyDB dataset')
  .option('--triplydb-service-name <string>', 'TriplyDB service name')
  .option('--triplydb-service-type <string>', 'TriplyDB service type')
  .option('--rdf-file [string]', 'RDF file to upload')
  .option('--dir [string]', 'Directory with RDF files to upload')
  .option('--dir-temp [string]', 'Directory for storing temporary files')
  .option('--graph-name <string>', 'Name of the graph to upload the file to')
  .action(async (options: UploadRunOptions) => {
    import('./uploader.js').then(action => action.run(options));
  });

cli.help();
cli.parse();
