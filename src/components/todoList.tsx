import { useState } from 'react';
import { Todo } from '../types/Todo';
import cn from 'classnames';

type Props = {
  sortedUserTodo: Todo[];
  onDelete: (value: number) => Promise<void>;
  onUpdate: (id: number, completed: boolean, title: string) => Promise<void>;
  isLoader: string | number | null;
  tempTitle: string;
};

export const TodoList = ({
  sortedUserTodo,
  onDelete,
  onUpdate,
  isLoader,
  tempTitle,
}: Props) => {
  const [editId, setEditId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState<string>('');

  const handleDoubleClick = (id: number) => {
    setEditId(id);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditTitle(e.target.value);
  };

  const handleBlur = (id: number, completed: boolean, newtitle: string) => {
    if (editId !== null) {
      setEditId(null);
    }

    if (newtitle !== editTitle) {
      onUpdate(id, completed, editTitle);
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    id: number,
    completed: boolean,
    newtitle: string,
  ) => {
    if (e.key === 'Enter') {
      if (newtitle === editTitle) {
        handleBlur(id, completed, editTitle);
      }

      onUpdate(id, completed, editTitle);
    }
  };

  return (
    <section className="todoapp__main" data-cy="TodoList">
      {sortedUserTodo.map(listTodo => {
        const isThisTodoLoading = isLoader === listTodo.id;
        const isThisTodoLoading2 = isLoader === 'all';

        return (
          <div
            key={listTodo.id}
            data-cy="Todo"
            className={`todo item-enter-done ${listTodo.completed ? 'completed' : ''}`}
          >
            <label
              htmlFor={`todoStatus-${listTodo.id}`}
              className="todo__status-label"
            >
              <input
                id={`todoStatus-${listTodo.id}`}
                data-cy="TodoStatus"
                type="checkbox"
                className="todo__status"
                checked={listTodo.completed}
                onChange={() =>
                  onUpdate(listTodo.id, !listTodo.completed, listTodo.title)
                }
              />
            </label>

            {editId === listTodo.id ? (
              <input
                data-cy="NewTodoField"
                type="text"
                className="edit-input"
                value={editTitle}
                onChange={handleChange}
                onBlur={() =>
                  handleBlur(listTodo.id, listTodo.completed, listTodo.title)
                }
                onKeyDown={e =>
                  handleKeyDown(
                    e,
                    listTodo.id,
                    listTodo.completed,
                    listTodo.title,
                  )
                }
                autoFocus
              />
            ) : (
              <span
                data-cy="TodoTitle"
                className="todo__title"
                onDoubleClick={() => {
                  handleDoubleClick(listTodo.id);
                  setEditTitle(listTodo.title);
                }}
              >
                {listTodo.title}
              </span>
            )}

            <button
              onClick={() => onDelete(listTodo.id)}
              type="button"
              className="todo__remove"
              data-cy="TodoDelete"
            >
              ×
            </button>

            <div
              data-cy="TodoLoader"
              className={cn('modal', 'overlay', {
                'is-active': isThisTodoLoading || isThisTodoLoading2,
              })}
            >
              <div className="modal-background has-background-white-ter" />
              <div className="loader" />
            </div>
          </div>
        );
      })}

      {isLoader === 'temp' && (
        <div data-cy="Todo" className="todo temp-item-enter-done">
          <label htmlFor="todoStatus" className="todo__status-label">
            <input
              id="todoStatus"
              data-cy="TodoStatus"
              type="checkbox"
              className="todo__status"
              readOnly
            />
          </label>
          <span data-cy="TodoTitle" className="todo__title">
            {tempTitle}
          </span>
          <div data-cy="TodoLoader" className="modal overlay is-active">
            <div className="modal-background has-background-white-ter" />
            <div className="loader" />
          </div>
        </div>
      )}
    </section>
  );
};
