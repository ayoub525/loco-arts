import nodemailer from 'nodemailer';

export async function sendResetPasswordEmail(toEmail, resetUrl) {
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');

  console.log(`[EmailService] Préparation de l'envoi d'email à : ${toEmail}`);
  console.log(`[EmailService] Lien de réinitialisation : ${resetUrl}`);

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e5e5; background-color: #ffffff;">
      <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #000;">
        <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -1px;">LOCO <span style="font-style: italic; font-weight: 300;">arts</span></h1>
        <p style="margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #666;">Creative Studio · Tunis</p>
      </div>

      <div style="padding: 30px 10px;">
        <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 15px; color: #111;">Réinitialisation de votre mot de passe</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #444; margin-bottom: 25px;">
          Vous avez demandé la réinitialisation de votre mot de passe pour votre compte sur <strong>LOCO Arts</strong>. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
        </p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #000000; color: #ffffff; padding: 14px 28px; text-decoration: none; font-size: 14px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
            Réinitialiser mon mot de passe
          </a>
        </div>

        <p style="font-size: 12px; color: #777; line-height: 1.5;">
          Ce lien est valable pendant <strong>1 heure</strong>. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité, votre mot de passe restera inchangé.
        </p>

        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #f0f0f0; word-break: break-all; font-size: 11px; color: #888;">
          Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :<br/>
          <a href="${resetUrl}" style="color: #000;">${resetUrl}</a>
        </div>
      </div>

      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #eee; font-size: 11px; color: #999;">
        © ${new Date().getFullYear()} LOCO Arts · Tunis, Tunisie · Handmade with ❤️
      </div>
    </div>
  `;

  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"LOCO Arts" <${smtpUser}>`,
        to: toEmail,
        subject: 'Réinitialisation de votre mot de passe - LOCO Arts',
        html: htmlContent,
      });

      console.log(`[EmailService] Email envoyé avec succès : ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EmailService] Erreur lors de l'envoi SMTP :`, err.message);
      return { success: false, error: err.message, fallbackUrl: resetUrl };
    }
  } else {
    console.log(`[EmailService] Aucun compte SMTP configuré. Email simulé.`);
    return { success: true, simulated: true, resetUrl };
  }
}
