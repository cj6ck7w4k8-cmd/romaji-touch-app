import { describe, expect, it } from 'vitest'
import { allKana, dakutenGroupNames, dakutenGroups, groupNames, kanaGroups, pairKana, pairs, shortWords, shuffle, voicedYouonGroupNames, voicedYouonGroups, youonGroupNames, youonGroups } from './data'
import { bookRows, currentLevelFor, finish, medalsFor, nextStageFor, progressBadges, questionCount, questionPool, resultFeedback, resultStars, rowLabel, stageStatus } from './App'
import { emptyProgress } from './storage'

describe('もんだいでーた', () => {
  it('にほんしきの もじを ふくむ', () => {
    expect(allKana.find(x => x.kana === 'し')?.roma).toBe('si')
    expect(allKana.find(x => x.kana === 'つ')?.roma).toBe('tu')
    expect(kanaGroups['あ']).toHaveLength(5)
    expect(pairKana('あか')).toHaveLength(10)
    expect(dakutenGroupNames).toEqual(['が', 'ざ', 'だ', 'ば', 'ぱ'])
    expect(dakutenGroups['ざ'].find(x => x.kana === 'じ')?.roma).toBe('zi')
    expect(dakutenGroups['だ'].find(x => x.kana === 'ぢ')?.roma).toBe('di')
    expect(youonGroups['しゃ'].find(x => x.kana === 'しょ')?.roma).toBe('syo')
    expect(voicedYouonGroups['じゃ'].find(x => x.kana === 'じゅ')?.roma).toBe('zyu')
    expect(shortWords.find(x => x.kana === 'がっき')?.roma).toBe('gakki')
  })
  it('しゃっふるで もとの もじを なくさない', () => {
    expect(shuffle(['a','b','c']).sort()).toEqual(['a','b','c'])
  })
  it('せんたくしは いまの がくしゅう はんいだけから えらぶ', () => {
    expect(questionPool({ level: 1, set: 'あ', random: false, mode: 'challenge' }).map(item => item.roma)).toEqual(['a', 'i', 'u', 'e', 'o'])
    expect(questionPool({ level: 1, set: 'や', random: false, mode: 'challenge' }).map(item => item.roma)).toEqual(['ya', 'yu', 'yo'])
    expect(questionPool({ level: 2, set: 'あか', random: false, mode: 'challenge' })).toHaveLength(10)
    expect(questionPool({ level: 4, set: 'が', random: false, mode: 'challenge' }).map(item => item.roma)).toEqual(['ga', 'gi', 'gu', 'ge', 'go'])
    expect(questionPool({ level: 5, set: 'しゃ', random: false, mode: 'challenge' }).map(item => item.roma)).toEqual(['sya', 'syu', 'syo'])
    expect(questionPool({ level: 8, set: 'words', random: true, mode: 'challenge' })).toEqual(shortWords)
  })
  it('レベル5と6は ぎょうぜんたいの もじで ひょうじする', () => {
    expect(rowLabel(5, 'きゃ')).toBe('きゃきゅきょ')
    expect(rowLabel(5, 'しゃ')).toBe('しゃしゅしょ')
    expect(rowLabel(6, 'ぎゃ')).toBe('ぎゃぎゅぎょ')
    expect(rowLabel(6, 'じゃ')).toBe('じゃじゅじょ')
  })
  it('いちらんは ぎょうの とちゅうで われない', () => {
    expect(bookRows(1)[0].map(item => item.kana).join('')).toBe('あいうえおかきくけこ')
    expect(bookRows(1)[1].map(item => item.kana).join('')).toBe('さしすせそたちつてと')
    expect(bookRows(5)[0].map(item => item.kana).join('')).toBe('きゃきゅきょしゃしゅしょちゃちゅちょ')
    expect(bookRows(6)[0].map(item => item.kana).join('')).toBe('ぎゃぎゅぎょじゃじゅじょ')
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
  it('けっかがめんには こんかい とれた ほしだけを だす', () => {
    const choice = {level:1 as const,set:'あ',random:false,mode:'challenge' as const}
    expect(resultStars(choice, {misses:1,seconds:8})).toEqual(['speed'])
    expect(resultStars({...choice, mode:'practice'}, {misses:0,seconds:1})).toEqual([])
  })
  it('けっかの ひょうじは もらえた バッジと つぎの もくひょうに あう', () => {
    const choice = { level: 1 as const, set: 'あ', random: false, mode: 'challenge' as const }
    expect(resultFeedback(choice, { misses: 0, seconds: 11 })).toContain('はやさ')
    expect(resultFeedback(choice, { misses: 0, seconds: 8 })).toBe('バッジを 2こ ゲット！')
    expect(resultFeedback(choice, { misses: 1, seconds: 8 })).toContain('まちがえなし')
    expect(resultFeedback({ level: 4 as const, set: 'が', random: false, mode: 'challenge' as const }, { misses: 1, seconds: 1 })).toContain('まちがえなし')
  })
  it('けっかがめんの もんすうは えらんだ はんいと おなじ', () => {
    expect(questionCount({level:1,set:'や',random:false,mode:'challenge'})).toBe(3)
    expect(questionCount({level:2,set:'あか',random:false,mode:'challenge'})).toBe(10)
    expect(questionCount({level:3,set:'all',random:false,mode:'challenge'})).toBe(allKana.length)
  })
  it('れべる3の けっかには すぴーどのほしを ださない', () => {
    expect(resultStars({level:3,set:'all',random:false,mode:'challenge'}, {misses:0,seconds:1})).toEqual(['no-miss'])
  })
  it('ほーむに ほしと すぴーどの きろくを まとめる', () => {
    const progress = finish(emptyProgress(), {level:1,set:'あ',random:false,mode:'challenge'}, {misses:0,seconds:8})
    expect(progressBadges(progress)).toEqual({noMiss:1, speed:1})
  })
  it('えらんだ もんだいの くりあと ほしを だせる', () => {
    const choice = {level:1 as const,set:'あ',random:false,mode:'challenge' as const}
    const progress = finish(emptyProgress(), choice, {misses:0,seconds:8})
    expect(stageStatus(progress, choice)).toEqual({completed:true, noMiss:true, speed:true, bestTime:undefined})
    expect(stageStatus(progress, {...choice, set:'か'})).toEqual({completed:false, noMiss:false, speed:false, bestTime:undefined})
  })
  it('いまの れべるを かいほうじょうきょうから きめる', () => {
    const level2 = { ...emptyProgress(), stars: Object.fromEntries(groupNames.map(group => [`1-${group}-normal`, ['no-miss', 'speed']])) }
    const level3 = { ...level2, stars: { ...level2.stars, ...Object.fromEntries(pairs.map(pair => [`2-${pair}-normal`, ['no-miss', 'speed']])) } }
    expect(currentLevelFor(emptyProgress())).toBe(1)
    expect(currentLevelFor(level2)).toBe(2)
    expect(currentLevelFor(level3)).toBe(3)
  })
  it('ほーむから つぎに とりくむ もんだいを えらぶ', () => {
    const level1 = { ...emptyProgress(), stars: { '1-あ-normal': ['no-miss', 'speed'] } }
    const level2 = { ...emptyProgress(), stars: Object.fromEntries(groupNames.map(group => [`1-${group}-normal`, ['no-miss', 'speed']])) }
    const level3 = { ...level2, stars: { ...level2.stars, ...Object.fromEntries(pairs.map(pair => [`2-${pair}-normal`, ['no-miss', 'speed']])) } }
    expect(nextStageFor(emptyProgress())).toMatchObject({ level: 1, set: 'あ', random: false, mode: 'challenge' })
    expect(nextStageFor(level1)).toMatchObject({ level: 1, set: 'か', random: false })
    expect(nextStageFor(level2)).toMatchObject({ level: 2, set: pairs[0], random: false })
    expect(nextStageFor(level3)).toMatchObject({ level: 3, set: 'all', random: false })
    expect(nextStageFor({ ...level3, stars: { ...level3.stars, '3-all-normal': ['no-miss'] } })).toMatchObject({ level: 4, set: 'が', random: false })
  })
  it('レベル4は まちがえなしだけを きろくする', () => {
    const choice = {level:4 as const,set:'が',random:false,mode:'challenge' as const}
    expect(questionCount(choice)).toBe(5)
    expect(resultStars(choice, {misses:0,seconds:1})).toEqual(['no-miss'])
    expect(finish(emptyProgress(), choice, {misses:0,seconds:1}).stars['4-が-normal']).toEqual(['no-miss'])
  })
  it('レベル4は できたぎょうの つぎを あんないする', () => {
    const level4Open = { ...emptyProgress(), stars: { '3-all-normal': ['no-miss'], '4-が-normal': ['no-miss'] } }
    expect(nextStageFor(level4Open)).toMatchObject({ level: 4, set: 'ざ', random: false })
    expect(dakutenGroupNames.every(group => questionCount({ level: 4, set: group, random: false, mode: 'challenge' }) === 5)).toBe(true)
  })
  it('レベル5と6は 3もじずつ、レベル7と8は きめた もんすうをだす', () => {
    expect(youonGroupNames.every(group => questionCount({ level: 5, set: group, random: false, mode: 'challenge' }) === 3)).toBe(true)
    expect(voicedYouonGroupNames.every(group => questionCount({ level: 6, set: group, random: false, mode: 'challenge' }) === 3)).toBe(true)
    expect(questionCount({ level: 7, set: 'all', random: true, mode: 'challenge' })).toBe(30)
    expect(questionCount({ level: 8, set: 'words', random: true, mode: 'challenge' })).toBe(10)
  })
  it('レベル5から8は まちがえなしの バッジだけを きろくする', () => {
    const choices = [
      { level: 5 as const, set: 'きゃ', random: false, mode: 'challenge' as const },
      { level: 6 as const, set: 'ぎゃ', random: false, mode: 'challenge' as const },
      { level: 7 as const, set: 'all', random: true, mode: 'challenge' as const },
      { level: 8 as const, set: 'words', random: true, mode: 'challenge' as const },
    ]
    choices.forEach(choice => expect(resultStars(choice, { misses: 0, seconds: 1 })).toEqual(['no-miss']))
  })
  it('レベル6まで まちがえなしなら レベル7、そのあとレベル8を あんないする', () => {
    const until6 = {
      ...emptyProgress(),
      stars: {
        '3-all-normal': ['no-miss'],
        ...Object.fromEntries(dakutenGroupNames.map(group => [`4-${group}-normal`, ['no-miss']])),
        ...Object.fromEntries(youonGroupNames.map(group => [`5-${group}-normal`, ['no-miss']])),
        ...Object.fromEntries(voicedYouonGroupNames.map(group => [`6-${group}-normal`, ['no-miss']])),
      },
    }
    expect(currentLevelFor(until6)).toBe(7)
    expect(nextStageFor(until6)).toMatchObject({ level: 7, set: 'all', random: true })
    const level8 = { ...until6, stars: { ...until6.stars, '7-all-random': ['no-miss'] } }
    expect(currentLevelFor(level8)).toBe(8)
    expect(nextStageFor(level8)).toMatchObject({ level: 8, set: 'words', random: true })
  })
  it('れべる1と2の ぜんぶの バッジから メダルを きめる', () => {
    const progress = {
      ...emptyProgress(),
      stars: {
        ...Object.fromEntries(groupNames.map(group => [`1-${group}-normal`, ['no-miss', 'speed']])),
        ...Object.fromEntries(pairs.map(pair => [`2-${pair}-normal`, ['no-miss', 'speed']])),
      },
    }
    expect(medalsFor(progress)).toEqual(['level1-no-miss', 'level1-speed', 'level2-no-miss', 'level2-speed'])
  })
  it('れべる3の はやさ メダルは まちがえなしが ひつよう', () => {
    const progress = {
      ...emptyProgress(),
      stars: { '3-all-normal': ['no-miss'], '3-all-random': ['no-miss'] },
      bestTimes: { '3-all-normal': 74.9, '3-all-random': 90 },
    }
    expect(medalsFor(progress)).toEqual(['normal-no-miss', 'normal-90', 'normal-75', 'random-no-miss', 'random-90'])
    const missed = { ...progress, stars: { ...progress.stars, '3-all-random': [] } }
    expect(medalsFor(missed)).not.toContain('random-90')
  })
})
