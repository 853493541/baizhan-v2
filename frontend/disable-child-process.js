// disable-child-process.js
const cp = require("child_process");

const blocked = () => {
  throw new Error("child_process is disabled by security policy");
};

cp.exec = blocked;
cp.execSync = blocked;
cp.spawn = blocked;
cp.spawnSync = blocked;
cp.fork = blocked;

Object.freeze(cp);
