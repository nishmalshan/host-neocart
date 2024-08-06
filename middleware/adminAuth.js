

const verifyingAdmin = (req,res,next) => {
    if(req.session.adminlogged){

        next()
    }else{
        res.redirect("/admin")
    }
}



const existAdmin = (req,res,next) => {
    
    if(req.session.adminlogged) {
        
        res.redirect('/admin/dashboard');

    }else{
        
        next()
    }
}




module.exports = {
    existAdmin,
    verifyingAdmin
}