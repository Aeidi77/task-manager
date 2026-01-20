export interface ApiResponse<T = any> {
    data?: T
    error?: string
    message?: string
  }
  
  export interface User {
    id: string
    email: string
    name: string | null
  }
  
  export interface TaskList {
    id: string
    name: string
    description: string | null
    ownerId: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }
  
  export interface Task {
    id: string
    title: string
    status: 'TODO' | 'IN_PROGRESS' | 'DONE'
    deadline: Date | null
    order: number
    taskListId: string
    createdById: string
    createdAt: Date
    updatedAt: Date
    deletedAt: Date | null
  }
  
  export interface Collaborator {
    id: string
    taskListId: string
    userId: string
    createdAt: Date
    user: User
  }