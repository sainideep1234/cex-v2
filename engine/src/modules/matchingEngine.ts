import Balance  from "./balance";
import OrderBook from "./orderBook";

export type Side = "SELL" | "BUY"
export type Kind = "MARKET" | "LIMIT" 
export type CURRENCY_TYPE = "USD" | "SOL" | "BTC";
export type MARKET_ASSETS = "SOL" | "BTC"
export type Status = "FILLED" | "PENDING" | "COMPLETED" | "CANCELLED";


interface EngineResponse {
  correlationId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export default class MatchingEngine{
    private orderBook : OrderBook;
    private userBalance : Balance;

    constructor(){
        this.orderBook = new OrderBook();
        this.userBalance = new Balance();
    }

    createOrder( correlationId:string , userId :string,symbol:MARKET_ASSETS ,  qty:number , kind:Kind , side: Side , price? : number  ): EngineResponse{
        
        if(kind === "LIMIT"){
            if(!price){
                return {
                    correlationId, 
                    ok:false,
                    error:"it is a limit order please provide price as well"
                }
            }
            const totalAmount = qty * price;
            const userUsdBalance = this.userBalance.getUsdBalance(userId);

            if(userUsdBalance >= totalAmount){
                // call create order in orderBook
                const orderDetails = this.orderBook.createLimitOrder(userId  , symbol , qty , price , side  );
                return {
                    correlationId , 
                    ok:true , 
                    data:orderDetails
                }
            }else{
                return {
                    correlationId, 
                    ok:false,
                    error:"User not has sufficient USD"
                }
            }
            
        }else{
            // market order buy
            // using order book sweep simulation
            if(side=== "BUY"){
                const totalAmount =qty *  this.orderBook.getPriceAfterSweepSimulation(qty , symbol)
                const userBalance = this.userBalance.getUsdBalance(userId);
                if(totalAmount >= userBalance){
                    return {
                        correlationId, 
                        ok:false,
                        error:"it is a limit order please provide price as well"
                    }
                }

                const orderDetails = this.orderBook.createMarketOrder(userId , symbol , qty , side );
                return {
                        correlationId , 
                        ok:true , 
                        data:orderDetails
                }
            }else{
                // market sell order
                const userAssetbalance = this.userBalance.getUserAssetBalance(userId , symbol);
                if(userAssetbalance >= qty){
                    // only than swap happen 
                const orderDetails = this.orderBook.createMarketOrder(userId , symbol , qty , side );
                return {
                    correlationId , 
                    ok:true , 
                    data:orderDetails
                }
                }else{
                   return {
                        correlationId, 
                        ok:false,
                        error:`in sufficient balance of ${symbol}`
                    }
                }
            }
            }
    }

    cancelOrder(userId :string , orderId:string){}

    depositeBalance(userId:string , currencyType:CURRENCY_TYPE , amount : number){}
    
    getUserBalance(userId :string){}
    
    getOrderBookDepth(symbol:MARKET_ASSETS){}

    getOrderOfUser(userId:string){}


}