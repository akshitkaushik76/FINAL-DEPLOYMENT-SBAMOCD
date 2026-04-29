const owner = require('./../MODELS/Owner');

// exports.get_owner_information = async(req,res,next)=>{
//     try{
//         const business_code = req.body.business_code;
//         const owner_info = await owner.findOne({business_code});
//         if(!owner_info) {
//             return res.status(404).json({
//                 status:'fail',
//                 message:'the owner with the code does not exists'
//             })
//         }
//         res.status(200).json({
//             status:'success',
//             owner_info
//         }) 
//     } catch(error) {
//         console.error("error occured->",error.message);
//         res.status(500).json({
//             status:'internal server error',
//             message:error.message
//         })
//     }
// }

exports.get_owner_information = async (req, res, next) => {
  try {
    const owner_info = await owner.findById(req.user.id);

    if (!owner_info) {
      return res.status(404).json({
        status: 'fail',
        message: 'Owner not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: owner_info   // ✅ important (frontend expects this)
    });

  } catch (error) {
    console.error("error occured->", error.message);
    res.status(500).json({
      status: 'internal server error',
      message: error.message
    });
  }
};
