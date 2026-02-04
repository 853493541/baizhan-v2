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
        effects: [
          { type: "START_TURN_DAMAGE", value: 5, durationTurns: 5 },
        ],
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
        name: "倒地",
        effects: [{ type: "CONTROL", durationTurns: 1 }],
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
        effects: [
          { type: "CONTROL", durationTurns: 1 },
          { type: "HEAL_REDUCTION", value: 0.5, durationTurns: 3 },
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
        effects: [{ type: "SILENCE", durationTurns: 1 }],
      },
    ],
  },

  da_shizi_hou: {
    id: "da_shizi_hou",
    name: "大狮子吼",
    description: "【控制】目标1个回合\n下个回合目标抽卡数量-1",
    type: "CONTROL",
    target: "OPPONENT",
    buffs: [
      {
        buffId: 1005,
        name: "大狮子吼",
        effects: [
          { type: "CONTROL", durationTurns: 1 },
          { type: "DRAW_REDUCTION", value: 1, durationTurns: 1 },
        ],
      },
    ],
  },

  jiangchun_zhuxiu: {
    id: "jiangchun_zhuxiu",
    name: "绛唇珠袖",
    description: "给目标施加状态\n目标每次使用卡牌时受到3点伤害，持续3个回合",
    type: "CONTROL",
    target: "OPPONENT",
    buffs: [
      {
        buffId: 1006,
        name: "绛唇",
        effects: [
          { type: "ON_PLAY_DAMAGE", value: 3, durationTurns: 3 },
        ],
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
    description:
      "解控\n抽1张牌\n恢复5点生命值\n【不可选中】一回合\n使用卡牌会解除【不可选中】",
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
        effects: [
          {
            type: "UNTARGETABLE",
            durationTurns: 1,
            breakOnPlay: true,
            allowWhileControlled: true,
          },
        ],
      },
    ],
  },

  que_ta_zhi: {
    id: "que_ta_zhi",
    name: "鹊踏枝",
    description:
      "解控\n免疫控制直到下个回合开始\n下次受到伤害有70%概率闪避",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "CLEANSE", allowWhileControlled: true }],
    buffs: [
      {
        buffId: 1008,
        name: "鹊踏枝",
        effects: [
          { type: "CONTROL_IMMUNE", durationTurns: 1 },
          { type: "DODGE_NEXT", chance: 0.7, durationTurns: 1 },
        ],
      },
    ],
  },

  /* ================= 生存 / 回复 ================= */

  fengxiu_diang: {
    id: "fengxiu_diang",
    name: "风袖低昂",
    description: "恢复自身60点生命值\n获得50%减伤，持续2个回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "HEAL", value: 60 }],
    buffs: [
      {
        buffId: 1009,
        name: "风袖",
        effects: [
          { type: "DAMAGE_REDUCTION", value: 0.5, durationTurns: 2 },
        ],
      },
    ],
  },

  qionglong_huasheng: {
    id: "qionglong_huasheng",
    name: "穹隆化生",
    description: "抽两张牌\n恢复10点生命值\n免疫控制2个回合",
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
        effects: [{ type: "CONTROL_IMMUNE", durationTurns: 2 }],
      },
    ],
  },

  /* ================= 隐身 / 干扰 ================= */

  anchen_misan: {
    id: "anchen_misan",
    name: "暗尘弥散",
    description: "抽2张牌\n【隐身】一回合\n使用卡牌会解除【隐身】",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "DRAW", value: 2, allowWhileControlled: true }],
    buffs: [
      {
        buffId: 1011,
        name: "隐身",
        effects: [
          {
            type: "STEALTH",
            durationTurns: 1,
            breakOnPlay: true,
            allowWhileControlled: true,
          },
        ],
      },
    ],
  },

  fuguang_lueying: {
    id: "fuguang_lueying",
    name: "浮光掠影",
    description:
      "【隐身】4个回合\n下2个回合抽卡-1\n使用任何卡牌会解除【隐身】和抽卡减少效果",
    type: "SUPPORT",
    target: "SELF",
    buffs: [
      {
        buffId: 1012,
        name: "浮光掠影",
        effects: [
          { type: "STEALTH", durationTurns: 4, breakOnPlay: true },
          { type: "DRAW_REDUCTION", value: 1, durationTurns: 2, breakOnPlay: true },
        ],
      },
    ],
  },

  tiandi_wuji: {
    id: "tiandi_wuji",
    name: "天地无极",
    description: "造成5点伤害\n自身【隐身】1个回合",
    type: "ATTACK",
    target: "OPPONENT",
    effects: [{ type: "DAMAGE", value: 5 }],
    buffs: [
      {
        buffId: 1013,
        name: "隐身",
        effects: [{ type: "STEALTH", durationTurns: 1, breakOnPlay: true }],
      },
    ],
  },

  /* ================= 运功 / 节奏 ================= */

  fenglai_wushan: {
    id: "fenglai_wushan",
    name: "风来吴山",
    description:
      "造成10点伤害\n持续运功\n运功期间免疫控制\n任意玩家回合开始和结束时对敌方造成10点伤害\n下个回合开始时结束",
    type: "CHANNEL",
    target: "SELF",
    buffs: [
      {
        buffId: 1014,
        name: "风来吴山",
        effects: [{ type: "FENGLAI_CHANNEL", durationTurns: 1 }],
      },
      {
        buffId: 1015,
        name: "免控",
        effects: [{ type: "CONTROL_IMMUNE", durationTurns: 1 }],
      },
    ],
  },

  wu_jianyu: {
    id: "wu_jianyu",
    name: "无间狱",
    description:
      "造成10点伤害\n自身回合结束造成10点伤害并回复3点生命值\n对手回合开始造成20点伤害并回复6点生命值",
    type: "CHANNEL",
    target: "SELF",
    buffs: [
      {
        buffId: 1016,
        name: "无间狱",
        effects: [{ type: "WUJIAN_CHANNEL", durationTurns: 1 }],
      },
    ],
  },

  xinzheng: {
    id: "xinzheng",
    name: "心诤",
    description:
      "持续运功，期间免疫控制\n自身回合结束对目标造成5点伤害\n目标回合开始时再造成5点伤害\n目标回合结束时运功结束并额外造成15点伤害",
    type: "CHANNEL",
    target: "SELF",
    buffs: [
      {
        buffId: 1017,
        name: "心诤",
        effects: [{ type: "XINZHENG_CHANNEL", durationTurns: 2 }],
      },
      {
        buffId: 1018,
        name: "免控",
        effects: [{ type: "CONTROL_IMMUNE", durationTurns: 2 }],
      },
    ],
  },

  /* ================= 爆发 / 强化 ================= */

  nuwa_butian: {
    id: "nuwa_butian",
    name: "女娲补天",
    description:
      "直到下个回合结束\n造成伤害提升100%\n受到伤害降低50%",
    type: "STANCE",
    target: "SELF",
    buffs: [
      {
        buffId: 1019,
        name: "女娲补天",
        effects: [
          { type: "DAMAGE_MULTIPLIER", value: 2, durationTurns: 1 },
          { type: "DAMAGE_REDUCTION", value: 0.5, durationTurns: 1 },
        ],
      },
    ],
  },

  taxingxing: {
    id: "taxingxing",
    name: "踏星行",
    description: "抽两张牌\n获得60%闪避，持续2个回合",
    type: "SUPPORT",
    target: "SELF",
    effects: [{ type: "DRAW", value: 2 }],
    buffs: [
      {
        buffId: 1020,
        name: "踏星",
        effects: [
          { type: "DODGE_NEXT", chance: 0.6, durationTurns: 2 },
        ],
      },
    ],
  },

  zhuiming_jian: {
    id: "zhuiming_jian",
    name: "追命箭",
    description:
      "造成15点伤害\n若目标生命值高于70\n额外造成5点伤害",
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
