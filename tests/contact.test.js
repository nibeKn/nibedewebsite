import test from 'node:test'
import assert from 'node:assert/strict'
import { onRequestPost } from '../functions/api/contact.js'

const env = {
  CF_ACCOUNT_ID: 'account-id',
  CF_EMAIL_API_TOKEN: 'email-token',
  TURNSTILE_SECRET_KEY: 'turnstile-secret',
}

function request(data) {
  return new Request('https://www.nibe.dev/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: 'https://www.nibe.dev' },
    body: JSON.stringify(data),
  })
}

const valid = {
  name: 'Jane Recruiter',
  email: 'jane@example.com',
  subject: 'Portfolio enquiry',
  message: 'Hello, I would like to talk about a project.',
  turnstileToken: 'test-token',
}

test('rejects invalid input without contacting external services', async () => {
  const previousFetch = globalThis.fetch
  globalThis.fetch = () => {
    throw new Error('Unexpected fetch')
  }
  try {
    const response = await onRequestPost({ request: request({ ...valid, email: 'invalid' }), env })
    assert.equal(response.status, 400)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('rejects failed Turnstile verification without sending email', async () => {
  const previousFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    return Response.json({ success: false })
  }
  try {
    const response = await onRequestPost({ request: request(valid), env })
    assert.equal(response.status, 403)
    assert.equal(calls, 1)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('sends a verified message to the owner with the visitor as reply-to', async () => {
  const previousFetch = globalThis.fetch
  const calls = []
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options })
    if (calls.length === 1) {
      return Response.json({ success: true, action: 'contact', hostname: 'www.nibe.dev' })
    }
    return Response.json({ success: true, result: { delivered: ['j.leppe23@gmail.com'] } })
  }
  try {
    const response = await onRequestPost({ request: request(valid), env })
    assert.equal(response.status, 200)
    assert.equal(calls.length, 2)
    assert.equal(calls[0].url, 'https://challenges.cloudflare.com/turnstile/v0/siteverify')
    assert.equal(
      calls[1].url,
      'https://api.cloudflare.com/client/v4/accounts/account-id/email/sending/send',
    )
    const email = JSON.parse(calls[1].options.body)
    assert.equal(email.to, 'j.leppe23@gmail.com')
    assert.equal(email.from, 'contact@nibe.dev')
    assert.equal(email.reply_to, 'jane@example.com')
    assert.match(email.text, /Hello, I would like to talk about a project/)
  } finally {
    globalThis.fetch = previousFetch
  }
})

test('does not report success if the email service has not accepted the recipient', async () => {
  const previousFetch = globalThis.fetch
  let calls = 0
  globalThis.fetch = async () => {
    calls += 1
    return calls === 1
      ? Response.json({ success: true, action: 'contact', hostname: 'www.nibe.dev' })
      : Response.json({ success: true, result: { permanent_bounces: ['j.leppe23@gmail.com'] } })
  }
  try {
    const response = await onRequestPost({ request: request(valid), env })
    assert.equal(response.status, 502)
  } finally {
    globalThis.fetch = previousFetch
  }
})
