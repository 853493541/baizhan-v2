// in-game/cards/cardNameMap.ts
// Frontend display name map
// sourceCardId  -> 中文技能名
// MUST match backend/game/cards/cards.ts exactly

export const CARD_NAME_MAP: Record<string, string> = {
  // 基础攻击
  jianpo_xukong: "剑破虚空",
  sanhuan_taoyue: "三环套月",

  // 控制 / 压制
  mohe_wuliang: "摩诃无量",
  shengsi_jie: "生死劫",
  chan_xiao: "蝉啸",

  // 解控 / 防御
  jiru_feng: "疾如风",
  sanliu_xia: "散流霞",
  que_ta_zhi: "鹊踏枝",

  // 生存 / 回复
  fengxiu_diang: "风袖低昂",
  qiandie_turui: "千蝶吐瑞",

  // 特殊
  anchen_misan: "暗尘弥散",

  // 持续伤害 / 节奏
  fenglai_wushan: "风来吴山",
  wu_jianyu: "无间狱",
  baizu: "百足",

  // 强化 / 爆发
  nuwa_butian: "女娲补天",
};
