// server.js
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const port = 5000;

// Middleware
app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(bodyParser.json());

// Twilio credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;
    try {
        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({ to: phoneNumber, channel: 'sms' });
        console.log("OTP sent:", verification.status);
        return res.status(200).send({ message: 'OTP sent successfully!', status: verification.status });
    } catch (error) {
        console.error("Error sending OTP:", error);
        return res.status(500).send({ message: 'Failed to send OTP', error });
    }
});

// Endpoint to verify OTP
app.post('/verify-otp', async (req, res) => {
    const { phoneNumber, otp } = req.body;
    try {
        const verificationCheck = await client.verify.v2.services(verifyServiceSid)
            .verificationChecks
            .create({ to: phoneNumber, code: otp });
        if (verificationCheck.status === 'approved') {
            return res.status(200).send({ message: 'OTP verified successfully!' });
        } else {
            return res.status(400).send({ message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error("Error verifying OTP:", error);
        return res.status(500).send({ message: 'Failed to verify OTP', error });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
