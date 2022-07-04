const { ProxyController } = require('./http/controllers/proxy.controller');
const { sleep } = require('./modules/functions');
const { AllRoutes } = require('./routes/router');

module.exports = class Application{
    #express = require('express');
    #app = this.#express();
    constructor(DB_URL,PORT){
        this.configDatabase(DB_URL);
        this.configApplication();
        this.configRoutes();
        this.createServer(PORT);
        this.errorHandle();
        this.checkProxy();
    }
    configDatabase(DB_URL){
        const mongoose = require('mongoose');
        mongoose.connect(DB_URL,(err)=>{
            if(err) throw err;
            console.log('Connected to Database Successfull !')
        })
    }
    grabProxy(){
        try{

        }catch(err){
            console.log(err);
        }
    }
    async checkProxy(){
        try{
            await ProxyController.checkProxy();
            console.log('check proxy running on 1 minutes later..')
            await sleep(60000);
            return this.checkProxy();
        }catch(err){
            console.log(err);
            console.log('check proxy running on 10 seconds later..')
            await sleep(10000);
            return this.checkProxy();
        }
    }
    configApplication(){
        this.#app.use(this.#express.json());
        this.#app.use(this.#express.urlencoded({extended:true}));
    }
    configRoutes(){
        this.#app.use(AllRoutes);
    }
    createServer(PORT){
        const http = require('http');
        const server = http.createServer(this.#app)
        server.listen(PORT,()=>{
            console.log(`SERVER IS RUNNING ON http://localhost:${PORT} !`);
        })
    }
    errorHandle(){
        this.#app.use((req,res,next)=>{
            return res.status(404).json({
                status:404,
                message:'صفحه پیدا نشد',
                success:false
            });
        })
        this.#app.use((error,req,res,next)=>{
            const status = error?.status || 500;
            const message = error?.message || 'InternalServerError';
            return res.status(status).json({
                status,
                message,
                success:false
            });
        })
    }
}