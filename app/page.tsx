"use client";
import { Todo } from "@prisma/client";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [newTodo, setNewTodo] = useState<{ title: string; due?: string }>({
    title: "",
  });
  const [todos, setTodos] = useState([]);

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const res = await fetch("/api/todos");
      const data = await res.json();
      setTodos(data);
    } catch (error) {
      console.error("Failed to fetch todos:", error);
    }
  };

  const handleAddTodo = async () => {
    if (!newTodo.title.trim()) return;
    try {
      await fetch("/api/todos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTodo),
      });
      setNewTodo({ title: "" });
      fetchTodos();
    } catch (error) {
      console.error("Failed to add todo:", error);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await fetch(`/api/todos/${id}`, {
        method: "DELETE",
      });
      fetchTodos();
    } catch (error) {
      console.error("Failed to delete todo:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-500 flex flex-col items-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Things To Do App
        </h1>
        <div className="flex mb-6">
          <input
            type="text"
            className="flex-grow p-3 rounded-l-full focus:outline-none text-gray-700"
            placeholder="Add a new todo"
            value={newTodo.title}
            onChange={(e) => setNewTodo({ ...newTodo, title: e.target.value })}
          />
          <input
            type="date"
            value={newTodo.due ?? ""}
            onChange={(e) => setNewTodo({ ...newTodo, due: e.target.value })}
          />
          <button
            onClick={handleAddTodo}
            className="bg-white text-indigo-600 p-3 rounded-r-full hover:bg-gray-100 transition duration-300"
          >
            Add
          </button>
        </div>
        <ul>
          {todos.map((todo: Todo) => (
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
      const res = await fetch(`/api/todos/${todo.id}/assign-image`, {
        method: "POST",
      });
      const data = await res.json();
      setImageUrl(data.imageUrl);
    };
    if (!todo.imageUrl) {
      fetchImage();
    }
  }, [todo.imageUrl]);

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
            {/* Delete Icon */}
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
