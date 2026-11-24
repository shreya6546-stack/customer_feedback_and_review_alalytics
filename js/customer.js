const PORTAL_PAGE_SIZE = 9;
let activePortalTab = 'businesses';
let selectedPortalProduct = 'all';
let currentPortalPage = 1;
let lookupEmailOverride = '';

const DEFAULT_BUSINESSES = [
  { id: 'comp_smarthub', name: 'SmartHub Inc', product: 'SmartHub Pro', category: 'Product Quality & Collaboration', description: 'Enterprise team collaboration and intelligent workflow platform with automated tasks.' },
  { id: 'comp_nexa', name: 'Nexa CRM Systems', product: 'Nexa CRM', category: 'Customer Service & CRM', description: 'All-in-one relationship management, pipeline tracking, and sales automation software.' },
  { id: 'comp_insightflow', name: 'InsightFlow Analytics', product: 'InsightFlow', category: 'Website Experience & Reporting', description: 'Real-time analytics, user funnel tracking, and comprehensive business intelligence.' },
  { id: 'comp_deliverloop', name: 'DeliverLoop Logistics', product: 'DeliverLoop', category: 'Delivery & Operations', description: 'Fast, reliable, and scalable supply chain, order tracking, and fulfillment logistics.' },
  { id: 'comp_pulsedesk', name: 'PulseDesk Solutions', product: 'PulseDesk', category: 'Customer Support & Helpdesk', description: 'Omnichannel customer service, ticketing, and live communication tool for modern teams.' },
  { id: 'comp_luna', name: 'Luna Support Technologies', product: 'Luna Support', category: 'Customer Service & Help', description: 'Enterprise 24/7 dedicated customer assistance and automated support software.' }
];

function getRegisteredBusinesses() {
  const registeredUsers = typeof getRegisteredUsers === 'function' ? getRegisteredUsers() : [];
  const companyUsers = registeredUsers.filter((u) => u.role === 'company' && (u.companyName || u.name));
  
  const dynamicCompanies = companyUsers.map((u) => ({
    id: u.id,
    name: u.companyName || u.name,
    product: u.companyName || u.name,
    category: 'Enterprise Solutions',
    description: `Registered business verified on FeedbackPro platform. Official contact: ${u.email || ''}`
  }));

  const all = [...DEFAULT_BUSINESSES];
  for (const comp of dynamicCompanies) {
    if (!all.some((c) => c.name.toLowerCase() === comp.name.toLowerCase())) {
      all.push(comp);
    }
  }
  return all;
}

function getActiveCustomerIdentity() {
  const auth = typeof ensureAuth === 'function' ? ensureAuth() : { isLoggedIn: false };
  const profile = typeof getCustomerProfile === 'function' ? getCustomerProfile() : { name: '', email: '' };
  if (auth.isLoggedIn && auth.role === 'customer') {
    return {
      name: auth.name || profile.name || 'Customer',
      email: lookupEmailOverride || auth.email || profile.email || '',
      accountEmail: auth.email || '',
      isLoggedInCustomer: true,
      isAdmin: false
    };
  }
  if (auth.isLoggedIn && (auth.role || 'admin') === 'admin') {
    return {
      name: profile.name || auth.name || 'Admin',
      email: lookupEmailOverride || profile.email || '',
      accountEmail: '',
      isLoggedInCustomer: false,
      isAdmin: true
    };
  }
  return {
    name: profile.name || '',
    email: lookupEmailOverride || profile.email || '',
    accountEmail: '',
    isLoggedInCustomer: false,
    isAdmin: false
  };
}

function switchPortalTab(tabName) {
  const allowed = ['businesses', 'browse', 'write', 'mine'];
  activePortalTab = allowed.includes(tabName) ? tabName : 'businesses';

  document.querySelectorAll('.portal-tab').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.portalTab === activePortalTab);
  });

  const views = {
    businesses: document.getElementById('portalBusinessesView'),
    browse: document.getElementById('portalBrowseView'),
    write: document.getElementById('portalWriteView'),
    mine: document.getElementById('portalMineView')
  };
  Object.entries(views).forEach(([key, section]) => {
    if (section) section.classList.toggle('active', key === activePortalTab);
  });

  if (activePortalTab === 'write') {
    prefillWriteFormIdentity();
    populateProductDropdown();
  }
}

function selectBusinessForReview(productName) {
  switchPortalTab('write');
  populateProductDropdown(productName);
}

function filterReviewsByBusiness(productName) {
  selectedPortalProduct = productName;
  switchPortalTab('browse');
  renderCommunityReviews(getReviews());
}

function prefillWriteFormIdentity() {
  const identity = getActiveCustomerIdentity();
  const nameInput = document.getElementById('portalCustomerName');
  const emailInput = document.getElementById('portalCustomerEmail');
  const preferredEmail = identity.accountEmail || identity.email;
  if (nameInput && !nameInput.value && identity.name && !identity.isAdmin) {
    nameInput.value = identity.name;
  }
  if (emailInput && !emailInput.value && preferredEmail && !identity.isAdmin) {
    emailInput.value = preferredEmail;
  }
}

