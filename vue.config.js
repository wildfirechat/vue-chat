const path = require('path');
const webpack = require('webpack')
const PreloadPlugin = require('@vue/preload-webpack-plugin')

function resolve(dir) {
    return path.join(__dirname, dir);
}

module.exports = {
    devServer: {
        allowedHosts: 'all',
        port: 8013
    },
    publicPath: '/',
    outputDir: 'dist',
    //assetsDir: 'static',
    lintOnSave: process.env.NODE_ENV === 'development',
    productionSourceMap: false,
    configureWebpack: {
        // provide the app's title in webpack's name field, so that
        // it can be accessed in index.html to inject the correct title.
        resolve: {
            alias: {
                '@': resolve('src'),
            },
            fallback: {
                'path': false,
                'fs': false,
                "assert": false,
                //"assert": require.resolve("assert/")
                "util": false,
                //"util": require.resolve("util/")
                "os": false,
                //"os": require.resolve("os-browserify/browser")
                "crypto": false,
                //"crypto": require.resolve("crypto-browserify")

                "buffer": require.resolve("buffer/")
            }
        },
        plugins: [
            new webpack.ProvidePlugin({
                process: 'process/browser',
                Buffer: ['buffer', 'Buffer']
            })],
    },
    chainWebpack(config) {
        // config.plugin('preload').use(PreloadPlugin).tap(() => [
        //     {
        //         rel: 'preload',
        //         // to ignore runtime.js
        //         // https://github.com/vuejs/vue-cli/blob/dev/packages/@vue/cli-service/lib/config/app.js#L171
        //         fileBlacklist: [/\.map$/, /hot-update\.js$/, /runtime\..*\.js$/],
        //         include: 'initial'
        //     }
        // ]);
        config.plugins.delete('prefetch');
        config.when(process.env.NODE_ENV !== 'development', config => {
            config.optimization.splitChunks({
                chunks: 'all',
                cacheGroups: {
                    libs: {
                        name: 'chunk-libs',
                        test: /[\\/]node_modules[\\/]/,
                        priority: 10,
                        chunks: 'initial' // only package third parties that are initially dependent
                    },
                    commons: {
                        name: 'chunk-commons',
                        test: resolve('src/components'), // can customize your rules
                        minChunks: 3, //  minimum common number
                        priority: 5,
                        reuseExistingChunk: true
                    }
                }
            });
            // https:// webpack.js.org/configuration/optimization/#optimizationruntimechunk
            config.optimization.runtimeChunk('single');
        });
        config.optimization.runtimeChunk('single');
        // // 注入全局sacc变量
        // const oneOfsMap = config.module.rule('scss').oneOfs.store;
        // oneOfsMap.forEach(item => {
        //     item
        //         .use('sass-resources-loader')
        //         .loader('sass-resources-loader')
        //         .options({
        //             resources: './src/stylesheet/variables.scss'
        //         })
        //         .end();
        // });

        // config.resolve.alias.set('vue', '@vue/compat')
        config.module
            .rule("vue")
            .use("vue-loader")
            .loader("vue-loader")
            .tap(options => {
                // Return just the compatibility config without directive transforms
                return {
                    ...options,
                    compilerOptions: {
                        compatConfig: {
                            MODE: 3
                        }
                    }
                };
            });

    }
};
