const { jtWallet } = require("jcc_wallet");

const createWallet = () => {
  try {
    const wallet = jtWallet.createWallet("seaaps");
    console.log("seaa wallet:", wallet);
  } catch (error) {
    console.log(error)
  }
}
createWallet()