function populateProductDropdown(selectedVal = '') {
  const select = document.getElementById('portalProductSelect');
  if (!select) return;

  const businesses = getRegisteredBusinesses();
  const currentValue = selectedVal || select.value || '';

  select.innerHTML = '<option value="">Select a registered business</option>' +
    businesses.map((b) => {
      const val = b.product || b.name;
      return `<option value="${escapeHtml(val)}">${escapeHtml(b.name)} (${escapeHtml(val)})</option>`;
    }).join('') +
    '<option value="__custom__">Other business / product...</option>';

  if (currentValue) {
    let found = false;
    for (let i = 0; i < select.options.length; i++) {
      if (select.options[i].value.toLowerCase() === currentValue.toLowerCase()) {
        select.selectedIndex = i;
        found = true;
        break;
      }
    }
    if (!found) {
      const opt = new Option(currentValue, currentValue, true, true);
      select.add(opt);
    }
  }
}

function renderCustomerHeaderAuth() {
  const container = document.getElementById('customerHeaderAuth');
  if (!container) return;
  const auth = typeof ensureAuth === 'function' ? ensureAuth() : { isLoggedIn: false };

  if (auth.isLoggedIn && auth.role === 'customer') {
    const initial = (auth.name || 'C').charAt(0).toUpperCase();
    container.innerHTML = `
      <div class="customer-session-pill">
        <span class="avatar customer-avatar">${escapeHtml(initial)}</span>
        <div class="customer-session-meta">
          <strong>${escapeHtml(auth.name || 'Customer')}</strong>
          <small>${escapeHtml(auth.email || '')}</small>
        </div>
      </div>
      <button type="button" class="secondary-btn" id="customerLogoutBtn">
        <i class="fa-solid fa-right-from-bracket"></i> Sign Out
      </button>
    `;
  } else if (auth.isLoggedIn && (auth.role || 'admin') === 'admin') {
    container.innerHTML = `
      <a href="/dashboard.html" class="primary-btn">
        <i class="fa-solid fa-gauge-high"></i> Admin Dashboard
      </a>
      <button type="button" class="secondary-btn" id="customerLogoutBtn">
        <i class="fa-solid fa-right-from-bracket"></i> Sign Out
      </button>
    `;
  } else {
    container.innerHTML = `
      <a href="/login" class="primary-btn">
        <i class="fa-solid fa-right-to-bracket"></i> Sign In
      </a>
    `;
  }

  document.getElementById('customerLogoutBtn')?.addEventListener('click', () => {
    setAuthState({ isLoggedIn: false });
    showToast('Signed out successfully.', 'success');
    renderCustomerPortal();
  });
}

function renderHeroStats(reviews) {
  const heroStats = document.getElementById('portalHeroStats');
  if (!heroStats) return;

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / totalReviews).toFixed(1)
    : '5.0';
  const businesses = getRegisteredBusinesses();

  heroStats.innerHTML = `
    <div class="hero-stat-card">
      <div class="hero-stat-icon tone-primary"><i class="fa-solid fa-building"></i></div>
      <div class="hero-stat-info">
        <strong>${businesses.length}</strong>
        <span>Registered Businesses</span>
      </div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-icon tone-amber"><i class="fa-solid fa-star"></i></div>
      <div class="hero-stat-info">
        <strong>${avgRating} / 5.0</strong>
        <span>Average Customer Rating</span>
      </div>
    </div>
    <div class="hero-stat-card">
      <div class="hero-stat-icon tone-green"><i class="fa-solid fa-comments"></i></div>
      <div class="hero-stat-info">
        <strong>${totalReviews}</strong>
        <span>Verified Reviews</span>
      </div>
    </div>
  `;
}

