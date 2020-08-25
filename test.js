const service = require("./service");

const getConfig = async (options) => {
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
}
exports.getConfig = getConfig;
// module.exports = { getConfig };