const parseDepth = require("./parseDepth").parseDepth;
const service = require("./service");

const bookOffers = async (options) => {
  const { url, base, counter, limit } = options;
  const takerGets = {
    currency: base.toUpperCase(),
    issuer: base.toLowerCase() === "seaa" ? "" : "dG5yrYL2z9hanawx3gF6trgNkzNtjJm3eF"
  };
  const takerPays = {
    currency: counter.toUpperCase(),
    issuer: counter.toLowerCase() === "seaa" ? "" : "dG5yrYL2z9hanawx3gF6trgNkzNtjJm3eF"
  };
  const data = {
    data: {
      method: "book_offers",
      params: [{
        taker_gets: takerGets,
        taker_pays: takerPays,
        limit: limit
      }]
    },
    method: "post",
    url
  };
  const res = await service(data);
  return res;
};

const fetchDepth = async (options) => {
  const wallet = options.wallet;
  const orders = await Promise.all([
    bookOffers({
      url: options.url,
      base: options.counter,
      counter: options.base,
      limit: options.limit
    }),
    bookOffers(options)
  ]);
  const offers = orders.map((order) => order.result.offers);
  const depth = parseDepth(offers[0], offers[1], wallet);
  return depth;
};

module.exports = { fetchDepth };