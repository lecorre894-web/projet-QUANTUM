const express = require('express');
const chalk = require('chalk');
const os = require('os');

const app = express();
const PORT = 3000;

console.clear();

console.log(chalk.cyan('========================================'));
console.log(chalk.green('TRILLIONS RUNTIME ACTIVE'));
console.log(chalk.cyan('========================================'));

console.log(chalk.yellow('CPU:'), os.cpus()[0].model);
console.log(chalk.yellow('THREADS:'), os.cpus().length);
console.log(chalk.yellow('RAM:'), Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB');
console.log(chalk.yellow('PLATFORM:'), os.platform());

const runtimeMessages = [
  "Blockchain monitor active",
  "Telemetry stream connected",
  "Legacy runtime initialized",
  "Node synchronization complete",
  "Runtime generator active",
  "API bridge online",
  "Terminal orchestration running",
  "Multi-runtime engine ready",
  "Cloud synchronization active",
  "Codespaces runtime stable"
];

setInterval(() => {
  const msg = runtimeMessages[
    Math.floor(Math.random() * runtimeMessages.length)
  ];

  console.log(
    "[TRILLIONS] " +
    new Date().toLocaleTimeString() +
    " -> " + msg
  );
}, 2000);

app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>TRILLIONS ACTIVE</title>
            <style>
                body {
                    background: black;
                    color: #00ff99;
                    font-family: monospace;
                    padding: 40px;
                }

                h1 {
                    color: cyan;
                }

                .terminal {
                    margin-top: 30px;
                    border: 1px solid #00ff99;
                    padding: 20px;
                    background: #050505;
                }

                .blink {
                    animation: blink 1s infinite;
                }

                @keyframes blink {
                    50% {
                        opacity: 0;
                    }
                }
            </style>
        </head>
        <body>
            <h1>TRILLIONS ACTIVE</h1>

            <p>Runtime boot successful.</p>
            <p>Codespaces environment online.</p>

            <div class="terminal">
                <p>> Runtime terminal initialized</p>
                <p>> Node orchestration online</p>
                <p>> Monitoring generator active</p>
                <p class="blink">> Waiting for next runtime cycle...</p>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    console.log(chalk.green(`TRILLIONS ONLINE -> http://localhost:${PORT}`));
});
