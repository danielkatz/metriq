import tseslint from "typescript-eslint";
import baseConfig from "../../eslint.config";

export default tseslint.config(baseConfig, {
    rules: {
        "import-x/no-nodejs-modules": "error",
    },
});
