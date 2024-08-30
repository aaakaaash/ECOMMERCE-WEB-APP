

function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log error stack to the console for debugging
    res.status(500).send('Something broke!'); // Send a generic error message
}

module.exports = errorHandler;
