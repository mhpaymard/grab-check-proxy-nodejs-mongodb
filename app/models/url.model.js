const {model,Schema} = require('mongoose');

const urlSchema = new Schema({
    url:{type:String,required:true},
    port:{type:Number,required:true},
    country:{type:String,default:'all'},
},{
    timestamps:true
})

const UrlModel = model('url',urlSchema);

module.exports = {
    UrlModel
}