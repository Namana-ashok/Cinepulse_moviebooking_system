const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false }
}, { timestamps: true });

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true, unique: true }, genre: String, rating: String,
  badge: String, language: String, certificate: String, duration: String,
  image: String, description: String, active: { type: Boolean, default: true }
}, { timestamps: true });

const showSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theater: { type: String, required: true }, date: { type: String, required: true },
  time: { type: String, required: true }, ticketPrice: { type: Number, default: 250 },
  convenienceFee: { type: Number, default: 15 }, gstRate: { type: Number, default: 0.09 },
  active: { type: Boolean, default: true }
}, { timestamps: true });
showSchema.index({ movie: 1, theater: 1, date: 1, time: 1 }, { unique: true });

const seatReservationSchema = new mongoose.Schema({
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  seat: { type: String, required: true }, booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  status: { type: String, enum: ['pending', 'confirmed'], default: 'pending' }, expiresAt: Date
}, { timestamps: true });
seatReservationSchema.index({ show: 1, seat: 1 }, { unique: true });

const bookingSchema = new mongoose.Schema({
  bookingCode: { type: String, unique: true, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  show: { type: mongoose.Schema.Types.ObjectId, ref: 'Show', required: true },
  movieTitle: String, theater: String, date: String, time: String, zone: String,
  seats: [String], ticketPrice: Number, convenienceFee: Number, gst: Number, total: Number,
  status: { type: String, enum: ['pending_payment', 'confirmed', 'cancelled'], default: 'pending_payment' },
  paymentMode: { type: String, enum: ['demo', 'razorpay'], default: 'demo' },
  paymentOrderId: String, paymentId: String, paidAt: Date
}, { timestamps: true });

const foodOrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{ name: String, quantity: { type: Number, min: 1 }, unitPrice: Number }],
  total: { type: Number, required: true }, status: { type: String, default: 'received' }
}, { timestamps: true });

const offerSchema = new mongoose.Schema({
  code: { type: String, unique: true }, title: String, description: String,
  discountAmount: { type: Number, default: 0 }, active: { type: Boolean, default: true }
});

module.exports = {
  User: mongoose.model('User', userSchema), Movie: mongoose.model('Movie', movieSchema),
  Show: mongoose.model('Show', showSchema), SeatReservation: mongoose.model('SeatReservation', seatReservationSchema),
  Booking: mongoose.model('Booking', bookingSchema), FoodOrder: mongoose.model('FoodOrder', foodOrderSchema),
  Offer: mongoose.model('Offer', offerSchema)
};
