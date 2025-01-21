import tseslint from "typescript-eslint";
import baseConfig from "../eslint.config";

export default tseslint.config(baseConfig, {
    rules: {
        "import-x/no-unresolved": "off",
        "import-x/no-named-as-default-member": "off",
    },
});
