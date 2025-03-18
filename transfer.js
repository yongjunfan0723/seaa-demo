const BigNumber = require("bignumber.js");
const { program } = require("commander");
const fs = require("fs");
const _ = require("lodash");
const readlineSync = require("readline-sync");
const { Transaction, Wallet } = require("@jccdex/jingtum-lib");
const { JCCDexExplorer } = require("@jccdex/cloud");
const { serializePayment } = require("@jccdex/jingtum-lib/lib/tx");
const { JingchangWallet } = require("jcc_wallet");
const config = require("./config");
const sleep = require("./utils/sleep");
const zero = new BigNumber(0);

program
  .option("-A, --address <path>", "钱包地址")
  .option("-P, --password <path>", "keystore密码")
  .option("-s, --secret <path>", "密钥")
  .option("-c, --currency <path>", "token名称")
  .option("-a, --amount <path>", "数量")
  .option("-t, --to <path>", "转入钱包地址")
  .option("-m, --memo <path>", "备注")
  .parse(process.argv);

const isObject = (obj) => {
  return Object.prototype.toString.call(obj) === "[object Object]";
};

const sendRawTransaction = async (transaction, blob) => {
  const res = await transaction.submitTransaction(blob);
  if (!Transaction.isSuccess(res)) {
    throw new Error(JSON.stringify(res));
  }
  return res.result.tx_json.hash;
};

const getBalance = async (address, explorer) => {
  try {
    const res = await explorer.fetchBalances({ address, uuid: Date.now() });
    const { balances } = res.data;
    const filteredBalances = balances.filter(({ value }) => !new BigNumber(value).isZero());
    return filteredBalances.map((item) =>({ ...item, available: new BigNumber(item.value).minus(item.frozen)} ));
  } catch(err) {
       const code = _.get(err, "code", null)
       const message = _.get(err, "message", null)
      if (code === "2004") {
        console.log("获取资产失败:", `${address} ${message}`);
        throw new Error('未激活');
      } else {
        throw new Error(JSON.stringify({ code, message }));
     }
   }
};

