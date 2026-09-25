const recipient = 'j.leppe23@gmail.com'
const sender = 'contact@nibe.dev'

function respond(status, code) {
  return Response.json({ code }, { status, headers: { 'Cache-Control': 'no-store' } })
}

function validText(value, min, max) {
  return typeof value === 'string' && value.trim().length >= min && value.trim().length <= max
}

export async function onRequestPost({ request, env }) {
  if (!env.CF_ACCOUNT_ID || !env.CF_EMAIL_API_TOKEN || !env.TURNSTILE_SECRET_KEY) {
    return respond(503, 'not_configured')
  }

  const origin = request.headers.get('Origin')
  if (origin && origin !== new URL(request.url).origin) return respond(403, 'invalid_origin')
  if (!request.headers.get('Content-Type')?.includes('application/json')) {
    return respond(415, 'invalid_content_type')
  }
  if (Number(request.headers.get('Content-Length')) > 16000) return respond(413, 'too_large')

  let data
  try {
    const body = await request.text()
    if (body.length > 16000) return respond(413, 'too_large')
    data = JSON.parse(body)
  } catch {
    return respond(400, 'invalid_json')
  }

  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return respond(400, 'invalid_fields')
  }
  if (data.company) return respond(200, 'accepted')

  const { name, email, subject, message, turnstileToken } = data
  if (
    !validText(name, 2, 80) ||
    /[\r\n]/.test(name) ||
    !validText(email, 3, 254) ||
    !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email.trim()) ||
    !validText(subject, 2, 160) ||
    /[\r\n]/.test(subject) ||
    !validText(message, 10, 2000) ||
    !validText(turnstileToken, 1, 2048)
  ) {
    return respond(400, 'invalid_fields')
  }

  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        secret: env.TURNSTILE_SECRET_KEY,
        response: turnstileToken,
        remoteip: request.headers.get('CF-Connecting-IP') || undefined,
      }),
    })
    if (!verification.ok) return respond(502, 'verification_unavailable')
    const challenge = await verification.json()
    if (
      !challenge.success ||
      challenge.action !== 'contact' ||
      challenge.hostname !== new URL(request.url).hostname
    ) {
      return respond(403, 'verification_failed')
    }

    const delivery = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(env.CF_ACCOUNT_ID)}/email/sending/send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.CF_EMAIL_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: recipient,
          from: sender,
          reply_to: email.trim(),
          subject: `[nibe.dev] ${subject.trim()}`,
          text: `From: ${name.trim()} <${email.trim()}>\n\n${message.trim()}`,
        }),
      },
    )
    if (!delivery.ok) return respond(502, 'delivery_failed')
    const result = await delivery.json()
    const accepted = [...(result.result?.delivered || []), ...(result.result?.queued || [])]
    if (!result.success || !accepted.includes(recipient)) return respond(502, 'delivery_failed')
    return respond(200, 'sent')
  } catch {
    return respond(502, 'service_unavailable')
  }
}
