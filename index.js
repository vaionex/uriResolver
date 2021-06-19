var bitUriParser = require("./bitUriParser");
var paymail = require("./paymail");
var dns = require("dns");

const defailtOptions = paymail.getOptionForPaymail(dns);

module.exports = {
  ...bitUriParser,
  paymailResolving: paymail,
  parse: (bitcoinUriString, o = defailtOptions) =>
    bitUriParser.parse(bitcoinUriString, { ...defailtOptions, ...o }),
};
