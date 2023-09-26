import * as esbuild from 'esbuild'
import http from 'node:http'

// Start esbuild's server on a random local port
let ctx = await esbuild.context({
    // ... your build options go here ...
    entryPoints: ["src/app.ts"],
    outdir: "www/js",
    bundle: true
})

// The return value tells us where esbuild's local server is
let { host, port } = await ctx.serve({ servedir: 'www' })

// Then start a proxy server on port 3000
http.createServer((req, res) => {
    const options = {
        hostname: host,
        port: port,
        path: req.url,
        method: req.method,
        headers: req.headers,
    }

    // Forward each incoming request to esbuild
    const proxyReq = http.request(options, proxyRes => {
        // If esbuild returns "not found", send a custom 404 page
        if (proxyRes.statusCode === 404) {
            res.writeHead(404, { 'Content-Type': 'text/html' })
            res.end('<h1>A custom 404 page</h1>')
            return
        }

        // Otherwise, forward the response from esbuild to the client
        res.writeHead(proxyRes.statusCode, {
            ...proxyRes.headers, "Cross-Origin-Opener-Policy": "same-origin",
            "Cross-Origin-Embedder-Policy": "require-corp",
        })
        proxyRes.pipe(res, { end: true })
    })

    // Forward the body of the request to esbuild
    req.pipe(proxyReq, { end: true })
}).listen(3000)