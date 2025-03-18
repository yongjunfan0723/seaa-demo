const { program } = require("commander");
const fs = require("fs");
const readlineSync = require("readline-sync");
const { Transaction, Wallet } = require("@jccdex/jingtum-lib");
const _ = require("lodash");
const { JCCDexExplorer } = require("@jccdex/cloud");
const { JingchangWallet } = require("jcc_wallet")
const config = require("./config");
const sleep = require("./utils/sleep");

program
  .option('-A, --address <path>', "钱包地址")
  .option('-P, --password <path>', "keystore密码")
  .parse(process.argv);

const getOrders = async (address) => {
  const explorerNodes = config.explorerNodes
  const explorerUrl = explorerNodes[Math.floor(Math.random() * explorerNodes.length)];
  const explorer = new JCCDexExplorer(explorerUrl);
  let page = 0;
  let totalPage = 0;
  const size = explorer.pageSize.HUNDRED;
  let orderList = [];
  while (true) {
    try {
      const res = await explorer.fetchOffers({ uuid: Date.now(), address, page, size });
      const { offers, count } = res.data;
        if (offers.length === 0 || count === 0) {
          break;
        }
        totalPage = Math.floor(count / size);
        orderList = [...offers, ...orderList];
        page++;
        if (page > totalPage) {
          break;
        }
    } catch (err) {
      const message = err.message
      const status = _.get(err, 'status') || _.get(err, 'response.status')
      console.log("获取挂单失败:", message);
      if (message === "Network Error" || status === 404) {
        break;
      }
    }
  }
  console.log("全部挂单共有多少条:", orderList.length);
  return { list: orderList, count: orderList.length };
}

const cancelOrder = async (transaction, address, secret, seq, timeout) => {
  await sleep(timeout);
  const hash = await transaction.cancelOrder(address, secret, seq);
  return hash;
};

const cancelOrders = async () => {
  const { address } = program.opts();
  const wallet = new Wallet('seaaps')
  if (!wallet.isValidAddress(address.trim())) {
    console.log(`${address} 不合法`);
    return;
  }
  let { password } = program.opts();
  if (!password) {
    password = readlineSync.question("Please Enter Password:", { hideEchoBack: true });
  }
  try {
    const keystore = fs.readFileSync("./keystore/wallet.json", { encoding: "utf-8" });
    const instance = new JingchangWallet(JSON.parse(keystore), true, false);
    const secret = await instance.getSecretWithAddress(password, address);
    const nodes = await config.getRpcNodes();
    const transaction = new Transaction({ wallet, nodes, retry: 3 });
    const { list, count } = await getOrders(address);
    while (true) {
      try {
        if (!Array.isArray(list) || list.length === 0) {
          console.log(`${address} 无挂单`);
          break;
        }
        let hasFailed = false;
        for (const key in list) {
          const seq = list[key].seq;
          try {
            const hash = await cancelOrder(transaction, address, secret, seq, key === 0 ? 0 : 500);
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
  } catch(err) {
    console.log("撤单过程错误:", err.message);
  }
}

cancelOrders()