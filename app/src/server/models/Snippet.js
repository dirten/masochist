/**
 * @flow
 */

import readIndex from '../readIndex';

export default class Snippet {
  static async readIndex(count: number, offset: number): Array {
    const results = await readIndex(
      // TODO: centralize this (we have something similar in bin/updateIndices)
      'masochist:snippets-index',
      count,
      offset
    );
    return results;
  }

  constructor(values) {
    this.id = values.id;
    this.title = values.title;
    this.body = values.body;
    this.format = values.format;
    this.createdAt = values.createdAt;
    this.updatedAt = values.updatedAt;
    this.tags = values.tags;
  }
}
