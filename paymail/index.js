var paymail = require("@moneybutton/paymail-client/dist/paymail-client.cjs");
var fetch = require("isomorphic-fetch");

function getOptionForPaymail(
  dns,
  ownPaymail = "admin@relysia.com",
  getPaimailIdentityKeys = async () => {
    return {
      priv: "KxDYUBkFFDbPTLkvnx8MjXd2raYM7PjY633gsW6UPU4CqM4ero93",
      pub: "02d6a46240a16bff968e819e6f3d6ddb5e5bd43de326d8c0e299a4fcbd8139b7b9",
    };
  }
) {
  dns = dns || new paymail.BrowserDns(fetch);
  const client = new paymail.PaymailClient(dns, fetch);
  return {
    paymailOfPaymailUser: ownPaymail,
    getPaimailIdentityKeys,
    paymailResolverFunction: async (paymailAddress, satoshis, o, type, multi) =>
      await resolve(client, dns, paymailAddress, satoshis, o, type, multi),
  };
}

const P2P_RECEIVE_CAPABILITY = "5f1323cddf31";
const P2P_DESTINATION_CAPABILITY = "2a40af698840";

async function resolve(
  paymailClient,
  dns,
  paymailAddress,
  satoshis = -1,
  o,
  type,
  multi
) {
  console.log("OPTIONS : " + JSON.stringify(o));

  const capabilities = await getCapabilities(dns, paymailAddress, o);
  if (
    capabilities[P2P_DESTINATION_CAPABILITY] &&
    (!multi || multi === "false")
  ) {
    return await resolveP2P(
      paymailClient,
      paymailAddress,
      satoshis,
      capabilities,
      o,
      type
    );
  } else {
    return await resolveNonP2P(
      paymailClient,
      paymailAddress,
      satoshis,
      o,
      type
    );
  }
}

async function resolveP2P(
  paymailClient,
  paymailAddress,
  satoshis,
  capabilities,
  o,
  type
) {
  var [alias, host] = paymailAddress.split("@");

  const peer = capabilities[P2P_RECEIVE_CAPABILITY].replace(
    "{alias}",
    alias
  ).replace("{domain.tld}", host);

  const { outputs, reference } = await paymailClient.getP2pPaymentDestination(
    paymailAddress,
    satoshis
  );

  if (type) {
    return {
      outputs: outputs.map((o) => ({
        script: o.script,
        amount: o.satoshis,
      })),
      p2p: {
        peer,
        peerData: reference,
      },
    };
  }

  return {
    outputs: outputs.map((o) => ({
      script: o.script,
      satoshis: o.satoshis,
    })),
    p2p: {
      peer,
      peerData: reference,
    },
  };
}

async function resolveNonP2P(paymailClient, paymailAddress, satoshis, o, type) {
  var { priv, pub } = await o.getPaimailIdentityKeys();

  var senderInfo = {
    senderName: o.paymailOfPaymailUser.split("@")[0],
    senderHandle: o.paymailOfPaymailUser,
    amount: satoshis,
    dt: new Date().toISOString(),
    purpose: "Request from " + o.paymailOfPaymailUser,
    pubkey: pub,
  };

  senderInfo.signature =
    paymail.VerifiableMessage.forBasicAddressResolution(senderInfo).sign(priv);

  var out = await paymailClient.getOutputFor(paymailAddress, senderInfo);

  if (type) {
    return {
      outputs: [
        {
          script: out,
          amount: satoshis,
        },
      ],
    };
  }

  return {
    outputs: [
      {
        script: out,
        satoshis,
      },
    ],
  };
}

async function getCapabilities(dns, paymailAddress, o) {
  var [_, host] = paymailAddress.split("@");
  var paymailHost = host;
  try {
    const dnsSrvQuery = await new Promise((resolve, reject) =>
      dns.resolveSrv(`_bsvalias._tcp.${host}`, (err, addressess) => {
        if (err) reject(err);
        resolve(addressess);
      })
    );

    if (!dnsSrvQuery.length) throw new Error("Failed to find SRV record");

    var { name, port } = dnsSrvQuery[0];
    name = name.endsWith(".") ? name.substr(0, name.length - 1) : name;
    paymailHost = name + ":" + port;
  } catch (error) {
    // failed to get SRV record - assuming that the host is same as in the paymail address
  }

  var capabilitiesURL = `https://${paymailHost}/.well-known/bsvalias`;
  try {
    var reply = await fetch(capabilitiesURL).then((r) => r.json());
    if (!reply.capabilities)
      if (o.debugLog)
        o.debugLog(
          `Failed to get Paymail Provider Capabilities of '${host}'` +
            `\nURL: ${capabilitiesURL}` +
            `\nReply: ${JSON.stringify(reply)}`
        );
  } catch (error) {
    // failed to get /.well-known/bsvalias
    return null;
  }

  return reply.capabilities;
}

module.exports = {
  getOptionForPaymail,
  resolve,
  getCapabilities,
};
