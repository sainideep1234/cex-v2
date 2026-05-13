import {OrderedMap}  from "js-sdsl"
import type { Kind, MARKET_ASSETS, Side, Status } from "../utils/types"
import { createDocumentRegistry, createSolutionBuilderWithWatchHost } from "typescript"


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

interface OrderBookOrder{
    orderId:string,
    userId:string, 
    totalQty:number,
    filledQty: number,
    createdAt: Date
}

interface PriceLevel{
    total:number,
    orders:OrderBookOrder[]
}


interface OrderDetail { orderId : string ,symbol : MARKET_ASSETS, qty : number , price :number , side : Side , kind : Kind , status: Status , createdAt : Date }

interface  FillDetail  {total:number , filled:number , price:number ,  createdAt:Date}

interface createUserOrderResponse {
    orderId : string , 
    userId: string
    qty : number , 
    side : Side , 
    kind : Kind , 
    status : Status, 
    createdAt : Date , 
    price: number, 
    symbol:MARKET_ASSETS
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

    private orderBook : Partial<Record< MARKET_ASSETS , {BIDS : OrderedMap<number , PriceLevel> , ASKS: OrderedMap<number , PriceLevel>}>>
    
    private fills: Record<string , Partial<Record< MARKET_ASSETS , FillDetail[]> >>
    
    private orders : Record< string , OrderDetail[]>
    
    constructor(){
        this.orderBook = {}
        this.fills = {}
        this.orders = {}
    }

    // name createOrderResponse (NOOOO ), Order (YESSS)
   
