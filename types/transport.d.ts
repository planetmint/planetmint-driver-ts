// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

import Request, { Node } from './request';
import type { RequestConfig } from './baseRequest';

export default class Transport {
  private connectionPool: Request[];
  private timeout: number;
  private maxBackoffTime: number;

  constructor(nodes: Node[], timeout: number);

  pickConnection(): Request;

  forwardRequest<O = Record<string, any>>(
    path: string,
    config: RequestConfig
  ): Promise<O>;
}
