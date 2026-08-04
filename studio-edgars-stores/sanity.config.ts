import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'

const categories = [
  { title: 'Menswear', value: 'Men' },
  { title: 'Ladieswear', value: 'Ladies' },
  { title: 'Kidswear / Baby', value: 'Kids' },
  { title: 'Homewear / Bedding & Linen', value: 'Home' },
  { title: 'Intimate / Underwear', value: 'Underwear' },
  { title: 'Beauty & Fragrance', value: 'Beauty' },
]

export default defineConfig({
  name: 'default',
  title: 'Edgars Stores Studio',

  projectId: 'u63a6xv5',
  dataset: 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Products')
              .child(
                S.list()
                  .title('Products by Category')
                  .items(
                    categories.map((cat) =>
                      S.listItem()
                        .title(cat.title)
                        .child(
                          S.documentList()
                            .title(cat.title)
                            .filter('_type == "product" && category == $category')
                            .params({ category: cat.value })
                        )
                    )
                  )
              ),
            // Keep all other default document types listed below
            ...S.documentTypeListItems().filter(
              (item) => item.getId() !== 'product'
            ),
          ]),
    }),
  ],

  schema: {
    types: schemaTypes,
  },
})
