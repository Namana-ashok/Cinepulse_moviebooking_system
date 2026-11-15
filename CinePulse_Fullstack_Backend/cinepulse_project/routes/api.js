const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { User, Movie, Show, SeatReservation, Booking, FoodOrder, Offer } = require('../models');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

const THEATERS = ['PVR Cinemas', 'INOX', 'Cinepolis', 'Forum Mall', 'Garuda Mall', 'Royal Meenakshi Mall'];
const FOOD = [
  { id: 'popcorn', name: 'Classic Popcorn', price: 250 },
  { id: 'burger', name: 'Burger Combo', price: 350 },
  { id: 'nachos', name: 'Cheese Nachos', price: 280 },
  { id: 'coke', name: 'Coke', price: 120 }
];
const paymentConfigured = () => Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
const razorpayEnabled = () => paymentConfigured() && process.env.PAYMENT_MODE === 'razorpay';
const razorpayClient = () => new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
const validSeat = seat => /^[A-H](10|[1-9])$/.test(seat);
const priceFor = (count) => {
  const tickets = count * 250; const fee = count * 15; const gst = Math.round((tickets + fee) * 0.09);
  return { ticketPrice: tickets, convenienceFee: fee, gst, total: tickets + fee + gst };
};

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'CinePulse API', paymentMode: razorpayEnabled() ? 'razorpay-configured' : 'demo-only' }));
router.get('/movies', async (_req, res, next) => { try { res.json(await Movie.find({ active: true }).sort({ title: 1 })); } catch(e) { next(e); } });
router.get('/theaters', (_req, res) => res.json(THEATERS));
router.get('/food', (_req, res) => res.json(FOOD));
router.get('/offers', async (_req, res, next) => { try { res.json(await Offer.find({ active: true }).select('-_id code title description discountAmount')); } catch(e) { next(e); } });

router.post('/auth/register', async (req, res, next) => {
  try {
    const name = String(req.body.name || '').trim(); const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
    if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8) return res.status(400).json({ error: 'Enter a name, valid email, and password with at least 8 characters.' });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    res.status(201).json(makeSession(user));
  } catch(e) { if (e.code === 11000) return res.status(409).json({ error: 'An account with this email already exists.' }); next(e); }
});
router.post('/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase(); const password = String(req.body.password || '');
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: 'Incorrect email or password.' });
    res.json(makeSession(user));
  } catch(e) { next(e); }
});

router.post('/auth/change-password', requireAuth, async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res.status(400).json({
        error: 'Please fill in all password fields.'
      });
    }

    if (newPassword !== confirmNewPassword) {
      return res.status(400).json({
        error: 'New passwords do not match.'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'New password must contain at least 8 characters.'
      });
    }

    const user = await User.findById(req.user._id).select('+passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash
    );

    if (!isValid) {
      return res.status(401).json({
        error: 'Current password is incorrect.'
      });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({
      message: 'Password changed successfully!'
    });

  } catch (error) {
    next(error);
  }
});

function makeSession(user) {
  const token = jwt.sign({ sub: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: '7d' });
  return { token, user: { id: user._id, name: user.name, email: user.email } };
}
router.get('/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

router.get('/shows', async (req, res, next) => {
  try {
    const filter = { active: true };
    if (req.query.movie) filter.movie = req.query.movie;
    if (req.query.date) filter.date = req.query.date;
    const shows = await Show.find(filter).populate('movie', 'title image').sort({ date: 1, time: 1 });
    res.json(shows);
  } catch(e) { next(e); }
});
router.get('/shows/availability', async (req, res, next) => {
  try {
    const { movieId, theater, date, time } = req.query;
    if (!movieId || !THEATERS.includes(theater) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '')) return res.status(400).json({ error: 'Movie, cinema, date, and time are required.' });
    let show = await Show.findOne({ movie: movieId, theater, date, time });
    if (!show) show = await Show.create({ movie: movieId, theater, date, time });
    const occupied = await SeatReservation.find({ show: show._id, $or: [{ status: 'confirmed' }, { status: 'pending', expiresAt: { $gt: new Date() } }] }).select('seat -_id');
    return res.json({ showId: show._id, occupied: occupied.map(x => x.seat) });
  } catch(e) { next(e); }
});
router.get('/shows/:id/seats', async (req, res, next) => {
  try {
    const show = await Show.findById(req.params.id); if (!show) return res.status(404).json({ error: 'Show not found.' });
    const occupied = await SeatReservation.find({ show: show._id, $or: [{ status: 'confirmed' }, { status: 'pending', expiresAt: { $gt: new Date() } }] }).select('seat -_id');
    res.json({ showId: show._id, occupied: occupied.map(x => x.seat) });
  } catch(e) { next(e); }
});

