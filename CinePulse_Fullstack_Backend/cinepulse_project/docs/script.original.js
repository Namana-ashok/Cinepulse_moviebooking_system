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
    grid.innerHTML = movieList.map((m, i) => `
      <div class="movie-card" style="animation-delay:${i*0.07}s" onclick="openMovie(${i})">
        <div class="movie-poster">
          <img src="${m.image}" class="movie-poster-img" alt="${m.title}">
          <div class="movie-overlay"><button class="book-now-overlay" onclick="openMovie(${i})">Book Now</button></div>
        </div>
        <div class="movie-info">
          <div class="movie-name">${m.title}</div>
          <div class="movie-meta">
            <span class="movie-rating">★ ${m.rating}</span>
            <span>${m.genre}</span>
            ${m.badge ? `<span class="movie-badge ${m.badgeClass||''}">${m.badge}</span>` : ''}
          </div>
        </div>
      </div>
    `).join('');
  }
  // ── OPEN MOVIE ──
// ── OPEN MOVIE ──
function openMovie(index) {

  const movie = movies[index];

  currentBooking.movie = movie;

  document.getElementById('detailTitle').textContent =
    movie.title;

  document.getElementById('detailDescription').textContent =
    movie.description;

  document.getElementById('detailPoster').src =
    movie.image;

  document.getElementById('detailPoster').alt =
    movie.title;

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
    el.classList.add('active');
  }

  // ── SHOWTIME SELECT ──
  function selectShow(el, time) {

  document.querySelectorAll('.showtime-btn')
    .forEach(btn => btn.classList.remove('active'));

  el.classList.add('active');

  const theater =
    el.closest('.theater-row')
      .querySelector('.theater-name')
      .textContent;

  currentBooking.theater = theater;

  currentBooking.time = time;
const activeDate =
  document.querySelector('.date-tab.active');

const day =
  activeDate.querySelector('.day').textContent;

const num =
  activeDate.querySelector('.num').textContent;

currentBooking.date =
  `${day} ${num} May 2026`;

  updateBookingSummary();

  setTimeout(() => {
    showPage('seats');
  }, 400);
}
  // ── SEAT GRID ──
  const ROWS = ['A','B','C','D','E','F','G','H'];
  const COLS = 10;
  const BOOKED = new Set(['A2','A7','B4','C1','C8','D3','D5','E6','F2','F9','G4','H1','H7']);
  let selectedSeats = new Set();

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

 function proceedToPayment() {

    const seats = [...selectedSeats].sort().join(', ');

    const count = selectedSeats.size;

    const conv = 15 * count;

    const gst = Math.round((count * 250 + conv) * 0.09);

    const total = count * 250 + conv + gst;

    document.getElementById('paymentSeats').textContent = seats;

    document.getElementById('ticketPrice').textContent =
      '₹' + (count * 250);

    document.getElementById('payConvFee').textContent =
      '₹' + conv;

    document.getElementById('payGst').textContent =
      '₹' + gst;

    document.getElementById('payTotal').textContent =
      '₹' + total;

    updatePaymentPage();
    
    showPage('payment');
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

  function confirmPayment() {

  // Movie Name
  document.getElementById('confirmMovieName')
    .textContent = currentBooking.movie.title;

  // Poster
  document.getElementById('confirmPoster')
    .src = currentBooking.movie.image;

  // Theater
  document.getElementById('confirmTheater')
    .textContent = currentBooking.theater;

  // Date
  document.getElementById('confirmDate')
    .textContent = currentBooking.date;

  // Time
  document.getElementById('confirmTime')
    .textContent = currentBooking.time;
    document.getElementById('confirmZone')
  .textContent = selectedZone;

  // Seats
  const seatWrap =
    document.getElementById('confirmSeats');

  seatWrap.innerHTML = '';

  selectedSeats.forEach(seat => {

    seatWrap.innerHTML += `
      <span class="ticket-seat-badge">
        ${seat}
      </span>
    `;
  });

  // Amount
  document.getElementById('confirmAmount')
    .textContent =
      document.getElementById('payTotal')
        .textContent;

  // Random Booking ID
  document.getElementById('bookingId')
    .textContent =
      'CP-2026-' +
      Math.floor(Math.random() * 90000 + 10000);

  // Show confirmation page
  showPage('confirm');
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
// ── LOGIN ──
function loginUser() {

  const navBtn =
    document.getElementById('navProfileBtn');

  navBtn.innerHTML = '👤';

  navBtn.classList.add('profile-btn');

  navBtn.onclick = toggleProfileDropdown;

  showPage('home');
}
// ── REGISTER ──
function registerUser() {
  alert("Account Created Successfully!");
  showPage('signin');
}
function updateBookingSummary() {

  document.getElementById('summaryMovie')
    .textContent =
      currentBooking.movie.title;

  document.getElementById('summaryTheater')
    .textContent =
      currentBooking.theater;

  document.getElementById('summaryDateTime')
    .textContent =
      `${currentBooking.date} · ${currentBooking.time}`;

  document.getElementById('summaryZone')
    .textContent =
      selectedZone;
}
function updatePaymentPage() {

  // Movie Name
  document.getElementById("paymentMovieName").innerText =
    currentBooking.movie.title;

  // Theater
  document.getElementById("paymentTheater").innerText =
    currentBooking.theater;

  // Date & Time
  document.getElementById("paymentDateTime").innerText =
    currentBooking.date + " · " + currentBooking.time;

  // Seats
  document.getElementById("paymentSeats").innerText =
    [...selectedSeats].join(", ");

  // Poster Image
  document.getElementById("paymentPoster").src =
    currentBooking.movie.image;
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

  foodCart.push(name);

  foodTotal += price;

  document.getElementById('foodCount')
    .textContent = foodCart.length;

  document.getElementById('foodTotal')
    .textContent = foodTotal;

  alert(name + " added to cart 🍿");
}
// ───── FOOD PURCHASE ─────

function buyFoodItems() {

  if (foodCart.length === 0) {

    alert("Your cart is empty 🍿");

    return;
  }

  document.getElementById('foodPopupText')
    .innerHTML = `

      ${foodCart.length} items ordered successfully 🎉
      <br><br>
      Total Amount: ₹${foodTotal}

    `;

  document.getElementById('foodPopup')
    .classList.add('active');
}

function closeFoodPopup() {

  document.getElementById('foodPopup')
    .classList.remove('active');

  foodCart = [];

  foodTotal = 0;

  document.getElementById('foodCount')
    .textContent = 0;

  document.getElementById('foodTotal')
    .textContent = 0;
}

// ── INIT ──
renderMovies();


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