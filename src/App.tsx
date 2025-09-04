/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  addTodos,
  deleteTodos,
  getTodos,
  updateTodos,
  USER_ID,
} from './api/todos';
import { Todo } from './types/Todo';
import { Header } from './components/header';
import { TodoList } from './components/todoList';
import { Footer } from './components/footer';
import { Sort } from './types/Sort';
import { ErrorMassage } from './components/errorMassage';
import { ErrorMessage } from './types/ErrorMessage';

const normalize = (todos: Todo[]): Todo[] =>
  todos.map(t => ({ ...t, completed: t.completed === true }));

export const App: React.FC = () => {
  const [userTodos, setUserTodos] = useState<Todo[]>([]);
  const [errorMassage, setErrorMassage] = useState<ErrorMessage | null>(null);
  const [errorKey, setErrorKey] = useState(0);
  const [sortTodo, setsortTodo] = useState<Sort>('all');
  const [clearCompletedDisabled, setClearCompletedDisabled] = useState(true);
  const [isLoader, setIsLoader] = useState<string | number | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [updateAfterClearDelete, setUpdateAfterClearDelete] = useState(true);
  const [focusSignal, setFocusSignal] = useState(0);

  const hideErrorNow = useCallback(() => {
    setErrorMassage(null);
  }, []);

  const showError = useCallback((msg: ErrorMessage) => {
    setErrorMassage(msg);
    setErrorKey(k => k + 1);
  }, []);

  useEffect(() => {
    getTodos()
      .then(ts => setUserTodos(normalize(ts)))
      .catch(() => showError(ErrorMessage.Load));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAfterClearDelete]);

  useEffect(() => {
    setClearCompletedDisabled(!userTodos.some(t => t.completed));
  }, [userTodos]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  function addToDo(title: string): Promise<void> {
    hideErrorNow();
    const trimmed = title.trim();

    if (!trimmed) {
      showError(ErrorMessage.Empty);

      return Promise.resolve();
    }

    setIsLoader('temp');
    setTempTitle(trimmed);

    const userId = USER_ID;
    const completed = false;

    return addTodos({ title: trimmed, userId, completed })
      .then(newToDo => {
        setUserTodos(curr => [
          ...curr,
          { ...newToDo, completed: newToDo.completed === true },
        ]);
      })
      .catch(() => {
        showError(ErrorMessage.Add);

        return Promise.reject('create-failed');
      })
      .finally(() => {
        setIsLoader(null);
        setTempTitle('');
      });
  }

  function deletePost(postId: number): Promise<void> {
    hideErrorNow();
    setIsLoader(postId);

    return deleteTodos(postId)
      .then(() => {
        setUserTodos(curr => curr.filter(t => t.id !== postId));
        setFocusSignal(s => s + 1);
      })
      .catch(() => {
        showError(ErrorMessage.Delete);

        return Promise.reject('delete-failed');
      })
      .finally(() => setIsLoader(null));
  }

  function updatePost(
    postId: number,
    completed: boolean,
    title: string,
  ): Promise<void> {
    hideErrorNow();
    setIsLoader(postId);

    return updateTodos({ id: postId, completed, title })
      .then(updatedTodo =>
        setUserTodos(prev =>
          prev.map(t =>
            t.id === updatedTodo.id
              ? { ...updatedTodo, completed: updatedTodo.completed === true }
              : t,
          ),
        ),
      )
      .catch(() => {
        showError(ErrorMessage.Update);

        return Promise.reject('update-failed');
      })
      .finally(() => setIsLoader(null));
  }

  function clearDelete(completedTodos: Todo[]): void {
    hideErrorNow();

    const completedIds = completedTodos.filter(t => t.completed).map(t => t.id);

    const deleteResults = completedIds.map(id =>
      deleteTodos(id)
        .then(() => ({ id, success: true }))
        .catch(() => {
          showError(ErrorMessage.Delete);

          return { id, success: false };
        }),
    );

    Promise.all(deleteResults).then(results => {
      const successfulIds = results.filter(r => r.success).map(r => r.id);

      setUserTodos(curr => curr.filter(t => !successfulIds.includes(t.id)));
      setUpdateAfterClearDelete(prev => !prev);
      setFocusSignal(s => s + 1);
    });
  }

  const sortedUserTodo = userTodos.filter(todo => {
    if (sortTodo === 'active') {
      return !todo.completed;
    }

    if (sortTodo === 'completed') {
      return todo.completed;
    }

    return true;
  });

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <Header
          onSubmit={addToDo}
          userTodos={userTodos}
          setUserTodos={setUserTodos}
          setIsLoader={setIsLoader}
          focusSignal={focusSignal}
        />

        <TodoList
          sortedUserTodo={sortedUserTodo}
          onDelete={deletePost}
          onUpdate={updatePost}
          isLoader={isLoader}
          tempTitle={tempTitle}
        />

        {userTodos.length > 0 && (
          <Footer
            sort={setsortTodo}
            userTodo={userTodos}
            visible={clearCompletedDisabled}
            clearDelete={clearDelete}
          />
        )}
      </div>

      <ErrorMassage
        key={errorKey}
        message={errorMassage}
        onClose={hideErrorNow}
      />
    </div>
  );
};
