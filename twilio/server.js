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
const accountSid = process.env.TWILIO_ACCOUNT_SID || 'AC04c5fb8070c426028ffe42e5ea4c2716';
const authToken = process.env.TWILIO_AUTH_TOKEN || 'e2e765bba4ab1f782758250b32e951f1';
const client = twilio(accountSid, authToken);

// Middleware
app.use(bodyParser.json());

const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID || "VAcb9e34fabc4b41d34cb20c69d2b60590"; // Ensure this matches your actual Verify Service SID

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


app.post('/send-transaction-message', async (req, res) => {
    const { phoneNumber } = req.body;  // You can hardcode the number if necessary
    console.log(req.body)
    try {
        const message = await client.messages.create({
            body: req.body.message,  // Message content
            messagingServiceSid: "MGdea3d4d2775ffa58bc2e79dcd437047f", // Add your Messaging Service SID
            to: phoneNumber || '+918637489746',  // Recipient number
        });

        console.log("Transaction message sent:", message.sid);
        return res.status(200).send({ message: 'Transaction message sent successfully!', messageSid: message.sid });
    } catch (error) {
        console.error("Error sending transaction message:", error);
        return res.status(500).send({ message: 'Failed to send transaction message', error });
    }
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
