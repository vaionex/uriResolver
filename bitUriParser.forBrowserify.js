var bitUriParser = require("./bitUriParser");
var paymail = require("./paymail");

const defailtOptions = paymail.getOptionForPaymail();

window.bitUriParser = {
  ...bitUriParser,
  parse: (bitcoinUriString, o = defailtOptions) =>
    bitUriParser.parse(bitcoinUriString, { ...defailtOptions, ...o }),
};
