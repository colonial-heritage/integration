import {SparqlEndpointFetcher} from 'fetch-sparql-endpoint';
import {z} from 'zod';

const optionsSchema = z.object({
  endpointUrl: z.string().url(),
  datasetId: z.string(),
  dateLastRun: z.date().optional(), // Undefined if not run before
});

export type Options = z.input<typeof optionsSchema>;

export async function shouldDoNewRun(options: Options) {
  const opts = optionsSchema.parse(options);

  const fetcher = new SparqlEndpointFetcher();
  const dateLastRun = opts.dateLastRun ?? new Date();

  // Check whether the dataset has been modified since the last run
  const query = `
    PREFIX schema: <https://schema.org/>
    PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>

    ASK {
      BIND("${dateLastRun.toISOString()}"^^xsd:dateTime AS ?dateLastRun)
      <${opts.datasetId}> a schema:Dataset ;
        schema:dateModified ?rawDateModified .
      BIND(xsd:dateTime(?rawDateModified) AS ?dateModified)
      FILTER(?dateModified > ?dateLastRun)
    }
  `;

  const answer = await fetcher.fetchAsk(opts.endpointUrl, query);

  return answer;
}
