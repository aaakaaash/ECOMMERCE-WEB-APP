const User = require("../models/userSchema");



const userAuth = async (req, res, next) => {
    try {
        // Check if either req.session.user or req.user is present
        const userId = req.session.user || req.user;

        if (userId) {
            // Fetch user from the database using the ID
            const user = await User.findById(userId);

            if (user) {
                // Check if the user is blocked
                if (!user.isBlocked) {
                    // Attach user data to res.locals so it's available to all views
                    res.locals.user = user; 
                    next();  // Proceed to the next middleware/controller
                } else {
                    console.log("User is blocked:", userId);
                    res.render("login");  // Handle blocked users
                }
            } else {
                console.log("User not found in database:", userId);
                res.redirect("/login");  // Redirect or handle user not found
            }
        } else {
            res.redirect("/login");  // Redirect if neither session nor user is present
        }
    } catch (error) {
        console.error("Error in user auth middleware:", error);
        next(error);
    }
};





const adminAuth = (req, res, next) => {

    if(req.session.admin){
    User.findOne({ role: "admin" })
    
        .then(data => {
            if (data) {
                next();
            } else {
                res.redirect("/admin/login");
            }
        })
        .catch(error => {
            console.log("Error in adminAuth middleware", error);
            res.status(500).send("Internal Server Error");
        });
} else {
    res.redirect("/admin/login");
}
}

module.exports = {
    userAuth,
    adminAuth
}
