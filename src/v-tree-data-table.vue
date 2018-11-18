/**
* This component handles rendering a tree view in a data grid
*/

<template>
  <div class="v-tree-data-table">
    <v-data-table ref="dataTable" v-model="selected" :select-all="selectAll" :rows-per-page-text="rowsPerPageText" :rows-per-page-items="rowsPerPageItems" :headers="computedHeaders" :items="flattenedNodes" :pagination.sync="internalPagination" :total-items="totalItems" :loading="loading">
      <template slot="no-data">
        <slot name="no-data">
          <tr>
            <td :colspan="headers.length + (selectAll ? 1 : 0)" class="text-xs-center">
              No matching records found
            </td>
          </tr>
        </slot>
      </template>

      <template slot="headers" slot-scope="props">
        <slot name="headers" :props="props">
          <tr>
            <th v-if="selectAll" width="50px">
              <v-checkbox :input-value="props.all" :indeterminate="props.indeterminate" primary hide-details @click.native="toggleSelectAll"></v-checkbox>
            </th>
            <template v-for="header in props.headers">
              <th v-if="header.sortable" :key="header.text" :class="['column sortable', pagination.descending ? 'desc' : 'asc', header.value === pagination.sortBy ? 'active' : '', `text-xs-${header.align || 'left'}`]" @click="changeSort(header.value)">
                <v-icon small>arrow_upward</v-icon>
                {{ header.text }}
              </th>
              <th v-else :key="header.text" :class="`text-xs-${header.align || 'left'}`">
                {{ header.text }}
              </th>
            </template>
          </tr>
        </slot>
      </template>

      <template slot="items" slot-scope="props">
        <tr v-if="props.index == 0" class="drop-row inactive" :style="nodeHidden(props.item)" @dragenter.stop.prevent="dragEnterSlot($event)" @dragleave.stop.prevent="dragLeaveSlot($event)" @drop.stop.prevent="dropRow($event)" @dragover.stop="dragOverSlot($event)">
          <td :colspan="computedHeaders.length + (selectAll ? 1 : 0)"></td>
        </tr>

        <tr v-if="props.item.leaf" class="leaf" :active="props.selected" @dblclick="(e)=>{$emit('dblclick', e, props.item)}" @contextmenu.prevent="(e)=>{$emit('contextmenu', e, props.item)}" :key="props.item.id" :id="props.item.id" :style="nodeHidden(props.item)" @dragenter.stop.prevent="dragEnterLeaf($event)" @dragleave.stop.prevent="dragLeaveLeaf($event)" @drop.stop.prevent="dropRow($event)" @dragover.stop="dragOverLeaf($event)">
          <td v-if="selectAll">
            <v-checkbox @click="props.selected = !props.selected" :input-value="props.selected" primary hide-details></v-checkbox>
          </td>
          <td class="px-1" style="width: 0.1%">
            <v-btn style="cursor: move" icon class="sort-handle" @dragstart.stop="dragStart($event)" @dragend.stop.prevent="dragEnd" draggable>
              <v-icon>drag_handle</v-icon>
            </v-btn>
          </td>
          <td v-if="props.item.leaf" class="expandable-node" style="width: 0.1%" :style="nodeStyle(props.item)">
            <v-icon>keyboard_arrow_right</v-icon>
          </td>
          <td v-else class="expandable-node" @click="toggleNode(props.item)" style="width: 0.1%" :style="nodeStyle(props.item)">
            <v-icon>{{expandableIcon(props.item)}}</v-icon>
          </td>
          <slot name="row" v-bind="props"></slot>
        </tr>

        <tr v-if="!props.item.leaf" class="folder" :active="props.selected" @dblclick="(e)=>{$emit('dblclick', e, props.item)}" @contextmenu.prevent="(e)=>{$emit('contextmenu', e, props.item)}" :key="props.item.id" :id="props.item.id" :style="nodeHidden(props.item)" @dragenter.stop.prevent="dragEnterFolder($event)" @dragleave.stop.prevent="dragLeaveFolder($event)" @drop.stop.prevent="dropRow($event)" @dragover.stop="dragOverFolder($event)">
          <td v-if="selectAll">
            <v-checkbox @click="props.selected = !props.selected" :input-value="props.selected" primary hide-details></v-checkbox>
          </td>
          <td class="px-1" style="width: 0.1%">
            <v-btn style="cursor: move" icon class="sort-handle" @dragstart.stop="dragStart($event)" @dragend.stop.prevent="dragEnd" draggable>
              <v-icon>drag_handle</v-icon>
            </v-btn>
          </td>
          <td v-if="props.item.leaf" class="expandable-node" style="width: 0.1%" :style="nodeStyle(props.item)">
            <v-icon>keyboard_arrow_right</v-icon>
          </td>
          <td v-else class="expandable-node" @click="toggleNode(props.item)" style="width: 0.1%" :style="nodeStyle(props.item)">
            <v-icon>{{expandableIcon(props.item)}}</v-icon>
          </td>
          <slot name="row" v-bind="props"></slot>
        </tr>

        <tr class="drop-row inactive" :style="nodeHidden(props.item)" @dragenter.stop.prevent="dragEnterSlot($event)" @dragleave.stop.prevent="dragLeaveSlot($event)" @drop.stop.prevent="dropRow($event)" @dragover.stop="dragOverSlot($event)">
          <td :colspan="computedHeaders.length + (selectAll ? 1 : 0)"></td>
        </tr>
      </template>
    </v-data-table>
  </div>
