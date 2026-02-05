// backend/game/cards/cards.ts

import { Card } from "../engine/state/types";

export const CARDS: Record<string, Card & { description: string }> = {
  /* ================= 基础攻击 ================= */

  jianpo_xukong: {
    id: "jianpo_xukong",
    name: "剑破虚空",
    description: "造成10点伤害\n使目标每回合受到2点伤害，持续3回合",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 10 }],
    buffs: [
      {
        buffId: 1022,
        name: "急曲",
        category: "DEBUFF",
        durationTurns: 3,
        description: "回合开始时受到3点伤害",
        effects: [{ type: "START_TURN_DAMAGE", value: 3 }],
      },
    ],
  },

  sanhuan_taoyue: {
    id: "sanhuan_taoyue",
    name: "三环套月",
    description: "造成5点伤害\n抽一张牌",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 5 },
      { type: "DRAW", value: 1 },
    ],
  },

  baizu: {
    id: "baizu",
    name: "百足",
    description: "造成3点伤害\n对手每个回合开始时受到8点伤害，持续3个回合",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 3 }],
    buffs: [
      {
        buffId: 1001,
        name: "百足",
        category: "DEBUFF",
        durationTurns: 3,
        description: "回合开始时受到8点伤害",
        effects: [{ type: "START_TURN_DAMAGE", value: 8 }],
      },
    ],
  },

  /* ================= 控制 / 压制 ================= */

  mohe_wuliang: {
    id: "mohe_wuliang",
    name: "摩诃无量",
    description: "造成10点伤害\n【控制】目标1个回合",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 10 }],
    buffs: [
      {
        buffId: 1002,
        name: "摩诃无量",
        category: "DEBUFF",
        durationTurns: 1,
        description: "击倒",
        effects: [{ type: "CONTROL" }],
      },
    ],
  },

