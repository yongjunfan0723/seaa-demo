const program = require('commander');
const fs = require("fs");
const readlineSync = require("readline-sync");
const { ExplorerFactory } = require("jcc_rpc");
const JCCExchange = require("jcc_exchange").JCCExchange;
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const config = require("./config");
JCCExchange.setDefaultChain("seaaps");

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>', "钱包地址")
  .option('-P, --password <path>', "keystore密码")
  .parse(process.argv);

const getOrders = async (address) => {
  const explorerInst = ExplorerFactory.init(config.explorerNodes);
  const page = 0;
  const size = 100;
  const res = await explorerInst.getOrders(Date.now(), address, page, size);
  if (res.result) {
    return res.data;
  } else {
    throw new Error(res.msg);
  }
}

const cancelOrder = (address, secret, seq, timeout) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const hash = await JCCExchange.cancelOrder(address, secret, seq);
        resolve(hash);
      } catch (error) {
        reject(error);
      }
    }, timeout)
  })
}

const cancelOrders = async () => {
  const { address } = program;
  let password = program.password;
  if (!password) {
    password = readlineSync.question("Please Enter Password:", { hideEchoBack: true });
  }
  const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
  const instance = new JingchangWallet(JSON.parse(keystore), true, false);
  const secret = await instance.getSecretWithAddress(password, address);
  const nodes = config.rpcNodes;
  JCCExchange.init(nodes);

  while (true) {
    try {
      const { list, count } = await getOrders(address);
      if (!Array.isArray(list) || list.length === 0) {
        console.log(`${address} 无挂单`);
        break;
      }
      let hasFailed = false;
      for (const key in list) {
        const seq = list[key].seq;
        try {
          const hash = await cancelOrder(address, secret, seq, key === 0 ? 0 : 500);
          console.log("撤销成功: ", hash);
        } catch (error) {
          console.log("撤销失败: ", error);
          hasFailed = true;
        }
      }
      if (!hasFailed && list.length === count) {
        console.log("撤销完成");
        break;
      }
    } catch (error) {
      console.log(error);
    }
  }
}

cancelOrders()