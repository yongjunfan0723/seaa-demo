const { program } = require("commander");
const BigNumber = require("bignumber.js");
const fs = require("fs");
const { JCCDexExplorer } = require("@jccdex/cloud");
const { JingchangWallet } = require("jcc_wallet");
const { Wallet } = require("@jccdex/jingtum-lib");
const config = require("./config");
const sleep = require("./utils/sleep");

program.option("-A, --address <path>", "钱包地址").parse(process.argv);

let { address } = program.opts();
const wallet = new Wallet('seaaps')
if (address && !wallet.isValidAddress(address)) {
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
            await getBalance(address, i === 0 ? 0 : 300);
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
  return new Promise(async (resolve, reject) => {
    const explorerHosts = config.explorerNodes
    await sleep(timeout);
    try {
      const explorerUrl = explorerHosts[Math.floor(Math.random() * explorerHosts.length)];
      const explorer = new JCCDexExplorer(explorerUrl);
      const res = await explorer.fetchBalances({ uuid: Date.now(), address });
      console.log(`${address} 资产: `, handleBalance(res.data.balances));
      resolve(res.data);
    } catch (error) {
      console.log(`${address}: `, error.message);
      resolve(null);
    }
  });
};

const handleBalance = (data) => {
  const balances = data.filter(({ value }) => !new BigNumber(value).isZero());
  return balances.map(({ value, currency, issuer, frozen }) => ({
    currency,
    frozen: new BigNumber(frozen).toString(10),
    available: new BigNumber(value).minus(frozen).toString(10)
  }));
};

getBalances()