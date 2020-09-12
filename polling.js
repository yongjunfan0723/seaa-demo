const { SubscribeFactory } = require("jcc_rpc");
const testFactory = require("./test");
const config = require("./config");
const poll = true;
const timer = 10 * 1000;


const callback = async (err, res) => {
  if (err) {
    console.log("error occured:", error.message);
  }
  if (res.result.status === "success") {
    console.log(res.result.offers);
  }
}

const polling = async () => {
  try {
    const subscribeInst = SubscribeFactory.init();
    const pollingName = "testPollingName";
    const rpcNodes = await config.getRpcNodes();
    const rpcNode = rpcNodes[Math.floor(Math.random() * rpcNodes.length)];
    const pollingTask = testFactory.getConfig.bind(testFactory, { url: rpcNode, base: "testb", counter: "testu", limit: 10 });
    subscribeInst.register(pollingName, pollingTask, poll, timer).on(pollingName, callback).start(pollingName);
  } catch (error) {
    console.log("error:", error.message)
  }
}

polling()