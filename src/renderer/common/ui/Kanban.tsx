import type { ComponentProps, HTMLAttributes, ReactNode } from 'react'
import { ScrollShadow as HeroScrollShadow } from '@heroui/react'
import {
  Button,
  GridList,
  GridListItem,
  isTextDropItem,
  useDragAndDrop,
  type GridListItemProps,
  type GridListProps,
} from 'react-aria-components'
import { Icon } from './icons'

/*
 * A kanban board modelled on HeroUI Pro's (`@heroui-pro/react`, which this app does not use):
 * the same parts and `kanban__*` class names, on react-aria's GridList so cards can be dragged
 * with a pointer or, from their handle, the keyboard.
 */

type Size = 'sm' | 'md' | 'lg'
const cx = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ')
const part =
  <T extends keyof HTMLElementTagNameMap>(tag: T, name: string) =>
  ({ className, ...props }: HTMLAttributes<HTMLElement>) => {
    const Tag = tag as unknown as 'div'
    return <Tag {...props} className={cx(name, className)} />
  }

/** The board: columns side by side in a horizontal scroll shadow, faded where more lies beyond. */
function KanbanRoot({
  size = 'md',
  className,
  ...props
}: Omit<ComponentProps<typeof HeroScrollShadow>, 'size' | 'orientation'> & { size?: Size }) {
  return (
    <HeroScrollShadow
      {...props}
      orientation="horizontal"
      className={cx('kanban', `kanban--${size}`, className)}
    />
  )
}

/** A column's cards in a vertical scroll shadow, for columns taller than the board allows. */
function ScrollShadow({
  className,
  ...props
}: Omit<ComponentProps<typeof HeroScrollShadow>, 'orientation'>) {
  return (
    <HeroScrollShadow
      size={32}
      {...props}
      orientation="vertical"
      className={cx('kanban__scroll-shadow', className)}
    />
  )
}

/**
 * Drag and drop for one column: its cards carry their keys under `dragType`, and a card
 * dropped on the column from another one is handed to `onMove`.
 */
export function useKanbanColumn({
  column,
  dragType,
  textOf,
  onMove,
}: {
  column: string
  dragType: string
  textOf: (key: string) => string
  onMove: (key: string, column: string) => void
}) {
  const { dragAndDropHooks } = useDragAndDrop({
    getItems: (keys) =>
      [...keys].map((key) => ({
        [dragType]: JSON.stringify({ key: String(key), column }),
        'text/plain': textOf(String(key)),
      })),
    acceptedDragTypes: [dragType],
    // the column takes the card as a whole; where it lands among the others is not kept
    getDropOperation: (_target, types) => (types.has(dragType) ? 'move' : 'cancel'),
    onRootDrop: async ({ items }) => {
      for (const item of items) {
        if (!isTextDropItem(item)) continue
        const dragged = JSON.parse(await item.getText(dragType)) as { key: string; column: string }
        if (dragged.column !== column) onMove(dragged.key, column)
      }
    },
  })
  return dragAndDropHooks
}

function CardList<T extends object>({ className, ...props }: GridListProps<T>) {
  return (
    <GridList
      {...props}
      className={cx('kanban__card-list', typeof className === 'string' && className)}
    />
  )
}

/** A card: its content on a raised surface, with a grip for dragging from the keyboard. */
function Card({
  children,
  className,
  ...props
}: Omit<GridListItemProps, 'children'> & { children: ReactNode }) {
  return (
    <GridListItem
      {...props}
      className={cx('kanban__card', typeof className === 'string' && className)}
    >
      {({ allowsDragging }) => (
        <div className="kanban__card-content">
          {allowsDragging && <DragHandle />}
          {children}
        </div>
      )}
    </GridListItem>
  )
}

/** Hidden until focused: a pointer drags the card itself. */
function DragHandle() {
  return (
    <Button slot="drag" className="kanban__drag-handle" aria-label="Drag">
      <Icon icon="lucide:grip-vertical" width={14} />
    </Button>
  )
}

export const Kanban = Object.assign(KanbanRoot, {
  Column: part('section', 'kanban__column'),
  ColumnHeader: part('header', 'kanban__column-header'),
  ColumnIndicator: part('span', 'kanban__column-indicator'),
  ColumnTitle: part('h3', 'kanban__column-title'),
  ColumnCount: part('span', 'kanban__column-count'),
  ColumnActions: part('div', 'kanban__column-actions'),
  ColumnBody: part('div', 'kanban__column-body'),
  ScrollShadow,
  CardList,
  Card,
})
