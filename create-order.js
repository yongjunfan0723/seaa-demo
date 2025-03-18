const BigNumber = require("bignumber.js");
const { program } = require("commander");
const fs = require("fs");
const readlineSync = require("readline-sync");
const { Transaction, Wallet } = require("@jccdex/jingtum-lib");
const JingchangWallet = require("jcc_wallet").JingchangWallet;
const config = require("./config");

program
  .option('-A, --address <path>', "钱包地址")
  .option('-P, --password <path>', "keystore密码")
  .option('-a, --amount <path>', "数量")
  .option('-b, --base <path>', "token名称")
  .option('-c, --counter <path>', "token名称")
  .option('-p, --price <path>', "价格")
  .option('-t, --type <path>', "买或卖")
  .parse(process.argv);

const deal = async () => {
  const { counter, base, price, amount, type, address } = program.opts();
  let { password } = program.opts();
  try {
    if (!password) {
      password = readlineSync.question("Please Enter Password:", { hideEchoBack: true });
    }
    const wallet = new Wallet("seaaps");
    const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
    const instance = new JingchangWallet(JSON.parse(keystore), true, false);
    const secret = await instance.getSecretWithAddress(password, address);
    const sum = new BigNumber(price).multipliedBy(amount).toString(10);
    const nodes = await config.getRpcNodes();
    const transaction = new Transaction({ wallet, nodes, retry: 3 });
    const hash = await transaction.createOrder(address, secret, amount, base, counter, sum, type, address);
    console.log("挂单成功:", hash);
  } catch (error) {
    console.log("挂单失败:", error.message);
  }
}

deal();