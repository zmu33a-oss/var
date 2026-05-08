import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PKPass } from "passkit-generator";

type WalletPassConfiguration = {
  passTypeIdentifier: string;
  teamIdentifier: string;
  organizationName: string;
  signerKeyPassphrase: string;
  wwdr: Buffer;
  signerCert: Buffer;
  signerKey: Buffer;
  webServiceURL?: string;
  authenticationToken?: string;
};

type WalletPassPayload = {
  displayName: string;
  username: string;
  bio: string;
  location: string;
  email: string;
  phoneNumber: string;
  profession: string;
  nationalId: string;
  nationality: string;
  joinDate: string;
  clubName: string;
  totalPosts: string;
  totalReplies: string;
  totalLikes: string;
};

const PASS_ARTWORK_BUFFER = readFileSync(
  join(process.cwd(), "assets", "icons", "VAR.png"),
);

const PASS_MODEL_BUFFERS = {
  "icon.png": PASS_ARTWORK_BUFFER,
  "icon@2x.png": PASS_ARTWORK_BUFFER,
  "logo.png": PASS_ARTWORK_BUFFER,
  "logo@2x.png": PASS_ARTWORK_BUFFER,
};

const REQUIRED_WALLET_ENV_NAMES = [
  "APPLE_WALLET_PASS_TYPE_IDENTIFIER",
  "APPLE_WALLET_TEAM_IDENTIFIER",
  "APPLE_WALLET_ORGANIZATION_NAME",
  "APPLE_WALLET_WWDR_BASE64",
  "APPLE_WALLET_SIGNER_CERT_BASE64",
  "APPLE_WALLET_SIGNER_KEY_BASE64",
  "APPLE_WALLET_SIGNER_KEY_PASSPHRASE",
] as const;

function getEnvironmentValue(name: string) {
  return process.env[name]?.trim() ?? "";
}

function decodeCertificateEnvironment(name: string) {
  const value = getEnvironmentValue(name);

  if (!value) {
    return Buffer.alloc(0);
  }

  if (value.includes("-----BEGIN") || value.includes("\\n")) {
    return Buffer.from(value.replace(/\\n/g, "\n"), "utf8");
  }

  return Buffer.from(value, "base64");
}

function getMissingWalletEnvironmentNames() {
  return REQUIRED_WALLET_ENV_NAMES.filter((name) => !getEnvironmentValue(name));
}

function sendJson(
  response: any,
  statusCode: number,
  body: Record<string, unknown>,
) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.end(JSON.stringify(body));
}

function getHeaderValue(
  headers: Record<string, string | string[] | undefined>,
  name: string,
) {
  const headerValue = headers[name];

  if (Array.isArray(headerValue)) {
    return headerValue[0] ?? "";
  }

  return headerValue ?? "";
}

function getRequestUrl(request: any) {
  const forwardedProtocol = getHeaderValue(
    request.headers ?? {},
    "x-forwarded-proto",
  );
  const host =
    getHeaderValue(request.headers ?? {}, "x-forwarded-host") ||
    getHeaderValue(request.headers ?? {}, "host") ||
    "localhost";
  const protocol = forwardedProtocol || "https";

  return new URL(request.url ?? "/api/wallet-pass", `${protocol}://${host}`);
}

function getSearchParamValue(
  searchParams: URLSearchParams,
  key: string,
  fallback = "",
) {
  return searchParams.get(key)?.trim() || fallback;
}

function getWalletPassConfiguration(): WalletPassConfiguration {
  return {
    passTypeIdentifier: getEnvironmentValue(
      "APPLE_WALLET_PASS_TYPE_IDENTIFIER",
    ),
    teamIdentifier: getEnvironmentValue("APPLE_WALLET_TEAM_IDENTIFIER"),
    organizationName: getEnvironmentValue("APPLE_WALLET_ORGANIZATION_NAME"),
    signerKeyPassphrase: getEnvironmentValue(
      "APPLE_WALLET_SIGNER_KEY_PASSPHRASE",
    ),
    wwdr: decodeCertificateEnvironment("APPLE_WALLET_WWDR_BASE64"),
    signerCert: decodeCertificateEnvironment("APPLE_WALLET_SIGNER_CERT_BASE64"),
    signerKey: decodeCertificateEnvironment("APPLE_WALLET_SIGNER_KEY_BASE64"),
    webServiceURL: getEnvironmentValue("APPLE_WALLET_WEB_SERVICE_URL"),
    authenticationToken: getEnvironmentValue("APPLE_WALLET_AUTH_TOKEN"),
  };
}

function getWalletPassPayload(requestUrl: URL): WalletPassPayload {
  const { searchParams } = requestUrl;

  return {
    displayName: getSearchParamValue(searchParams, "displayName", "VAR PASS"),
    username: getSearchParamValue(searchParams, "username", "@varpass"),
    bio: getSearchParamValue(searchParams, "bio", "Digital Identity"),
    location: getSearchParamValue(searchParams, "location", "الرياض، السعودية"),
    email: getSearchParamValue(searchParams, "email", "support@xtik.app"),
    phoneNumber: getSearchParamValue(searchParams, "phoneNumber", ""),
    profession: getSearchParamValue(searchParams, "profession", ""),
    nationalId: getSearchParamValue(searchParams, "nationalId", "VAR-PASS"),
    nationality: getSearchParamValue(searchParams, "nationality", "سعودي"),
    joinDate: getSearchParamValue(searchParams, "joinDate", ""),
    clubName: getSearchParamValue(searchParams, "clubName", "الهلال"),
    totalPosts: getSearchParamValue(searchParams, "totalPosts", "0"),
    totalReplies: getSearchParamValue(searchParams, "totalReplies", "0"),
    totalLikes: getSearchParamValue(searchParams, "totalLikes", "0"),
  };
}

