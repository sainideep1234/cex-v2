
import { OrderedMap } from "js-sdsl"
import type { Kind, MARKET_ASSETS, Side, Status } from "../utils/types"
import { FILLS } from "../store/exchange-store"
import { resolveModuleName } from "typescript"


type Fills = {
    qty: number,
    price: number
}

interface CreateOrderResponse {
    orderId: string,
    filledQty: number,
    totalQty: number,
    averagePrice: number,
    status: Status,
    fills?: Fills[]
}

interface OrderBookOrders {
    orderId: string,
    userId: string,
    totalQty: number,
    filledQty: number,
    createdAt: Date
}

interface PriceLevel {
    total: number,
    orders: OrderBookOrders[]
}


interface OrderDetail {
    orderId: string,
    symbol: MARKET_ASSETS,
    qty?: number,
    price: number | undefined,
    side: Side,
    kind: Kind,
    status: Status,
    oppsoiteId: string,
    createdAt: Date,
    balance?: number
}

interface FillDetail {
    orderId: string,
    buyerId: string,
    sellerId: string,
    filledQty: number,
    totalQty: number,
    price: number,
    createdAt: Date
}

interface ReturnCreateUserOrder {
    orderId: string,
    userId: string
    qty: number,
    side: Side,
    kind: Kind,
    status: Status,
    createdAt: Date,
    price: number,
    symbol: MARKET_ASSETS
}

export default class OrderBook {

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

    private orderBook: Partial<Record<MARKET_ASSETS, { BIDS: OrderedMap<number, PriceLevel>, ASKS: OrderedMap<number, PriceLevel> }>>

    private fills: FillDetail[];

    private orders: Record<string, OrderDetail[]>

    constructor() {
        this.orderBook = {}
        this.fills = []
        this.orders = {}
    }

    // name CreateOrderResponse (NOOOO ), Order (YESSS)

