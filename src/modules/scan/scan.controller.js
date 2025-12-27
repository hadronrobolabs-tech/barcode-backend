const barcodeService = require('../barcode/barcode.service');
const boxService = require('../box/box.service');

exports.scan = async (req,res)=>{
  try{
    const { barcode, box_barcode } = req.body;
    const userId = req.body.user_id || req.user?.userId || null;

    if(box_barcode){
        await boxService.scanItem(box_barcode, barcode);
        return res.json({success:true, type:"BOX_PACKING"});
    }

    const data = await barcodeService.validateScan(barcode, userId);
    
    // Return formatted response for Component Scan screen
    res.json({
        success: true, 
        type: "BARCODE",
        data: {
            barcode: data.barcode_value,
            component: data.component?.name || "Unknown",
            category: data.component?.category || "UNKNOWN",
            product: data.product?.name || null,
            user: data.user?.email || "Unknown",
            scanned_at: data.scanned_at,
            status: data.status
        }
    });
  }catch(e){
    res.status(400).json({success:false, error:String(e)});
  }
};
