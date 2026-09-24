## Prerequisites

1. A local Strapi server running.
2. Has the following extensions installed in VSCode:

- https://marketplace.visualstudio.com/items?itemName=apollographql.vscode-apollo
- https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql
- https://marketplace.visualstudio.com/items?itemName=GraphQL.vscode-graphql-syntax

## Packages

Run this in your cli:

```bash
pnpm add -D @graphql-codegen/cli @graphql-types-document-node/core @parcel/watcher dotenv graphql graphql-tag
```

## Configuration

At root, create a file `codegen.ts`. It should have a code similar below:

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const apiUrl = process.env.STRAPI_API_URL;

if (!apiUrl) {
  throw new Error(
    "Missing STRAPI_API_URL environment variable for GraphQL codegen",
  );
}

const graphqlToken = process.env.STRAPI_API_TOKEN;

const config: CodegenConfig = {
  overwrite: true,
  schema: {
    [`${apiUrl}/graphql`]: {
      headers: graphqlToken
        ? {
            Authorization: `Bearer ${graphqlToken}`,
          }
        : {},
    },
  },
  documents: ["lib/graphql/**/*.{ts,tsx}", "!lib/graphql/generated/**/*"],
  generates: {
    "lib/graphql/generated/": {
      preset: "client",
      presetConfig: {
        gqlTagName: "gql",
        fragmentMasking: false,
      },
    },
  },
  ignoreNoDocuments: false,
};

export default config;
```

#### What the props mean (sort by essence)

1. `generates` - This prop has only one child prop, which is the output path for the generated GraphQL types. In this example, when we finally run our type generation, they will be stored in the `lib/graphql/generated/` folder.
   - `[outputPath].preset` - We need to set this as `client` as we are generating the types inside the frontend repo.

   - `[outputPath].presetConfig.gqlTagName` - We are going to use `graphql-tag` library here, which allows us to prepend `gql` tag before GraphQL queries, fragments, and mutations. We will use that tag as the value for this prop. Also this guides codegen to scan for files mentioned in the `documents` and that GraphQL operations are wrapped in that tag.

   - `[outputPath].presetConfig.fragmentMasking` - Fragment masking is default to true. While this has benefits in terms of consuming the fragments, this add a layer of requirement in our codebase and can be avoided by idempotency in the schema and the components we create, hence we are setting this as `false`.

2. `documents` - This prop is an array of path where codegen will scan for the GraphQL operations. For the first element `"lib/graphql/**/*.{ts,tsx}"`, it will scan for the queries, fragments, and mutations here wrapped with `generates.[outputPath].presetConfig.gqlTagName`. As for the second element, this is for a special case since the generated types are colocated with the written GraphQL operations. The generated files do contain `gql` tags, hence codegen will regenerate types from the `generated/**/*` path which may result to duplicate type definitions and parse errors. To exclude it from scanning, prepend "!" at the path.

3. `overwrite` - This prop is set to `true` so we continue on overwriting the generated type definitions along our GraphQL query, fragment, and mutation updates.

4. `schema` - This prop points to your GraphQL server.

5. `ignoreNoDocuments` - If lib/graphql/\*_/_.{ts,tsx} finds zero gql-tagged operations, codegen throws an error and stops. It must be set to `false`, as this is a safety feature to ensure that the paths in `documents` contains written GraphQL operations. If it were set to `true` insteadm codegen would just quietly finish with no error, even though it generated nothing useful.

## Execution

The most convenient way to run codegen is via package.json script. This is an example:

```bash
"graphql:watch": "graphql-codegen --require dotenv/config --config codegen.ts --watch"
```

With `@parcel/watcher` installed, `--watch` must be appended in the script, and in this way, codegen continues running while we are writing our GraphQL queries (and even if not).

Execute codegen via:

```bash
pnpm graphql:watch
```

## Writing GraphQL operations

Write all your GraphQL operations in the set path at `documents` prop. Make sure that they are wrapped in `gql` as set in the `generates.[outputPath].presetConfig.gqlTagName`.

For example:

```ts
import { gql } from "graphql-tag";
import { SEO_FRAGMENT } from "@/lib/graphql/fragments/globalFragments";
import * as CONTENT from "@/lib/graphql/fragments/pageContentFragments";

export const PAGE_QUERY = gql`
  query Page($status: PublicationStatus, $slug: String) {
    pages(status: $status, filters: { slug: { eqi: $slug } }) {
      __typename
      title
      slug
      template
      homeContent {
        ...HomePageContentFragment
      }
      servicesContent {
        ...ServicesPageContentFragment
      }
      industriesContent {
        ...IndustriesPageContentFragment
      }
      storiesContent {
        ...StoriesPageContentFragment
      }
      aboutUsContent {
        ...AboutUsPageContentFragment
      }
      careersContent {
        ...CareersPageContentFragment
      }
      contactUsContent {
        ...ContactUsPageContentFragment
      }
      utilityContent {
        ...UtilityPageContentFragment
      }
      seoFields {
        ...SEOFragment
      }
    }
  }
  ${CONTENT.HOME_PAGE_CONTENT}
  ${CONTENT.SERVICES_PAGE_CONTENT}
  ${CONTENT.INDUSTRIES_PAGE_CONTENT}
  ${CONTENT.STORIES_PAGE_CONTENT}
  ${CONTENT.ABOUT_US_PAGE_CONTENT}
  ${CONTENT.CAREERS_PAGE_CONTENT}
  ${CONTENT.CONTACT_US_PAGE_CONTENT}
  ${CONTENT.UTILITY_PAGE_CONTENT}
  ${SEO_FRAGMENT}
`;

export const PAGES_QUERY = gql`
  query Pages($status: PublicationStatus) {
    pages(status: $status, pagination: { limit: 100 }) {
      __typename
      title
      slug
    }
  }
`;
```

## GraphQL Fetch Service

In our Graphql fetcher, we usually pass the query as a string. If we import `PAGE_QUERY` it is typed as `DocumentNode`. To convert it to a string use `print()` from `graphql`. Like this:

```ts
import { print } from "graphql";

// JSON.stringify({ query: print(PAGE_QUERY)})
```

-----

## END