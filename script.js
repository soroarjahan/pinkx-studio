/* ═══════════════════════════════════════════════════════════════
   PinkX Studio — script.js
   All interactivity: nav, canvas, scroll, pricing, forms, modals,
   testimonials carousel, FAQ accordion
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ── Constants ──────────────────────────────────────────────── */
const USD_TO_BDT = 110;

// Base pricing: [minUSD, maxUSD]
const BASE_PRICES = {
  logo:         [50,  200],
  brand:        [200, 800],
  web:          [300, 1200],
  uiux:         [250, 1000],
  social:       [40,  150],
  motion:       [150, 600],
  video:        [80,  500],
  packaging:    [120, 500],
  presentation: [80,  350],
  marketing:    [40,  200],
};

const COMPLEXITY_MULTIPLIERS = { basic: 1, standard: 1.8, advanced: 3.2 };
const EXPRESS_SURCHARGE = 0.30;

/* ── State ──────────────────────────────────────────────────── */
let currentCurrency = 'usd';
let selectedComplexity = 'basic';
let selectedDelivery = 'standard';

/* ═══════════════════════════════════════════════════════════════
   1. HERO CANVAS — Particle / Grid Background
═══════════════════════════════════════════════════════════════ */
(function initCanvas() {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let W, H, particles;

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  }

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.pink  = Math.random() > 0.75;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.pink ? '#ff2e93' : '#ffffff';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function createParticles() {
    const isMobile = window.innerWidth < 768;
    const maxParticles = isMobile ? 40 : 120;
    const count = Math.floor((W * H) / (isMobile ? 14000 : 8000));
    particles = Array.from({ length: Math.min(count, maxParticles) }, () => new Particle());
  }

  function drawConnections() {
    const maxDist = 120;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          const alpha = (1 - dist / maxDist) * 0.08;
          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = '#ff2e93';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
          ctx.restore();
        }
      }
    }
  }

  let rafId;
  function animate() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    rafId = requestAnimationFrame(animate);
  }

  // Pause when tab is not visible to save CPU/battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      animate();
    }
  });

  window.addEventListener('resize', () => { resize(); createParticles(); });
  resize();
  createParticles();
  animate();
})();

/* ═══════════════════════════════════════════════════════════════
   2. NAVIGATION
═══════════════════════════════════════════════════════════════ */
(function initNav() {
  const nav        = document.getElementById('nav');
  const hamburger  = document.getElementById('hamburger');
  const navLinks   = document.getElementById('navLinks');
  const links      = navLinks.querySelectorAll('.nav__link');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 40);
    updateActiveLink();
  }, { passive: true });

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    navLinks.classList.toggle('open');
    document.body.style.overflow = navLinks.classList.contains('open') ? 'hidden' : '';
  });

  links.forEach(link => {
    link.addEventListener('click', () => {
      hamburger.classList.remove('open');
      navLinks.classList.remove('open');
      document.body.style.overflow = '';
    });
  });

  function updateActiveLink() {
    const sections = document.querySelectorAll('section[id]');
    let current = '';
    sections.forEach(sec => {
      if (window.scrollY >= sec.offsetTop - 120) current = sec.id;
    });
    links.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }

  updateActiveLink();
})();

/* ═══════════════════════════════════════════════════════════════
   3. SCROLL REVEAL — with idle callback for performance
═══════════════════════════════════════════════════════════════ */
(function initReveal() {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Use requestIdleCallback if available for smoother scrolling
        const reveal = () => {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        };
        if ('requestIdleCallback' in window) {
          requestIdleCallback(reveal, { timeout: 300 });
        } else {
          reveal();
        }
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => obs.observe(el));
})();

/* ═══════════════════════════════════════════════════════════════
   4. STAT COUNTER ANIMATION
═══════════════════════════════════════════════════════════════ */
(function initCounters() {
  const counters = document.querySelectorAll('.stat__num[data-target]');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const target = parseInt(el.dataset.target, 10);
      const dur    = 1800;
      const step   = 30;
      const inc    = target / (dur / step);
      let current  = 0;

      const timer = setInterval(() => {
        current += inc;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = Math.floor(current);
      }, step);

      obs.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(c => obs.observe(c));
})();

/* ═══════════════════════════════════════════════════════════════
   5. SCROLL TO TOP
═══════════════════════════════════════════════════════════════ */
(function initScrollTop() {
  const btn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();

/* ═══════════════════════════════════════════════════════════════
   6. SMOOTH SCROLL HELPER
═══════════════════════════════════════════════════════════════ */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10);
  window.scrollTo({ top: el.offsetTop - navH, behavior: 'smooth' });
}

