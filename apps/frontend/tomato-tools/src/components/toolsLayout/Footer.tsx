'use client';

import React from 'react';
import { FaCog, FaRegImage } from 'react-icons/fa';

const Footer = () => {
	return (
		<footer className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/80 p-4 backdrop-blur-md dark:border-gray-700 dark:bg-gray-800/80">
			<div className="container mx-auto flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<button
						id="bg-toggle"
						title="背景设置"
						className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<FaRegImage className="text-gray-700 dark:text-gray-300" />
					</button>
					<button
						id="settings"
						title="设置"
						className="relative rounded-full p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
					>
						<FaCog className="text-gray-700 dark:text-gray-300" />
					</button>
				</div>

				<div>
					<span className="text-xs text-gray-500 dark:text-gray-400">
						© 2025 番茄工具. 保留所有权利。
					</span>
				</div>
			</div>
		</footer>
	);
};

export default Footer;
