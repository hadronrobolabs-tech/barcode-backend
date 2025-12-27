exports.generate = (req) => {
    if (!req.body.object_type) throw "OBJECT_TYPE_REQUIRED";
    
     if (req.body.object_type !== 'BOX' && !req.body.object_id)
        throw "OBJECT_ID_REQUIRED";
};

exports.scan = (req) => {
    if (!req.body.barcode) throw "BARCODE_REQUIRED";
};