/* ═══════════════════════════════════════════════════════════════
   SERVICE PRICING DATA
═══════════════════════════════════════════════════════════════ */
const SERVICE_PRICING = {
  social: {
    name: 'Social Media Design',
    description: 'Scroll-stopping visual content for all your social platforms — built for engagement, consistency, and brand impact.',
    cycle: '/month',
    plans: {
      starter: {
        price: 49, bdt: 5390,
        features: ['8 posts/month', 'Instagram & Facebook', '2 story templates', 'Platform-ready PNG files', '2 revision rounds', 'Brand-consistent style']
      },
      growth: {
        price: 149, bdt: 16390, popular: true,
        features: ['20 posts/month', 'All platforms (IG, FB, LI, TikTok)', '5 story + 3 reel templates', 'Editable Canva / Figma files', 'Unlimited revisions', 'Monthly content calendar', 'Brand-consistent visuals']
      },
      premium: {
        price: 349, bdt: 38390,
        features: ['40+ posts/month', 'Dedicated social designer', 'Full content calendar & planning', 'Reels + animated stories', 'Unlimited revisions', 'Priority 24h turnaround', 'Monthly performance review']
      }
    }
  },
  marketing: {
    name: 'Marketing Creatives',
    description: 'Banners, ad creatives, email templates, and campaign materials designed to drive clicks, conversions, and results.',
    cycle: 'per project',
    plans: {
      starter: {
        price: 79, bdt: 8690,
        features: ['3 banner ad sizes', '1 email template', 'Web-ready PNG + HTML', '2 revision rounds', 'Single campaign theme', '5-day delivery']
      },
      growth: {
        price: 199, bdt: 21890, popular: true,
        features: ['Full ad campaign set (6 sizes)', '3 email templates', 'Print + digital formats', 'A/B variant designs', 'Unlimited revisions', 'Source files included', '7-day delivery']
      },
      premium: {
        price: 499, bdt: 54890,
        features: ['Complete campaign library', 'Unlimited creatives', 'Animated / motion banner ads', 'Dedicated designer', 'Brand strategy consultation', 'Priority support & 48h turnaround', 'Analytics-ready assets']
      }
    }
  },
  video: {
    name: 'Video Editing',
    description: 'Reels, ad films, YouTube content, and corporate videos — polished to broadcast standard with fast turnaround.',
    cycle: 'per video',
    plans: {
      starter: {
        price: 99, bdt: 10890,
        features: ['Up to 60-second edit', 'Basic colour grading', 'Music & sound design', 'Captions / subtitles', '2 revision rounds', 'MP4 1080p delivery']
      },
      growth: {
        price: 299, bdt: 32890, popular: true,
        features: ['Up to 5-minute edit', 'Pro colour grading & LUT', 'Custom motion text & graphics', 'Music licensing consultation', 'Unlimited revisions', 'All aspect ratio exports', '3-day turnaround']
      },
      premium: {
        price: 699, bdt: 76890,
        features: ['Long-form or series (up to 30 min)', 'Cinematic grade & VFX', 'Custom animated intro / outro', 'Full audio mix & mastering', 'Unlimited revisions', 'All exports (4K, 1080p, vertical)', 'Priority 2-day turnaround']
      }
    }
  },
  logo: {
    name: 'Logo Design',
    description: 'Timeless, versatile marks — wordmarks, lettermarks, icons, and monograms — built to scale across every surface.',
    cycle: 'one-time',
    plans: {
      starter: {
        price: 79, bdt: 8690,
        features: ['2 initial concepts', 'Primary logo only', 'PNG + JPG formats', '3 revision rounds', '5-day delivery', 'Basic usage guidance']
      },
      growth: {
        price: 199, bdt: 21890, popular: true,
        features: ['3 refined concepts', 'Primary + sub-mark variants', 'All colour versions (light/dark)', 'AI, SVG, PNG, PDF files', 'Unlimited revisions', 'Font & colour palette guide', '7-day delivery']
      },
      premium: {
        price: 449, bdt: 49390,
        features: ['5 premium concepts', 'Full logo system (primary, sub-mark, icon, mono)', 'All formats & variants', 'Full brand guidelines mini PDF', 'Unlimited revisions', 'Social profile kit', 'Priority 5-day delivery']
      }
    }
  },
  brand: {
    name: 'Brand Identity',
    description: 'A complete visual identity system — strategy, logo, colour, typography, and guidelines — built to unify your brand at every touchpoint.',
    cycle: 'one-time',
    plans: {
      starter: {
        price: 149, bdt: 16390,
        features: ['Logo design (2 concepts)', 'Primary colour palette', 'Font pairing recommendation', 'Basic brand guide (5 pages)', '3 revision rounds', 'All digital source files']
      },
      growth: {
        price: 499, bdt: 54890, popular: true,
        features: ['Full logo system + variants', 'Complete colour & type system', 'Business stationery design', 'Social media profile kit', 'Brand guidelines PDF (15 pages)', 'Unlimited revisions', 'All source files']
      },
      premium: {
        price: 999, bdt: 109890,
        features: ['Strategic brand positioning', 'Logo system + full iconography', 'Brand voice & tone guide', 'Print + digital collateral suite', 'Comprehensive brand book (30+ pages)', 'Unlimited revisions', 'Priority support & presentation call']
      }
    }
  },
  web: {
    name: 'Website Design & Dev',
    description: 'High-performance, conversion-focused websites — from landing pages to full multi-page applications, responsive and SEO-ready.',
    cycle: 'one-time',
    plans: {
      starter: {
        price: 499, bdt: 54890,
        features: ['Up to 3 pages', 'Mobile-responsive design', 'Contact form integration', 'Basic SEO setup', '3 revision rounds', 'CMS integration (optional)', '14-day delivery']
      },
      growth: {
        price: 999, bdt: 109890, popular: true,
        features: ['Up to 8 pages', 'Custom UI/UX design', 'Blog / portfolio module', 'Full SEO foundation', 'Speed optimisation', 'Unlimited revisions', 'Analytics & tracking setup', '21-day delivery']
      },
      premium: {
        price: 2499, bdt: 274890,
        features: ['Unlimited pages', 'Advanced custom functionality', 'E-commerce integration', 'Performance audit & optimisation', 'Brand-aligned design system', 'Unlimited revisions', 'Priority support + launch review', '30-day delivery']
      }
    }
  },
  motion: {
    name: 'Motion Graphics',
    description: 'Dynamic animated assets — logo reveals, explainer videos, social animations — that make your brand unforgettable in motion.',
    cycle: 'per project',
    plans: {
      starter: {
        price: 199, bdt: 21890,
        features: ['1 animated asset (up to 15s)', 'Logo reveal or text animation', 'MP4 + GIF export', '2 revision rounds', '5-day delivery', 'Social media ready']
      },
      growth: {
        price: 499, bdt: 54890, popular: true,
        features: ['Up to 3 animated assets', 'Custom brand motion system', 'Explainer video (30–60s)', 'Sound design included', 'Unlimited revisions', 'All format exports', '10-day delivery']
      },
      premium: {
        price: 999, bdt: 109890,
        features: ['Full motion brand package', 'Animated intro/outro + transitions', 'Explainer video (up to 2 min)', 'Social reel animation templates', 'Unlimited revisions', '4K export included', 'Priority 7-day delivery']
      }
    }
  },
  packaging: {
    name: 'Packaging Design',
    description: 'Shelf-ready packaging that sells before a word is read — structural dielines, 3D mockups, and print-ready artwork.',
    cycle: 'per SKU',
    plans: {
      starter: {
        price: 149, bdt: 16390,
        features: ['Single product packaging', 'Dieline sourcing & setup', '2D artwork design', 'Print-ready PDF/AI files', '3 revision rounds', '7-day delivery']
      },
      growth: {
        price: 399, bdt: 43890, popular: true,
        features: ['Up to 3 packaging variants', 'Custom dieline creation', '3D photorealistic mockups (3 angles)', 'Print + digital formats', 'Unlimited revisions', 'Packaging guidelines', '10-day delivery']
      },
      premium: {
        price: 799, bdt: 87890,
        features: ['Full product range (up to 8 SKUs)', 'Structural packaging consultation', '3D mockups + lifestyle renders', 'Retail shelf mockup', 'Unlimited revisions', 'Print management support', 'Priority 10-day delivery']
      }
    }
  },
  presentation: {
    name: 'Presentation Design',
    description: 'Pitch decks, investor presentations, and corporate slide decks that command attention, tell your story, and close deals.',
    cycle: 'per deck',
    plans: {
      starter: {
        price: 99, bdt: 10890,
        features: ['Up to 10 slides', 'Brand-consistent layout', 'PPTX + PDF export', '2 revision rounds', 'Stock imagery included', '3-day delivery']
      },
      growth: {
        price: 249, bdt: 27390, popular: true,
        features: ['Up to 25 slides', 'Custom infographics & charts', 'Animated transitions', 'PPTX + PDF + Keynote', 'Unlimited revisions', 'Presenter notes formatted', '5-day delivery']
      },
      premium: {
        price: 599, bdt: 65890,
        features: ['Unlimited slides', 'Strategic narrative structuring', 'Custom icons & illustration', 'Data visualisation (charts/graphs)', 'Animated slide deck', 'Unlimited revisions', 'Priority 5-day delivery']
      }
    }
  },
  uiux: {
    name: 'UI/UX Design',
    description: 'Human-centred product design — from research and wireframes to high-fidelity Figma prototypes ready for your development team.',
    cycle: 'per project',
    plans: {
      starter: {
        price: 299, bdt: 32890,
        features: ['Up to 5 screens', 'Mobile or desktop (1 platform)', 'Wireframes + hi-fi mockups', 'Figma file delivery', '3 revision rounds', '7-day delivery']
      },
      growth: {
        price: 799, bdt: 87890, popular: true,
        features: ['Up to 15 screens', 'Both mobile + desktop', 'User flow mapping', 'Interactive Figma prototype', 'Component library', 'Unlimited revisions', 'Dev handoff notes', '14-day delivery']
      },
      premium: {
        price: 1999, bdt: 219890,
        features: ['Unlimited screens', 'UX research & persona maps', 'Full design system', 'Interactive prototype + animations', 'Accessibility audit (WCAG)', 'Unlimited revisions', 'Dev collaboration support', 'Priority 21-day delivery']
      }
    }
  }
};