function renderRegisteredBusinesses(businesses, reviews) {
  const grid = document.getElementById('portalBusinessesGrid');
  const countBadge = document.getElementById('portalBusinessesCount');
  const categoryFilter = document.getElementById('companyCategoryFilter');
  if (!grid) return;

  const query = (document.getElementById('companySearchInput')?.value || '').trim().toLowerCase();
  const selectedCat = categoryFilter?.value || 'all';
  const sortOrder = document.getElementById('companySortFilter')?.value || 'rating';

  // Populate category filter options once
  if (categoryFilter && categoryFilter.options.length <= 1) {
    const categories = [...new Set(businesses.map((b) => b.category))].sort();
    categories.forEach((cat) => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categoryFilter.appendChild(opt);
    });
  }

  // Calculate stats for each business from reviews
  const businessesWithStats = businesses.map((biz) => {
    const bizReviews = reviews.filter((r) => (r.product || '').toLowerCase() === (biz.product || biz.name).toLowerCase());
    const count = bizReviews.length;
    const avgRating = count > 0
      ? (bizReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / count)
      : 4.8;
    return {
      ...biz,
      reviewCount: count,
      avgRating: avgRating
    };
  });

  // Filter
  let filtered = businessesWithStats.filter((b) => {
    const matchesQuery = !query ||
      b.name.toLowerCase().includes(query) ||
      b.category.toLowerCase().includes(query) ||
      b.description.toLowerCase().includes(query) ||
      (b.product && b.product.toLowerCase().includes(query));
    const matchesCat = selectedCat === 'all' || b.category === selectedCat;
    return matchesQuery && matchesCat;
  });

  // Sort
  if (sortOrder === 'rating') {
    filtered.sort((a, b) => b.avgRating - a.avgRating);
  } else if (sortOrder === 'reviews') {
    filtered.sort((a, b) => b.reviewCount - a.reviewCount);
  } else if (sortOrder === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (countBadge) countBadge.textContent = businesses.length;

  if (!filtered.length) {
    grid.innerHTML = `
      <div class="empty-state portal-empty-span" style="grid-column: 1 / -1; padding: 3rem; text-align: center;">
        <i class="fa-solid fa-building" style="font-size: 2.5rem; color: #5935F5; opacity: 0.5; margin-bottom: 1rem;"></i>
        <strong style="display: block; font-size: 1.15rem; color: #17143F;">No businesses match your search</strong>
        <p style="color: #5A5579; margin-top: 0.25rem;">Try adjusting your search terms or selecting another industry category.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map((biz) => {
    const stars = Math.round(biz.avgRating);
    return `
      <div class="business-card">
        <div>
          <div class="business-header">
            <div class="business-avatar">
              <i class="fa-solid fa-building"></i>
            </div>
            <div class="business-identity">
              <div class="business-name-row">
                <h3 class="business-name">${escapeHtml(biz.name)}</h3>
                <span class="business-verified-badge"><i class="fa-solid fa-circle-check"></i> Verified</span>
              </div>
              <span class="business-category">${escapeHtml(biz.category)}</span>
            </div>
          </div>
          <p class="business-desc">${escapeHtml(biz.description)}</p>
        </div>

        <div>
          <div class="business-stats-bar">
            <div class="business-rating">
              <span class="stars-gold">${'★'.repeat(stars)}</span>
              <span>${biz.avgRating.toFixed(1)}</span>
            </div>
            <span class="business-reviews-count">${biz.reviewCount} ${biz.reviewCount === 1 ? 'Review' : 'Reviews'}</span>
          </div>

          <div class="business-actions">
            <button type="button" class="primary-btn btn-biz-review" data-product="${escapeHtml(biz.product || biz.name)}">
              <i class="fa-solid fa-pen-to-square"></i> Review Business
            </button>
            <button type="button" class="secondary-btn btn-biz-view" data-product="${escapeHtml(biz.product || biz.name)}">
              <i class="fa-solid fa-comments"></i> View Reviews
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  grid.querySelectorAll('.btn-biz-review').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prod = btn.dataset.product;
      selectBusinessForReview(prod);
    });
  });

  grid.querySelectorAll('.btn-biz-view').forEach((btn) => {
    btn.addEventListener('click', () => {
      const prod = btn.dataset.product;
      filterReviewsByBusiness(prod);
    });
  });
}

function renderProductStrip(reviews) {
  const strip = document.getElementById('portalProductStrip');
  if (!strip) return;

  const counts = {};
  reviews.forEach((r) => {
    const p = r.product || 'General';
    counts[p] = (counts[p] || 0) + 1;
  });

  const products = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);

  let html = `
    <button type="button" class="product-chip ${selectedPortalProduct === 'all' ? 'active' : ''}" data-product="all">
      <i class="fa-solid fa-layer-group"></i> All Products (${reviews.length})
    </button>
  `;

  products.forEach((p) => {
    html += `
      <button type="button" class="product-chip ${selectedPortalProduct === p ? 'active' : ''}" data-product="${escapeHtml(p)}">
        ${escapeHtml(p)} (${counts[p]})
      </button>
    `;
  });

  strip.innerHTML = html;

  strip.querySelectorAll('.product-chip').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedPortalProduct = btn.dataset.product;
      currentPortalPage = 1;
      renderCommunityReviews(reviews);
      renderProductStrip(reviews);
    });
  });
}