    /*
    createLimitOrder(userId:string , symbol :MARKET_ASSETS , qty: number , price: number, side:Side ):CreateOrderResponse {
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


    createLimitOrder(userId: string, symbol: MARKET_ASSETS, qty: number, price: number, side: Side) {
        let currentOrder = this.createUserOrder(side, qty, userId, "LIMIT", symbol, price);

        const assetMarket = this.getOrCreateMarket(symbol);

        const oppositeOfCurrentSide = side === "BUY" ? "ASKS" : "BIDS";
        const oppositeSide = assetMarket[oppositeOfCurrentSide];

        let pendingQty = qty
        while (pendingQty > 0 && !oppositeSide.empty()) {
            // keep best prive level
            const topEle = oppositeSide.front()

            // if bestprice is less than what we want, we leave
            if (oppositeOfCurrentSide == 'ASKS') {
                if (topEle![0] > currentOrder.price) {
                    break
                }
            } else {
                if (topEle![0] < currentOrder.price) break
            }

            // otherwise match with this level as much as u can


            const orders = topEle![1].orders

            while (orders.length !== 0) {

                let currentOppositeOrder = orders[0];

                const availableQty = currentOppositeOrder?.totalQty! - currentOppositeOrder?.filledQty!;

                if (availableQty >= pendingQty) {
                    // increase filled qty 
                    currentOppositeOrder!.filledQty! += pendingQty
                    // decrease pendingqty 
                    pendingQty = 0
                    break;

                } else {
                    pendingQty -= availableQty;
                    currentOppositeOrder!.filledQty! += availableQty;
                    orders.shift();
                }

            }
            if (orders.length === 0) {
                oppositeSide.eraseElementByKey(topEle![0]);
            }


        }
        const currentSide = side === "BUY" ? "BIDS" : "ASKS"
        const sameSide = assetMarket[currentSide];
        let priceLevel = sameSide.getElementByKey(currentOrder.price);
        if (!priceLevel) {
            priceLevel = { orders: [], total: 0 }
        }
        // to do handle this error
        priceLevel.orders.push({ ...currentOrder, filledQty: 0, totalQty: 1 });

        sameSide.setElement(currentOrder.price, priceLevel);


    }

    createUserOrder(side: Side, qty: number, userId: string, kind: Kind, symbol: MARKET_ASSETS, price?: number, balance?: number): ReturnCreateUserOrder {

        const userOrder = this.orders[userId]
        if (!userOrder) {
            this.orders[userId] = []
        }
        // use crypto.randomUUID() for id
        const orderDetails = {
            orderId: crypto.randomUUID(),
            side,
            price,
            kind,
            userId,
            qty,
            createdAt: new Date(),
            status: "PENDING" as Status,
            symbol
        }

        userOrder?.push(orderDetails)
        return orderDetails
    }

    getOrCreateMarket(symbol: MARKET_ASSETS) {
        if (!this.orderBook[symbol]) {
            this.orderBook[symbol] = {
                BIDS: new OrderedMap([], (a, b) => b - a),
                ASKS: new OrderedMap([], (a, b) => a - b)
            }
        }

        return this.orderBook[symbol]
    }

    createMarketOrder(userId: string, symbol: MARKET_ASSETS, qty: number, side: Side, balance: number): CreateOrderResponse {
        const assetMarket = this.getOrCreateMarket(symbol);
        const currentOrder = this.createUserOrder(side, qty, userId, "MARKET", symbol, undefined, balance);

        const oppositeSide = side === "BUY" ? "ASKS" : "BIDS"
        const sameSide = side === "BUY" ? "BIDS" : "ASKS";

        if (side === "BUY") {

            let remainingQty = currentOrder.qty;
            let remainingBalance = balance;


            while (remainingQty > 0 && !assetMarket[oppositeSide].empty()) {
                const topEle = assetMarket[oppositeSide].front();

                if (!topEle) {
                    currentOrder.status = "FILLED";
                    return {
                        averagePrice: 0,
                        filledQty: 0,
                        totalQty: currentOrder.qty,
                        orderId: currentOrder.orderId,
                        status: currentOrder.status
                    }
                }
                const [bestPrice, priceLevelOrders] = topEle;

                if (bestPrice * remainingQty > balance) {
                    //  
                    currentOrder.status = "CANCELLED";
                    return {
                        averagePrice: 0,
                        filledQty: 0,
                        totalQty: currentOrder.qty,
                        orderId: currentOrder.orderId,
                        status: currentOrder.status
                    }
                }

                if (priceLevelOrders.total > currentOrder.qty) {
                    // excute compelet order here
                    while (remainingQty > 0 && priceLevelOrders.orders.length !== 0 && remainingBalance !== 0) {
                        const firstPriceLevelOrder = priceLevelOrders.orders[0];
                        const availabelQty = firstPriceLevelOrder!.totalQty - firstPriceLevelOrder!.filledQty;
                        remainingBalance -= remainingQty * bestPrice;

                        if (availabelQty >= remainingQty) {
                            // execute complete Order
                            firstPriceLevelOrder!.filledQty += remainingQty;
                            remainingQty = 0;
                            // add buyer entry in fills table 
                            this.fills.push({
                                orderId: currentOrder.orderId,
                                buyerId: userId,
                                sellerId: firstPriceLevelOrder!.userId,
                                filledQty: remainingQty,
                                price: bestPrice,
                                totalQty: currentOrder.qty,
                                createdAt: new Date()
                            })
                            // added sellers entry in fills table
                            this.fills.push({
                                orderId: firstPriceLevelOrder!.orderId,
                                buyerId: userId,
                                sellerId: firstPriceLevelOrder!.userId,
                                filledQty: remainingQty,
                                price: bestPrice,
                                totalQty: currentOrder.qty,
                                createdAt: new Date()
                            })
                            // update order satus of buyer 
                            let currentUserOrderStatuschange = this.orders[currentOrder.userId]?.find((order) => {
                                return order.orderId === currentOrder.orderId
                            })
                            // update seller user orderId close
                            let oppositeUserOrderStatuschange = this.orders[currentOrder.userId]?.find((order) => {
                                return order.orderId === firstPriceLevelOrder!.orderId
                            })
                            currentUserOrderStatuschange!.status = "FILLED";
                            oppositeUserOrderStatuschange!.status = "FILLED";

                            return {
                                averagePrice: bestPrice,
                                filledQty: remainingQty,
                                totalQty: currentOrder.price,
                                orderId: currentOrder.orderId,
                                status: "FILLED",

                            }
                        }

                        // fill order as much as you can and pop first elememnt 
                        firstPriceLevelOrder!.filledQty += availabelQty;
                        remainingQty -= availabelQty;
                        // add buyer entry in fills table 
                        this.fills.push({
                            buyerId: currentOrder.userId,
                            sellerId: firstPriceLevelOrder!.userId,
                            createdAt: new Date(),
                            filledQty: availabelQty,
                            totalQty: currentOrder.qty,
                            orderId: currentOrder.orderId,
                            price: bestPrice
                        })
                        // added sellers entry in fills table
                        this.fills.push({
                            orderId: firstPriceLevelOrder!.orderId,
                            buyerId: userId,
                            sellerId: firstPriceLevelOrder!.userId,
                            filledQty: remainingQty,
                            price: bestPrice,
                            totalQty: currentOrder.qty,
                            createdAt: new Date()
                        })
                        // update order satus of buyer 
                        let currentUserOrderStatuschange = this.orders[currentOrder.userId]?.find((order) => {
                            return order.orderId === currentOrder.orderId
                        })
                        // update seller user orderId close
                        let oppositeUserOrderStatuschange = this.orders[currentOrder.userId]?.find((order) => {
                            return order.orderId === firstPriceLevelOrder!.orderId
                        })
                        currentUserOrderStatuschange!.status = "FILLED";
                        oppositeUserOrderStatuschange!.status = "FILLED";
                        priceLevelOrders.orders.shift();

                        if (priceLevelOrders.total === 0) {
                            assetMarket[oppositeSide].eraseElementByKey(topEle[0]);
                        }
                    }

                }

                // eat all the price until balance gets zero
                assetMarket![oppositeSide].eraseElementByKey(topEle[0]);

            }
        }

        let remainingQty = currentOrder.qty;
        while (remainingQty > 0 && assetMarket[oppositeSide].length !== 0) {
            // else sell
            if (!assetMarket[oppositeSide].front()) {
                // TODO: change the order , status to cancelled 
                const cancelOrder = this.orders[currentOrder.userId]?.find((order)=>{
                    return order.orderId === currentOrder.orderId
                })
                cancelOrder!.status = "FILLED"
                // TODO: return reponse 
                return {
                    averagePrice:0,
                    filledQty:0,
                     totalQty:currentOrder.qty,
                     orderId:currentOrder.orderId,
                     status:cancelOrder!.status,
                }
                
            }

            const [bestPrice, priceDetails] = assetMarket[oppositeSide].front()!;

            // sell as much as i can

            // eat limited order
            if (priceDetails.total >= remainingQty) {
                let maxQtyeBuyAtPriceLevel = priceDetails.total;
                let maxQtySellAtPriceLevel = remainingQty - maxQtyeBuyAtPriceLevel;
                remainingQty -= maxQtySellAtPriceLevel;

                while (maxQtySellAtPriceLevel > 0 && priceDetails.orders.length !== 0) {

                    let firstPriceLevelOrder = priceDetails.orders[0]!;
                    let maxQtySellAtPriceLevelOrder = firstPriceLevelOrder.totalQty - firstPriceLevelOrder.filledQty;
                    firstPriceLevelOrder.filledQty += maxQtySellAtPriceLevelOrder;

                    maxQtySellAtPriceLevel -= maxQtySellAtPriceLevelOrder;

                    const orderToChangeStatus = this.orders![firstPriceLevelOrder.userId]?.find((order) => {
                        return firstPriceLevelOrder.orderId === currentOrder.orderId
                    })
                    orderToChangeStatus?.status === "FILLED";
                    // add buyer entry in fills table 
                    this.fills.push({
                        orderId: currentOrder.orderId,
                        buyerId: firstPriceLevelOrder.userId,
                        sellerId: userId,
                        filledQty: remainingQty,
                        price: bestPrice,
                        totalQty: currentOrder.qty,
                        createdAt: new Date()
                    })
                    // added sellers entry in fills table
                    this.fills.push({
                        orderId: firstPriceLevelOrder!.orderId,
                        buyerId: firstPriceLevelOrder.userId,
                        sellerId: userId,
                        filledQty: remainingQty,
                        price: bestPrice,
                        totalQty: currentOrder.qty,
                        createdAt: new Date()
                    })

                    if (firstPriceLevelOrder.filledQty === firstPriceLevelOrder.totalQty) {
                        priceDetails.orders.shift();
                    }


                }
            }
            // move to next price
            assetMarket[oppositeSide].eraseElementByKey(bestPrice);
        }
    }


    getPriceAfterSweepSimulation(qty: number, symbol: MARKET_ASSETS, side: Side): number {
        const asserMarket = this.getOrCreateMarket(symbol);
        let oppositeSide: "ASKS" | "BIDS" = (side === "BUY") ? "ASKS" : "BIDS";
        let remainingQty = qty;
        let sweepPrice = 0;

        asserMarket[oppositeSide].forEach((priceLevel) => {
            if (!priceLevel) {
                return // to do no order to match
            }
            let bestOrderSidePrice = priceLevel[0];
            let bestOrderSidePriceDetails = priceLevel[1];
            if (remainingQty > 0) {
                remainingQty -= bestOrderSidePriceDetails.total;
                sweepPrice += bestOrderSidePrice
            }
        });

        return sweepPrice;
    }

    cancelOrder(userId: string, orderId: string) {
        // get uder order from orders

        let userOrder = this.orders[userId]
        if (!userOrder) {
            return { status: "CANCELLED", }
        }
        let cancelOrderdetail: OrderDetail | undefined = undefined;

        cancelOrderdetail = userOrder.find((order) => {
            return order.orderId === orderId
        })

        if (!cancelOrderdetail) {
            return { status: "CANCELLED" }
        }

        cancelOrderdetail.status === "CANCELLED";

        let orderForSymbol = this.orderBook[cancelOrderdetail.symbol];

        const side = cancelOrderdetail.side === "BUY" ? "BIDS" : "ASKS"
        const priceLevel = orderForSymbol![side].getElementByKey(cancelOrderdetail.price);

        if (!priceLevel) {
            return { status: "CANCELLED" }
        }

        priceLevel.orders = priceLevel.orders.filter((order) => {
            return order.orderId !== cancelOrderdetail.orderId;
        });
        return { status: "CANCELLED" }

    }

    getDepth(symbol: MARKET_ASSETS) {

        const assetMarket = this.getOrCreateMarket(symbol);

        let askDepth: [number, number][] = []

        assetMarket.ASKS.forEach(([price, { total }]) => {
            askDepth.push([price, total])
        })

        let bidDepth: [number, number][] = []

        assetMarket.BIDS.forEach(([price, { total }]) => {
            askDepth.push([price, total])
        })

        return { bidDepth, askDepth }
    }

    getOrdersOfUser(userId: string) {
        const userOrders = this.orders[userId]
        if (userOrders) {
            return userOrders
        }

        return []
    }

    getFillsOfUser(userId: string) {
        const userAsSellerFillsDetail = this.fills.filter((fill) => {
            return fill.sellerId === userId
        })

        const userAsBuyerFillsDetails = this.fills.filter((fill) => {
            return fill.buyerId === userId;
        })

        return [...userAsBuyerFillsDetails, ...userAsBuyerFillsDetails]
    }
}