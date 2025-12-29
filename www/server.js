const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'null'], // Allow local development and file:// protocol
    credentials: true
}));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// Twilio configuration - Replace with your actual credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC5c0340aec8461bf33167ec6604326d10';
const authToken = process.env.TWILIO_AUTH_TOKEN || '33a3609ff4abda1c66dfe638ce232153';
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '7439637739'; // Replace with your actual Twilio phone number

// Initialize Twilio client only if credentials are set
let client = null;
if (accountSid && accountSid !== 'your_twilio_account_sid' &&
    authToken && authToken !== 'your_twilio_auth_token') {
    try {
        client = twilio(accountSid, authToken);
        console.log('Twilio client initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Twilio client:', error.message);
        client = null;
    }
} else {
    console.log('Twilio credentials not set - SMS functionality will be disabled');
}

// SMS sending endpoint
app.post('/api/send-sms', async (req, res) => {
    try {
        const { to, message } = req.body;

        if (!to || !message) {
            return res.status(400).json({
                success: false,
                error: 'Phone number and message are required'
            });
        }

        // Check if Twilio is properly configured with real credentials
        if (!client || fromNumber === '+1234567890' || accountSid === 'AC5c0340aec8461bf33167ec6604326d10') {
            // Simulate SMS sending for testing/demo purposes
            console.log(`[SIMULATED SMS] To: ${to}, Message: "${message}"`);
            console.log('Note: Configure real Twilio credentials to send actual SMS messages');

            // Simulate successful response
            res.json({
                success: true,
                messageId: `simulated_${Date.now()}`,
                status: 'simulated',
                note: 'This is a simulated SMS. Configure Twilio credentials for real messaging.'
            });
            return;
        }

        // Validate phone number format (basic validation)
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(to.replace(/\s+/g, ''))) {
            return res.status(400).json({
                success: false,
                error: 'Invalid phone number format'
            });
        }

        // Send SMS using Twilio
        const smsResponse = await client.messages.create({
            body: message,
            from: fromNumber,
            to: to
        });

        console.log(`SMS sent successfully to ${to}, Message ID: ${smsResponse.sid}`);

        res.json({
            success: true,
            messageId: smsResponse.sid,
            status: smsResponse.status
        });

    } catch (error) {
        console.error('SMS sending error:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'Failed to send SMS'
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'SMS service is running' });
});

// Start server
app.listen(port, () => {
    console.log(`SMS service running on port ${port}`);
    console.log('Make sure to set your Twilio credentials as environment variables:');
    console.log('- TWILIO_ACCOUNT_SID');
    console.log('- TWILIO_AUTH_TOKEN');
    console.log('- TWILIO_PHONE_NUMBER');
});
