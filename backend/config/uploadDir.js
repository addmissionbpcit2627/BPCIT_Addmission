const path = require('path');

const isServerless = !!(process.env.VERCEL || process.env.LAMBDA_TASK_ROOT || process.env.NOW_BUILDER);

const UPLOAD_DIR = isServerless
  ? '/tmp/uploads'
  : (process.env.UPLOAD_DIR 
      ? path.resolve(process.env.UPLOAD_DIR)
      : path.join(__dirname, '..', 'uploads'));

module.exports = UPLOAD_DIR;
