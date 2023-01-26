// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

export interface RequestConfig {
  headers?: Record<string, string | string[]>;
  jsonBody?: Record<string, any>;
  query?: Record<string, any>;
  method?: 'GET' | ' POST' | 'PUT';
  urlTemplateSpec?: any[] | Record<string, any>;
  [key: string]: any;
}

export function ResponseError(
  message: string,
  status?: number,
  requestURI?: string
): void;

declare function timeout<T = Response>(
  ms: number,
  promise: Promise<T>
): Promise<T>;

declare function handleResponse(res: Response): Response;

export default function baseRequest(
  url: string,
  config: RequestConfig,
  requestTimeout?: number
): Promise<Response>;
