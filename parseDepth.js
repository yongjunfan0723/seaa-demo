const { Factory } = require("@swtc/utils");
const WalletFactory = require("@swtc/wallet").Factory;

const BigNumber = require("bignumber.js");

const utils = Factory(WalletFactory("seaaps"));

const parseAmount = utils.parseAmount;

const sortAsks = (a, b) => new BigNumber(a.price).minus(b.price).toNumber(); // 按价格从小到大排序

const sortBids = (a, b) => new BigNumber(b.price).minus(a.price).toNumber(); // 按价格从大到小排序

const parseOrderBook = (offers, isAsk = false) => {
  const orderbook = [];
  const len = offers.length;
  for (let i = 0; i < len; i++) {
    const { Account, TakerGets, taker_gets_funded, TakerPays, taker_pays_funded, Platform } = offers[i];
    const takerGetsTotal = parseAmount(TakerGets);
    const takerGetsFunded = taker_gets_funded ? parseAmount(taker_gets_funded) : takerGetsTotal;
    const takerPaysTotal = parseAmount(TakerPays);
    const takerPaysFunded = taker_pays_funded ? parseAmount(taker_pays_funded) : takerPaysTotal;
    let price;
    let amount;
    let total;
    let type;
    if (isAsk) {
      price = new BigNumber(takerPaysTotal.value).div(takerGetsTotal.value).toString();
      amount = new BigNumber(takerGetsFunded.value).toString();
      total = new BigNumber(takerGetsTotal.value).toString();
      type = "sell";
    } else {
      price = new BigNumber(takerGetsTotal.value).div(takerPaysTotal.value).toString();
      amount = new BigNumber(takerPaysFunded.value).toString();
      total = new BigNumber(takerPaysTotal.value).toString();
      type = "buy";
    }
    orderbook.push({ account: Account, price, amount, total, type, platform: Platform });
  }
  return orderbook;
};

const mergePrice = (offers) => {
  const res = {};
  const result = [];
  let totalValue = new BigNumber(0);
  const len = offers.length;
  for (let i = 0; i < len; ++i) {
    const offer = offers[i];
    const key = offer.price;
    if (res[key]) {
      res[key].amount = new BigNumber(res[key].amount).plus(offer.amount).toString();
    } else {
      res[key] = offer;
      result.push(res[key]);
    }
    totalValue = totalValue.plus(offer.amount);
    res[key].total = totalValue.toString();
    delete res[key].account;
    delete res[key].platform;
  }
  return result;
};

const parseDepth = (bids, asks, address) => {
  let parsedBids = parseOrderBook(bids);
  let parsedAsks = parseOrderBook(asks, true);
  parsedAsks.sort(sortAsks);
  parsedBids.sort(sortBids);
  if (address) {
    parsedAsks = parsedAsks.filter(ask => ask.account === address);
    parsedBids = parsedBids.filter(bid => bid.account === address);
  }
  console.log("没根据价格合并前的卖单:", parsedAsks);
  console.log("没根据价格合并前的买单:", parsedBids);
  // console.log("没根据价格合并前的卖单:", JSON.stringify(parsedAsks, null, 2));
  // console.log("没根据价格合并前的买单:", JSON.stringify(parsedBids, null, 2));
  return {
    asks: mergePrice(parsedAsks),
    bids: mergePrice(parsedBids)
  };
};

module.exports = { parseDepth };