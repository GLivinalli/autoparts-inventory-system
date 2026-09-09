import { app } from "@/app";
import { env } from "@/config/env";

app.listen(env.PORT, () => {
  console.log(`API rodando na porta ${env.PORT} (ambiente: ${env.NODE_ENV})`);
});