    /*
    createLimitOrder(userId:string , symbol :MARKET_ASSETS , qty: number , price: number, side:Side ):createOrderResponse {
        // create order 
        const orderResponse = this.createUserOrder(side,qty,userId, price,"LIMIT")

        // match order  and swap assets 
        const assetOrderBook =  this.getOrCreateMarket(symbol);
        
        if(side === "BUY"){
            
            let  askSidePriceLevel = assetOrderBook["ASKS"].getElementByKey(price);

            if(!askSidePriceLevel || Object.keys(askSidePriceLevel).length === 0 ) {
                let askSidePriceAssetDetail = assetOrderBook.ASKS.getElementByKey(price);
                
                if(!askSidePriceAssetDetail){
                    askSidePriceAssetDetail = {total : 0  , orders:[]};
                    assetOrderBook.ASKS.setElement(price , askSidePriceAssetDetail );
                }

                let askSideOrder = {
                        orderId: this.orderCounter , 
                        userId,
                        totalQty :qty, 
                        filledQty : 0,
                        createdAt : new Date()
                        
                }
                
                askSidePriceAssetDetail.orders.push(askSideOrder);
                askSidePriceAssetDetail.total = askSidePriceAssetDetail.total + qty;

            }
            else{
                // bids present  match logic
                if(askSidePriceLevel.total >= qty){
                    // execute order 
                    askSidePriceLevel.total = askSidePriceLevel.total - qty;
                    
                    // add value in order and fills 
                    askSidePriceLevel.orders.forEach((bidSideUserOrder , idx)=>{

                        if(bidSideUserOrder.totalQty >= qty){
                            // mark this order as filled for this as well as for buyer user "FILLED", 
                            let updatedOrderTotal = bidSideUserOrder.totalQty - qty ;
                            bidSideUserOrder.totalQty = updatedOrderTotal;
                            
                            // 1st user
                            this.orders[bidSideUserOrder.userId]?.forEach((uOrder)=>{
                                // order status change
                                if(uOrder.orderId === bidSideUserOrder.orderId && uOrder.status === "PENDING"){
                                    uOrder.status = "FILLED";
                                    uOrder.qty = updatedOrderTotal;

                                    //  fills from user 
                                    let fillUser = this.fills[bidSideUserOrder.userId];
                                    if(!fillUser){
                                        fillUser = {}
                                        this.fills[bidSideUserOrder.userId] = fillUser
                                    }
                                    if(!fillUser[symbol]){
                                        fillUser[symbol] = []
                                    }
                                    
                                    const filledUserEntry = {
                                      total : qty,
                                      filled : updatedOrderTotal , 
                                      price : uOrder.price,
                                      createdAt : new Date()  
                                    }

                                    fillUser[symbol].push(filledUserEntry)
                    
                           
                                }else{
                                    // TO DO :-> return 
                                }
                            })

                            // 2nd user
                            this.orders[userId]?.forEach((uOrder)=>{
                                // order status change
                                if(uOrder.orderId === userOrderDetail.orderId && uOrder.status === "PENDING"){
                                        uOrder.status = "FILLED";
                                        uOrder.qty = 0;
                                    }
                                
                                let fillsUser =  this.fills[userId];
                                if(!fillsUser){
                                    fillsUser = {}
                                    if(!fillsUser[symbol]){
                                        fillsUser[symbol] = []
                                    }
                                }
                                const fillDetail = {
                                    total:qty, 
                                    filled:qty ,
                                    price, 
                                    createdAt : new Date()
                                }
                                fillsUser[symbol]?.push(fillDetail)
                            })
                            
                            // remove the order whose totalQty is 0
                            if(updatedOrderTotal === 0 ){
                                // TO DO remove from the bids table 
                                let tempArr:Order[] = []
                                for (let i =0 ; i < idx; i++){
                                    const popedUser = askSidePriceLevel.orders.pop();
                                    tempArr.push(popedUser!)
                                }
                                askSidePriceLevel.orders.pop();
                                for(let i =0; i<idx; i++){
                                    const tempEle = tempArr.pop();
                                    askSidePriceLevel.orders.push(tempEle!)
                                }   
                                return 
                            }

                        }else{
                            // order is partally filled move to next order object as well

                        }
                    })

                    if(askSidePriceLevel.total === 0 ){
                        assetOrderBook.BIDS.eraseElementByKey(price);
                    }
                    return {
                        totalQty: qty , 
                        filledQty:qty,
                        orderId:orderResponse.orderId,
                        averagePrice: price
                    }
                }else{
                    // partail order fill and rest are waiting 
                    let remainingQty = qty - askSidePriceLevel.total;
                    askSidePriceLevel.total = remainingQty;
                     
                    askSidePriceLevel.orders.forEach((uOrder)=>{
                        uOrder.totalQty = uOrder.totalQty - qty < 0 ? 0 : uOrder.totalQty - qty
                        // create order status change in order tabel to filled for both party 
                        this.orders[uOrder.userId]?.forEach((order)=>{
                            if(order.orderId === uOrder.orderId && order.status === "PENDING"){
                                order.status = "FILLED";
                                order.qty = order.qty - qty < 0 ? 0 : order.qty - qty
                            }
                        })

                        this.orders[userId]?.forEach((order)=>{
                            if(order.orderId === orderResponse.orderId && order.status === "PENDING"){
                                order.status = "FILLED";
                                order.qty = order.qty - qty < 0 ? 0 : order.qty - qty
                            }
                        })

                        
                        // create entry in fills order for both party 
                        let buyerFills : FillDetail= {
                            total : qty, 
                            filled : remainingQty,
                            price:price,
                            createdAt : new Date()
                        }

                        let user = this.fills[userId]
                        if(!user){
                            user = {}
                            if(!user[symbol]){
                                user[symbol] = []
                            }
                        }
                        user[symbol]?.push(buyerFills);

                        let otherUserFill = {
                          total: qty - remainingQty,
                          filled : qty - remainingQty,
                          price ,
                          createdAt: new Date()   
                        }

                        let user2 = this.fills[uOrder.userId]
                        if(!user2){
                            user2 = {};
                            if(!user2[symbol]){
                                user2[symbol] = []
                            }
                        }
                        
                        user2[symbol]?.push(otherUserFill);   
                    }) 
                    
                    // add rest of the order in ask side 
                   let  askSide = assetOrderBook["ASKS"]
                    let priceOfAsset = askSide.getElementByKey(price);
                    
                   if(!priceOfAsset){
                    priceOfAsset = {total : 0 , orders : []}
                    askSide.setElement(price , priceOfAsset)
                    }

                    priceOfAsset.total = priceOfAsset.total + remainingQty;
                    const askOrder = {
                        orderId : orderResponse.orderId, 
                        userId, 
                        totalQty : remainingQty, 
                        createdAt : new Date() 
                    }
                    priceOfAsset?.orders.push(askOrder)
                    return {
                        orderId:orderResponse.orderId, 
                        totalQty: qty , 
                        filledQty: remainingQty, 
                        averagePrice:price 
                    }
                }
            }

        }
        
        else{
            // sell 
            // TO DO create order 
            const orderResponse = this.createUserOrder("SELL" , qty , userId , price , "LIMIT")
            // TO DO match order 
            // get orderbook of ask side for the symbol  
            // get check for given price qty present 
            // if yes and qty if greater  than go to orders of that price , try to match -
            // TO DO 
            // TO DO 
        }
        
        

    }
        */


