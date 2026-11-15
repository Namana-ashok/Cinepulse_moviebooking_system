// CinePulse API integration. Frontend is served by Express at the same origin.
const API_BASE = '/api';
let authToken = localStorage.getItem('cinepulseToken') || '';
let currentUser = JSON.parse(localStorage.getItem('cinepulseUser') || 'null');
let pendingBooking = null;
let selectedDateISO = new Date().toISOString().slice(0, 10);
async function apiRequest(path, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Request failed. Please try again.');
  return payload;
}
function saveSession(session) {
  authToken = session.token; currentUser = session.user;
  localStorage.setItem('cinepulseToken', authToken);
  localStorage.setItem('cinepulseUser', JSON.stringify(currentUser));
  const navBtn = document.getElementById('navProfileBtn');
  if (navBtn) { navBtn.innerHTML = '👤'; navBtn.classList.add('profile-btn'); navBtn.onclick = toggleProfileDropdown; }
}
function showError(error) { alert(error?.message || 'Something went wrong.'); }
function to24Hour(time) {
  const match = String(time).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return time;
  let hour = Number(match[1]); const minute = match[2]; const meridiem = match[3].toUpperCase();
  if (meridiem === 'PM' && hour !== 12) hour += 12;
  if (meridiem === 'AM' && hour === 12) hour = 0;
  return `${String(hour).padStart(2, '0')}:${minute}`;
}
function theaterApiName(name) {
  if (/^PVR/i.test(name)) return 'PVR Cinemas';
  if (/^INOX/i.test(name)) return 'INOX';
  if (/^Cinepolis/i.test(name)) return 'Cinepolis';
  if (/Forum Mall/i.test(name)) return 'Forum Mall';
  if (/Garuda Mall/i.test(name)) return 'Garuda Mall';
  if (/Royal Meenakshi Mall/i.test(name)) return 'Royal Meenakshi Mall';
  return name;
}
function formatDateForBooking(iso) { return iso; }
function initializeDateTabs() {
  const tabs = [...document.querySelectorAll('.date-tab')];
  if (!tabs.length) return;
  const today = new Date(); today.setHours(0,0,0,0);
  tabs.forEach((tab, index) => {
    const d = new Date(today); d.setDate(today.getDate() + index);
    tab.dataset.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    tab.querySelector('.day').textContent = d.toLocaleDateString('en-IN', { weekday: 'short' });
    tab.querySelector('.num').textContent = d.getDate();
    tab.classList.toggle('active', index === 0);
  });
  selectedDateISO = tabs[0].dataset.date;
}
async function loadBackendMovies() {
  try {
    const data = await apiRequest('/movies');
    if (data.length) { movies.splice(0, movies.length, ...data); renderMovies(); }
  } catch (error) { console.warn('Using bundled movie data until API is available:', error.message); }
}
// ── DATA ──
  const movies = [
  {
    title: 'Kalki 2898 AD',
    genre: 'Sci-Fi · Action',
    rating: '8.4',
    badge: 'IMAX',
    poster: 'p2',
    language: 'Telugu',
    certificate: "U/A",
    duration: "3h 20m",
    image: 'images/kalki.jpg.jpeg',
    description: 'Kalki 2898 AD is a futuristic epic set in a dystopian world where the fate of humanity rests on the arrival of a powerful savior.'
  },
 {
  title: 'Pushpa 2',
  genre: 'Action · Drama',
  rating: '8.1',
  badge: 'SUPERHIT',
  poster: 'p2',
  language: 'Telugu',
  certificate: "U/A",
  duration: "3h 20m",
  image: 'images/pushpa2.jpg.jpeg',
  description: 'Pushpa returns stronger than ever in this action-packed sequel filled with power, revenge, and intense drama.'
},
  {
    title: 'Devara',
    genre: 'Thriller · Action',
    rating: '7.6',
    badge: 'NEW',
    badgeClass: 'badge-new',
    poster: 'p2',
    language: 'Telugu',
    certificate: "U/A",
    duration: "3h 20m",
    image: 'images/devara.jpg.jpeg',
    description: 'Devara: is an intense action drama set against the backdrop of coastal lands ruled by fear, power, and loyalty.'
  },
  {
    title: 'Stree 2',
    genre: 'Horror · Comedy',
    rating: '8.7',
    badge: 'HIT',
    poster: 'p2',
    language: 'Hindi',
    certificate: "U/A",
    duration: "2h 20m",
    image: 'images/stree2.jpg.jpeg',
    description: 'Stree 2 is a horror-comedy that brings back the mysterious spirit haunting a small town, creating chaos with new supernatural threats.'
  },
  {
    title: 'Fighter',
    genre: 'Action · War',
    rating: '7.2',
    badge: '',
    poster: 'p2',
    language: 'Hindi',
    certificate: "U/A",
    duration: "3h 20m",
    image: 'images/fighter.jpg.jpeg',
    description: 'Fighter is an aerial action drama that follows a team of elite Indian Air Force pilots as they face dangerous missions and national threats.'
  },
  {
    title: 'HanuMan',
    genre: 'Superhero · Fantasy',
    rating: '8.0',
    badge: 'NEW',
    badgeClass: 'badge-new',
    poster: 'p2',
    language: 'Telugu',
    certificate: "U/A",
    duration: "3h 10m",
    image: 'images/hanuman.jpg.jpeg',
    description: 'Hanu-Man is a mythological superhero film where an ordinary man gains the divine powers of Lord Hanuman to protect his village from evil forces.'
  }
];
const theaters = [

  "PVR Cinemas",
  "INOX",
  "Cinepolis",

  "Forum Mall",
  "Garuda Mall",
  "Royal Meenakshi Mall"

];
let currentBooking = {
  movie: null,
  theater: null,
  time: null,
  date: null
};
let selectedZone = "Silent Zone";
let foodCart = [];

