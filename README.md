# Colonial Collections: integration layer

**Status: obsolete; for reference only. See [integration-layer](https://github.com/colonial-heritage/integration-layer) for the new version.**

Monorepo for managing components of the integration layer of Colonial Collections.

## With Docker

### Install packages

    docker run --rm -it -v "$PWD":/app -w /app node:18 npm install --no-progress

### Run container

    docker run --rm -it -v "$PWD":/app -w /app --env-file .env node:18 /bin/bash
