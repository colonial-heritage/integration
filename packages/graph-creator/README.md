# Graph Creator

Create a graph from a SPARQL endpoint

## Build

    npm run build

## Commands

### AAT

#### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG" \
      --query-file ./queries/aat/iterate.rq \
      --number-of-iris-per-request 2 \
      --wait-between-requests 500 \
      --iri-file ./tmp/aat.txt

#### Generate graph from a SPARQL endpoint

    ./dist/cli.js generate \
      --endpoint-url "https://vocab.getty.edu/sparql" \
      --query-file ./queries/aat/generate.rq \
      --iri-file ./tmp/iris.txt \
      --number-of-resources-per-request 10 \
      --wait-between-requests 500 \
      --number-of-concurrent-requests 1 \
      --rdf-file ./tmp/aat.nt

#### Upload RDF file to TriplyDB

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT" \
      --triplydb-dataset "$TRIPLYDB_DATASET" \
      --triplydb-service-name "kg" \
      --triplydb-service-type "virtuoso" \
      --rdf-file ./tmp/aat.nt \
      --graph-name "https://data.colonialcollections.nl/aat"

### Associations

#### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG" \
      --query-file ./queries/associations/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/associations.txt

#### Generate graph from a SPARQL endpoint

    ./dist/cli.js generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG" \
      --query-file ./queries/associations/generate.rq \
      --number-of-resources-per-request 50 \
      --number-of-concurrent-requests 10 \
      --wait-between-requests 500 \
      --iri-file ./tmp/associations.txt \
      --rdf-file ./tmp/associations.nt

#### Upload RDF file to TriplyDB

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT" \
      --triplydb-dataset "$TRIPLYDB_DATASET" \
      --triplydb-service-name "elasticsearch" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/associations.nt \
      --graph-name "https://data.colonialcollections.nl/associations"

### Colonial objects

#### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG" \
      --query-file ./queries/colonial-objects/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 500 \
      --iri-file ./tmp/colonial-objects.txt

#### Generate graph from a SPARQL endpoint

    ./dist/cli.js generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG" \
      --query-file ./queries/colonial-objects/generate.rq \
      --number-of-resources-per-request 25 \
      --number-of-concurrent-requests 1 \
      --wait-between-requests 500 \
      --iri-file ./tmp/colonial-objects.txt \
      --rdf-file ./tmp/colonial-objects.nt

#### Upload RDF file to TriplyDB

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT" \
      --triplydb-dataset "$TRIPLYDB_DATASET" \
      --triplydb-service-name "elasticsearch" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/colonial-objects.nt \
      --graph-name "https://data.colonialcollections.nl/colonial-objects"

### Stamboeken

#### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG" \
      --query-file ./queries/stamboeken/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/stamboeken.txt

#### Generate graph from a SPARQL endpoint

    ./dist/cli.js generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG" \
      --query-file ./queries/stamboeken/generate.rq \
      --number-of-resources-per-request 50 \
      --number-of-concurrent-requests 10 \
      --wait-between-requests 500 \
      --iri-file ./tmp/stamboeken.txt \
      --rdf-file ./tmp/stamboeken.nt

#### Upload RDF file to TriplyDB

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT" \
      --triplydb-dataset "$TRIPLYDB_DATASET" \
      --triplydb-service-name "elasticsearch" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/stamboeken.nt \
      --graph-name "https://data.colonialcollections.nl/stamboeken"
