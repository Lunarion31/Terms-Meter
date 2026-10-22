(async () => {
  if (document.querySelector('terms-meter-widget')) return;
  const dismissalKey = `dismissed:${location.hostname.toLowerCase().replace(/^www\./, '')}`;
  try {
    const saved = await chrome.storage.local.get(dismissalKey);
    if (saved[dismissalKey]) return;
  } catch { /* Show the meter if storage is temporarily unavailable. */ }
  if (document.querySelector('terms-meter-widget')) return;
  const host = document.createElement('terms-meter-widget');
  host.style.cssText = 'all:initial!important;position:fixed!important;top:18px!important;right:18px!important;z-index:2147483647!important;display:block!important;width:min(132px,calc(100vw - 36px))!important;';
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const syncMotion = () => host.style.setProperty('transition', motion.matches ? 'none' : 'width 320ms cubic-bezier(.22, 1, .36, 1)', 'important');
  syncMotion();
  motion.addEventListener('change', syncMotion);
  const root = host.attachShadow({ mode: 'closed' });
  root.innerHTML = `
    <style>
      :host{color-scheme:light}*{box-sizing:border-box}section{font:13px/1.45 system-ui,sans-serif;color:#24332e;background:#fffefa;border:1px solid #dedfd5;border-radius:24px;box-shadow:0 4px 20px #152a2020;overflow:hidden}
      button{font:inherit;color:inherit;cursor:pointer}.pill{display:flex;align-items:center;gap:10px;width:100%;height:34px;padding:0 12px;border:0;background:transparent;text-align:left;border-radius:24px}.pill:hover{background:#f3f4ed}.score{font-size:16px;font-weight:750;letter-spacing:-.7px;min-width:22px;text-align:center}
      .bar{flex:1;height:6px;border-radius:9px;background:linear-gradient(90deg,#e34c4c,#eaa54b,#d5cb55,#80b968,#31a878);position:relative}.bar.pending{opacity:.4}.pin{position:absolute;top:-3px;width:3px;height:12px;background:#24332e;border:1px solid white;border-radius:4px;transform:translateX(-50%)}
      .reveal{display:grid;grid-template-rows:0fr;opacity:0;visibility:hidden;transition:grid-template-rows 320ms cubic-bezier(.22,1,.36,1),opacity 180ms ease,visibility 0s 320ms}.reveal.open{grid-template-rows:1fr;opacity:1;visibility:visible;transition:grid-template-rows 320ms cubic-bezier(.22,1,.36,1),opacity 240ms ease 70ms,visibility 0s}.clip{min-height:0;overflow:hidden}.details{width:min(262px,calc(100vw - 38px));padding:0 17px 17px}@media(prefers-reduced-motion:reduce){.reveal,.reveal.open{transition:none}}.divider{border-top:1px solid #e7e8df;margin-bottom:14px}header{display:flex;justify-content:space-between;align-items:center;font-size:10px;font-weight:750;letter-spacing:1.5px;color:#647268}.close{font-size:20px;border:0;background:transparent;color:#647268;padding:0 3px;line-height:1}
      .site{font-size:16px;font-weight:650;overflow-wrap:anywhere;margin:10px 0 3px}.grade{font-size:12px;color:#526057}.labels{display:flex;justify-content:space-between;font-size:10px;color:#68756c;margin-top:12px}.note{font-size:11px;color:#6e776f;margin:12px 0 8px}a{font-size:12px;color:#315e47;text-underline-offset:3px}:focus-visible{outline:2px solid #238356;outline-offset:-3px}[hidden]{display:none!important}
    </style>
    <section aria-label="Terms of service rating">
      <button class="pill" aria-expanded="false" aria-controls="details" aria-label="Checking terms rating. Expand details" title="Show terms rating details"><span class="score">…</span><span class="bar pending" aria-hidden="true"><span class="pin" hidden></span></span></button>
      <div id="details" class="reveal" inert aria-hidden="true"><div class="clip"><div class="details"><div class="divider"></div><header>TERMS METER<button class="close" aria-label="Dismiss terms meter" title="Hide on this website">×</button></header>
      <div role="status" aria-live="polite"><div class="site"></div><div class="grade">Checking…</div></div>
      <div class="labels"><span>0 · Worse</span><span>Better · 10</span></div>
      <p class="note">Looking up this domain on ToS;DR.</p><a hidden target="_blank" rel="noopener noreferrer">Read the ToS;DR review ↗</a></div></div></div></section>`;
  const pill = root.querySelector('.pill');
  const details = root.querySelector('.reveal');
  let expanded = false;
  let label = 'Checking terms rating';
  function updateLabel() {
    pill.setAttribute('aria-label', `${label}. ${expanded ? 'Collapse' : 'Expand'} details`);
    pill.title = `${expanded ? 'Hide' : 'Show'} terms rating details`;
  }
  function setExpanded(value) {
    expanded = value;
    details.classList.toggle('open', value);
    details.inert = !value;
    details.setAttribute('aria-hidden', String(!value));
    pill.setAttribute('aria-expanded', String(value));
    host.style.setProperty('width', `min(${value ? 264 : 132}px,calc(100vw - 36px))`, 'important');
    updateLabel();
  }
  pill.addEventListener('click', () => setExpanded(!expanded));
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && expanded) {
      event.stopPropagation(); setExpanded(false); pill.focus();
    }
  });
  let dismissing = false;
  root.querySelector('.close').addEventListener('click', async () => {
    if (dismissing) return;
    dismissing = true;
    try {
      await chrome.storage.local.set({ [dismissalKey]: true });
    } catch {
      dismissing = false;
      root.querySelector('.note').textContent = 'Could not remember this dismissal. Please try again.';
      return;
    }
    host.inert = true;
    const animation = root.querySelector('section').animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: motion.matches ? 0 : 650, easing: 'ease-out', fill: 'forwards' }
    );
    await animation.finished.catch(() => {});
    motion.removeEventListener('change', syncMotion);
    host.remove();
  });
  root.querySelector('.site').textContent = location.hostname;
  document.documentElement.append(host);
  function render(result) {
    const rated = result.state === 'rated';
    label = rated ? `Terms rating ${result.score} out of 10` : result.state === 'error' ? 'Terms rating unavailable' : 'Terms unrated';
    root.querySelector('.score').textContent = rated ? String(result.score) : '—';
    root.querySelector('.grade').textContent = rated ? `${result.score} / 10 · ToS;DR Grade ${result.grade}` : result.state === 'error' ? 'Unavailable' : 'Unrated';
    root.querySelector('.bar').classList.toggle('pending', !rated);
    root.querySelector('.pin').hidden = !rated;
    if (rated) root.querySelector('.pin').style.left = `${result.score * 100 / 10}%`;
    root.querySelector('.site').textContent = result.name || location.hostname;
    root.querySelector('.note').textContent = rated
      ? `Converted from ToS;DR’s A–E grades.${result.comprehensive ? '' : ' Review is not comprehensive.'}`
      : result.state === 'error' ? 'Could not reach ToS;DR. Reload to try again.' : 'No rated review found. This does not mean the terms are safe.';
    const link = root.querySelector('a');
    link.hidden = !result.url;
    if (result.url) link.href = result.url;
    updateLabel();
  }
  chrome.runtime.sendMessage({ type: 'terms-rating' }).then(result => render(result || { state: 'error' }), () => render({ state: 'error' }));
})();
