# State flow diagram of orderbook 

## V1 of state diagram
```
create order 
    |
find market 
    | -> no -> create market 
    | yes 
get opposite side to current order side 
    |
get top order - no -> than push this current order to same side 
    | yes
check price level total qty > current order qty - no -> partial filled and remain sit on same side 
    | yes
check specific order reamining qty > current order remaining qty - no -> than eat up the order until current order reamining qty = 0
    | yes
than decrease qty of that specific order 
    |
check decrease order qty = 0 - no -> than remain it in order book itself 
    | yes
than remove that order 

```

## v2 of state diagram 

```
create order 
    |
get/create market symbol
    | -> No -> create symbol market 
    | yes 
get opposite side:
(BIDS -> ASK)
(ASKS -> BIDS)
    | 
opposite side empty?
    | yes -> add order to same side 
    | no 
opposite side top value qty > current order qty ?
    | no -> partial fill current order  
    | yes 
check each order individual remaining qty > current order qty? 
    | yes -> current order filled completly 
    | no 
try to match as much order until my current remaining qty = 0
    | if 0 than remove those orders
    | if not 0 
persist them in order book decrease qty
    | 
if price level qty = 0
    | yes -> remove that from order book
    | no 
keep it in order book 
```

## v3 state flow diagram 

``
create order 
    |
get/ createmarket 
    | 
get opposite side
(BIDS -> ASKS )
(ASKS -> BIDS)
    |
opposite side empty?
    | yes -> add order in same side  , END
    |  no
while remianingQty > 0 
    |
matchable price diffrent for buy and sell 
    |yes add same side ,END 
    | no
get front elemenet 
    | 
price level order qty >= current order qty 
    | no - add current remaining order to same side 
    | yes 
check each orders qty >= current order remaining qty 
    | yes -> match order
    | no  
go to each order and fill until remainingQty != 0 
    |
pop as order qty =0 
    |
add all value in fills
    |
remove price if qty 0 

```