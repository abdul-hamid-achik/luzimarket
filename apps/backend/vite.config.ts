import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import polyfillNode from 'rollup-plugin-polyfill-node'
import { builtinModules } from 'module'

export default defineConfig({
    plugins: [tsconfigPaths()],
    build: {
        target: 'node16',
        outDir: 'dist',
        emptyOutDir: true,
        ssr: true,
        rollupOptions: {
            input: 'src/index.ts',
            external: [...builtinModules],
            plugins: [polyfillNode()],
            output: { format: 'cjs' }
        }
    }
}) 