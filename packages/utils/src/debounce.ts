// 防抖函数
export const debounce = (fn: Function, delay: number) => {
	let timer: ReturnType<typeof setTimeout> | null = null;
	return function (...args: any[]) {
		if (timer) {
			clearTimeout(timer);
		}
		timer = setTimeout(() => {
			fn.apply(this, args);
		}, delay);
	};
};