function renderPortalReviewCard(review, userEmail = '', forceOwner = false) {
  const ratingVal = Number(review.rating) || 5;
  const isOwner = forceOwner || (userEmail && String(review.email || '').trim().toLowerCase() === String(userEmail).trim().toLowerCase());
  const initial = (review.customerName || 'C').charAt(0).toUpperCase();
  const colorIndex = (review.customerName || 'A').charCodeAt(0) % 6;
  const isResponded = review.responseStatus === 'responded' || Boolean(review.reply);

  const recomLabel = review.recommendation === 'Yes'
    ? 'Recommends'
    : review.recommendation === 'No'
      ? 'Does not recommend'
      : 'Neutral';
  const recomClass = review.recommendation === 'Yes'
    ? 'recom-yes'
    : review.recommendation === 'No'
      ? 'recom-no'
      : 'recom-maybe';

  return `
    <article class="card portal-review-card ${isOwner ? 'is-own-review' : ''}">
      <div class="portal-card-top">
        <div class="customer-cell">
          <div class="avatar-circle tone-${colorIndex}">${escapeHtml(initial)}</div>
          <div class="customer-info">
            <strong class="customer-name">
              ${escapeHtml(review.customerName || 'Customer')}
              ${isOwner ? '<span class="own-review-pill">Your Review</span>' : ''}
            </strong>
            <small class="customer-email">${formatDate(review.createdAt)}</small>
          </div>
        </div>
        <div class="portal-card-rating">
          <span class="stars-gold">${'★'.repeat(ratingVal)}</span><span class="stars-empty">${'☆'.repeat(5 - ratingVal)}</span>
          <strong>${ratingVal.toFixed(1)}</strong>
        </div>
      </div>

      <div class="portal-card-tags">
        <span class="product-badge"><i class="fa-solid fa-cube"></i> ${escapeHtml(review.product || 'General')}</span>
        <span class="category-badge"><i class="fa-solid fa-tag"></i> ${escapeHtml(review.category || 'Feedback')}</span>
        ${review.editedAt ? `<span class="edited-pill" title="Edited on ${formatDate(review.editedAt)}"><i class="fa-solid fa-pen"></i> Edited</span>` : ''}
      </div>

      <div class="portal-card-body">
        <h3>${escapeHtml(review.reviewTitle || 'Customer Review')}</h3>
        <p>${escapeHtml(review.reviewText || '')}</p>
      </div>

      <div class="portal-card-footer">
        <span class="recom-badge ${recomClass}">
          <i class="fa-solid ${review.recommendation === 'Yes' ? 'fa-thumbs-up' : review.recommendation === 'No' ? 'fa-thumbs-down' : 'fa-minus'}"></i>
          ${recomLabel}
        </span>
        <span class="status-pill status-${isResponded ? 'responded' : 'pending'}">
          <i class="fa-solid ${isResponded ? 'fa-check' : 'fa-clock'}"></i>
          ${isResponded ? 'Team Responded' : 'Pending Review'}
        </span>
      </div>

      ${review.reply ? `
        <div class="portal-admin-reply">
          <div class="portal-reply-header">
            <span><i class="fa-solid fa-user-shield"></i> Official Team Response</span>
            <small>${review.replyDate ? formatDate(review.replyDate) : 'Recently'}</small>
          </div>
          <p>${escapeHtml(review.reply)}</p>
        </div>
      ` : ''}

      ${isOwner ? `
        <div class="portal-card-actions">
          <button type="button" class="portal-action-btn portal-action-edit" data-edit-id="${escapeHtml(review.id)}">
            <i class="fa-solid fa-pen-to-square"></i> Edit
          </button>
          <button type="button" class="portal-action-btn portal-action-delete" data-delete-id="${escapeHtml(review.id)}">
            <i class="fa-solid fa-trash"></i> Delete
          </button>
        </div>
      ` : ''}
    </article>
  `;
}

function renderCommunityReviews(reviews) {
  const grid = document.getElementById('portalReviewsGrid');
  const pagination = document.getElementById('portalPagination');
  const categorySelect = document.getElementById('portalCategoryFilter');
  const browseCount = document.getElementById('portalBrowseCount');
  if (!grid || !pagination) return;

  if (browseCount) browseCount.textContent = reviews.length;

  const categories = [...new Set(reviews.map((r) => r.category).filter(Boolean))].sort();
  if (categorySelect) {
    const previous = categorySelect.value || 'all';
    categorySelect.innerHTML = '<option value="all">All categories</option>' +
      categories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('');
    categorySelect.value = categories.includes(previous) ? previous : 'all';
  }

  const query = (document.getElementById('portalSearchInput')?.value || '').trim().toLowerCase();
  const ratingFilter = document.getElementById('portalRatingFilter')?.value || 'all';
  const categoryFilter = categorySelect?.value || 'all';
  const responseFilter = document.getElementById('portalResponseFilter')?.value || 'all';
  const sortOrder = document.getElementById('portalSortFilter')?.value || 'newest';

  let filtered = [...reviews];

  if (selectedPortalProduct !== 'all') {
    filtered = filtered.filter((r) => (r.product || '').toLowerCase() === selectedPortalProduct.toLowerCase());
  }
  if (query) {
    filtered = filtered.filter((r) => (
      (r.customerName || '').toLowerCase().includes(query) ||
      (r.product || '').toLowerCase().includes(query) ||
      (r.category || '').toLowerCase().includes(query) ||
      (r.reviewTitle || '').toLowerCase().includes(query) ||
      (r.reviewText || '').toLowerCase().includes(query)
    ));
  }
  if (ratingFilter !== 'all') {
    filtered = filtered.filter((r) => String(r.rating) === ratingFilter);
  }
  if (categoryFilter !== 'all') {
    filtered = filtered.filter((r) => r.category === categoryFilter);
  }
  if (responseFilter === 'responded') {
    filtered = filtered.filter((r) => r.responseStatus === 'responded' || Boolean(r.reply));
  } else if (responseFilter === 'pending') {
    filtered = filtered.filter((r) => r.responseStatus !== 'responded' && !r.reply);
  }

  filtered.sort((a, b) => {
    if (sortOrder === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
    if (sortOrder === 'rating-high') return Number(b.rating) - Number(a.rating);
    if (sortOrder === 'rating-low') return Number(a.rating) - Number(b.rating);
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const totalPages = Math.ceil(filtered.length / PORTAL_PAGE_SIZE) || 1;
  currentPortalPage = Math.min(Math.max(1, currentPortalPage), totalPages);

  const startIdx = (currentPortalPage - 1) * PORTAL_PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PORTAL_PAGE_SIZE);
  const identity = getActiveCustomerIdentity();

  if (!pageItems.length) {
    grid.innerHTML = `
      <div class="empty-state portal-empty-span" style="grid-column: 1 / -1; padding: 3rem; text-align: center;">
        <i class="fa-solid fa-magnifying-glass" style="font-size: 2rem; color: #5935F5; opacity: 0.5; margin-bottom: 0.75rem;"></i>
        <strong style="display: block; font-size: 1.1rem; color: #17143F;">No reviews found</strong>
        <p style="color: #5A5579; margin-top: 0.25rem;">Try adjusting your search criteria or write a review to be the first.</p>
        <button type="button" class="primary-btn" id="emptyBrowseWriteBtn" style="margin-top: 1rem;">Write a Review</button>
      </div>
    `;
    document.getElementById('emptyBrowseWriteBtn')?.addEventListener('click', () => switchPortalTab('write'));
    pagination.innerHTML = '';
    return;
  }

  grid.innerHTML = pageItems.map((r) => renderPortalReviewCard(r, identity.email)).join('');

  // Attach card edit/delete handlers if shown
  attachReviewActionListeners(grid);

  // Pagination
  let pageButtons = '';
  for (let i = 1; i <= totalPages; i++) {
    pageButtons += `
      <button type="button" class="page-btn ${i === currentPortalPage ? 'active' : ''}" data-page="${i}">
        ${i}
      </button>
    `;
  }
  pagination.innerHTML = `
    <div class="pagination-info">Page ${currentPortalPage} of ${totalPages} (${filtered.length} reviews)</div>
    <div class="pagination-controls">${pageButtons}</div>
  `;

  pagination.querySelectorAll('.page-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPortalPage = Number(btn.dataset.page);
      renderCommunityReviews(reviews);
    });
  });
}

