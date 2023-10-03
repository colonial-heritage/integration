import {run} from './dereferencer.js';
import {glob} from 'glob';
import {rimraf} from 'rimraf';
import {beforeEach, describe, expect, it} from 'vitest';

describe('run', () => {
  const outputDir = './tmp/geonames';

  beforeEach(async () => {
    await rimraf(outputDir);
  });

  it('runs', async () => {
    const iriFile = './fixtures/geonames/iris.txt';
    await run({iriFile, outputDir});
    const files = await glob(`${outputDir}/**/*.nt`, {
      nodir: true,
    });

    expect(files.length).toBe(4);
  });
});
