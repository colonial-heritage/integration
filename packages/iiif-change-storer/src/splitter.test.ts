import {splitFileByLines} from './splitter.js';
import {glob} from 'glob';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('splitFileByLines', () => {
  const outputDir = './tmp/bodleian/chunks';

  beforeEach(async () => {
    await rimraf(outputDir);
  });

  it('splits file by lines', async () => {
    await splitFileByLines({
      filename: './fixtures/bodleian-metadata.csv',
      numberOfLines: 2,
      outputDir: './tmp/bodleian/chunks',
    });

    const files = await glob(`${outputDir}/**`, {nodir: true});

    expect(files.length).toBe(5);
  });
});