let foodTotal = 0;

  // ── RENDER MOVIES ──
  function renderMovies(movieList = movies) {
    const grid = document.getElementById('moviesGrid');
    if (!grid) return;
    grid.innerHTML = movieList.map((m, i) => `
      <div class="movie-card" data-title="${m.title}" style="animation-delay:${i*0.07}s" onclick="openMovieByTitle(this.dataset.title)">
        <div class="movie-poster">
          <img src="${m.image || ''}" class="movie-poster-img" alt="${m.title}" onerror="this.style.opacity='.25'">
          <div class="movie-overlay"><button class="book-now-overlay" onclick="event.stopPropagation();openMovieByTitle(this.closest('.movie-card').dataset.title)">Book Now</button></div>
        </div>
        <div class="movie-info"><div class="movie-name">${m.title}</div><div class="movie-meta">
          <span class="movie-rating">★ ${m.rating || '—'}</span><span>${m.genre || ''}</span>
          ${m.badge ? `<span class="movie-badge">${m.badge}</span>` : ''}
        </div></div>
      </div>`).join('');
  }
  function openMovieByTitle(title) { const index = movies.findIndex(m => m.title === title); if (index >= 0) openMovie(index); }
  function openMovie(index) {
    const movie = movies[index]; if (!movie) return;
    currentBooking.movie = movie;
    document.getElementById('detailTitle').textContent = movie.title;
    document.getElementById('detailDescription').textContent = movie.description || '';
    document.getElementById('detailPoster').src = movie.image || '';
    document.getElementById('detailPoster').alt = movie.title;
    showPage('movie');
  }

  // ── PAGE NAVIGATION ──
  function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById('page-' + name).classList.add('active');
    window.scrollTo(0,0);
    if (name === 'seats') buildSeatGrid();
  }
  // ── SCROLL TO MOVIES ──
