

const generateOTP = async (req, res) => {
    try {
        const otp = Math.floor(1000 + Math.random() * 9000);
        console.log(otp);
        return otp.toString()
    } catch (error) {
        console.log(error);
    }
}


module.exports = generateOTP