# eslint-plugin-unuse-import

privite

## Installation

You'll first need to install [ESLint](https://eslint.org/):

```sh
npm i eslint --save-dev
```

Next, install `eslint-plugin-unuse-import`:

```sh
npm install eslint-plugin-unuse-import --save-dev
```

## Usage

In your [configuration file](https://eslint.org/docs/latest/use/configure/configuration-files#configuration-file), import the plugin `eslint-plugin-unuse-import` and add `unuse-import` to the `plugins` key:

```js
import { defineConfig } from "eslint/config";
import unuse-import from "eslint-plugin-unuse-import";

export default defineConfig([
    {
        plugins: {
            unuse-import
        }
    }
]);
```


Then configure the rules you want to use under the `rules` key.

```js
import { defineConfig } from "eslint/config";
import unuse-import from "eslint-plugin-unuse-import";

export default defineConfig([
    {
        plugins: {
            unuse-import
        },
        rules: {
            "unuse-import/rule-name": "warn"
        }
    }
]);
```



## Configurations

<!-- begin auto-generated configs list -->
TODO: Run eslint-doc-generator to generate the configs list (or delete this section if no configs are offered).
<!-- end auto-generated configs list -->



## Rules

<!-- begin auto-generated rules list -->
TODO: Run eslint-doc-generator to generate the rules list.
<!-- end auto-generated rules list -->


