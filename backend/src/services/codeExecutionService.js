// file: backend/src/services/codeExecutionService.js
import { execFile } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

const TIMEOUT_MS = 3000;

function detectFunctionName(code, language) {
  if (language === 'python') {
    const m = code.match(/def\s+([a-zA-Z0-9_]+)\s*\(/);
    return m?.[1] || null;
  }
  if (language === 'javascript') {
    const m = code.match(/function\s+([a-zA-Z0-9_]+)/);
    return m?.[1] || null;
  }
  return null;
}

async function runSingleTest(language, userCode, fnName, test) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'coding-'));
  const id = crypto.randomUUID();
  const ext = language === 'python' ? 'py' : 'js';
  const filePath = path.join(tmpDir, `submission_${id}.${ext}`);

  let wrappedCode = userCode + '\n\n';

  if (language === 'python') {
    wrappedCode += `
try:
    result = ${fnName}(${test.input})
    print(result)
except Exception as e:
    print("ERROR:", e)
`;
  } else {
    wrappedCode += `
try {
  const result = ${fnName}(${test.input});
  console.log(result);
} catch (e) {
  console.log("ERROR:", e.message);
}
`;
  }

  await fs.writeFile(filePath, wrappedCode, 'utf8');

  const cmd = language === 'python' ? 'python' : 'node';

  return new Promise((resolve) => {
    execFile(cmd, [filePath], { timeout: TIMEOUT_MS }, async (err, stdout, stderr) => {
      let actual = stdout?.toString().trim() || '';
      let error = null;

      if (err) {
        error = stderr || err.message;
      }

      if (actual.startsWith('ERROR:')) {
        error = actual.replace('ERROR:', '').trim();
        actual = '';
      }

      try {
        await fs.rm(tmpDir, { recursive: true, force: true });
      } catch {}

      resolve({
        input: test.input,
        expected: test.output,
        actual,
        passed: actual === String(test.output).trim(),
        error
      });
    });
  });
}

export const executeLocally = async (language, userCode, tests) => {
  if (!tests || tests.length === 0) {
    return {
      passedAll: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      cases: [],
      runtimeError: 'No test cases configured for this problem'
    };
  }

  const fnName = detectFunctionName(userCode, language);
  if (!fnName) {
    return {
      passedAll: false,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      cases: [],
      runtimeError: 'Function name not detected in submission'
    };
  }

  const results = [];

  for (const test of tests) {
    // eslint-disable-next-line no-await-in-loop
    const r = await runSingleTest(language, userCode, fnName, test);
    results.push(r);
  }

  const totalTests = results.length;
  const passedTests = results.filter((r) => r.passed).length;

  return {
    passedAll: passedTests === totalTests,
    totalTests,
    passedTests,
    failedTests: totalTests - passedTests,
    cases: results,
    runtimeError: null
  };
};
