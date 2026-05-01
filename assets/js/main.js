const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const yearNode = document.querySelector('[data-year]');
const reviewsContainer = document.querySelector('[data-reviews]');
const bookingForm = document.querySelector('[data-booking-form]');
const bookingStatus = document.querySelector('[data-booking-status]');
const bookingSuccessCard = document.querySelector('[data-booking-success]');
const bookingSuccessMessage = document.querySelector('[data-booking-success-message]');
const bookingIdNode = document.querySelector('[data-booking-id]');
const bookingResetButton = document.querySelector('[data-booking-reset]');
const serviceSelect = document.querySelector('[data-service-select]');
const hairSelect = document.querySelector('[data-hair-select]');
const hairField = document.querySelector('[data-hair-field]');
const hairGuidance = document.querySelector('[data-hair-guidance]');
const addonFieldset = document.querySelector('[data-addon-fieldset]');
const addonOptionLabels = bookingForm ? Array.from(bookingForm.querySelectorAll('[data-addon-key]')) : [];
const preferredDateInput = bookingForm ? bookingForm.querySelector('[name="preferredDate"]') : null;
const preferredTimeInput = bookingForm ? bookingForm.querySelector('[name="preferredTime"]') : null;
const addonInputs = bookingForm ? Array.from(bookingForm.querySelectorAll('input[name="addons"]')) : [];
const policyChecks = bookingForm ? Array.from(bookingForm.querySelectorAll('[data-policy-check]')) : [];
const summaryService = document.querySelector('[data-summary-service]');
const summaryPrice = document.querySelector('[data-summary-price]');
const summaryDate = document.querySelector('[data-summary-date]');
const summaryTime = document.querySelector('[data-summary-time]');
const summaryHair = document.querySelector('[data-summary-hair]');
const summaryAddons = document.querySelector('[data-summary-addons]');
const dateGuidance = document.querySelector('[data-date-guidance]');
const sameDayNote = document.querySelector('[data-same-day-note]');
const adminForm = document.querySelector('[data-admin-form]');
const adminStatus = document.querySelector('[data-admin-status]');
const adminShell = document.querySelector('[data-admin-shell]');
const adminList = document.querySelector('[data-admin-list]');
const adminSummary = document.querySelector('[data-admin-summary]');
const adminFilter = document.querySelector('[data-admin-filter]');
const adminRefreshButton = document.querySelector('[data-admin-refresh]');
const adminLogoutButtons = document.querySelectorAll('[data-admin-logout]');
const adminKeyInput = document.querySelector('[data-admin-key-input]');

const ADMIN_STORAGE_KEY = 'rb_admin_key';
const BOOKING_START_TIME = '08:30';
const BOOKING_END_TIME = '18:00';
const CLOSED_DAYS = [0, 1];
const BRAIDING_SERVICES = ['Knotless', 'Stitch Braids', 'Braided Ponytail', 'Lemonade Braids', 'Fulani Braids'];
const ADDON_RULES = [
  { match: /^Knotless/, addons: ['boho', 'length', 'crimps'] },
  { match: /^Stitch Braids/, addons: ['length', 'crimps', 'natural-no-weave'] },
  { match: /^Braided Ponytail$/, addons: ['boho', 'length', 'crimps'] },
  { match: /^Lemonade Braids$/, addons: ['boho', 'length', 'crimps'] },
  { match: /^Fulani Braids$/, addons: ['boho', 'length', 'crimps'] },
  { match: /^Ponytail$/, addons: ['crimps'] },
  { match: /^Quickweave/, addons: ['crimps'] },
  { match: /^Half Freestyle Braids \/ Half Quick Weave$/, addons: ['crimps'] },
  { match: /^Sew-In/, addons: ['crimps', 'sewin-takedown'] }
];
let cachedBookings = [];

if (navToggle && siteNav) {
  const closeNav = () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
  };

  navToggle.addEventListener('click', (event) => {
    event.stopPropagation();
    const isOpen = siteNav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
    document.body.classList.toggle('nav-open', isOpen);
  });

  siteNav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      closeNav();
    });
  });

  document.addEventListener('click', (event) => {
    if (!siteNav.classList.contains('open')) return;
    if (siteNav.contains(event.target) || navToggle.contains(event.target)) return;
    closeNav();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeNav();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 760) {
      closeNav();
    }
  });
}

