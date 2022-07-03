const { default: mongoose } = require("mongoose");
const { ProxyModel } = require("../../models/proxy.model");
const ipLocation = require('ip2country');

module.exports = {
    ProxyController : new class ProxyController{
        async getAllProxies(req,res,next){
            try{
                const proxies = await ProxyModel.find({});
                return res.status(200).json({
                    status:200,
                    success:true,
                    proxies
                })
            }catch(err){
                next(err);
            }
        }
        async searchAndSortProxies(req,res,next){
            try{
                const filters = req.body.filters;

                const mojazFields = ['protocol','country','city','refererUrl','uptime','lastResponseDate','lastResponseTime','onlineTime','port'];
                Object.entries(filters).forEach(([key,value])=>{
                    if(!mojazFields.includes(key)) delete filters[key];
                })

                const proxies = await ProxyModel.find(filters);

                return res.status(200).json({
                    status:200,
                    success:true,
                    proxies
                })
            }catch(err){
                next(err);
            }
        }
        async addProxy(req,res,next){
            try{
                const proxyObject = req.body;
                const proxyExist = await ProxyModel.findOne({ip:proxyObject.ip,port:proxyObject.port});
                if(proxyExist) throw {status:400,message:"پروکسی وارد شده تکراری می باشد"} 
                const country = await ipLocation(proxyObject.ip);
                if(country) proxyObject['country']=country;
                const newProxy = await ProxyModel.create(proxyObject);
                res.status(201).json({
                    status:201,
                    success:true,
                    message:'پروکسی با موفقیت اضافه شد',
                    proxy:newProxy
                })
            }catch(err){
                next(err);
            }
        }
        async addProxyList(req,res,next){
            try{
                const proxyArray = req?.body?.proxies;
                const mojazProxies = [];
                if(!proxyArray) throw {status:400,message:'لطفا لیست پروکسی را وارد کنید'}
                for(let proxy of proxyArray){
                    const proxyExist = await ProxyModel.findOne({ip:proxy.ip,port:proxy.port});
                    if(!proxyExist){
                        if(!proxy?.['country']){
                            const country = await ipLocation(proxy.ip);
                            if(country) proxy['country']=country;
                        }
                        mojazProxies.push(proxy);
                    }
                }
                if(mojazProxies.length==0) throw {status:400,message:'تمام پروکسی های وارد شده تکراری می باشند'}
                const proxies = await ProxyModel.insertMany(mojazProxies);
                return res.status(201).json({
                    status:201,
                    message:'کل پروکسی ها با موفقیت اضافه شد',
                    success:true,
                    proxies
                })
            }catch(err){
                next(err);
            }
        }
        async deleteProxy(req,res,next){
            try{
                const id = req?.body?.id;
                if(!id) throw {status:400,message:'لطفا ایدی پروکسی را وارد نمایید'};
                if(!mongoose.isValidObjectId(id)) throw {status:400,message:'لطفا ایدی پروکسی را صحیح وارد کنید'}
                const result = await ProxyModel.deleteOne({_id:id});
                if(result.deletedCount==0) throw {status:400,message:'چنین پروکسی ای وجود ندارد'}
                return res.status(200).json({
                    status:200,
                    message:'پروکسی با موفقیت حذف شد',
                    success:true
                })
            }catch(err){
                next(err);
            }
        }
    }
}