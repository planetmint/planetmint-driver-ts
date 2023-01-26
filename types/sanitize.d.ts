// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

declare type FilterFn = (val: any, key?: string) => void;

declare function filterFromObject<I = Record<string, any>>(
  obj: I,
  filter: Array<any> | FilterFn,
  conf: { isInclusion?: boolean }
): Partial<I>;

declare function applyFilterOnObject<I = Record<string, any>>(
  obj: I,
  filterFn?: FilterFn
): Partial<I>;

declare function selectFromObject<I = Record<string, any>>(
  obj: I,
  filter: Array<any> | FilterFn
): Partial<I>;

export default function sanitize<I = Record<string, any>>(
  obj: I
): Partial<I> | I;
