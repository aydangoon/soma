import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { pexelClient } from "@/lib/pexel-client";

interface Params {
  params: {
    id: string;
  };
}

export async function POST(request: Request, { params }: Params) {
  const id = parseInt(params.id);
  if (isNaN(id)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  try {
    const todo = await prisma.todo.findUnique({ where: { id } });

    if (!todo) {
      return NextResponse.json({ error: "Todo not found" }, { status: 404 });
    }

    const pexelResponse = await pexelClient.photos.search({
      query: todo.title,
      per_page: 1,
    });

    if ("error" in pexelResponse) {
      return NextResponse.json(
        { error: "Error fetching image" },
        { status: 500 }
      );
    }

    const imageUrl = pexelResponse.photos[0].src.original;

    await prisma.todo.update({
      where: { id },
      data: { imageUrl },
    });

    return NextResponse.json({ imageUrl }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Error assigning image" },
      { status: 500 }
    );
  }
}