/* ── Render Pricing Plans ───────────────────────────────────── */
function renderPricingPlans(serviceKey) {
  const plansContainer = document.getElementById('pricingPlans');
  if (!plansContainer) return;

  const svc = SERVICE_PRICING[serviceKey];
  if (!svc) return;

  const sym = currentCurrency === 'usd' ? '$' : '৳';
  const getPrice = (plan) => currentCurrency === 'usd'
    ? plan.price.toLocaleString()
    : plan.bdt.toLocaleString();

  const planKeys = ['starter', 'growth', 'premium'];
  const planLabels = ['Starter', 'Growth', 'Premium'];

  plansContainer.innerHTML = `
    <div class="pricing__plans-grid">
      ${planKeys.map((key, idx) => {
        const plan = svc.plans[key];
        const isFeatured = plan.popular;
        return `
          <div class="pricing-card ${isFeatured ? 'pricing-card--featured' : ''} pricing-card--animated" style="animation-delay:${idx * 80}ms">
            ${isFeatured ? '<div class="pricing-card__best">Most Popular</div>' : ''}
            <div class="pricing-card__tier-badge pricing-card__tier-badge--${key}">${planLabels[idx]}</div>
            <div class="pricing-card__price">
              <span class="price-sym">${sym}</span>
              <span class="price-num">${getPrice(plan)}</span>
            </div>
            <p class="pricing-card__cycle">${svc.cycle}</p>
            <ul class="pricing-card__features">
              ${plan.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
            <button class="btn ${isFeatured ? 'btn--primary' : 'btn--outline'} btn--block" onclick="scrollToSection('contact')">Get Started</button>
          </div>
        `;
      }).join('')}
    </div>
    <p class="pricing__service-note">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
      ${svc.description} <a href="#contact" onclick="scrollToSection('contact');return false;">Request a custom quote →</a>
    </p>
  `;
}

(function initServicePricingTabs() {
  const tabs = document.querySelectorAll('.pricing-svc-tab');
  if (!tabs.length) return;

  // Render first tab immediately
  renderPricingPlans('social');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      // Scroll tab into view on mobile
      tab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      renderPricingPlans(tab.dataset.service);
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   7. CURRENCY TOGGLE
═══════════════════════════════════════════════════════════════ */
(function initCurrencyToggle() {
  const usdBtn = document.getElementById('usdBtn');
  const bdtBtn = document.getElementById('bdtBtn');

  function setSymbols(currency) {
    document.querySelectorAll('.price-symbol').forEach(el => {
      el.textContent = el.dataset[currency] || (currency === 'usd' ? '$' : '৳');
    });
    document.querySelectorAll('.price-amount').forEach(el => {
      const raw = currency === 'usd' ? el.dataset.usd : el.dataset.bdt;
      if (raw) {
        const num = parseInt(raw, 10);
        el.textContent = num.toLocaleString();
      }
    });
  }

  function activate(currency) {
    currentCurrency = currency;
    usdBtn.classList.toggle('active', currency === 'usd');
    bdtBtn.classList.toggle('active', currency === 'bdt');
    setSymbols(currency);
    updateEstimatorDisplay();
    // Re-render service pricing plans with new currency
    const activeTab = document.querySelector('.pricing-svc-tab.active');
    if (activeTab) renderPricingPlans(activeTab.dataset.service);
  }

  usdBtn.addEventListener('click', () => activate('usd'));
  bdtBtn.addEventListener('click', () => activate('bdt'));

  activate('usd');
})();

/* ═══════════════════════════════════════════════════════════════
   8. PRICING ESTIMATOR
═══════════════════════════════════════════════════════════════ */
function calculateEstimate() {
  const service    = document.getElementById('estService').value;
  const quantity   = parseInt(document.getElementById('estQuantity').value, 10);
  const complexity = selectedComplexity;
  const delivery   = selectedDelivery;

  const base = BASE_PRICES[service] || [50, 200];
  const mult = COMPLEXITY_MULTIPLIERS[complexity] || 1;

  let minUSD = base[0] * mult * quantity;
  let maxUSD = base[1] * mult * quantity;

  if (delivery === 'express') {
    minUSD *= (1 + EXPRESS_SURCHARGE);
    maxUSD *= (1 + EXPRESS_SURCHARGE);
  }

  minUSD = Math.round(minUSD);
  maxUSD = Math.round(maxUSD);

  return { minUSD, maxUSD };
}

function updateEstimatorDisplay() {
  const { minUSD, maxUSD } = calculateEstimate();
  const priceEl = document.getElementById('estimatedPrice');
  const noteEl  = document.getElementById('estimatedNote');
  const service = document.getElementById('estService');
  const qty     = document.getElementById('estQuantity').value;

  let displayStr;
  if (currentCurrency === 'usd') {
    displayStr = `$${minUSD.toLocaleString()} – $${maxUSD.toLocaleString()}`;
  } else {
    const minBDT = Math.round(minUSD * USD_TO_BDT);
    const maxBDT = Math.round(maxUSD * USD_TO_BDT);
    displayStr = `৳${minBDT.toLocaleString()} – ৳${maxBDT.toLocaleString()}`;
  }

  priceEl.textContent = displayStr;

  const serviceName = service.options[service.selectedIndex].text;
  const deliveryLabel = selectedDelivery === 'express' ? 'express' : 'standard';
  noteEl.textContent = `Based on ${qty}× ${selectedComplexity} ${serviceName.toLowerCase()} at ${deliveryLabel} delivery.`;

  priceEl.style.transition = 'none';
  priceEl.style.transform = 'scale(1.05)';
  setTimeout(() => {
    priceEl.style.transition = 'transform 0.3s ease';
    priceEl.style.transform = 'scale(1)';
  }, 50);
}

(function initEstimator() {
  const serviceEl   = document.getElementById('estService');
  const quantityEl  = document.getElementById('estQuantity');
  const quantityVal = document.getElementById('quantityVal');

  serviceEl.addEventListener('change', updateEstimatorDisplay);

  quantityEl.addEventListener('input', () => {
    quantityVal.textContent = quantityEl.value;
    updateEstimatorDisplay();
  });

  document.querySelectorAll('.complexity-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.complexity-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedComplexity = btn.dataset.complexity;
      updateEstimatorDisplay();
    });
  });

  document.querySelectorAll('.delivery-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.delivery-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDelivery = btn.dataset.delivery;
      updateEstimatorDisplay();
    });
  });

  updateEstimatorDisplay();

  document.getElementById('getProposalBtn').addEventListener('click', () => {
    const service     = document.getElementById('estService');
    const serviceName = service.options[service.selectedIndex].text;
    const { minUSD, maxUSD } = calculateEstimate();

    let budgetStr;
    if (currentCurrency === 'usd') {
      budgetStr = `$${minUSD.toLocaleString()} – $${maxUSD.toLocaleString()}`;
    } else {
      const minBDT = Math.round(minUSD * USD_TO_BDT);
      const maxBDT = Math.round(maxUSD * USD_TO_BDT);
      budgetStr = `৳${minBDT.toLocaleString()} – ৳${maxBDT.toLocaleString()}`;
    }

    document.getElementById('propService').value = `${serviceName} (${selectedComplexity}, ${selectedDelivery})`;
    document.getElementById('propBudget').value  = budgetStr;

    openModal('proposalModal');
  });
})();

