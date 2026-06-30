import { User } from './types'

export function getSubordinateIds(userId: string, users: User[]): string[] {
  const directReports = users.filter((u) => u.managerId === userId).map((u) => u.id)
  const indirectReports = directReports.flatMap((id) => getSubordinateIds(id, users))
  return [...directReports, ...indirectReports]
}

export function getDirectReports(userId: string, users: User[]): User[] {
  return users.filter((u) => u.managerId === userId)
}
