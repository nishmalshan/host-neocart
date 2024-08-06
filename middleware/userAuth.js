const user = require('../model/user');

const verifyingUser = (req,res,next) => {
    
    if(req.session.userlogged){

        next()
    }else{
        res.redirect("/userlogin")
    }
}



const existUser = (req,res,next) => {
    
    if(req.session.userlogged) {
        
        res.redirect('/');

    }else{
        
        next()
    }
}


const userBlockOrUnblock = async (req, res, next) => {
    try {
        const check = await user.findOne({ email: req.session.email});

        if (check && check.status == false) {
            req.session.destroy((err) => {
                if (err) {
                    console.log(err);
                } else {
                    res.redirect('/')
                }
            })
        } else {
            next();
        }
    } catch (error) {
        console.error('Error checking user status:', error);
        res.status(500).send('Internal Server Error');
    }
}




module.exports = {
    verifyingUser,
    existUser,
    userBlockOrUnblock
}