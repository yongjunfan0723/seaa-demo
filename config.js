const axios = require("axios");

const getRpcNodes = async () => {
  const res = await axios.get("https://cfg.seaaps.com/seaaps_config.json", { timeout: 10000 });
  if (res.status === 200 && res.data.seaaNodes.length > 0) {
    return res.data.seaaNodes;
  } else {
    return [
      "http://159.138.246.146:3650",
      "http://47.254.237.209:3650",
      "http://47.254.242.111:3650",
      "http://47.241.133.154:3650",
      "http://47.241.16.210:3650"
      // "https://devseaaswtcrpc.jccdex.cn",
      // "https://seaaswtcrpc.jccdex.cn"
    ]
  }
}

exports.getRpcNodes = getRpcNodes;
const explorerNodes = [
  "https://devseaascan.jccdex.cn:8443",
  "https://seaascan.jccdex.cn"
]
exports.explorerNodes = explorerNodes;
// // module.exports = {
// //   explorerNodes: [
// //     "https://devseaascan.jccdex.cn:8443",
// //     "https://seaascan.jccdex.cn"
// //   ]
// }