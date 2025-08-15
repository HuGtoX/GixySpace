import noUnusedImports from './rules/no-unused-imports';
import noUnusedVars from './rules/no-unused-vars';

import { ESLint } from 'eslint';

// 定义插件的规则

const plugin: ESLint.Plugin = {
	meta: {
		name: 'unused-imports'
	},
	rules: {
		'no-unused-vars': noUnusedVars,
		'no-unused-imports': noUnusedImports
	}
};

export default plugin;
