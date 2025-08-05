import React, { useEffect, useRef, useState } from 'react';
import { Todo } from '../types/Todo';
import cn from 'classnames';
import { getTodos, updateTodos } from '../api/todos';

type Props = {
  onSubmit: (value: string) => Promise<void>;
  userTodos: Todo[];
  setUserTodos: React.Dispatch<React.SetStateAction<Todo[]>>;
  setIsLoader: React.Dispatch<React.SetStateAction<string | number | null>>;
};

export const Header: React.FC<Props> = ({
  onSubmit,
  userTodos,
  setUserTodos,
  setIsLoader,
}) => {
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDisabled, setDisabled] = useState(false);
  const [isToggleAllButton, setIsToggleAllButton] = useState(false);

  useEffect(() => {
    const AllToggle = userTodos.every(item => item.completed === true);

    setIsToggleAllButton(AllToggle);
  }, [userTodos]);

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  if (true) {
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  }

  function toggleAllButton() {
    const shouldComplete = !isToggleAllButton;

    setIsLoader('all');

    const promises = userTodos.map(todo => {
      return updateTodos({
        id: todo.id,
        completed: shouldComplete,
        title: todo.title,
      });
    });

    Promise.all(promises)
      .then(() => {
        getTodos().then(data => setUserTodos(data));
      })
      .finally(() => setIsLoader(null));
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setDisabled(true);

    onSubmit(title.trim())
      .then(() => {
        setTitle('');
        setDisabled(false);

        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      })
      .catch(() => {
        setDisabled(false);
        setTimeout(() => {
          inputRef.current?.focus();
        }, 0);
      });
  };

  return (
    <header className="todoapp__header">
      <button
        type="button"
        className={cn('todoapp__toggle-all', { active: isToggleAllButton })}
        data-cy="ToggleAllButton"
        onClick={() => toggleAllButton()}
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
