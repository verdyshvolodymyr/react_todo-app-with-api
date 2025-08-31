/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  const [sortTodo, setsortTodo] = useState<Sort>('all');
  const [clearCompletedDisabled, setClearCompletedDisabled] = useState(true);
  const [isLoader, setIsLoader] = useState<string | number | null>(null);
  const [tempTitle, setTempTitle] = useState('');
  const [updateAfterClearDelete, setUpdateAfterClearDelete] = useState(true);

  const [focusSignal, setFocusSignal] = useState(0);

  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideErrorNow = useCallback(() => {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }

    setErrorMassage(null);
  }, []);

  const showError = useCallback(
    (msg: ErrorMessage) => {
      hideErrorNow();
      setErrorMassage(msg);
      errorTimerRef.current = setTimeout(() => {
        setErrorMassage(null);
        errorTimerRef.current = null;
      }, 3000);
    },
    [hideErrorNow],
  );

  useEffect(() => () => hideErrorNow(), [hideErrorNow]);

  useEffect(() => {
    getTodos()
      .then(ts => setUserTodos(normalize(ts)))
      .catch(() => showError(ErrorMessage.Load));
  }, [updateAfterClearDelete, showError]);

  useEffect(() => {
    setClearCompletedDisabled(!userTodos.some(t => t.completed));
  }, [userTodos]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  function addToDo(title: string) {
    hideErrorNow();

    const userId = USER_ID;
    const completed = false;

    if (!title) {
      showError(ErrorMessage.Empty);

      return Promise.resolve();
    }

    setIsLoader('temp');
    setTempTitle(title);

    return addTodos({ title, userId, completed })
      .then(newToDo => {
        setUserTodos(curr => [
          ...curr,
          { ...newToDo, completed: newToDo.completed === true },
        ]);
      })
      .catch(err => {
        showError(ErrorMessage.Add);
        throw err;
      })
      .finally(() => setIsLoader(null));
  }

  function deletePost(postId: number) {
    hideErrorNow();
    setIsLoader(postId);

    return deleteTodos(postId)
      .then(() => {
        setUserTodos(curr => curr.filter(t => t.id !== postId));
        setFocusSignal(s => s + 1);
      })
      .catch(err => {
        showError(ErrorMessage.Delete);
        throw err;
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
      .then(() => getTodos().then(ts => setUserTodos(normalize(ts))))
      .catch(err => {
        showError(ErrorMessage.Update);
        throw err;
      })
      .finally(() => setIsLoader(null));
  }

  function clearDelete(completedTodos: Todo[]) {
    hideErrorNow();

    const completedIds = completedTodos
      .filter(todo => todo.completed)
      .map(todo => todo.id);

    const deleteResults = completedIds.map(id =>
      deleteTodos(id)
        .then(() => ({ id, success: true }))
        .catch(() => {
          showError(ErrorMessage.Delete);

          return {
            id,
            success: false,
          };
        }),
    );

    Promise.all(deleteResults).then(results => {
      const successfulIds = results.filter(r => r.success).map(r => r.id);

      setUserTodos(curr =>
        curr.filter(todo => !successfulIds.includes(todo.id)),
      );

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

      <ErrorMassage errorMassage={errorMassage} massage={setErrorMassage} />
    </div>
  );
};
