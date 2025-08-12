// 任务状态枚举
 export type TodoStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

// 任务优先级枚举
 export type TodoPriority = 'low' | 'medium' | 'high' | 'urgent';

// 待办事项接口
 export interface Todo {
	id: string;
	userId: string;
	title: string;
	description?: string;
	status: TodoStatus;
	priority: TodoPriority;
	dueDate?: string;
	completed: boolean;
	archived: boolean;
	createdAt: string;
	updatedAt: string;
}

/**
 * 创建新待办事项的请求参数
 */
export interface TodoAddRequest {
	title: string;
	description?: string;
	priority?: TodoPriority;
	dueDate?: string;
}

/**
 * 更新待办事项的请求参数
 */
export interface TodoUpdateRequest {
	id: string;
	title?: string;
	description?: string;
	status?: TodoStatus;
	priority?: TodoPriority;
	dueDate?: string;
	completed?: boolean;
	archived?: boolean;
}

/**
 * 归档待办事项的请求参数
 */
export interface TodoArchiveRequest {
	id: string;
	archived: boolean;
}

/**
 * 删除待办事项的请求参数
 */
export interface TodoDeleteRequest {
	id: string;
}

/**
 * 获取待办事项列表的响应格式
 */
export interface TodoGetResponse {
	todos: Todo[];
}

/**
 * 添加待办事项的响应格式
 */
export interface TodoAddResponse {
	todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'> & {
		id?: string;
		createdAt?: string;
		updatedAt?: string;
	};
}

/**
 * 更新和归档待办事项的响应格式
 */
export interface TodoUpdateResponse {
	todo: Todo;
}

/**
 * 删除待办事项的响应格式
 */
export interface TodoDeleteResponse {
	success: boolean;
	id: string;
}

/**
 * API错误响应格式
 */
export interface ApiError {
	error: string;
}

/**
 * 所有Todo相关API响应的联合类型
 */
export type TodoApiResponse =
	| TodoGetResponse
	| TodoAddResponse
	| TodoUpdateResponse
	| TodoDeleteResponse
	| ApiError;
