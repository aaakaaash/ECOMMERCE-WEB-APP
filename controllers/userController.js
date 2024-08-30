


const pageNotFound = async (req, res, next) => {
    try {
        res.render("page-404");
    } catch (error) {
        next(error); 
    }
};


const loadHomepage = async (req,res)=>{
    try{
        return res.render("home");
    } catch (error) {
        console.log("Home page not found");
        res.status(500).send("Server error")
    }
}

module.exports = {
    loadHomepage,
    pageNotFound
}