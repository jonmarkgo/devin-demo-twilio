var path = require('path');
var express = require('express');
var morgan = require('morgan');
var urlencoded = require('body-parser').urlencoded;
var config = require('./config');
var twilio = require('twilio');

// Create Express web app with some useful middleware
var app = express();
app.use(express.static(path.join(__dirname, 'public')));
app.use(urlencoded({ extended: true }));
app.use(morgan('combined'));

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Store customer interactions in memory (for demo purposes)
const customerInteractions = new Map();

// Route to send prescription ready notification
app.post('/notify/prescription-ready', async (req, res) => {
    const { phoneNumber, prescriptionId } = req.body;
    try {
        const message = await client.messages.create({
            body: `CVS Pharmacy: Your prescription #${prescriptionId} is ready for pickup. Reply YES to confirm, or call us at 1-800-SHOP-CVS for assistance.`,
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        customerInteractions.set(phoneNumber, { prescriptionId, status: 'notified' });
        res.json({ success: true, messageId: message.sid });
    } catch (error) {
        console.error('Failed to send notification:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Route to handle customer responses
app.post('/message', async (req, res) => {
    const twiml = new twilio.twiml.MessagingResponse();
    const incomingMsg = req.body.Body.toLowerCase();
    const from = req.body.From;

    const customerData = customerInteractions.get(from);

    if (customerData) {
        if (incomingMsg === 'yes') {
            twiml.message('Thank you for confirming. Your prescription will be held at the pickup counter for 7 days.');
            customerData.status = 'confirmed';
        } else {
            twiml.message('Need help? Please call us at 1-800-SHOP-CVS or visit www.cvs.com/support');
        }
    } else {
        twiml.message('Welcome to CVS Pharmacy. For prescription status, please call 1-800-SHOP-CVS or visit www.cvs.com');
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

module.exports = app;