function renderMyReviews(reviews) {
  const grid = document.getElementById('portalMyReviewsGrid');
  const emailInput = document.getElementById('myReviewsEmailInput');
  const statusEl = document.getElementById('myReviewsEmailStatus');
  const mineCountEl = document.getElementById('portalMineCount');
  const identity = getActiveCustomerIdentity();
  const activeEmail = String(identity.email || '').trim().toLowerCase();

  const myReviews = activeEmail
    ? reviews
        .filter((r) => String(r.email || '').trim().toLowerCase() === activeEmail)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    : [];

  if (mineCountEl) mineCountEl.textContent = myReviews.length;
  if (emailInput && activeEmail && !emailInput.value) {
    emailInput.value = identity.email;
  }

  if (!grid || !statusEl) return;

  if (!activeEmail) {
    statusEl.textContent = 'Enter your email address below to view, edit, or delete reviews you submitted and view admin responses.';
    grid.innerHTML = `
      <div class="empty-state portal-empty-span" style="grid-column: 1 / -1; padding: 3rem; text-align: center;">
        <i class="fa-solid fa-user-check" style="font-size: 2.2rem; color: #5935F5; opacity: 0.5; margin-bottom: 0.75rem;"></i>
        <strong style="display: block; font-size: 1.15rem; color: #17143F;">Find your submitted reviews</strong>
        <p style="color: #5A5579; margin-top: 0.25rem;">Submit a review or enter your email address to manage your reviews.</p>
        <div class="empty-actions" style="margin-top: 1rem; display: flex; gap: 0.75rem; justify-content: center;">
          <button type="button" class="primary-btn" id="myEmptyWriteBtn">Write a Review</button>
          <button type="button" class="secondary-btn" id="trySampleEmailBtn">Preview ava@example.com</button>
        </div>
      </div>
    `;
    document.getElementById('myEmptyWriteBtn')?.addEventListener('click', () => switchPortalTab('write'));
    document.getElementById('trySampleEmailBtn')?.addEventListener('click', () => {
      lookupEmailOverride = 'ava@example.com';
      saveCustomerProfile({ name: 'Ava Thompson', email: 'ava@example.com' });
      if (emailInput) emailInput.value = 'ava@example.com';
      renderMyReviews(getReviews());
      renderCommunityReviews(getReviews());
    });
    return;
  }

  statusEl.innerHTML = `Showing <strong>${myReviews.length}</strong> review${myReviews.length === 1 ? '' : 's'} for <strong>${escapeHtml(identity.email)}</strong>. You can edit or delete your reviews below.`;

  if (!myReviews.length) {
    grid.innerHTML = `
      <div class="empty-state portal-empty-span" style="grid-column: 1 / -1; padding: 3rem; text-align: center;">
        <i class="fa-regular fa-star" style="font-size: 2.2rem; color: #5935F5; opacity: 0.5; margin-bottom: 0.75rem;"></i>
        <strong style="display: block; font-size: 1.15rem; color: #17143F;">No reviews found for ${escapeHtml(identity.email)}</strong>
        <p style="color: #5A5579; margin-top: 0.25rem;">Share your first review and it will appear right here with options to edit or delete anytime.</p>
        <button type="button" class="primary-btn" id="myFirstReviewBtn" style="margin-top: 1rem;">Write Your First Review</button>
      </div>
    `;
    document.getElementById('myFirstReviewBtn')?.addEventListener('click', () => switchPortalTab('write'));
    return;
  }

  grid.innerHTML = myReviews.map((review) => renderPortalReviewCard(review, identity.email, true)).join('');
  attachReviewActionListeners(grid);
}

