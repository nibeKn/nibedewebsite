<script setup>
import { computed, ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { media } from '../data/content'
import Icon from './Icon.vue'

const props = defineProps({ project: Object, locale: String, t: Object })
const copy = computed(() => props.project[props.locale])
const playing = ref(false)
const expanded = ref(false)
const video = ref(null)
const visual = ref(null)
const videoTrigger = ref(null)
let observer
function pauseWhenHidden() {
  if (document.hidden) video.value?.pause()
}

async function closeVideo() {
  playing.value = false
  await nextTick()
  videoTrigger.value?.focus({ preventScroll: true })
}
watch(playing, async (value) => {
  if (value) {
    await nextTick()
    video.value?.focus({ preventScroll: true })
    try {
      await video.value?.play()
    } catch {}
  }
})
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    if (!entry.isIntersecting) video.value?.pause()
  })
  observer.observe(visual.value)
  document.addEventListener('visibilitychange', pauseWhenHidden)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', pauseWhenHidden)
})
</script>

<template>
  <article class="project-card" :class="project.theme" :id="project.id">
    <div class="project-topline">
      <span>{{ project.number }} / {{ copy.category }}</span
      ><span>{{ t.personal }}</span>
    </div>
    <div ref="visual" class="project-visual">
      <img :src="media(project.image)" :alt="copy.alt" loading="lazy" width="1280" height="720" />
      <button
        v-if="!playing"
        ref="videoTrigger"
        class="preview-trigger"
        :aria-label="`${t.play} — ${project.title}`"
        :title="t.play"
        @click="playing = true"
      >
        <Icon name="play" :size="18" />
      </button>
      <div v-if="playing" class="video-overlay" @keydown.esc.stop="closeVideo">
        <video
          ref="video"
          :src="media(project.video)"
          :poster="media(project.image)"
          controls
          muted
          playsinline
          tabindex="0"
          :aria-label="`${t.play} — ${project.title}`"
        ></video>
        <button class="video-close" @click="closeVideo" :aria-label="t.stop">
          <Icon name="close" />
        </button>
      </div>
    </div>
    <div class="project-heading">
      <h3>{{ project.title }}</h3>
      <span class="project-mark" aria-hidden="true"><Icon name="diagonal" :size="27" /></span>
    </div>
    <p class="project-tagline">{{ copy.title }}</p>
    <p class="project-summary">{{ copy.summary }}</p>
    <ul class="tags" :aria-label="locale === 'es' ? 'Tecnologías' : 'Technologies'">
      <li v-for="tag in project.tags" :key="tag">{{ tag }}</li>
    </ul>
    <div class="project-links">
      <a :href="project.demo" target="_blank" rel="noopener noreferrer"
        >{{ t.demo }}<Icon name="diagonal" :size="17" /></a
      ><a :href="project.code" target="_blank" rel="noopener noreferrer"
        ><Icon name="code" :size="18" />{{ t.code }}</a
      >
    </div>
    <button
      class="case-toggle"
      :aria-expanded="expanded"
      :aria-controls="`case-${project.id}`"
      @click="expanded = !expanded"
    >
      <span>{{ t.case }}</span
      ><Icon :name="expanded ? 'close' : 'plus'" :size="19" />
    </button>
    <div v-if="expanded" :id="`case-${project.id}`" class="case-content">
      <p class="eyebrow">{{ t.challenge }}</p>
      <p>{{ copy.challenge }}</p>
      <p class="eyebrow case-subheading">{{ t.decision }}</p>
      <div class="case-decision" v-for="(decision, i) in copy.decisions" :key="decision[0]">
        <span>0{{ i + 1 }}</span>
        <div>
          <h4>{{ decision[0] }}</h4>
          <p>{{ decision[1] }}</p>
        </div>
      </div>
      <p class="scope">
        <strong>{{ t.scope }}.</strong> {{ copy.scope }}
      </p>
    </div>
  </article>
</template>
