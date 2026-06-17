// Builds the sandboxed-iframe document that renders generated React+Tailwind code.
// Security: the iframe uses sandbox="allow-scripts" only (no allow-same-origin),
// so generated code runs in an opaque origin and cannot touch the parent app.
// Libraries are served locally from /vendor (see frontend/public/vendor) so the
// preview is self-contained — no external CDN dependency.

export function sanitizeCode(raw: string): string {
  let code = raw.trim()

  // Prefer the contents of a fenced code block if present.
  const fence = code.match(/```(?:jsx|tsx|js|javascript|react)?\s*([\s\S]*?)```/i)
  if (fence) code = fence[1]
  code = code.replace(/```/g, '')

  // Defensive: the preview provides React as a global, so strip module syntax.
  // Multi-line imports first — the line filters below only catch single-line ones, and a
  // surviving `import {\n ...\n} from 'x'` reaches Babel and throws (the react preset keeps ESM).
  code = code.replace(/import\s+[\s\S]*?\sfrom\s+['"][^'"]+['"]\s*;?/g, '')
  code = code.replace(/^\s*import\s+['"][^'"]+['"]\s*;?/gm, '')
  code = code
    .split('\n')
    .filter((l) => !/^\s*import\s.+from\s.+;?\s*$/.test(l))
    .filter((l) => !/^\s*import\s+['"][^'"]+['"]\s*;?\s*$/.test(l))
    .join('\n')
  code = code.replace(/^\s*export\s+default\s+App\s*;?\s*$/m, '')
  code = code.replace(/\bexport\s+default\s+/g, '')
  code = code.replace(/^\s*export\s+(?=(function|const|class)\b)/gm, '')

  return code.trim()
}

function vendorBase(): string {
  // Same origin as the app page, so it works through tunnels / LAN too.
  if (typeof window !== 'undefined' && window.location?.origin) return window.location.origin
  return ''
}

export function buildSrcDoc(rawCode: string): string {
  // Escape every "<" so a literal </script> (or <!--) in the generated code can't end this
  // inline <script> early and break the preview. < decodes back to "<" at runtime, so
  // Babel still receives valid JSX.
  const codeJson = JSON.stringify(sanitizeCode(rawCode)).replace(/</g, '\\u003c')
  const base = vendorBase()
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<script src="${base}/vendor/react.js"></script>
<script src="${base}/vendor/react-dom.js"></script>
<script src="${base}/vendor/tailwind.js"></script>
<script src="${base}/vendor/babel.js"></script>
<style>html,body{margin:0;padding:0}#root{min-height:100vh}</style>
</head>
<body>
<div id="root"></div>
<script>
(function () {
  function esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}
  function showError(msg){
    try { parent.postMessage({ source: 'voicecraft-preview', type: 'error', message: String(msg) }, '*') } catch (e) {}
    var r = document.getElementById('root')
    if (r) r.innerHTML = '<div style="padding:20px;font-family:ui-sans-serif,system-ui;color:#b91c1c;white-space:pre-wrap">Preview error:\\n' + esc(msg) + '</div>'
  }
  window.addEventListener('error', function (ev) { showError(ev.message || 'script error') })
  function boot(){
    if (!window.React || !window.ReactDOM || !window.Babel) {
      showError('Preview libraries failed to load from /vendor.'); return
    }
    try {
      var code = ${codeJson}
      var out = Babel.transform(code, { presets: ['react'] }).code
      var factory = new Function('React','useState','useEffect','useRef','useMemo','useCallback', out + '\\n; return typeof App !== "undefined" ? App : null;')
      var App = factory(React, React.useState, React.useEffect, React.useRef, React.useMemo, React.useCallback)
      if (!App) { showError('No component named "App" was produced.'); return }
      class ErrorBoundary extends React.Component {
        constructor(p){ super(p); this.state = { err: null } }
        static getDerivedStateFromError(e){ return { err: e } }
        componentDidCatch(e){ showError((e && e.message) || e) }
        render(){ return this.state.err ? null : this.props.children }
      }
      var root = ReactDOM.createRoot(document.getElementById('root'))
      root.render(React.createElement(ErrorBoundary, null, React.createElement(App)))
      parent.postMessage({ source: 'voicecraft-preview', type: 'ok' }, '*')
    } catch (e) {
      var m = String((e && e.message) || e)
      if (/Unterminated|Unexpected end|Unexpected token/i.test(m)) {
        showError('The generated design was cut off before it finished. Click Generate again, or try a simpler request.')
      } else { showError(m) }
    }
  }
  // Scripts are non-async and ordered, so they're ready by the time this runs.
  if (window.Babel) boot(); else window.addEventListener('load', boot)
})()
</script>
</body>
</html>`
}
