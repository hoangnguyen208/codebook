// ========================================
// CodeBook Homepage — Interactive Scripts
// ========================================

(function () {
  // ========================================
  // Chaos Icon Animation
  // ========================================

  const chaosContainer = document.getElementById('chaosContainer');
  if (chaosContainer) {
    const icons = chaosContainer.querySelectorAll('.chaos-icon');
    const mouse = { x: -1000, y: -1000 };

    // Track mouse position relative to chaos container
    chaosContainer.addEventListener('mousemove', function (e) {
      const rect = chaosContainer.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    });

    chaosContainer.addEventListener('mouseleave', function () {
      mouse.x = -1000;
      mouse.y = -1000;
    });

    // Icon state: { el, x, y, vx, vy, baseX, baseY, rotation, scale, targetScale }
    const iconStates = [];
    icons.forEach(function (icon, i) {
      const rect = chaosContainer.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const angle = (i / icons.length) * Math.PI * 2;
      const radius = Math.min(rect.width, rect.height) * 0.28;
      const baseX = cx + Math.cos(angle) * radius;
      const baseY = cy + Math.sin(angle) * radius;

      iconStates.push({
        el: icon,
        x: baseX,
        y: baseY,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        baseX: baseX,
        baseY: baseY,
        rotation: Math.random() * 20 - 10,
        scale: 1,
        targetScale: 1,
      });

      icon.style.transform = 'translate(' + baseX + 'px, ' + baseY + 'px)';
    });

    function animate() {
      const rect = chaosContainer.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const pad = 20; // padding from edges
      const repelRadius = 100;
      const repelStrength = 1.2;

      for (var i = 0; i < iconStates.length; i++) {
        var state = iconStates[i];
        var icon = state.el;
        var size = 48;

        // Gentle spring toward base position
        var springForce = 0.002;
        state.vx += (state.baseX - state.x) * springForce;
        state.vy += (state.baseY - state.y) * springForce;

        // Mouse repel
        var dx = state.x + size / 2 - mouse.x;
        var dy = state.y + size / 2 - mouse.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < repelRadius && dist > 0) {
          var force = (1 - dist / repelRadius) * repelStrength;
          var nx = dx / dist;
          var ny = dy / dist;
          state.vx += nx * force;
          state.vy += ny * force;

          // Scale up slightly when near mouse
          state.targetScale = 1.15;
        } else {
          state.targetScale = 1;
        }

        // Subtle random drift
        state.vx += (Math.random() - 0.5) * 0.06;
        state.vy += (Math.random() - 0.5) * 0.06;

        // Damping
        state.vx *= 0.97;
        state.vy *= 0.97;

        // Speed cap
        var speed = Math.sqrt(state.vx * state.vx + state.vy * state.vy);
        if (speed > 4) {
          state.vx = (state.vx / speed) * 4;
          state.vy = (state.vy / speed) * 4;
        }

        // Update position
        state.x += state.vx;
        state.y += state.vy;

        // Bounce off walls
        if (state.x < pad) { state.x = pad; state.vx *= -0.6; }
        if (state.y < pad) { state.y = pad; state.vy *= -0.6; }
        if (state.x > w - pad - size) { state.x = w - pad - size; state.vx *= -0.6; }
        if (state.y > h - pad - size) { state.y = h - pad - size; state.vy *= -0.6; }

        // Smooth scale interpolation
        state.scale += (state.targetScale - state.scale) * 0.1;

        // Update rotation with subtle drift
        state.rotation += (Math.random() - 0.5) * 0.3;
        state.rotation *= 0.995;

        // Apply transform
        icon.style.transform =
          'translate(' + state.x + 'px, ' + state.y + 'px)' +
          ' rotate(' + state.rotation + 'deg)' +
          ' scale(' + state.scale + ')';
      }

      requestAnimationFrame(animate);
    }

    // Start after a small delay to let layout settle
    requestAnimationFrame(function () {
      requestAnimationFrame(animate);
    });

    // Recalculate base positions on resize
    window.addEventListener('resize', function () {
      var rect = chaosContainer.getBoundingClientRect();
      var cx = rect.width / 2;
      var cy = rect.height / 2;
      var radius = Math.min(rect.width, rect.height) * 0.28;
      for (var i = 0; i < iconStates.length; i++) {
        var angle = (i / iconStates.length) * Math.PI * 2;
        iconStates[i].baseX = cx + Math.cos(angle) * radius;
        iconStates[i].baseY = cy + Math.sin(angle) * radius;
      }
    });
  }

  // ========================================
  // Navbar Scroll Effect
  // ========================================

  var navbar = document.getElementById('navbar');
  if (navbar) {
    window.addEventListener('scroll', function () {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });
  }

  // ========================================
  // Scroll Fade-In
  // ========================================

  var fadeElements = document.querySelectorAll(
    '.feature-card, .ai-content, .ai-demo, .pricing-card, .cta-section h2, .cta-section p, .cta-section .btn'
  );

  // Add fade-in class
  for (var i = 0; i < fadeElements.length; i++) {
    fadeElements[i].classList.add('fade-in');
  }

  var observer = new IntersectionObserver(
    function (entries) {
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].isIntersecting) {
          entries[i].target.classList.add('visible');
          observer.unobserve(entries[i].target);
        }
      }
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  for (var i = 0; i < fadeElements.length; i++) {
    observer.observe(fadeElements[i]);
  }

  // Also animate the hero section elements on load
  var heroElements = document.querySelectorAll('.hero-box, .transform-arrow');
  for (var i = 0; i < heroElements.length; i++) {
    heroElements[i].classList.add('fade-in', 'visible');
    heroElements[i].style.transitionDelay = (i * 0.15) + 's';
  }

  // ========================================
  // Pricing Toggle (Monthly / Yearly)
  // ========================================

  var pricingToggle = document.getElementById('pricingToggle');
  var proPrice = document.getElementById('proPrice');
  var proPeriod = document.getElementById('proPeriod');
  var monthlyLabel = document.getElementById('monthlyLabel');
  var yearlyLabel = document.getElementById('yearlyLabel');

  if (pricingToggle && proPrice && proPeriod) {
    var isYearly = false;

    function updatePricing() {
      if (isYearly) {
        proPrice.textContent = '$72';
        proPeriod.textContent = '/year';
        monthlyLabel.classList.remove('active');
        yearlyLabel.classList.add('active');
      } else {
        proPrice.textContent = '$8';
        proPeriod.textContent = '/month';
        monthlyLabel.classList.add('active');
        yearlyLabel.classList.remove('active');
      }
    }

    pricingToggle.addEventListener('click', function () {
      isYearly = !isYearly;
      pricingToggle.setAttribute('aria-pressed', isYearly ? 'true' : 'false');
      updatePricing();
    });

    // Click on labels also toggles
    var handleLabelClick = function (targetState) {
      return function () {
        if (isYearly !== targetState) {
          isYearly = targetState;
          pricingToggle.setAttribute('aria-pressed', isYearly ? 'true' : 'false');
          updatePricing();
        }
      };
    };

    if (monthlyLabel) monthlyLabel.addEventListener('click', handleLabelClick(false));
    if (yearlyLabel) yearlyLabel.addEventListener('click', handleLabelClick(true));

    // Initial state
    monthlyLabel.classList.add('active');
  }

  // ========================================
  // Copyright Year
  // ========================================

  var yearEl = document.getElementById('copyrightYear');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

})();
