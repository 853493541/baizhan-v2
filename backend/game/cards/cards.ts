// backend/game/cards/cards.ts

import { Card } from "../engine/state/types";

export const CARDS: Record<string, Card & { description: string }> = {
  /* ================= 基础攻击 ================= */

  jianpo_xukong: {
    id: "jianpo_xukong",
    name: "剑破虚空",
    description: "造成10点伤害",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 10 }],
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
    description: "造成5点伤害\n对手每个回合开始时受到5点伤害，持续5个回合",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 5 }],
    buffs: [
      {
        buffId: 1001,
        name: "百足",
        category: "DEBUFF",
        durationTurns: 5,
        description: "回合开始时受到5点伤害",
        effects: [{ type: "START_TURN_DAMAGE", value: 5 }],
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
        buffId: 1003,
        name: "生死劫",
        category: "DEBUFF",
        durationTurns: 3,
        description: "无法行动\n受到治疗降低50%",
        effects: [
          { type: "CONTROL" },
          { type: "HEAL_REDUCTION", value: 0.5 },
        ],
      },
    ],
  },

  chan_xiao: {
    id: "chan_xiao",
    name: "蟾啸",
    description: "造成10点伤害\n【沉默】目标1个回合",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 10 }],
    buffs: [
      {
        buffId: 1004,
        name: "沉默",
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
    description: "【控制】目标1个回合\n下个回合目标抽卡数量-1",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [],
    buffs: [
      {
        buffId: 1005,
        name: "大狮子吼",
        category: "DEBUFF",
        durationTurns: 1,
        description: "无法行动\n下回合抽卡-1",
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
    description: "目标每次使用卡牌时受到3点伤害，持续3个回合",
    type: "CONTROL",
    target: "OPPONENT",
    effects: [],
    buffs: [
      {
        buffId: 1006,
        name: "绛唇",
        category: "DEBUFF",
        durationTurns: 3,
        description: "每次使用卡牌时受到3点伤害",
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
        name: "不可选中",
        category: "BUFF",
        durationTurns: 1,
        breakOnPlay: true,
        description: "无法成为卡牌目标",
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
        description: "免疫控制\n下次受击有70%概率闪避",
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
    description: "恢复60点生命值\n受到伤害降低50%，持续2回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "HEAL", value: 60 }],
    buffs: [
      {
        buffId: 1009,
        name: "风袖",
        category: "BUFF",
        durationTurns: 2,
        description: "受到伤害降低50%",
        effects: [{ type: "DAMAGE_REDUCTION", value: 0.5 }],
      },
    ],
  },

  qionglong_huasheng: {
    id: "qionglong_huasheng",
    name: "穹隆化生",
    description: "抽2张牌\n恢复10点生命值\n免疫控制2回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [
      { type: "DRAW", value: 2 },
      { type: "HEAL", value: 10 },
    ],
    buffs: [
      {
        buffId: 1010,
        name: "化生",
        category: "BUFF",
        durationTurns: 2,
        description: "免疫控制",
        effects: [{ type: "CONTROL_IMMUNE" }],
      },
    ],
  },

  /* ================= 隐身 / 干扰 ================= */

  anchen_misan: {
    id: "anchen_misan",
    name: "暗尘弥散",
    description: "抽2张牌\n【隐身】1回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "DRAW", value: 2, allowWhileControlled: true }],
    buffs: [
      {
        buffId: 1011,
        name: "隐身",
        category: "BUFF",
        durationTurns: 1,
        breakOnPlay: true,
        description: "无法被指定为卡牌目标",
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
    description: "造成5点伤害\n自身【隐身】1回合",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 5 }],
    buffs: [
      {
        buffId: 1013,
        name: "隐身",
        category: "BUFF",
        durationTurns: 1,
        breakOnPlay: true,
        description: "无法被指定为卡牌目标",
        effects: [{ type: "STEALTH" }],
      },
    ],
  },

  /* ================= 运功 / 节奏 ================= */

  fenglai_wushan: {
    id: "fenglai_wushan",
    name: "风来吴山",
    description: "持续运功，对敌造成周期伤害",
    type: "CHANNEL",
    target: "SELF",
    effects: [],
    buffs: [
      {
        buffId: 1014,
        name: "风来吴山",
        category: "BUFF",
        durationTurns: 1,
        description: "无",
        effects: [{ type: "FENGLAI_CHANNEL" }],
      },
      {
        buffId: 1015,
        name: "免控",
        category: "BUFF",
        durationTurns: 1,
        description: "免疫控制",
        effects: [{ type: "CONTROL_IMMUNE" }],
      },
    ],
  },

  wu_jianyu: {
    id: "wu_jianyu",
    name: "无间狱",
    description: "多段伤害并吸取生命",
    type: "CHANNEL",
    target: "SELF",
    effects: [],
    buffs: [
      {
        buffId: 1016,
        name: "无间狱",
        category: "BUFF",
        durationTurns: 1,
        description: "无",
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
        durationTurns: 2,
        description: "无",
        effects: [{ type: "XINZHENG_CHANNEL" }],
      },
      {
        buffId: 1018,
        name: "免控",
        category: "BUFF",
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
    description: "抽2张牌\n获得60%闪避，持续2回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "DRAW", value: 2 }],
    buffs: [
      {
        buffId: 1020,
        name: "踏星",
        category: "BUFF",
        durationTurns: 2,
        description: "受到伤害时有60%概率闪避",
        effects: [{ type: "DODGE_NEXT", chance: 0.6 }],
      },
    ],
  },

  /* ================= 其他 ================= */

  zhuiming_jian: {
    id: "zhuiming_jian",
    name: "追命箭",
    description: "造成15点伤害\n目标生命值高于70时额外造成5点伤害",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 15 },
      {
        type: "BONUS_DAMAGE_IF_TARGET_HP_GT",
        value: 5,
        threshold: 70,
      },
    ],
  },

  quye_duanchou: {
    id: "quye_duanchou",
    name: "驱夜断愁",
    description: "造成4点伤害\n回复2点生命值",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [
      { type: "DAMAGE", value: 4 },
      { type: "HEAL", value: 2, applyTo: "SELF" },
    ],
  },
};
