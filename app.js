require("dotenv").config();  // Load environment variables from .env file

const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => {
        console.log("MongoDB connected");
    })
    .catch((err) => {
        console.log("Error connecting to MongoDB: ", err);
    });

// Contact form schema and model
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    message: String,
});

const Contact = mongoose.model("Contact", contactSchema);

// Set up Nodemailer transport using environment variables
const transporter = nodemailer.createTransport({
    service: "gmail", // You can use other services like SendGrid, SMTP, etc.
    auth: {
        user: process.env.EMAIL_USER,  // Admin's email
        pass: process.env.EMAIL_PASS,   // Admin's email password or App Password
    },
});

// Function to send the email
const sendEmail = (contactData) => {
    const mailOptions = {
        from: process.env.EMAIL_USER, // Admin's email
        to: process.env.EMAIL_USER,  // Replace with admin's email
        subject: `New Contact Form Submission: ${contactData.subject}`,
        text: `You have received a new message from the contact form.\n\nName: ${contactData.name}\nEmail: ${contactData.email}\nSubject: ${contactData.subject}\nMessage: ${contactData.message}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log("Error sending email: ", error);
        } else {
            console.log("Email sent: " + info.response);
        }
    });
};

// Route to handle form submission
app.post("/submitForm", async (req, res) => {
    const { name, email, subject, message } = req.body;

    try {
        // Save the contact form data to MongoDB
        const newContact = new Contact({
            name,
            email,
            subject,
            message,
        });

        // Wait for the save operation to complete
        await newContact.save();

        // Send an email notification to the admin
        sendEmail({ name, email, subject, message });

        // Respond with success message
        res.status(200).json({ success: true, message: "Message saved successfully!" });
    } catch (err) {
        console.error("Error occurred during form submission:", err);
        res.status(500).json({ success: false, message: "An error occurred while processing your request." });
    }
});

app.get("/", (req, res) => {
    res.send("Hello World");
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
