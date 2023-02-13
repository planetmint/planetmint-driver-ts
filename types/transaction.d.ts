import type {
  Ed25519Sha256,
  Fulfillment,
  PreimageSha256,
  ThresholdSha256,
} from 'crypto-conditions';
import {
  Ed25519Sha256JSONCondition,
  PreimageSha256JSONCondition,
  ThresholdSha256JSONCondition,
} from './utils/ccJsonify';

export interface TransactionInput {
  fulfillment: string;
  fulfills: {
    output_index: number;
    transaction_id: string;
  } | null;
  owners_before: string[];
}

export interface TransactionOutput {
  amount: string;
  condition:
    | PreimageSha256JSONCondition
    | ThresholdSha256JSONCondition
    | Ed25519Sha256JSONCondition;
  public_keys: string[];
}

export enum TransactionOperations {
  CREATE = 'CREATE',
  TRANSFER = 'TRANSFER',
}

export enum TransactionVersion {
  V2 = '2.0',
  V3 = '3.0',
}

export type CID = string;

export type Metadata<
  V extends TransactionVersion = TransactionVersion.V3,
  M extends Record<string, any> = Record<string, unknown>
> = V extends TransactionVersion.V3 ? CID : M;

export type AssetData<
  V extends TransactionVersion = TransactionVersion.V3,
  D extends Record<string, any> | CID = CID
> = V extends TransactionVersion.V3 ? CID : D;

export type TransactionAssetMap<
  O extends TransactionOperations,
  V extends TransactionVersion = TransactionVersion.V3,
  D extends Record<string, any> | CID = CID
> = O extends TransactionOperations.CREATE
  ? {
      data: AssetData<V, D>;
    }
  : {
      id: string;
    };

export interface TransactionCommon<
  O extends TransactionOperations,
  V extends TransactionVersion = TransactionVersion.V3,
  D extends Record<string, any> | CID = CID,
  M extends Record<string, any> = Record<string, any>
> {
  id?: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
  version: V;
  metadata: Metadata<V, M>;
  operation: O;
  asset: V extends TransactionVersion.V2 ? TransactionAssetMap<O, V, D> : never;
  assets: V extends TransactionVersion.V3
    ? TransactionAssetMap<O, V, D>[] & { 0: TransactionAssetMap<O, V, D> }
    : never;
}

export interface TransactionCommonSigned<
  O extends TransactionOperations,
  V extends TransactionVersion = TransactionVersion.V3,
  D extends Record<string, any> | CID = CID,
  M extends Record<string, any> = Record<string, any>
> extends Omit<TransactionCommon<O, V, D, M>, 'id'> {
  id: string;
}

export interface CreateTransaction<
  V extends TransactionVersion = TransactionVersion.V3,
  D extends Record<string, any> | CID = CID,
  M extends Record<string, any> = Record<string, any>
> extends TransactionCommon<TransactionOperations.CREATE, V, D, M> {
  id: string;
  operation: TransactionOperations.CREATE;
}

export interface TransferTransaction<
  V extends TransactionVersion = TransactionVersion.V3,
  M extends Record<string, any> = Record<string, any>
> extends TransactionCommon<
    TransactionOperations.TRANSFER,
    V,
    { id: string },
    M
  > {
  id: string;
  operation: TransactionOperations.TRANSFER;
}

export interface TransactionUnspentOutput {
  tx: TransactionCommon<
    TransactionOperations.CREATE | TransactionOperations.TRANSFER
  >;
  output_index: number;
}

interface TxTemplate<V extends TransactionVersion = TransactionVersion.V3> {
  id: null;
  operation: null;
  outputs: [];
  inputs: [];
  metadata: null;
  asset: V extends TransactionVersion.V2 ? null : never;
  assets: V extends TransactionVersion.V3 ? null : never;
  version: V;
}

export type DelegateSignFunction = (
  serializedTransaction: string,
  input: TransactionInput,
  index?: number
) => string;

export type DelegateSignFunctionAsync = (
  serializedTransaction: string,
  input: TransactionInput,
  index?: number
) => Promise<string>;

export default class Transaction {
  static serializeTransactionIntoCanonicalString<
    O extends TransactionOperations
  >(transaction: TransactionCommon<O>): string;

  static serializeTransactionIntoCanonicalString(
    transaction: CreateTransaction | TransferTransaction
  ): string;

  static makeEd25519Condition(publicKey: string): Ed25519Sha256JSONCondition;

  static makeEd25519Condition(
    publicKey: string,
    json: true
  ): Ed25519Sha256JSONCondition;

  static makeEd25519Condition(publicKey: string, json: false): Ed25519Sha256;

