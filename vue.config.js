module.exports = {
    devServer: {
        port: 8080,
        https: false,
        open: true,
        proxy: {
            '/api': {
                target : 'http://137.220.228.175:8000',
                ws: false,        //如果要代理 websockets，配置这个参数
                secure: false,  // 如果是https接口，需要配置这个参数
                changeOrigin: true,  //是否跨域
                pathRewrite:{
                    '^/api':''
                }
            }
        },
    }
}