</template>

<script>
import nodeHelper from "./nodeHelper.js";

export default {
  props: {
    headers: {
      type: Array,
      default: [],
      required: true
    },
    items: {
      type: Array,
      default: [],
      required: true
    },
    pagination: {
      type: Object,
      required: true
    },
    totalItems: {
      type: Number,
      required: true
    },
    loading: {
      type: Boolean,
      required: true
    },
    rowsPerPageItems: {
      type: Array,
      default: () => {
        return [
          5,
          10,
          25,
          { text: "$vuetify.dataIterator.rowsPerPageAll", value: -1 }
        ];
      }
    },
    rowsPerPageText: {
      type: String,
      default: `$vuetify.dataTable.rowsPerPageText`
    },
    selectAll: {
      type: [Boolean, String],
      default: undefined
    },
    value: {
      type: Array,
      default: undefined
    },
    validDrop: {
      type: Function,
      default: undefined
    }
  },

  mounted: function() {
    this.setupDragGhosts();
  },

  data: function() {
    return {
      internalPagination: {},
      flattenedNodes: [],

      overFolder: null,
      draggedNode: null,
      newParentNode: null,
      selected: []
    };
  },

  watch: {
    internalPagination() {
      // when pagination is changed emit a load
      this.$emit("load", this.internalPagination);
    },
    items() {
      this.flattenNodes();
    },
    value() {
      this.selected = this.value;
    },
    selected() {
      this.$emit("input", this.selected);
    }
  },

  computed: {
    computedHeaders() {
      let headers = this.headers;

      headers.unshift({
        text: "",
        value: "expanded",
        sortable: false
      });

      headers.unshift({
        text: " ",
        value: "sortable",
        sortable: false
      });

      return headers;
    }
  },

  methods: {
    /**
     * Fired when select all is toggled
     */
    toggleSelectAll() {
      if (this.selected.length > 0) {
        this.selected = [];
      } else {
        this.selected = this.items;
      }
    },
    /*
    Setup drag ghost images
    */
    setupDragGhosts: function() {
      this.folderClosedDragGhost = new Image();
      this.folderClosedDragGhost.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfiCAEBCADWj9yyAAAAu0lEQVQ4y+2SoQ6CUBSGv3txXDdnkKQ0M0W5L+BD2Ay+h02fwDcw2Y0m5wsAyWKy0WgGYICFWZQBwY3g/7d//3d2znagcxJzRlxwLWG+syKPgrQK6AWAXrPBpiizTOzZuvhfAQO04sQUE1W6LxYT6V8/y5oQAXrInXHd7sVTLL0zyMbHDjhoswUAgGoL8Ad+B+Si+W+DBBmTNapnxGBAmNkRDoqYpNIpD3aeB2KGwxFtYdbMT7xoxY0O6gWXGzUrgZScUAAAAABJRU5ErkJggg==";
      this.folderClosedDragGhost.height = "24";
      this.folderClosedDragGhost.width = "24";

      this.folderOpenDragGhost = new Image();
      this.folderOpenDragGhost.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfiCAEBDiyyDRfXAAAAe0lEQVQ4y2NgGPqAkYGBgcHYm2ElAzdC8H/DuUZcGpgZGBgYpC4gK2dgYHSQZHx+AJ8N/4lwy1eGiLNbGBiYYK4gqIGLYQ0DAwMDC8yms4z41Rv/Z2BnYEDYQDQY1TA4NEBi+gcDO8H09J/hJ8KGUIZvBI3+xhDKMEwAADaQFZcd2zJpAAAAAElFTkSuQmCC";
      this.folderOpenDragGhost.height = "24";
      this.folderOpenDragGhost.width = "24";

      this.leafDragGhost = new Image();
      this.leafDragGhost.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAQAAABKfvVzAAAAAmJLR0QA/4ePzL8AAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfiCAEBCCN06K3AAAAAZElEQVQ4y+3TsQmAUAxF0avD/EYEzRvBLSzEHdSRFK0dMPaC8INgZcpwTxMI/AMVAE2E2Gp7gFiSy20LkFZxYl8Q1XK5Hfd9+Sg6gOLMvdUkl1ufm8+xfAnlSqEcwAaN/0+9mwuzISU1axeSPQAAAABJRU5ErkJggg==";
      this.leafDragGhost.height = "24";
      this.leafDragGhost.width = "24";
    },

    /**
     * dragStart handler
     * @param {Event} event Browser Event
     */
    dragStart(event) {
      const draggedNodeId = $(event.target)
        .closest("tr")
        .attr("id");

      this.draggedNode = this.flattenedNodes.filter(_node => {
        return _node.id == draggedNodeId;
      })[0];

      if (this.draggedNode.leaf) {
        event.dataTransfer.setDragImage(this.leafDragGhost, -24, -24);
      } else if (this.draggedNode.expanded) {
        event.dataTransfer.setDragImage(this.folderOpenDragGhost, -24, -24);
      } else {
        event.dataTransfer.setDragImage(this.folderClosedDragGhost, -24, -24);
      }
    },

    /**
     * dragEnd handler, clears all active rows
     */
    dragEnd() {
      this.clearActive();
    },

    /*
    * Slots
    */

    /**
     * dragEnter handler for a slot
     * @param {Event} event Browser Event
     */
    dragEnterSlot(event) {
      const vm = this;
      const $target = $(event.target);

      this.clearActive();

      if (
        ($target.parents(".drop-row").length > 0 ||
          $target.hasClass(".drop-row")) &&
        this.draggedNode
      ) {
        let validDrop = true;

        if (this.draggedNode && vm.validDrop) {
          validDrop = vm.validDrop(
            this.draggedNode,
            $target.parents(".drop-row"),
            event
          );
        }

        if (
          validDrop &&
          parseInt(
            $target
              .parents(".drop-row")
              .prev()
              .attr("id")
          ) != this.draggedNode.id &&
          parseInt(
            $target
              .parents(".drop-row")
              .next()
              .attr("id")
          ) != this.draggedNode.id
        ) {
          $target.parents(".drop-row").removeClass("inactive");
          $target.parents(".drop-row").addClass("active");
        }
      }
    },

    /**
     * dragLeave event handler for a slot
     * @param {Event} event Browser Event
     */
    dragLeaveSlot(event) {
      $(event.target)
        .parents(".drop-row")
        .removeClass("active");
      $(event.target)
        .parents(".drop-row")
        .addClass("inactive");
    },

    /**
     * dragOver event handler for a slot
     * @param {Event} event Browser Event
     */
    dragOverSlot(event) {
      const vm = this;
      const $target = $(event.target);
      let validDrop = true;

      if (this.draggedNode && vm.validDrop) {
        validDrop = vm.validDrop(
          this.draggedNode,
          $target.parents(".drop-row"),
          event
        );
      }

      if (
        validDrop &&
        this.draggedNode &&
        parseInt(
          $target
            .parents(".drop-row")
            .prev()
            .attr("id")
        ) != this.draggedNode.id &&
        parseInt(
          $target
            .parents(".drop-row")
            .next()
            .attr("id")
        ) != this.draggedNode.id
      ) {
        event.preventDefault();
      }
    },

    /*
    * Folders
    */

    /**
     * dragEnter event handler for a folder
     * @param {Event} event Browser Event
     */
    dragEnterFolder(event) {
      const vm = this;
      const $target = $(event.target);

      this.clearActive();

      this.overFolder = $target.parents(".folder")[0];

      let validDrop = true;

      if (this.draggedNode && vm.validDrop) {
        validDrop = vm.validDrop(
          this.draggedNode,
          $target.parents(".folder"),
          event
        );
      }

      if (this.overFolder) {
        if (this.draggedNode && this.draggedNode.parentNode) {
          if (
            validDrop &&
            $target.parents(".folder").attr("id") !=
              this.draggedNode.parentNode.id &&
            $target.parents(".folder").attr("id") != this.draggedNode.id
          ) {
            $target.parents(".folder").addClass("active");
          }
        } else if (
          validDrop &&
          $target.parents(".folder").attr("id") != this.draggedNode.id
        ) {
          $target.parents(".folder").addClass("active");
        }
      }
    },

    /**
     * dragLeave event handler for a folder
     * @param {Event} event Browser Event
     */
    dragLeaveFolder(event) {
      const $target = $(event.relatedTarget);

      if (this.overFolder) {
        if (!$.contains(this.overFolder, $target[0])) {
          $(this.overFolder).removeClass("active");
          this.overFolder = null;
        }
      }
    },

    /**
     * dragOver event handler for a folder
     * @param {Event} event Browser Event
     */
    dragOverFolder(event) {
      const vm = this;
      const $target = $(event.target);
      let validDrop = true;

      if (this.draggedNode && vm.validDrop) {
        validDrop = vm.validDrop(
          this.draggedNode,
          $target.parents(".folder"),
          event
        );
      }

      if (this.draggedNode) {
        if (
          validDrop &&
          this.draggedNode.parentNode &&
          $target.parents(".folder").attr("id") !=
            this.draggedNode.parentNode.id &&
          $target.parents(".folder").attr("id") != this.draggedNode.id
        ) {
          event.preventDefault();
        } else if (
          validDrop &&
          $target.parents(".folder").attr("id") != this.draggedNode.id
        ) {
          event.preventDefault();
        }
      }
    },

    /*
    * Leaves
    */

    /**
     * dragEnter event handler for a leaf
     * @param {Event} event Browser Event
     */
    dragEnterLeaf(event) {
      const vm = this;
      const $target = $(event.target);
      let validDrop = true;

      if ((this.draggedNode, vm.validDrop)) {
        validDrop = vm.validDrop(
          this.draggedNode,
          $target.parents(".leaf"),
          event
        );
      }

      this.clearActive();

      this.overFolder = $target.parents(".leaf")[0];

      if (this.draggedNode) {
        if (
          validDrop &&
          this.draggedNode.parentNode &&
          $target.parents(".leaf").attr("id") !=
            this.draggedNode.parentNode.id &&
          $target.parents(".leaf").attr("id") != this.draggedNode.id
        ) {
          $target.parents(".leaf").addClass("active");
        } else if (
          validDrop &&
          $target.parents(".leaf").attr("id") != this.draggedNode.id
        ) {
          $target.parents(".leaf").addClass("active");
        }
      }
    },

    /**
     * dragLeave event handler for a leaf
     * @param {Event} event Browser Event
     */
    dragLeaveLeaf(event) {
      const $target = $(event.relatedTarget);

      if (this.overFolder) {
        if (!$.contains(this.overFolder, $target[0])) {
          $(this.overFolder).removeClass("active");
          this.overFolder = null;
        }
      }
    },

    /**
     * dragOver event handler for a leaf
     * @param {Event} event Browser Event
     */
    dragOverLeaf(event) {
      const vm = this;
      const $target = $(event.target);
      let validDrop = true;

      if ((this.draggedNode, vm.validDrop)) {
        validDrop = vm.validDrop(
          this.draggedNode,
          $target.parents(".leaf"),
          event
        );
      }

      if (this.draggedNode) {
        if (this.draggedNode.parentNode) {
          if (
            validDrop &&
            $target.parents(".leaf").attr("id") !=
              this.draggedNode.parentNode.id &&
            $target.parents(".leaf").attr("id") != this.draggedNode.id
          ) {
            event.preventDefault();
          }
        } else if (
          validDrop &&
          $target.parents(".leaf").attr("id") != this.draggedNode.id
        ) {
          event.preventDefault();
        }
      }
    },

    /**
     * drop event handler
     * @param {Event} event Browser Event
     */
    dropRow(event) {
      const vm = this;
      const $target = $(event.target);

      if ($target.parents(".folder").length > 0) {
        const parentNodeId = $(event.target)
          .parents(".folder")
          .attr("id");

        this.newParentNode = this.flattenedNodes.filter(_node => {
          return _node.id == parentNodeId;
        })[0];

        $(this.overFolder).removeClass("active");
      } else if ($target.parents(".leaf").length > 0) {
        const parentNodeId = $(event.target)
          .parents(".leaf")
          .attr("id");

        this.newParentNode = this.flattenedNodes.filter(_node => {
          return _node.id == parentNodeId;
        })[0];

        $(this.overFolder).removeClass("active");

        this.collapseChildren(this.draggedNode);

      } else {
        const previousSiblingId = $(event.target)
          .parents(".drop-row")
          .prev()
          .attr("id");
        const nextSiblingId = $(event.target)
          .parents(".drop-row")
          .next()
          .attr("id");

        this.previousSibling = this.flattenedNodes.filter(_node => {
          return _node.id == previousSiblingId;
        })[0];
        this.nextSibling = this.flattenedNodes.filter(_node => {
          return _node.id == nextSiblingId;
        })[0];

        // remove drag classes
        $(event.target)
          .parents(".drop-row")
          .removeClass("active");
        $(event.target)
          .parents(".drop-row")
          .addClass("inactive");
      }

      this.processDrop();
    },

    /**
     * Process the drop event, move node if needed
     */
    processDrop() {
      if (this.draggedNode) {
        const oldParent = this.draggedNode.parentNode;

        if (this.newParentNode) {
          nodeHelper.moveNode(this.draggedNode, this.newParentNode);

          this.overFolder = null;
          this.newParentNode = null;
        } else {
          let currentIndex = this.flattenedNodes.indexOf(this.draggedNode);
          let newIndex = 0;

          this.flattenedNodes.splice(currentIndex, 1);

          if (this.previousSibling) {
            newIndex = this.flattenedNodes.indexOf(this.previousSibling) + 1;

            // If the previous sibilings parent is not the same as the dragged nodes parent then
            // we need to move the dragged node to the parent
            if (
              this.nextSibling &&
              this.nextSibling.parentNode &&
              this.draggedNode.parentNode &&
              this.draggedNode.parentNode.id &&
              this.nextSibling.parentNode.id != this.draggedNode.parentNode.id
            ) {
              nodeHelper.moveNode(
                this.draggedNode,
                this.nextSibling.parentNode
              );
            }

            if (
              this.nextSibling &&
              this.draggedNode.position > this.nextSibling.position
            ) {
              this.draggedNode.position = this.nextSibling.position;
            } else if (this.previousSibling) {
              this.draggedNode.position = this.previousSibling.position;
            } else {
              this.draggedNode.position = 0;
            }
          } else {
            if (this.draggedNode.parentNode) {
              this.draggedNode.parentNode.children.splice(
                this.draggedNode.parentNode.children.indexOf(this.draggedNode),
                1
              );
              this.draggedNode.parentNode = null;
              this.draggedNode.depth = 1;
            }

            this.draggedNode.position = 0;
          }

          this.flattenedNodes.splice(newIndex, 0, this.draggedNode);
        }

        const currentNodes = this.unFlattenNodes();

        this.flattenNodes(this.unFlattenNodes());

        this.$emit(
          "drop",
          this.draggedNode,
          oldParent,
          this.draggedNode.parentNode,
          this.previousSibling,
          this.nextSibling,
          this.unFlattenNodes(),
          () => {
            this.flattenNodes(currentNodes);
          }
        );

        this.draggedNode = null;
      }
    },

    /**
     * Find the node in items
     * @param {String | Number} nodeId The Node
     * @return {Object} the Node
     */
    findNode(nodeId) {
      nodeHelper.findNode(nodeId, this.items);
    },

    /**
     * Get the icon for the node
     * @param {Object} node The Node
     */
    expandableIcon(node) {
      if (node.expanded) {
        return "folder_open";
      } else {
        return "folder";
      }
    },

    /**
     * Get the style padding for the node
     * @param {Object} node The Node
     */
    nodeStyle(node) {
      return {
        paddingLeft: 8 + 12 * node.depth + "px"
      };
    },

    /**
     * Flatten nested nodes
     */
    flattenNodes(nodes) {
      nodes = nodes || this.items;

      this.flattenedNodes = nodeHelper.flattenNodes(nodes);
    },

    /**
     * UnFlatten flattend nodes
     */
    unFlattenNodes() {
      return nodeHelper.unFlattenNodes(this.flattenedNodes);
    },

    /**
     * Determine if a node should be hidden
     * @param {Object} node The Node
     */
    nodeHidden(node) {
      if (!node.parentNode) {
        return null;
      } else if (node.parentNode.expanded) {
        return null;
      } else {
        return "display:none;";
      }
    },

    /**
     * Toggle node from expanded
     * @param {Object} node The Node
     */
    toggleNode(node) {
      this.$set(node, "expanded", !node.expanded);

      if (!node.expanded) this.collapseChildren(node);

      this.$emit("node-toggle", node);
    },

    /**
     * Collapse all nodes children
     * @param {Object} node The Node
     */
    collapseChildren(node) {
      let vm = this;

      this.$set(node, "expanded", false);

      if (node.children) {
        node.children.forEach(child => {
          vm.collapseChildren(child);
        });
      }
    },

    /*
    * Helpers
    */

    /**
     * Clear any active classes
     */
    clearActive() {
      $(this.$el)
        .find(".active")
        .removeClass("active");
    }
  }
};
</script>

<style>
.v-tree-data-table .folder {
  cursor: pointer;
}
.v-tree-data-table .drag * {
  pointer-events: none;
}
.v-tree-data-table .inactive {
  border: none !important;
  height: 5px;
  background-color: transparent !important;
}
.v-tree-data-table .inactive td {
  height: 5px !important;
}
.v-tree-data-table .active {
  background-color: green !important;
}
.v-tree-data-table .active td {
  height: 15px !important;
}
.v-tree-data-table .sort-handle {
  cursor: move;
}
</style>