  static makeEd25519Condition(
    publicKey: string,
    json?: boolean
  ): Ed25519Sha256 | Ed25519Sha256JSONCondition;

  static makeSha256Condition(preimage: string): PreimageSha256JSONCondition;

  static makeSha256Condition(
    preimage: string,
    json: true
  ): PreimageSha256JSONCondition;

  static makeSha256Condition(preimage: string, json: false): PreimageSha256;

  static makeSha256Condition(
    preimage: string,
    json?: boolean
  ): PreimageSha256 | PreimageSha256JSONCondition;

  static makeThresholdCondition(
    threshold: number,
    subconditions: (string | Fulfillment)[]
  ): ThresholdSha256JSONCondition;

  static makeThresholdCondition(
    threshold: number,
    subconditions: (string | Fulfillment)[],
    json: true
  ): ThresholdSha256JSONCondition;

  static makeThresholdCondition(
    threshold: number,
    subconditions: (string | Fulfillment)[],
    json: false
  ): ThresholdSha256;

  static makeThresholdCondition(
    threshold: number,
    subconditions: (string | Fulfillment)[],
    json?: boolean
  ): ThresholdSha256 | ThresholdSha256JSONCondition;

  static makeInputTemplate(
    publicKeys: string[],
    fulfills?: TransactionInput['fulfills'],
    fulfillment?: TransactionInput['fulfillment']
  ): TransactionInput;

  static makeOutput(
    condition:
      | PreimageSha256JSONCondition
      | ThresholdSha256JSONCondition
      | Ed25519Sha256JSONCondition,
    amount?: string
  ): TransactionOutput;

  static makeTransactionTemplate<
    V extends TransactionVersion = TransactionVersion.V3
  >(version?: V): TxTemplate<V>;

  static makeTransaction<
    O extends TransactionOperations,
    V extends TransactionVersion = TransactionVersion.V3,
    D extends Record<string, any> | CID = CID,
    M extends Record<string, any> = Record<string, any>
  >(
    operation: O,
    assets: V extends TransactionVersion.V3
      ? TransactionAssetMap<O, V, D>[]
      : TransactionAssetMap<O, V, D>,
    metadata: Metadata<V, M>,
    outputs: TransactionOutput[],
    inputs: TransactionInput[],
    version: V
  ): TransactionCommon<O, V, D, M>;

  static makeCreateTransaction(
    assetData: CID[],
    metadata: CID,
    outputs: TransactionOutput[],
    ...issuers: string[]
  ): CreateTransaction<TransactionVersion.V3, CID[]>;

  static makeCreateTransactionV2<
    D extends Record<string, any> = Record<string, any>,
    M extends Record<string, any> = Record<string, any>
  >(
    assetData: D,
    metadata: M,
    outputs: TransactionOutput[],
    ...issuers: string[]
  ): CreateTransaction<TransactionVersion.V2, D, M>;

  private static makeBaseTransferTransaction(
    unspentOutputs: TransactionUnspentOutput[]
  ): {
    asset?: TransactionAssetMap<
      TransactionOperations.TRANSFER,
      TransactionVersion.V2,
      any
    >;
    assets?: TransactionAssetMap<
      TransactionOperations.TRANSFER,
      TransactionVersion.V3,
      any
    >[];
    inputs: TransactionInput[];
  };

  static makeTransferTransaction(
    unspentOutputs: TransactionUnspentOutput[],
    outputs: TransactionOutput[],
    metadata: CID
  ): TransferTransaction<TransactionVersion.V3>;

  static makeTransferTransactionV2<
    M extends Record<string, any> = Record<string, any>
  >(
    unspentOutputs: TransactionUnspentOutput[],
    outputs: TransactionOutput[],
    metadata: M
  ): TransferTransaction<TransactionVersion.V2, M>;

  static signTransaction<
    O extends TransactionOperations = TransactionOperations.CREATE,
    V extends TransactionVersion = TransactionVersion.V3
  >(
    transaction: TransactionCommon<O, V>,
    ...privateKeys: string[]
  ): TransactionCommonSigned<O, V>;

  static delegateSignTransaction<
    O extends TransactionOperations = TransactionOperations.CREATE,
    V extends TransactionVersion = TransactionVersion.V3
  >(
    transaction: TransactionCommon<O, V>,
    signFn: DelegateSignFunction
  ): TransactionCommonSigned<O, V>;

  static delegateSignTransactionAsync<
    O extends TransactionOperations = TransactionOperations.CREATE,
    V extends TransactionVersion = TransactionVersion.V3
  >(
    transaction: TransactionCommon<O, V>,
    signFn: DelegateSignFunctionAsync
  ): Promise<TransactionCommonSigned<O, V>>;
}