function attachReviewActionListeners(container) {
  container.querySelectorAll('[data-edit-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reviewId = btn.dataset.editId;
      openEditReviewModal(reviewId);
    });
  });

  container.querySelectorAll('[data-delete-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const reviewId = btn.dataset.deleteId;
      handleDeleteReview(reviewId);
    });
  });
}

function openEditReviewModal(reviewId) {
  const reviews = getReviews();
  const review = reviews.find((r) => String(r.id) === String(reviewId));
  if (!review) return;

  const modal = document.getElementById('customerEditModal');
  const idInput = document.getElementById('editReviewId');
  const prodLabel = document.getElementById('editModalProduct');
  const titleInput = document.getElementById('editReviewTitle');
  const textInput = document.getElementById('editReviewText');
  const ratingInput = document.getElementById('editRatingValue');

  if (idInput) idInput.value = review.id;
  if (prodLabel) prodLabel.textContent = review.product || 'Product';
  if (titleInput) titleInput.value = review.reviewTitle || '';
  if (textInput) textInput.value = review.reviewText || '';
  if (ratingInput) ratingInput.value = review.rating || 5;

  updateEditStarVisuals(review.rating || 5);

  if (modal) modal.classList.add('open');
}

function updateEditStarVisuals(rating) {
  const modal = document.getElementById('customerEditModal');
  if (!modal) return;
  modal.querySelectorAll('#editStarRating .star-btn').forEach((btn) => {
    const starVal = Number(btn.dataset.value);
    const icon = btn.querySelector('i');
    if (icon) {
      if (starVal <= rating) {
        icon.className = 'fa-solid fa-star';
        btn.classList.add('active');
      } else {
        icon.className = 'fa-regular fa-star';
        btn.classList.remove('active');
      }
    }
  });
}

function handleDeleteReview(reviewId) {
  if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
    return;
  }

  const reviews = getReviews();
  const nextReviews = reviews.filter((r) => String(r.id) !== String(reviewId));
  saveReviews(nextReviews);

  // Send DELETE to server API in background
  fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, { method: 'DELETE' }).catch(() => {});

  showToast('Review deleted successfully.', 'success');
  renderCustomerPortal();
}

