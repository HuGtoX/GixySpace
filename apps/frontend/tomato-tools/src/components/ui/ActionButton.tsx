import React from 'react';
import type { CSSProperties } from 'react';

interface ActionButtonProps {
	/** 点击事件处理函数 */
	onClick?: () => void;
	/** 图标组件 */
	icon?: React.ReactNode;
	/** 无障碍标签 */
	ariaLabel?: string;
	/** 自定义样式类 */
	className?: string;
	/** 按钮大小 */
	size?: 'xs' | 'sm' | 'md' | 'lg';
	/** 是否禁用 */
	disabled?: boolean;
	/** 是否加载中 */
	loading?: boolean;
	/** 自定义样式 */
	style?: CSSProperties;
	/** 按钮颜色状态 */
	color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
	/** 子元素内容 */
	children?: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({
	onClick,
	icon,
	ariaLabel,
	className = '',
	size = 'md',
	disabled = false,
	loading = false,
	style,
	color = 'primary',
	children
}) => {
	// 尺寸映射到文本大小类
	const sizeClasses = {
		xs: 'text-xs',
		sm: 'text-sm',
		md: 'text-base',
		lg: 'text-lg'
	};

	// 颜色状态映射
	const colorClasses = {
		primary:
			'text-primary hover:text-primary/80 dark:text-dark-primary dark:hover:text-dark-primary/80',
		success:
			'text-success hover:text-success/80 dark:text-dark-success dark:hover:text-dark-success/80',
		warning:
			'text-warning hover:text-warning/80 dark:text-dark-warning dark:hover:text-dark-warning/80',
		danger:
			'text-danger hover:text-danger/80 dark:text-dark-danger dark:hover:text-dark-danger/80',
		info: 'text-gray-400 hover:text-gray-600 dark:text-dark-info dark:hover:text-dark-info/80'
	};

	// 禁用状态样式
	const disabledClass =
		disabled || loading ? 'opacity-50 cursor-not-allowed' : '';

	return (
		<button
			onClick={onClick}
			className={`flex items-center gap-1 ${sizeClasses[size]} ${colorClasses[color]} ${disabledClass} transition-colors ${className}`}
			aria-label={ariaLabel}
			disabled={disabled || loading}
			style={style}
		>
			{icon && <span className='mr-1'>{icon}</span>}
			{children}
		</button>
	);
};

export default ActionButton;
