export type Progress = { completed: string[]; stars: Record<string, string[]>; bestTimes: Record<string, number> }
export const emptyProgress = (): Progress => ({ completed: [], stars: {}, bestTimes: {} })
const key = 'romaji-master-progress-v1'
export const loadProgress = (): Progress => { try { return { ...emptyProgress(), ...JSON.parse(localStorage.getItem(key) || '{}') } } catch { return emptyProgress() } }
export const saveProgress = (progress: Progress) => localStorage.setItem(key, JSON.stringify(progress))
export const clearProgress = () => localStorage.removeItem(key)