    // createOrderLimit(userId : string , symbol : MARKET_ASSETS , qty : number , price : number , side : Side ){
    //     // create order 
    //     let currentOrder = this.createUserOrder(side , qty , userId , price , "LIMIT"  , symbol);
        
    //     // match as much as we can 
    //    // get the assets 
    //     let assetMarket = this.getOrCreateMarket(currentOrder.symbol);

    //     let fillsHistory : Fills[] = [];
    //     // get opposiet side 
    //     let oppositeSide;
    //     if(currentOrder.side === "BUY") {
    //          oppositeSide = assetMarket.ASKS
    //     } else{
    //         oppositeSide = assetMarket.BIDS
    //     }

    //     // get the best price and match 
    //     let oppositeSideBestOrder = oppositeSide.front();
    //     if(oppositeSideBestOrder){
    //         // check price opposite side price can swappale , if yes than do swap , no add on opposite side
    //         let bestPrice 
    //         let bestPriceLevelDetails
    //         bestPrice =  oppositeSideBestOrder[0];
    //         bestPriceLevelDetails = oppositeSideBestOrder[1];
    //         let sameSide;
    //         let shouldMatch = currentOrder.side === "BUY" ? bestPrice <= currentOrder.price : currentOrder.price <= bestPrice
    //         if(!shouldMatch){
    //             // add this current order to cuurent.side  side
    //             if(currentOrder.side === "BUY"){
    //                 sameSide = assetMarket.BIDS
    //             }else{
    //                 sameSide = assetMarket.ASKS
    //             }

    //             let priceLevel = sameSide.getElementByKey(currentOrder.price);

    //             if(!priceLevel){
    //                 let intiallizePriceLevel = {total : 0 , orders : []};
    //                 sameSide.setElement(price , intiallizePriceLevel)
    //                 priceLevel = intiallizePriceLevel
    //             }

    //            priceLevel.total += currentOrder.qty;
              
    //            let currentOrderOrderBookDetails = {
    //                 orderId : currentOrder.orderId,
    //                 userId: currentOrder.userId,
    //                 totalQty : currentOrder.qty,
    //                 filledQty : 0 ,
    //                 createdAt: currentOrder.createdAt
    //             }
    //            priceLevel.orders.push(currentOrderOrderBookDetails) 
    //            return // as sameSide order added 
    //         }else{
    //             // do swapping now  after checking complete qty present or not on front elemenet
    //             if(bestPriceLevelDetails.total >= currentOrder.qty ){
    //                 // decrease the total 
    //                 bestPriceLevelDetails.total -= currentOrder.qty;
    //                 let currentOrderQtyLeft = currentOrder.qty;

    //                 // function to remove orders at that price level   
    //                 // eat up the orders , as you can partial eat the order on orderBook 
    //                 let frontOrder = bestPriceLevelDetails.orders[0];
    //                 if(!frontOrder){
    //                     // add to sameSide
    //                 }
    //                 let frontOrderRemainingQty = frontOrder?.totalQty! - frontOrder?.filledQty!;
                    
    //                 if(frontOrderRemainingQty < currentOrder.qty){
    //                     while(currentOrderQtyLeft!== 0){
    //                         // eat up oder one by one
    //                         let popedOrder = bestPriceLevelDetails.orders.shift()!;
    //                         let popedOrderRemainingQtyToExchange = popedOrder?.totalQty - popedOrder?.filledQty
    //                         currentOrderQtyLeft = currentOrderQtyLeft - popedOrderRemainingQtyToExchange < 0 ? 0 :  popedOrderRemainingQtyToExchange - currentOrderQtyLeft;
    //                         // add the poped order in fills array
    //                         fillsHistory.push({qty: currentOrderQtyLeft , price: bestPrice})
    //                         // update poped order  , userId status to FILLED In orders table
                            
