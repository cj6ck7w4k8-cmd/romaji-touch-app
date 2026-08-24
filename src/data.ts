export type Kana = { kana: string; roma: string; group: string }

// 型情報を保ったまま、行名を各文字に付与する。
const raw: Record<string, [string, string][]> = {
  'あ': [['あ','a'],['い','i'],['う','u'],['え','e'],['お','o']], 'か': [['か','ka'],['き','ki'],['く','ku'],['け','ke'],['こ','ko']],
  'さ': [['さ','sa'],['し','si'],['す','su'],['せ','se'],['そ','so']], 'た': [['た','ta'],['ち','ti'],['つ','tu'],['て','te'],['と','to']],
  'な': [['な','na'],['に','ni'],['ぬ','nu'],['ね','ne'],['の','no']], 'は': [['は','ha'],['ひ','hi'],['ふ','hu'],['へ','he'],['ほ','ho']],
  'ま': [['ま','ma'],['み','mi'],['む','mu'],['め','me'],['も','mo']], 'や': [['や','ya'],['ゆ','yu'],['よ','yo']],
  'ら': [['ら','ra'],['り','ri'],['る','ru'],['れ','re'],['ろ','ro']], 'わ': [['わ','wa'],['を','wo'],['ん','n']]
}
export const kanaGroups: Record<string, Kana[]> = Object.fromEntries(Object.entries(raw).map(([group, items]) => [group, items.map(([kana, roma]) => ({ kana, roma, group }))]))
export const groupNames = Object.keys(kanaGroups)
export const allKana = Object.values(kanaGroups).flat()
export const pairs = groupNames.slice(0, -1).map((name, i) => `${name}${groupNames[i + 1]}`)
export const pairKana = (pair: string) => pair.split('').flatMap((name) => kanaGroups[name])

const dakutenRaw: Record<string, [string, string][]> = {
  'が': [['が','ga'],['ぎ','gi'],['ぐ','gu'],['げ','ge'],['ご','go']],
  'ざ': [['ざ','za'],['じ','zi'],['ず','zu'],['ぜ','ze'],['ぞ','zo']],
  'だ': [['だ','da'],['ぢ','di'],['づ','du'],['で','de'],['ど','do']],
  'ば': [['ば','ba'],['び','bi'],['ぶ','bu'],['べ','be'],['ぼ','bo']],
  'ぱ': [['ぱ','pa'],['ぴ','pi'],['ぷ','pu'],['ぺ','pe'],['ぽ','po']],
}
export const dakutenGroups: Record<string, Kana[]> = Object.fromEntries(Object.entries(dakutenRaw).map(([group, items]) => [group, items.map(([kana, roma]) => ({ kana, roma, group }))]))
export const dakutenGroupNames = Object.keys(dakutenGroups)
export const allDakuten = Object.values(dakutenGroups).flat()

const youonRaw: Record<string, [string, string][]> = {
  'きゃ': [['きゃ','kya'],['きゅ','kyu'],['きょ','kyo']],
  'しゃ': [['しゃ','sya'],['しゅ','syu'],['しょ','syo']],
  'ちゃ': [['ちゃ','tya'],['ちゅ','tyu'],['ちょ','tyo']],
  'にゃ': [['にゃ','nya'],['にゅ','nyu'],['にょ','nyo']],
  'ひゃ': [['ひゃ','hya'],['ひゅ','hyu'],['ひょ','hyo']],
  'みゃ': [['みゃ','mya'],['みゅ','myu'],['みょ','myo']],
  'りゃ': [['りゃ','rya'],['りゅ','ryu'],['りょ','ryo']],
}
export const youonGroups: Record<string, Kana[]> = Object.fromEntries(Object.entries(youonRaw).map(([group, items]) => [group, items.map(([kana, roma]) => ({ kana, roma, group }))]))
export const youonGroupNames = Object.keys(youonGroups)
export const allYouon = Object.values(youonGroups).flat()

const voicedYouonRaw: Record<string, [string, string][]> = {
  'ぎゃ': [['ぎゃ','gya'],['ぎゅ','gyu'],['ぎょ','gyo']],
  'じゃ': [['じゃ','zya'],['じゅ','zyu'],['じょ','zyo']],
  'びゃ': [['びゃ','bya'],['びゅ','byu'],['びょ','byo']],
  'ぴゃ': [['ぴゃ','pya'],['ぴゅ','pyu'],['ぴょ','pyo']],
}
export const voicedYouonGroups: Record<string, Kana[]> = Object.fromEntries(Object.entries(voicedYouonRaw).map(([group, items]) => [group, items.map(([kana, roma]) => ({ kana, roma, group }))]))
export const voicedYouonGroupNames = Object.keys(voicedYouonGroups)
export const allVoicedYouon = Object.values(voicedYouonGroups).flat()
export const allAvailableKana = [...allKana, ...allDakuten, ...allYouon, ...allVoicedYouon]
export const shortWords: Kana[] = [
  ['あさ','asa'], ['いえ','ie'], ['うみ','umi'], ['かさ','kasa'], ['くつ','kutu'],
  ['すし','susi'], ['ねこ','neko'], ['ふね','hune'], ['きゃく','kyaku'], ['しゃしん','syasin'],
  ['がっき','gakki'], ['きって','kitte'], ['きっぷ','kippu'], ['ざっし','zassi'], ['せっけん','sekken'],
  ['まっすぐ','massugu'], ['ちょっと','tyotto'], ['はっぱ','happa'], ['らっぱ','rappa'], ['にっき','nikki'],
].map(([kana, roma]) => ({ kana, roma, group: 'ことば' }))
export const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5)
