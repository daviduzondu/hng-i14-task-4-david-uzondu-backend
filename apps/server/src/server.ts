import app from '@/app';
import { env } from "@hng-i14-task-0-david-uzondu/env/server";

app.listen(env.PORT, () => {
 console.log(`Server is running on http://localhost:${env.PORT}`);
});
