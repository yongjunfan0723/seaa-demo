const { program } = require("commander");
const BigNumber = require("bignumber.js");
const { Wallet } = require("@jccdex/jingtum-lib");
const config = require("./config");
const fetchDepth = require("./fetchDepth").fetchDepth;

program
  .option('-A, --address <path>', "seaa钱包地址")
  .option('-b, --base <path>', "token名称")
  .option('-c, --counter <path>', "token名称")
  .option('-l, --limit <path>', "查询最大限制条数")
  .option("-s, --show <path>", "显示买单、卖单或所有")
  .parse(process.argv);

const getDepth = async () => {
  const { address, base, counter, limit, show } = program.opts();
  let options = {};
  try {
    const nodes = await config.getRpcNodes();
    const rpcNode = nodes[Math.floor(Math.random() * nodes.length)];
    console.log("current rpcNode:", rpcNode);
    const wallet = new Wallet('seaaps')
    if (address) {
      if (wallet.isValidAddress(address.trim())) {
        options = {
          url: rpcNode,
          base: base,
          counter: counter,
          limit: new BigNumber(limit).toNumber() || 20,
          wallet: address
        }
      } else {
        console.log("钱包地址不合法");
        process.exit();
      }
    } else {
      options = {
        url: rpcNode,
        base: base,
        counter: counter,
        limit: new BigNumber(limit).toNumber() || 20
      };
    }
    const res = await fetchDepth(options);
    if (show === "bid") {
      console.log(`${base.toUpperCase()}-${counter.toUpperCase()} 买单深度: `, res.bids);
      // console.log(`${base.toUpperCase()}-${counter.toUpperCase()} 买单深度: `, JSON.stringify(res.bids, null, 2));
    } else if (show === "ask") {
      console.log(`${base.toUpperCase()}-${counter.toUpperCase()} 卖单深度: `, res.asks);
      // console.log(`${base.toUpperCase()}-${counter.toUpperCase()} 卖单深度: `, JSON.stringify(res.asks, null, 2));
    } else {
      console.log(`${base.toUpperCase()}-${counter.toUpperCase()} 深度: `, res);
      // console.log(`${base.toUpperCase()}-${counter.toUpperCase()} 深度: `, JSON.stringify(res, '', 2));
    }
  } catch (error) {
    console.log("通过节点获取深度失败:", error.message);
  }
}

getDepth();