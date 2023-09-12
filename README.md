# Colonial Collections: integration layer

Monorepo for managing components of the integration layer of Colonial Collections.

## With Docker

### Install packages

    docker run --rm -it -v "$PWD":/app -w /app node:18 npm install --no-progress

### Run container

    docker run --rm -it -v "$PWD":/app -w /app --env-file .env node:18 /bin/bash
