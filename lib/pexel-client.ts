import { createClient } from "pexels";

export const pexelClient = createClient(process.env.PEXELS_API_KEY!);