function scrollToMovies() {

  showPage('home');

  const moviesSection =
    document.querySelector('.movies-section');

  moviesSection.scrollIntoView({
    behavior: 'smooth'
  });
}
// ── SCROLL TO OFFERS ──
function scrollToOffers() {

  showPage('home');

  document.querySelector('.offers-section')
    .scrollIntoView({
      behavior: 'smooth'
    });
}
// ── SCROLL TO FOOD ──
function scrollToFood() {

  showPage('home');

  document.querySelector('.food-section')
    .scrollIntoView({
      behavior: 'smooth'
    });
}

  // ── DATE SELECT ──
  function selectDate(el) {
    document.querySelectorAll('.date-tab').forEach(d => d.classList.remove('active'));
    el.classList.add('active'); selectedDateISO = el.dataset.date || new Date().toISOString().slice(0,10);
  }
  // ── SHOWTIME SELECT ──
  function selectShow(el, time) {
    document.querySelectorAll('.showtime-btn').forEach(btn => btn.classList.remove('active'));
    el.classList.add('active');
    const theaterText = el.closest('.theater-row').querySelector('.theater-name').textContent.trim();
    currentBooking.theater = theaterApiName(theaterText);
    currentBooking.theaterLabel = theaterText;
    currentBooking.time = to24Hour(time);
    currentBooking.date = selectedDateISO || new Date().toISOString().slice(0,10);
    currentBooking.displayDate = `${new Date(`${currentBooking.date}T00:00:00`).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'short',year:'numeric'})}`;
    updateBookingSummary();
    setTimeout(async () => { showPage('seats'); await refreshSeatAvailability(); }, 250);
  }
  // ── SEAT GRID ──
  const ROWS = ['A','B','C','D','E','F','G','H'];
  const COLS = 10;
  const BOOKED = new Set();
  let selectedSeats = new Set();
  async function refreshSeatAvailability() {
    if (!currentBooking.movie?._id || !currentBooking.theater || !currentBooking.date || !currentBooking.time) return;
    try {
      const data = await apiRequest(`/shows/availability?movieId=${encodeURIComponent(currentBooking.movie._id)}&theater=${encodeURIComponent(currentBooking.theater)}&date=${encodeURIComponent(currentBooking.date)}&time=${encodeURIComponent(currentBooking.time)}`);
      BOOKED.clear(); (data.occupied || []).forEach(seat => BOOKED.add(seat));
      selectedSeats.clear(); buildSeatGrid();
    } catch (error) { console.warn('Could not refresh seats:', error.message); }
  }

  function buildSeatGrid() {
    const grid = document.getElementById('seatGrid');
    grid.innerHTML = '';
    ROWS.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'seat-row';
      rowEl.innerHTML = `<div class="seat-row-label">${row}</div>`;
      for (let c = 1; c <= COLS; c++) {
        if (c === 6) {
          const aisle = document.createElement('div');
          aisle.className = 'seat-aisle';
          rowEl.appendChild(aisle);
        }
        const id = row + c;

const btn = document.createElement('button');

let status = BOOKED.has(id)
  ? 'booked'
  : (selectedSeats.has(id)
      ? 'selected'
      : 'available');

let zoneClass = '';

if (row <= 'C') {

  zoneClass = 'silent-seat';
}

else if (row <= 'F') {

  zoneClass = 'family-seat';
}

else {

  zoneClass = 'friends-seat';
}

btn.className =
  `seat ${status} ${zoneClass}`;
        btn.textContent = id;
        btn.disabled = BOOKED.has(id);
        btn.dataset.id = id;
        btn.onclick = () => toggleSeat(id, btn);
        rowEl.appendChild(btn);
      }
      grid.appendChild(rowEl);
    });
    updateSummary();
  }

  function toggleSeat(id, btn) {
    // ───── ZONE RESTRICTION ─────

const row = id.charAt(0);

if (
  selectedZone === 'Silent Zone' &&
  !['A', 'B', 'C'].includes(row)
) {

  alert('🤫 Please select seats only in Silent Zone');

  return;
}

if (
  selectedZone === 'Family Zone' &&
  !['D', 'E', 'F'].includes(row)
) {

  alert('👨‍👩‍👧 Please select seats only in Family Zone');

  return;
}

if (
  selectedZone === 'Friends Zone' &&
  !['G', 'H'].includes(row)
) {

  alert('🎉 Recliner seats are available only in Friends Zone');

  return;
}
    if (selectedSeats.has(id)) {
      selectedSeats.delete(id);
      btn.className = 'seat available';
    } else {
      selectedSeats.add(id);
      btn.className = 'seat selected';
    }
    updateSummary();
  }

  function updateSummary() {
    const count = selectedSeats.size;
    const price = 250;
    const conv = count > 0 ? 15 * count : 0;
    const total = count * price + conv;
    document.getElementById('selectedSeatsText').textContent = count > 0 ? [...selectedSeats].sort().join(', ') : 'None';
    document.getElementById('seatCount').textContent = count;
    document.getElementById('convFee').textContent = '₹' + conv;
    document.getElementById('totalAmount').textContent = '₹' + total;
    const btn = document.getElementById('proceedBtn');
    btn.disabled = count === 0;
    btn.style.opacity = count > 0 ? '1' : '0.4';
    btn.style.cursor = count > 0 ? 'pointer' : 'not-allowed';
  }

 async function proceedToPayment() {
  if (!authToken) { alert('Please sign in or create an account before booking.'); showPage('signin'); return; }
  if (!currentBooking.movie?._id || !currentBooking.theater || !currentBooking.date || !currentBooking.time || selectedSeats.size === 0) {
    alert('Please select a movie, showtime, date, and at least one seat.'); return;
  }
  try {
    const result = await apiRequest('/bookings', { method:'POST', body: JSON.stringify({
      movieId: currentBooking.movie._id, theater: currentBooking.theater, date: formatDateForBooking(currentBooking.date),
      time: currentBooking.time, seats: [...selectedSeats], zone: selectedZone
    }) });
    pendingBooking = result.booking;
    document.getElementById('paymentSeats').textContent = [...selectedSeats].sort().join(', ');
    document.getElementById('ticketPrice').textContent = '₹' + result.booking.ticketPrice;
    document.getElementById('payConvFee').textContent = '₹' + result.booking.convenienceFee;
    document.getElementById('payGst').textContent = '₹' + result.booking.gst;
    document.getElementById('payTotal').textContent = '₹' + result.booking.total;
    updatePaymentPage();
    const note = document.querySelector('.secure-note');
    if (note) note.textContent = result.paymentMode === 'demo' ? 'DEMO PAYMENT ONLY — no money will be collected.' : 'Payment provider configured in test/live mode.';
    showPage('payment');
  } catch (error) { showError(error); }
}
  // ── PAYMENT ──
  function switchPayment(type, tab) {
    document.querySelectorAll('.payment-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('upiSection').classList.toggle('visible', type === 'upi');
    document.getElementById('cardSection').classList.toggle('visible', type === 'card');
  }
  function selectUpi(el) {
    document.querySelectorAll('.upi-app').forEach(a => a.classList.remove('selected'));
    el.classList.add('selected');
  }

  async function confirmPayment() {
    if (!pendingBooking?._id) { alert('Please start a booking first.'); return; }
    const button = document.querySelector('.btn-pay'); if (button) button.disabled = true;
    try {
      let response;
      const health = await apiRequest('/health');
      if (health.paymentMode === 'razorpay-configured') {
        const order = await apiRequest('/payments/razorpay/order', { method:'POST', body: JSON.stringify({ bookingId: pendingBooking._id }) });
        if (!window.Razorpay) await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src='https://checkout.razorpay.com/v1/checkout.js'; script.onload=resolve; script.onerror=()=>reject(new Error('Could not load Razorpay Checkout. Check your internet connection.')); document.head.appendChild(script); });
        await new Promise((resolve, reject) => {
          const checkout = new Razorpay({ key:order.keyId, amount:order.amount, currency:order.currency, name:'CinePulse', description:`Tickets for ${currentBooking.movie.title}`, order_id:order.orderId,
            handler: async function (payment) { try { response = await apiRequest('/payments/razorpay/verify', { method:'POST', body:JSON.stringify({ bookingId:pendingBooking._id, razorpay_order_id:payment.razorpay_order_id, razorpay_payment_id:payment.razorpay_payment_id, razorpay_signature:payment.razorpay_signature }) }); resolve(); } catch(e) { reject(e); } },
            modal:{ ondismiss:()=>reject(new Error('Payment window closed. Your booking is not confirmed; the temporary seat hold expires in 10 minutes.')) }, prefill:{ name:currentUser?.name || '', email:currentUser?.email || '' }, theme:{ color:'#e11d48' }
          }); checkout.open();
        });
      } else {
        response = await apiRequest('/payments/demo-confirm', { method:'POST', body:JSON.stringify({ bookingId:pendingBooking._id }) });
        alert('DEMO ONLY: booking confirmed in the local database. No money was collected.');
      }
      const booking = response.booking;
      document.getElementById('confirmMovieName').textContent = booking.movieTitle || (currentBooking.movie?.title || 'Select a movie');
      document.getElementById('confirmPoster').src = currentBooking.movie.image || '';
      document.getElementById('confirmTheater').textContent = currentBooking.theaterLabel || (currentBooking.theaterLabel || currentBooking.theater || 'Select a cinema');
      document.getElementById('confirmDate').textContent = booking.date;
      document.getElementById('confirmTime').textContent = booking.time;
      document.getElementById('confirmZone').textContent = booking.zone || selectedZone;
      const seatWrap = document.getElementById('confirmSeats'); seatWrap.innerHTML = '';
      (booking.seats || [...selectedSeats]).forEach(seat => { const span=document.createElement('span'); span.className='ticket-seat-badge'; span.textContent=seat; seatWrap.appendChild(span); });
      document.getElementById('confirmAmount').textContent = '₹' + booking.total;
      document.getElementById('bookingId').textContent = booking.bookingCode;
      showPage('confirm');
    } catch (error) { showError(error); }
    finally { if (button) button.disabled = false; }
  }

  // ── SEARCH ──
  function doSearch() {

  const q = document
    .getElementById('searchInput')
    .value
    .toLowerCase()
    .trim();

  // Empty Search
  if (!q) {

    renderMovies(movies);

    return;
  }

  // Search Movies
  const filteredMovies = movies.filter(movie =>

    movie.title.toLowerCase().includes(q) ||

    movie.genre.toLowerCase().includes(q)

  );

  // Search Theaters
  const matchedTheaters = theaters.filter(theater =>

    theater.toLowerCase().includes(q)

  );

  // FOUND RESULTS
  if (filteredMovies.length > 0) {

  renderMovies(filteredMovies);

  showPage('home');
}

else if (matchedTheaters.length > 0) {

  showPage('cinemas');
}

  // NOT FOUND
  else {

    showSearchNotFound();
  }
}
// ── AUTHENTICATION ──
async function loginUser() {
  const fields = [...document.querySelectorAll('#page-signin .auth-field input')];
  const email = fields[0]?.value.trim(); const password = fields[1]?.value || '';
  try { const session = await apiRequest('/auth/login', { method:'POST', body:JSON.stringify({ email, password }) }); saveSession(session); alert(`Welcome back, ${session.user.name}!`); showPage('home'); }
  catch(error) { showError(error); }
}
async function registerUser() {
  const fields = [...document.querySelectorAll('#page-signup .auth-field input')];
  const name = fields[0]?.value.trim(); const email = fields[1]?.value.trim(); const password = fields[2]?.value || ''; const confirm = fields[3]?.value || '';
  if (password !== confirm) { alert('Passwords do not match.'); return; }
  try { const session = await apiRequest('/auth/register', { method:'POST', body:JSON.stringify({ name, email, password }) }); saveSession(session); alert('Account created and signed in successfully.'); showPage('home'); }
  catch(error) { showError(error); }
}
function updateBookingSummary() {

  document.getElementById('summaryMovie')
    .textContent =
      (currentBooking.movie?.title || 'Select a movie');

  document.getElementById('summaryTheater')
    .textContent =
      (currentBooking.theaterLabel || currentBooking.theater || 'Select a cinema');

  document.getElementById('summaryDateTime')
    .textContent =
      `${currentBooking.displayDate || currentBooking.date || ''} · ${currentBooking.time || ''}`;

  document.getElementById('summaryZone')
    .textContent =
      selectedZone;
}
function updatePaymentPage() {

  // Movie Name
  document.getElementById("paymentMovieName").innerText =
    (currentBooking.movie?.title || 'Select a movie');

  // Theater
  document.getElementById("paymentTheater").innerText =
    (currentBooking.theaterLabel || currentBooking.theater || 'Select a cinema');

  // Date & Time
  document.getElementById("paymentDateTime").innerText =
    (currentBooking.displayDate || currentBooking.date || '') + " · " + (currentBooking.time || '');

  // Seats
  document.getElementById("paymentSeats").innerText =
    [...selectedSeats].join(", ");

  // Poster Image
  document.getElementById("paymentPoster").src =
    currentBooking.movie?.image || ''; 
    // Experience Zone
  document.getElementById("paymentZone").textContent =
    selectedZone;  
}
function changeZone() {

  selectedZone =
    document.getElementById('zoneSelect').value;

  const note =
    document.getElementById('zoneNote');

  if (selectedZone === 'Silent Zone') {

    note.textContent =
      '95% users rated this zone peaceful ✨';
  }

  else if (selectedZone === 'Family Zone') {

    note.textContent =
      'Best for family movie experience 👨‍👩‍👧';
  }

  else {

    note.textContent =
      'High-energy fun crowd 🎉';
  }
  updateBookingSummary();
}
// ───── FOOD CART ─────

