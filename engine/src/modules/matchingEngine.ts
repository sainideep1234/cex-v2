import Balance from "./balance";
import OrderBook from "./orderBook";
import type { CURRENCY_TYPE, Kind, MARKET_ASSETS, Side, Status } from "../utils/types"


interface EngineResponse {
    correlationId: string;
    ok: boolean;
    data?: unknown;
    error?: string;
}

export default class MatchingEngine {
    private orderBook: OrderBook;
    private balance: Balance;

    constructor() {
        this.orderBook = new OrderBook();
        this.balance = new Balance();
    }



    createOrder(correlationId: string, userId: string, symbol: MARKET_ASSETS, qty: number, kind: Kind, side: Side, price?: number): EngineResponse {
        if (!userId || !symbol || !qty || !kind || !side) {
            return {
                correlationId,
                ok: false,
                error: "please provide all teh arguments"
            }
        }
        if (kind === "limit") {
            if (!price) {
                return {
                    correlationId,
                    ok: false,
                    error: "it is a limit order please provide price as well"
                }
            }
            if (side === "buy") {
                // execute buy order
                const totalAmount = qty * price;
                const userUsdBalance = this.balance.getUsdBalance(userId);

                if (userUsdBalance >= totalAmount) {
                    // update the balance 
                    this.balance.deductAssetBalance(userId, totalAmount, "USD")
                    // call create order in orderBook
                    const orderDetails = this.orderBook.createLimitOrder(userId, symbol, qty, price, "buy");

                    //   :-  decrease the seller qty from fills
                    return {
                        correlationId,
                        ok: true,
                        data: orderDetails
                    }
                }
                return {
                    correlationId,
                    ok: false,
                    error: "User not has sufficient USD"
                }
            }

            // excute sell limit order
            const userAssetQty = this.balance.getAssetBalance(userId, symbol);
            if (userAssetQty >= qty) {
                // updatae the qty  
                let remainingQty = userAssetQty - qty;
                this.balance.UpdateAssetQty(userId, symbol, remainingQty);

                // excute limit order
                const orderDetails = this.orderBook.createLimitOrder(userId, symbol, qty, price, "sell");
                //   :- BUYER INCREASE BALNCE QTY
                if (remainingQty === 0) {
                    this.balance.deleteAssetEntry(userId, symbol);
                }
                //    decrease the buyer balance that comes in fills 
                return {
                    correlationId,
                    ok: true,
                    data: orderDetails
                }
            }

            return {
                correlationId,
                ok: false,
                error: "user has not sufficient qty"
            }
        }

        // market order buy
        // using order book sweep simulation
        if (side === "buy") {
            const totalAmount = qty * this.orderBook.getPriceAfterSweepSimulation(qty, symbol, "buy")
            const balance = this.balance.getUsdBalance(userId);
            if (totalAmount > balance) {
                return {
                    correlationId,
                    ok: false,
                    error: "cancelling order as user has not sufficient balance"
                }
            }
            // deduct balance
            this.balance.deductAssetBalance(userId, totalAmount, "USD")
            const orderDetails = this.orderBook.createMarketOrder(userId, symbol, qty, "buy", balance);
            //   :-  SELLER DECREASE BALNCE QTY
            return {
                correlationId,
                ok: true,
                data: orderDetails
            }
        }
        // market sell order
        const userAssetQty = this.balance.getAssetBalance(userId, symbol);

        if (userAssetQty >= qty) {
            let remainingQty = userAssetQty - qty;
            this.balance.UpdateAssetQty(userId, symbol, remainingQty)
            // only than swap happen 
            const orderDetails = this.orderBook.createMarketOrder(userId, symbol, qty, "sell", 0); // Balance not needed for sell market order logic in orderBook
            //   :- BUYER INCREASE BALNCE QTY
            return {
                correlationId,
                ok: true,
                data: orderDetails
            }
        }

        return {
            correlationId,
            ok: false,
            error: `in sufficient balance of ${symbol}`
        }

    }

    cancelOrder(correlationId: string, userId: string, orderId: string) {
        // add the cancelled qty to user balance
        return {
            correlationId,
            ok: true,
            data: this.orderBook.cancelOrder(userId, orderId)
        }

    }

    getOrderBookDepth(correlationId: string, symbol: MARKET_ASSETS) {
        return {
            correlationId,
            ok: true,
            data: this.orderBook.getDepth(symbol)
        }
    }

    getOrderOfUser(correlationId: string, userId: string, orderId: string) {
        return {
            correlationId,
            ok: true,
            data:
            {
                orderDetail: this.orderBook.getUserOrder(userId, orderId)
            }
        }
    }

    getAssetBalance(correlationId: string, userId: string, currencyType: CURRENCY_TYPE = "USD") {
        if (currencyType === "USD") {
            return {
                correlationId,
                ok: true,
                data: {
                    availabelBalancethis: this.balance.getUsdBalance(userId)
                }
            }
        }
        return {
            correlationId,
            ok: true,
            data: {
                availabelBalancethis: this.balance.getAssetBalance(userId, currencyType)
            }
        }


    }




    // extra
    depositeBalance(userId: string, currencyType: CURRENCY_TYPE, amount: number) {
        return {
            correlationId,
            ok: true,
            data: this.balance.addAssetBalance(userId, amount, currencyType)
        }
    }
    // extra
    getALlAssetOfUser(userId: string) {


        return {
            correlationId,
            ok: true,
            data: this.balance.getAllAssets(userId)
        }
    }
    // extra
    getFillsOfUser(userId: string) {
        return {
            correlationId,
            ok: true,
            data: {
                Userfills: this.orderBook.getFillsOfUser(userId)
            }
        }
    }
    // extra

}