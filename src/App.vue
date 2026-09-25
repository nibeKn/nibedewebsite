<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import CatScene from './components/CatScene.vue'
import MeteorOverlay from './components/MeteorOverlay.vue'
import ProjectCard from './components/ProjectCard.vue'
import Icon from './components/Icon.vue'
import { content, projects, links, media } from './data/content'
import { resolveLocale } from './utils/locale'

function readLocaleChoice() {
  try {
    return localStorage.getItem('nibe-locale-choice')
  } catch {
    return null
  }
}
const locale = ref(
  resolveLocale(readLocaleChoice(), navigator.languages?.[0] || navigator.language),
)
const t = computed(() => content[locale.value])
const menuOpen = ref(false)
const menuButton = ref(null)
const menuPanel = ref(null)
const activeSection = ref('inicio')
const ids = ['proyectos', 'sobre-mi', 'contacto']
const draftSubject = ref('')
const draftMessage = ref('')
const contactHref = computed(() => {
  const fields = []
  if (draftSubject.value.trim())
    fields.push(`subject=${encodeURIComponent(draftSubject.value.trim())}`)
  if (draftMessage.value.trim())
    fields.push(`body=${encodeURIComponent(draftMessage.value.trim().replace(/\r?\n/g, '\r\n'))}`)
  return `mailto:${links.email}${fields.length ? `?${fields.join('&')}` : ''}`
})
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
const reduced = ref(motionQuery.matches)
const playing = computed(() => !reduced.value)
let sectionObserver
const wideQuery = window.matchMedia('(min-width: 761px)')

watch(
  locale,
  (value) => {
    document.documentElement.lang = value
    document.title =
      value === 'es'
        ? 'Nibe — Diseño & desarrollo front-end'
        : 'Nibe — Design & front-end development'
  },
  { immediate: true },
)
function chooseLocale(value) {
  locale.value = value
  try {
    localStorage.setItem('nibe-locale-choice', value)
  } catch {}
}
watch(
  playing,
  (value) => {
    document.documentElement.dataset.motion = value ? 'on' : 'off'
  },
  { immediate: true },
)
watch(menuOpen, (open) => {
  document.body.classList.toggle('menu-is-open', open)
})

async function toggleMenu() {
  menuOpen.value = !menuOpen.value
  if (menuOpen.value) {
    await nextTick()
    menuPanel.value?.querySelector('a')?.focus()
  }
}
function closeMenu(restore = false) {
  menuOpen.value = false
  if (restore) menuButton.value?.focus()
}
async function navigate(id) {
  closeMenu()
  await nextTick()
  document.getElementById(id)?.focus({ preventScroll: true })
}
function keydown(event) {
  if (!menuOpen.value) return
  if (event.key === 'Escape') {
    event.preventDefault()
    closeMenu(true)
  }
  if (event.key !== 'Tab') return
  const items = [menuButton.value, ...menuPanel.value.querySelectorAll('a, button')]
  const first = items[0]
  const last = items.at(-1)
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}
const updateReduced = (event) => {
  reduced.value = event.matches
}
const updateWidth = (event) => {
  if (event.matches) closeMenu()
}
onMounted(() => {
  motionQuery.addEventListener('change', updateReduced)
  wideQuery.addEventListener('change', updateWidth)
  document.addEventListener('keydown', keydown)
  sectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) if (entry.isIntersecting) activeSection.value = entry.target.id
    },
    { rootMargin: '-15% 0px -55% 0px', threshold: 0 },
  )
  document
    .querySelectorAll('main > section[id]')
    .forEach((section) => sectionObserver.observe(section))
})
onBeforeUnmount(() => {
  sectionObserver?.disconnect()
  motionQuery.removeEventListener('change', updateReduced)
  wideQuery.removeEventListener('change', updateWidth)
  document.removeEventListener('keydown', keydown)
  document.body.classList.remove('menu-is-open')
})
</script>

