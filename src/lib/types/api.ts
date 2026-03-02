export interface BlockResponse {
  number: number;
  hash: string;
  parentHash: string;
  stateRoot: string;
  timestamp: number;
  proposer: string;
  gasUsed: number;
  gasLimit: number;
  baseFee: string;
  transactionCount: number;
}

export interface PaginatedBlocksResponse {
  items: BlockResponse[];
  page: number;
  pageSize: number;
  totalItems: number;
}

export interface TransactionDetailResponse {
  hash: string;
  type: string;
  nonce: number;
  sender: string;
  to: string;
  value: string;
  gasLimit: number;
  gasPrice: string;
  maxFeePerGas: string | null;
  maxPriorityFeePerGas: string | null;
  priority: number;
  blockNumber: number | null;
  blockHash: string | null;
  transactionIndex: number | null;
  data: string | null;
  dataSize: number;
  complianceProofCount: number;
  gasUsed: number | null;
  success: boolean | null;
  errorCode: string | null;
  effectiveGasPrice: string | null;
  logs: LogEntry[] | null;
}

export interface LogEntry {
  contract: string;
  eventSignature: string;
  topics: string[];
  data: string;
}

export interface ReceiptResponse {
  transactionHash: string;
  blockHash: string;
  blockNumber: number;
  transactionIndex: number;
  from: string;
  to: string;
  gasUsed: number;
  success: boolean;
  errorCode: string;
  postStateRoot: string;
  effectiveGasPrice: string;
  logs: LogEntry[];
}

export interface AccountResponse {
  address: string;
  balance: string;
  nonce: number;
  accountType: string;
}

export interface StatusResponse {
  blockHeight: number;
  latestBlockHash: string;
  mempoolSize: number;
  protocolVersion: string;
}

export interface DexPoolResponse {
  poolId: number;
  token0: string;
  token1: string;
  feeBps: number;
  reserve0: string;
  reserve1: string;
  totalSupply: string;
}

export interface DexOrderResponse {
  orderId: number;
  owner: string;
  poolId: number;
  price: string;
  amount: string;
  isBuy: boolean;
  expiryBlock: number;
}

export interface DexTwapResponse {
  poolId: number;
  twap: string;
  spotPrice: string;
  volatilityBps: number;
  windowBlocks: number;
  currentBlock: number;
}

export interface DexPricePointResponse {
  block: number;
  timestamp: number;
  price: string;
}

export interface DexPriceHistoryResponse {
  poolId: number;
  points: DexPricePointResponse[];
  currentBlock: number;
  blockTimeMs: number;
}

export interface SolverInfoResponse {
  address: string;
  endpoint: string;
  registeredAt: number;
  solutionsAccepted: number;
  solutionsRejected: number;
}

export interface TransactionSubmitResponse {
  hash: string;
  status: string;
}

export interface CallRequest {
  to: string;
  data: string;
  from?: string;
  gasLimit?: number;
}

export interface CallResponse {
  success: boolean;
  returnData: string;
  gasUsed: number;
  error: string | null;
}

export interface FaucetResponse {
  hash: string;
  amount: string;
}
