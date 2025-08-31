import React, { useEffect, useRef, useState } from 'react';
import cn from 'classnames';
import { Todo } from '../types/Todo';
import { getTodos, updateTodos } from '../api/todos';

type Props = {
  onSubmit: (value: string) => Promise<void>;
  userTodos: Todo[];
  setUserTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  setIsLoader: React.Dispatch<React.SetStateAction<string | number | null>>;
  focusSignal?: number;
};

export const Header: React.FC<Props> = ({
  onSubmit,
  userTodos,
  setUserTodos,
  setIsLoader,
  focusSignal,
}) => {
  const [title, setTitle] = useState('');
  const [isDisabled, setDisabled] = useState(false);
  const [isToggleAllButton, setIsToggleAllButton] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (focusSignal !== undefined) {
      inputRef.current?.focus();
    }
  }, [focusSignal]);

  useEffect(() => {
    const allCompleted =
      userTodos.length > 0 && userTodos.every(t => t.completed);

    setIsToggleAllButton(allCompleted);
  }, [userTodos]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const toggleAllButton = async () => {
    if (userTodos.length === 0) {
      return;
    }

    const shouldComplete = !isToggleAllButton;

    setIsLoader('all');

    try {
      const toUpdate = userTodos.filter(t => t.completed !== shouldComplete);

      await Promise.all(
        toUpdate.map(todo =>
          updateTodos({
            id: todo.id,
            completed: shouldComplete,
            title: todo.title,
          }),
        ),
      );

      const updated = await getTodos();

      setUserTodos(updated);
    } finally {
      setIsLoader(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();

    setDisabled(true);
    try {
      await onSubmit(trimmed);
      if (trimmed) {
        setTitle('');
      }
    } catch {
    } finally {
      setDisabled(false);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  return (
    <header className="todoapp__header">
      <button
        type="button"
        className={cn('todoapp__toggle-all', { active: isToggleAllButton })}
        data-cy="ToggleAllButton"
        disabled={userTodos.length === 0}
        onClick={toggleAllButton}
      />

      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={title}
          onChange={handleTitleChange}
          disabled={isDisabled}
          autoFocus
        />
      </form>
    </header>
  );
};
