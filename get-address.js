const { program } = require("commander");
const readlineSync = require("readline-sync");
const { Wallet } = require("@jccdex/jingtum-lib");

program
  .option('-s, --secret <path>', "钱包密钥")
  .parse(process.argv);

const getAddress = () => {
  try {
    let { secret } = program.opts();
    if (!secret) {
      secret = readlineSync.question("Please Enter Secret:", { hideEchoBack: true });
    }
    const wallet = new Wallet('seaaps')
    if (secret && !wallet.isValidSecret(secret)) {
      console.log("钱包密钥不合法")
      process.exit(0);
    }
    const address = wallet.getAddress(secret);
    console.log("address:", address)
  } catch (error) {
    console.log(error)
  }
}
getAddress()