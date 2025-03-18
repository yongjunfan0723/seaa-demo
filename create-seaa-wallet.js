const { Wallet, Factory } = require("@swtc/wallet");
const { program } = require("commander");
program
  .option("-t, --type <path>", "创建钱包参数")
  .option("-a, --algorithmType <path>", "创建钱包参数")
  .parse(process.argv);
const createWallet = () => {
  const { type, algorithmType } = program.opts();
  const algorithm = algorithmType === "0" ? "ed25519" : undefined;
  const generateWallet = (walletFactory) => {
    const wallet = walletFactory.generate({ algorithm });
    const walletType = type === "guomi" ? (algorithm ? "ed25519国密SEAA" : "国密SEAA") : (algorithm ? "ed25519 SEAA" : "SEAA");
    console.log(`生成的${walletType}钱包:`, wallet);
    return wallet;
  };
  if (type === "guomi") {
    const guomiWallet = Factory({guomi: true, code: "seaaps", currency: "SEAA", ACCOUNT_ALPHABET: "dpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcjeCg65rkm8oFqi1tuvAxyz"});
    generateWallet(guomiWallet);
  } else {
    const wallet = Factory("seaaps");
    generateWallet(wallet);
  }
};

createWallet();
