#!/usr/bin/env node

/**
 * JWT Debug Script for E2E Tests
 * 
 * This script helps debug JWT token issues by:
 * 1. Checking the JWT_SECRET environment variable
 * 2. Analyzing stored tokens in test sessions
 * 3. Validating token signatures
 */

import { debugStorageState, debugJWT, JWT_SECRET } from './test-utils/jwt-debug.js';
import fs from 'fs';
import path from 'path';

console.log('🔍 JWT Debug Tool for E2E Tests');
console.log('=====================================\n');

// Check environment configuration
console.log('🌍 Environment Configuration:');
console.log('📝 JWT_SECRET from env:', process.env.JWT_SECRET ? 'SET (hidden)' : 'NOT SET');
console.log('📝 JWT_SECRET being used:', JWT_SECRET === process.env.JWT_SECRET ? 'from environment' : 'fallback value');
console.log('📝 NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('📝 DB_MODE:', process.env.DB_MODE || 'not set');
console.log('');

// Find the most recent test session
const tmpDir = './tmp/test-results';
if (fs.existsSync(tmpDir)) {
    const sessions = fs.readdirSync(tmpDir)
        .filter(dir => dir.startsWith('test-session-'))
        .map(dir => {
            const sessionPath = path.join(tmpDir, dir);
            const stats = fs.statSync(sessionPath);
            return { name: dir, path: sessionPath, mtime: stats.mtime };
        })
        .sort((a, b) => b.mtime - a.mtime);

    if (sessions.length > 0) {
        const latestSession = sessions[0];
        console.log('🕒 Latest test session:', latestSession.name);
        console.log('📅 Created:', latestSession.mtime.toISOString());
        console.log('');

        // Debug storage states from the latest session
        const storageFiles = [
            'storageState.json',
            'adminStorageState.json',
            'authenticatedState.json',
            'adminAuthenticatedState.json'
        ];

        for (const fileName of storageFiles) {
            const filePath = path.join(latestSession.path, fileName);
            if (fs.existsSync(filePath)) {
                console.log(`\n📄 Analyzing ${fileName}:`);
                console.log('='.repeat(50));
                debugStorageState(filePath);
            }
        }

        // Check session info
        const sessionInfoPath = path.join(latestSession.path, 'session-info.json');
        if (fs.existsSync(sessionInfoPath)) {
            const sessionInfo = JSON.parse(fs.readFileSync(sessionInfoPath, 'utf8'));
            console.log('\n📊 Session Information:');
            console.log('='.repeat(30));
            console.log('🎯 Session ID:', sessionInfo.sessionId);
            console.log('🗄️  Database Mode:', sessionInfo.dbMode);
            console.log('🌐 API URL:', sessionInfo.environment?.apiUrl);
            console.log('🌐 Base URL:', sessionInfo.environment?.baseUrl);
        }

        // Check logs for JWT errors
        const logsDir = path.join(latestSession.path, 'logs');
        if (fs.existsSync(logsDir)) {
            console.log('\n📋 Recent Logs with JWT Errors:');
            console.log('='.repeat(35));

            const logFiles = ['api-errors.log', 'backend.log', 'console-errors.log'];
            for (const logFile of logFiles) {
                const logPath = path.join(logsDir, logFile);
                if (fs.existsSync(logPath)) {
                    const content = fs.readFileSync(logPath, 'utf8');
                    const jwtErrors = content.split('\n')
                        .filter(line => line.toLowerCase().includes('jwt') || line.toLowerCase().includes('token'))
                        .filter(line => line.trim().length > 0);

                    if (jwtErrors.length > 0) {
                        console.log(`\n🔴 ${logFile}:`);
                        jwtErrors.forEach(error => console.log(`  ${error}`));
                    }
                }
            }
        }
    } else {
        console.log('❌ No test sessions found in tmp/test-results');
    }
} else {
    console.log('❌ tmp/test-results directory not found');
}

console.log('\n💡 Recommendations:');
console.log('===================');
console.log('1. Ensure JWT_SECRET is consistently set in your environment');
console.log('2. All test utilities now use the same JWT secret resolution as the backend');
console.log('3. Re-run your tests to see if the JWT signature errors are resolved');
console.log('4. If errors persist, check that tokens are being created with the correct secret');
console.log('');
console.log('🔧 To run this debug tool again: node e2e/debug-jwt.js'); 