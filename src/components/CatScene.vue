<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { media } from '../data/content'

const props = defineProps({
  variant: { type: String, default: 'coast' },
  playing: Boolean,
  label: String,
  eager: Boolean,
  photo: { type: Boolean, default: true },
})
const scenes = {
  coast: { bg: 'coast.webp', cat: 1, poster: 'cat-1.webp' },
  studio: { bg: 'studio.webp', cat: 2, poster: 'cat-2.png' },
  night: { cat: 4, poster: 'cat-4.png' },
}
const scene = scenes[props.variant]
const root = ref(null)
const video = ref(null)
const visible = ref(false)
const requested = ref(false)
const ready = ref(false)
const failed = ref(false)
let observer

async function syncPlayback() {
  if (visible.value && props.playing && !document.hidden && !failed.value) {
    requested.value = true
    await nextTick()
    try {
      await video.value?.play()
    } catch {}
  } else video.value?.pause()
}

watch(() => props.playing, syncPlayback)
onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      visible.value = entry.intersectionRatio >= 0.25
      syncPlayback()
    },
    { threshold: [0, 0.25] },
  )
  observer.observe(root.value)
  document.addEventListener('visibilitychange', syncPlayback)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  document.removeEventListener('visibilitychange', syncPlayback)
})
</script>

<template>
  <div
    ref="root"
    class="cat-scene"
    :class="[`scene-${variant}`, { 'scene-no-photo': !photo }]"
    :role="variant === 'night' && photo ? 'group' : 'img'"
    :aria-label="label"
  >
    <img
      v-if="photo"
      class="scene-photo"
      :src="media(scene.bg)"
      alt=""
      :loading="eager ? 'eager' : 'lazy'"
      :fetchpriority="eager ? 'high' : 'auto'"
      width="1536"
      height="2048"
    />
    <div class="scene-character" aria-hidden="true">
      <img
        v-show="!ready || failed"
        class="cat-poster"
        :src="media(scene.poster)"
        alt=""
        :loading="eager ? 'eager' : 'lazy'"
      />
      <video
        v-if="requested && !failed"
        v-show="ready"
        ref="video"
        :src="media(`cat-${scene.cat}.webm`)"
        muted
        playsinline
        loop
        preload="none"
        tabindex="-1"
        @playing="ready = true"
        @error="failed = true"
      ></video>
    </div>
    <slot />
  </div>
</template>
