declare module "qrcode" {
  type QRCodeColorOptions = {
    dark?: string;
    light?: string;
  };

  type QRCodeToDataURLOptions = {
    color?: QRCodeColorOptions;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
  };

  const QRCode: {
    toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
  };

  export default QRCode;
}