router.post('/bookings', requireAuth, async (req, res, next) => {
  let booking;
  try {
    const { movieId, theater, date, time, seats, zone } = req.body;
    if (!movieId || !THEATERS.includes(theater) || !/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time || '') || !Array.isArray(seats) || seats.length < 1 || seats.length > 10 || !seats.every(validSeat) || new Set(seats).size !== seats.length) return res.status(400).json({ error: 'Booking details are invalid. Select 1–10 valid seats and a listed cinema/showtime.' });
    const movie = await Movie.findById(movieId); if (!movie) return res.status(404).json({ error: 'Movie not found.' });
    let show = await Show.findOne({ movie: movie._id, theater, date, time });
    if (!show) show = await Show.create({ movie: movie._id, theater, date, time });
    // Expired pending holds are removed before attempting a new unique seat reservation.
    await SeatReservation.deleteMany({ show: show._id, status: 'pending', expiresAt: { $lte: new Date() } });
    const totals = priceFor(seats.length);
    booking = await Booking.create({ bookingCode: `CP-${Date.now().toString().slice(-8)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`, user: req.user._id, show: show._id, movieTitle: movie.title, theater, date, time, zone: String(zone || 'Silent Zone'), seats, ...totals, status: 'pending_payment', paymentMode: razorpayEnabled() ? 'razorpay' : 'demo' });
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    try { await SeatReservation.insertMany(seats.map(seat => ({ show: show._id, seat, booking: booking._id, status: 'pending', expiresAt })), { ordered: true }); }
    catch (err) { await SeatReservation.deleteMany({ booking: booking._id }); await Booking.deleteOne({ _id: booking._id }); if (err.code === 11000) return res.status(409).json({ error: 'One or more seats were just booked. Please choose again.' }); throw err; }
    res.status(201).json({ booking, paymentMode: razorpayEnabled() ? 'razorpay' : 'demo', message: paymentConfigured() ? 'Booking held for payment.' : 'Demo mode: no real payment will be collected.' });
  } catch(e) { next(e); }
});

router.post('/payments/razorpay/order', requireAuth, async (req, res, next) => {
  try {
    if (!razorpayEnabled()) return res.status(503).json({ error: 'Razorpay is not enabled. Configure test keys and set PAYMENT_MODE=razorpay, or use demo mode.' });
    const booking = await Booking.findOne({ _id: req.body.bookingId, user: req.user._id, status: 'pending_payment' });
    if (!booking) return res.status(404).json({ error: 'Pending booking not found.' });
    const order = await razorpayClient().orders.create({ amount: booking.total * 100, currency: 'INR', receipt: booking.bookingCode, notes: { bookingId: booking._id.toString() } });
    booking.paymentOrderId = order.id; booking.paymentMode = 'razorpay'; await booking.save();
    res.json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency, bookingCode: booking.bookingCode, name: 'CinePulse' });
  } catch(e) { next(e); }
});
router.post('/payments/razorpay/verify', requireAuth, async (req, res, next) => {
  try {
    if (!razorpayEnabled()) return res.status(503).json({ error: 'Razorpay payment mode is not enabled.' });
    const { bookingId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const booking = await Booking.findOne({ _id: bookingId, user: req.user._id, status: 'pending_payment', paymentOrderId: razorpay_order_id });
    if (!booking) return res.status(404).json({ error: 'Pending booking/order not found.' });
    const expected = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest('hex');
    const a = Buffer.from(expected); const b = Buffer.from(String(razorpay_signature || ''));
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return res.status(400).json({ error: 'Payment signature verification failed.' });
    booking.paymentId = razorpay_payment_id; booking.status = 'confirmed'; booking.paidAt = new Date(); await booking.save();
    await SeatReservation.updateMany({ booking: booking._id }, { $set: { status: 'confirmed' }, $unset: { expiresAt: 1 } });
    res.json({ booking, message: 'Test/live payment signature verified and booking confirmed.' });
  } catch(e) { next(e); }
});
router.post('/payments/demo-confirm', requireAuth, async (req, res, next) => {
  try {
    if (razorpayEnabled()) return res.status(403).json({ error: 'Demo confirmation is disabled while payment keys are configured.' });
    const booking = await Booking.findOne({ _id: req.body.bookingId, user: req.user._id, status: 'pending_payment', paymentMode: 'demo' });
    if (!booking) return res.status(404).json({ error: 'Pending demo booking not found.' });
    booking.status = 'confirmed'; booking.paidAt = new Date(); await booking.save();
    await SeatReservation.updateMany({ booking: booking._id }, { $set: { status: 'confirmed' }, $unset: { expiresAt: 1 } });
    res.json({ booking, message: 'DEMO CONFIRMATION ONLY — no money was collected.' });
  } catch(e) { next(e); }
});
router.get('/bookings/mine', requireAuth, async (req, res, next) => { try { res.json(await Booking.find({ user: req.user._id }).sort({ createdAt: -1 })); } catch(e) { next(e); } });

router.post('/food-orders', requireAuth, async (req, res, next) => {
  try {
    const requested = req.body.items;
    if (!Array.isArray(requested) || requested.length === 0) return res.status(400).json({ error: 'Your food cart is empty.' });
    const items = requested.map(i => { const found = FOOD.find(f => f.id === i.id); const quantity = Number(i.quantity); if (!found || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) throw Object.assign(new Error('Invalid food item or quantity.'), { status: 400 }); return { name: found.name, quantity, unitPrice: found.price }; });
    const total = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const order = await FoodOrder.create({ user: req.user._id, items, total });
    res.status(201).json({ order, message: 'Food order saved. Payment is not included in this demo endpoint.' });
  } catch(e) { next(e); }
});
router.post('/offers/validate', async (req, res, next) => {
  try { const code = String(req.body.code || '').trim().toUpperCase(); const offer = await Offer.findOne({ code, active: true }); if (!offer) return res.status(404).json({ error: 'Offer code is invalid or inactive.' }); res.json({ offer }); }
  catch(e) { next(e); }
});

module.exports = router;
