
function errorHandler(err, req, res, next) {
     
   
    if (err.status === 404) {
        res.status(404).render("page-404");
    }
 
    else if (err.status === 400) {
        res.status(400).json({ success: false, message: err.message });
    }
  
    else if (err.status >= 400 && err.status < 500) {
        res.status(404).render("page-404");
        res.status(err.status).json({ success: false, message: err.message });
    }
  
    else {
        res.status(500).json({ success: false, message: "An unexpected error occurred. Please try again later." });
    }
}

module.exports = errorHandler;
