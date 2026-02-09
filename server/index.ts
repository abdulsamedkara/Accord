import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { initSocketServer } from "./socket";

const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = parseInt(process.env.PORT || "3000", 10);

// DEBUG LOGGING
console.log("----------------------------------------");
console.log("Current Working Directory:", process.cwd());
console.log("Directory Contents:", require("fs").readdirSync(process.cwd()));
try {
    console.log(".next Directory Contents:", require("fs").readdirSync(require("path").join(process.cwd(), ".next")));
} catch (e) {
    console.log("Could not read .next directory:", e.message);
}
console.log("----------------------------------------");

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
    const httpServer = createServer((req, res) => {
        const parsedUrl = parse(req.url!, true);
        handle(req, res, parsedUrl);
    });

    // Initialize Socket.io
    initSocketServer(httpServer);

    httpServer.listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
