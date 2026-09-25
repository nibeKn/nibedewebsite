<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import meteorData from '../assets/Falling Meteor.json'

const props = defineProps({ playing: Boolean })
const host = ref(null)
const visible = ref(false)
let observer
let animation
let loading
let destroyed = false

function getAnimation() {
  if (animation) return Promise.resolve(animation)
  if (!loading) {
    loading = import('lottie-web/build/player/lottie_light.min.js')
      .then(({ default: lottie }) => {
        if (destroyed || !host.value) return null
        animation = lottie.loadAnimation({
          container: host.value,
          renderer: 'svg',
          loop: true,
          autoplay: false,
          animationData: meteorData,
          rendererSettings: { preserveAspectRatio: 'xMidYMin slice' },
        })
        animation.setSpeed(0.5)
        return animation
      })
      .catch(() => null)
  }
  return loading
}

async function syncPlayback() {
  const shouldPlay = visible.value && props.playing && !document.hidden && !destroyed
  if (!shouldPlay) {
    animation?.pause()
    return
  }
  const current = await getAnimation()
  if (visible.value && props.playing && !document.hidden && !destroyed) current?.play()
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
  observer.observe(host.value)
  document.addEventListener('visibilitychange', syncPlayback)
})
onBeforeUnmount(() => {
  destroyed = true
  observer?.disconnect()
  document.removeEventListener('visibilitychange', syncPlayback)
  animation?.destroy()
})
</script>

<template>
  <div ref="host" class="contact-meteors" aria-hidden="true"></div>
</template>
