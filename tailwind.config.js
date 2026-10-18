module.exports = {
  content: ['./index.html', './js/app.js'],
  darkMode: 'class',
  theme: { extend: {
    fontFamily: {
      sans: ['-apple-system','BlinkMacSystemFont','"SF Pro Display"','"Inter"','system-ui','sans-serif'],
      mono: ['"SF Mono"','"JetBrains Mono"','ui-monospace','monospace'] },
    colors: { ios: { lightBg:'#F5F5F7', darkBg:'#1C1C1E', black:'#111113', gold:'#B89146', goldBright:'#D4AF37', purple:'#7C3AED' } }
  } }
}
