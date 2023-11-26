# Graph Creator

Creates a graph from local RDF files or a SPARQL endpoint

## Build

    npm run build

## Commands

### Testing

#### AAT

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_TESTING" \
      --query-file ./queries/aat/iterate.rq \
      --number-of-iris-per-request 2 \
      --wait-between-requests 500 \
      --iri-file ./tmp/aat.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "https://vocab.getty.edu/sparql" \
      --query-path ./queries/aat/generate.rq \
      --iri-file ./tmp/aat.txt \
      --number-of-resources-per-request 10 \
      --wait-between-requests 500 \
      --number-of-concurrent-requests 1 \
      --rdf-file ./tmp/aat.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_TESTING" \
      --triplydb-dataset "$TRIPLYDB_DATASET_KG_TESTING" \
      --triplydb-service-name "kg" \
      --triplydb-service-type "virtuoso" \
      --rdf-file ./tmp/aat.nt \
      --graph-name "https://data.colonialcollections.nl/aat"

#### GeoNames

##### Collect IRIs of locations from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_TESTING" \
      --query-file ./queries/geonames/locations.rq \
      --number-of-iris-per-request 2 \
      --wait-between-requests 500 \
      --iri-file ./tmp/geonames/locations.txt

##### Dereference IRIs of locations

    ./dist/cli.js dereference \
      --iri-file ./tmp/geonames/locations.txt \
      --wait-between-requests 1000 \
      --number-of-concurrent-requests 1 \
      --output-dir ./tmp/geonames/locations

##### Collect IRIs of countries from RDF files

    ./dist/cli.js file-iterate \
      --input-dir ./tmp/geonames/locations \
      --query-file ./queries/geonames/countries.rq \
      --iri-file ./tmp/geonames/countries.txt

##### Dereference IRIs of countries

    ./dist/cli.js dereference \
      --iri-file ./tmp/geonames/countries.txt \
      --wait-between-requests 1000 \
      --number-of-concurrent-requests 1 \
      --output-dir ./tmp/geonames/countries

##### Upload RDF files to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_TESTING" \
      --triplydb-dataset "$TRIPLYDB_DATASET_KG_TESTING" \
      --triplydb-service-name "kg" \
      --triplydb-service-type "virtuoso" \
      --dir "./tmp/geonames" \
      --dir-temp "./tmp" \
      --graph-name "https://data.colonialcollections.nl/geonames"

#### Datasets

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_TESTING" \
      --query-file ./queries/datasets/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/testing-datasets.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_TESTING" \
      --query-path ./queries/datasets/generate.rq \
      --number-of-resources-per-request 50 \
      --number-of-concurrent-requests 10 \
      --wait-between-requests 500 \
      --iri-file ./tmp/testing-datasets.txt \
      --rdf-file ./tmp/testing-datasets.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_TESTING" \
      --triplydb-dataset "$TRIPLYDB_DATASET_SG_TESTING" \
      --triplydb-service-name "search" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/testing-datasets.nt \
      --graph-name "https://data.colonialcollections.nl/datasets"

#### Objects

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_TESTING" \
      --query-file ./queries/testing/objects/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/testing-objects.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_TESTING" \
      --query-path ./queries/testing/objects/generate.rq \
      --number-of-resources-per-request 50 \
      --number-of-concurrent-requests 10 \
      --wait-between-requests 500 \
      --iri-file ./tmp/testing-objects.txt \
      --rdf-file ./tmp/testing-objects.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_TESTING" \
      --triplydb-dataset "$TRIPLYDB_DATASET_SG_TESTING" \
      --triplydb-service-name "search" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/testing-objects.nt \
      --graph-name "https://data.colonialcollections.nl/objects"

#### Persons

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_TESTING" \
      --query-file ./queries/testing/persons/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/testing-persons.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_TESTING" \
      --query-path ./queries/testing/persons/generate.rq \
      --number-of-resources-per-request 50 \
      --number-of-concurrent-requests 10 \
      --wait-between-requests 500 \
      --iri-file ./tmp/testing-persons.txt \
      --rdf-file ./tmp/testing-persons.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_TESTING" \
      --triplydb-dataset "$TRIPLYDB_DATASET_SG_TESTING" \
      --triplydb-service-name "search" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/testing-persons.nt \
      --graph-name "https://data.colonialcollections.nl/persons"

### Production

#### AAT

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-file ./queries/aat/iterate.rq \
      --number-of-iris-per-request 1000 \
      --wait-between-requests 500 \
      --iri-file ./tmp/aat.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "https://vocab.getty.edu/sparql" \
      --query-path ./queries/aat/generate.rq \
      --iri-file ./tmp/iris.txt \
      --number-of-resources-per-request 25 \
      --wait-between-requests 500 \
      --number-of-concurrent-requests 1 \
      --rdf-file ./tmp/aat.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_PRODUCTION" \
      --triplydb-dataset "$TRIPLYDB_DATASET_KG_PRODUCTION" \
      --triplydb-service-name "kg" \
      --triplydb-service-type "virtuoso" \
      --rdf-file ./tmp/aat.nt \
      --graph-name "https://data.colonialcollections.nl/aat"

#### GeoNames

##### Collect IRIs of locations from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-file ./queries/geonames/locations.rq \
      --number-of-iris-per-request 1000 \
      --wait-between-requests 500 \
      --iri-file ./tmp/geonames/locations.txt

