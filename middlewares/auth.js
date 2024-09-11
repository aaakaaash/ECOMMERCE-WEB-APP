const User = require("../models/userSchema");

const userAuth = async (req, res, next) => {
    try {
        if (req.session.user) {
            const user = await User.findById(req.session.user);
            
            if (user) {
                if (!user.isBlocked) {
                    next();  // Proceed to the next middleware/controller
                } else {
                    console.log("User is blocked:", req.session.user);
                    res.redirect("/login");  // Or handle blocked users differently
                }
            } else {
                console.log("User not found in database:", req.session.user);
                res.redirect("/login");
            }
        } else {
            console.log("User session not found.");
            res.redirect("/login");
        }
    } catch (error) {
        console.error("Error in user auth middleware:", error);
        res.status(500).send("Internal Server Error");
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