function initEditModal() {
  const modal = document.getElementById('customerEditModal');
  const form = document.getElementById('customerEditForm');
  const closeBtn = document.getElementById('closeCustomerEditModal');
  const cancelBtn = document.getElementById('cancelEditModalBtn');

  const closeModal = () => modal?.classList.remove('open');
  closeBtn?.addEventListener('click', closeModal);
  cancelBtn?.addEventListener('click', closeModal);
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  const starBtns = modal?.querySelectorAll('#editStarRating .star-btn');
  const ratingInput = document.getElementById('editRatingValue');
  starBtns?.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.value);
      if (ratingInput) ratingInput.value = val;
      updateEditStarVisuals(val);
    });
  });

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('editReviewId')?.value;
    const title = document.getElementById('editReviewTitle')?.value.trim();
    const text = document.getElementById('editReviewText')?.value.trim();
    const rating = Number(document.getElementById('editRatingValue')?.value || 5);

    if (!id || !title || !text) return;

    const reviews = getReviews();
    const idx = reviews.findIndex((r) => String(r.id) === String(id));
    if (idx !== -1) {
      const updated = {
        ...reviews[idx],
        reviewTitle: title,
        reviewText: text,
        rating: rating,
        editedAt: new Date().toISOString()
      };
      if (typeof analyzeSentiment === 'function') {
        const sentimentResult = analyzeSentiment(text, rating);
        updated.sentiment = sentimentResult.sentiment;
        updated.sentimentScore = sentimentResult.score;
      }
      reviews[idx] = updated;
      saveReviews(reviews);

      fetch(`/api/reviews/${encodeURIComponent(id)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewTitle: title, reviewText: text, rating })
      }).catch(() => {});

      closeModal();
      showToast('Your review has been updated!', 'success');
      renderCustomerPortal();
    }
  });
}

function initWriteReviewForm() {
  const form = document.getElementById('portalReviewForm');
  if (!form) return;

  const starButtons = form.querySelectorAll('#portalStarRating .star-btn');
  const ratingInput = document.getElementById('portalRatingValue');
  const ratingFeedbackText = document.getElementById('portalRatingFeedbackText');
  const titleInput = document.getElementById('portalReviewTitle');
  const reviewInput = document.getElementById('portalReviewText');
  const titleCounter = document.getElementById('portalTitleCounter');
  const reviewCounter = document.getElementById('portalReviewCounter');
  const livePill = document.getElementById('portalSentimentLivePill');
  const liveText = document.getElementById('portalSentimentLiveText');
  const productSelect = document.getElementById('portalProductSelect');
  const customProductGroup = document.getElementById('portalCustomProductGroup');
  const customProductInput = document.getElementById('portalCustomProduct');

  const ratingDescriptions = {
    1: 'Very poor — completely dissatisfied',
    2: 'Poor — did not meet expectations',
    3: 'Average — acceptable performance',
    4: 'Good — satisfied with the experience',
    5: 'Excellent — highly recommended!'
  };

  const updateStarVisuals = (rating) => {
    starButtons.forEach((btn) => {
      const val = Number(btn.dataset.value);
      const icon = btn.querySelector('i');
      if (icon) {
        if (val <= rating) {
          icon.className = 'fa-solid fa-star';
          btn.classList.add('active');
        } else {
          icon.className = 'fa-regular fa-star';
          btn.classList.remove('active');
        }
      }
    });
  };

  starButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const val = Number(btn.dataset.value);
      ratingInput.value = val;
      updateStarVisuals(val);
      if (ratingFeedbackText) {
        ratingFeedbackText.textContent = ratingDescriptions[val] || '';
        ratingFeedbackText.classList.add('selected');
      }
      triggerLiveSentiment();
    });
  });

  titleInput?.addEventListener('input', () => {
    if (titleCounter) titleCounter.textContent = titleInput.value.length;
  });

  const triggerLiveSentiment = () => {
    if (!reviewInput || !livePill || !liveText) return;
    const text = reviewInput.value.trim();
    if (reviewCounter) reviewCounter.textContent = reviewInput.value.length;
    if (!text) {
      livePill.className = 'sentiment-live-pill';
      liveText.textContent = 'Local sentiment: Start typing your review...';
      return;
    }
    const currentRating = Number(ratingInput.value) || 3;
    const analysis = typeof analyzeSentiment === 'function'
      ? analyzeSentiment(text, currentRating)
      : { sentiment: 'Neutral', score: 0 };
    livePill.className = `sentiment-live-pill tone-${analysis.sentiment.toLowerCase()}`;
    liveText.textContent = `Sentiment detected: ${analysis.sentiment} (Confidence: ${Math.abs(analysis.score).toFixed(1)})`;
  };

  reviewInput?.addEventListener('input', triggerLiveSentiment);

  productSelect?.addEventListener('change', () => {
    const isCustom = productSelect.value === '__custom__';
    customProductGroup?.classList.toggle('hidden', !isCustom);
    if (customProductInput) {
      customProductInput.required = isCustom;
      if (isCustom) customProductInput.focus();
    }
  });

  form.querySelectorAll('.recom-option').forEach((option) => {
    option.addEventListener('click', () => {
      form.querySelectorAll('.recom-option').forEach((opt) => opt.classList.remove('active'));
      option.classList.add('active');
      const radio = option.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    });
  });

  document.getElementById('portalCancelWriteBtn')?.addEventListener('click', () => {
    switchPortalTab('browse');
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const customerName = document.getElementById('portalCustomerName')?.value.trim();
    const email = document.getElementById('portalCustomerEmail')?.value.trim();
    const selectedProduct = productSelect?.value;
    const customProduct = customProductInput?.value.trim();
    const product = selectedProduct === '__custom__' ? customProduct : selectedProduct;
    const category = document.getElementById('portalCategorySelect')?.value;
    const rating = Number(ratingInput?.value) || 0;
    const reviewTitle = titleInput?.value.trim();
    const reviewText = reviewInput?.value.trim();
    const recommendation = form.querySelector('input[name="portalRecommendation"]:checked')?.value || 'Yes';

    if (!customerName || !email || !product || !category || !reviewTitle || !reviewText) {
      showToast('Please complete all required fields.', 'error');
      return;
    }
    if (rating === 0) {
      showToast('Please provide a star rating from 1 to 5.', 'error');
      return;
    }

    const btnText = form.querySelector('.btn-text');
    const btnLoader = form.querySelector('.btn-loader');
    btnText?.classList.add('hidden');
    btnLoader?.classList.remove('hidden');

    const analysis = typeof analyzeSentiment === 'function'
      ? analyzeSentiment(reviewText, rating)
      : { sentiment: 'Neutral', score: 0, topics: [], urgent: false, explanation: '', suggestion: '' };

    const nowIso = new Date().toISOString();
    const newReview = {
      id: `r-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`,
      createdAt: nowIso,
      customerName,
      email,
      product,
      rating,
      category,
      reviewTitle,
      reviewText,
      recommendation,
      sentiment: analysis.sentiment,
      sentimentScore: analysis.score,
      topics: analysis.topics || [],
      urgent: analysis.urgent || false,
      explanation: analysis.explanation || '',
      suggestion: analysis.suggestion || '',
      responseStatus: 'pending',
      reply: '',
      replyDate: ''
    };

    setTimeout(() => {
      const existingReviews = getReviews();
      const updatedReviews = [newReview, ...existingReviews];
      saveReviews(updatedReviews);

      fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newReview)
      }).catch(() => {});

      const notifications = typeof getNotifications === 'function' ? getNotifications() : [];
      notifications.unshift({
        id: `notif-${Date.now()}`,
        reviewId: newReview.id,
        title: 'New customer review',
        message: `${customerName} submitted a ${rating}-star review for ${product} via Customer Portal.`,
        unread: true,
        createdAt: nowIso
      });
      if (typeof saveNotifications === 'function') {
        saveNotifications(notifications);
      }

      btnText?.classList.remove('hidden');
      btnLoader?.classList.add('hidden');

      form.reset();
      customProductGroup?.classList.add('hidden');
      if (customProductInput) customProductInput.required = false;
      updateStarVisuals(0);
      ratingInput.value = '0';
      if (ratingFeedbackText) {
        ratingFeedbackText.textContent = 'Click a star to rate your experience';
        ratingFeedbackText.classList.remove('selected');
      }
      if (titleCounter) titleCounter.textContent = '0';
      if (reviewCounter) reviewCounter.textContent = '0';
      if (livePill) livePill.className = 'sentiment-live-pill';
      if (liveText) liveText.textContent = 'Local sentiment: Start typing your review...';
      form.querySelectorAll('.recom-option').forEach((opt, idx) => opt.classList.toggle('active', idx === 0));

      const lookupInput = document.getElementById('myReviewsEmailInput');
      lookupEmailOverride = email;
      if (lookupInput) lookupInput.value = email;

      renderCustomerPortal();
      switchPortalTab('mine');
      showToast('Thank you! Your review has been published.', 'success');
    }, 450);
  });
}

function renderCustomerPortal() {
  const reviews = getReviews();
  const businesses = getRegisteredBusinesses();
  renderCustomerHeaderAuth();
  renderHeroStats(reviews);
  renderRegisteredBusinesses(businesses, reviews);
  renderProductStrip(reviews);
  renderCommunityReviews(reviews);
  renderMyReviews(reviews);
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.body.dataset.page !== 'customer') return;

  document.querySelectorAll('.portal-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      switchPortalTab(tab.dataset.portalTab);
    });
  });

  document.getElementById('heroBrowseBizBtn')?.addEventListener('click', () => switchPortalTab('businesses'));
  document.getElementById('heroWriteReviewBtn')?.addEventListener('click', () => switchPortalTab('write'));
  document.getElementById('heroMyReviewsBtn')?.addEventListener('click', () => switchPortalTab('mine'));
  document.getElementById('mineWriteReviewBtn')?.addEventListener('click', () => switchPortalTab('write'));

  // Company search & filter listeners
  document.getElementById('companySearchInput')?.addEventListener('input', () => {
    renderRegisteredBusinesses(getRegisteredBusinesses(), getReviews());
  });
  document.getElementById('companyCategoryFilter')?.addEventListener('change', () => {
    renderRegisteredBusinesses(getRegisteredBusinesses(), getReviews());
  });
  document.getElementById('companySortFilter')?.addEventListener('change', () => {
    renderRegisteredBusinesses(getRegisteredBusinesses(), getReviews());
  });

  // My reviews lookup form
  document.getElementById('myReviewsLookupForm')?.addEventListener('submit', (event) => {
    event.preventDefault();
    const emailVal = document.getElementById('myReviewsEmailInput')?.value.trim() || '';
    lookupEmailOverride = emailVal;
    const auth = ensureAuth();
    if (!auth.isLoggedIn || auth.role !== 'customer') {
      const existingProfile = getCustomerProfile();
      saveCustomerProfile({ name: existingProfile.name || '', email: emailVal });
    }
    renderMyReviews(getReviews());
    renderCommunityReviews(getReviews());
  });

  const resetBrowse = () => {
    currentPortalPage = 1;
    renderCommunityReviews(getReviews());
  };

  document.getElementById('portalSearchInput')?.addEventListener('input', resetBrowse);
  document.getElementById('portalRatingFilter')?.addEventListener('change', resetBrowse);
  document.getElementById('portalCategoryFilter')?.addEventListener('change', resetBrowse);
  document.getElementById('portalResponseFilter')?.addEventListener('change', resetBrowse);
  document.getElementById('portalSortFilter')?.addEventListener('change', resetBrowse);

  initEditModal();
  initWriteReviewForm();
  renderCustomerPortal();

  const params = new URLSearchParams(window.location.search);
  const initialTab = params.get('tab') || window.location.hash.replace('#', '');
  if (['businesses', 'browse', 'write', 'mine'].includes(initialTab)) {
    switchPortalTab(initialTab);
  }

  let lastPortalSnapshot = `${localStorage.getItem(STORAGE_KEYS.reviews) || ''}|${localStorage.getItem(STORAGE_KEYS.auth) || ''}|${localStorage.getItem(STORAGE_KEYS.settings) || ''}`;
  const syncCustomerPortalIfChanged = () => {
    const nextSnapshot = `${localStorage.getItem(STORAGE_KEYS.reviews) || ''}|${localStorage.getItem(STORAGE_KEYS.auth) || ''}|${localStorage.getItem(STORAGE_KEYS.settings) || ''}`;
    if (nextSnapshot === lastPortalSnapshot) return;
    lastPortalSnapshot = nextSnapshot;
    const nextSettings = getSettings();
    if (typeof applyThemeSelection === 'function') {
      applyThemeSelection(document.body, document.getElementById('themeToggle'), nextSettings.theme || 'light');
    }
    renderCustomerPortal();
  };

  window.addEventListener('storage', (event) => {
    if (![STORAGE_KEYS.reviews, STORAGE_KEYS.settings, STORAGE_KEYS.auth].includes(event.key)) return;
    syncCustomerPortalIfChanged();
  });
  window.addEventListener('pageshow', syncCustomerPortalIfChanged);
  window.addEventListener('focus', syncCustomerPortalIfChanged);
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncCustomerPortalIfChanged();
  });
});
