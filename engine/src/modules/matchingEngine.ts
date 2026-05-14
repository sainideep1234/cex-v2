import Balance  from "./balance";
import OrderBook from "./orderBook";
import type { CURRENCY_TYPE, Kind, MARKET_ASSETS, Side, Status } from "../utils/types"
import { createModuleResolutionCache } from "typescript";
import { randomUUIDv5 } from "bun";


interface EngineResponse {
  correlationId: string;
  ok: boolean;
  data?: unknown;
  error?: string;
}

export default class MatchingEngine{
    private orderBook : OrderBook;
    private balance : Balance;

    constructor(){
        this.orderBook = new OrderBook();
        this.balance = new Balance();
    }
    
    createOrder( correlationId:string , userId :string, symbol:MARKET_ASSETS ,  qty:number , kind:Kind , side: Side , price? : number  ): EngineResponse{
        if(!correlationId || !userId || !symbol || !qty || !kind || !side ){
            return {
                    correlationId, 
                    ok:false,
                    error:"please provide all teh arguments"
                }
        }
        if(kind === "LIMIT"){
            if(!price){
                return {
                    correlationId, 
                    ok:false,
                    error:"it is a limit order please provide price as well"
                }
            }
            if(side === "BUY"){
                // execute buy order
                const totalAmount = qty * price;
                const userUsdBalance = this.balance.getUsdBalance(userId);

                if(userUsdBalance >= totalAmount){
                    // update the balance 
                    this.balance.deductAssetBalance(userId , totalAmount , "USD")
                    // call create order in orderBook
                    const orderDetails = this.orderBook.createLimitOrder(userId  , symbol , qty , price , "BUY"  );
                    
                    return {
                        correlationId , 
                        ok:true , 
                        data:orderDetails
                    }
                }
                return {
                    correlationId, 
                    ok:false,
                    error:"User not has sufficient USD"
                }
            }

            // excute sell limit order
            const userAssetQty = this.balance.getAssetBalance(userId , symbol);
            if(userAssetQty >= qty ){
                // updatae the qty 
                let remainingQty = userAssetQty - qty;
                this.balance.UpdateAssetQty(userId , symbol , remainingQty);

                // excute limit order
                const orderDetails = this.orderBook.createLimitOrder(userId  , symbol , qty , price , "SELL"  );
                // TO DO :- BUYER INCREASE BALNCE QTY
                if(remainingQty === 0){
                    this.balance.deleteAssetEntry(userId , symbol);
                }
                return {
                    correlationId , 
                    ok:true , 
                    data:orderDetails
                }   
            }

            return {
                    correlationId, 
                    ok:false,
                    error:"user has not sufficient qty"
                }
        }

        // market order buy
        // using order book sweep simulation
        if(side=== "BUY"){
            const totalAmount = qty *  this.orderBook.getPriceAfterSweepSimulation(qty , symbol , "BUY")
            const balance = this.balance.getUsdBalance(userId);
            if(totalAmount > balance){
                return {
                    correlationId, 
                    ok:false,
                    error:"cancelliong order as user has not sufficient balance"
                }
            }
            // deduct balance
            this.balance.deductAssetBalance(userId, totalAmount , "USD")
            const orderDetails = this.orderBook.createMarketOrder(userId , symbol , qty , "BUY" );
            // TO DO :-  SELLER DECREASE BALNCE QTY
            return {
                    correlationId , 
                    ok:true , 
                    data:orderDetails
            }
        }
        // market sell order
        const userAssetQty = this.balance.getAssetBalance(userId , symbol);
        
        if(userAssetQty >= qty){
            let remainingQty = userAssetQty - qty;
            this.balance.UpdateAssetQty(userId , symbol , remainingQty)
            // only than swap happen 
            const orderDetails = this.orderBook.createMarketOrder(userId , symbol , qty , "SELL" );
            // TO DO :- BUYER INCREASE BALNCE QTY
            return {
                correlationId , 
                ok:true , 
                data:orderDetails
            }
        }

        return {
            correlationId, 
            ok:false,
            error:`in sufficient balance of ${symbol}`
        }
            
    }

    cancelOrder(correlationId:string , userId :string , orderId:string){
       return  {
                correlationId , 
                ok:true , 
                data:this.orderBook.cancelOrder(userId , orderId)
                }
       
    }

    depositeBalance(correlationId:string , userId:string , currencyType:CURRENCY_TYPE , amount : number){
      return  {
            correlationId , 
            ok:true , 
            data :this.balance.addAssetBalance(userId , amount , currencyType);
      }
    }
    
    getALlAssetOfUser(correlationId:string , userId :string){

        
      return   {
                correlationId , 
                ok:true , 
                data :this.balance.getAllAssets(userId)
      }
    }
    
    getOrderBookDepth(correlationId:string , symbol:MARKET_ASSETS){
       return {
            correlationId , 
            ok:true , 
            data : this.orderBook.getDepth(symbol)
       }
    }

    getOrderOfUser(correlationId: string , ucorrelationId:string , userId:string){
       return {
                correlationId , 
                ok:true , 
       data :this.orderBook.getOrdersOfUser(userId)
       }
    }

    getFillsOfUser(correlationId:string , userId : string){
       return {
                correlationId , 
                ok:true , 
       data : this.orderBook.getFillsOfUser(userId)
       }
    }

    getAssetBalance( correlationId:string , userId : string , currencyType:CURRENCY_TYPE){
        if(currencyType === "USD"){
            return{
                correlationId , 
                ok:true , 
                data :this.balance.getUsdBalance(userId)
            }
        }
        return {
            correlationId , 
            ok:true , 
            data :this.balance.getAssetBalance(userId , currencyType)
        }
        

    }
}