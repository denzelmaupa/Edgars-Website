import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Product Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'brand',
      title: 'Brand / Tag',
      type: 'string',
      description: 'e.g., KELSO, FAIHTWEAR, Kigili, Charter Club',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Menswear', value: 'Men'},
          {title: 'Ladieswear', value: 'Ladies'},
          {title: 'Kidswear / Baby', value: 'Kids'},
          {title: 'Homewear / Bedding & Linen', value: 'Home'},
          {title: 'Intimate / Underwear', value: 'Underwear'},
          {title: 'Beauty & Fragrance', value: 'Beauty'},
        ],
        layout: 'dropdown',
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'image',
      title: 'Product Image',
      type: 'image',
      options: {
        hotspot: true, // Enables visual cropping/hotspots
      },
      validation: (Rule) => Rule.required(),
    }),
  ],
})