const transfer = async () => {
  const { amount, memo, to } = program.opts();
  let { address, secret, password, currency } = program.opts();
  try {
    const wallet = new Wallet("seaaps");
    if (!address && !secret) {
      secret = readlineSync.question("Please Enter Secret:", {
        hideEchoBack: true
      });
    }
    if (wallet.isValidSecret(secret)) {
      address = wallet.getAddress(secret);
    }
    if (!address || (secret && !wallet.isValidSecret(secret))) {
      console.log("输入的密钥不合法");
      return;
    }
    let trimmedAddress = _.trim(address);
    let trimmedTo = _.trim(to);
    if (_.isEqual(trimmedAddress, trimmedTo)) {
      console.log(`转出地址 ${trimmedAddress} 和转入地址 ${trimmedTo} 不能是同一个`);
      return;
    }
    if (!secret && !wallet.isValidAddress(trimmedAddress)) {
      console.log(`转出地址 ${trimmedAddress} 不合法`);
      return;
    }
    if (!wallet.isValidAddress(trimmedTo)) {
      console.log(`转入地址 ${trimmedTo} 不合法`);
      return;
    }
    let bnAmount = new BigNumber(amount);
    if (bnAmount.lte(0) || !bnAmount.isFinite()) {
      console.log(`转账数量 ${amount} 不合法`);
      return;
    }
    if (!currency) {
      console.log("请输入转账币种!");
      return;
    }
    console.log(`转出地址: ${trimmedAddress}`);
    currency = currency.toUpperCase();
    const explorerHosts = config.explorerNodes
    const explorerUrl = explorerHosts[Math.floor(Math.random() * explorerHosts.length)];
    const explorer = new JCCDexExplorer(explorerUrl);
    const balanceList = await getBalance(trimmedAddress, explorer);
    const seaaBalance = balanceList.find((balance) => balance.currency === "SEAA");
    const minGas = 1e-5;
    const seaaAvailable = _.get(seaaBalance, "available", zero);
    if (seaaAvailable.lt(minGas)) {
      console.log(`SEAA可用资产${seaaAvailable.toString(10)}小于Gas${minGas}, 无法转账`);
      return;
    }
    const eachTokenBalance = balanceList.find((balance) => balance.currency === currency);
    if (!eachTokenBalance) {
      console.log(`转出地址${trimmedAddress} 无该 ${currency} 币种资产或该资产为0`);
      return;
    }
    const { available } = eachTokenBalance;
    const eachToken = _.get(eachTokenBalance, "currency", null)
    if (eachToken === "SEAA") {
      if (available.eq(bnAmount)) {
        bnAmount = bnAmount.minus(minGas);
        console.log(`${eachToken}实际到账${bnAmount.toString(10)}`);
      }
      if (available.lt(bnAmount)) {
        console.log(`${eachToken}可用资产${available.toString(10)}小于转账数量${bnAmount.toString(10)}, 请重新输入转账数量！`);
        return;
      }
    } else {
      if (available.lt(bnAmount)) {
        console.log(`${eachToken}可用资产${available.toString(10)}小于转账数量${bnAmount.toString(10)}, 请重新输入转账数量！`);
        return;
      }
    }
    let toBalance;
    try {
      toBalance = await getBalance(trimmedTo, explorer);
    } catch (err) {
      if (err.message === "未激活" && bnAmount.gte(25) && currency === "SEAA") {
        toBalance = {
          currency: "SEAA",
          available: zero
        };
      }
    }
  if (!toBalance) return;
    const nodes = await config.getRpcNodes();
    const transaction = new Transaction({ wallet, nodes });
    const sequence = await transaction.fetchSequence(trimmedAddress);
    console.log("当前sequence:", sequence);
    if (_.isNil(sequence) || sequence === '') return;
    if (!password && !secret) {
      password = readlineSync.question("Please Enter Password:", {
        hideEchoBack: true
      });
    }
    if (password) {
      const keystore = fs.readFileSync("./keystore/wallet.json", {
        encoding: "utf-8"
      });
      const instance = new JingchangWallet(JSON.parse(keystore), true, false);
      secret = await instance.getSecretWithAddress(password, trimmedAddress);
    } else {
      if (!secret) {
        console.log("请输入密码!");
        return;
      }
    }
    const tx = serializePayment(trimmedAddress, bnAmount.toString(10), trimmedTo, currency, isObject(memo) ? JSON.stringify(memo) : memo, 10, "SEAA", "dHb9CJAWyB4dr91VRWn96DkukG4bwjtyTh"); // dG5yrYL2z9hanawx3gF6trgNkzNtjJm3eF
    // const copyTx = Object.assign({}, tx);
    const copyTx = _.cloneDeep(tx);
    copyTx.Sequence = sequence;
    const signData = wallet.sign(copyTx, secret);
    let hash;
    for (let i = 0; i < 5; i++) {
      console.log(`第${i + 1}次上链`);
      try {
        hash = await sendRawTransaction(transaction, signData.blob);
        if (hash) break;
      } catch (error) {
        console.log("上链失败:", error.message);
        try {
          const errorRes = JSON.parse(error.message);
          const result = errorRes.result.engine_result;
          if (result === "tefALREADY") {
            console.log("实际交易已经上链了！");
            break;
          }
          if (result === "telINSUF_FUND") {
            console.log(`${currency}资产不足!`);
            break;
          }
          if (result === "telBLKLIST") {
            console.log("转入钱包是黑名单钱包(冻结)");
            break;
          }
          // if (result === "telINSUF_FEE_P") {
          //   console.log(`Fee insufficient.`);
          //   break;
          // }
        } catch (err) {
          console.log("解析失败信息错误: ", err.message);
          break;
        }
        await sleep(500);
      }
    }
    if (!hash) return;
    console.log("上链成功后的hash:", hash);
    console.time("查询耗时");
    let resTx = "";
    for (let i = 0; i < 30; i++) {
      console.log(`第${i + 1}次查询`);
      try {
        const res = await transaction.fetchTransaction(hash);
        if (Transaction.isValidated(res)) {
          resTx = res;
          break;
        }
        // const res = await explorer.fetchHashDetailInfo({ hash, uuid: Date.now() });
        // const { hashDetails } = res.data;
        // if (hashDetails.success === "tesSUCCESS") {
        //   resTx = hashDetails.success;
        //   break;
        // }
        await sleep(1000);
      } catch (error) {
        console.log("查询转账详情失败:", error.message);
        await sleep(1000);
      }
    }
    console.timeEnd("查询耗时");
    if (!_.isEmpty(resTx)) {
      console.log("通过hash查询转账成功:", hash);
    }
  } catch (error) {
    if (error.message === "未激活") {
      return;
    }
    console.log("转账失败: ", error.message);
  }
};

transfer();
