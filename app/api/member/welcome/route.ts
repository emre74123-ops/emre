import { NextResponse } from "next/server";
import { createAdminClient } from "../../../../lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const accessToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!accessToken) {
    return NextResponse.json({ error: "Yetkisiz istek." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.getUser(accessToken);
  const user = data.user;

  if (error || !user?.email) {
    return NextResponse.json(
      { error: "\u00dcyelik bilgisi do\u011frulanamad\u0131." },
      { status: 401 },
    );
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    return NextResponse.json(
      { error: "E-posta servisi yap\u0131land\u0131r\u0131lmad\u0131." },
      { status: 503 },
    );
  }

  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "";
  const displayName = fullName || "De\u011ferli \u00fcyemiz";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "\u0130yilik Adresim <mail@iyilikadresim.org>",
      to: [user.email],
      subject: "\u0130yilik Adresim \u00fcyeli\u011finiz olu\u015fturuldu",
      html: `
        <div style="margin:0;background:#f6f7f4;padding:32px 16px;font-family:Arial,sans-serif;color:#123c35">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e3e9e5;border-radius:18px;padding:32px">
            <p style="margin:0 0 10px;color:#ef6a45;font-size:12px;font-weight:700;letter-spacing:2px">&#304;Y&#304;L&#304;K ADRES&#304;M</p>
            <h1 style="margin:0 0 18px;font-size:28px;line-height:1.25">&Uuml;yeli&#287;iniz haz&#305;r</h1>
            <p style="margin:0 0 14px;line-height:1.7">Merhaba ${escapeHtml(displayName)},</p>
            <p style="margin:0 0 22px;line-height:1.7">&#304;yilik Adresim &uuml;yeli&#287;iniz ba&#351;ar&#305;yla olu&#351;turuldu. E-posta adresinizle giri&#351; yapabilirsiniz.</p>
            <a href="https://www.iyilikadresim.org/" style="display:inline-block;background:#0b6b57;color:#fff;text-decoration:none;font-weight:700;padding:14px 22px;border-radius:10px">Siteye git ve giri&#351; yap</a>
            <p style="margin:24px 0 0;color:#667973;font-size:13px;line-height:1.6">&#350;ifrenizi g&uuml;venli&#287;iniz i&ccedil;in e-postalarda payla&#351;m&#305;yoruz. &#350;ifrenizi unutursan&#305;z giri&#351; ekran&#305;ndaki &ldquo;&#350;ifremi Unuttum&rdquo; ba&#287;lant&#305;s&#305;n&#305; kullanabilirsiniz.</p>
          </div>
        </div>
      `,
      text: `Merhaba ${displayName}, \u0130yilik Adresim \u00fcyeli\u011finiz ba\u015far\u0131yla olu\u015fturuldu. https://www.iyilikadresim.org/ adresinden giri\u015f yapabilirsiniz. G\u00fcvenli\u011finiz i\u00e7in \u015fifrenizi e-postalarda payla\u015fm\u0131yoruz.`,
    }),
  });

  if (!response.ok) {
    return NextResponse.json(
      { error: "Bilgilendirme e-postas\u0131 g\u00f6nderilemedi." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
