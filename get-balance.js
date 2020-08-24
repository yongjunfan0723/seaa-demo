const program = require('commander');
const BigNumber = require("bignumber.js");
const fs = require("fs");
const { ExplorerFactory } = require("jcc_rpc");
const { JingchangWallet, jtWallet } = require("jcc_wallet");
const config = require("./config");

program
  .usage('[options] <file ...>')
  .option('-A, --address <path>', "钱包地址")
  .parse(process.argv);

let address = program.address;
if (address && !jtWallet.isValidAddress(address, "seaa")) {
  console.log("钱包地址不合法")
  process.exit(0);
}
const getBalances = async () => {
  try {
    if (!address) {
      const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
      if (JingchangWallet.isValid(keystore)) {
        const wallets = JingchangWallet.getWallets(JSON.parse(keystore));
        if (Array.isArray(wallets) && wallets.length > 0) {
          for (let i = 0; i < wallets.length; i++) {
            address = wallets[i].address;
            await getBalance(address, i === 0 ? 0 : 500);
          }
        } else {
          console.log("keystore文件里无钱包");
          process.exit(0);
        }
      } else {
        console.log("keystore文件不合法");
        process.exit(0);
      }
    } else {
      await getBalance(address);
    }
  } catch (error) {
    console.log(error)
  }
}

const getBalance = (address, timeout = 0) => {
  return new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        const inst = ExplorerFactory.init(config.explorerNodes);
        const res = await inst.getBalances(Date.now(), address);
        if (res.result) {
          console.log(`${address} 资产: `, handleBalance(res.data));
          resolve(res.data);
        } else {
          reject(res.msg);
        }
      } catch (error) {
        reject(error);
      }
    }, timeout)
  })
}

const handleBalance = (data) => {
  let arr = [];
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
    if (currency.toUpperCase() === "CNY") {
      currency = "CNT";
    }
    const balanceObj = {
      currency: currency,
      // total: obj.value,
      frozen: obj.frozen,
      available: new BigNumber(obj.value).minus(obj.frozen).toString(10)
    }
    arr.push(balanceObj)
  }
  return arr;
}

getBalances()