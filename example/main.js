import jQuery from 'jquery'
window.$ = jQuery;

// import Styles
import "vuetify/dist/vuetify.min.css";

// import Vue
import Vue from "vue/dist/vue.esm";

import VTreeDataTable from "../src/v-tree-data-table.vue";

// import Vuetify
import Vuetify from "vuetify";
Vue.use(Vuetify, {
  theme: {
    primary: "#0D4163",
    secondary: "#e5e5e5",
    accent: "#ff0000",
    error: "#f44336",
    warning: "#ffeb3b",
    info: "#2196f3",
    success: "#4caf50"
  }
});

/* eslint-disable no-new */
new Vue({
  el: "#app",
  components: {
    "v-tree-data-table": VTreeDataTable
  },
  data: () => ({
    loading: false,
    pagination: {},
    totalItems: 2,
    headers: [
      {
        text: "Name",
        value: "name"
      },
      {
        text: "Description",
        value: "description"
      }
    ],
    items: []
  }),
  methods: {
    /**
     * Load the records
     * @param {Object} pagination Pagination data from the DataTable
     */
    load(pagination) {
      this.pagination = pagination;
      this.$nextTick(() => {
        this.items = [
          {
            id: 1,
            name: "Node 1",
            description: "Root Node With Children",
            depth: 1,
            children: [
              {
                id: 3,
                name: "Node 1.1",
                description: "Child of Root",
                depth: 2,
                leaf: true,
              },
              {
                id: 4,
                name: "Node 1.2",
                description: "Child of Root",
                depth: 2,
                children: [
                  {
                    id: 5,
                    name: "Node 1.2.1",
                    description: "Child of 1.2",
                    depth: 3,
                    leaf: true,
                  },
                  {
                    id: 6,
                    name: "Node 1.2.2",
                    description: "Child of 1.2",
                    depth: 3,
                    leaf: true,
                  }
                ]
              }
            ]
          },
          {
            id: 2,
            name: "Node 2",
            description: "Root Node No Children",
            depth: 1,
            leaf: true,
          }
        ];
        this.totalItems = 2;
      });
    }
  }
});
