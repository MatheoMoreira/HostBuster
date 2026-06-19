<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? 'HostBuster' }}</title>
</head>
<body style="margin:0;padding:0;background:#09090b;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:32px 0;">
        <tr>
            <td align="center">
                <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:92%;background:#18181b;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
                    <tr>
                        <td style="height:6px;background:{{ $accent ?? '#dc2626' }};"></td>
                    </tr>
                    <tr>
                        <td style="padding:36px 40px 8px;">
                            <span style="display:inline-block;background:#dc2626;color:#ffffff;font-size:20px;font-weight:800;font-style:italic;letter-spacing:-1px;padding:6px 14px;border-radius:10px;">
                                Host<span style="color:#000000;">Buster</span>
                            </span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:16px 40px 0;">
                            <h1 style="margin:0 0 12px;color:#ffffff;font-size:22px;font-weight:800;">{{ $heading }}</h1>
                            <p style="margin:0 0 20px;color:#a1a1aa;font-size:15px;line-height:1.6;">{!! nl2br(e($intro)) !!}</p>
                        </td>
                    </tr>
                    @isset($url)
                    <tr>
                        <td style="padding:0 40px 8px;">
                            <a href="{{ $url }}" style="display:inline-block;background:#dc2626;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:14px 28px;border-radius:6px;">
                                {{ $action ?? 'Ouvrir' }}
                            </a>
                        </td>
                    </tr>
                    @endisset
                    <tr>
                        <td style="padding:28px 40px 36px;">
                            <hr style="border:none;border-top:1px solid #27272a;margin:0 0 16px;">
                            <p style="margin:0;color:#52525b;font-size:11px;line-height:1.6;">
                                Email automatique HostBuster · ne pas répondre.
                            </p>
                        </td>
                    </tr>
                </table>
                <p style="color:#3f3f46;font-size:11px;margin:20px 0 0;">© {{ date('Y') }} HostBuster · CPI-Corporation</p>
            </td>
        </tr>
    </table>
</body>
</html>
