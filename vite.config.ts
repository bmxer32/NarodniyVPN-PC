import { defineConfig } from 'vite'
import path from 'node:path'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import JavaScriptObfuscator from 'javascript-obfuscator'
import pkg from './package.json'

// 🛡️ НАСТРОЙКИ ОБФУСКАЦИИ
const obfuscationOptions: any = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  disableConsoleOutput: true,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: false,
  shuffleStringArray: true,
  simplify: true,
  splitStrings: true,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 1,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersType: 'variable',
  stringArrayThreshold: 0.75,
  target: 'node',
  unicodeEscapeSequence: false
};

// 🔌 ПЛАГИН ОБФУСКАЦИИ
const obfuscatorPlugin = () => {
  return {
    name: 'obfuscator',
    transform(code: string, id: string) {
      if (process.env.NODE_ENV !== 'development' && /\.(ts|js)$/.test(id)) {
        if (id.includes('electron') && !id.includes('node_modules')) {
          console.log(`🛡️  Obfuscating: ${path.basename(id)}`);
          const result = (JavaScriptObfuscator as any).obfuscate(code, obfuscationOptions);
          return {
            code: result.getObfuscatedCode(),
            map: null
          };
        }
      }
      return null;
    }
  }
}

export default defineConfig({
  // 🔥 [ВАЖНО] Эта строка чинит пути к картинкам в .exe файле
  base: './', 

  define: {
    '__APP_VERSION__': JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.ts',
        vite: {
          build: {
            sourcemap: false, 
            minify: true,
            outDir: 'dist-electron',
            rollupOptions: {
              external: ['javascript-obfuscator']
            }
          },
          plugins: [obfuscatorPlugin()]
        },
      },
      preload: {
        input: 'electron/preload.ts',
        vite: {
          build: {
            sourcemap: false,
            minify: true,
            outDir: 'dist-electron',
          }
        }
      },
      renderer: {},
    }),
  ],
})