<template>
  <a class="skip-link" href="#main">{{ t.skip }}</a>
  <header class="site-header">
    <div class="header-inner">
      <a
        class="wordmark"
        href="#inicio"
        @click="navigate('inicio')"
        :aria-label="locale === 'es' ? 'Nibe punto dev — inicio' : 'Nibe dot dev — home'"
        >nibe<span class="wordmark-dot" aria-hidden="true">.</span><span>dev</span></a
      >
      <nav
        class="desktop-nav"
        :aria-label="locale === 'es' ? 'Navegación principal' : 'Main navigation'"
      >
        <a
          v-for="(label, i) in t.nav"
          :key="ids[i]"
          :href="`#${ids[i]}`"
          :aria-current="activeSection === ids[i] ? 'location' : undefined"
          @click="navigate(ids[i])"
          >{{ label }}</a
        >
      </nav>
      <div class="header-tools">
        <div
          class="language-switch"
          :aria-label="locale === 'es' ? 'Idioma' : 'Language'"
          role="group"
        >
          <button @click="chooseLocale('es')" :aria-pressed="locale === 'es'">ES</button
          ><span aria-hidden="true">/</span
          ><button @click="chooseLocale('en')" :aria-pressed="locale === 'en'">EN</button>
        </div>
        <a class="header-contact" href="#contacto" @click="navigate('contacto')"
          >{{ t.hello }}<Icon name="diagonal" :size="16"
        /></a>
        <button
          ref="menuButton"
          class="menu-button"
          :aria-expanded="menuOpen"
          aria-controls="mobile-menu"
          :aria-label="menuOpen ? t.closeMenu : t.menu"
          @click="toggleMenu"
        >
          <Icon :name="menuOpen ? 'close' : 'menu'" />
        </button>
      </div>
    </div>
    <nav
      v-if="menuOpen"
      ref="menuPanel"
      id="mobile-menu"
      class="mobile-menu"
      :aria-label="locale === 'es' ? 'Navegación móvil' : 'Mobile navigation'"
    >
      <a v-for="(label, i) in t.nav" :key="ids[i]" :href="`#${ids[i]}`" @click="navigate(ids[i])"
        ><span>0{{ i + 1 }}</span
        >{{ label }}<Icon name="diagonal"
      /></a>
    </nav>
  </header>

  <main id="main" tabindex="-1" :inert="menuOpen">
    <section id="inicio" class="hero section-shell" tabindex="-1" aria-labelledby="hero-title">
      <div class="hero-copy">
        <p class="eyebrow"><span class="tiny-star" aria-hidden="true">✳</span>{{ t.role }}</p>
        <p class="hero-greeting">{{ t.greeting }}</p>
        <h1 id="hero-title">
          {{ t.headline }} <em>{{ t.headlineAccent }}</em>
        </h1>
        <p class="hero-description">{{ t.intro }}</p>
        <div class="hero-actions">
          <a class="button button-primary" href="#proyectos" @click="navigate('proyectos')"
            >{{ t.work }}<Icon name="arrow" /></a
          ><a class="text-link hero-about" href="#sobre-mi" @click="navigate('sobre-mi')"
            >{{ t.aboutLink }}<Icon name="diagonal" :size="17"
          /></a>
        </div>
      </div>
      <figure class="hero-art">
        <CatScene
          variant="coast"
          :playing="playing"
          eager
          :label="
            locale === 'es'
              ? 'El gato Nibe mira su teléfono en un andén junto al mar.'
              : 'Nibe the cat checks his phone on a platform beside the sea.'
          "
        >
          <span class="scene-corner corner-tl" aria-hidden="true"></span
          ><span class="scene-corner corner-br" aria-hidden="true"></span>
        </CatScene>
        <figcaption>{{ t.coastLabel }}</figcaption>
      </figure>
      <div class="hero-bottom">
        <span>VUE / JAVASCRIPT / CSS</span
        ><a href="#proyectos" @click="navigate('proyectos')"
          >{{ t.scroll }}<Icon name="down" :size="16" /></a
        ><span class="edition">PORTFOLIO — 2026</span>
      </div>
    </section>

    <section
      id="proyectos"
      class="projects-section section-shell"
      tabindex="-1"
      aria-labelledby="projects-title"
    >
      <div class="section-heading">
        <div>
          <p class="eyebrow">{{ t.selected }} <span class="count">(02)</span></p>
          <h2 id="projects-title">
            {{ t.projectsTitle }}<br /><em>{{ t.projectsAccent }}</em>
          </h2>
        </div>
        <p class="section-description">{{ t.projectsIntro }}</p>
      </div>
      <div class="projects-grid">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :locale="locale"
          :t="t"
        />
      </div>
    </section>

    <section
      id="sobre-mi"
      class="about-section section-shell"
      tabindex="-1"
      aria-labelledby="about-title"
    >
      <figure class="about-art">
        <CatScene
          variant="studio"
          :playing="playing"
          :label="
            locale === 'es'
              ? 'Nibe trabaja en su portátil, sentado en el sillón de un estudio.'
              : 'Nibe works on a laptop, sitting in a studio armchair.'
          "
        />
        <figcaption>{{ t.studioLabel }}<span aria-hidden="true">↗</span></figcaption>
      </figure>
      <div class="about-copy">
        <p class="eyebrow">{{ t.aboutEyebrow }}</p>
        <h2 id="about-title">
          {{ t.aboutTitle }}<br /><em>{{ t.aboutAccent }}</em>
        </h2>
        <p class="about-intro">{{ t.aboutBody }}</p>
        <p class="muted">{{ t.aboutBody2 }}</p>
        <div class="toolbox">
          <p class="eyebrow">{{ t.stackLabel }}</p>
          <ul class="tags">
            <li v-for="tool in ['Vue 3', 'JavaScript', 'HTML', 'CSS', 'Vite', 'Git']" :key="tool">
              {{ tool }}
            </li>
          </ul>
        </div>
        <div class="about-links">
          <a class="text-link" :href="links.github" target="_blank" rel="noopener noreferrer"
            >GitHub<Icon name="diagonal" :size="16" /></a
          ><a class="text-link" :href="links.linkedin" target="_blank" rel="noopener noreferrer"
            >LinkedIn<Icon name="diagonal" :size="16"
          /></a>
        </div>
      </div>
      <div class="principles">
        <p class="eyebrow">{{ t.approach }}</p>
        <div class="principles-grid">
          <article v-for="principle in t.principles" :key="principle[0]">
            <span class="principle-number">{{ principle[0] }}</span>
            <h3>{{ principle[1] }}</h3>
            <p>{{ principle[2] }}</p>
          </article>
        </div>
      </div>
    </section>

    <section
      id="contacto"
      class="contact-section section-shell"
      tabindex="-1"
      aria-labelledby="contact-title"
    >
      <div class="contact-stage">
        <img
          class="contact-sky"
          :src="media('night.webp')"
          alt=""
          loading="lazy"
          width="1536"
          height="2048"
        />
        <MeteorOverlay :playing="playing" />
        <div class="contact-stage-content">
          <div class="contact-intro">
            <p class="eyebrow">{{ t.contactEyebrow }}</p>
            <h2 id="contact-title">
              {{ t.contactTitle }}<br /><em>{{ t.contactAccent }}</em>
            </h2>
            <p class="muted">{{ t.contactBody }}</p>
          </div>
          <div class="contact-composer">
            <CatScene
              class="composer-cat"
              variant="night"
              :photo="false"
              :playing="playing"
              :label="
                locale === 'es'
                  ? 'Nibe está sentado sobre el borde del borrador de correo.'
                  : 'Nibe sits on the edge of the email draft.'
              "
            />
            <div class="composer-bar">
              <span class="composer-dots" aria-hidden="true"><i></i><i></i><i></i></span
              ><span>{{ t.newMessage }}</span>
            </div>
            <div class="composer-main">
              <div class="composer-row">
                <span>{{ t.recipient }}</span
                ><a :href="`mailto:${links.email}`">{{ links.email }}</a>
              </div>
              <label class="composer-row" for="contact-subject"
                ><span>{{ t.subjectLabel }}</span
                ><input
                  id="contact-subject"
                  v-model="draftSubject"
                  type="text"
                  maxlength="160"
                  :placeholder="t.subjectPlaceholder"
                  autocomplete="off"
              /></label>
              <label class="sr-only" for="contact-message">{{ t.messageLabel }}</label>
              <textarea
                id="contact-message"
                v-model="draftMessage"
                maxlength="2000"
                rows="5"
                :placeholder="t.messagePlaceholder"
              ></textarea>
              <div class="composer-actions">
                <a class="button button-primary" :href="contactHref"
                  >{{ t.openMail }}<Icon name="diagonal" :size="17"
                /></a>
                <p>{{ t.mailHint }}</p>
              </div>
            </div>
          </div>
          <div class="contact-socials">
            <p class="eyebrow">{{ t.socialPrompt }}</p>
            <div class="contact-social-links">
              <a :href="links.linkedin" target="_blank" rel="noopener noreferrer"
                >LinkedIn<Icon name="diagonal" :size="18"
              /></a>
              <a :href="links.github" target="_blank" rel="noopener noreferrer"
                >GitHub<Icon name="diagonal" :size="18"
              /></a>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer section-shell" :inert="menuOpen">
    <a class="wordmark" href="#inicio" @click="navigate('inicio')" aria-label="nibe.dev"
      >nibe<span class="wordmark-dot" aria-hidden="true">.</span><span>dev</span></a
    >
    <p>© {{ new Date().getFullYear() }} · {{ t.footer }}</p>
    <div class="footer-links">
      <a :href="links.github" target="_blank" rel="noopener noreferrer"
        >GitHub<Icon name="diagonal" :size="14" /></a
      ><a :href="links.linkedin" target="_blank" rel="noopener noreferrer"
        >LinkedIn<Icon name="diagonal" :size="14" /></a
      ><a href="#inicio" @click="navigate('inicio')" :aria-label="t.backTop" :title="t.backTop"
        ><Icon name="up" :size="18"
      /></a>
    </div>
  </footer>
</template>
