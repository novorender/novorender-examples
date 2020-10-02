import fs from "fs";
fs.mkdirSync("./public/novorender", { recursive: true });
for (const name of ["index.html", "index.js"])
    fs.copyFileSync(`${name}`, `./public/${name}`);
for (const name of ["index.js", "render.js", "geometry.js"])
    fs.copyFileSync(`node_modules/@novotech/novorender/${name}`, `./public/novorender/${name}`);
