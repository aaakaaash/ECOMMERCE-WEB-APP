// errorHandler.js
function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log error stack to the console for debugging

    // Handle 404 errors
    if (err.status === 404) {
        res.status(404).render("page-404");
    }
    // Handle 400 errors
    else if (err.status === 400) {
        res.status(400).json({ success: false, message: err.message });
    }
    // Handle other client errors
    else if (err.status >= 400 && err.status < 500) {
        res.status(err.status).json({ success: false, message: err.message });
    }
    // Handle server errors
    else {
        res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
    }
}

module.exports = errorHandler;