shengsi_jie: {
  id: "shengsi_jie",
  name: "生死劫",
  description: "造成2点伤害\n【控制】目标1个回合\n【减疗】3个回合",
  type: "CONTROL",
  target: "OPPONENT",
  effects: [{ type: "DAMAGE", value: 2 }],
  buffs: [
    {
      buffId: 1021,
      name: "月劫",
      category: "DEBUFF",
      durationTurns: 3,
      description: "受到治疗效果降低50%",
      effects: [{ type: "HEAL_REDUCTION", value: 0.5 }],
    },
    
    {
      buffId: 1003,
      name: "日劫",
      category: "DEBUFF",
      durationTurns: 1,
      description: "眩晕",
      effects: [{ type: "CONTROL" }],
    },

  ],
},

  chan_xiao: {
    id: "chan_xiao",
    name: "蟾啸",
    description: "造成10点伤害\n目标1回合无法使用卡牌\n每回合开始时受到2点伤害，持续3回合。",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 10 }],
    buffs: [
      
       {
        buffId: 1025,
        name: "蟾啸",
        category: "DEBUFF",
        durationTurns: 3,
        description: "回合开始时受到2点伤害",
        effects: [{ type: "START_TURN_DAMAGE", value: 2 }],
      },
      {
        buffId: 1004,
        name: "蟾啸迷心",
        category: "DEBUFF",
        durationTurns: 1,
        description: "无法使用卡牌",
        effects: [{ type: "SILENCE" }],
      },
    ],
  },

  da_shizi_hou: {
    id: "da_shizi_hou",
    name: "大狮子吼",
    description: "眩晕目标1回合\n使其下个回合抽卡数量减一",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [],
    buffs: [
      {
        buffId: 1005,
        name: "大狮子吼",
        category: "DEBUFF",
        durationTurns: 1,
        description: "眩晕，下回合抽卡数量减一",
        effects: [
          { type: "CONTROL" },
          { type: "DRAW_REDUCTION", value: 1 },
        ],
      },
    ],
  },

  jiangchun_zhuxiu: {
    id: "jiangchun_zhuxiu",
    name: "绛唇珠袖",
    description: "使目标每次使用卡牌时受到3点伤害，持续3个回合",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [],
    buffs: [
      {
        buffId: 1006,
        name: "绛唇珠袖",
        category: "DEBUFF",
        durationTurns: 3,
        description: "使用卡牌则受到3点伤害",
        effects: [{ type: "ON_PLAY_DAMAGE", value: 3 }],
      },
    ],
  },

  /* ================= 解控 / 防御 ================= */

  jiru_feng: {
    id: "jiru_feng",
    name: "疾如风",
    description: "解控\n抽两张牌",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "CLEANSE", allowWhileControlled: true },
      { type: "DRAW", value: 2, allowWhileControlled: true },
    ],
  },

  sanliu_xia: {
    id: "sanliu_xia",
    name: "散流霞",
    description: "解控\n抽1张牌\n恢复5点生命值\n【不可选中】一回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "CLEANSE", allowWhileControlled: true },
      { type: "DRAW", value: 1, allowWhileControlled: true },
      { type: "HEAL", value: 10, allowWhileControlled: true },
    ],
    buffs: [
      {
        buffId: 1007,
        name: "散流霞",
        category: "BUFF",
        durationTurns: 1,
        breakOnPlay: true,
        description: "无法被卡牌选中",
        effects: [{ type: "UNTARGETABLE" }],
      },
    ],
  },

  que_ta_zhi: {
    id: "que_ta_zhi",
    name: "鹊踏枝",
    description: "解控\n免疫控制\n下次受到伤害有70%概率闪避",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "CLEANSE", allowWhileControlled: true }],
    buffs: [
      {
        buffId: 1008,
        name: "鹊踏枝",
        category: "BUFF",
        durationTurns: 1,
        description: "免疫控制\n被命中概率降低70%",
        effects: [
          { type: "CONTROL_IMMUNE" },
          { type: "DODGE_NEXT", chance: 0.7 },
        ],
      },
    ],
  },

  /* ================= 生存 / 回复 ================= */

  fengxiu_diang: {
    id: "fengxiu_diang",
    name: "风袖低昂",
    description: "恢复70点生命值\n受到伤害降低40%，持续2回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "HEAL", value: 70 }],
    buffs: [
      {
        buffId: 1009,
        name: "风袖低昂",
        category: "BUFF",
        durationTurns: 2,
        description: "受到伤害降低40%",
        effects: [{ type: "DAMAGE_REDUCTION", value: 0.4 }],
      },
    ],
  },

  qionglong_huasheng: {
    id: "qionglong_huasheng",
    name: "穹隆化生",
    description: "抽1张牌\n恢复10点生命值\n免控1回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "DRAW", value: 1 },
      { type: "HEAL", value: 10 },
    ],
    buffs: [
      {
        buffId: 1010,
        name: "生太极",
        category: "BUFF",
        durationTurns: 1,
        description: "免疫控制",
        effects: [{ type: "CONTROL_IMMUNE" }],
      },
    ],
  },

  /* ================= 隐身 / 干扰 ================= */

  anchen_misan: {
    id: "anchen_misan",
    name: "暗尘弥散",
    description: "抽2张牌\n隐身1回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "DRAW", value: 2, allowWhileControlled: true }],
    buffs: [
      {
        buffId: 1011,
        name: "暗尘弥散",
        category: "BUFF",
        durationTurns: 1,
        breakOnPlay: true,
        description: "隐身",
        effects: [{ type: "STEALTH" }],
      },
    ],
  },

  fuguang_lueying: {
    id: "fuguang_lueying",
    name: "浮光掠影",
    description: "【隐身】4回合\n下2回合抽卡-1",
    type: "SUPPORT",
    target: "SELF",
    effects: [],
    buffs: [
      {
        buffId: 1012,
        name: "浮光掠影",
        category: "BUFF",
        durationTurns: 4,
        breakOnPlay: true,
        description: "隐身\n抽卡数量减少",
        effects: [
          { type: "STEALTH" },
          { type: "DRAW_REDUCTION", value: 1 },
        ],
      },
    ],
  },

  tiandi_wuji: {
    id: "tiandi_wuji",
    name: "天地无极",
    description: "造成5点伤害\n隐身1回合",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 5 }],
    buffs: [
      {
        buffId: 1013,
        name: "天地无极",
        category: "BUFF",
        durationTurns: 1,
        breakOnPlay: true,
        description: "隐身",
        effects: [{ type: "STEALTH" }],
        applyTo: "SELF", 
      },
    ],
  },

  /* ================= 运功 / 节奏 ================= */

  fenglai_wushan: {
    id: "fenglai_wushan",
    name: "风来吴山",
    description: "持续运功，对敌造成周期伤害",
    // breakOnPlay: true, 
    type: "CHANNEL",
    target: "SELF",
    effects: [],
    buffs: [
      {
        buffId: 1014,
        name: "不工",
        category: "BUFF",
        breakOnPlay: true, 
        durationTurns: 1,
        description: "无",
        effects: [{ type: "FENGLAI_CHANNEL" }],
      },
      {
        buffId: 1015,
        name: "不工",
        category: "BUFF",
            breakOnPlay: true, 
        durationTurns: 1,
        description: "免疫控制",
        effects: [{ type: "CONTROL_IMMUNE" }],
      },
    ],
  },

  wu_jianyu: {
    id: "wu_jianyu",
    name: "无间狱",
    description: "修罗附体\n对目标发起三段挥砍\n期间蓄力额外对目标造成一次伤害。30%吸血",
    type: "CHANNEL",
    target: "SELF",
    effects: [],
    buffs: [
      {
        buffId: 1016,
        name: "无间狱",
        category: "BUFF",
        durationTurns: 1,
        description: "修罗附体",
        effects: [{ type: "WUJIAN_CHANNEL" }],
      },
    ],
  },

  xinzheng: {
    id: "xinzheng",
    name: "心诤",
    description: "持续运功，对目标多段造成伤害",
    type: "CHANNEL",
    target: "SELF",
    effects: [],
    buffs: [
      {
        buffId: 1017,
        name: "心诤",
        category: "BUFF",
         breakOnPlay: true, 
        durationTurns: 2,
        description: "无",
        effects: [{ type: "XINZHENG_CHANNEL" }],
      },
      {
        buffId: 1018,
        name: "心诤",
        category: "BUFF",
          breakOnPlay: true, 
        durationTurns: 2,
        description: "免疫控制",
        effects: [{ type: "CONTROL_IMMUNE" }],
      },
    ],
  },

  /* ================= 爆发 / 强化 ================= */

  nuwa_butian: {
    id: "nuwa_butian",
    name: "女娲补天",
    description: "造成伤害提升100%\n受到伤害降低50%",
    type: "STANCE",
    target: "SELF",
    effects: [],
    buffs: [
      {
        buffId: 1019,
        name: "女娲补天",
        category: "BUFF",
        durationTurns: 1,
        description: "造成伤害提升100%\n受到伤害降低50%",
        effects: [
          { type: "DAMAGE_MULTIPLIER", value: 2 },
          { type: "DAMAGE_REDUCTION", value: 0.5 },
        ],
      },
    ],
  },

  taxingxing: {
    id: "taxingxing",
    name: "踏星行",
    description: "抽1张牌\n被命中几率降低65%，持续2回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "DRAW", value: 1 }],
    buffs: [
      {
        buffId: 1020,
        name: "踏星行",
        category: "BUFF",
        durationTurns: 2,
        description: "被命中几率降低65%",
        effects: [{ type: "DODGE_NEXT", chance: 0.65 }],
      },
    ],
  },

  /* ================= 其他 ================= */

  zhuiming_jian: {
    id: "zhuiming_jian",
    name: "追命箭",
    description: "造成20点伤害\n目标生命值高于60时额外造成10点伤害",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 20 },
      {
        type: "BONUS_DAMAGE_IF_TARGET_HP_GT",
        value: 10,
        threshold: 60,
      },
    ],
  },

  quye_duanchou: {
    id: "quye_duanchou",
    name: "驱夜断愁",
    description: "造成8点伤害\n回复4点生命值",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 8 },
      { type: "HEAL", value: 4, applyTo: "SELF" },
    ],
  },
};
