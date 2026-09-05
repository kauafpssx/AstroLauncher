import { mergeAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react'
import {
  Suggestion,
  type SuggestionKeyDownProps,
  type SuggestionMount,
} from '@tiptap/suggestion'
import type { WaypointDTO } from '@/types/waypoint'
import { WaypointMentionDropdown } from './WaypointMentionDropdown'
import type { WaypointMentionDropdownRef } from './WaypointMentionDropdown'
import { WaypointMentionNodeView } from './WaypointMentionNodeView'
export interface WaypointMentionOptions {
  HTMLAttributes: Record<string, unknown>
  waypoints: WaypointDTO[]
}
export const WaypointMention = Node.create<WaypointMentionOptions>({
  name: 'waypointMention',
  addOptions() {
    return { HTMLAttributes: {}, waypoints: [] }
  },
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,
  addAttributes() {
    return {
      waypointId: { default: null },
      name: { default: '' },
      icon: { default: 'MapPin' },
      dimension: { default: 'overworld' },
      x: { default: 0 },
      y: { default: null },
      z: { default: 0 },
    }
  },
  parseHTML() {
    return [{ tag: 'span[data-type="waypointMention"]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-type': this.name },
        this.options.HTMLAttributes,
        HTMLAttributes,
      ),
      `@${node.attrs.name as string}`,
    ]
  },
  renderText({ node }) {
    return `@${node.attrs.name as string}`
  },
  addNodeView() {
    return ReactNodeViewRenderer(WaypointMentionNodeView)
  },
  addKeyboardShortcuts() {
    return {
      Backspace: () =>
        this.editor.commands.command(({ tr, state }) => {
          const { empty, anchor } = state.selection
          if (!empty) return false
          let isMention = false
          let mentionPos = 0
          state.doc.nodesBetween(anchor - 1, anchor, (node, pos) => {
            if (node.type.name === this.name) {
              isMention = true
              mentionPos = pos
              return false
            }
          })
          if (isMention) {
            tr.insertText('@', mentionPos, mentionPos + 1)
          }
          return isMention
        }),
    }
  },
  addProseMirrorPlugins() {
    const { editor: ed, name: nodeName } = this
    return [
      Suggestion({
        editor: ed,
        char: '@',
        items: ({ query }: { query: string }) => {
          const wps = this.options.waypoints
          if (!query) return wps
          return wps.filter((wp) =>
            wp.name.toLowerCase().includes(query.toLowerCase()),
          )
        },
        render() {
          let component: ReactRenderer | null = null
          let unmount: ReturnType<SuggestionMount> | null = null
          return {
            onStart: (props) => {
              component = new ReactRenderer(WaypointMentionDropdown, {
                props,
                editor: props.editor,
              })
              if (!props.clientRect) return
              unmount = props.mount(component.element)
            },
            onUpdate: (props) => {
              component?.updateProps(props)
            },
            onKeyDown: (props: SuggestionKeyDownProps) => {
              if (props.event.key === 'Escape') {
                unmount?.()
                return true
              }
              return (
                (
                  component?.ref as WaypointMentionDropdownRef | null
                )?.onKeyDown?.(props) ?? false
              )
            },
            onExit: () => {
              unmount?.()
              component?.destroy()
            },
          }
        },
        command: ({ editor: cmdEditor, range, props }) => {
          cmdEditor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: nodeName,
              attrs: props,
            })
            .run()
        },
      }),
    ]
  },
})
