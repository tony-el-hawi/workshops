/* =========================================================
   Atelier Boussole FinOps (FR)
   Interactive behaviour: nav, expand, progress, copy
   ========================================================= */

(() => {
  const STORAGE_KEY = 'aws-boussole-finops-workshop-state-v1';

  // ---------- state ----------
  const loadState = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    } catch { return {}; }
  };
  const saveState = (state) => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch { /* private browsing, etc. */ }
  };
  let state = loadState();
  state.completed = state.completed || {};
  state.expanded  = state.expanded  || {};

  // ---------- expand / collapse detailed instructions ----------
  document.querySelectorAll('.expand-toggle').forEach((btn) => {
    const targetId = btn.getAttribute('aria-controls');
    const target = document.getElementById(targetId);
    if (!target) return;

    // Restore state
    if (state.expanded[targetId]) {
      target.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      btn.querySelector('.label-text').textContent = 'Masquer les instructions détaillées';
    }

    btn.addEventListener('click', () => {
      const isOpen = target.classList.toggle('open');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      btn.querySelector('.label-text').textContent = isOpen
        ? 'Masquer les instructions détaillées'
        : 'Afficher les instructions détaillées';
      state.expanded[targetId] = isOpen;
      saveState(state);
    });
  });

  // ---------- task completion ----------
  const navLinks = document.querySelectorAll('.nav-list a[data-task]');
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
    const taskId = btn.dataset.task;

    if (state.completed[taskId]) {
      btn.classList.add('completed');
      btn.querySelector('.label-text').textContent = 'Tâche terminée';
      const navItem = document.querySelector(`.nav-list a[data-task="${taskId}"]`);
      if (navItem) navItem.classList.add('completed');
    }

    btn.addEventListener('click', () => {
      const isComplete = btn.classList.toggle('completed');
      btn.querySelector('.label-text').textContent = isComplete
        ? 'Tâche terminée'
        : 'Marquer comme terminée';
      state.completed[taskId] = isComplete;
      saveState(state);

      const navItem = document.querySelector(`.nav-list a[data-task="${taskId}"]`);
      if (navItem) navItem.classList.toggle('completed', isComplete);

      updateProgress();
      if (isComplete) showToast(`Tâche ${taskId} marquée comme terminée`);
    });
  });

  updateProgress();

  // ---------- reset progress ----------
  const resetBtn = document.querySelector('.btn-reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (!confirm('Réinitialiser votre progression ? Les tâches cochées seront décochées.')) return;
      state = { completed: {}, expanded: state.expanded };
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

  // ---------- copy-to-clipboard ----------
  document.querySelectorAll('.copyable').forEach((el) => {
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('title', 'Cliquer pour copier');

    const doCopy = async () => {
      const text = el.dataset.copy || el.textContent.trim();
      try {
        await navigator.clipboard.writeText(text);
        el.classList.add('copied');
        showToast(`Copié : ${text.length > 60 ? text.slice(0, 60) + '…' : text}`);
        setTimeout(() => el.classList.remove('copied'), 1400);
      } catch {
        showToast('Impossible de copier dans le presse-papiers');
      }
    };

    el.addEventListener('click', doCopy);
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); doCopy(); }
    });
  });

  // ---------- copy: code blocks (TODO snippets, test events) ----------
  document.querySelectorAll('.code-copy').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const block = btn.closest('.code-block');
      const code = block ? block.querySelector('pre') : null;
      const text = code ? code.innerText : '';
      try {
        await navigator.clipboard.writeText(text);
        btn.classList.add('copied');
        const orig = btn.textContent;
        btn.textContent = 'Copié ✓';
        showToast('Code copié dans le presse-papiers');
        setTimeout(() => { btn.classList.remove('copied'); btn.textContent = orig; }, 1600);
      } catch {
        showToast('Impossible de copier dans le presse-papiers');
      }
    });
  });

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

  // ---------- mobile nav ----------
  const menuToggle = document.querySelector('.menu-toggle');
  const sideNav = document.querySelector('.side-nav');
  if (menuToggle && sideNav) {
    menuToggle.addEventListener('click', () => {
      sideNav.classList.toggle('open');
    });
    document.querySelectorAll('.nav-list a').forEach((a) => {
      a.addEventListener('click', () => sideNav.classList.remove('open'));
    });
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
    const observer = new IntersectionObserver((entries) => {
      // pick the entry closest to the top of viewport
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length) setActive(visible[0].target.id);
    }, { rootMargin: '-90px 0px -60% 0px', threshold: 0 });

    sections.forEach((s) => observer.observe(s));
  }

  // ---------- year ----------
  const yr = document.querySelector('.year');
  if (yr) yr.textContent = new Date().getFullYear();
})();