if (yearNode) {
  yearNode.textContent = new Date().getFullYear();
}

function setBookingStatus(message, state = '') {
  if (!bookingStatus) return;
  bookingStatus.className = 'form-status';
  if (state) bookingStatus.classList.add(state);
  bookingStatus.textContent = message;
}

function formatDisplayDate(value) {
  if (!value) return 'Not selected';
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDisplayTime(value) {
  if (!value) return 'Not selected';
  const [hours, minutes] = String(value).split(':');
  if (hours === undefined || minutes === undefined) return value;
  const parsed = new Date();
  parsed.setHours(Number(hours), Number(minutes), 0, 0);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function todayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isClosedDay(value) {
  if (!value) return false;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return false;
  return CLOSED_DAYS.includes(date.getDay());
}

function isSameDayRequest(value) {
  return Boolean(value) && value === todayString();
}

function isTimeWithinHours(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return false;
  return value >= BOOKING_START_TIME && value <= BOOKING_END_TIME;
}

function updateDateGuidance() {
  if (!dateGuidance || !preferredDateInput) return;

  if (!preferredDateInput.value) {
    dateGuidance.textContent = 'We book Tuesday through Saturday only.';
    return;
  }

  if (isClosedDay(preferredDateInput.value)) {
    dateGuidance.textContent = 'Sunday and Monday are blocked. Please choose Tuesday through Saturday.';
    return;
  }

  if (isSameDayRequest(preferredDateInput.value)) {
    dateGuidance.textContent = 'Same-day requests are allowed, but they stay pending until approved.';
    return;
  }

  dateGuidance.textContent = 'Selected date is within available booking days.';
}

function updateSameDayNote() {
  if (!sameDayNote || !preferredDateInput) return;
  sameDayNote.textContent = isSameDayRequest(preferredDateInput.value)
    ? 'This is a same-day request. It will be marked pending approval until the admin team approves it.'
    : 'Same-day bookings are allowed only if approved.';
}

function validateScheduleFields({ report = false } = {}) {
  if (!bookingForm || !preferredDateInput || !preferredTimeInput) return true;

  preferredDateInput.setCustomValidity('');
  preferredTimeInput.setCustomValidity('');

  if (preferredDateInput.value && isClosedDay(preferredDateInput.value)) {
    preferredDateInput.setCustomValidity('We are closed Sunday and Monday. Please choose Tuesday through Saturday.');
  }

  if (preferredTimeInput.value && !isTimeWithinHours(preferredTimeInput.value)) {
    preferredTimeInput.setCustomValidity('Please choose a time between 8:30 AM and 6:00 PM.');
  }

  updateDateGuidance();
  updateSameDayNote();

  const isValid = !preferredDateInput.validationMessage && !preferredTimeInput.validationMessage;
  if (report && !isValid) {
    if (preferredDateInput.validationMessage) {
      preferredDateInput.reportValidity();
    } else if (preferredTimeInput.validationMessage) {
      preferredTimeInput.reportValidity();
    }
  }

  return isValid;
}

function getSelectedAddons() {
  return addonInputs.filter(input => input.checked).map(input => input.value);
}

function serviceSupportsIncludedHair(serviceName) {
  return BRAIDING_SERVICES.some(label => serviceName.startsWith(label));
}

function allowedAddonKeysForService(serviceName) {
  const matched = ADDON_RULES.find(rule => rule.match.test(serviceName));
  return matched ? matched.addons : [];
}

function syncServiceDependentFields() {
  const selectedService = serviceSelect?.value || '';
  const supportsHair = serviceSupportsIncludedHair(selectedService);
  const allowedAddonKeys = allowedAddonKeysForService(selectedService);

  if (hairField && hairSelect) {
    hairField.hidden = !supportsHair;
    hairSelect.disabled = !supportsHair;
    hairSelect.required = false;
    if (!supportsHair) {
      hairSelect.value = '';
    }
  }

  if (addonFieldset) {
    addonFieldset.hidden = !selectedService || !allowedAddonKeys.length;
  }

  addonOptionLabels.forEach(label => {
    const key = label.getAttribute('data-addon-key') || '';
    const input = label.querySelector('input');
    const isAllowed = Boolean(selectedService) && allowedAddonKeys.includes(key);
    label.hidden = !isAllowed;
    if (input) {
      input.disabled = !isAllowed;
      if (!isAllowed) input.checked = false;
    }
  });

  if (hairGuidance) {
    if (!selectedService) {
      hairGuidance.textContent = 'Hair is included for braiding styles in natural colors 1, 1B, 2, and 4 only.';
    } else if (supportsHair) {
      hairGuidance.textContent = 'Included hair can be requested for eligible braiding styles in natural colors 1, 1B, 2, and 4. Any other color must be client provided.';
    } else {
      hairGuidance.textContent = 'This style does not use the included hair option. Bring your own hair if the style needs added hair.';
    }
  }
}

function updateBookingSummary() {
  if (!bookingForm) return;

  const selectedOption = serviceSelect?.options[serviceSelect.selectedIndex];
  const selectedService = selectedOption?.value || '';
  const selectedPrice = selectedOption?.dataset?.price || '';
  const suggestedHair = selectedOption?.dataset?.hair || 'Hair is included for braiding styles in natural colors 1, 1B, 2, and 4 only.';
  syncServiceDependentFields();
  const hairSupported = serviceSupportsIncludedHair(selectedService);
  const selectedHair = hairSupported ? (hairSelect?.value || '') : '';
  const addonList = getSelectedAddons();

  validateScheduleFields();

  if (summaryService) {
    summaryService.textContent = selectedService || 'Not selected';
  }

  if (summaryPrice) {
    summaryPrice.textContent = selectedPrice ? `${selectedPrice} starting` : 'Choose a style';
  }

  if (summaryDate) {
    summaryDate.textContent = formatDisplayDate(preferredDateInput?.value || '');
  }

  if (summaryTime) {
    summaryTime.textContent = formatDisplayTime(preferredTimeInput?.value || '');
  }

  if (summaryHair) {
    summaryHair.textContent = hairSupported ? (selectedHair || suggestedHair) : 'Not applicable for this style';
  }

  if (summaryAddons) {
    summaryAddons.textContent = addonList.length ? addonList.join(', ') : 'None selected';
  }

}

function showBookingSuccess(result = {}) {
  if (!bookingSuccessCard) return;
  bookingSuccessCard.hidden = false;
  if (bookingSuccessMessage) {
    bookingSuccessMessage.textContent = result.message || 'Your booking request was submitted successfully. We will review it and follow up with approval and deposit instructions.';
  }
  if (bookingIdNode) {
    bookingIdNode.textContent = result.bookingId || 'Pending';
  }
  bookingSuccessCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetBookingSuccess() {
  if (!bookingSuccessCard) return;
  bookingSuccessCard.hidden = true;
  if (bookingIdNode) bookingIdNode.textContent = 'Pending';
}

async function handleBookingSubmit(event) {
  event.preventDefault();
  if (!bookingForm) return;

  const submitButton = bookingForm.querySelector('button[type="submit"]');
  const formData = new FormData(bookingForm);
  const agreedToPolicies = policyChecks.length ? policyChecks.every(input => input.checked) : false;

  if (!bookingForm.checkValidity()) {
    bookingForm.reportValidity();
    return;
  }

  if (!validateScheduleFields({ report: true })) {
    return;
  }

  const payload = {
    name: String(formData.get('name') || '').trim(),
    phone: String(formData.get('phone') || '').trim(),
    email: String(formData.get('email') || '').trim(),
    preferredDate: String(formData.get('preferredDate') || '').trim(),
    preferredTime: String(formData.get('preferredTime') || '').trim(),
    service: String(formData.get('service') || '').trim(),
    hairIncluded: String(formData.get('hairIncluded') || '').trim(),
    lengthNotes: String(formData.get('lengthNotes') || '').trim(),
    addons: formData.getAll('addons'),
    notes: String(formData.get('notes') || '').trim(),
    website: String(formData.get('website') || '').trim(),
    agreePolicies: agreedToPolicies
  };

  try {
    resetBookingSuccess();
    setBookingStatus('Submitting your booking request...', 'loading');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'Submitting...';
    }

    const response = await fetch('/api/booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || 'Unable to save your booking request right now.');
    }

    bookingForm.reset();
    updateBookingSummary();
    showBookingSuccess(result);
    setBookingStatus(result.message || 'Your booking request was submitted successfully. We will review it and follow up with approval and deposit instructions.', 'success');
  } catch (error) {
    setBookingStatus(error.message || 'There was a problem submitting your request. Please try again.', 'error');
  } finally {
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Submit booking request';
    }
  }
}

if (bookingForm) {
  bookingForm.addEventListener('submit', handleBookingSubmit);

  if (preferredDateInput) {
    preferredDateInput.min = todayString();
  }

  if (preferredTimeInput) {
    preferredTimeInput.min = BOOKING_START_TIME;
    preferredTimeInput.max = BOOKING_END_TIME;
    preferredTimeInput.step = 900;
  }

  updateBookingSummary();

  bookingForm.addEventListener('input', updateBookingSummary);
  bookingForm.addEventListener('change', updateBookingSummary);

  if (bookingResetButton) {
    bookingResetButton.addEventListener('click', () => {
      bookingForm.reset();
      resetBookingSuccess();
      setBookingStatus('');
      updateBookingSummary();
      bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
}

async function loadReviews() {
  if (!reviewsContainer) return;

  try {
    const response = await fetch('/api/reviews');
    if (!response.ok) throw new Error('Failed to load reviews');
    const payload = await response.json();
    const reviews = Array.isArray(payload.reviews) ? payload.reviews : [];

    if (!reviews.length) {
      reviewsContainer.innerHTML = '<div class="review-card"><p>Approved reviews will show here once they are added.</p><strong>Coming soon</strong></div>';
      return;
    }

    reviewsContainer.innerHTML = reviews
      .map(review => `
        <article class="review-card">
          <p>“${review.text}”</p>
          <strong>${review.name}</strong>
        </article>
      `)
      .join('');
  } catch (error) {
    reviewsContainer.innerHTML = '<div class="review-card"><p>Approved reviews will show here once the reviews API is connected.</p><strong>Setup note</strong></div>';
  }
}

function getAdminKey() {
  return sessionStorage.getItem(ADMIN_STORAGE_KEY) || '';
}

function setAdminKey(value) {
  if (!value) {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
    return;
  }

  sessionStorage.setItem(ADMIN_STORAGE_KEY, value);
}

function setAdminStatus(message, state = '') {
  if (!adminStatus) return;
  adminStatus.className = 'form-status';
  if (state) adminStatus.classList.add(state);
  adminStatus.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function titleCase(value) {
  return String(value || '')
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function renderAdminSummary(bookings) {
  if (!adminSummary) return;

  const counts = bookings.reduce((acc, booking) => {
    const key = booking.status || 'new';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const pendingSameDay = bookings.filter(item => item.same_day_request && !item.same_day_approved).length;

  const summaryItems = [
    { label: 'Total requests', value: bookings.length },
    { label: 'New', value: counts['new'] || 0 },
    { label: 'Same-day pending', value: pendingSameDay },
    { label: 'Deposit requested', value: counts['deposit requested'] || 0 },
    { label: 'Confirmed', value: counts['confirmed'] || 0 }
  ];

  adminSummary.innerHTML = summaryItems
    .map(item => `
      <article class="stat-card admin-stat-card">
        <span>${escapeHtml(item.label)}</span>
        <strong>${escapeHtml(item.value)}</strong>
      </article>
    `)
    .join('');
}

function currentFilteredBookings() {
  const selectedStatus = adminFilter ? adminFilter.value : 'all';
  if (!selectedStatus || selectedStatus === 'all') {
    return cachedBookings;
  }

  return cachedBookings.filter(item => item.status === selectedStatus);
}

function bookingCardTemplate(booking) {
  const addonList = Array.isArray(booking.addons) && booking.addons.length
    ? booking.addons.map(item => `<span class="tag">${escapeHtml(item)}</span>`).join('')
    : '<span class="tag muted-tag">No add-ons</span>';

  const statusOptions = [
    'new',
    'same-day approval needed',
    'reviewing',
    'approved',
    'deposit requested',
    'confirmed',
    'completed',
    'declined'
  ]
    .map(status => `<option value="${escapeHtml(status)}" ${booking.status === status ? 'selected' : ''}>${escapeHtml(titleCase(status))}</option>`)
    .join('');

  const sameDayBadge = booking.same_day_request
    ? `<span class="tag admin-inline-flag ${booking.same_day_approved ? 'approved-flag' : 'warning-flag'}">${booking.same_day_approved ? 'Same-day approved' : 'Same-day approval needed'}</span>`
    : '';

  return `
    <article class="admin-booking-card">
      <div class="admin-booking-head">
        <div>
          <span class="eyebrow">Request #${escapeHtml(booking.id)}</span>
          <h3>${escapeHtml(booking.name)}</h3>
        </div>
        <span class="status-pill status-${escapeHtml((booking.status || 'new').replace(/\s+/g, '-'))}">${escapeHtml(titleCase(booking.status || 'new'))}</span>
      </div>

      <div class="admin-detail-grid">
        <div><strong>Service</strong><span>${escapeHtml(booking.service || '—')}</span></div>
        <div><strong>Preferred date</strong><span>${escapeHtml(booking.preferred_date || '—')}</span></div>
        <div><strong>Preferred time</strong><span>${escapeHtml(formatDisplayTime(booking.preferred_time || ''))}</span></div>
        <div><strong>Submitted</strong><span>${escapeHtml(formatDate(booking.created_at))}</span></div>
        <div><strong>Phone</strong><span>${escapeHtml(booking.phone || '—')}</span></div>
        <div><strong>Email</strong><span>${escapeHtml(booking.email || '—')}</span></div>
        <div><strong>Hair</strong><span>${escapeHtml(booking.hair_included || '—')}</span></div>
        <div><strong>Length / size</strong><span>${escapeHtml(booking.length_notes || '—')}</span></div>
        <div><strong>Approved date</strong><span>${escapeHtml(booking.approved_date || 'Not assigned')}</span></div>
        <div><strong>Approved time</strong><span>${escapeHtml(booking.approved_time ? formatDisplayTime(booking.approved_time) : 'Not assigned')}</span></div>
        <div><strong>Same-day</strong><span>${booking.same_day_request ? 'Yes' : 'No'}</span></div>
        <div><strong>Deposit</strong><span>${booking.status === 'deposit requested' || booking.status === 'confirmed' || booking.status === 'completed' ? '$25 requested' : 'Not requested yet'}</span></div>
      </div>

      ${sameDayBadge ? `<div class="admin-flag-row">${sameDayBadge}</div>` : ''}
      <div class="admin-addon-row">${addonList}</div>

      <div class="admin-notes-block">
        <strong>Client notes</strong>
        <p>${escapeHtml(booking.notes || 'No extra notes provided.')}</p>
      </div>

      <form class="admin-update-form admin-update-form-expanded" data-admin-update-form data-booking-id="${escapeHtml(booking.id)}">
        <div class="admin-update-grid">
          <label>
            Update status
            <select name="status">${statusOptions}</select>
          </label>
          <label>
            Approved date
            <input type="date" name="approvedDate" value="${escapeHtml(booking.approved_date || '')}" />
          </label>
          <label>
            Approved time
            <input type="time" name="approvedTime" value="${escapeHtml(booking.approved_time || '')}" />
          </label>
        </div>
        <label class="consent-row admin-consent-row">
          <input type="checkbox" name="sameDayApproved" ${booking.same_day_approved ? 'checked' : ''} ${booking.same_day_request ? '' : 'disabled'} />
          <span>Approve this as a same-day booking</span>
        </label>
        <label class="full-width-field">
          Internal notes
          <textarea name="adminNotes" rows="4" placeholder="Private approval notes, schedule updates, or deposit follow-up details.">${escapeHtml(booking.admin_notes || '')}</textarea>
        </label>
        <button class="cta-link outline" type="submit">Save booking update</button>
      </form>
    </article>
  `;
}

function renderAdminBookings() {
  if (!adminList) return;

  const filtered = currentFilteredBookings();

  if (!filtered.length) {
    adminList.innerHTML = '<article class="contact-card"><h3>No bookings found</h3><p class="section-copy">Nothing matches the selected filter right now.</p></article>';
    return;
  }

  adminList.innerHTML = filtered.map(bookingCardTemplate).join('');
}

async function fetchAdminBookings() {
  const key = getAdminKey();
  if (!key) {
    throw new Error('Enter your admin key to open the dashboard.');
  }

  const response = await fetch('/api/admin-bookings', {
    headers: {
      'x-admin-key': key
    }
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(result.error || 'Unable to load bookings.');
  }

  cachedBookings = Array.isArray(result.bookings) ? result.bookings : [];
  renderAdminSummary(cachedBookings);
  renderAdminBookings();
}

async function openAdminDashboard() {
  if (!adminShell) return;

  try {
    setAdminStatus('Loading bookings...', 'loading');
    await fetchAdminBookings();
    adminShell.classList.remove('is-hidden');
    setAdminStatus('Dashboard loaded.', 'success');
  } catch (error) {
    adminShell.classList.add('is-hidden');
    setAdminStatus(error.message || 'Unable to open the dashboard.', 'error');
    throw error;
  }
}

async function handleAdminSubmit(event) {
  event.preventDefault();
  if (!adminForm) return;

  const formData = new FormData(adminForm);
  const key = String(formData.get('adminKey') || '').trim();

  if (!key) {
    setAdminStatus('Enter your admin key first.', 'error');
    return;
  }

  setAdminKey(key);

  try {
    await openAdminDashboard();
  } catch {
    if (adminKeyInput) {
      adminKeyInput.focus();
      adminKeyInput.select();
    }
  }
}

async function updateBookingStatus(event) {
  const form = event.target.closest('[data-admin-update-form]');
  if (!form) return;

  event.preventDefault();

  const bookingId = Number(form.getAttribute('data-booking-id'));
  const statusField = form.querySelector('select[name="status"]');
  const approvedDateField = form.querySelector('input[name="approvedDate"]');
  const approvedTimeField = form.querySelector('input[name="approvedTime"]');
  const sameDayApprovedField = form.querySelector('input[name="sameDayApproved"]');
  const adminNotesField = form.querySelector('textarea[name="adminNotes"]');
  const button = form.querySelector('button[type="submit"]');
  const key = getAdminKey();

  if (!bookingId || !statusField || !key) {
    setAdminStatus('Admin access expired. Enter the key again.', 'error');
    return;
  }

  try {
    setAdminStatus('Saving booking details...', 'loading');
    if (button) {
      button.disabled = true;
      button.textContent = 'Saving...';
    }

    const response = await fetch('/api/admin-bookings', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': key
      },
      body: JSON.stringify({
        id: bookingId,
        status: statusField.value,
        approvedDate: approvedDateField?.value || '',
        approvedTime: approvedTimeField?.value || '',
        sameDayApproved: Boolean(sameDayApprovedField?.checked),
        adminNotes: adminNotesField?.value || ''
      })
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result.error || 'Unable to update this booking.');
    }

    cachedBookings = cachedBookings.map(item => (
      Number(item.id) === bookingId
        ? {
            ...item,
            status: statusField.value,
            approved_date: approvedDateField?.value || '',
            approved_time: approvedTimeField?.value || '',
            same_day_approved: Boolean(sameDayApprovedField?.checked),
            admin_notes: adminNotesField?.value || ''
          }
        : item
    ));

    renderAdminSummary(cachedBookings);
    renderAdminBookings();
    setAdminStatus(result.message || 'Booking details updated.', 'success');
  } catch (error) {
    setAdminStatus(error.message || 'Unable to update this booking.', 'error');
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = 'Save booking update';
    }
  }
}

function clearAdminAccess() {
  setAdminKey('');
  cachedBookings = [];
  if (adminShell) adminShell.classList.add('is-hidden');
  if (adminList) adminList.innerHTML = '';
  if (adminSummary) adminSummary.innerHTML = '';
  if (adminForm) adminForm.reset();
  setAdminStatus('Admin access cleared from this browser session.', 'success');
}

if (adminForm) {
  adminForm.addEventListener('submit', handleAdminSubmit);
}

if (adminFilter) {
  adminFilter.addEventListener('change', renderAdminBookings);
}

if (adminRefreshButton) {
  adminRefreshButton.addEventListener('click', async () => {
    try {
      await openAdminDashboard();
    } catch {
      return;
    }
  });
}

adminLogoutButtons.forEach(button => {
  button.addEventListener('click', clearAdminAccess);
});

document.addEventListener('submit', event => {
  if (event.target instanceof HTMLFormElement && event.target.matches('[data-admin-update-form]')) {
    updateBookingStatus(event);
  }
});

if (adminForm) {
  const savedKey = getAdminKey();
  if (savedKey && adminKeyInput) {
    adminKeyInput.value = savedKey;
    openAdminDashboard().catch(() => {
      return;
    });
  }
}

loadReviews();
