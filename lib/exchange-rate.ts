// 汇率工具：按日期抓取 CNY→AUD 历史汇率（数据源：Frankfurter / 欧洲央行）
//
// 设计：
// - 返回的汇率为「每 1 AUD 折合多少 CNY」(CNY per AUD)，与历史硬编码常量 4.7 同口径，
//   因此换算公式保持 `audAmount = cnyAmount / rate`。
// - 周末/节假日无行情，使用前一交易日的汇率做前向填充。
// - 任意失败（网络/接口异常）都回退到常量 FALLBACK_CNY_PER_AUD，保证数据照常解析。

// 兜底汇率：1 AUD ≈ 4.7 CNY（接口不可用时使用）
export const FALLBACK_CNY_PER_AUD = 4.7

// 从一组日期里取出最早/最晚的有效日期（YYYY-MM-DD）
export function dateRange(dates: string[]): [string, string] {
  const valid = dates.filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort()
  return valid.length ? [valid[0], valid[valid.length - 1]] : ['', '']
}

// 抓取 [startDate, endDate] 区间内每个交易日的 CNY-per-AUD 汇率。
// 返回 Map<YYYY-MM-DD, rate>；任何失败都返回空 Map，调用方据此回退到常量。
export async function fetchCnyPerAudRates(
  startDate: string,
  endDate: string
): Promise<Map<string, number>> {
  const map = new Map<string, number>()
  if (!startDate || !endDate) return map

  try {
    // Frankfurter 时间序列：base=AUD, symbols=CNY → rates[date].CNY = 每 1 AUD 折合的 CNY
    const url = `https://api.frankfurter.dev/v1/${startDate}..${endDate}?base=AUD&symbols=CNY`
    const res = await fetch(url)
    if (!res.ok) return new Map()

    const json: any = await res.json()
    const rates = json?.rates || {}
    for (const [date, obj] of Object.entries(rates)) {
      const r = (obj as any)?.CNY
      if (typeof r === 'number' && r > 0) map.set(date, r)
    }
  } catch {
    return new Map()
  }

  return map
}

// 解析某一天的 CNY-per-AUD 汇率：
// 命中当天 → 直接返回；否则用最近的前一交易日（前向填充）；
// 若该日期早于所有已知行情则用最早一条；Map 为空时回退到常量。
export function cnyPerAudForDate(rateMap: Map<string, number> | undefined, date: string): number {
  if (!rateMap || rateMap.size === 0) return FALLBACK_CNY_PER_AUD
  if (rateMap.has(date)) return rateMap.get(date)!

  let nearestEarlier: string | null = null
  let earliest: string | null = null
  for (const d of rateMap.keys()) {
    if (earliest === null || d < earliest) earliest = d
    if (d <= date && (nearestEarlier === null || d > nearestEarlier)) nearestEarlier = d
  }

  const key = nearestEarlier ?? earliest
  return key ? rateMap.get(key)! : FALLBACK_CNY_PER_AUD
}

// 按指定日期的汇率把 CNY 金额换算成 AUD
export function rmbToAud(rmb: number, rateMap: Map<string, number> | undefined, date: string): number {
  return rmb / cnyPerAudForDate(rateMap, date)
}
