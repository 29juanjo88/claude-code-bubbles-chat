import type { Elements, RenderElement, RenderNode, Register } from 'claude-code'

type Table = Elements['terminal']

// every string in a tree, in drawing order
export function flatText(node: RenderNode | null | undefined): string {
  if (node === null || node === undefined || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flatText).join('')
  const props = ((node as { props?: unknown }).props ?? {}) as { children?: RenderNode | RenderNode[]; label?: string }
  if ((node as { type?: string }).type === 'Button') return props.label ?? ''
  return flatText(props.children as RenderNode)
}

const squash = (s: string) => s.replace(/\s+/g, '')

export function bubbleWidth(text: string, columns: number): number {
  const longest = Math.max(0, ...text.split('\n').map(l => [...l].length))
  return Math.max(20, Math.min(longest + 2, Math.floor(columns * 0.7)))
}

export function renderBubble(t: Table, text: string, columns: number, background: string, color: string): RenderElement {
  return t.Box({
    width: '100%',
    justifyContent: 'flex-end',
    paddingRight: 1,
    children: [
      t.Box({
        backgroundColor: background,
        paddingX: 1,
        paddingY: 1,
        width: bubbleWidth(text, columns),
        children: [t.Text({ color, wrap: 'wrap', children: [text] })],
      }),
    ],
  })
}

// Glass (or any mod beneath) draws a column of rows: swap only the row whose
// text is the prompt, keep the rest. null when no such row exists.
export function replaceBody(drawn: RenderNode, text: string, bubble: RenderElement): RenderElement | null {
  if (!drawn || typeof drawn !== 'object' || Array.isArray(drawn)) return null
  const el = drawn as RenderElement & { props?: { children?: RenderNode[] } }
  const kids = el.props?.children
  if (!Array.isArray(kids)) return null
  const want = squash(text)
  const i = kids.findIndex(k => squash(flatText(k)) === want)
  if (i < 0) return null
  const children = [...kids.slice(0, i), bubble, ...kids.slice(i + 1)]
  return { ...el, props: { ...el.props, children } } as RenderElement
}

export const register: Register = (on, options) => {
  const opts = (options ?? {}) as { background?: unknown; textColor?: unknown }
  const background = typeof opts.background === 'string' && opts.background ? opts.background : '#3d5f86'
  const textColor = typeof opts.textColor === 'string' && opts.textColor ? opts.textColor : '#ffffff'

  on('ui.render', { component: 'UserMessage' }, async ($, e, next) => {
    if (e.surface !== 'terminal' || e.props.origin?.kind !== 'composer') return next(e)
    const text = e.props.text
    if (typeof text !== 'string' || text.trim() === '') return next(e)
    const t = $.ui.resolve(e)
    const bubble = renderBubble(t, text, e.viewport?.columns ?? 80, background, textColor)
    const drawn = await next(e)
    return replaceBody(drawn as RenderNode, text, bubble) ?? t.Box({ flexDirection: 'column', marginTop: 1, children: [bubble] })
  })
}
