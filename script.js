(() => {
  const header = document.querySelector('.header');
  const toggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  const dropdown = document.querySelector('.nav-dropdown');
  const dropdownToggle = document.querySelector('.nav-dropdown-toggle');
  const mobileGroup = document.querySelector('.mobile-nav-group');
  const mobileGroupToggle = document.querySelector('.mobile-nav-group-toggle');

  const setMenuOpen = (open) => {
    if (!toggle || !mobileNav || !header) return;
    mobileNav.classList.toggle('open', open);
    header.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('navigation-open', open);
  };
  toggle?.addEventListener('click', () => setMenuOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  mobileNav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenuOpen(false)));
  dropdownToggle?.addEventListener('click', () => {
    const open = dropdownToggle.getAttribute('aria-expanded') !== 'true';
    dropdown?.classList.toggle('is-open', open);
    dropdownToggle.setAttribute('aria-expanded', String(open));
  });
  mobileGroupToggle?.addEventListener('click', () => {
    const open = mobileGroupToggle.getAttribute('aria-expanded') !== 'true';
    mobileGroup?.classList.toggle('is-open', open);
    mobileGroupToggle.setAttribute('aria-expanded', String(open));
    mobileGroupToggle.querySelector('span').textContent = open ? '−' : '＋';
  });
  document.addEventListener('click', (event) => {
    if (dropdown && !dropdown.contains(event.target)) {
      dropdown.classList.remove('is-open');
      dropdownToggle?.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setMenuOpen(false);
      dropdown?.classList.remove('is-open');
      dropdownToggle?.setAttribute('aria-expanded', 'false');
    }
  });
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  const plannerState = { object: 'Квартира', scope: 'Комплексный ремонт', condition: 'Новостройка / без отделки' };
  const plannerTitle = document.querySelector('#planner-title');
  const plannerSummary = document.querySelector('#planner-summary');
  const plannerChecklist = document.querySelector('#planner-checklist');
  const checklistFor = (object, scope, condition) => {
    const base = ['Площадь и планировку объекта', 'Состав помещений и работ', 'Пожелания к материалам и результату'];
    if (object === 'Ванная комната' || object === 'Санузел') return ['Размеры и текущее состояние помещения', 'Сантехнику, коммуникации и отделку', 'Материалы и желаемый результат'];
    if (object === 'Частный дом') return ['Площадь и состояние дома', 'Какие помещения и зоны входят в задачу', 'Материалы, этапность и доступ к объекту'];
    if (scope === 'Отдельные работы') return ['Какие конкретно работы нужны', 'Состояние поверхностей и основания', 'Необходимые материалы и подготовку'];
    if (condition === 'Вторичное жильё') return ['Что требуется демонтировать или сохранить', 'Состояние инженерных систем и отделки', 'Порядок работ и подготовку помещений'];
    return base;
  };
  const renderPlanner = () => {
    if (!plannerTitle || !plannerSummary || !plannerChecklist) return;
    plannerTitle.textContent = plannerState.object === 'Квартира' ? 'Ремонт квартиры' : plannerState.object === 'Частный дом' ? 'Отделка частного дома' : plannerState.object;
    plannerSummary.textContent = [plannerState.scope, plannerState.condition].join(' · ');
    plannerChecklist.replaceChildren(...checklistFor(plannerState.object, plannerState.scope, plannerState.condition).map((item) => {
      const li = document.createElement('li'); li.textContent = item; return li;
    }));
  };
  document.querySelectorAll('[data-planner-group]').forEach((button) => {
    button.addEventListener('click', () => {
      const group = button.dataset.plannerGroup;
      plannerState[group] = button.dataset.value;
      document.querySelectorAll('[data-planner-group="' + group + '"]').forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
      renderPlanner();
    });
  });
  renderPlanner();

  const gallery = document.querySelector('.gallery-lightbox');
  const galleryImage = gallery?.querySelector('.gallery-lightbox-image');
  const galleryCaption = gallery?.querySelector('.gallery-lightbox-caption');
  const galleryClose = gallery?.querySelector('.gallery-close');
  let lastGalleryTrigger = null;
  const openGallery = (image) => {
    if (!gallery || !galleryImage) return;
    lastGalleryTrigger = image;
    galleryImage.src = image.currentSrc || image.src;
    galleryImage.alt = image.alt;
    if (galleryCaption) galleryCaption.textContent = image.alt;
    if (typeof gallery.showModal === 'function') gallery.showModal();
  };
  document.querySelectorAll('.portfolio-grid img[role="button"]').forEach((image) => {
    image.addEventListener('click', () => openGallery(image));
    image.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openGallery(image); }
    });
  });
  galleryClose?.addEventListener('click', () => gallery.close());
  gallery?.addEventListener('click', (event) => { if (event.target === gallery) gallery.close(); });
  gallery?.addEventListener('close', () => lastGalleryTrigger?.focus());

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); currentObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    document.querySelectorAll('.service-card,.step,.portfolio-item,.faq-item,.contact-panel,.detail-card').forEach((item) => {
      item.classList.add('reveal'); observer.observe(item);
    });
  }
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();