    //                         this.orders[popedOrder.userId]?.forEach((uOrder)=>{
    //                             if(uOrder.orderId === popedOrder.orderId && uOrder.status === "PENDING"){
    //                                 uOrder.status = "FILLED";
    //                             }
    //                         })

    //                         // push orderBook user order and current user details 
    //                     }
    //                 }else{
    //                     // order stiil live on orderbook as currentOrder gets filled
    //                     if(frontOrderRemainingQty > currentOrder.qty){

    //                         frontOrder?.filledQty +=  Math.min(frontOrderRemainingQty , currentOrder.qty)
    //                     }else if(frontOrderRemainingQty === 0 ){
    //                         // remove the price from order book 
    //                     }

                        
    //                 }

                    
    //                 // if any order filledQty === totalQty than remove order complete
    //                 // if total === 0 return that price as well
    //             }

    //         }

                
    //     }else{
    //         // add the current order in currentOrder.side side
    //     }

    //     // return orderDetails
    
    // }

    
    createOderLimitV2(userId : string , symbol : MARKET_ASSETS , qty : number , price : number , side : Side ){
        let currentOrder = this.createUserOrder(side , qty , userId , price , "LIMIT" , symbol )
        

    }



    
    createUserOrder( side : Side , qty : number , userId : string , price : number , kind : Kind , symbol:MARKET_ASSETS ):createUserOrderResponse{
        
        const userOrder = this.orders[userId]
        if(!userOrder){
            this.orders[userId] = []
        }
        // use crypto.randomUUID() for id
           const orderDetails = {
            orderId: crypto.randomUUID(),
            side, 
            price, 
            kind,
            userId, 
            qty , 
            createdAt : new Date(),
            status: "PENDING" as Status,
            symbol
        }

        userOrder?.push(orderDetails)
        return orderDetails
    }

      getOrCreateMarket(symbol:MARKET_ASSETS){
        if(!this.orderBook[symbol]){
            this.orderBook[symbol] = {
                BIDS: new OrderedMap([] , (a , b)=> b - a),
                ASKS:new OrderedMap([] , (a , b)=> a-b)
            }
        }

        return this.orderBook[symbol]
    }

    // createMarketOrder(userId:string , symbol :string , qty: number , side:Side  ):createOrderResponse{}
    
    cancelOrder(userId:string , orderId:string){
        // get uder order from orders

        let userOrder = this.orders[userId]
        if(!userOrder){
            return // to do what to return 
        }
        let cancelOrderdetail:OrderDetail | undefined = undefined;

        cancelOrderdetail = userOrder.find((order)=>{
            return order.orderId === orderId
        })

        if(!cancelOrderdetail){
            return 
        }
        cancelOrderdetail.status === "CANCELLED"
        let orderForSymbol =this.orderBook[cancelOrderdetail.symbol];
        if(!orderForSymbol){
            return 
        }
        const side = cancelOrderdetail.side === "BUY" ? "BIDS" : "ASKS"
        const priceLevel =orderForSymbol[side].getElementByKey(cancelOrderdetail.price);

        if (!priceLevel) {
            return;
        }

        priceLevel.orders = priceLevel.orders.filter((order) => {
            return order.orderId !== cancelOrderdetail.orderId;
        });


    }     
  

        
    // getPriceAfterSweepSimulation(qty : number, symbol:string):number{}

    getDepth(symbol:MARKET_ASSETS ){
       
        const assetMarket = this.getOrCreateMarket(symbol);
        
        let askDepth : [number, number][] = []
        
        assetMarket.ASKS.forEach(([price , {total}])=>{
            askDepth.push([price , total])
        })

        let bidDepth : [number, number][] = []
        
        assetMarket.BIDS.forEach(([price , {total}])=>{
            askDepth.push([price , total])
        })

        return {bidDepth , askDepth}
    }
    
    
}