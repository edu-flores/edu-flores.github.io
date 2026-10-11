// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
    vite: {
        define: {
            __BUILD_DATE__: JSON.stringify(
                new Date().toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                }),
            ),
        },
    },
});
