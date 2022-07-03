const {Types,model,Schema} = require('mongoose');

const proxySchema = new Schema({
    ip:{type:String,required:true},
    port:{type:Number,required:true},
    protocol:{type:String,required:true},
    country:{type:String},
    city:{type:String},
    refererUrl:{type:Types.ObjectId},
    uptime:{type:Number,default:0},
    lastResponseDate:{type:Number,default:0},
    lastResponseTime:{type:Number,default:0},
    onlineTime:{type:Number,default:0}
},{
    timestamps:true
})
const ProxyModel = model('proxy',proxySchema);
module.exports = {
    ProxyModel
}