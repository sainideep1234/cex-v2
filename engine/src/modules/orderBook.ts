import {OrderedMap}  from "js-sdsl"
import type { Kind, MARKET_ASSETS, Side, Status } from "./matchingEngine"

type Fills = {
    qty:number,
    price:number
}

interface createOrderResponse{
    orderId: string , 
    filledQty :number , 
    totalQty:number, 
    averagePrice : number,
    fills?: Fills[]
}

export default class OrderBook{
   
    /*
    orderBook = {
        "SOL":{
            ASKS:{
                1000:{
                    total:10
                    orders:{
                        orderId:1,
                        userId:2
                    }
                }  
            }
            BIDS:{
            }
        }
        "BTC":
    }

    */


    private orderBook : Partial<Record< MARKET_ASSETS , {BIDS : OrderedMap<number , {
        total:number,
        orders:{
            orderId:string,
            userId:string
        }[]
    }> , ASKS: OrderedMap<number , {
        total:number ,
        orders:{
            orderId:string,
            userId:string
        }[]
    }> }>>
   
    public orderCounter = 1;
    
    
    private fills: Record<string , Record< MARKET_ASSETS , {total:number , filled:number , price:number ,  time:Date}[]> >
    
    private order : Record< string , {orderId : string , qty : string , price :number , side : Side , kind : Kind , status: Status }[]>
    
    constructor(){
        this.orderBook = {}
        this.fills = {}
        this.order = {}
    }
    
    getOrCreateMarket(symbol:MARKET_ASSETS){
        if(!this.orderBook[symbol]){
            this.orderBook[symbol] = {
                BIDS: new OrderedMap([] , (a , b)=> b-a ),
                ASKS:new OrderedMap([] , (a , b) => b-a)
                
            }
        }
    }
    
    getDepth(symbol:string ){}
    
    createLimitOrder(userId:string , symbol :string , qty: number , price: number, side:Side  ):createOrderResponse {

    }
    
    createMarketOrder(userId:string , symbol :string , qty: number , side:Side  ):createOrderResponse{}
    
    cancelOrder(userId:string , orderId:string){}
    
    getPriceAfterSweepSimulation(qty : number, symbol:string):number{}


}