export function resolveLocale(savedChoice, browserLanguage) {
  if (savedChoice === 'es' || savedChoice === 'en') return savedChoice
  return String(browserLanguage ?? '')
    .trim()
    .toLowerCase()
    .split(/[-_]/)[0] === 'es'
    ? 'es'
    : 'en'
}
