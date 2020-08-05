const program = require('commander');
const readlineSync = require("readline-sync");
const { jtWallet } = require("jcc_wallet");

program
  .usage('[options] <file ...>')
  .option('-s, --secret <path>', "钱包密钥")
  .parse(process.argv);

const getAddress = () => {
  try {
    let secret = program.secret;
    if (!secret) {
      secret = readlineSync.question("Please Enter Secret:", { hideEchoBack: true });
    }
    if (secret && !jtWallet.isValidSecret(secret, "seaa")) {
      console.log("钱包密钥不合法")
      process.exit(0);
    }
    const address = jtWallet.getAddress(secret, "seaa");
    console.log("address:", address)
  } catch (error) {
    console.log(error)
  }
}
getAddress()