use `tsc ./file.ts --watch` to watch for updates while running the app.
# fixed by using npm run commands in package.json
 "scripts": {
    "build": "npx tsc",
    "prestart": "npm run build",
    "start": "node src/index.js",
    "preserver": "npm run build",
    "server": "concurrently \"npx tsc -w\"  \"nodemon src/index.js\""
  }



## typescript attemps
// import * as dotenv from 'dotenv';
// dotenv.config({path: __dirname + '/.env'});
// const port: number = process.env.PORT || 3000;