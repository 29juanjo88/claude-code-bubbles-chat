import { expect, test } from 'claude-code/testing'
import type { RenderElement, RenderNode } from 'claude-code'

import { flatText, register } from './register'

const el = (type: string) => (props: Record<string, unknown>) => ({ type, props }) as unknown as RenderElement
const t = { Box: el('Box'), Text: el('Text') }
const $ = { ui: { resolve: () => t } }

// register with a fake `on`, keep the UserMessage handler
function handler(options: Record<string, unknown> = {}) {
  let h: ((...a: unknown[]) => Promise<RenderNode>) | null = null
  ;(register as unknown as (on: unknown, o: unknown) => void)((_n: string, filter: { component?: string }, fn: never) => {
    if (filter?.component === 'UserMessage') h = fn
  }, options)
  return h!
}

const event = (text: string, kind = 'composer', columns = 100) => ({
  surface: 'terminal',
  viewport: { columns },
  props: { text, origin: { kind } },
})

// what Glass draws: header rule, body, Claude line, no next()
const glassTree = (text: string) =>
  t.Box({
    flexDirection: 'column',
    children: [
      t.Box({ marginTop: 1, children: [t.Text({ children: ['◆ You · 10:00 ───────'] })] }),
      t.Box({ marginLeft: 2, children: [t.Text({ wrap: 'wrap', children: [text] })] }),
      t.Box({ marginTop: 1, children: [t.Text({ children: ['◉ Claude · 10:00'] })] }),
    ],
  })

const kids = (n: RenderNode) => ((n as { props: { children: RenderElement[] } }).props.children)
const isBubble = (n: RenderElement) => {
  const p = (n as unknown as { props: Record<string, unknown> }).props
  if (p.justifyContent !== 'flex-end' || p.width !== '100%') return false
  const inner = (kids(n)[0] as unknown as { props: Record<string, unknown> }).props
  return inner.backgroundColor === '#3d5f86' && inner.paddingX === 1
}

test('with Glass beneath: header and Claude rows kept, body becomes the right-aligned bubble', async () => {
  const h = handler()
  const out = await h($, event('hello world'), async () => glassTree('hello world'))
  const rows = kids(out)
  expect(rows.length).toBe(3)
  expect(flatText(rows[0])).toContain('◆ You')
  expect(isBubble(rows[1])).toBe(true)
  expect(flatText(rows[1])).toBe('hello world')
  expect(flatText(rows[2])).toContain('◉ Claude')
  // width: longest line + 2, at least 20
  expect((kids(rows[1])[0] as unknown as { props: { width: number } }).props.width).toBe(20)
})

test('non-composer rows are left alone', async () => {
  const h = handler()
  const sentinel = t.Text({ children: ['engine row'] })
  const out = await h($, event('note', 'task-notification'), async () => sentinel)
  expect(out).toBe(sentinel)
  const empty = await h($, event('   '), async () => sentinel)
  expect(empty).toBe(sentinel)
})

test('without Glass beneath: the bubble is drawn alone in a column', async () => {
  const h = handler({ background: '#3d5f86' })
  const long = 'x'.repeat(200)
  const out = await h($, event(long, 'composer', 100), async () => t.Text({ children: ['> ' + 'something else'] }))
  const p = (out as unknown as { props: Record<string, unknown> }).props
  expect(p.flexDirection).toBe('column')
  expect(p.marginTop).toBe(1)
  expect(isBubble(kids(out)[0])).toBe(true)
  expect((kids(kids(out)[0])[0] as unknown as { props: { width: number } }).props.width).toBe(70)
})
