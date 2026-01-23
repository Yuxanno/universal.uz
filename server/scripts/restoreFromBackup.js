/**
 * Restore Database from Backup
 * 
 * This script restores the database to the state before migration
 */

const mongoose = require('mongoose');
const { exec } = require('child_process');
const path = require('path');
require('dotenv').config({ path: '../.env' });

async function restoreFromBackup() {
  try {
    console.log('🔄 Starting database restore...\n');

    // Check if backup exists
    const backupPath = path.join(__dirname, '../../backup');
    
    console.log('📁 Looking for backup in:', backupPath);
    
    // Restore using mongorestore
    const command = `mongorestore --db universal_uz ${backupPath}/universal_uz --drop`;
    
    console.log('⏳ Restoring database...');
    console.log('Command:', command);
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error restoring database:', error);
        console.error(stderr);
        return;
      }
      
      console.log(stdout);
      console.log('\n✅ Database restored successfully!');
      console.log('📊 Please check your products count now.');
    });

  } catch (err) {
    console.error('❌ Restore failed:', err);
  }
}

// Run restore
restoreFromBackup();
