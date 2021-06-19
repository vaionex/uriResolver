var paymail = require("../paymail");
var dns = require("dns");

jest.setTimeout(30000);

async function runPaymailTest(
  paymailAddress,
  useBowserCompatibleResolver,
  isExpectedToBeP2P
) {
  const options = useBowserCompatibleResolver
    ? paymail.getOptionForPaymail()
    : paymail.getOptionForPaymail(dns);

  const { outputs, p2p } = await options.paymailResolverFunction(
    paymailAddress,
    100000,
    options
  );

  if (!outputs || !outputs.length) {
    throw new Error("Outputs array is empty or undefined");
  }

  for (let i = 0; i < outputs.length; i++) {
    const { script, satoshis } = outputs[i];

    if (!/[0-9a-f]+/.test(script))
      throw new Error(
        "Output string expected to be a HEX string, but was : " +
          JSON.stringify(script)
      );
  }

  if (isExpectedToBeP2P) {
    if (!p2p || !p2p.peer) {
      throw new Error(
        "Expected to resolve peer, but got : " + JSON.stringify(p2p)
      );
    }
  } else {
    if (!!p2p) {
      throw new Error(
        "Expected to find no peer, but got : " + JSON.stringify(p2p)
      );
    }
  }
}

test("NodeJS Resolve: bitcoinsofia@handcash.io", function (done) {
  runPaymailTest("bitcoinsofia@handcash.io", false, true)
    .catch(done)
    .then(done);
});

test("NodeJS Resolve: bitcoinsofia@moneybutton.com", function (done) {
  runPaymailTest("bitcoinsofia@moneybutton.com", false, true)
    .catch(done)
    .then(done);
});

test("NodeJS Resolve: bitcoinsofia@relayx.io", function (done) {
  runPaymailTest("bitcoinsofia@relayx.io", false).catch(done).then(done);
});

test("NodeJS Resolve: aleks@centbee.com", function (done) {
  runPaymailTest("aleks@centbee.com", false).catch(done).then(done);
});

test("NodeJS Resolve: alekstest@wallet.vaionex.com", function (done) {
  runPaymailTest("alekstest@wallet.vaionex.com", false).catch(done).then(done);
});

test("Browser Resolve: bitcoinsofia@handcash.io", function (done) {
  runPaymailTest("bitcoinsofia@handcash.io", true, true).catch(done).then(done);
});

test("Browser Resolve: bitcoinsofia@moneybutton.com", function (done) {
  runPaymailTest("bitcoinsofia@moneybutton.com", true, true)
    .catch(done)
    .then(done);
});

test("Browser Resolve: bitcoinsofia@relayx.io", function (done) {
  runPaymailTest("bitcoinsofia@relayx.io", true).catch(done).then(done);
});

test("Browser Resolve: aleks@centbee.com", function (done) {
  runPaymailTest("aleks@centbee.com", true).catch(done).then(done);
});

test("Browser Resolve: alekstest@wallet.vaionex.com", function (done) {
  runPaymailTest("alekstest@wallet.vaionex.com", true).catch(done).then(done);
});
