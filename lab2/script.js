/* =========================================================
   AWS Lab 2 — Serverless Text-to-Speech (FR)
   nav · progress · copy · collapsible code panels
   ========================================================= */

(() => {
  const STORAGE_KEY = 'aws-tts-lab-state-v1';

  const loadState = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
    catch { return {}; }
  };
  const saveState = (s) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
  };
  let state = loadState();
  state.completed = state.completed || {};
  state.codeOpen  = state.codeOpen  || {};

  // ---------- toast ----------
  let toastTimer;
  function showToast(message) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<span class="check">✓</span><span class="msg"></span>';
      document.body.appendChild(toast);
    }
    toast.querySelector('.msg').textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
  }

  // ---------- task completion + progress ----------
  const totalTasks = document.querySelectorAll('.complete-toggle').length;
  const updateProgress = () => {
    const done = Object.values(state.completed).filter(Boolean).length;
    const pct = totalTasks ? Math.round((done / totalTasks) * 100) : 0;
    const fill = document.querySelector('.progress-fill');
    const txt  = document.querySelector('.progress-text');
    if (fill) fill.style.width = pct + '%';
    if (txt) txt.textContent = `${done}/${totalTasks} étapes`;
  };

  document.querySelectorAll('.complete-toggle').forEach((btn) => {
    const id = btn.dataset.task;
    if (state.completed[id]) {
      btn.classList.add('completed');
      btn.querySelector('.label-text').textContent = 'Étape terminée';
      const nav = document.querySelector(`.nav-list a[data-task="${id}"]`);
      if (nav) nav.classList.add('completed');
    }
    btn.addEventListener('click', () => {
      const done = btn.classList.toggle('completed');
      btn.querySelector('.label-text').textContent = done ? 'Étape terminée' : 'Marquer comme terminée';
      state.completed[id] = done;
      saveState(state);
      const nav = document.querySelector(`.nav-list a[data-task="${id}"]`);
      if (nav) nav.classList.toggle('completed', done);
      updateProgress();
      if (done) showToast(`Étape ${id} marquée comme terminée`);
    });
  });
  updateProgress();

  // ---------- reset ----------
  const resetBtn = document.querySelector('.btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Réinitialiser votre progression ?')) return;
      state.completed = {};
      saveState(state);
      document.querySelectorAll('.complete-toggle.completed').forEach((b) => {
        b.classList.remove('completed');
        b.querySelector('.label-text').textContent = 'Marquer comme terminée';
      });
      document.querySelectorAll('.nav-list a.completed').forEach((a) => a.classList.remove('completed'));
      updateProgress();
      showToast('Progression réinitialisée');
    });
  }

  // ---------- copy: inline copyable pills ----------
  document.querySelectorAll('.copyable').forEach((el) => {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('title', 'Cliquer pour copier');
    const doCopy = async () => {
      const text = el.dataset.copy || el.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        el.classList.add('copied');
        showToast(`Copié : ${text.length > 60 ? text.slice(0,60)+'…' : text}`);
        setTimeout(() => el.classList.remove('copied'), 1400);
      } catch { showToast('Copie impossible'); }
    };
    el.addEventListener('click', doCopy);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(); } });
  });

  // ---------- copy: code blocks ----------
  document.querySelectorAll('.code-copy').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const block = btn.closest('.code-block');
      const code = block.querySelector('pre');
      const text = code ? code.innerText : '';
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        const orig = btn.textContent;
        btn.textContent = 'Copié ✓';
        showToast('Code copié dans le presse-papiers');
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = orig; }, 1600);
      } catch { showToast('Copie impossible'); }
    });
  });

  // ---------- collapsible code panels ----------
  document.querySelectorAll('.code-collapse').forEach((panel) => {
    const id = panel.id;
    const head = panel.querySelector('.code-head.toggle');
    if (!head) return;
    if (id && state.codeOpen[id]) panel.classList.add('open');
    head.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (id) { state.codeOpen[id] = open; saveState(state); }
    });
  });

  // ---------- mobile nav ----------
  const menuToggle = document.querySelector('.menu-toggle');
  const sideNav = document.querySelector('.side-nav');
  if (menuToggle && sideNav) {
    menuToggle.addEventListener('click', () => sideNav.classList.toggle('open'));
    document.querySelectorAll('.nav-list a').forEach((a) =>
      a.addEventListener('click', () => sideNav.classList.remove('open')));
  }

  // ---------- scroll-spy ----------
  const sections = Array.from(document.querySelectorAll('section[id]'));
  const navMap = new Map();
  document.querySelectorAll('.nav-list a').forEach((a) => {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('#')) navMap.set(href.slice(1), a);
  });
  const setActive = (id) => {
    document.querySelectorAll('.nav-list a.active').forEach((a) => a.classList.remove('active'));
    const link = navMap.get(id);
    if (link) link.classList.add('active');
  };
  if ('IntersectionObserver' in window && sections.length) {
    const obs = new IntersectionObserver((entries) => {
      const vis = entries.filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis.length) setActive(vis[0].target.id);
    }, { rootMargin: '-90px 0px -60% 0px', threshold: 0 });
    sections.forEach((s) => obs.observe(s));
  }

  // ---------- year ----------
  const yr = document.querySelector('.year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
