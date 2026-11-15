(() => {
  // События для подключения аналитики через Google Tag Manager.
  // Пока счётчики не установлены, события остаются локальными в dataLayer.
  window.dataLayer = window.dataLayer || [];
  const trackEvent = (event, parameters = {}) => {
    window.dataLayer.push({ event, ...parameters });
  };

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
    if (open) mobileGroupToggle?.focus();
    else toggle.focus();
  };
  toggle?.addEventListener('click', () => {
    const opening = toggle.getAttribute('aria-expanded') !== 'true';
    setMenuOpen(opening);
    if (opening) trackEvent('mobile_menu_open');
  });
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
      const dropdownWasOpen = dropdown?.classList.contains('is-open');
      if (mobileNav?.classList.contains('open')) setMenuOpen(false);
      dropdown?.classList.remove('is-open');
      dropdownToggle?.setAttribute('aria-expanded', 'false');
      if (dropdownWasOpen && toggle?.getAttribute('aria-expanded') !== 'true') dropdownToggle?.focus();
    }
    if (event.key === 'Tab' && mobileNav?.classList.contains('open')) {
      const focusable = [...mobileNav.querySelectorAll('a[href],button:not([disabled])')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  const updateHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 24);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
    link.addEventListener('click', () => trackEvent('phone_click', {
      page_path: window.location.pathname,
      link_location: link.closest('header') ? 'header' : link.closest('footer') ? 'footer' : 'content'
    }));
  });

  document.querySelectorAll('a[href*="#contacts"],a[href*="#project-studio"]').forEach((link) => {
    link.addEventListener('click', () => trackEvent('contact_cta_click', {
      page_path: window.location.pathname,
      destination: link.href.includes('#project-studio') ? 'project_planner' : 'contacts'
    }));
  });

  const plannerObjectOptions = [...document.querySelectorAll('[data-planner-group="object"]')].map((button) => button.dataset.value);
  const requestedObject = new URLSearchParams(window.location.search).get('object');
  const plannerState = {
    object: plannerObjectOptions.includes(requestedObject) ? requestedObject : 'Квартира',
    scope: 'Комплексный ремонт',
    condition: 'Новостройка / без отделки'
  };
  const plannerTitle = document.querySelector('#planner-title');
  const plannerSummary = document.querySelector('#planner-summary');
  const plannerChecklist = document.querySelector('#planner-checklist');
  const checklistFor = (object, scope, condition) => {
    const base = ['Площадь и планировку объекта', 'Состав помещений и работ', 'Пожелания к материалам и результату'];
    if (object === 'Ванная комната' || object === 'Санузел') return ['Размеры и текущее состояние помещения', 'Состояние поверхностей и существующая отделка', 'Материалы и желаемый результат'];
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
      trackEvent('planner_option_select', { option_group: group, option_value: button.dataset.value });
      document.querySelectorAll('[data-planner-group="' + group + '"]').forEach((option) => option.setAttribute('aria-pressed', String(option === button)));
      renderPlanner();
    });
  });
  document.querySelectorAll('[data-planner-group]').forEach((button) => {
    const group = button.dataset.plannerGroup;
    button.setAttribute('aria-pressed', String(button.dataset.value === plannerState[group]));
  });
  renderPlanner();

  const plannerShare = document.querySelector('#planner-share');
  const plannerShareStatus = document.querySelector('#planner-share-status');
  const buildPlannerBrief = () => {
    const checklist = checklistFor(plannerState.object, plannerState.scope, plannerState.condition);
    return [
      'Здравствуйте! Хочу обсудить ремонт / отделку.',
      '',
      'Объект: ' + plannerState.object,
      'Объём работ: ' + plannerState.scope,
      'Состояние: ' + plannerState.condition,
      '',
      'Что нужно уточнить:',
      ...checklist.map((item) => '— ' + item),
      '',
      'Сайт: https://marcostavar24633-cyber.github.io/remont/'
    ].join('\n');
  };
  const photoInput = document.querySelector('#planner-photos-input');
  const photoPreview = document.querySelector('#planner-photos-preview');
  const photoClear = document.querySelector('#planner-photos-clear');
  const selectedPhotos = [];
  const revokePhotoUrls = () => selectedPhotos.forEach((photo) => URL.revokeObjectURL(photo.url));
  const renderPhotoPreviews = () => {
    if (!photoPreview || !photoClear) return;
    photoPreview.replaceChildren(...selectedPhotos.map((photo) => {
      const figure = document.createElement('figure');
      figure.className = 'planner-photo-item';
      const image = document.createElement('img');
      image.src = photo.url;
      image.alt = photo.file.name;
      const caption = document.createElement('figcaption');
      caption.textContent = photo.file.name;
      figure.append(image, caption);
      return figure;
    }));
    photoClear.hidden = selectedPhotos.length === 0;
  };
  photoInput?.addEventListener('change', () => {
    if (plannerShareStatus) plannerShareStatus.textContent = '';
    revokePhotoUrls();
    selectedPhotos.length = 0;
    const files = Array.from(photoInput.files || []);
    const valid = files.filter((file) => file.type.startsWith('image/') && file.size <= 10 * 1024 * 1024);
    if (files.length > 5 || valid.length !== files.length) {
      if (plannerShareStatus) plannerShareStatus.textContent = 'Можно выбрать до 5 изображений. Каждый файл должен быть не больше 10 МБ. Проверьте выбор.';
      photoInput.value = '';
      renderPhotoPreviews();
      return;
    }
    valid.forEach((file) => selectedPhotos.push({ file, url: URL.createObjectURL(file) }));
    trackEvent('planner_photos_select', { photo_count: selectedPhotos.length });
    renderPhotoPreviews();
    if (plannerShareStatus && selectedPhotos.length) plannerShareStatus.textContent = 'Выбрано фотографий: ' + selectedPhotos.length + '. Они не загружаются на сайт.';
  });
  photoClear?.addEventListener('click', () => {
    revokePhotoUrls();
    selectedPhotos.length = 0;
    trackEvent('planner_photos_clear');
    if (photoInput) photoInput.value = '';
    renderPhotoPreviews();
    if (plannerShareStatus) plannerShareStatus.textContent = 'Фотографии удалены из брифа.';
  });
  window.addEventListener('pagehide', revokePhotoUrls);

  plannerShare?.addEventListener('click', async () => {
    const text = buildPlannerBrief();
    const files = selectedPhotos.map((photo) => photo.file);
    if (plannerShareStatus) plannerShareStatus.textContent = '';
    if (files.length && navigator.share && navigator.canShare) {
      try {
        const shareData = { title: 'Бриф на ремонт — Дом Ульяновск', text, files };
        if (navigator.canShare({ files })) {
          await navigator.share(shareData);
          trackEvent('planner_share_complete', { share_method: 'native_share', photo_count: files.length });
          if (plannerShareStatus) plannerShareStatus.textContent = 'Открыто меню отправки. Проверьте выбранные фотографии и подтвердите отправку в приложении.';
          return;
        }
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    } else if (!files.length && navigator.share) {
      try {
        await navigator.share({ title: 'Бриф на ремонт — Дом Ульяновск', text });
        trackEvent('planner_share_complete', { share_method: 'native_share', photo_count: 0 });
        if (plannerShareStatus) plannerShareStatus.textContent = 'Открыто меню отправки.';
        return;
      } catch (error) {
        if (error?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      trackEvent('planner_share_complete', { share_method: 'clipboard', photo_count: files.length });
      if (plannerShareStatus) plannerShareStatus.textContent = files.length
        ? 'Текст брифа скопирован. Браузер не поддерживает отправку фотографий из этого окна — прикрепите выбранные изображения вручную в мессенджере.'
        : 'Бриф скопирован. Вставьте его в удобный мессенджер.';
    } catch {
      if (plannerShareStatus) plannerShareStatus.textContent = files.length
        ? 'Не удалось передать файлы. Позвоните по кнопке выше и прикрепите фотографии вручную в мессенджере.'
        : 'Не удалось открыть отправку или скопировать текст. Можно позвонить по кнопке выше.';
    }
  });

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
    if (typeof gallery.showModal === 'function') {
      gallery.showModal();
      trackEvent('portfolio_image_open');
    }
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
  document.querySelectorAll('.faq-item').forEach((item) => {
    item.addEventListener('toggle', () => {
      if (item.open) trackEvent('faq_open');
    });
  });

  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); currentObserver.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    document.querySelectorAll('.service-card,.step,.portfolio-item,.faq-item,.contact-panel,.detail-card,.intro-grid > div,.section-heading,.studio-heading,.process-grid > div,.cta-inner > div').forEach((item) => {
      item.classList.add('reveal'); observer.observe(item);
    });
  }
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();