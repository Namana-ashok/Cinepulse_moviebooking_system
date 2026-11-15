const dns = require('node:dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
require('dotenv').config();
const mongoose = require('mongoose');
const { Movie, Offer } = require('../models');
const movies = [
 { title:'Kalki 2898 AD', genre:'Sci-Fi · Action', rating:'8.4', badge:'IMAX', language:'Telugu', certificate:'U/A', duration:'3h 20m', image:'images/kalki.jpg.jpeg', description:'Kalki 2898 AD is a futuristic epic set in a dystopian world where the fate of humanity rests on the arrival of a powerful savior.' },
 { title:'Pushpa 2', genre:'Action · Drama', rating:'8.1', badge:'SUPERHIT', language:'Telugu', certificate:'U/A', duration:'3h 20m', image:'images/pushpa2.jpg.jpeg', description:'Pushpa returns stronger than ever in this action-packed sequel filled with power, revenge, and intense drama.' },
 { title:'Devara', genre:'Thriller · Action', rating:'7.6', badge:'NEW', language:'Telugu', certificate:'U/A', duration:'3h 20m', image:'images/devara.jpg.jpeg', description:'Devara: is an intense action drama set against the backdrop of coastal lands ruled by fear, power, and loyalty.' },
 { title:'Stree 2', genre:'Horror · Comedy', rating:'8.7', badge:'HIT', language:'Hindi', certificate:'U/A', duration:'2h 20m', image:'images/stree2.jpg.jpeg', description:'Stree 2 is a horror-comedy that brings back the mysterious spirit haunting a small town, creating chaos with new supernatural threats.' },
 { title:'Fighter', genre:'Action · War', rating:'7.2', badge:'', language:'Hindi', certificate:'U/A', duration:'3h 20m', image:'images/fighter.jpg.jpeg', description:'Fighter is an aerial action drama that follows a team of elite Indian Air Force pilots as they face dangerous missions and national threats.' },
 { title:'HanuMan', genre:'Superhero · Fantasy', rating:'8.0', badge:'NEW', language:'Telugu', certificate:'U/A', duration:'3h 10m', image:'images/hanuman.jpg.jpeg', description:'Hanu-Man is a mythological superhero film where an ordinary man gains the divine powers of Lord Hanuman to protect his village from evil forces.' }
];
const offers = [
 { code:'CINE100', title:'Student Discount', description:'Demo offer: ₹100 off eligible bookings. Offer validation only; discount is not yet applied to the booking total.', discountAmount:100, active:true },
 { code:'POPCORN', title:'Free Popcorn Combo', description:'Demo offer for selected premium bookings.', discountAmount:0, active:true },
 { code:'WEEKEND', title:'Weekend Blast', description:'Demo offer for selected weekend shows.', discountAmount:0, active:true }
];
(async () => {
 try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinepulse');
  for (const movie of movies) await Movie.updateOne({ title: movie.title }, { $set: movie }, { upsert: true });
  for (const offer of offers) await Offer.updateOne({ code: offer.code }, { $set: offer }, { upsert: true });
  console.log(`Seeded ${movies.length} movies and ${offers.length} demo offers.`);
 } catch (e) { console.error(e); process.exitCode = 1; }
 finally { await mongoose.disconnect(); }
})();