function addFood(name, price) {
  foodCart.push({ name, price }); foodTotal += price;
  document.getElementById('foodCount').textContent = foodCart.length;
  document.getElementById('foodTotal').textContent = foodTotal;
  alert(name + ' added to cart 🍿');
}
async function buyFoodItems() {
  if (!foodCart.length) { alert('Your cart is empty 🍿'); return; }
  if (!authToken) { alert('Please sign in before placing a food order.'); showPage('signin'); return; }
  const ids = { 'Classic Popcorn':'popcorn', 'Burger Combo':'burger', 'Cheese Nachos':'nachos', 'Coke':'coke' };
  const grouped = {};
  foodCart.forEach(item => { const id=ids[item.name]; if (id) grouped[id]=(grouped[id]||0)+1; });
  try {
    const result = await apiRequest('/food-orders', { method:'POST', body:JSON.stringify({ items:Object.entries(grouped).map(([id,quantity])=>({id,quantity})) }) });
    document.getElementById('foodPopupText').textContent = `Food order saved successfully! Order ID: ${result.order._id}. Total: ₹${result.order.total}. Food payment is not included in this demo.`;
    document.getElementById('foodPopup').classList.add('active');
  } catch(error) { showError(error); }
}
function closeFoodPopup() {
  document.getElementById('foodPopup').classList.remove('active'); foodCart=[]; foodTotal=0;
  document.getElementById('foodCount').textContent=0; document.getElementById('foodTotal').textContent=0;
}

