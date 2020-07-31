const program = require('commander');
const fs = require("fs");
const readlineSync = require("readline-sync");
const { JingchangWallet, jtWallet } = require("jcc_wallet");
const { encryptWallet } = require("jcc_wallet/lib/util");

program
  .usage('[options] <file ...>')
  .option('-s, --secret <path>', "秘钥")
  .option('-p, --password <path>', "密码")
  .parse(process.argv);


const generate = (password, secret) => {
  return new Promise((resolve, reject) => {
    const keypairs = {};
    if (!secret) {
      const wallet = jtWallet.createWallet("seaa");
      secret = wallet.secret;
      keypairs.address = wallet.address;
    } else {
      if (!jtWallet.isValidSecret(secret, "seaa")) {
        return reject(new Error("Secret is invalid"));
      }
      keypairs.address = jtWallet.getAddress(secret, "seaa");
    }
    keypairs.secret = secret;
    keypairs.type = "seaa";
    keypairs.default = true;
    keypairs.alias = "seaa wallet";
    const jcWallet = {};
    const walletObj = encryptWallet(password, keypairs);
    jcWallet.version = JingchangWallet.version;
    jcWallet.id = JingchangWallet._walletID;
    jcWallet.contact = {};
    jcWallet.wallets = [];
    jcWallet.wallets.push(walletObj);
    return resolve(jcWallet);
  });
};

const getSeaaAddress = (secret) => {
    return jtWallet.getAddress(secret, "seaa");
  },

  const generateKeystore = async () => {
    let secret = program.secret;
    let password = program.password;
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