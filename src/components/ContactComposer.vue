<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import CatScene from './CatScene.vue'
import Icon from './Icon.vue'
import { links } from '../data/content'

const props = defineProps({ locale: String, t: Object, playing: Boolean })
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY
const composer = ref(null)
const turnstileHost = ref(null)
const token = ref('')
const name = ref('')
const email = ref('')
const subject = ref('')
const message = ref('')
const company = ref('')
const status = ref('idle')
const copyStatus = ref('idle')
let observer
let widgetId

const draftBody = computed(() => {
  const sender = [name.value.trim(), email.value.trim()].filter(Boolean).join(' · ')
  return [message.value.trim(), sender].filter(Boolean).join('\n\n')
})
const gmailHref = computed(() => {
  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: links.email,
    su: subject.value.trim(),
    body: draftBody.value,
  })
  return `https://mail.google.com/mail/?${params}`
})
const outlookHref = computed(() => {
  const params = new URLSearchParams({
    to: links.email,
    subject: subject.value.trim(),
    body: draftBody.value,
  })
  return `https://outlook.live.com/mail/0/deeplink/compose?${params}`
})

function resetTurnstile() {
  token.value = ''
  if (widgetId !== undefined && window.turnstile) window.turnstile.reset(widgetId)
}

function renderTurnstile() {
  if (!turnstileHost.value || !window.turnstile || widgetId !== undefined) return
  widgetId = window.turnstile.render(turnstileHost.value, {
    sitekey: siteKey,
    theme: 'dark',
    size: 'flexible',
    action: 'contact',
    callback: (value) => {
      token.value = value
    },
    'expired-callback': () => {
      token.value = ''
    },
    'error-callback': () => {
      token.value = ''
    },
  })
}

function loadTurnstile() {
  if (window.turnstile) return renderTurnstile()
  let script = document.querySelector('script[data-contact-turnstile]')
  if (!script) {
    script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.dataset.contactTurnstile = ''
    document.head.append(script)
  }
  script.addEventListener('load', renderTurnstile, { once: true })
}

async function submit() {
  if (!siteKey || !token.value || status.value === 'sending') return
  status.value = 'sending'
  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.value.trim(),
        email: email.value.trim(),
        subject: subject.value.trim(),
        message: message.value.trim(),
        company: company.value,
        turnstileToken: token.value,
      }),
    })
    if (!response.ok) throw new Error('Contact request failed')
    status.value = 'sent'
    name.value = ''
    email.value = ''
    subject.value = ''
    message.value = ''
    resetTurnstile()
  } catch {
    status.value = 'error'
    resetTurnstile()
  }
}

async function copyDraft() {
  const draft = `${props.t.recipient} ${links.email}\n${props.t.subjectLabel} ${subject.value.trim()}\n\n${name.value.trim()} <${email.value.trim()}>\n\n${message.value.trim()}`
  try {
    await navigator.clipboard.writeText(draft)
    copyStatus.value = 'copied'
  } catch {
    copyStatus.value = 'error'
  }
}

onMounted(() => {
  if (!siteKey) return
  observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return
      loadTurnstile()
      observer.disconnect()
    },
    { threshold: 0.05 },
  )
  observer.observe(composer.value)
})

onBeforeUnmount(() => {
  observer?.disconnect()
  if (widgetId !== undefined && window.turnstile) window.turnstile.remove(widgetId)
})
</script>

<template>
  <div ref="composer" class="contact-composer">
    <CatScene
      class="composer-cat"
      variant="night"
      :photo="false"
      :playing="playing"
      :label="
        locale === 'es'
          ? 'Nibe está sentado sobre el borde del mensaje de contacto.'
          : 'Nibe sits on the edge of the contact message.'
      "
    />
    <div class="composer-bar">
      <span class="composer-dots" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>{{ t.newMessage }}</span>
    </div>
    <form class="composer-main" @submit.prevent="submit">
      <div class="composer-row">
        <span>{{ t.recipient }}</span>
        <span class="composer-recipient">{{ links.email }}</span>
      </div>
      <div class="composer-identity">
        <label for="contact-name">
          <span>{{ t.nameLabel }}</span>
          <input
            id="contact-name"
            v-model="name"
            type="text"
            maxlength="80"
            autocomplete="name"
            required
            :placeholder="t.namePlaceholder"
          />
        </label>
        <label for="contact-email">
          <span>{{ t.emailLabel }}</span>
          <input
            id="contact-email"
            v-model="email"
            type="email"
            maxlength="254"
            autocomplete="email"
            required
            :placeholder="t.emailPlaceholder"
          />
        </label>
      </div>
      <label class="composer-row" for="contact-subject">
        <span>{{ t.subjectLabel }}</span>
        <input
          id="contact-subject"
          v-model="subject"
          type="text"
          maxlength="160"
          required
          :placeholder="t.subjectPlaceholder"
          autocomplete="off"
        />
      </label>
      <label class="sr-only" for="contact-message">{{ t.messageLabel }}</label>
      <textarea
        id="contact-message"
        v-model="message"
        minlength="10"
        maxlength="2000"
        rows="5"
        required
        :placeholder="t.messagePlaceholder"
      ></textarea>
      <label class="contact-honeypot" aria-hidden="true">
        Company
        <input v-model="company" type="text" tabindex="-1" autocomplete="off" />
      </label>
      <div v-if="siteKey" ref="turnstileHost" class="contact-turnstile"></div>
      <div class="composer-actions">
        <button
          v-if="siteKey"
          class="button button-primary"
          type="submit"
          :disabled="!token || status === 'sending'"
        >
          {{ status === 'sending' ? t.sending : t.sendMessage }}<Icon name="diagonal" :size="17" />
        </button>
        <button v-else class="button button-primary" type="button" @click="copyDraft">
          {{ t.copyDraft }}<Icon name="copy" :size="17" />
        </button>
        <p v-if="siteKey">{{ t.sendHint }}</p>
        <p v-else>{{ t.fallbackHint }}</p>
      </div>
      <p v-if="status === 'sent'" class="contact-feedback contact-success" role="status">
        {{ t.sentConfirmation }}
      </p>
      <p v-if="status === 'error'" class="contact-feedback contact-error" role="alert">
        {{ t.sendError }}
      </p>
      <p v-if="copyStatus === 'copied'" class="contact-feedback contact-success" role="status">
        {{ t.copiedDraft }}
      </p>
      <p v-if="copyStatus === 'error'" class="contact-feedback contact-error" role="alert">
        {{ t.copyError }}
      </p>
      <div class="contact-fallback">
        <span>{{ t.fallbackLabel }}</span>
        <a :href="gmailHref" target="_blank" rel="noopener noreferrer"
          >Gmail<Icon name="diagonal" :size="15"
        /></a>
        <a :href="outlookHref" target="_blank" rel="noopener noreferrer"
          >Outlook<Icon name="diagonal" :size="15"
        /></a>
        <button v-if="siteKey" type="button" @click="copyDraft">
          {{ t.copyDraft }}<Icon name="copy" :size="15" />
        </button>
      </div>
    </form>
  </div>
</template>