// ───── DOWNLOAD POPUP ─────

function downloadTicket() {

  document.getElementById('downloadPopup')
    .classList.add('active');
}

function closeDownloadPopup() {

  document.getElementById('downloadPopup')
    .classList.remove('active');
}
// ───── SEARCH POPUP ─────

function showSearchNotFound() {

  document.getElementById('searchPopup')
    .classList.add('active');
}

function closeSearchPopup() {

  document.getElementById('searchPopup')
    .classList.remove('active');

  document.getElementById('searchInput')
    .value = '';

  renderMovies(movies);
}
// ───── PROFILE DROPDOWN ─────

function toggleProfileDropdown() {

  document
    .getElementById('profileDropdown')
    .classList.toggle('active');
}
function openOffer(type) {

  const title =
    document.getElementById('offerTitle');

  const heading =
    document.getElementById('offerDetailHeading');

  const text =
    document.getElementById('offerDetailText');

  const image =
    document.getElementById('offerDetailImg');

  // CASHBACK
  if (type === 'cashback') {

    title.textContent =
      '20% Cashback';

    heading.textContent =
      'Get 20% Instant Cashback';

    text.textContent =
      'Use HDFC Credit Cards and get instant cashback on all premium movie bookings. Valid till May 30 across all cinemas.';

    image.src =
      'images/download.png';
  }

  // POPCORN
  else if (type === 'popcorn') {

    title.textContent =
      'Free Popcorn Combo';

    heading.textContent =
      'Free Combo With Premium Seats';

    text.textContent =
      'Book 2 premium recliner tickets and enjoy a free popcorn and coke combo worth ₹499.';

    image.src =
      'images/popcorn.jfif.jpeg';
  }

  // STUDENT
  else if (type === 'student') {

    title.textContent =
      'Student Discount';

    heading.textContent =
      'Flat ₹100 Student Discount';

    text.textContent =
      'Students can avail ₹100 off on weekday bookings using valid student ID card verification.';

    image.src =
      'images/studentoffer.png';
  }

  // WEEKEND
  else if (type === 'weekend') {

    title.textContent =
      'Weekend Blast';

    heading.textContent =
      'Buy 1 Get 1 Free';

    text.textContent =
      'Enjoy Buy 1 Get 1 free tickets on selected theaters every Saturday and Sunday. Limited seats available.';

    image.src =
      'images/weekendblast.jfif.jpeg';
  }

  showPage('offer');
}

