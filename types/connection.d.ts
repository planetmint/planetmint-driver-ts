// Copyright BigchainDB GmbH and BigchainDB contributors
// SPDX-License-Identifier: (Apache-2.0 AND CC-BY-4.0)
// Code is Apache-2.0 and docs are CC-BY-4.0

import type { RequestConfig } from './baseRequest';
import type { Node } from './request';
import type Transport from './transport';
import type {
  CreateTransaction,
  TransactionOperations,
  TransferTransaction,
  TransactionCommon,
  CID,
  TransactionVersion,
} from './transaction';

declare const DEFAULT_NODE = 'http://localhost:9984/api/v1/';
declare const DEFAULT_TIMEOUT = 20000; // The default value is 20 seconds

export interface InputNode {
  endpoint: string;
}

export type AssetResult = {
  id: string;
  data: Record<string, any> | CID;
};

export type MetadataResult = {
  id: string;
  metadata: Record<string, any> | CID;
};

export type TransactionResult<
  O extends TransactionOperations,
  V extends TransactionVersion = TransactionVersion.V3,
  D = CID,
  M = CID
> = O extends TransactionOperations.CREATE
  ? CreateTransaction<V, D, M>
  : TransferTransaction<V, M>;

export enum Endpoints {
  blocks = 'blocks',
  blocksDetail = 'blocksDetail',
  outputs = 'outputs',
  transactions = 'transactions',
  transactionsSync = 'transactionsSync',
  transactionsAsync = 'transactionsAsync',
  transactionsCommit = 'transactionsCommit',
  transactionsDetail = 'transactionsDetail',
  assets = 'assets',
  metadata = 'metadata',
}

export interface EndpointsUrl {
  [Endpoints.blocks]: 'blocks';
  [Endpoints.blocksDetail]: 'blocks/%(blockHeight)s';
  [Endpoints.outputs]: 'outputs';
  [Endpoints.transactions]: 'transactions';
  [Endpoints.transactionsSync]: 'transactions?mode=sync';
  [Endpoints.transactionsAsync]: 'transactions?mode=async';
  [Endpoints.transactionsCommit]: 'transactions?mode=commit';
  [Endpoints.transactionsDetail]: 'transactions/%(transactionId)s';
  [Endpoints.assets]: 'assets';
  [Endpoints.metadata]: 'metadata';
}

export interface EndpointsResponse<
  O = TransactionOperations.CREATE,
  V = TransactionVersion.V3,
  D = CID,
  M = CID
> {
  [Endpoints.blocks]: number[];
  [Endpoints.blocksDetail]: {
    height: number;
    transactions: (CreateTransaction | TransferTransaction)[];
  };
  [Endpoints.outputs]: {
    transaction_id: string;
    output_index: number;
  }[];
  [Endpoints.transactions]: O extends TransactionOperations.CREATE
    ? CreateTransaction<V, D, M>[]
    : O extends TransactionOperations.TRANSFER
    ? TransferTransaction<V, M>[]
    : (CreateTransaction<V, D, M> | TransferTransaction<V, M>)[];
  [Endpoints.transactionsSync]: TransactionResult<O, V, D, M>;
  [Endpoints.transactionsAsync]: TransactionResult<O, V, D, M>;
  [Endpoints.transactionsCommit]: TransactionResult<O, V, D, M>;
  [Endpoints.transactionsDetail]: TransactionResult<O, V, D, M>;
  [Endpoints.assets]: AssetResult[];
  [Endpoints.metadata]: MetadataResult[];
}

export default class Connection {
  private transport: Transport;
  private normalizedNodes: Node[];
  private headers: Record<string, string | string[]>;

  constructor(
    nodes: string | InputNode | (string | InputNode)[],
    headers?: Record<string, string | string[]>,
    timeout?: number
  );

  static normalizeNode(
    node: string | InputNode,
    headers: Record<string, string | string[]>
  ): Node;

  static getApiUrls<E extends keyof EndpointsUrl>(endpoint: E): EndpointsUrl[E];

  private _req<E extends keyof EndpointsUrl, O = Record<string, any>>(
    path: EndpointsUrl[E],
    options: RequestConfig
  ): Promise<O>;

  getBlock(
    blockHeight: number | string
  ): Promise<EndpointsResponse[Endpoints.blocksDetail]>;

  getTransaction<O extends TransactionOperations>(
    transactionId: string
  ): Promise<EndpointsResponse<O>[Endpoints.transactionsDetail]>;

  listBlocks(
    transactionId: string
  ): Promise<EndpointsResponse[Endpoints.blocks]>;

  listOutputs(
    publicKey: string,
    spent?: boolean
  ): Promise<EndpointsResponse[Endpoints.outputs]>;

  listTransactions<
    O extends TransactionOperations,
    V extends TransactionVersion
  >(
    assetIds: string[],
    operation?: O
  ): Promise<EndpointsResponse<O, V>[Endpoints.transactions]>;

  postTransaction<
    O extends TransactionOperations,
    V extends TransactionVersion,
    D = CID,
    M = CID
  >(
    transaction: TransactionCommon<O, V, D, M>
  ): Promise<EndpointsResponse<O, V, D, M>[Endpoints.transactionsCommit]>;

  postTransactionSync<
    O extends TransactionOperations,
    V extends TransactionVersion,
    D = CID,
    M = CID
  >(
    transaction: TransactionCommon<O, V, D, M>
  ): Promise<EndpointsResponse<O, V, D, M>[Endpoints.transactionsSync]>;

  postTransactionAsync<
    O extends TransactionOperations,
    V extends TransactionVersion,
    D = CID,
    M = CID
  >(
    transaction: TransactionCommon<O, V, D, M>
  ): Promise<EndpointsResponse<O, V, D, M>[Endpoints.transactionsAsync]>;

  postTransactionCommit<
    O extends TransactionOperations,
    V extends TransactionVersion,
    D = CID,
    M = CID
  >(
    transaction: TransactionCommon<O, V, D, M>
  ): Promise<EndpointsResponse<O, V, D, M>[Endpoints.transactionsCommit]>;

  searchAssets(
    cid: CID,
    limit?: number
  ): Promise<EndpointsResponse[Endpoints.assets]>;

  searchMetadata(
    search: string,
    limit?: number
  ): Promise<EndpointsResponse[Endpoints.metadata]>;
}
