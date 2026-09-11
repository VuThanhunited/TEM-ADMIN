/**
 * DEPLOY TO C2 HOSTING
 * ========================
 * Upload user/dist -> C2 public_html/ qua FTP
 *
 * Cach dung:
 *   node deploy_to_c2.js
 *
 * Can cai: npm install basic-ftp (trong thu muc server hoac root)
 */

'use strict';

const fs = require('fs');
const path = require('path');

// --- CAU HINH FTP C2 ---
const FTP_CONFIG = {
  host: process.env.C2_FTP_HOST || 'giaiphapqrcode.vn',
  user: process.env.C2_FTP_USER || 'giaiphapqrcode',
  password: process.env.C2_FTP_PASS || '',
  port: 21,
  secure: false,
};

const LOCAL_DIST = path.join(__dirname, 'user', 'dist');
const REMOTE_DIR = '/public_html/';

async function deploy() {
  if (!FTP_CONFIG.password) {
    console.error('ERROR: Thieu FTP password!');
    console.error('   Chay lai voi: C2_FTP_PASS=matkhau node deploy_to_c2.js');
    process.exit(1);
  }

  let ftp;
  try {
    const { Client } = require('basic-ftp');
    ftp = new Client();
    ftp.ftp.verbose = false;

    console.log('\nDEPLOY TO C2 HOSTING');
    console.log('Local:  ' + LOCAL_DIST);
    console.log('Remote: ' + FTP_CONFIG.host + REMOTE_DIR);
    console.log('\nDang ket noi FTP...');

    await ftp.access(FTP_CONFIG);
    console.log('Ket noi FTP thanh cong!\n');

    const allFiles = countFiles(LOCAL_DIST);
    console.log('Tong so file can upload: ' + allFiles);
    console.log('Bat dau upload...\n');

    const startTime = Date.now();
    await ftp.uploadFromDir(LOCAL_DIST, REMOTE_DIR);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log('\nDEPLOY HOAN THANH (' + elapsed + 's)');
    console.log(allFiles + ' files -> ' + FTP_CONFIG.host + REMOTE_DIR);
    console.log('URL: https://www.giaiphapqrcode.vn\n');

  } catch (err) {
    console.error('\nDeploy that bai: ' + err.message);
    process.exit(1);
  } finally {
    if (ftp) ftp.close();
  }
}

function countFiles(dir) {
  let count = 0;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const fullPath = path.join(dir, item);
    if (fs.statSync(fullPath).isDirectory()) count += countFiles(fullPath);
    else count++;
  }
  return count;
}

try { require('basic-ftp'); } catch (e) {
  console.error('Thieu package basic-ftp!');
  console.error('Chay lenh: npm install basic-ftp --prefix ./server');
  process.exit(1);
}

try { require('dotenv').config({ path: path.join(__dirname, 'server', '.env') }); } catch (e) {}

deploy();