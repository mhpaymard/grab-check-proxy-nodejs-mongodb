const { ProxyController } = require('../http/controllers/proxy.controller');

const router = require('express').Router();

router.get('/',ProxyController.getAllProxies);
router.post('/',ProxyController.addProxy)
router.post('/list',ProxyController.addProxyList)
router.delete('/',ProxyController.deleteProxy)
router.post('/filter',ProxyController.searchAndSortProxies)
module.exports={
    proxyRoutes : router
}