"use client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getTodos,
  createTodo,
  deleteTodo,
  assignImageToTodo,
} from "@/app/actions/todos";
import { Dag } from "@/lib/dag";

type Todo = NonNullable<Awaited<ReturnType<typeof getTodos>>["data"]>[0];

export default function Home() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      setLoading(true);
      const result = await getTodos();
      if (result.success && result.data) {
        setTodos(result.data);
      } else {
        console.error("Failed to fetch todos:", result.error);
      }
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTodo = async (input: {
    title: string;
    due?: string;
    dependencies?: number[];
  }) => {
    if (!input.title.trim()) return;
    try {
      const result = await createTodo(input);
      if (result.success) {
        fetchTodos();
      } else {
        console.error("Failed to add todo:", result.error);
      }
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      const result = await deleteTodo(id);
      if (result.success) {
        fetchTodos();
      } else {
        console.error("Failed to delete todo:", result.error);
      }
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold text-center text-white mb-8">
            Things To Do App
          </h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton
                key={i}
                className="h-32 bg-white bg-opacity-90 rounded-lg"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dag = dagify(todos);
  console.log("todos", [...todos]);
  console.log("dag", dag);
  console.log("order of execution", [...dag.inverted().topologicalSort()]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Things To Do App
        </h1>
        <AddTodoDialog todos={todos} onAddTodo={handleAddTodo} />
        <ul>
          {todos.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onDelete={handleDeleteTodo} />
          ))}
        </ul>
      </div>
    </div>
  );
}

type TodoItemProps = {
  todo: Todo;
  onDelete: (id: number) => void;
};

export function TodoItem({ todo, onDelete }: TodoItemProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(todo.imageUrl);

  useEffect(() => {
    const fetchImage = async () => {
      if (!todo.imageUrl) {
        try {
          const result = await assignImageToTodo(todo.id);
          if (result.success && result.data) {
            setImageUrl(result.data.imageUrl);
          }
        } catch (error) {
          console.error("Failed to assign image:", error);
        }
      }
    };

    fetchImage();
  }, [todo.id, todo.imageUrl]);

  return (
    <li
      key={todo.id}
      className="bg-white bg-opacity-90 p-4 mb-4 rounded-lg shadow-lg flex flex-col items-center gap-4"
    >
      <div className="flex justify-between w-full">
        <span className="text-gray-800">{todo.title}</span>
        <div className="flex items-center gap-2">
          {todo.due && (
            <span
              className={
                new Date(todo.due) < new Date()
                  ? "text-red-500"
                  : "text-gray-800"
              }
            >
              {new Date(todo.due).toLocaleDateString("en-US", {
                year: "2-digit",
                month: "numeric",
                day: "numeric",
              })}
            </span>
          )}
          <button
            onClick={() => onDelete(todo.id)}
            className="text-red-500 hover:text-red-700 transition duration-300"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt="Todo"
          className="w-1/2 aspect-square object-cover rounded-lg"
        />
      ) : (
        <Skeleton className="w-1/2 aspect-square rounded-lg bg-zinc-300" />
      )}
    </li>
  );
}

type AddTodoFormProps = {
  todos: Todo[];
  onAddTodo: (input: {
    title: string;
    due?: string;
    dependencies?: number[];
  }) => void;
};

export function AddTodoDialog({ todos, onAddTodo }: AddTodoFormProps) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string | undefined>(undefined);
  const [dependencies, setDependencies] = useState<number[]>([]);
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTodo({ title, due, dependencies });

    setTitle("");
    setDue(undefined);
    setDependencies([]);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full bg-white bg-opacity-90 text-gray-800 py-3 px-4 rounded-lg shadow-lg hover:bg-opacity-100 transition duration-300 mb-4">
          Add Todo
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Todo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Title
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter todo title"
                required
              />
            </div>
            <div>
              <label
                htmlFor="due"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Due Date (optional)
              </label>
              <input
                id="due"
                type="date"
                value={due || ""}
                onChange={(e) => setDue(e.target.value || undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
            {todos.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dependencies (optional)
                </label>
                <div className="gap-2 max-h-32 overflow-y-auto flex flex-wrap">
                  {todos.map((todo) => (
                    <div key={todo.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`todo-${todo.id}`}
                        checked={dependencies.includes(todo.id)}
                        onChange={(e) =>
                          setDependencies((d) =>
                            e.target.checked
                              ? [...d, todo.id]
                              : d.filter((id) => id !== todo.id)
                          )
                        }
                        className="rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                      />
                      <label
                        htmlFor={`todo-${todo.id}`}
                        className="text-sm text-gray-700"
                      >
                        {todo.title}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mt-6">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition duration-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition duration-300"
            >
              Add Todo
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function dagify(todos: Todo[]): Dag<number, Todo> {
  const dag = new Dag<number, Todo>();

  todos.forEach((todo) => {
    dag.addNode({ id: todo.id, data: todo });
  });

  todos.forEach((todo) => {
    todo.dependencies.forEach((dependency) => {
      dag.addEdge(todo.id, dependency.id);
    });
  });

  return dag;
}
