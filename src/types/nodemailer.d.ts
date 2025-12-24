declare module "nodemailer" {
  interface TransportOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user?: string;
      pass?: string;
    };
  }

  interface MailOptions {
    to: string;
    from: string;
    subject: string;
    html?: string;
    text?: string;
  }

  interface Transporter {
    sendMail(options: MailOptions): Promise<any>;
  }

  function createTransport(options: TransportOptions): Transporter;

  export { createTransport, Transporter, MailOptions, TransportOptions };
}
