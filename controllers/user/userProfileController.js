




const userProfile = async (req,res,next) =>{

    try {

        res.render("user-Profile");
        
    } catch (error) {

        console.error("rendering userProfile", error);
        next(error)
    }

}


module.exports = {
    userProfile
}