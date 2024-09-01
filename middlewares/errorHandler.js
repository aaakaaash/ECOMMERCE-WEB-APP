

function errorHandler(err, req, res, next) {
    console.error(err.stack); // Log error stack to the console for debugging
    res.redirect("/pageNotFound");
}

module.exports = errorHandler;
