#!/usr/bin/env node

import { install } from '../src/installer.js';

console.log('\n🚀 BMAD Superpowers Installer\n');

install(process.cwd())
  .then(() => {
    console.log('\n🎉 Superpowers activated!\n');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Installation failed:', err.message);
    process.exit(1);
  });
