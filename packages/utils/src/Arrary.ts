export const uniqueArray = <T>(array: T[]): T[] => [...new Set(array)];
export const chunkArray = <T>(array: T[], size: number): T[][] => {
	const result: T[][] = [];
	for (let i = 0; i < array.length; i += size) {
		result.push(array.slice(i, i + size));
	}
	return result;
};
export const flattenArray = <T>(array: T[][]): T[] =>
	array.reduce((acc, val) => acc.concat(val), []);
export const removeDuplicates = <T>(array: T[]): T[] => {
	return array.filter((item, index) => array.indexOf(item) === index);
};

// 创建一个新数组，包含原数组中所有的非假值元素。例如false, null,0, "", undefined, 和 NaN 都是被认为是“假值”。
export const compact = <T>(array: T[]): T[] => {
	return array.filter(Boolean);
};
