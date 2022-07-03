const { proxyRoutes } = require('./proxy.route');
const basicAuth = require('express-basic-auth')

const user = {};
user[`${process.env.USER}`] = process.env.PASSWORD;

const router = require('express').Router();

router.use('/proxy',basicAuth({users:user,challenge:true,realm:'realmeproxy'}),proxyRoutes)

module.exports = {
    AllRoutes : router
}