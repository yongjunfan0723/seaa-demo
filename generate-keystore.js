const { program } = require("commander");
const fs = require("fs");
const readlineSync = require("readline-sync");
const { JingchangWallet } = require("jcc_wallet");
const { Wallet } = require("@jccdex/jingtum-lib");
const { encryptWallet } = require("jcc_wallet/lib/util");

program
  .option('-s, --secret <path>', "秘钥")
  .option('-p, --password <path>', "密码")
  .parse(process.argv);

const seaaWallet =  new Wallet('seaaps')
const generate = (password, secret) => {
  return new Promise(async(resolve, reject) => {
    const keypairs = {};
    if (!secret) {
      const wallet = seaaWallet.createWallet();
      secret = wallet.secret;
      keypairs.address = wallet.address;
    } else {
      if (!seaaWallet.isValidSecret(secret)) {
        return reject(new Error("Secret is invalid"));
      }
      keypairs.address = seaaWallet.getAddress(secret);
    }
    keypairs.secret = secret;
    keypairs.type = "seaa";
    keypairs.default = true;
    keypairs.alias = "seaa wallet";
    const jcWallet = {};
    const walletObj = await encryptWallet(password, keypairs);
    jcWallet.version = JingchangWallet.version;
    jcWallet.id = JingchangWallet._walletID;
    jcWallet.contact = {};
    jcWallet.wallets = [];
    jcWallet.wallets.push(walletObj);
    return resolve(jcWallet);
  });
};

const getSeaaAddress = (secret) => {
  return seaaWallet.getAddress(secret);
};

const generateKeystore = async () => {
  let { secret, password } = program.opts();
  const keystoreFile = "./keystore/wallet.json";
  try {
    if (!secret) {
      secret = readlineSync.question("Please Enter Secret:", { hideEchoBack: true });
    }
    if (!password) {
      password = readlineSync.question("Please Enter Password:", { hideEchoBack: true });
    }
    let wallet;
    try {
      wallet = fs.readFileSync(keystoreFile, { encoding: "utf-8" });
    } catch (error) {
      wallet = null;
    }

    let newWallet;
    if (JingchangWallet.isValid(wallet)) {
      const instance = new JingchangWallet(JSON.parse(wallet), true, false);
      newWallet = await instance.importSecret(secret, password, "seaa", getSeaaAddress);
    } else {
      newWallet = await generate(password, secret);
    }
    fs.writeFileSync(keystoreFile, JSON.stringify(newWallet, null, 2), { encoding: "utf-8" });
  } catch (error) {
    console.log(error);
  }
}

generateKeystore();