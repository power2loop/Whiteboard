import express from "express"
const app = express();
const PORT = 3000;

// Middleware to parse JSON body
app.use(express.json());

// Basic route
app.get("/", (req, res) => {
    res.send("🚀 Express server is running!");
});


// Start server

app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
});