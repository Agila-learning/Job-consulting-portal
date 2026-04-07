try {
  console.log('--- BASE DIAGNOSTIC ---');
  require('express');
  console.log('✔ express loaded');
  require('cors');
  console.log('✔ cors loaded');
  require('dotenv');
  console.log('✔ dotenv loaded');
  require('./config/db');
  console.log('✔ config/db loaded');
  console.log('--- BASE DIAGNOSTIC END ---');
} catch (e) {
  console.log('✘ ' + e.message);
  console.log(e.stack);
}
