# Vuetify Tree Data Table

Tree functionality added to the Vuetify Data Table. Supports DnD sorting and moving nodes to new parents.

You must have Vuetify loaded to use this component.

# Usage

## NPM

```
npm install v-tree-data-table
```

## Yarn

```
yarn add v-tree-data-table
```

To use simply register the component with Vue

```
import TreeDataTable from 'v-tree-data-table';
Vue.component('v-tree-data-table', TreeDataTable);
```

## Props

### headers

```
type: Array
required: true
```

Headers for the v-data-table

### items

```
type: Array
required: true
```

items for the v-data-table, should contain tree data. (expanded, children, loaded, depth)

### pagination

```
type: Object
required: true
```

Pagination object for the v-data-table

### totalItems

```
type: Number
required: true
```

total-items for v-data-table

### loading

```
type: Boolean
required: true
```

### rowsPerPageItems: {

```
type: Array,
default: () => {
        return [
          5,
          10,
          25,
          { text: '$vuetify.dataIterator.rowsPerPageAll', value: -1 },
        ];
      },
    }
```

rows-per-page-items for v-data-table

### rowsPerPageText:

```
type: String,
default: `$vuetify.dataTable.rowsPerPageText`,
```

rows-per-page-text for v-data-table

### selectAll:

```
type: [Boolean, String],
default: undefined,
```

select-all for v-data-table

### validDrop:

```
type: Function,
default: undefined,
```

Function that returns true or false if the it is a valid drop.

Arguments

```
node - Node being dragged
target - jQuery Wrapped element being dragged over, either a drop zone, folder or leaf
event - the browser event
```

# License

Tree Data Table is open-sourced software licensed under the MIT license.