##### Dereference IRIs of locations

    ./dist/cli.js dereference \
      --iri-file ./tmp/geonames/locations.txt \
      --wait-between-requests 1000 \
      --number-of-concurrent-requests 5 \
      --output-dir ./tmp/geonames/locations

##### Collect IRIs of countries from RDF files

    ./dist/cli.js file-iterate \
      --input-dir ./tmp/geonames/locations \
      --query-file ./queries/geonames/countries.rq \
      --iri-file ./tmp/geonames/countries.txt

##### Dereference IRIs of countries

    ./dist/cli.js dereference \
      --iri-file ./tmp/geonames/countries.txt \
      --wait-between-requests 1000 \
      --number-of-concurrent-requests 5 \
      --output-dir ./tmp/geonames/countries

##### Upload RDF files to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_PRODUCTION" \
      --triplydb-dataset "$TRIPLYDB_DATASET_KG_PRODUCTION" \
      --triplydb-service-name "kg" \
      --triplydb-service-type "virtuoso" \
      --dir "./tmp/geonames" \
      --dir-temp "./tmp" \
      --graph-name "https://data.colonialcollections.nl/geonames"

#### Datasets from the NDE Dataset Register

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "https://triplestore.netwerkdigitaalerfgoed.nl/repositories/registry" \
      --query-file ./queries/production/datasets/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/datasets-from-nde.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "https://triplestore.netwerkdigitaalerfgoed.nl/repositories/registry" \
      --query-path ./queries/production/datasets/generate.rq \
      --number-of-resources-per-request 10 \
      --number-of-concurrent-requests 1 \
      --wait-between-requests 250 \
      --iri-file ./tmp/datasets-from-nde.txt \
      --rdf-file ./tmp/datasets-from-nde.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_PRODUCTION" \
      --triplydb-dataset "$TRIPLYDB_DATASET_KG_PRODUCTION" \
      --triplydb-service-name "kg" \
      --triplydb-service-type "virtuoso" \
      --rdf-file ./tmp/datasets.nt \
      --graph-name "https://data.colonialcollections.nl/datasets"

#### Datasets

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-file ./queries/datasets/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/datasets.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-path ./queries/datasets/generate.rq \
      --number-of-resources-per-request 50 \
      --number-of-concurrent-requests 10 \
      --wait-between-requests 500 \
      --iri-file ./tmp/datasets.txt \
      --rdf-file ./tmp/datasets.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_PRODUCTION" \
      --triplydb-dataset "$TRIPLYDB_DATASET_SG_PRODUCTION" \
      --triplydb-service-name "search" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/datasets.nt \
      --graph-name "https://data.colonialcollections.nl/datasets"

#### Associations

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-file ./queries/production/associations/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/associations.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-path ./queries/production/associations/generate \
      --number-of-resources-per-request 50 \
      --number-of-concurrent-requests 10 \
      --wait-between-requests 250 \
      --iri-file ./tmp/associations.txt \
      --rdf-file ./tmp/associations.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_PRODUCTION" \
      --triplydb-dataset "$TRIPLYDB_DATASET_SG_PRODUCTION" \
      --triplydb-service-name "search" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/associations.nt \
      --graph-name "https://data.colonialcollections.nl/associations"

#### Colonial objects

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-file ./queries/production/colonial-objects/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 500 \
      --iri-file ./tmp/colonial-objects.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-path ./queries/production/colonial-objects/generate.rq \
      --number-of-resources-per-request 25 \
      --number-of-concurrent-requests 1 \
      --wait-between-requests 500 \
      --iri-file ./tmp/colonial-objects.txt \
      --rdf-file ./tmp/colonial-objects.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_PRODUCTION" \
      --triplydb-dataset "$TRIPLYDB_DATASET_SG_PRODUCTION" \
      --triplydb-service-name "search" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/colonial-objects.nt \
      --graph-name "https://data.colonialcollections.nl/colonial-objects"

#### Stamboeken

##### Collect IRIs from a SPARQL endpoint

    ./dist/cli.js sparql-iterate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-file ./queries/production/stamboeken/iterate.rq \
      --number-of-iris-per-request 10000 \
      --wait-between-requests 100 \
      --iri-file ./tmp/stamboeken.txt

##### Generate graph from a SPARQL endpoint

    ./dist/cli.js sparql-generate \
      --endpoint-url "$SPARQL_ENDPOINT_KG_PRODUCTION" \
      --query-path ./queries/production/stamboeken/generate.rq \
      --number-of-resources-per-request 50 \
      --number-of-concurrent-requests 10 \
      --wait-between-requests 500 \
      --iri-file ./tmp/stamboeken.txt \
      --rdf-file ./tmp/stamboeken.nt

##### Upload file to data platform

    ./dist/cli.js upload \
      --triplydb-instance-url "$TRIPLYDB_INSTANCE_URL" \
      --triplydb-api-token "$TRIPLYDB_API_TOKEN" \
      --triplydb-account "$TRIPLYDB_ACCOUNT_PRODUCTION" \
      --triplydb-dataset "$TRIPLYDB_DATASET_SG_PRODUCTION" \
      --triplydb-service-name "search" \
      --triplydb-service-type "elasticsearch" \
      --rdf-file ./tmp/stamboeken.nt \
      --graph-name "https://data.colonialcollections.nl/stamboeken"