/* ═══════════════════════════════════════════════════════════════
   9. PORTFOLIO FILTER
═══════════════════════════════════════════════════════════════ */
(function initPortfolioFilter() {
  const filterBtns = document.querySelectorAll('.filter-btn');
  const items      = document.querySelectorAll('.portfolio-item');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.dataset.filter;

      items.forEach(item => {
        const match = filter === 'all' || item.dataset.category === filter;
        if (match) {
          item.classList.remove('hidden');
          item.style.animation = 'none';
          requestAnimationFrame(() => { item.style.animation = ''; });
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   10. MODALS
═══════════════════════════════════════════════════════════════ */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('open');
  document.body.style.overflow = '';
}

(function initModals() {
  ['bookNav', 'bookHero', 'bookCTA', 'bookFooter', 'bookProcess'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', () => openModal('bookModal'));
  });

  document.getElementById('closeModal').addEventListener('click', () => closeModal('bookModal'));
  document.getElementById('closeProposal').addEventListener('click', () => closeModal('proposalModal'));

  document.getElementById('modalBackdrop').addEventListener('click', () => closeModal('bookModal'));
  document.getElementById('proposalBackdrop').addEventListener('click', () => closeModal('proposalModal'));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal('bookModal');
      closeModal('proposalModal');
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   11. CONTACT FORM — EmailJS Integration
   EmailJS credentials: replace YOUR_SERVICE_ID, YOUR_TEMPLATE_ID,
   and initialise the public key in index.html <head> script.
   Template variable names must match the input name/id attributes:
     {{firstName}}, {{lastName}}, {{email}}, {{phone}},
     {{service}},   {{budget}},   {{message}}
═══════════════════════════════════════════════════════════════ */
(function initContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  const fields = {
    firstName: { el: document.getElementById('firstName'), err: document.getElementById('firstNameError'), validate: v => v.trim().length >= 2 ? '' : 'First name must be at least 2 characters.' },
    lastName:  { el: document.getElementById('lastName'),  err: document.getElementById('lastNameError'),  validate: v => v.trim().length >= 2 ? '' : 'Last name must be at least 2 characters.' },
    email:     { el: document.getElementById('email'),     err: document.getElementById('emailError'),     validate: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? '' : 'Please enter a valid email address.' },
    phone:     { el: document.getElementById('phone'),     err: document.getElementById('phoneError'),     validate: v => v.trim().length >= 7 ? '' : 'Please enter a valid phone or WhatsApp number.' },
    service:   { el: document.getElementById('service'),   err: document.getElementById('serviceError'),   validate: v => v ? '' : 'Please select a service.' },
    budget:    { el: document.getElementById('budget'),    err: document.getElementById('budgetError'),    validate: v => v ? '' : 'Please select a budget range.' },
    message:   { el: document.getElementById('message'),   err: document.getElementById('messageError'),   validate: v => v.trim().length >= 20 ? '' : 'Please provide at least 20 characters of project detail.' },
  };

  function validateField(key) {
    const f = fields[key];
    const msg = f.validate(f.el.value);
    f.err.textContent = msg;
    f.el.classList.toggle('error', !!msg);
    return !msg;
  }

  Object.keys(fields).forEach(key => {
    fields[key].el.addEventListener('blur', () => validateField(key));
    fields[key].el.addEventListener('input', () => {
      if (fields[key].el.classList.contains('error')) validateField(key);
    });
  });

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Run all validations
    let valid = true;
    Object.keys(fields).forEach(key => { if (!validateField(key)) valid = false; });
    if (!valid) return;

    const submitBtn   = document.getElementById('submitBtn');
    const submitText  = document.getElementById('submitText');
    const submitSpin  = document.getElementById('submitSpinner');
    const formSuccess = document.getElementById('formSuccess');

    // UI: loading state
    submitBtn.disabled = true;
    submitText.textContent = 'Sending…';
    submitSpin.classList.remove('hidden');
    formSuccess.classList.add('hidden');

    try {
      // ── EmailJS send ────────────────────────────────────────
      // Replace 'YOUR_SERVICE_ID' and 'YOUR_TEMPLATE_ID' with
      // your actual EmailJS service and template IDs.
      // The template should include variables:
      //   {{firstName}}, {{lastName}}, {{email}}, {{phone}},
      //   {{service}},   {{budget}},   {{message}}
      await emailjs.sendForm(
        'YOUR_SERVICE_ID',   // ← replace with your EmailJS Service ID
        'YOUR_TEMPLATE_ID',  // ← replace with your EmailJS Template ID
        form                 // the form element — maps name= attributes to template vars
      );

      // Success
      submitText.textContent = 'Send Message';
      submitSpin.classList.add('hidden');
      submitBtn.disabled = false;
      formSuccess.classList.remove('hidden');
      form.reset();
      setTimeout(() => formSuccess.classList.add('hidden'), 6000);

    } catch (error) {
      // Error: show inline error message in the success banner (styled as error)
      console.error('EmailJS error:', error);
      submitText.textContent = 'Send Message';
      submitSpin.classList.add('hidden');
      submitBtn.disabled = false;

      formSuccess.textContent = 'Something went wrong. Please try again or email us directly at hello@pinkx.studio';
      formSuccess.style.background  = 'rgba(255,79,79,0.1)';
      formSuccess.style.borderColor = 'rgba(255,79,79,0.3)';
      formSuccess.style.color       = '#ff4f4f';
      formSuccess.classList.remove('hidden');
      setTimeout(() => {
        formSuccess.classList.add('hidden');
        formSuccess.textContent   = 'Message received. PinkX Studio will connect with you shortly.';
        formSuccess.style.background  = '';
        formSuccess.style.borderColor = '';
        formSuccess.style.color       = '';
      }, 6000);
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   12. PROPOSAL FORM
═══════════════════════════════════════════════════════════════ */
(function initProposalForm() {
  const form = document.getElementById('proposalForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name  = document.getElementById('propName').value.trim();
    const email = document.getElementById('propEmail').value.trim();
    if (!name || !email) { alert('Please fill in your name and email.'); return; }

    const successEl = document.getElementById('proposalSuccess');
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    await new Promise(r => setTimeout(r, 1500));

    submitBtn.disabled = false;
    submitBtn.textContent = 'Send Proposal Request';
    successEl.classList.remove('hidden');
    form.reset();
    setTimeout(() => { successEl.classList.add('hidden'); closeModal('proposalModal'); }, 4000);
  });
})();

/* ═══════════════════════════════════════════════════════════════
   13. SERVICE CARD — subtle mouse-follow glow
═══════════════════════════════════════════════════════════════ */
(function initCardGlow() {
  document.querySelectorAll('.service-card, .why-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.background = `radial-gradient(circle at ${x}% ${y}%, rgba(255,46,147,0.08) 0%, var(--surface) 60%)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.background = '';
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   14. NAV LOGO / SECTION LINKS — smooth scroll
═══════════════════════════════════════════════════════════════ */
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const target = link.getAttribute('href');
    if (target === '#') { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const el = document.querySelector(target);
    if (el) {
      e.preventDefault();
      const navH = 72;
      window.scrollTo({ top: el.offsetTop - navH, behavior: 'smooth' });
    }
  });
});

/* ═══════════════════════════════════════════════════════════════
   15. PORTFOLIO — image hover z-index
═══════════════════════════════════════════════════════════════ */
document.querySelectorAll('.portfolio-item').forEach(item => {
  item.addEventListener('mouseenter', () => item.style.zIndex = '2');
  item.addEventListener('mouseleave', () => item.style.zIndex = '');
});

/* ═══════════════════════════════════════════════════════════════
   16. TOOLS — staggered reveal on scroll
═══════════════════════════════════════════════════════════════ */
(function staggerTools() {
  const badges = document.querySelectorAll('.tool-badge');
  badges.forEach((b, i) => {
    b.style.transitionDelay = `${i * 40}ms`;
    b.classList.add('reveal');
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  badges.forEach(b => obs.observe(b));
})();

/* ═══════════════════════════════════════════════════════════════
   17. PROCESS TIMELINE — expandable step details
═══════════════════════════════════════════════════════════════ */
(function initProcessTimeline() {
  document.querySelectorAll('.process-timeline__toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      const expand = btn.nextElementSibling;
      if (expanded) {
        btn.setAttribute('aria-expanded', 'false');
        expand.style.maxHeight = '0';
      } else {
        btn.setAttribute('aria-expanded', 'true');
        expand.style.maxHeight = expand.scrollHeight + 'px';
      }
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   18. FOOTER YEAR — dynamic
═══════════════════════════════════════════════════════════════ */
(function setYear() {
  const y = document.querySelector('.footer__bottom p');
  if (y) {
    const yr = new Date().getFullYear();
    y.textContent = y.textContent.replace(/\d{4}/, yr);
  }
})();

/* ═══════════════════════════════════════════════════════════════
   19. PRICING — number flip animation on currency switch
═══════════════════════════════════════════════════════════════ */
(function enhancePriceFlip() {
  document.querySelectorAll('.price-amount').forEach(el => {
    el.addEventListener('DOMSubtreeModified', () => {
      el.style.transform = 'translateY(-4px)';
      el.style.opacity   = '0.7';
      setTimeout(() => {
        el.style.transform = 'translateY(0)';
        el.style.opacity   = '1';
      }, 200);
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   20. WHATSAPP BTN — subtle pulse
═══════════════════════════════════════════════════════════════ */
(function pulseWA() {
  const wa = document.querySelector('.whatsapp-btn');
  if (!wa) return;
  setInterval(() => {
    wa.style.transform = 'scale(1.08)';
    setTimeout(() => { wa.style.transform = ''; }, 300);
  }, 4000);
})();

/* ═══════════════════════════════════════════════════════════════
   21. TESTIMONIALS CAROUSEL
═══════════════════════════════════════════════════════════════ */
(function initTestimonials() {
  const track       = document.getElementById('testimonialsTrack');
  const dotsContainer = document.getElementById('testimonialDots');
  const prevBtn     = document.getElementById('testimonialPrev');
  const nextBtn     = document.getElementById('testimonialNext');

  if (!track) return;

  const cards = Array.from(track.querySelectorAll('.testimonial-card'));
  let current = 0;
  let autoPlayTimer;

  // Determine how many cards are visible at once based on viewport
  function visibleCount() {
    if (window.innerWidth >= 1100) return 3;
    if (window.innerWidth >= 769)  return 2;
    return 1;
  }

  function totalSlides() {
    return Math.max(1, cards.length - visibleCount() + 1);
  }

  // Build dots
  function buildDots() {
    dotsContainer.innerHTML = '';
    for (let i = 0; i < totalSlides(); i++) {
      const dot = document.createElement('button');
      dot.className = 'testimonials__dot' + (i === current ? ' active' : '');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    dotsContainer.querySelectorAll('.testimonials__dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
    });
  }

  function goTo(index) {
    const total = totalSlides();
    current = Math.max(0, Math.min(index, total - 1));

    // Each card takes up (100 / visibleCount) % of the container
    const cardWidth = 100 / visibleCount();
    track.style.transform = `translateX(-${current * cardWidth}%)`;
    updateDots();
  }

  function next() {
    goTo(current + 1 < totalSlides() ? current + 1 : 0);
  }

  function prev() {
    goTo(current - 1 >= 0 ? current - 1 : totalSlides() - 1);
  }

  function startAutoPlay() {
    stopAutoPlay();
    autoPlayTimer = setInterval(next, 5000);
  }

  function stopAutoPlay() {
    clearInterval(autoPlayTimer);
  }

  prevBtn.addEventListener('click', () => { prev(); stopAutoPlay(); startAutoPlay(); });
  nextBtn.addEventListener('click', () => { next(); stopAutoPlay(); startAutoPlay(); });

  // Pause on hover
  track.addEventListener('mouseenter', stopAutoPlay);
  track.addEventListener('mouseleave', startAutoPlay);

  // Rebuild on resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      buildDots();
      goTo(0);
    }, 200);
  });

  // Touch / swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      diff > 0 ? next() : prev();
      stopAutoPlay();
      startAutoPlay();
    }
  });

  buildDots();
  goTo(0);
  startAutoPlay();
})();

/* ═══════════════════════════════════════════════════════════════
   22. FAQ ACCORDION
═══════════════════════════════════════════════════════════════ */
(function initFAQ() {
  const items = document.querySelectorAll('.faq-item');
  if (!items.length) return;

  items.forEach(item => {
    const btn    = item.querySelector('.faq-item__question');
    const answer = item.querySelector('.faq-item__answer');

    btn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all other items
      items.forEach(other => {
        if (other !== item) {
          other.classList.remove('open');
          const otherBtn = other.querySelector('.faq-item__question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Toggle this item
      item.classList.toggle('open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — SCROLL PROGRESS BAR
═══════════════════════════════════════════════════════════════ */
(function initScrollProgress() {
  const fill = document.getElementById('scrollProgressFill');
  if (!fill) return;
  window.addEventListener('scroll', () => {
    const scrolled = window.scrollY;
    const total    = document.documentElement.scrollHeight - window.innerHeight;
    fill.style.width = (total > 0 ? (scrolled / total) * 100 : 0) + '%';
  }, { passive: true });
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — SECTION NAV DOTS
═══════════════════════════════════════════════════════════════ */
(function initSectionDots() {
  const dots    = document.querySelectorAll('.section-dot');
  const sections = Array.from(dots).map(d => document.getElementById(d.dataset.section)).filter(Boolean);

  dots.forEach(dot => {
    dot.addEventListener('click', () => {
      const id = dot.dataset.section;
      const el = document.getElementById(id);
      if (!el) return;
      const navH = 72;
      window.scrollTo({ top: el.offsetTop - navH, behavior: 'smooth' });
    });
  });

  function updateDots() {
    const scrollMid = window.scrollY + window.innerHeight * 0.4;
    let active = 0;
    sections.forEach((sec, i) => {
      if (sec && scrollMid >= sec.offsetTop) active = i;
    });
    dots.forEach((dot, i) => dot.classList.toggle('active', i === active));
  }

  window.addEventListener('scroll', updateDots, { passive: true });
  updateDots();
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — HERO SCROLL INVITE CLICK
═══════════════════════════════════════════════════════════════ */
(function initHeroScrollInvite() {
  const invite = document.getElementById('heroScrollInvite');
  if (!invite) return;
  invite.addEventListener('click', () => {
    const trusted = document.getElementById('trusted');
    if (trusted) window.scrollTo({ top: trusted.offsetTop - 72, behavior: 'smooth' });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — AMBIENT MUSIC PLAYER (Web Audio API)
═══════════════════════════════════════════════════════════════ */
(function initMusicPlayer() {
  const btn         = document.getElementById('musicPlayer');
  const iconPlay    = document.getElementById('musicIconPlay');
  const iconPause   = document.getElementById('musicIconPause');
  if (!btn) return;

  let ctx = null;
  let masterGain = null;
  let playing = false;
  const oscillators = [];
  let lfoNodes = [];

  // Cmaj9 chord frequencies (soft, warm)
  const FREQS = [
    { freq: 65.41,  gain: 0.06 },  // C2 bass
    { freq: 130.81, gain: 0.04 },  // C3
    { freq: 164.81, gain: 0.035 }, // E3
    { freq: 196.00, gain: 0.03 },  // G3
    { freq: 246.94, gain: 0.025 }, // B3
    { freq: 261.63, gain: 0.02 },  // C4
    { freq: 293.66, gain: 0.015 }, // D4
  ];

  function buildAudio() {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.connect(ctx.destination);

    FREQS.forEach(({ freq, gain }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq + (Math.random() * 0.4 - 0.2); // tiny detune

      // Slow LFO tremolo
      const lfo  = ctx.createOscillator();
      const lfoG = ctx.createGain();
      lfo.frequency.value = 0.1 + Math.random() * 0.15;
      lfoG.gain.value = gain * 0.3;
      lfo.connect(lfoG);

      const oscGain = ctx.createGain();
      oscGain.gain.value = gain;
      lfoG.connect(oscGain.gain);
      osc.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start();
      lfo.start();
      oscillators.push(osc);
      lfoNodes.push(lfo);
    });
  }

  function fadeIn() {
    if (!ctx) buildAudio();
    if (ctx.state === 'suspended') ctx.resume();
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.55, ctx.currentTime + 3.5);
  }

  function fadeOut() {
    if (!masterGain) return;
    masterGain.gain.cancelScheduledValues(ctx.currentTime);
    masterGain.gain.setValueAtTime(masterGain.gain.value, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 2.5);
    setTimeout(() => { if (ctx) ctx.suspend(); }, 2600);
  }

  btn.addEventListener('click', () => {
    playing = !playing;
    btn.classList.toggle('playing', playing);
    iconPlay.classList.toggle('hidden', playing);
    iconPause.classList.toggle('hidden', !playing);
    if (playing) fadeIn(); else fadeOut();
  });
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — BRAND QUIZ
═══════════════════════════════════════════════════════════════ */
(function initBrandQuiz() {
  const stage      = document.getElementById('quizStage');
  const resultEl   = document.getElementById('quizResult');
  const barFill    = document.getElementById('quizBar');
  const progressLb = document.getElementById('quizProgressLabel');
  const retakeBtn  = document.getElementById('quizRetake');
  if (!stage) return;

  const questions = stage.querySelectorAll('.quiz-q');
  let answers = [];
  let currentQ = 0;
  const TOTAL   = questions.length;

  // Goal map for last question
  const GOAL_RECS = {
    'quiz-launch':   ['Logo & Brand Identity', 'Brand Guidelines', 'Social Media Kit'],
    'quiz-redesign': ['Brand Refresh', 'New Visual Identity', 'Website Redesign'],
    'quiz-scale':    ['Marketing Creatives', 'Social Media Design', 'Motion Graphics'],
    'quiz-convert':  ['Pitch Deck Design', 'Website Redesign', 'UI/UX Design'],
  };

  function setProgress(q) {
    const pct = (q / TOTAL) * 100;
    barFill.style.width = pct + '%';
    progressLb.textContent = q < TOTAL ? `Question ${q + 1} of ${TOTAL}` : 'Your results';
  }

  function showQuestion(idx) {
    questions.forEach((q, i) => {
      q.classList.toggle('active', i === idx);
    });
    setProgress(idx);
  }

  function chooseOption(optEl, qIdx) {
    const val = optEl.dataset.val;
    answers[qIdx] = val;
    // Mark selected
    optEl.closest('.quiz-opts').querySelectorAll('.quiz-opt').forEach(o => o.classList.remove('selected'));
    optEl.classList.add('selected');

    setTimeout(() => {
      if (qIdx < TOTAL - 1) {
        currentQ = qIdx + 1;
        showQuestion(currentQ);
      } else {
        showResult();
      }
    }, 380);
  }

  questions.forEach((q, qIdx) => {
    q.querySelectorAll('.quiz-opt').forEach(opt => {
      opt.addEventListener('click', () => chooseOption(opt, qIdx));
    });
  });

  function showResult() {
    setProgress(TOTAL);
    stage.style.display = 'none';
    resultEl.classList.remove('hidden');

    // Compute numeric score from first 4 answers
    const numericAnswers = answers.slice(0, 4).map(v => {
      const n = parseInt(v, 10);
      return isNaN(n) ? 50 : n;
    });
    const rawScore = Math.round(numericAnswers.reduce((s, v) => s + v, 0) / numericAnswers.length);
    const score    = Math.max(10, Math.min(98, rawScore));

    // Animate score
    const scoreEl = document.getElementById('quizScoreNum');
    const gaugeFill = document.getElementById('quizGaugeFill');
    const titleEl   = document.getElementById('quizResultTitle');
    const descEl    = document.getElementById('quizResultDesc');
    const recsEl    = document.getElementById('quizResultRecs');

    let count = 0;
    const step = Math.ceil(score / 60);
    const timer = setInterval(() => {
      count = Math.min(count + step, score);
      scoreEl.textContent = count;
      if (count >= score) clearInterval(timer);
    }, 25);

    // Arc gauge (251px circumference for this arc)
    const arcLen  = 251;
    const offset  = arcLen - (score / 100) * arcLen;
    setTimeout(() => { gaugeFill.style.strokeDashoffset = offset; }, 100);

    // Colour score
    if (score >= 80) scoreEl.style.color = '#00e676';
    else if (score >= 60) scoreEl.style.color = '#ffb300';
    else if (score >= 40) scoreEl.style.color = '#ff6d00';
    else scoreEl.style.color = 'var(--pink)';

    // Title & desc
    let title, desc;
    if (score >= 80) {
      title = 'Your Brand is Thriving ✦';
      desc  = 'Impressive — your brand has a strong foundation. A few strategic upgrades in motion, campaigns, or conversion design could unlock serious growth. Let\'s build on what\'s working.';
    } else if (score >= 60) {
      title = 'Strong Foundations, Room to Grow';
      desc  = 'You have something real to build on. With a refreshed visual system, consistent content, and a stronger digital presence, your brand can dominate its niche.';
    } else if (score >= 40) {
      title = 'Your Brand Needs a Boost';
      desc  = 'There\'s untapped potential here. A cohesive identity, polished website, and strategic creatives would transform how people perceive and trust your brand.';
    } else {
      title = 'Time for a Brand Transformation ✦';
      desc  = 'Every iconic brand started somewhere. The gap between where you are and where you want to be is exactly what PinkX Studio was built to close — and fast.';
    }

    titleEl.textContent = title;
    descEl.textContent  = desc;

    // Recs
    const lastAnswer = answers[TOTAL - 1];
    const recs = GOAL_RECS[lastAnswer] || ['Brand Identity', 'Visual Design', 'Creative Strategy'];
    recsEl.innerHTML = recs.map(r => `<span class="quiz-rec-chip">${r}</span>`).join('');
  }

  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      answers = [];
      currentQ = 0;
      resultEl.classList.add('hidden');
      stage.style.display = '';
      questions.forEach(q => {
        q.classList.remove('active');
        q.querySelectorAll('.quiz-opt').forEach(o => o.classList.remove('selected'));
      });
      showQuestion(0);
    });
  }

  showQuestion(0);
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — PRIVACY POLICY LINK
   Navigate directly to the privacy-policy.html page.
   (No modal interception — the anchor href handles navigation.)
═══════════════════════════════════════════════════════════════ */
(function initPrivacyLink() {
  const link = document.getElementById('privacyLink');
  if (!link) return;
  // Ensure it navigates to privacy-policy.html cleanly
  link.addEventListener('click', function(e) {
    // Allow default anchor navigation — do not preventDefault
    // Just close mobile menu if open
    const navLinks = document.getElementById('navLinks');
    const hamburger = document.getElementById('hamburger');
    if (navLinks && navLinks.classList.contains('open')) {
      navLinks.classList.remove('open');
      if (hamburger) hamburger.classList.remove('open');
      document.body.style.overflow = '';
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — PROPOSAL FORM AUTOFILL (Enhanced)
═══════════════════════════════════════════════════════════════ */
(function enhanceProposalAutofill() {
  const originalOpen = window.openModal;
  window.openModal = function(id) {
    if (id === 'proposalModal') {
      // Pull from contact form if the user already filled it in
      const firstName = document.getElementById('firstName');
      const lastName  = document.getElementById('lastName');
      const emailF    = document.getElementById('email');

      const propName  = document.getElementById('propName');
      const propEmail = document.getElementById('propEmail');

      if (firstName && lastName && propName) {
        const fullName = [firstName.value.trim(), lastName.value.trim()].filter(Boolean).join(' ');
        if (fullName && !propName.value) propName.value = fullName;
      }
      if (emailF && propEmail && !propEmail.value) {
        propEmail.value = emailF.value;
      }

      // Add autocomplete attributes for browser autofill
      if (propName)  { propName.setAttribute('autocomplete', 'name'); }
      if (propEmail) { propEmail.setAttribute('autocomplete', 'email'); }
    }
    if (originalOpen) originalOpen.call(window, id);
    else {
      const modal = document.getElementById(id);
      if (!modal) return;
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  };
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — MAGNETIC BUTTONS
═══════════════════════════════════════════════════════════════ */
(function initMagneticBtns() {
  document.querySelectorAll('.btn--primary, .btn--outline').forEach(btn => {
    btn.addEventListener('mousemove', function(e) {
      const rect = this.getBoundingClientRect();
      const cx   = rect.left + rect.width / 2;
      const cy   = rect.top  + rect.height / 2;
      const dx   = (e.clientX - cx) * 0.18;
      const dy   = (e.clientY - cy) * 0.18;
      this.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', function() {
      this.style.transform = '';
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — SERVICE CARD MOUSE GLOW (new cards)
═══════════════════════════════════════════════════════════════ */
(function initNewCardGlow() {
  document.querySelectorAll('.svc-card, .svc-featured-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width  * 100).toFixed(1);
      const y = ((e.clientY - rect.top)  / rect.height * 100).toFixed(1);
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });
})();

/* ═══════════════════════════════════════════════════════════════
   ENHANCEMENTS — STAGGERED REVEAL FOR SERVICE CARDS
═══════════════════════════════════════════════════════════════ */
(function staggerServiceCards() {
  const fCards = document.querySelectorAll('.svc-featured-card');
  fCards.forEach((c, i) => {
    c.classList.add('reveal');
    c.setAttribute('data-delay', String(i * 100));
  });

  const obs = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  fCards.forEach(c => obs.observe(c));
})();

/* ═══════════════════════════════════════════════════════════════
   THEME TOGGLE — Light / Dark Mode
   Dark is the default. User preference is persisted in localStorage.
   An inline script in <head> applies the stored theme before paint
   to prevent flash-of-unstyled-content (FOUC).
═══════════════════════════════════════════════════════════════ */
(function initThemeToggle() {
  const STORAGE_KEY = 'pinkx-theme';
  const root        = document.documentElement;
  const toggleBtn   = document.getElementById('themeToggle');

  if (!toggleBtn) return;

  // Read current theme (set by head inline script, or default to dark)
  function currentTheme() {
    return root.getAttribute('data-theme') || 'dark';
  }

  // Apply theme and persist
  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
    toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    toggleBtn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';

    // Update canvas particle colours based on theme
    updateCanvasTheme(theme);
  }

  toggleBtn.addEventListener('click', () => {
    applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
  });

  // Initialise aria-label
  applyTheme(currentTheme());
})();

/* Canvas theme helper — adjust particle/connection colours for light mode */
function updateCanvasTheme(theme) {
  // Canvas colours are set inside initCanvas closure; we expose a global flag
  window.__pinkxTheme = theme;
}