function getPassSerialNumber(payload: WalletPassPayload) {
  const baseSerial = `${payload.nationalId}-${payload.username}-${Date.now()}`
    .replace(/[^a-zA-Z0-9-]/g, "")
    .slice(0, 64);

  return baseSerial || `VARPASS-${Date.now()}`;
}

function buildPassJson(
  configuration: WalletPassConfiguration,
  payload: WalletPassPayload,
  serialNumber: string,
) {
  const barcodeMessage = payload.nationalId || payload.username || serialNumber;

  return {
    formatVersion: 1,
    passTypeIdentifier: configuration.passTypeIdentifier,
    serialNumber,
    teamIdentifier: configuration.teamIdentifier,
    organizationName: configuration.organizationName,
    description: "VAR PASS sports identity",
    logoText: "VAR PASS",
    foregroundColor: "rgb(255,255,255)",
    backgroundColor: "rgb(7,12,24)",
    labelColor: "rgb(244,197,101)",
    sharingProhibited: true,
    ...(configuration.webServiceURL && configuration.authenticationToken
      ? {
          webServiceURL: configuration.webServiceURL,
          authenticationToken: configuration.authenticationToken,
        }
      : {}),
    barcode: {
      message: barcodeMessage,
      format: "PKBarcodeFormatQR",
      messageEncoding: "iso-8859-1",
      altText: barcodeMessage,
    },
    barcodes: [
      {
        message: barcodeMessage,
        format: "PKBarcodeFormatQR",
        messageEncoding: "iso-8859-1",
        altText: barcodeMessage,
      },
    ],
    generic: {
      primaryFields: [
        {
          key: "displayName",
          label: "الاسم",
          value: payload.displayName,
        },
      ],
      secondaryFields: [
        {
          key: "clubName",
          label: "الرابطة",
          value: payload.clubName,
        },
        {
          key: "username",
          label: "المعرف",
          value: payload.username,
        },
      ],
      auxiliaryFields: [
        {
          key: "posts",
          label: "المشاركات",
          value: payload.totalPosts,
        },
        {
          key: "replies",
          label: "الردود",
          value: payload.totalReplies,
        },
        {
          key: "likes",
          label: "الإعجابات",
          value: payload.totalLikes,
        },
        {
          key: "joinDate",
          label: "الانضمام",
          value: payload.joinDate,
        },
      ],
      backFields: [
        {
          key: "bio",
          label: "النبذة",
          value: payload.bio,
        },
        {
          key: "location",
          label: "الموقع",
          value: payload.location,
        },
        {
          key: "email",
          label: "البريد",
          value: payload.email,
        },
        {
          key: "phoneNumber",
          label: "الجوال",
          value: payload.phoneNumber,
        },
        {
          key: "profession",
          label: "المهنة",
          value: payload.profession,
        },
        {
          key: "nationality",
          label: "الجنسية",
          value: payload.nationality,
        },
      ],
    },
  };
}

export default function handler(request: any, response: any) {
  if ((request.method ?? "GET") !== "GET") {
    response.statusCode = 405;
    response.setHeader("Allow", "GET");
    response.end("Method Not Allowed");
    return;
  }

  const missingWalletEnvironmentNames = getMissingWalletEnvironmentNames();

  if (missingWalletEnvironmentNames.length > 0) {
    sendJson(response, 503, {
      error: "Apple Wallet certificates are not configured yet.",
      missingEnvironmentVariables: missingWalletEnvironmentNames,
    });
    return;
  }

  try {
    const requestUrl = getRequestUrl(request);
    const configuration = getWalletPassConfiguration();
    const payload = getWalletPassPayload(requestUrl);
    const serialNumber = getPassSerialNumber(payload);
    const pass = new PKPass(
      {
        ...PASS_MODEL_BUFFERS,
        "pass.json": Buffer.from(
          JSON.stringify(buildPassJson(configuration, payload, serialNumber)),
          "utf8",
        ),
      },
      {
        wwdr: configuration.wwdr,
        signerCert: configuration.signerCert,
        signerKey: configuration.signerKey,
        signerKeyPassphrase: configuration.signerKeyPassphrase,
      },
      {
        serialNumber,
      },
    );
    const passBuffer = pass.getAsBuffer();

    response.statusCode = 200;
    response.setHeader("Content-Type", "application/vnd.apple.pkpass");
    response.setHeader(
      "Content-Disposition",
      'attachment; filename="var-pass.pkpass"',
    );
    response.setHeader("Cache-Control", "no-store");
    response.end(passBuffer);
  } catch (error) {
    sendJson(response, 500, {
      error: "Failed to generate Apple Wallet pass.",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
