#!/usr/bin/env node

import path from 'node:path';

import prompts from 'prompts';
import glob from 'glob';
import { parseFileSync } from '@swc/core';
import type { ImportDeclaration } from '@swc/core';

import type { PromptsResult } from './types';

(async () => {
  const { packageName, includes }: PromptsResult = await prompts([
    {
      type: 'text',
      name: 'packageName',
      message: 'Enter the package name',
      initial: 'lodash-es',
    },
    {
      type: 'list',
      name: 'includes',
      message: 'Enter the folders that you want to search',
      initial: '.',
    },
  ]);
  let hasDefaultImport = false;
  const exportSet = new Set<string>();

  for (const folderName of includes) {
    const files = glob.sync(`${path.resolve(folderName)}/**/*.{ts,tsx}`, {
      ignore: ['**/*.d.ts', '**/node_modules/**'],
    });
    files.forEach(file => {
      const { body } = parseFileSync(file, { syntax: 'typescript', tsx: true });
      const target = body.find(node => {
        if (node.type !== 'ImportDeclaration') return false;
        if (node.source.value !== packageName) return false;

        return true;
      }) as ImportDeclaration | undefined;
      if (!target) return;
      const { specifiers } = target;
      specifiers.forEach(({ type, local }) => {
        if (type === 'ImportDefaultSpecifier') {
          hasDefaultImport = true;
          return;
        }
        if (type === 'ImportSpecifier') {
          exportSet.add(local.value);
        }
      });
    });
  }

  console.log(`has default import: ${hasDefaultImport}\n`);
  console.log([...exportSet].join('\n'));
})();
