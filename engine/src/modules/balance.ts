import type { CURRENCY_TYPE } from "../utils/types"


export default class Balance{
    private balance : Record<string , Record<CURRENCY_TYPE ,{
            total:number 
            // locked:number bcz we are directly deducting values from total.
    }>>

    constructor(){
    this.balance = {}
    }

    getUsdBalance(userId : string,  currencyType:CURRENCY_TYPE="USD"  ):number{
        return 1
    }
    addBalance(userId : string , amount : number ,currencyType: CURRENCY_TYPE ){}
    deductBalance(userId : string , amount : number){}
    getUserAssets(userId:string){}
    getUserAssetBalance(userId : string , symbol:string):number{}
}