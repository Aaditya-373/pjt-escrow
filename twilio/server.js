// server.js
const express = require('express');
const twilio = require('twilio');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // Ensure you have installed dotenv

const app = express();
const corsOptions = {
    origin: '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
    credentials: true,
};

app.use(cors(corsOptions));
const port = 5000;

// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC6617c8f318e05ec6ebfc30cf901c0c70';
const authToken = process.env.TWILIO_AUTH_TOKEN || '6c6e6adbf220c4deb436f654bb7ac032';
const client = twilio(accountSid, authToken);

// Middleware
app.use(bodyParser.json());

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "VA5f7086c15670e103cea73eee1d7c8acf"; // Ensure this matches your actual Verify Service SID

// Endpoint to send OTP
app.post('/send-otp', async (req, res) => {
    const { phoneNumber } = req.body;

    try {
        const verification = await client.verify.v2.services(verifyServiceSid)
            .verifications
            .create({
                to: phoneNumber,
                channel: 'sms',
            });
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
            .create({
                to: phoneNumber,
                code: otp,
            });

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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
