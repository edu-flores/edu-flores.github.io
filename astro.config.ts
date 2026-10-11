import { defineConfig } from "astro/config";

export default defineConfig({
    site: "https://edu-flores.github.io",
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
