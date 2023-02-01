// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

import type { RequestConfig } from './baseRequest';

export interface Node {
  endpoint: string;
  headers: Record<string, string | string[]>;
}

export default class Request {
  private node: Node;
  private backoffTime: number;
  private retries: number;
  private connectionError?: Error;

  constructor(node: Node);

  request<O = Record<string, any>>(
    urlPath: string,
    config?: RequestConfig,
    timeout?: number,
    maxBackoffTime?: number
  ): Promise<O>;

  updateBackoffTime(maxBackoffTime: number): void;

  getBackoffTimedelta(): number;

  static sleep(ms: number): void;
}
