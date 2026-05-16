import "dotenv/config";
import { createClient } from "redis";
import { env } from "./utils/env.js";
import MatchingEngine from "./modules/matchingEngine.js";
import type { CURRENCY_TYPE, Kind, MARKET_ASSETS, Side } from "./utils/types.js";

const matchingEngine = new MatchingEngine()

export type EngineCommandType =
  | "create_order"
  | "get_depth"
  | "get_user_balance"
  | "get_order"
  | "cancel_order"

export interface EngineRequest {
  correlationId: string;
  responseQueue: string;
  type: EngineCommandType;
  payload: Record<string, unknown>;
}

export interface EngineResponse {
  correlationId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

const brokerClient = createClient({ url: env.redisUrl }).on("error", (error) => {
  console.error("Redis broker client error", error);
});

const responseClient = createClient({ url: env.redisUrl }).on("error", (error) => {
  console.error("Redis response client error", error);
});

await Promise.all([brokerClient.connect(), responseClient.connect()]);

// :-)) I added this just to check the flow, remove it when you start
const DUMMY_SELL_ORDER = {
  orderId: "dummy-sell-order-1",
  userId: "dummy-seller",
  type: "limit",
  side: "sell",
  symbol: "BTC",
  price: 100,
  qty: 1,
  filledQty: 0,
  status: "open",
};

async function sendResponse(responseQueue: string, response: EngineResponse): Promise<void> {
  await responseClient.lPush(responseQueue, JSON.stringify(response));
}

function handleEngineRequest(message: EngineRequest): unknown {

  if (message.type === "create_order") {
    const { userId, type, symbol, side, price, qty } = message.payload;
    const orderFilledDetails = matchingEngine.createOrder(message.correlationId, userId as string, symbol as MARKET_ASSETS, qty as number, type as Kind, side as Side, price as number);
    return orderFilledDetails;
  }

  else if (message.type === "get_depth") {
    const symbol = message.payload.symbol as MARKET_ASSETS;
    const depth = matchingEngine.getOrderBookDepth(message.correlationId, symbol);
    return depth
  }

  else if (message.type === "cancel_order") {
    const userId = message.payload.userId as string;
    const orderId = message.payload.orderId as string;

    matchingEngine.cancelOrder(message.correlationId, userId, orderId);
    return {
      message: `you order with orderId : ${orderId} , cancelled successfully`
    }

  }

  else if (message.type === "get_order") {

  }
  else if (message.type === "get_user_balance") {
    const userId = message.payload.userId as string;
    const currencyType = message.payload.currencyType as CURRENCY_TYPE;

    return matchingEngine.getAssetBalance(message.correlationId, userId, currencyType)
  }
  throw new Error("TODO(student): implement this engine request type");
}

console.log(`Engine listening on Redis queue: ${env.incomingQueue}`);

for (; ;) {
  const item = await brokerClient.brPop(env.incomingQueue, 0);
  if (!item) continue;

  let message: EngineRequest;

  try {
    message = JSON.parse(item.element) as EngineRequest;
  } catch {
    console.error("Skipping invalid broker message");
    continue;
  }

  try {
    const data = handleEngineRequest(message);
    await sendResponse(message.responseQueue, {
      correlationId: message.correlationId,
      ok: true,
      data,
    });
  } catch (error) {
    await sendResponse(message.responseQueue, {
      correlationId: message.correlationId,
      ok: false,
      error: error instanceof Error ? error.message : "engine_error",
    });
  }
}