import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveLocale } from '../src/utils/locale.js'

test('Spanish browser variants use Spanish on the first visit', () => {
  assert.equal(resolveLocale(null, 'es-CL'), 'es')
  assert.equal(resolveLocale(null, 'ES_es'), 'es')
})

test('English and unsupported browser languages fall back to English', () => {
  assert.equal(resolveLocale(null, 'en-US'), 'en')
  assert.equal(resolveLocale(null, 'fr-FR'), 'en')
  assert.equal(resolveLocale(null, ''), 'en')
})

test('an explicit language choice overrides browser detection', () => {
  assert.equal(resolveLocale('en', 'es-CL'), 'en')
  assert.equal(resolveLocale('es', 'fr-FR'), 'es')
  assert.equal(resolveLocale('invalid', 'es-CL'), 'es')
})
