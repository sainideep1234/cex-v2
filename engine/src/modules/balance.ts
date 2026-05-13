import { resolve } from "bun";
import type { CURRENCY_TYPE } from "../utils/types"


export default class Balance{
    private balance : Record<string , Partial<Record<CURRENCY_TYPE ,{
            total:number 
            // locked:number bcz we are directly deducting values from total.
    }>>>

    constructor(){
    this.balance = {}
    }

    getOrCreateUserId(userId:string){
        let userPresent = this.balance[userId];
        if(!userPresent){
            userPresent = {}
            this.balance[userId] = userPresent;
        }

        return userPresent
    } 

    getOrCreateUserCurrency(userId : string , currencyType : CURRENCY_TYPE){
        const userPresent = this.getOrCreateUserId(userId);
        if(!userPresent[currencyType]){
            userPresent[currencyType] = {total : 0}
        }

        return userPresent[currencyType]
    }

    getUsdBalance(userId : string,  currencyType:CURRENCY_TYPE="USD"  ):number{
        const currencyDetails = this.getOrCreateUserCurrency(userId , currencyType);
        return currencyDetails.total
    }

    addCurrency(userId : string , amount : number ,currencyType: CURRENCY_TYPE ){
        const userPresent = this.getOrCreateUserId(userId);

        const currencyDetaild = this.getOrCreateUserCurrency(userId , currencyType);
        return currencyDetaild.total+=amount
    }

    deductBalance(userId : string , amount : number , currencyType : CURRENCY_TYPE){
        const userPresent = this.getOrCreateUserId(userId);
        const currencyDetails = this.getOrCreateUserCurrency(userId , currencyType);
        currencyDetails.total -= amount;
        if(currencyDetails.total === 0){
            delete userPresent[currencyType] 
        }
    }
    getUserAllAssets(userId:string){
        const presentUser = this.getOrCreateUserId;
        let allAssets:[CURRENCY_TYPE  , number][] = []
        
        Object.keys(presentUser).forEach((currency)=>{
            const curr = currency as CURRENCY_TYPE
            allAssets.push([curr , presentUser[curr]])
        })

        return allAssets
    }
    getUserAssetBalance(userId : string , symbol:string):number{}
}