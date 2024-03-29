#!/usr/bin/env node
import path from 'node:path';
import fs from 'node:fs';
import * as esbuild from 'esbuild';
import { glsl } from "esbuild-plugin-glsl";

const args = new Set(process.argv.slice(2));
if (args.has("-h") || args.has("--help")) {
  console.log(`USAGE: ./build.mjs [-s]
A small build script for this project!

  -w, --watch          Instead of building once, invoke the esbuild file watcher.
  -h, --help           Show this and exit`);
  process.exit();
}

if (args.has("-s") || args.has("--serve")) {

}
// copy pasted from the docs
const wasm = {
  name: 'wasm',
  setup(build) {
    // Resolve ".wasm" files to a path with a namespace
    build.onResolve({ filter: /\.wasm$/ }, args => {
      // If this is the import inside the stub module, import the
      // binary itself. Put the path in the "wasm-binary" namespace
      // to tell our binary load callback to load the binary file.
      if (args.namespace === 'wasm-stub') {
        return {
          path: args.path,
          namespace: 'wasm-binary',
        }
      }

      // Otherwise, generate the JavaScript stub module for this
      // ".wasm" file. Put it in the "wasm-stub" namespace to tell
      // our stub load callback to fill it with JavaScript.
      //
      // Resolve relative paths to absolute paths here since this
      // resolve callback is given "resolveDir", the directory to
      // resolve imports against.
      if (args.resolveDir === '') {
        return // Ignore unresolvable paths
      }
      return {
        path: path.isAbsolute(args.path) ? args.path : path.join(args.resolveDir, args.path),
        namespace: 'wasm-stub',
      }
    })

    // Virtual modules in the "wasm-stub" namespace are filled with
    // the JavaScript code for compiling the WebAssembly binary. The
    // binary itself is imported from a second virtual module.
    build.onLoad({ filter: /.*/, namespace: 'wasm-stub' }, async (args) => ({
      contents: `import wasm from ${JSON.stringify(args.path)}
        export default (imports) =>
          WebAssembly.instantiate(wasm, imports).then(
            result => result.instance.exports)`,
    }))

    // Virtual modules in the "wasm-binary" namespace contain the
    // actual bytes of the WebAssembly file. This uses esbuild's
    // built-in "binary" loader instead of manually embedding the
    // binary data inside JavaScript code ourselves.
    build.onLoad({ filter: /.*/, namespace: 'wasm-binary' }, async (args) => ({
      contents: await fs.promises.readFile(args.path),
      loader: 'binary',
    }))
  },
}

const esbuildContext = await esbuild.context({
  entryPoints: ['index.js'],
  bundle: true,
  outfile: 'www/index.js',
  plugins: [wasm, glsl()],
});

esbuildContext.build();

if (args.has("-w") || args.has("--watch")) {
  await esbuildContext.watch();
  console.log("Watching <0>");
}
