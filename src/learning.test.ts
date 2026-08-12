import { describe, expect, it } from 'vitest'
import { allKana, kanaGroups, pairKana, shuffle } from './data'
import { finish } from './App'
import { emptyProgress } from './storage'

describe('もんだいでーた', () => {
  it('にほんしきの もじを ふくむ', () => {
    expect(allKana.find(x => x.kana === 'し')?.roma).toBe('si')
    expect(allKana.find(x => x.kana === 'つ')?.roma).toBe('tu')
    expect(kanaGroups['あ']).toHaveLength(5)
    expect(pairKana('あか')).toHaveLength(10)
  })
  it('しゃっふるで もとの もじを なくさない', () => {
    expect(shuffle(['a','b','c']).sort()).toEqual(['a','b','c'])
  })
})

describe('きろく', () => {
  it('のーみすと はやさの ほしを ほぞんする', () => {
    const progress = finish(emptyProgress(), {level:1,set:'あ',random:false,mode:'challenge'}, {misses:0,seconds:8})
    expect(progress.completed).toContain('1-あ-normal')
    expect(progress.stars['1-あ-normal']).toEqual(['no-miss','speed'])
  })
  it('れべる3の さいたん たいむだけを こうしんする', () => {
    const choice = {level:3 as const,set:'all',random:false,mode:'challenge' as const}
    const first = finish(emptyProgress(), choice, {misses:0,seconds:35})
    const second = finish(first, choice, {misses:1,seconds:40})
    expect(second.bestTimes['3-all-normal']).toBe(35)
  })
  it('れんしゅうでは ほしも かいほうも きろくしない', () => {
    const progress = finish(emptyProgress(), {level:1,set:'あ',random:false,mode:'practice'}, {misses:0,seconds:1})
    expect(progress).toEqual(emptyProgress())
  })
  it('ほんばんで まちがえたら のーみすのほしを つけない', () => {
    const progress = finish(emptyProgress(), {level:1,set:'あ',random:false,mode:'challenge'}, {misses:1,seconds:8})
    expect(progress.stars['1-あ-normal']).toEqual(['speed'])
  })
})
