/* eslint-disable @typescript-eslint/no-explicit-any */
import { Node, mergeAttributes } from '@tiptap/react'
import Suggestion, { type SuggestionOptions } from '@tiptap/suggestion'
import { PluginKey } from '@tiptap/pm/state'
import { ReactRenderer } from '@tiptap/react'
import tippy from 'tippy.js'
import { SuggestionList } from './SuggestionList'

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, unknown>
  suggestion: Omit<SuggestionOptions, 'editor'>
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {},
      suggestion: {
        char: '[[',
        pluginKey: new PluginKey('wikiLinkSuggestion'),
        command: ({ editor, range, props }: any) => {
          editor.chain().focus().deleteRange(range).insertContent({
            type: 'wikiLink',
            attrs: { id: props.id, label: props.label },
          }).run()
        },
      },
    }
  },

  addAttributes() {
    return {
      id: { default: null },
      label: { default: null },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-wiki-link]' }]
  },

  renderHTML({ HTMLAttributes }: any) {
    return ['span', mergeAttributes({ 'data-wiki-link': '', class: 'wiki-link' }, this.options.HTMLAttributes, HTMLAttributes), `[[${HTMLAttributes.label}]]`]
  },

  addProseMirrorPlugins() {
    return [Suggestion({ editor: this.editor, ...this.options.suggestion })]
  },
})

export function buildWikiLinkSuggestion(getNotes: () => { id: string; title: string }[]) {
  return {
    items: ({ query }: { query: string }) =>
      getNotes()
        .filter((n) => n.title.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 8)
        .map((n) => ({ id: n.id, label: n.title })),

    render: () => {
      let component: ReactRenderer
      let popup: ReturnType<typeof tippy>

      return {
        onStart: (props: any) => {
          component = new ReactRenderer(SuggestionList, { props, editor: props.editor })
          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },
        onUpdate: (props: any) => {
          component.updateProps(props)
          ;(popup as any)[0]?.setProps({ getReferenceClientRect: props.clientRect })
        },
        onKeyDown: (props: { event: KeyboardEvent }) => {
          if (props.event.key === 'Escape') { ;(popup as any)[0]?.hide(); return true }
          return (component.ref as any)?.onKeyDown?.(props) ?? false
        },
        onExit: () => { ;(popup as any)[0]?.destroy(); component.destroy() },
      }
    },
  }
}
