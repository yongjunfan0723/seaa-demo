const BigNumber = require("bignumber.js");
const program = require('commander');
const fs = require("fs");
const { ExplorerFactory } = require("jcc_rpc");
const readlineSync = require("readline-sync");
const { JCCExchange, sign } = require("jcc_exchange");
const { serializeCreateOrder } = require("jcc_exchange/lib/tx");
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const config = require("./config");
JCCExchange.setDefaultChain("seaaps");

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>', "钱包地址")
  .option('-P, --password <path>', "keystore密码")
  .option('-b, --base <path>', "token名称")
  .option('-c, --counter <path>', "token名称")
  .option('-p, --price <path>', "价格")
  .option('-t, --type <path>', "买或卖")
  .parse(process.argv);


const getBalance = (address, baseOrcounter) => {
  return new Promise(async (resolve, reject) => {
    try {
      const inst = ExplorerFactory.init(config.explorerNodes);
      const res = await inst.getBalances(Date.now(), address);
      if (res.result) {
        resolve(handleBalance(res.data, baseOrcounter));
      } else {
        reject(res.msg);
      }
    } catch (error) {
      reject(error);
    }
  })
}

const handleBalance = (data, baseOrcounter) => {
  let balanceObj = {};
  for (const key in data) {
    const obj = data[key];
    if (key === "_id" || key === "feeflag") {
      continue;
    }
    const isZero = new BigNumber(obj.value).isZero();
    if (isZero) {
      continue;
    }
    let [currency] = key.split("_");
    if (currency !== baseOrcounter.toUpperCase()) {
      continue;
    }
    balanceObj = {
      available: new BigNumber(obj.value).minus(obj.frozen).toString(10)
    }
  }
  return balanceObj;
}

const deal = async () => {
  const { counter, base, price, type, address } = program;
  let password = program.password;
  let sum = "";
  let amount = "";
  try {
    if (!password) {
      password = readlineSync.question("Please Enter Password:", { hideEchoBack: true });
    }
    if (String(type) === "buy") { // 买单
      try {
        const counterBalance = await getBalance(address, counter);
        sum = counterBalance.available;
        amount = new BigNumber(sum).div(price).precision(16, 1).toString(10);
      } catch (error) {
        console.log(`挂${type}单获取${counter}资产错误: `, error.message);
      }
    } else { // 卖单
      try {
        const baseBalance = await getBalance(address, base);
        amount = baseBalance.available;
        sum = new BigNumber(amount).multipliedBy(price).precision(16, 1).toString(10);
      } catch (error) {
        console.log(`挂${type}单获取${base}资产错误: `, error.message);
      }
    }
    const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
    const instance = new JingchangWallet(JSON.parse(keystore), true, false);
    const secret = await instance.getSecretWithAddress(password, address);
    const nodes = config.rpcNodes;
    JCCExchange.init(nodes);
    const tx = serializeCreateOrder(address, amount, base, counter, sum, type, "", issuer = "dG5yrYL2z9hanawx3gF6trgNkzNtjJm3eF");
    tx.Sequence = await JCCExchange.getSequence(tx.Account);
    delete tx.Platform;
    const signedData = sign(tx, secret, "seaaps", true);
    const blob = signedData.blob;
    const hash = await JCCExchange.sendRawTransaction(blob);
    // const hash = await JCCExchange.createOrder(address, secret, amount, base, counter, sum, type, address, issuer = "dG5yrYL2z9hanawx3gF6trgNkzNtjJm3eF");
    console.log("挂单成功:", hash);
  } catch (error) {
    console.log("挂单失败:", error.message);
  }
}

deal()