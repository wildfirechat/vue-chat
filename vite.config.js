import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'

const path = require("path");
import inject from '@rollup/plugin-inject'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue(), nodePolyfills()],
    resolve: {
        // 这行最终应当移除，import 时，带上 .vue 等相关后缀
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
        alias: {
            "@": path.resolve(__dirname, "./src"),
            fs: require.resolve('rollup-plugin-node-builtins'),
        },
        build: {
            rollupOptions: {
                plugins: [inject({ Buffer: ['buffer/', 'Buffer'] })],
            },
        }
    },

})