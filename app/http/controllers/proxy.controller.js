const { mongoose } = require("mongoose");
const { ProxyModel } = require("../../models/proxy.model");
const ipLocation = require('ip2country');
const url = require('url');
const HttpProxyAgent = require('http-proxy-agent');
const { sleep } = require("../../modules/functions");

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
                const proxyArray = [...new Set(req?.body?.proxies || [])];
                const mojazProxies = [];
                if(!proxyArray) throw {status:400,message:'لطفا لیست پروکسی را وارد کنید'}
                for await (let proxy of proxyArray){
                    const proxyExist = await ProxyModel.findOne({ip:proxy.ip});
                    if(!proxyExist){
                        if(!proxy?.['country']){
                            const country = await ipLocation(proxy.ip);
                            if(country) proxy['country']=country;
                        }
                        // mojazProxies.push(proxy);
                        mojazProxies.push(await ProxyModel.create(proxy));
                    }
                }
                // if(mojazProxies.length==0) throw {status:400,message:'تمام پروکسی های وارد شده تکراری می باشند'}
                // const proxies = await ProxyModel.insertMany(mojazProxies);
                return res.status(201).json({
                    status:201,
                    message:'کل پروکسی ها با موفقیت اضافه شد',
                    success:true,
                    proxies:mojazProxies
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
        requestByProxy(httpOption){
            return new Promise(async (resolve,reject)=>{
                try{
                    const http = require('http');
                    const request = http.request(httpOption,function(res){
                        const chunked = [];
                        res.on('data',chunk=>{
                            chunked.push(chunk);
                        })
                        res.on('end',()=>{
                            const result = chunked.join('').toString();
                            if(res.statusCode==200) return resolve(true);
                            // return resolve(true);
                            console.log('status',res.statusCode)
                            return resolve(false);
                        })
                    })
                    request.on('timeout',function(){
                        return resolve(false);
                    })
                    request.on('error', function(e) {
                        if(!['ETIMEOUT','ECONNREFUSED','ECONNRESET','EHOSTUNREACH'].includes(e.code)) console.log(JSON.parse(JSON.stringify(e)));
                        return resolve(false);
                    });
                    request.end();
                }catch(err){
                    resolve(false);
                }
            })
        }
        async checkProxyInTime(proxy){
            try{
                // const proxy = proxies.shift();
                const urlProxy = `${proxy.protocol}://${proxy.ip}:${proxy.port}`
                // console.log(urlProxy)
                const httpOption = url.parse('http://www.google.com/');
                httpOption.agent = new HttpProxyAgent(urlProxy);
                httpOption.method = 'GET';
                httpOption.timeout = 6000;
                const beforeTime = Date.now();
                // console.log(httpOption)
                const result = await this.requestByProxy(httpOption);
                const afterTime = Date.now();
                if(result){
                    proxy.lastResponseDate=afterTime;
                    proxy.lastResponseTime=afterTime-beforeTime;
                    if(proxy.onlineTime==0){
                        proxy.onlineTime=afterTime;
                        proxy.uptime = 1;
                    }else{
                        proxy.uptime += afterTime - proxy.onlineTime;
                    }
                    proxy.countSuccess+=1;
                    await proxy.save();
                    console.log(`${urlProxy} online!`,200,200)
                }else{
                    proxy.onlineTime=0;
                    proxy.uptime=0;
                    proxy.countFail+=1;
                    await proxy.save();
                    console.log(`${urlProxy} offline..`)
                }
            }catch(err){
                console.log(err);
            }
        }
        checkProxy(){
            return new Promise(async (resolve,reject)=>{
                try{
                    const turnOffProxy = await ProxyModel.updateMany({countFail:{
                        $gt:5
                    }},{
                        $set:{
                            checki:false
                        }
                    });
                    const proxies = await ProxyModel.find({checki:true,protocol:'http'});
                    if(proxies.length==0){
                        const alltheProxies = await ProxyModel.updateMany({checki:false},{
                            $set:{
                                checki:true,
                                countFail:0,
                                countSuccess:0,
                                uptime:0,
                                onlineTime:0,
                                lastResponseTime:0,
                                lastResponseDate:0

                            }
                        });
                        return resolve();
                    }
                    console.log(proxies.length);
                    let checkedProxy = 0;
                    while(proxies.length>0){
                        const proxy = proxies.shift();
                        checkedProxy++;
                        this.checkProxyInTime(proxy);
                        if(checkedProxy%5==0) await sleep(10000);
                    }
                    console.log('tamam')
                    return resolve();

                }catch(err1){
                    console.log(err1);
                    reject(err1);
                }
            })
        }
        
    }
}