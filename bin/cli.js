#!/usr/bin/env node

import { install } from '../src/installer.js';
import { verify } from '../src/verifier.js';

const subcommand = process.argv[2];

if (subcommand === 'verify') {
  console.log('\n🔍 BMAD Superpowers Verifier\n');
  verify(process.cwd()).catch((err) => {
    console.error('\n❌ Verify failed:', err.message);
    process.exit(1);
  });
} else {
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
}
