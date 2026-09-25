<script setup>
defineProps({
  name: { type: String, default: 'arrow' },
  size: { type: [Number, String], default: 20 },
})
const paths = {
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  diagonal: 'M6 18 18 6M6 6h12v12',
  down: 'M12 4v16m-6-6 6 6 6-6',
  up: 'M12 20V4m-6 6 6-6 6 6',
  plus: 'M12 5v14M5 12h14',
  close: 'm6 6 12 12M6 18 18 6',
  play: 'm8 5 11 7-11 7Z',
  code: 'm8 7-5 5 5 5m8-10 5 5-5 5m-3-13-2 16',
  menu: 'M4 8h16M4 16h16',
}
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="paths[name] || paths.arrow" />
  </svg>
</template>
