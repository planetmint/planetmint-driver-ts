// Copyright © 2020 Interplanetary Database Association e.V.,
// Planetmint and IPDB software contributors.
// SPDX-License-Identifier: (AGPL-3.0-or-later AND CC-BY-4.0)
// Code is AGPL-3.0-or-later and docs are CC-BY-4.0

import type {
  Condition,
  Ed25519Sha256,
  PreimageSha256,
  ThresholdSha256,
} from 'crypto-conditions';
import type { TypeId, TypeName } from 'crypto-conditions/types/types';

interface BaseJSONCondition {
  details: {
    [key: string]: any;
  };
  uri: string;
}

export interface JSONCondition extends BaseJSONCondition {
  details: {
    type_id: TypeId;
    bitmask: number;
    type: 'condition';
    hash: string;
    max_fulfillment_length: number;
  };
}

export interface PreimageSha256JSONCondition extends BaseJSONCondition {
  details: {
    type_id: TypeId.PreimageSha256;
    bitmask: 3;
    preimage?: string;
    type?: 'fulfillement';
  };
}

export interface ThresholdSha256JSONCondition extends BaseJSONCondition {
  details: {
    type: TypeName.ThresholdSha256;
    subConditions: (Ed25519Sha256JSONCondition | PreimageSha256JSONCondition)[];
  };
}

export interface Ed25519Sha256JSONCondition extends BaseJSONCondition {
  details: { type: TypeName.Ed25519Sha256; publicKey?: string };
}

export type JSONConditionUnion =
  | JSONCondition
  | PreimageSha256JSONCondition
  | ThresholdSha256JSONCondition
  | Ed25519Sha256JSONCondition;

declare function ccJsonify(
  fulfillment: PreimageSha256
): PreimageSha256JSONCondition;

declare function ccJsonify(
  fulfillment: ThresholdSha256
): ThresholdSha256JSONCondition;

declare function ccJsonify(
  fulfillment: Ed25519Sha256
): Ed25519Sha256JSONCondition;

declare function ccJsonify(fulfillment: Condition): JSONCondition;

export default ccJsonify;
