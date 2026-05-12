import {OrderedMap, TreeContainer}  from "js-sdsl"
import type { Kind, MARKET_ASSETS, Side, Status } from "../utils/types"
import { FileSystemRouter } from "bun"
import { createDocumentRegistry, isPlusToken } from "typescript"

type Fills = {
    qty:number,
    price:number
}

interface createOrderResponse{
    orderId: number , 
    filledQty :number , 
    totalQty:number, 
    averagePrice : number,
    fills?: Fills[]
}

interface Order{
    orderId:number,
    userId:string, 
    totalQty:number
    createdAt: Date
    }

interface Bids {
    total:number,
    orders:Order[]
}

interface Ask{
    total:number ,
    orders:Order[]
}

interface OrderDetail { orderId : number , qty : number , price :number , side : Side , kind : Kind , status: Status , createdAt : Date }

interface  FillDetail  {total:number , filled:number , price:number ,  createdAt:Date}

interface createUserOrderResponse {
    orderId : number , 
    qty : number , 
    side : Side , 
    kind : Kind , 
    status : Status, 
    createdAt : Date , 
    userId: string
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

   public orderCounter = 1;

    private orderBook : Partial<Record< MARKET_ASSETS , {BIDS : OrderedMap<number , Bids> , ASKS: OrderedMap<number , Ask>}>>
    
    private fills: Record<string , Partial<Record< MARKET_ASSETS , FillDetail[]> >>
    
    private orders : Record< string , OrderDetail[]>
    
    constructor(){
        this.orderBook = {}
        this.fills = {}
        this.orders = {}
    }

    
    createLimitOrder(userId:string , symbol :MARKET_ASSETS , qty: number , price: number, side:Side ):createOrderResponse {
        // create order 
        const orderResponse = this.createUserOrder(side,qty,userId, price,"LIMIT")

        // match order swap assets 
        const assetOrderBook =  this.getOrCreateMarket(symbol);
        
        if(side === "BUY"){
            
            let  bidSidePrice = assetOrderBook["BIDS"].getElementByKey(price);

            if(!bidSidePrice || Object.keys(bidSidePrice).length === 0 ) {
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
                if(bidSidePrice.total >= qty){
                    // execute order 
                    bidSidePrice.total = bidSidePrice.total - qty;
                    
                    // add value in order and fills 
                    bidSidePrice.orders.forEach((bidSideUserOrder , idx)=>{

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
                                    const popedUser = bidSidePrice.orders.pop();
                                    tempArr.push(popedUser!)
                                }
                                bidSidePrice.orders.pop();
                                for(let i =0; i<idx; i++){
                                    const tempEle = tempArr.pop();
                                    bidSidePrice.orders.push(tempEle!)
                                }   
                                return 
                            }

                        }else{
                            // order is partally filled move to next order object as well

                        }
                    })

                    if(bidSidePrice.total === 0 ){
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
                    let remainingQty = qty - bidSidePrice.total;
                    bidSidePrice.total = remainingQty;
                     
                    bidSidePrice.orders.forEach((uOrder)=>{
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
            // if yes and qty if greater  than go to orders of that price , try to match 
            // TO DO 
            // TO DO 
        }
        
        

    }
    
    createUserOrder( side : Side , qty : number , userId : string , price : number , kind : Kind ):createUserOrderResponse{
        
        const userOrder = this.orders[userId]
        if(!userOrder){
            this.orders[userId] = []
        }

        const orderDetails = {
            orderId: this.orderCounter,
            side, 
            price, 
            kind,
            userId, 
            qty , 
            createdAt : new Date(),
            status: "PENDING" as Status
        }

        userOrder?.push(orderDetails)
        this.orderCounter++;
        return orderDetails
    }

    createMarketOrder(userId:string , symbol :string , qty: number , side:Side  ):createOrderResponse{}
    
    cancelOrder(userId:string , orderId:string){}
    
    getPriceAfterSweepSimulation(qty : number, symbol:string):number{}

    getDepth(symbol:string ){}

        
    getOrCreateMarket(symbol:MARKET_ASSETS){
        if(!this.orderBook[symbol]){
            this.orderBook[symbol] = {
                BIDS: new OrderedMap([] , (a , b)=> b - a),
                ASKS:new OrderedMap([] , (a , b)=> a-b)
            }
        }

        return this.orderBook[symbol]
    }
    
    
}