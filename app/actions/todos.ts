"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { pexelClient } from "@/lib/pexel-client";

export async function getTodos() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        dependencies: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
    return { success: true, data: todos };
  } catch (error) {
    return { success: false, error: "Error fetching todos" };
  }
}

export async function createTodo(data: {
  title: string;
  due?: string;
  dependencies?: number[];
}) {
  try {
    if (!data.title || data.title.trim() === "") {
      return { success: false, error: "Title is required" };
    }

    const todo = await prisma.todo.create({
      data: {
        title: data.title,
        due: data.due ? new Date(data.due + "T12:00:00") : undefined,
        dependencies: {
          connect: data.dependencies?.map((id) => ({ id })) || [],
        },
      },
      include: {
        dependencies: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    revalidatePath("/");
    return { success: true, data: todo };
  } catch (error) {
    return { success: false, error: "Error creating todo" };
  }
}

export async function deleteTodo(id: number) {
  try {
    await prisma.todo.delete({
      where: { id },
    });

    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Error deleting todo" };
  }
}

export async function assignImageToTodo(id: number) {
  try {
    const todo = await prisma.todo.findUnique({ where: { id } });

    if (!todo) {
      return { success: false, error: "Todo not found" };
    }

    const pexelResponse = await pexelClient.photos.search({
      query: todo.title,
      per_page: 1,
    });

    if ("error" in pexelResponse) {
      return { success: false, error: "Error fetching image" };
    }

    const imageUrl = pexelResponse.photos[0].src.original;

    await prisma.todo.update({
      where: { id },
      data: { imageUrl },
    });

    revalidatePath("/");
    return { success: true, data: { imageUrl } };
  } catch (error) {
    return { success: false, error: "Error assigning image" };
  }
}
