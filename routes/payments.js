const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
const PUBLIC_URL = process.env.PUBLIC_URL || 'http://localhost:4000';

const auth = (req, res, next) => {
  try { req.user = jwt.verify(req.headers.authorization?.split(' ')[1], JWT_SECRET); next(); }
  catch (e) { res.status(401).json({ message: 'Unauthorized' }); }
};

// Create Stripe Checkout Session for $15 lifetime VIP
router.post('/checkout/lifetime', auth, async (req, res) => {
  try {
    if (!stripe) return res.status(500).json({ message: 'Stripe not configured' });
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: 'TeenZoom Lifetime VIP' },
          unit_amount: 1500
        },
        quantity: 1
      }],
      success_url: `${PUBLIC_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${PUBLIC_URL}/payment-cancel.html`,
      metadata: { userId: req.user.id, type: 'lifetime_vip' }
    });
    res.json({ url: session.url });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Stripe error' }); }
});

// Webhook (simple) – configure Stripe to post here
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = req.body;
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      if (userId) {
        const user = await User.findById(userId);
        if (user) {
          user.vipLifetime = true;
          await user.save();
        }
      }
    }
    res.json({ received: true });
  } catch (e) { console.error(e); res.status(400).send('Webhook error'); }
});

module.exports = router;
