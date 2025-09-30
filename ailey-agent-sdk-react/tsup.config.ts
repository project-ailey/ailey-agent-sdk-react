import { defineConfig } from 'tsup';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    splitting: false,
    sourcemap: true,

    esbuildOptions(options) {
        options.define = {
            ...options.define,
            'process.env.UNISWAP_V3_FACTORY_ADDRESS': JSON.stringify(process.env.UNISWAP_V3_FACTORY_ADDRESS)
        };
    },
});