function applyOffer() {

  alert('Offer Applied Successfully 🎉');

  showPage('home');
}
function openPartyPopup() {

  document.getElementById('partyPopup')
    .classList.add('active');
}

function closePartyPopup() {

  document.getElementById('partyPopup')
    .classList.remove('active');
}

function createWatchParty() {

  const name =
    document.getElementById('partyName')
      .value;

  const count =
    parseInt(
      document.getElementById('partyCount')
        .value
    );

  const zone =
    document.getElementById('partyZone')
      .value;

  if (!name || !count) {

    alert('Please fill all fields');

    return;
  }

  selectedZone = zone.trim();

  selectedSeats.clear();

  let startRow = 'G';

  if (zone === 'Silent Zone') {

    startRow = 'A';
  }

  else if (zone === 'Family Zone') {

    startRow = 'D';
  }

  let startSeat = 3;

  for (let i = 0; i < count; i++) {

    selectedSeats.add(
      startRow + (startSeat + i)
    );
  }

  buildSeatGrid();

  updateSummary();
  updateBookingSummary();

  const code =
    'CP-WATCH-' +
    Math.floor(Math.random() * 9000);

  document.getElementById('partyCodeText')
    .textContent =
      'Party Code: ' + code;

  document.getElementById('partySeatsText')
    .textContent =
      'Reserved Seats: ' +
      [...selectedSeats].join(', ');

  document.getElementById('partyResult')
    .classList.add('active');

  closePartyPopup();

  alert('Watch Party Created 🎉');
}